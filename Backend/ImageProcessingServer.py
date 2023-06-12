#!/usr/bin/env python
# -*- coding: utf-8 -*-
import csv
import sys
import copy
import argparse
import configparser
from collections import Counter
from collections import deque

import cv2 as cv
import numpy as np
import mediapipe as mp

from utils import CvFpsCalc
from model import KeyPointClassifier
from model import PointHistoryClassifier

import imutils
import time
import socket
# Workaround for the dll files
import os
os.add_dll_directory(os.path.dirname(os.path.abspath(__file__)) + "/lib")
from Error import ObException
import StreamProfile
import Pipeline
from Property import *
from ObTypes import *

from utils import depthcameracalcs
from utils import gesturecalcs
import websockets
import asyncio

# DEFAULT INITIALISATIONS
PORT = 7890

MIN_TOUCH_AREA = 2000
MAX_HAND_AREA = 15000
OBJECT_DEPTH =22
RADIUS_LOWER =15
RADIUS_UPPER = 25
BORDER_MARGIN = RADIUS_UPPER*2
OBJECT_MARGIN =0
TOP_CORNER_X =  0
TOP_CORNER_Y = 0
WIDTH = 0
HEIGHT = 0

SFX = 2
SFY = 2
DSP_X = 0
DSP_Y = 0

areas_x = [0, 130, 500, 640]
areas_y = [0, 130, 270, 400]

# constants to monitor touches - read from config file for object
current_directory = os.getcwd()
# Specify the relative path to the config file
# relative_path = '../../Backend/config.ini'
relative_path = './config.ini'
# Join the current directory with the relative path to get the absolute path
config_path = os.path.join(current_directory, relative_path)
print(config_path)
config = configparser.ConfigParser()

config.read(config_path)
try:
    OBJECT_DEPTH = int(config["CIRCLE_DETAILS"]["object_depth"])
    RADIUS_LOWER = int(config["CIRCLE_DETAILS"]["min_radius"])
    RADIUS_UPPER = int(config["CIRCLE_DETAILS"]["max_radius"])
    # this is unavoidable, the camera is not super high quality
    OBJECT_MARGIN = int(config["GENERAL"]["object_margin"])
    DSP_X = float(config["GENERAL"]["disp_x"])
    DSP_Y =float(config["GENERAL"]["disp_y"])
    SFX = float(config["GENERAL"]["sf_x"])
    SFY =float(config["GENERAL"]["sf_y"])
    WIDTH = int(config["GENERAL"]["width"])
    HEIGHT = int(config["GENERAL"]["height"])
    TOP_CORNER_X =  int(config["GENERAL"]["x"])
    TOP_CORNER_Y = int(config["GENERAL"]["y"])
    PORT =int(config["GENERAL"]["port"])
    print("Config File read successfully")
except:
    print("Config File not Found")


pts = []
colours = [(102, 102, 255), (102, 178, 255), (102, 255, 255), 
           (102, 255, 178), (102, 255, 102), (178, 255, 102), 
           (255, 255, 102), (255, 178, 102), (255, 102, 102), 
           (255, 102, 178), (255, 102, 255), (178, 102, 255)]
buffer = 64 

# VISUALISATION FLAGS
VISUALISE_STEPS = True
EVALUATE = False
TEST_CALIBRATION = False

# COORDINATE TRANSFORMATION
def scale_translate(coord):
    global SFX, SFY, DSP_X, DSP_Y
    translated_x = coord[0] * SFX + DSP_X
    translated_y = coord[1] * SFY + DSP_Y
    return (int(translated_x), int(translated_y))


# Server data
print("Server listening on Port " + str(PORT))

# A set of connected WebSocket clients
connected = set()

# Broadcast a message to all connected clients
async def broadcast(message):
    for conn in connected:
        try:
            await conn.send(message)
        except websockets.exceptions.ConnectionClosedOK:
            pass
        except websockets.exceptions.ConnectionClosedError:
            pass

# The main behavior function for this server
async def echo(websocket, path):
    print("A client just connected")
    # Store a copy of the connected client
    connected.add(websocket)
    try:
        async for message in websocket:
            # Send a response to all connected clients except the sender
            for conn in connected:
                if conn != websocket:
                    byte_message = message
                    try:
                        await conn.send(byte_message)
                    except websockets.exceptions.ConnectionClosedOK:
                        pass
    except websockets.exceptions.ConnectionClosed as e:
        print("A client just disconnected")
    except websockets.exceptions.ConnectionClosedOK:
        print("A client connection was closed normally (1000)")
    finally:
        connected.remove(websocket)


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--device", type=int, default=0)

    parser.add_argument('--use_static_image_mode', action='store_true')
    parser.add_argument("--min_detection_confidence",
                        help='min_detection_confidence',
                        type=float,
                        default=0.8)
    parser.add_argument("--min_tracking_confidence",
                        help='min_tracking_confidence',
                        type=int,
                        default=0.8)

    args = parser.parse_args()

    return args

