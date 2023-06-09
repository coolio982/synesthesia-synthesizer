# Importing the relevant libraries
import websockets
import asyncio
import ast
from collections import deque
from utils import synth
import time
import cv2 as cv
import numpy as np

class SynthController:
    def __init__(self):
        self.notes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F']
        # TBC
        self.areas_x = [0, 130, 500, 640]
        self.areas_y = [0, 130, 270, 400]
        self.two_loc = [] # increase the function it is on an object in the area
        self.one_loc = [] # decrease if it is on an object in the area
        self.open_loc = []
        self.close_loc = []
        self.synths = {}
        self.prev_actions = {}
        self.time_passed = 0
        self.closed = False
        self.prev_closed = False
        self.prev_effect_on = False
        self.effect_on = False
        self.prev_reverse = False
        self.reverse = False
        self.should_terminate = False
        self.tap_timer = time.time()
        self.one_depths = {}
        

    def check_intersection(self, circle, rectangles, radius=60):
        circle_x, circle_y = circle

        for rect in rectangles:
            rect_x, rect_y, rect_xw, rect_yh = rect

            # Calculate the center point of the rectangle
            rect_center_x = (rect_x + rect_xw) / 2
            rect_center_y = (rect_y + rect_yh) / 2

            # Calculate the distance between the center points of the rectangle and the circle
            distance = ((circle_x - rect_center_x) ** 2 + (circle_y - rect_center_y) ** 2) ** 0.5

            # Calculate the sum of the radii of the circle and the rectangle
            radius_sum = radius + max((rect_xw - rect_x), (rect_yh - rect_y)) / 2

            # Check if the distance is less than or equal to the sum of the radii
            if distance <= radius_sum:
                return True

        return False

    def num_to_note(self, synth_id):
        return self.notes[synth_id % 12]

    def initialize_synth(self, obj):
        synth_id = obj["id"]
        if synth_id not in self.synths:
            self.synths[synth_id] = synth.SimpleWave(self.num_to_note(int(synth_id)))
            self.prev_actions[synth_id] = None

    def process_data(self, objs):
        for obj in objs:
            if obj["id"]!="h":
                self.initialize_synth(obj)
        return self.play_synths(objs)
    
    def apply_effect(self, obj, synth_id):
        if obj["pos_x"] < self.areas_x[1]:
            if obj["pos_y"] < self.areas_y[1]:
                if self.check_intersection((obj["pos_x"], obj["pos_y"]), self.two_loc):
                    self.synths[synth_id].alter_volume(1)
                elif self.check_intersection((obj["pos_x"], obj["pos_y"]), self.one_loc):
                    self.synths[synth_id].alter_volume(-1)
                else:
                    self.synths[synth_id].alter_volume(1)
            elif obj["pos_y"] < self.areas_y[2]:
                self.synths[synth_id].alter_tremolo_wave()
                if self.check_intersection((obj["pos_x"], obj["pos_y"]), self.two_loc):
                    self.synths[synth_id].alter_tremolo_numbers(2)
                elif self.check_intersection((obj["pos_x"], obj["pos_y"]), self.one_loc):
                    self.synths[synth_id].alter_tremolo_numbers(1)
            elif obj["pos_y"] > self.areas_y[2]:# and self.prev_actions[synth_id] != "touch": 
                if self.check_intersection((obj["pos_x"], obj["pos_y"]), self.two_loc):
                    self.synths[synth_id].alter_octave(1)
                elif self.check_intersection((obj["pos_x"], obj["pos_y"]), self.one_loc):
                    self.synths[synth_id].alter_octave(-1)
        elif obj["pos_x"] > self.areas_x[2]:
            if obj["pos_y"] < self.areas_y[1]:
                if self.check_intersection((obj["pos_x"], obj["pos_y"]), self.one_loc):
                    self.synths[synth_id].alter_bias(0)
                else:
                    self.synths[synth_id].alter_bias()
            elif obj["pos_y"] < self.areas_y[2]:
                self.synths[synth_id].toggle_echo()
                if self.check_intersection((obj["pos_x"], obj["pos_y"]), self.two_loc):
                    self.synths[synth_id].alter_echo_delay(1)
                elif self.check_intersection((obj["pos_x"], obj["pos_y"]), self.one_loc):
                    self.synths[synth_id].alter_echo_delay(-1)
                    
            else: 
                self.synths[synth_id].alter_chords()
        else:
            if obj["pos_y"] < self.areas_y[1]:
                self.synths[synth_id].increment_fm_ctr()

            elif obj["pos_y"] > self.areas_y[2]: 
                self.synths[synth_id].increment_wave_ctr()
    
    def check_ups_and_downs(deque):
        iterator = iter(deque)
        previous = next(iterator)
        direction = None
        peak_count = 0

        for current in iterator:
            if current > previous:
                current_direction = 1
            elif current < previous:
                current_direction = 2

            if direction is None:
                direction = current_direction
            elif current_direction != direction:
                direction = current_direction
                peak_count += 1

            # Check if two peaks have been found
            if peak_count >= 2:
                return True

            # Update previous for the next iteration
            previous = current

        return False
        
    def assign_gesture(self, obj, synth_id):
        # accounts for taps
        if self.check_intersection((obj["pos_x"], obj["pos_y"]), self.one_loc):
            if self.tap_timer-time.time()>0.3:
                if synth_id in self.one_depths:
                    self.one_depths[synth_id].append(obj["avg_depth"])
                else:
                    self.one_depths[synth_id] = deque(maxlen=16)
                    self.one_depths[synth_id].append(obj["avg_depth"])
                self.tap_timer = time.time()
        else:
            try:
                self.one_depths[synth_id].clear()
            except:
                pass


                    
    
    def play_synths(self, objectDetails):
        # touchVisRGB = np.zeros((480, 640, 3), dtype=np.uint8)
        ids = set()
        self.two_loc = [] # Reset the location lists
        self.one_loc = [] # Reset the location lists
        self.open_loc = []
        self.close_loc = []
        for obj in objectDetails:
            if (obj["obj"] == "sign"):
                if obj["action"] == "Two":
                    self.prev_closed = False
                    self.two_loc.append((obj["x"], obj["y"], obj["x_w"], obj["y_h"]))
                elif obj["action"] == "One":
                    self.prev_closed = False
                    self.one_loc.append((obj["x"], obj["y"], obj["x_w"], obj["y_h"]))
                elif obj["action"] == "Open":
                    self.prev_closed = False
                    self.open_loc.append((obj["x"], obj["y"], obj["x_w"], obj["y_h"]))
                elif obj["action"] == "Close" and time.time()-self.time_passed>0.5:
                    self.time_passed = time.time()
                    if self.prev_closed == False:
                        self.closed = not self.closed
                        self.effect_on = self.closed
                        self.prev_closed = True
                    self.close_loc.append((obj["x"], obj["y"], obj["x_w"], obj["y_h"]))
            elif (obj["obj"] == "gesture"):
                if obj["action"] == "Anticlockwise":
                    self.reverse = True
                elif obj["action"] == "Clockwise":
                    self.reverse = False
        for obj in objectDetails:  
            if (obj["obj"] == "circle") and (obj["pos_x"] > self.areas_x[0]) and  (obj["pos_x"] < self.areas_x[3]) and (obj["pos_y"] > self.areas_y[0]) and  (obj["pos_y"] < self.areas_y[3]) :
                synth_id = obj["id"]
                ids.add(synth_id)
                # apply to all of the actions
                if self.prev_reverse!=self.reverse:
                    if self.reverse == True:
                        self.synths[synth_id].undo()
                    else:
                        self.synths[synth_id].redo()
                    self.prev_reverse = self.reverse
                    
                # it's an individual action on the object
                if obj["action"] == "touch":
                    if self.effect_on:
                        self.apply_effect(obj, synth_id)
                    else:
                        self.assign_gesture(obj, synth_id)
                    try:
                        self.synths[synth_id].play_osc(self.one_depths[synth_id])
                    except:
                        self.synths[synth_id].play_osc()
                else:
                    try:
                        self.synths[synth_id].stop_osc()
                    except:
                        pass                    
                self.prev_actions[synth_id] = obj["action"]
        # send all of the rendering information to the front end
        synthDetails = []
        for key, synth in self.synths.items():
            if key in ids:
                synthDetail = synth.get_details()
                synthDetail["id"] = key
                synthDetails.append(synthDetail)
            else:
                synth.stop_osc()
                synth.reset()
        if self.prev_effect_on != self.effect_on:
            self.prev_effect_on = self.effect_on
        synthDetails.append({"effects-toggle": str(self.effect_on)})
        return synthDetails

    async def listen(self):
        url = "ws://127.0.0.1:7890"
        async with websockets.connect(url) as ws:
            await ws.send(("Hello Server!").encode())
            try:
                while True:
                    data = await ws.recv()
                    data = data.decode()
                    if "Hello" in data:
                        continue 
                    objects = ast.literal_eval(data)
                    synthDetails = self.process_data(objects)
                    if synthDetails != []:
                        await ws.send(str(synthDetails).encode())
            except KeyboardInterrupt:
                pass
            except websockets.ConnectionClosedOK:
                print("Websocket connection closed by the server.")

    def start(self):
        loop = asyncio.get_event_loop()
        task = loop.create_task(self.listen())
        try:
            loop.run_until_complete(task)
        except KeyboardInterrupt:
            task.cancel()
            loop.run_until_complete(task)
        finally:
            loop.close()

if __name__ == "__main__":
    controller = SynthController()
    controller.start()