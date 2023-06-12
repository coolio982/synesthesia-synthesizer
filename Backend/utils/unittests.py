import unittest
from unittest.mock import Mock, MagicMock
import coverage
from collections import deque


from synthplayer.synth import Sine, Triangle, Sawtooth, Square, Pulse, WhiteNoise, Semicircle, Pointy
from synthplayer.synth import WaveSynth
from synthplayer.playback import Output

from synth import SimpleWave
from depthcameracalcs import *
from gesturecalcs import *

cov = coverage.Coverage()
cov.start()

################################################################
################### DEPTH CAMERA TESTS #########################
################################################################

class ObjectTrackingTests(unittest.TestCase):
    def test_find_closest_pairs(self):
        existing_contours = [(1, [1, 2]), (2, [3, 4]), (3, [5, 6])]
        coords2 = [[0, 1], [2, 3], [4, 5], [6, 7]]

        pairs, unmatched_existing, unmatched_new = find_closest_pairs(existing_contours, coords2)

        # Assert the expected pairs
        expected_pairs = [(1, 0), (2, 1), (3, 2)]
        self.assertEqual(set(pairs), set(expected_pairs))

        # Assert the expected unmatched existing contours, as it is too far
        expected_unmatched_existing = [0]
        self.assertEqual(set(unmatched_existing), set(expected_unmatched_existing))

        # Assert the expected unmatched new contours, as it did not exist previously
        expected_unmatched_new = [3]
        self.assertEqual(set(unmatched_new), set(expected_unmatched_new))

    def test_process_matched_pairs(self):
        pairs = [(1, 0), ]
        centres = [(10, 20), (30, 40)]
        pts = [{'id': 1, 'pts': deque([(5, 10), (10, 15)])}]
        maskDataRGB = np.zeros((800, 640, 3), dtype=np.uint8)  # Create a blank imagee
        objectDetails = []

        # Call the function
        objectDetails_result = process_matched_pairs(pairs, centres, pts, maskDataRGB, objectDetails)
        # Assert the updated objectDetails
        expected_objectDetails = [
            {'id': '1', 'obj': 'circle1', 'action': 'move', 'pos_x': 10, 'pos_y': 20},
        ]
        self.assertEqual(objectDetails_result, expected_objectDetails)

        # Assert the updated pts list
        expected_pts = [{'id': 1, 'pts': deque([(10, 20), (5, 10), (10, 15)])}]
        self.assertEqual(pts, expected_pts)