def hands_to_object_details(brect, keypoint_classifier_labels, gesture, effect_on, hand_sign_id,avg_depth, objectDetails):
    transformed_brect = scale_translate((brect[0], brect[1]))
    if (gesture == "Clockwise" and effect_on == False):
        effect_on = True
        objectDetails.append({"id": "h", "obj": "gesture",
                                "action": str(gesture), "x": transformed_brect[0], "y": transformed_brect[1], "x_w":brect[2]*int(SFX), "y_h":brect[3]*int(SFY), "depth": int(avg_depth)})
    elif (gesture == "Anticlockwise" and effect_on == True):
        effect_on = False
        objectDetails.append({"id": "h", "obj": "gesture",
                                "action": str(gesture), "x": transformed_brect[0], "y": transformed_brect[1], "x_w":brect[2]*int(SFX), "y_h":brect[3]*int(SFY),"depth": int(avg_depth)})

    if hand_sign_id != None and abs((brect[2]-brect[0])*(brect[1]-brect[3]))<MAX_HAND_AREA: # send if the hand area is recognised and is small enough(on the plane)
        objectDetails.append({"id": "h", "obj": "sign",
                                "action": keypoint_classifier_labels[hand_sign_id], "x": transformed_brect[0], "y": transformed_brect[1], "x_w":brect[2]*4, "y_h":brect[3]*4,"depth": int(avg_depth)})
    return objectDetails

def obj_to_obj_details(pts_dict, id, centre, objectDetails):
    pts_list = pts_dict['pts']
    if len(pts_list):
        if (abs(pts_list[-1][0]-centre[0]) > 3 or abs(pts_list[-1][1]-centre[1]) > 3):
            collision_centre = scale_translate(centre)
            objectDetails.append({"id": str(id), "obj": "circle",
                                "action": "move", "pos_x": collision_centre[0] , "pos_y": collision_centre[1] })
        else:
            collision_centre = scale_translate(pts_list[-1])
            objectDetails.append({"id": str(id), "obj": "circle", "action": "stationary", "pos_x": collision_centre[0] , "pos_y": collision_centre[1] })
    else:
        collision_centre = scale_translate(centre)
        objectDetails.append({"id": str(id), "obj": "circle",
                            "action": "move", "pos_x": collision_centre[0] , "pos_y": collision_centre[1] })
    return objectDetails


