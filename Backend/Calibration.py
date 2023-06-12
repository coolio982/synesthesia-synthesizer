# Workaround for the dll files
import os
os.add_dll_directory(os.path.dirname(os.path.abspath(__file__)) + "/lib")

import sys
import numpy as np
import argparse
import logging
from tkinter import messagebox
import tkinter as tk
import cv2
from Error import ObException
import StreamProfile
import Pipeline
from Property import *
from ObTypes import *

from utils import calibcalc

# Set logging level to errors only
logging.basicConfig(filename='output.log', level=logging.ERROR)
# Disable root logger's default stream handler
logging.getLogger().handlers.clear()
logging.getLogger().addHandler(logging.FileHandler('output.log'))
np.set_printoptions(threshold=sys.maxsize)
q = 113
ESC = 27
ver = (cv2.__version__).split('.')


global pipe
#Flag for seeing images at intermediary steps
VISUALISE_STEPS = True
# Flag to indicate termination condition
terminate_program = False  

colorExist = []
# this is unavoidable, the camera is not super high quality
OBJECT_MARGIN = 5

################################################################
########## Get arguments for initialising the path #############
################################################################
def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=str, default='../Backend/config.ini')
    args = parser.parse_args()

    return args
# constants to monitor touches - read from config file for object
current_directory = os.getcwd()
# Specify the relative path to the config file
relative_path = './config.ini'
config_path = os.path.join(current_directory, relative_path)

