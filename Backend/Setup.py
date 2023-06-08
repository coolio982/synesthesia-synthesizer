# Workaround for the dll files
import os
os.add_dll_directory(os.path.dirname(os.path.abspath(__file__)) + "/lib")

from Helpers import *
from pythonosc import udp_client
import configparser
import time
import sys
import numpy as np
import imutils
import cv2
from Error import ObException
import StreamProfile
import Pipeline
import datetime
from SynthSoundMappings import SimpleWave
from Property import *
from ObTypes import *



np.set_printoptions(threshold=sys.maxsize)
q = 113
ESC = 27

# ======= OSC UDP Parameters =======
ipAddress = '127.0.0.1'
port = 8888
header = "/orbbec"
# Create an OSC client
client = udp_client.SimpleUDPClient(ipAddress, port)


params = cv2.SimpleBlobDetector_Params()
params.filterByColor = False
params.filterByCircularity = False
params.filterByInertia = False
params.filterByConvexity = False

params.filterByArea = True
params.minArea = 50  # define min area
params.maxArea = 1000  # define max area
ver = (cv2.__version__).split('.')

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
except:
    print("Config File not Found")
sys.stdout.flush()
MIN_DIST = 10000
MIN_TOUCH_AREA = 1050
# # Restore stdout and stderr to their original values
# sys.stdout = sys.__stdout__
# sys.stderr = sys.__stderr__
print("hello")
sys.stdout.flush()
# flag to display testing views
VISUALISE_STEPS = False

# stores centre of objects as {id:_id, pts:[]}
pts = []
buffer = 64  # buffer of where the object has been
# Callback function for mouse events