def main():
    # Argument parsing #################################################################
    args = get_args()   

    use_static_image_mode = args.use_static_image_mode
    min_detection_confidence = args.min_detection_confidence
    min_tracking_confidence = args.min_tracking_confidence

    use_brect = True
    # Camera preparation ###############################################################
    pipe = Pipeline.Pipeline(None, None)
    # Configure which streams to enable or disable for the Pipeline by creating a Config
    config = Pipeline.Config()
    try:
        # Get all stream configurations of a color camera, including stream resolution, frame rate, and frame format
        profiles = pipe.getStreamProfileList(OB_PY_SENSOR_COLOR)
        videoProfile = None
        try:
            # Find the corresponding Profile according to the specified format, the RGB888 format is preferred
            videoProfile = profiles.getVideoStreamProfile(
                640, 0, OB_PY_FORMAT_RGB888, 30)
        except ObException as e:
            print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" % (
                e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
            # Alternative if it does not exist
            videoProfile = profiles.getVideoStreamProfile(
                640, 0, OB_PY_FORMAT_UNKNOWN, 30)
        colorProfile = videoProfile.toConcreteStreamProfile(OB_PY_STREAM_VIDEO)
        config.enableStream(colorProfile)
    except ObException as e:
        print("Current device does not support color sensor!")
        sys.exit()
    try:
        # Get all stream configurations of the depth camera, including stream resolution, frame rate, and frame format
        profiles = pipe.getStreamProfileList(OB_PY_SENSOR_DEPTH)
        videoProfile = None
        try:
            # Find the corresponding Profile according to the specified format(Y16 format is preferred)
            videoProfile = profiles.getVideoStreamProfile(
                640, 0, OB_PY_FORMAT_Y12, 30)
        except ObException as e:
            print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" % (
                e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
            # If Y16 format is not found, the format does not match and the corresponding Profile is searched for open stream
            videoProfile = profiles.getVideoStreamProfile(
                640, 0, OB_PY_FORMAT_UNKNOWN, 30)
        depthProfile = videoProfile.toConcreteStreamProfile(OB_PY_STREAM_VIDEO)
        windowsWidth = depthProfile.width()
        windowsHeight = depthProfile.height()
        config.enableStream(depthProfile)
    except ObException as e:
        print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" % (
            e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
        print("Current device is not support depth sensor!")
        sys.exit()

    # Start the flow configured in Config, if no parameters are passed, the default configuration startup flow will be started
    pipe.start(config, None)


    # Get whether the mirror attribute has writable permission
    if pipe.getDevice().isPropertySupported(OB_PY_PROP_DEPTH_MIRROR_BOOL, OB_PY_PERMISSION_WRITE):
        # set mirror
        pipe.getDevice().setBoolProperty(OB_PY_PROP_DEPTH_MIRROR_BOOL, True)
    
    # cap = cv.VideoCapture(0)

    print("camera ok")
    # Model load #############################################################
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=use_static_image_mode,
        max_num_hands=2,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )
    keypoint_classifier = KeyPointClassifier()
    point_history_classifier = PointHistoryClassifier()
    # Read labels ###########################################################
    with open('model/keypoint_classifier/keypoint_classifier_label.csv',
              encoding='utf-8-sig') as f:
        keypoint_classifier_labels = csv.reader(f)
        keypoint_classifier_labels = [
            row[0] for row in keypoint_classifier_labels
        ]
    with open(
            'model/point_history_classifier/point_history_classifier_label.csv',
            encoding='utf-8-sig') as f:
        point_history_classifier_labels = csv.reader(f)
        point_history_classifier_labels = [
            row[0] for row in point_history_classifier_labels
        ]
    # FPS Measurement ########################################################
    cvFpsCalc = CvFpsCalc(buffer_len=10)

    # Coordinate history #####################################################
    history_length = 16
    point_history = deque(maxlen=history_length)

    # Finger gesture history ################################################
    finger_gesture_history = deque(maxlen=history_length)
    effect_on = False
    #  ########################################################################
    mode = 0
    # Perform Background Setup #################################################
    currentTime = time.time()
    frameSet = None   
    while frameSet == None:
        frameSet = pipe.waitForFrames(100)
    # render depth frame
    depthFrame = frameSet.depthFrame()
    if depthFrame != None:
        size = depthFrame.dataSize()
        data = depthFrame.data()
        if size != 0:
            bg, maxDepth = depthcameracalcs.calibrate_background(
                data, windowsHeight, windowsWidth)

    print("INITIALISED")
    
    # Main loop ################################################################
    while True:
        # quantify how long the script takes
        if EVALUATE:
            start_time = time.time()
        objectDetails = []
        fps = cvFpsCalc.get()

        # Process Key (ESC: end) #################################################
        key = cv.waitKey(10)
        if key == 27:  # ESC
            break
        number, mode = gesturecalcs.select_mode(key, mode)

        # Camera capture #####################################################

        frameSet = pipe.waitForFrames(100)
           
        if frameSet == None or frameSet.colorFrame() == None or frameSet.depthFrame() == None:
            continue
        else:
            depthFrame = frameSet.depthFrame()
            size = depthFrame.dataSize()
            data = depthFrame.data()
            # reformat data
            data.resize((windowsHeight, windowsWidth, 2))
            # data = np.flip(data, 1)
            ## exclusive to this setup
            data = np.flip(data, 0)
            newData = data[:, :, 0]+data[:, :, 1]*256
            filteredData = bg - newData
            filteredData[filteredData > maxDepth] = 0
            filteredDataRender = filteredData.astype(np.uint8)
            
            depth_debug_image = copy.deepcopy(filteredDataRender)
            depth_debug_image = cv.cvtColor(depth_debug_image, cv.COLOR_GRAY2RGB)
            # Colour Frame hands #####################################################################
            colorFrame = frameSet.colorFrame()
            colorSize = colorFrame.dataSize()
            colorData = colorFrame.data()
            colorWidth = colorFrame.width()
            colorHeight = colorFrame.height()
            if colorSize != 0:
                colorData.resize((colorHeight, colorWidth, 3))
                colorData = cv.resize(colorData, (320, 240))
                image = colorData # The data is already in RGB format
                ## EXCLUSIVE TO THIS SETUP (for viewing)
                image = cv.flip(image, 1)
                image = cv.flip(image, 0)
                image.flags.writeable = False
            debug_image = copy.deepcopy(image)

            # Detection implementation #############################################################
            image.flags.writeable = False
            results = hands.process(image)
            image.flags.writeable = True
            #  ####################################################################
            if results.multi_hand_landmarks is not None:
                for hand_landmarks, handedness in zip(results.multi_hand_landmarks,
                                                    results.multi_handedness):
                    # Bounding box calculation
                    brect = gesturecalcs.calc_bounding_rect(debug_image, hand_landmarks)
                    # Landmark calculation
                    landmark_list = gesturecalcs.calc_landmark_list(debug_image, hand_landmarks)

                    # Conversion to relative coordinates / normalized coordinates
                    pre_processed_landmark_list = gesturecalcs.pre_process_landmark(
                        landmark_list)
                    pre_processed_point_history_list = gesturecalcs.pre_process_point_history(
                        debug_image, point_history)

                    # Hand sign classification
                    hand_sign_id = keypoint_classifier(pre_processed_landmark_list)
                    if hand_sign_id == 2:  # Point gesture
                        point_history.append(landmark_list[8])
                    else:
                        point_history.append([0, 0])

                    # Finger gesture classification
                    finger_gesture_id = 0
                    point_history_len = len(pre_processed_point_history_list)
                    if point_history_len == (history_length * 2):
                        finger_gesture_id = point_history_classifier(
                            pre_processed_point_history_list)
                    fingertip_landmarks = [8,12]
                    avg_depth = 0
                    for landmark in fingertip_landmarks:
                        pt = [landmark_list[landmark][0]*2, (landmark_list[landmark][1]-20)*2]
                        pt[1] = max(0, min(pt[1], 399))
                        pt[0] = max(0, min(pt[0], 639))
                        val = filteredData[pt[1],pt[0]]
                        avg_depth += val
                    avg_depth/=len(fingertip_landmarks)

                    finger_gesture_history.append(finger_gesture_id)
                    most_common_fg_id = Counter(
                        finger_gesture_history).most_common()
                    gesture = point_history_classifier_labels[most_common_fg_id[0][0]]
                    translated_landmarks = [[x * 2 + 5 , y * 2 - 40] for x, y in landmark_list]
                    objectDetails = hands_to_object_details(brect, keypoint_classifier_labels, gesture,effect_on, hand_sign_id, avg_depth,objectDetails)
                    if VISUALISE_STEPS:
                        debug_image = gesturecalcs.draw_bounding_rect(use_brect, debug_image, brect)
                        debug_image = gesturecalcs.draw_landmarks(debug_image, landmark_list)
                        debug_image = gesturecalcs.draw_info_text(
                            debug_image,
                            brect,
                            handedness,
                            keypoint_classifier_labels[hand_sign_id],
                            gesture,
                        )  
                        depth_debug_image = gesturecalcs.draw_landmarks(depth_debug_image, translated_landmarks)
                        depth_debug_image = gesturecalcs.draw_info_text(
                            depth_debug_image,
                            brect,
                            handedness,
                            keypoint_classifier_labels[hand_sign_id],
                            gesture,
                        )  
            else:
                point_history.append([0, 0])

            if VISUALISE_STEPS:
                translated_point_history = [[x * 2 + 5 , y * 2 - 40] for x, y in point_history]
                depth_debug_image = gesturecalcs.draw_point_history(depth_debug_image, translated_point_history)
            # Depth Objects Recognition ###########################################################
            if depthFrame != None and depthFrame.dataSize()!=0:
                if TEST_CALIBRATION:
                    AreaVisRGB = np.zeros_like(filteredDataRender, dtype=np.uint8)
                    AreaVisRGB = cv.cvtColor(AreaVisRGB, cv.COLOR_GRAY2RGB)
                if VISUALISE_STEPS:
                    touchVisRGB = np.zeros_like(filteredDataRender, dtype=np.uint8)
                    touchVisRGB = cv.cvtColor(touchVisRGB, cv.COLOR_GRAY2RGB)

                # obtain the filtered circles(on the first level)
                blurredCircles = cv.GaussianBlur(filteredData, (7, 7), 0)
                thresholdCircles = cv.inRange(
                    blurredCircles, OBJECT_DEPTH-OBJECT_MARGIN, OBJECT_DEPTH+OBJECT_MARGIN)
                # perform dilations and erosions to remove small blobs left in the mask
                maskCircles = cv.erode(
                    thresholdCircles, None, iterations=2)
                
                # find contours in the mask and initialize the current
                # (x, y) centre of the ball
                contoursObject = cv.findContours(maskCircles.copy(), cv.RETR_EXTERNAL,
                    cv.CHAIN_APPROX_SIMPLE)
                contoursObject = imutils.grab_contours(contoursObject)
                contours = []

                # remove contours that are the wrong size
                for i in range(len(contoursObject)-1, -1, -1):
                    ((x, y), radius) = cv.minEnclosingCircle(
                        contoursObject[i])
                    if radius < RADIUS_LOWER or radius > RADIUS_UPPER or x < TOP_CORNER_X-BORDER_MARGIN or x > TOP_CORNER_X+ WIDTH+BORDER_MARGIN or y< TOP_CORNER_Y-BORDER_MARGIN or y>TOP_CORNER_Y+HEIGHT+BORDER_MARGIN:
                        del contoursObject[i]
                    else:
                        M = cv.moments(contoursObject[i])
                        try:
                            centre = (int(M["m10"] / M["m00"]),
                                    int(M["m01"] / M["m00"]))
                        except ZeroDivisionError:
                            centre = (0, 0)
                        cv.circle(depth_debug_image, centre, 5, (0, 0, 255), -1)
                        contours.append([int(radius), centre])
                existing_contours = [(item["id"], item["pts"][-1]) for i,item in enumerate(pts) if len(item["pts"])>0]
                centres = [sublist[1] for sublist in contours if sublist]
                (pairs, unmatched_existing, unmatched_new) = depthcameracalcs.find_closest_pairs(
                    existing_contours, centres)
                
                # Match existing pairs
                for pair in pairs:
                    id = pair[0]
                    centre = centres[pair[1]]
                    label = "Circle {}".format(id)
                    pts_dict = next(item for item in pts if item['id'] == id)
                    pts_list = pts_dict['pts']
                    
                    # if the distance is sufficiently different, it has moved
                    if len(pts_list) and (abs(pts_list[-1][0]-centre[0]) > 3 or abs(pts_list[-1][1]-centre[1]) > 3):
                        collision_centre = scale_translate(centre)
                        if TEST_CALIBRATION:
                            cv.circle(AreaVisRGB, collision_centre, 30,
                                    colours[id%12], 2)
                        objectDetails.append({"id": str(id), "obj": "circle",
                                            "action": "move", "pos_x": collision_centre[0] , "pos_y": collision_centre[1] })
                    elif len(pts_list):
                        collision_centre = scale_translate(pts_list[-1])
                        if TEST_CALIBRATION:
                            cv.circle(AreaVisRGB, collision_centre,30,
                                    colours[id%12], 2)
                        objectDetails.append({"id": str(id), "obj": "circle", "action": "stationary", "pos_x": collision_centre[0] , "pos_y": collision_centre[1] })
                    pts_list.appendleft(centre)
                    if VISUALISE_STEPS:
                        cv.circle(depth_debug_image, centre, 20,
                                    colours[id%12], -1)
                        cv.circle(touchVisRGB, centre, 30,
                                    colours[id%12], -1)
                        cv.putText(depth_debug_image, label, centre,
                            cv.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                        
                # remove objects that no longer exist
                for item in pts:
                    id = item['id']
                    pts_list = item['pts']
                    if id not in [pair[0] for pair in pairs]:
                        pts_list.clear()

                # add new objects to the deque
                for unmatched in unmatched_new:
                    centre = centres[unmatched]
                    deque_available = False
                    for existing_pts in pts:
                        if len(existing_pts['pts']) == 0:
                            id = existing_pts['id']
                            pts_list = existing_pts['pts']
                            pts_list.appendleft(centre)
                            deque_available = True
                            break
                    # if all of the points list are in use, add new one
                    if not deque_available:
                        id = len(pts)
                        new_pts = {'id': id, 'pts': deque(maxlen=buffer)}
                        new_pts['pts'].appendleft(centre)
                        pts.append(new_pts)
                    label = "Circle {}".format(id)
                    if (id >= 0):
                        pts_dict = next(item for item in pts if item['id'] == id)
                        objectDetails = obj_to_obj_details(pts_dict,id,  centre, objectDetails)
                        if VISUALISE_STEPS:
                            cv.circle(depth_debug_image, centre, 20,
                                        colours[id%12], 2)
                            cv.circle(touchVisRGB, centre,30,
                                        colours[id%12], -1)
                            cv.putText(depth_debug_image, label, centre,
                                cv.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                if VISUALISE_STEPS:
                    cv.imshow("object tracking", depth_debug_image)

                # Touch Tracker #####################################################################
                thresholdCircles = cv.GaussianBlur(thresholdCircles, (7,7), 0)
                # Invert the thresholded circles mask
                thresholdCircles_inv = cv.bitwise_not(thresholdCircles)
                interactions= cv.bitwise_and(filteredData, filteredData, mask=thresholdCircles_inv)
                blurred = cv.GaussianBlur(interactions, (7,7), 0)
                mask = cv.erode(blurred, None, iterations=2)
                mask = cv.dilate(mask, None, iterations=2)
                # get all things above a level
                # _, binary = cv.threshold(mask, OBJECT_DEPTH*2.5,OBJECT_DEPTH*2.5, cv.THRESH_BINARY)
                # get all things in range
                binary = cv.inRange(mask, OBJECT_MARGIN, OBJECT_DEPTH*2.1)
                # Detect contours in binarised image
                binary = cv.convertScaleAbs(binary)
                contoursTouch, _ = cv.findContours(binary, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
                contour_img = np.zeros_like(binary)  # Create a black image of same size as mask
                contour_img = cv.cvtColor(contour_img, cv.COLOR_GRAY2RGB)
            
                for contourO in contours:
                    # Create a binary mask from contour1
                    maskO = np.zeros_like(contour_img, dtype=np.uint8)
                    cv.circle(maskO, contourO[1], contourO[0], (0, 255, 0), -1)
                    for contourT in contoursTouch:
                        on_boundary = False
                        # Iterate through each point in the contour
                        for i in range(len(contourT)):
                            x = contourT[i][0][0]
                            # Check if x-coordinate is outside the threshold
                            if x < 60:
                                on_boundary = True
                                # Increase the x-coordinate
                                contourT[i][0][0] = x- 50   
                        
                        area = cv.contourArea(contourT)
                        if area > MIN_TOUCH_AREA or on_boundary:
                            if VISUALISE_STEPS:
                                cv.drawContours(touchVisRGB, [contourT], 0, (0, 255, 0), -1)
                            # Create a binary mask from contour2
                            maskT = np.zeros_like(contour_img, dtype=np.uint8)
                            cv.drawContours(maskT, [contourT], 0, (0, 255, 0), -1)
                            # Extract the pixels within the contour from the original image 
                            intersection = cv.bitwise_and(maskO, maskT)
                            # Convert the intersection result to grayscale
                            intersection_gray = cv.cvtColor(intersection, cv.COLOR_BGR2GRAY)
                            # Check if the intersection is non-empty (i.e., if any pixels are common between the two contours)
                            if cv.countNonZero(intersection_gray) > 0:
                                objectDetails = depthcameracalcs.assign_action(contourO, pts, objectDetails)
                
                if VISUALISE_STEPS:
                    touchVisRGB = cv.copyMakeBorder(touchVisRGB, top=0, bottom=10, left=0, right=80, borderType=cv.BORDER_CONSTANT, value=(0, 0, 0))
                    cv.imshow("Touch Detector", touchVisRGB)
                
                if TEST_CALIBRATION:
                    for x in areas_x:
                        start_point = (x, 0)
                        end_point = (x, AreaVisRGB.shape[0])
                        color = (0, 255, 0)  
                        cv.line(AreaVisRGB, start_point, end_point, color, 2)
                    for y in areas_y:
                        start_point = (0, y)
                        end_point = ( AreaVisRGB.shape[1],y)
                        color = (0, 255, 0)  
                        cv.line(AreaVisRGB, start_point, end_point, color, 2)
                    cv.imshow("Area Detector", AreaVisRGB)

                if EVALUATE:
                    end_time = time.time()
                    iteration_time = end_time - start_time
                    print(f"Iteration Time: {iteration_time} seconds")

                data_to_send = bytes(str(objectDetails), encoding="utf-8")
                asyncio.get_event_loop().run_until_complete(broadcast(data_to_send))
    pipe.stop()
    cv.destroyAllWindows()


if __name__ == '__main__':
    # Start the server
    start_server = websockets.serve(echo, "localhost", PORT)
    asyncio.get_event_loop().run_until_complete(start_server)
    
    # Start the synchronous algorithm to continuously process and send data
    main()
    try:
        # Run the event loop indefinitely
        asyncio.get_event_loop().run_forever()
    except:
        pass