################################################################
########## Callback functions for interactive events ###########
################################################################
def position_callback(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print('Left button down: x={}, y={}'.format(x, y))

def filter_area(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        # Get the pixel value at the clicked point
        clicked_value = filteredData[y-40, x]
        # Define the ROI around the clicked point
        PIXEL_RANGE = 50
        roi = filteredData[y-PIXEL_RANGE:y+PIXEL_RANGE, x-PIXEL_RANGE:x+PIXEL_RANGE]
        # Filter the image to keep only pixels within +-5 of the clicked value
        filtered_image = np.where(
            (filteredData >= clicked_value - 2) & (filteredData <= clicked_value + 2), 255, 0)
        # Convert the filtered image to uint8 and convert to RGB
        filtered_image = filtered_image.astype(np.uint8)
        # smooth out the image
        blurred = cv2.GaussianBlur(filtered_image, (5,5), 0)
        # perform dilations and erosions to remove small blobs left in the mask
        mask = cv2.erode(blurred, None, iterations=2)
        mask = cv2.dilate(mask, None, iterations=2)
        # Find contours in the filtered image
        contours, hierarchy = cv2.findContours(
            filtered_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        print(len(contours))
        # Convert the filtered image to RGB
        filtered_image = cv2.cvtColor(filtered_image, cv2.COLOR_GRAY2RGB)
        # Iterate through the contours and check if the clicked point is inside each contour
        for contour in contours:
            if cv2.pointPolygonTest(contour, (x, y-40), False) >= 0:
                # Draw contour around the object
                ((x, y), radius) = cv2.minEnclosingCircle(contour)
                cv2.drawContours(filtered_image, [contour], 0, (255, 0, 0),5)
                M = cv2.moments(contour)
                cX = int(M["m10"] / M["m00"])
                cY = int(M["m01"] / M["m00"])
                cv2.circle(filtered_image, (cX, cY+40), int(radius), (0, 255, 0), 2)
                newDataRender = newColorData.astype(np.uint8)
                cv2.circle(newDataRender, (cX, cY+40), int(radius), (0, 255, 0), 2)
                break
        # Display the filtered image with contours
        cv2.imshow('Visual Contours', newDataRender)
        result = messagebox.askyesno("Instruction", "Was the object correctly detected?")
        root.focus_force() 
        if result:
            calibcalc.write_circle_to_config(config_path, clicked_value, radius)
            global terminate_program
            terminate_program = True
        else:
            cv2.destroyWindow('Visual Contours')


if __name__ == "__main__":
    args = get_args()   
    config_path = args.path
    # Create a Tkinter root window (hidden)
    root = tk.Tk()
    root.withdraw()
    result = None
    try:
        # Create a Pipeline, which is the entry point of the API, which can be easily opened and closed through the Pipeline
        # Multiple types of streams and get a set of frame data
        pipe = Pipeline.Pipeline(None, None)
        # Configure which streams to enable or disable for the Pipeline by creating a Config
        config = Pipeline.Config()

        windowsWidth = 0
        windowsHeight = 0
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
            colorExist.append(True)
        except ObException as e:
            colorExist.append(False)
            result = messagebox.showerror("Error", "Current device does not support color sensor!")
            root.focus_force() 
            print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" %(e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
            print("Current device does not support color sensor!")

        try:
            # Get depth camera stream information
            profiles = pipe.getStreamProfileList(OB_PY_SENSOR_DEPTH)

            videoProfile = None
            try:
                # Y16 format is preferred
                videoProfile = profiles.getVideoStreamProfile(640,0,OB_PY_FORMAT_Y16,30)
            except ObException as e:
                print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" %(e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
                # Alternative if Y16 not found
                videoProfile = profiles.getVideoStreamProfile(640,0,OB_PY_FORMAT_UNKNOWN,30)
            depthProfile = videoProfile.toConcreteStreamProfile(OB_PY_STREAM_VIDEO)
            config.enableStream(depthProfile)
        except ObException as e:
            result = messagebox.showerror("Error", "Current device does not support depth sensor!")
            root.focus_force() 
            print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" %(e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))
            print("Current device does not support depth sensor!")
            sys.exit()

        # Start the flow configured in Config, if no parameters are passed, the default configuration startup flow will be started
        pipe.start(config, None)

        # Get whether the mirror attribute has writable permission
        if pipe.getDevice().isPropertySupported(OB_PY_PROP_DEPTH_MIRROR_BOOL, OB_PY_PERMISSION_WRITE):
            # set mirror
            pipe.getDevice().setBoolProperty(OB_PY_PROP_DEPTH_MIRROR_BOOL, True)
        # Step 1: Get the surface depth - the user needs to clear the surface for this to work
        frameSet = pipe.waitForFrames(100)
        # render colour frame
        colorFrame = None
        while colorFrame == None:
            frameSet = pipe.waitForFrames(100)
            # render colour frame
            colorFrame = frameSet.colorFrame()
        if colorFrame != None:
            size = colorFrame.dataSize()
            calibcalc.show_working_area(colorFrame, size)

        while not result:
            clear = messagebox.askokcancel("Instruction", "Please clear the surface then press OK.")
            if not clear:
                quit()
            colorFrame = None
            while colorFrame == None:
                frameSet = pipe.waitForFrames(100)
                # render colour frame
                colorFrame = frameSet.colorFrame()
            if colorFrame != None:
                size = colorFrame.dataSize()
            calibcalc.show_working_area(colorFrame, size)
            
            result = messagebox.askyesno("Instruction", "Initialising background. Is the current surface clear?")
            root.focus_force()  # Bring the window to front


        cv2.destroyWindow('Working Area')
        # Use the cleared surface as the background, save this as the initial depth.
        if result:
            # Wait for a frame of depth data in a blocking manner. This frame is a composite frame that contains frame data of all streams enabled in the configuration.
            # And set the frame waiting timeout to 100ms
            frameSet = pipe.waitForFrames(100)
            # render depth frame
            depthFrame = None
            while depthFrame == None:
                frameSet = pipe.waitForFrames(100)
                depthFrame = frameSet.depthFrame()
            if depthFrame != None:
                size = depthFrame.dataSize()
                data = depthFrame.data()
                depthWidth = depthFrame.width()
                depthHeight = depthFrame.height()    
                if size != 0:
                    # Resize frame data to (height,width,2)
                    data.resize((depthHeight, depthWidth, 2))
                    # mirror image
                    data = np.flip(data, 1)
                    data = np.flip(data, 0)
                    # Convert frame for processing
                    newData = data[:, :, 0]+data[:, :, 1]*256
                    # Convert frame for 8 bit display
                    newDataRender = newData.astype(np.uint8)
                    maxDepth = np.max(newData)
                    # save this as the initialised background depth
                    bg = newData
                    if VISUALISE_STEPS:
                        colormap = cv2.COLORMAP_JET
                        depth_data_colormap = cv2.applyColorMap(newDataRender, colormap)
                        cv2.imshow('Background Depth', depth_data_colormap)
            result = None
        # Step 2: Get the displacement of the camera wrt to the projector
        calibcalc.project_calib("Calibration Dot")
        result = messagebox.askokcancel("Instruction", "Please ensure the window containing the circle is projected and spans the full screen.")
        root.focus_force()  # Bring the window to front
        if not result:
            quit()
        colorFrame = None
        while colorFrame == None:
            frameSet = pipe.waitForFrames(100)
            # render colour frame
            colorFrame = frameSet.colorFrame()
        if colorFrame != None:
            size = colorFrame.dataSize()
            data = colorFrame.data()
            colorWidth = colorFrame.width()
            colorHeight = colorFrame.height()
            if size != 0:
                data.resize((colorHeight, colorWidth, 3))
                data = cv2.cvtColor(data, cv2.COLOR_BGR2RGB) 
                # mirror image
                data = np.flip(data, 1)
                ## exclusive to this setup
                data = np.flip(data, 0)
                scale_factor_x, scale_factor_y, displacement_x, displacement_y, width, height, min_x, min_y = calibcalc.get_transformation(data)
                if scale_factor_x is not None:
                    calibcalc.write_transformation_to_config(config_path, scale_factor_x, scale_factor_y, displacement_x, displacement_y, width, height, min_x, min_y)
        cv2.destroyWindow("Calibration Dot")
        
        # Step 3: Get the object depth and dimensions. It is expected that it is circular
        result = messagebox.askokcancel("Instruction", "Please place the object to detect in the detected area, then click on it to determine the size. ")
        root.focus_force()  # Bring the window to front
        cv2.destroyWindow('Background Depth')
        if result:
            while True:
                frameSet = pipe.waitForFrames(100)
                # render colour frame and depth frame
                colorFrame = None
                depthFrame = None
                while colorFrame == None or depthFrame == None:
                    frameSet = pipe.waitForFrames(100)
                    # render colour frame
                    colorFrame = frameSet.colorFrame()
                    depthFrame = frameSet.depthFrame()
                if colorFrame != None and depthFrame != None:
                    colorSize = colorFrame.dataSize()
                    colorData = colorFrame.data()
                    depthSize = depthFrame.dataSize()
                    depthData = depthFrame.data()
                    colorWidth = colorFrame.width()
                    colorHeight = colorFrame.height()
                    depthWidth = depthFrame.width()
                    depthHeight = depthFrame.height()
                    if colorSize != 0 and depthSize != 0 :
                        newColorData = colorData
                        newColorData.resize((colorHeight, colorWidth, 3))
                        newColorData = cv2.cvtColor(newColorData, cv2.COLOR_BGR2RGB) 
                        depthData.resize((depthHeight, depthWidth, 2))
                        # extend the depth data
                        newDepthData = depthData[:,:,0]+depthData[:,:,1]*256
                        filteredData = bg-newDepthData
                        filteredData[filteredData > maxDepth] = 0
                        filteredData = np.flip( filteredData , 0)
                        newDepthData = newDepthData.astype(np.uint8)
                        newDepthData = np.flip(newDepthData, 0)
                        newDepthData = cv2.cvtColor(newDepthData, cv2.COLOR_GRAY2RGB) 
                        # mirror image
                        newColorData = np.flip(newColorData, 1)
                        newColorData = np.flip(newColorData, 0)
                        cv2.imshow('working area', newColorData)
                        cv2.setMouseCallback('working area', filter_area)
                        # Handle termination exception
                        if terminate_program:
                            print("CALIBRATION SUCCESSFUL")
                            sys.stdout.flush()  
                            cv2.destroyAllWindows()
                            quit()
                        if VISUALISE_STEPS:
                            cv2.imshow('Depth area', newDepthData)
                    key = cv2.waitKey(1)
                # Press ESC or 'q' to close the window
                if key == ESC or key == q:
                    cv2.destroyAllWindows()
                    break

                        
        pipe.stop()

    except ObException as e:
        result = messagebox.showerror("Error", e.getMessage())
        root.focus_force() 
        print("function: %s\nargs: %s\nmessage: %s\ntype: %d\nstatus: %d" % (
            e.getName(), e.getArgs(), e.getMessage(), e.getExceptionType(), e.getStatus()))