################################################################
################ GESTURE CALCULATION TESTS #####################
################################################################
class GestureCalcsTests(unittest.TestCase):
    def test_check_overlap(self):
        rect1 = (0, 0, 10, 10)
        rect2 = (5, 5, 10, 10)
        self.assertTrue(check_overlap(rect1, rect2))

        rect3 = (0, 0, 5, 5)
        rect4 = (10, 10, 5, 5)
        self.assertFalse(check_overlap(rect3, rect4))

    def test_calc_bounding_rect(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)

        # Create a mock landmarks object
        mock_landmarks = MagicMock()
        mock_landmarks.landmark = [
            MagicMock(x=0.1, y=0.2),
            MagicMock(x=0.3, y=0.4),
            MagicMock(x=0.5, y=0.6)
        ]
        rect = calc_bounding_rect(image, mock_landmarks)
        self.assertEqual(rect, [10, 20, 51, 61])

    def test_calc_landmark_list(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)

        # Create a mock landmarks object
        mock_landmarks = MagicMock()
        mock_landmarks.landmark = [
            MagicMock(x=0.1, y=0.2),
            MagicMock(x=0.3, y=0.4),
            MagicMock(x=0.5, y=0.6)
        ]
        landmark_list = calc_landmark_list(image, mock_landmarks)
        self.assertListEqual(landmark_list, [[10, 20], [30, 40], [50, 60]])

    def test_pre_process_landmark(self):
        landmark_list = [[10, 20], [30, 40], [50, 60]]
        preprocessed = pre_process_landmark(landmark_list)
        self.assertEqual(preprocessed, [0.0, 0.0, 0.5, 0.5, 1.0, 1.0])

    def test_pre_process_point_history(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        point_history = [[10, 20], [30, 40], [50, 60]]
        preprocessed = pre_process_point_history(image, point_history)
        self.assertEqual(preprocessed, [0.0, 0.0, 0.2, 0.2, 0.4, 0.4])


################################################################
################### SYNTHESIZER TESTS ##########################
################################################################
# the oscillator is an abstract class, so a concrete implementation is required in tests
# class MockOscillator:
#     def blocks(self):
#         # Example implementation generating a single block
#         block_size = 512
#         block = [0.0] * block_size
#         yield block

# class SimpleWaveTest(unittest.TestCase):
#     def setUp(self):
#         self.simple_wave = SimpleWave()

#     def test_get_currently_playing(self):
#         currently_playing = self.simple_wave.get_currently_playing()
#         self.assertEqual(currently_playing, {})

#     def test_create_synth(self):
#         self.assertEqual(self.simple_wave.synth, None)
#         self.simple_wave.create_synth()
#         self.assertIsInstance(self.simple_wave.output, Output)
#         self.assertIsInstance(self.simple_wave.synth, WaveSynth)

#     def test_create_osc(self):
#             # Test case 1: Testing creation of Sine oscillator
#             freq = 440
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Sine)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 2: Testing creation of Triangle oscillator
#             freq = 880
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Triangle)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 3: Testing creation of Pulse oscillator
#             freq = 660
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Pulse)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 4: Testing creation of Sawtooth oscillator
#             freq = 550
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Sawtooth)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 5: Testing creation of Square oscillator
#             freq = 770
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Square)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 6: Testing creation of Semicircle oscillator
#             freq = 990
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Semicircle)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 7: Testing creation of Pointy oscillator
#             freq = 880
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq)
#             self.assertIsInstance(osc, Pointy)
#             self.assertEqual(osc.frequency, freq)

#             # Test case 8: Testing creation of WhiteNoise oscillator
#             freq = 0
#             self.simple_wave.ctr += 1
#             osc = self.simple_wave.create_osc("A", 3, freq, is_audio=True)
#             self.assertIsInstance(osc, WhiteNoise)


#     def test_alter_bias(self):
#         self.simple_wave.time_passed = 0
#         # Test incrementing bias
#         self.simple_wave.alter_bias(dir=1)
#         self.assertAlmostEqual(self.simple_wave.bias, 0.3)
#         self.simple_wave.time_passed = 0
#         # Test decrementing bias
#         self.simple_wave.alter_bias(dir=-1)
#         self.assertAlmostEqual(self.simple_wave.bias, 0.0)

#     def test_increment_wave_ctr(self):
#         self.simple_wave.time_passed = 0
#         self.simple_wave.increment_wave_ctr()
#         self.assertEqual(self.simple_wave.ctr, 1)

#     def test_increment_fm_ctr(self):
#         self.simple_wave.time_passed = 0
#         self.simple_wave.increment_fm_ctr()
#         self.assertEqual(self.simple_wave.fm_ctr, 1)

#     def test_stop_osc(self):
#         # Test stopping all oscillators
#         self.simple_wave.currently_playing = {("A", 3): 1, ("B", 4): 2}
#         self.simple_wave.stop_osc()
#         self.assertEqual(len(self.simple_wave.currently_playing), 0)
#         self.assertNotIn(("A", 3), self.simple_wave.currently_playing)
#         self.assertNotIn(("B", 4), self.simple_wave.currently_playing)