wasPlaying = False
def mouse_callback(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print('Left button down: x={}, y={}'.format(x, y))
        pixel_value = data[y, x]
        distance = pixel_value[0]+pixel_value[1]*256
        difference = filteredData[y, x]
        print(f'Pixel value at ({x}, {y}): {pixel_value}')
        print(f'Distance  at ({x}, {y}): {distance} mm')
        print(f'Difference at ({x}, {y}): {difference} mm')
    elif event == cv2.EVENT_RBUTTONDOWN:
        print('Right button down: x={}, y={}'.format(x, y))


def calibrate_background(data, height, width):
    # Resize frame data to (height,width,2)
    data.resize((height, width, 2))
    # mirror image
    data = np.flip(data, 1)
    # Convert frame for processing
    newData = data[:, :, 0]+data[:, :, 1]*256
    maxDepth = np.max(newData)
    # save this as the initialised background depth
    # current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    # filename = f"bg_{current_date}.npy"
    # np.save(filename, bg)
    return newData, maxDepth
def process_matched_pairs(pairs, centres, pts, maskDataRGB, objectDetails):
    for pair in pairs:
        id = pair[0]
        centre = centres[pair[1]]
        label = "Circle {}".format(id)
        pts_dict = next(item for item in pts if item['id'] == id)
        pts_list = pts_dict['pts']
        # if the distance is sufficiently different, it has moved
        if len(pts_list) and (abs(pts_list[-1][0]-centre[0]) > 3 or abs(pts_list[-1][1]-centre[1]) > 3):
            objectDetails.append({"id": str(id), "obj": "circle"+str(id),
                                "action": "move", "pos_x": centre[0], "pos_y": centre[1]})
        elif len(pts_list):
            objectDetails.append({"id": str(id), "obj": "circle"+str(
                id), "action": "stationary", "pos_x": pts_list[-1][0], "pos_y": pts_list[-1][1]})
        pts_list.appendleft(centre)
        cv2.putText(maskDataRGB, label, centre,
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        return objectDetails

def assign_action(contourO, pts, objectDetails):
    # get the id of the object
    ((x, y), radius) = cv2.minEnclosingCircle(contourO)

    for i in range(len(pts)):
        subdict = pts[i]
        if (subdict["pts"]):
            if (abs(subdict["pts"][0][0]-x)<3) and (abs(subdict["pts"][0][1]-y)<3):
                for item in objectDetails:
                    if (item["id"] == str(subdict["id"])):
                        item["action"] = "touch"
                        break
    return objectDetails

if int(ver[0]) < 3:
    detector = cv2.SimpleBlobDetector(params)
else:
    detector = cv2.SimpleBlobDetector_create(params)

try:
    # Create a Pipeline, which is the entry point of the API, which can be easily opened and closed through the Pipeline
    # Multiple types of streams and get a set of frame data
    pipe = Pipeline.Pipeline(None, None)
    # Configure which streams to enable or disable for the Pipeline by creating a Config
    config = Pipeline.Config()
    currentTime = time.time()
    windowsWidth = 0
    windowsHeight = 0
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
    # calibrate in a blocking manner
    # Wait for a frame of data in a blocking manner. This frame is a composite frame that contains frame data of all streams enabled in the configuration.
    # And set the frame waiting timeout to 100ms
    frameSet = pipe.waitForFrames(100)
    # render depth frame
    depthFrame = frameSet.depthFrame()
    if depthFrame != None:
        size = depthFrame.dataSize()
        data = depthFrame.data()
        if size != 0:
            bg, maxDepth = calibrate_background(
                data, windowsHeight, windowsWidth)
    print("INITIALISED")
    sys.stdout.flush()  
    while True:
        objectDetails = []
        # Wait for a frame of data in a blocking manner. This frame is a composite frame that contains frame data of all streams enabled in the configuration.
        # And set the frame waiting timeout to 100ms
        frameSet = pipe.waitForFrames(100)
        if frameSet == None:
            continue
        else:
            # render depth frame
            depthFrame = frameSet.depthFrame()
            if depthFrame != None:
                size = depthFrame.dataSize()
                data = depthFrame.data()

                if size != 0:
                    # Resize frame data to (height,width,2)
                    data.resize((windowsHeight, windowsWidth, 2))
                    # mirror image
                    data = np.flip(data, 1)
                    # Convert frame for processing
                    newData = data[:, :, 0]+data[:, :, 1]*256
                    # Convert frame for 8 bit display
                    newDataRender = newData.astype(np.uint8)
                    # Convert frame data GRAY to RGB
                    newDataRGB = cv2.cvtColor(
                        newDataRender, cv2.COLOR_GRAY2RGB)
                    if VISUALISE_STEPS:
                        # Choose a colormap (e.g., JET)
                        colormap = cv2.COLORMAP_JET
                        depth_data_colormap = cv2.applyColorMap(
                            newDataRender, colormap)
                        cv2.imshow('Depth Data Color Map', depth_data_colormap)
                        cv2.setMouseCallback(
                            'Depth Data Color Map', mouse_callback)

                    filteredData = bg-newData
                    filteredData[filteredData > maxDepth] = 0

 
                    # Convert frame for 8 bit display
                    filteredDataRender = filteredData.astype(np.uint8)

                    # Convert frame data GRAY to RGB
                    filteredDataRGB = cv2.cvtColor(
                        filteredDataRender, cv2.COLOR_GRAY2RGB)
                    if VISUALISE_STEPS:
                    # create window
                        cv2.namedWindow("Difference Depth Viewer",
                                        cv2.WINDOW_NORMAL)
                        # display image
                        cv2.imshow("Difference Depth Viewer", filteredDataRGB)
                        cv2.setMouseCallback(
                            "Difference Depth Viewer", mouse_callback)

                    # obtain the filtered circles
                    blurredCircles = cv2.GaussianBlur(filteredData, (5, 5), 0)
                    thresholdCircles = cv2.inRange(
                        blurredCircles, OBJECT_DEPTH-OBJECT_MARGIN, OBJECT_DEPTH+OBJECT_MARGIN)
                    count = np.count_nonzero(thresholdCircles)

                    # perform dilations and erosions to remove small blobs left in the mask
                    maskCircles = cv2.erode(
                        thresholdCircles, None, iterations=2)
                    if VISUALISE_STEPS:
                        cv2.imshow(
                            "masked circle tracker erosion", maskCircles)
                    maskCircles = cv2.dilate(maskCircles, None, iterations=2)
                    if VISUALISE_STEPS:
                        cv2.imshow(
                            "masked circle tracker dilation", maskCircles)

                    # find contours in the mask and initialize the current
                    # (x, y) centre of the ball
                    contoursObject = cv2.findContours(maskCircles.copy(), cv2.RETR_EXTERNAL,
                        cv2.CHAIN_APPROX_SIMPLE)
                    contoursObject = imutils.grab_contours(contoursObject)
                    matched_contours_idx = []
                    contours = []
                    MIN_DIST = 20

                    maskDataRGB = cv2.cvtColor(maskCircles, cv2.COLOR_GRAY2RGB)
                    # remove contours that are the wrong size
                    for i in range(len(contoursObject)-1, -1, -1):
                        ((x, y), radius) = cv2.minEnclosingCircle(
                            contoursObject[i])
                        if radius < RADIUS_LOWER:
                            del contoursObject[i]
                        else:
                            M = cv2.moments(contoursObject[i])
                            centre = (int(M["m10"] / M["m00"]),
                                      int(M["m01"] / M["m00"]))
                            # draw the contours we are interested in
                            cv2.circle(maskDataRGB, (int(x), int(y)), int(radius),
                                    (0, 255, 255), 2)
                            cv2.circle(maskDataRGB, centre, 5, (0, 0, 255), -1)
                            contours.append([radius, centre])
                    existing_contours = [(item["id"], item["pts"][-1]) for i,item in enumerate(pts) if len(item["pts"])>0]
                    centres = [sublist[1] for sublist in contours if sublist]
                    (pairs, unmatched_existing, unmatched_new) = find_closest_pairs(
                        existing_contours, centres)
                    for pair in pairs:
                        id = pair[0]
                        centre = centres[pair[1]]
                        label = "Circle {}".format(id)
                        pts_dict = next(item for item in pts if item['id'] == id)
                        pts_list = pts_dict['pts']
                        # if the distance is sufficiently different, it has moved
                        if len(pts_list) and (abs(pts_list[-1][0]-centre[0]) > 3 or abs(pts_list[-1][1]-centre[1]) > 3):
                            objectDetails.append({"id": str(id), "obj": "circle"+str(id),
                                                "action": "move", "pos_x": centre[0], "pos_y": centre[1]})
                        elif len(pts_list):
                            objectDetails.append({"id": str(id), "obj": "circle"+str(
                                id), "action": "stationary", "pos_x": pts_list[-1][0], "pos_y": pts_list[-1][1]})
                        pts_list.appendleft(centre)
                        cv2.putText(maskDataRGB, label, centre,
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    # remove objects that no longer exist
                    for item in pts:
                        id = item['id']
                        pts_list = item['pts']
                        if id not in [pair[0] for pair in pairs]:
                            pts_list.clear()
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
                            pts_list = pts_dict['pts']
                            if len(pts_list):
                                if (abs(pts_list[-1][0]-centre[0]) > 3 or abs(pts_list[-1][1]-centre[1]) > 3):
                                    objectDetails.append({"id": str(id), "obj": "circle"+str(id),
                                                        "action": "move", "pos_x": centre[0], "pos_y": centre[1]})
                                else:
                                    objectDetails.append({"id": str(id), "obj": "circle"+str(
                                        id), "action": "stationary", "pos_x": pts_list[-1][0], "pos_y": pts_list[-1][1]})
                            else:
                                objectDetails.append({"id": str(id), "obj": "circle"+str(id),
                                                    "action": "move", "pos_x": centre[0], "pos_y": centre[1]})
                            cv2.putText(maskDataRGB, label, centre,
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.imshow('object Tracker', maskDataRGB)

                    # Touch Tracker
                    # Invert the thresholded circles mask
                    thresholdCircles_inv = cv2.bitwise_not(thresholdCircles)
                    # Apply the inverted thresholded circles mask to the original image
                    result = cv2.bitwise_and(filteredDataRGB, filteredDataRGB, mask=thresholdCircles_inv)
                    interactions = result
                    blurred = cv2.GaussianBlur(interactions, (5,5), 0)
                    mask = cv2.erode(blurred, None, iterations=2)
                    mask = cv2.dilate(mask, None, iterations=2)
                    if VISUALISE_STEPS:
                        cv2.imshow("touch tracker",mask)
                        cv2.setMouseCallback(
                                'touch tracker', mouse_callback)

                    _, binary = cv2.threshold(mask, OBJECT_MARGIN+1,OBJECT_MARGIN+5, cv2.THRESH_BINARY)
                    binary= cv2.cvtColor(binary, cv2.COLOR_BGR2GRAY)
                    # Detect contours in binarised image
                    binary = cv2.convertScaleAbs(binary)
                    contoursTouch, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    contour_img = np.zeros_like(binary)  # Create a black image of same size as mask
                    contour_img = cv2.cvtColor(contour_img, cv2.COLOR_GRAY2RGB)
                    if VISUALISE_STEPS:
                        for contour in contoursTouch:
                            # Calculate the area of the contour
                            area = cv2.contourArea(contour)
                            # If the contour area is greater than the threshold
                            if area > MIN_TOUCH_AREA:
                                cv2.drawContours(maskDataRGB, [contour], -1, (0, 255, 0), 2)  # Draw contours in green 
                        cv2.imshow("Binary Touch Contours", maskDataRGB)
                    # now calculate whether the contour coincides with another contour(and also if it is far up enough for reset)
                    for contourO in contoursObject:
                            # Create a binary mask from contour1
                        maskO = np.zeros_like(contour_img, dtype=np.uint8)
                        cv2.drawContours(maskO, [contourO], 0, (0, 255, 0), -1)
                        cv2.imshow("hmm", maskO)
                        for contourT in contoursTouch:
                            area = cv2.contourArea(contourT)
                            if area > MIN_TOUCH_AREA:
                                # Create a binary mask from contour2
                                maskT = np.zeros_like(contour_img, dtype=np.uint8)
                              
                                cv2.drawContours(maskT, [contourT], 0, (0, 255, 0), -1)
               

                                # first pass, check if any of them are 
                                # Extract the pixels within the contour from the original image 
                                intersection = cv2.bitwise_and(maskO, maskT)
                                
                                # Convert the intersection result to grayscale
                                intersection_gray = cv2.cvtColor(intersection, cv2.COLOR_BGR2GRAY)
                                # Check if the intersection is non-empty (i.e., if any pixels are common between the two contours)
                                if cv2.countNonZero(intersection_gray) > 0:
                                    objectDetails = assign_action(contourO, pts, objectDetails)
                                cv2.drawContours(maskT, [contourO], 0, (255, 0, 0), -1)
                                cv2.imshow("hmmm", maskT)
                    if (time.time() - currentTime>=0.2):
                        currentTime = time.time()
                        print(objectDetails)
                        sys.stdout.flush()   

                                

                    key = cv2.waitKey(1)
                    # Press ESC or 'q' to close the window
                    if key == ESC or key == q:
                        cv2.destroyAllWindows()
                        break
    pipe.stop()

except ObException as e:
    print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" % (
        e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
