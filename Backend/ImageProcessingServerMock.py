#!/usr/bin/env python
# -*- coding: utf-8 -*-
import csv
import sys
import copy
import argparse
import itertools
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
from utils import synthcalcs
from utils import synth
import websockets
import asyncio

OBJECT_DEPTH = 20
OBJECT_MARGIN = 5
MIN_TOUCH_AREA = 900
RADIUS_UPPER = 40
RADIUS_LOWER = 20
pts = []
buffer = 64 

# Server data
PORT = 7890
print("Server listening on Port " + str(PORT))

# A set of connected WebSocket clients
connected = set()

# Broadcast a message to all connected clients
async def broadcast(message):
    for conn in connected:
        await conn.send(message)

# The main behavior function for this server
async def echo(websocket, path):
    print("A client just connected")
    # Store a copy of the connected client
    connected.add(websocket)
    try:
        async for message in websocket:
            print("Received message from client: " + message)
            # Send a response to all connected clients except the sender
            for conn in connected:
                if conn != websocket:
                    await conn.send("Someone said: " + message)
    except websockets.exceptions.ConnectionClosed as e:
        print("A client just disconnected")
    finally:
        connected.remove(websocket)


def main():

    # Main loop ################################################################
    while True:

        time.sleep(0.5)
        print("sending")
        data_to_send = bytes("ewasdkjfjadfsk", encoding="utf-8")
        asyncio.get_event_loop().run_until_complete(broadcast(data_to_send))






if __name__ == '__main__':
    # Start the server
    start_server = websockets.serve(echo, "localhost", PORT)
    asyncio.get_event_loop().run_until_complete(start_server)

    # Start the synchronous algorithm to continuously process and send data
    main()

    # Run the event loop indefinitely
    asyncio.get_event_loop().run_forever()