#     def test_alter_octave(self):
#         self.simple_wave.time_passed = 0
#         # Test incrementing octave
#         self.simple_wave.alter_octave(dir=1)
#         self.assertEqual(self.simple_wave.octave, 4)
#         self.simple_wave.time_passed = 0
#         # Test decrementing octave
#         self.simple_wave.alter_octave(dir=-1)
#         self.assertEqual(self.simple_wave.octave, 3)
#         # no change if too fast 
#         self.simple_wave.alter_octave(dir=-1)
#         self.assertEqual(self.simple_wave.octave, 3)

#     def test_alter_tremolo_numbers(self):
#         self.simple_wave.time_passed = 0
#         # Test altering tremolo rate
#         self.simple_wave.alter_tremolo_numbers(dir=1)
#         self.assertEqual(self.simple_wave.tremolo_rate, 6)
#         self.simple_wave.time_passed = 0
#         # Test altering tremolo depth
#         self.simple_wave.alter_tremolo_numbers(dir=2)
#         self.assertAlmostEqual(self.simple_wave.tremolo_depth, 0.6)
#         # No change if too fast
#         self.simple_wave.alter_tremolo_numbers(dir=2)
#         self.assertAlmostEqual(self.simple_wave.tremolo_depth, 0.6)

#     def test_alter_tremolo_wave(self):
#         self.simple_wave.alter_tremolo_wave()
#         self.assertAlmostEqual(self.simple_wave.tremolo_wave, 1)
#         self.simple_wave.time_passed = 0
#         self.simple_wave.alter_tremolo_wave()
#         self.assertAlmostEqual(self.simple_wave.tremolo_wave, 2)
#         # no change if requested too fast
#         self.simple_wave.alter_tremolo_wave()
#         self.assertAlmostEqual(self.simple_wave.tremolo_wave, 2)

#     def test_toggle_echo(self):
#         self.simple_wave.time_passed = 0
#         self.simple_wave.toggle_echo()
#         self.assertTrue(self.simple_wave.echo)
#         self.simple_wave.time_passed = 0
#         self.simple_wave.toggle_echo()
#         self.assertFalse(self.simple_wave.echo)
#         # no change if requested too fast
#         self.simple_wave.toggle_echo()
#         self.assertFalse(self.simple_wave.echo)

#     def test_alter_echo_delay(self):
#         self.simple_wave.time_passed = 0
#         # Test incrementing echo delay
#         self.simple_wave.alter_echo_delay(dir=1)
#         self.assertAlmostEqual(self.simple_wave.echo_delay, 0.16)
#         self.simple_wave.time_passed = 0
#         # Test decrementing echo delay
#         self.simple_wave.alter_echo_delay(dir=-1)
#         self.assertAlmostEqual(self.simple_wave.echo_delay, 0.06)

#     def test_alter_chords(self):
#         self.simple_wave.time_passed = 0
#         self.simple_wave.alter_chords()
#         self.assertEqual(self.simple_wave.chords, 1)

#     def test_alter_volume(self):
#         self.simple_wave.time_passed = 0
#         # Test incrementing volume
#         self.simple_wave.alter_volume(dir=1)
#         self.assertAlmostEqual(self.simple_wave.amp, 1.5)
#         self.simple_wave.time_passed = 0
#         # Test decrementing volume
#         self.simple_wave.alter_volume(dir=-1)
#         self.assertAlmostEqual(self.simple_wave.amp, 0.5)
    
#     def test_generate_sample_returns_sample(self):
#         # Create an instance of the Oscillator class or use a mock object
#         oscillator = Mock(spec=MockOscillator)
#         block_generator = iter([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9]])
#         oscillator.blocks.return_value = block_generator
#         # Set up the necessary parameters
#         duration = 1.0
#         use_fade = False
#         oscillator.blocks.side_effect = StopIteration
#         try:
#             # Call the generate_sample method
#             result = self.simple_wave.generate_sample(oscillator, duration, use_fade)
#         except StopIteration:
#             # Exception caught, set result to None
#             result = None
#         # Assert that the result is None
#         self.assertIsNone(result)


if __name__ == '__main__':
    unittest.main()

cov.stop()
cov.save()