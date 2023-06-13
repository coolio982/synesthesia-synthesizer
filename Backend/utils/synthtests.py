import unittest
from unittest.mock import Mock
import coverage


from synthplayer.synth import Sine, Triangle, Sawtooth, Square, Pulse, WhiteNoise, Semicircle, Pointy
from synthplayer.synth import WaveSynth
from synthplayer.playback import Output

from synth import SimpleWave
from depthcameracalcs import *
from gesturecalcs import *

cov = coverage.Coverage()
cov.start()
################################################################
################### SYNTHESIZER TESTS ##########################
################################################################
# the oscillator is an abstract class, so a concrete implementation is required in tests
class MockOscillator:
    def blocks(self):
        # Example implementation generating a single block
        block_size = 512
        block = [0.0] * block_size
        yield block

class SimpleWaveTest(unittest.TestCase):
    def setUp(self):
        self.simple_wave = SimpleWave()

    def test_get_currently_playing(self):
        currently_playing = self.simple_wave.get_currently_playing()
        self.assertEqual(currently_playing, {})

    def test_create_synth(self):
        self.assertEqual(self.simple_wave.synth, None)
        self.simple_wave.create_synth()
        self.assertIsInstance(self.simple_wave.output, Output)
        self.assertIsInstance(self.simple_wave.synth, WaveSynth)

    def test_create_osc(self):
            # Test case 1: Testing creation of Sine oscillator
            freq = 440
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Sine)
            self.assertEqual(osc.frequency, freq)

            # Test case 2: Testing creation of Triangle oscillator
            freq = 880
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Triangle)
            self.assertEqual(osc.frequency, freq)

            # Test case 3: Testing creation of Pulse oscillator
            freq = 660
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Pulse)
            self.assertEqual(osc.frequency, freq)

            # Test case 4: Testing creation of Sawtooth oscillator
            freq = 550
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Sawtooth)
            self.assertEqual(osc.frequency, freq)

            # Test case 5: Testing creation of Square oscillator
            freq = 770
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Square)
            self.assertEqual(osc.frequency, freq)

            # Test case 6: Testing creation of Semicircle oscillator
            freq = 990
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Semicircle)
            self.assertEqual(osc.frequency, freq)

            # Test case 7: Testing creation of Pointy oscillator
            freq = 880
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq)
            self.assertIsInstance(osc, Pointy)
            self.assertEqual(osc.frequency, freq)

            # Test case 8: Testing creation of WhiteNoise oscillator
            freq = 0
            self.simple_wave.ctr += 1
            osc = self.simple_wave.create_osc("A", 3, freq, is_audio=True)
            self.assertIsInstance(osc, WhiteNoise)


    def test_alter_bias(self):
        self.simple_wave.time_passed = 0
        # Test incrementing bias
        self.simple_wave.alter_bias(dir=1)
        self.assertAlmostEqual(self.simple_wave.bias, 0.3)
        self.simple_wave.time_passed = 0
        # Test decrementing bias
        self.simple_wave.alter_bias(dir=-1)
        self.assertAlmostEqual(self.simple_wave.bias, 0.0)

    def test_increment_wave_ctr(self):
        self.simple_wave.time_passed = 0
        self.simple_wave.increment_wave_ctr()
        self.assertEqual(self.simple_wave.ctr, 1)

    def test_increment_fm_ctr(self):
        self.simple_wave.time_passed = 0
        self.simple_wave.increment_fm_ctr()
        self.assertEqual(self.simple_wave.fm_ctr, 1)

    def test_stop_osc(self):
        # Test stopping all oscillators
        self.simple_wave.currently_playing = {("A", 3): 1, ("B", 4): 2}
        self.simple_wave.stop_osc()
        self.assertEqual(len(self.simple_wave.currently_playing), 0)
        self.assertNotIn(("A", 3), self.simple_wave.currently_playing)
        self.assertNotIn(("B", 4), self.simple_wave.currently_playing)

    def test_alter_octave(self):
        self.simple_wave.time_passed = 0
        # Test incrementing octave
        self.simple_wave.alter_octave(dir=1)
        self.assertEqual(self.simple_wave.octave, 4)
        self.simple_wave.time_passed = 0
        # Test decrementing octave
        self.simple_wave.alter_octave(dir=-1)
        self.assertEqual(self.simple_wave.octave, 3)
        # no change if too fast 
        self.simple_wave.alter_octave(dir=-1)
        self.assertEqual(self.simple_wave.octave, 3)

    def test_alter_tremolo_numbers(self):
        self.simple_wave.time_passed = 0
        # Test altering tremolo rate
        self.simple_wave.alter_tremolo_numbers(dir=1)
        self.assertEqual(self.simple_wave.tremolo_rate, 6)
        self.simple_wave.time_passed = 0
        # Test altering tremolo depth
        self.simple_wave.alter_tremolo_numbers(dir=2)
        self.assertAlmostEqual(self.simple_wave.tremolo_depth, 0.6)


    def test_alter_tremolo_wave(self):
        self.simple_wave.alter_tremolo_wave()
        self.assertAlmostEqual(self.simple_wave.tremolo_wave, 1)
        self.simple_wave.time_passed = 0
        self.simple_wave.alter_tremolo_wave()
        self.assertAlmostEqual(self.simple_wave.tremolo_wave, 2)
        # no change if requested too fast
        self.simple_wave.alter_tremolo_wave()
        self.assertAlmostEqual(self.simple_wave.tremolo_wave, 2)

    def test_toggle_echo(self):
        self.simple_wave.time_passed = 0
        self.simple_wave.toggle_echo()
        self.assertTrue(self.simple_wave.echo)
        self.simple_wave.time_passed = 0
        self.simple_wave.toggle_echo()
        self.assertFalse(self.simple_wave.echo)

    def test_alter_echo_delay(self):
        self.simple_wave.time_passed = 0
        # Test incrementing echo delay
        self.simple_wave.alter_echo_delay(dir=1)
        self.assertAlmostEqual(self.simple_wave.echo_delay, 0.16)
        self.simple_wave.time_passed = 0
        # Test decrementing echo delay
        self.simple_wave.alter_echo_delay(dir=-1)
        self.assertAlmostEqual(self.simple_wave.echo_delay, 0.06)

    def test_alter_chords(self):
        self.simple_wave.time_passed = 0
        self.simple_wave.alter_chords()
        self.assertEqual(self.simple_wave.chords, 1)

    def test_alter_volume(self):
        self.simple_wave.time_passed = 0
        # Test incrementing volume
        self.simple_wave.alter_volume(dir=1)
        self.assertAlmostEqual(self.simple_wave.amp, 1.5)
        self.simple_wave.time_passed = 0
        # Test decrementing volume
        self.simple_wave.alter_volume(dir=-1)
        self.assertAlmostEqual(self.simple_wave.amp, 0.5)
    
    def test_generate_sample_returns_sample(self):
        # Create an instance of the Oscillator class or use a mock object
        oscillator = Mock(spec=MockOscillator)
        block_generator = iter([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9]])
        oscillator.blocks.return_value = block_generator
        # Set up the necessary parameters
        duration = 1.0
        use_fade = False
        oscillator.blocks.side_effect = StopIteration
        try:
            # Call the generate_sample method
            result = self.simple_wave.generate_sample(oscillator, duration, use_fade)
        except StopIteration:
            # Exception caught, set result to None
            result = None
        # Assert that the result is None
        self.assertIsNone(result)


if __name__ == '__main__':
    unittest.main()

cov.stop()
cov.save()