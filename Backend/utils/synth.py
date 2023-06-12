import time
import collections
from typing import Optional
from synthplayer.synth import Sine, Triangle, Sawtooth, SawtoothH, Square, SquareH, Harmonics, Pulse, WhiteNoise, Linear, Semicircle, Pointy
from synthplayer.synth import WaveSynth, note_freq, MixingFilter, EchoFilter, AmpModulationFilter, EnvelopeFilter
from synthplayer.synth import major_chord_keys
from synthplayer.sample import Sample
from synthplayer.playback import Output
from synthplayer.oscillators import Oscillator
from synthplayer import params
import keyboard
from itertools import zip_longest
import synthplayer

params.norm_frames_per_chunk = params.norm_osc_blocksize

class StreamingOscSample(Sample):
    def __init__(self, oscillator, samplerate, duration=0.0):
        super().__init__()
        self.mono()
        self.samplerate = samplerate
        self.blocks = oscillator.blocks()
        self.max_play_duration = duration or 1000000

    @property
    def duration(self):
        return self.max_play_duration

    def chunked_frame_data(self, chunksize, repeat=False, stopcondition=lambda: False):
        num_frames = chunksize // self.samplewidth // self.nchannels
        if num_frames != params.norm_osc_blocksize:
            raise ValueError("streaming osc num_frames must be equal to the oscillator blocksize")
        played_duration = 0.0
        scale = 2 ** (8 * self.samplewidth - 1) - 1

        def clamp(amplitude):
            return min(1.0, max(-1.0, amplitude))

        while played_duration < self.max_play_duration:
            try:
                frames = [int(clamp(v) * scale) for v in next(self.blocks)]
            except StopIteration:
                break
            else:
                sample = Sample.from_array(frames, self.samplerate, 1)
                yield sample.view_frame_data()
            played_duration += num_frames / self.samplerate

class SimpleWave():
    def __init__(self, note="A"):
        self.waveforms = ["sine", "triangle", "pulse", "sawtooth", "square", "semicircle", "pointy", "noise"]
        self.ctr = 0
        self.fm_ctr = 8
        self.a4 = 440
        self.octave = 3
        self.note = note
        self.amp = 0.5
        self.phase = 0
        self.bias = 0
        self.fm = 7
        self.samplerate = 22050
        self.samplewidth = 2

        self.tremolo_wave = 0
        self.tremolo_rate = 5
        self.tremolo_depth = 0.5

        self.echo = False
        self.echo_after = 0.5
        self.echo_amount = 3
        self.echo_delay = 0.06
        self.echo_decay = 1.4
        self.echos_ending_time = 0
        
        self.chords = 0 #[0: off, 1: maj3, 2:maj7]
        self.arpeggiate_rate = 0.2

        self.currently_playing={}
        self.sid = None
        self.synth = None
        self.wait_time = 0.5
        self.time_passed = 1000
        self.output = Output(self.samplerate, self.samplewidth, 1, mixing="mix")
        self.metronome = False

        self.history = []
        self.current_state = {}
        self.undo_stack = []
        self.redo_stack = []
        # Save the initial state
        self.save_state()

    def save_state(self):
        state = {
            "waveforms": self.waveforms[:],
            "ctr": self.ctr,
            "fm_ctr": self.fm_ctr,
            "a4": self.a4,
            "octave": self.octave,
            "note": self.note,
            "amp": self.amp,
            "phase": self.phase,
            "bias": self.bias,
            "fm": self.fm,
            "samplerate": self.samplerate,
            "samplewidth": self.samplewidth,
            "tremolo_wave": self.tremolo_wave,
            "tremolo_rate": self.tremolo_rate,
            "tremolo_depth": self.tremolo_depth,
            "echo": self.echo,
            "echo_after": self.echo_after,
            "echo_amount": self.echo_amount,
            "echo_delay": self.echo_delay,
            "echo_decay": self.echo_decay,
            "echos_ending_time": self.echos_ending_time,
            "chords": self.chords,
        }
        self.history.append(state)

    def undo(self):
        if len(self.history) > 1:
            self.redo_stack.append(self.history.pop())
            previous_state = self.history[-1]
            self.restore_state(previous_state)

    def redo(self):
        if self.redo_stack:
            next_state = self.redo_stack.pop()
            self.history.append(next_state)
            self.restore_state(next_state)

    def restore_state(self, state):
        self.waveforms = state["waveforms"]
        self.ctr = state["ctr"]
        self.fm_ctr = state["fm_ctr"]
        self.a4 = state["a4"]
        self.octave = state["octave"]
        self.note = state["note"]
        self.amp = state["amp"]
        self.phase = state["phase"]
        self.bias = state["bias"]
        self.fm = state["fm"]
        self.samplerate = state["samplerate"]
        self.samplewidth = state["samplewidth"]
        self.tremolo_wave = state["tremolo_wave"]
        self.tremolo_rate = state["tremolo_rate"]
        self.tremolo_depth = state["tremolo_depth"]
        self.echo = state["echo"]
        self.echo_after = state["echo_after"]
        self.echo_amount = state["echo_amount"]
        self.echo_delay = state["echo_delay"]
        self.echo_decay = state["echo_decay"]
        self.echos_ending_time = state["echos_ending_time"]
        self.chords = state["chords"]
        self.arpeggiate_rate = state["arpeggiate_rate"]

    def get_currently_playing(self):
        return self.currently_playing
    
    def create_synth(self):
        # samplerate = self.samplerate_choice.get()
        samplerate = self.samplerate
        self.synth = WaveSynth(samplewidth=2, samplerate=samplerate)
        if self.output is not None:
            self.output.close()
        self.output = Output(self.synth.samplerate, self.synth.samplewidth, 1, mixing="mix")
    
    def generate_sample(self, oscillator: Oscillator, duration: float, use_fade: bool = False) -> Optional[Sample]:
        scale = 2**(8*self.samplewidth-1)
        blocks = oscillator.blocks()
        print(blocks, type(blocks))
        try:
            sample_blocks = list(next(blocks) for _ in range(int(self.samplerate*duration/params.norm_osc_blocksize)))
            float_frames = sum(sample_blocks, [])
            frames = [int(v*scale) for v in float_frames]
        except StopIteration:
            return None
        else:
            sample = Sample.from_array(frames, self.samplerate, 1)
            if use_fade:
                sample.fadein(0.05).fadeout(0.1)
            return sample

    def create_osc(self, note, octave, freq,is_audio=False):
        def create_unfiltered_osc():
            def create_chord_osc(clazz, **arguments):
                if is_audio and self.chords!=0:
                    chord_keys = major_chord_keys(note, octave)
                    if self.chords == 1:
                        chord_keys = list(chord_keys)[:-1]
                    a4freq = self.a4
                    
                    chord_freqs = [note_freq(n, o, a4freq) for n, o in chord_keys]
                    oscillators = []
                    arguments["amplitude"] /= len(chord_freqs)
                    for f in chord_freqs:
                        arguments["frequency"] = f
                        oscillators.append(clazz(**arguments))
                    return MixingFilter(*oscillators)
                else:
                    # no chord (or an LFO instead of audio output oscillator), return one osc for only the given frequency
                    return clazz(**arguments)

            waveform = self.waveforms[self.ctr]
            amp = self.amp
            bias = self.bias
          
            if waveform == "noise":
                return WhiteNoise(freq, amplitude=amp, bias=bias, samplerate=self.samplerate)
            else:
                phase = 0
                pw = 0
                fm = 0
                if self.fm_ctr < (len(self.waveforms)-2):
                    fm_waveform = self.waveforms[self.fm_ctr]
                    fm_o = {
                        "sine": Sine,
                        "triangle": Triangle,
                        "pulse": Pulse,
                        "sawtooth": Sawtooth,
                        "square": Square,
                        "semicircle": Semicircle,
                        "pointy": Pointy,
                    }[fm_waveform]
                    fm = create_chord_osc(fm_o, frequency=freq*0.75, amplitude=amp, phase=phase,
                                            bias=bias, fm_lfo=None, samplerate=self.samplerate)
                pwm = 0
                if waveform == "pulse":
                    return create_chord_osc(Pulse, frequency=freq, amplitude=amp, phase=phase,
                                            bias=bias, pulsewidth=pw, fm_lfo=fm, pwm_lfo=pwm,
                                            samplerate=self.samplerate)
                else:
                    o = {
                        "sine": Sine,
                        "triangle": Triangle,
                        "sawtooth": Sawtooth,
                        "square": Square,
                        "semicircle": Semicircle,
                        "pointy": Pointy,
                    }[waveform]
                    return create_chord_osc(o, frequency=freq, amplitude=amp, phase=phase,
                                            bias=bias, fm_lfo=fm, samplerate=self.samplerate)
        osc = create_unfiltered_osc()
        return osc
    def apply_tremolo(self, source):
        ## Tremolo
        wave = self.tremolo_wave
        freq = self.tremolo_rate
        amp = self.tremolo_depth / 2.0
        samplerate = self.samplerate
        bias = 1.0 - amp
        if amp == 0.0 or freq == 0.0 or wave==0:
            return source
        
        if wave == 1:
            modulator = Sine(freq, amp, bias=bias, samplerate=samplerate)
        elif wave == 2:
            modulator = Triangle(freq, amp, bias=bias, samplerate=samplerate)
        elif wave == 3:
            modulator = SawtoothH(freq, 9, amp, bias=bias, samplerate=samplerate)
        elif wave == 4:
            modulator = SquareH(freq, 9, amp, bias=bias, samplerate=samplerate)
        return AmpModulationFilter(source, modulator)
    
    def apply_echo(self, source):
        if self.echo:
            return EchoFilter(source, self.echo_after, self.echo_amount, self.echo_delay, self.echo_decay)
        return source

    def apply_filters(self, osc, deque):
        output_osc = self.apply_tremolo(osc)
        output_osc = self.apply_echo(output_osc)
        if len(deque)>0:
            output_osc = self.envelope(output_osc, deque)
        else:
            pass
        return output_osc

    def play_osc(self,notes=None,dq=None):
        if self.currently_playing:
            return
        if not notes:
            notes = [self.note]
        first_note = notes[0]
        try:
            first_freq = note_freq(first_note, self.octave, self.a4)
        except:
            pass
        for note in notes:
            try:
                freq = note_freq(note, self.octave, self.a4)
                oscs = [self.create_osc(note, self.octave, freq, is_audio=True)]
                mixed_osc = MixingFilter(*oscs) if len(oscs) > 1 else oscs[0]
                self.echos_ending_time = 0
                if len(notes) <= 1:
                    # you can't use filters and echo when using arpeggio for now
                    mixed_osc = self.apply_filters(mixed_osc, dq)
                    sample = self.generate_sample(mixed_osc, 1)

                    if self.synth and sample.samplewidth != self.synth.samplewidth:
                        print("16 bit overflow!") 
                    current_echos_duration = getattr(mixed_osc, "echo_duration", 0)
                    if current_echos_duration > 0:
                        self.echos_ending_time = time.time() + current_echos_duration
            except:
                print("Error: Sample mixing failed")
        try:
            sample = StreamingOscSample(mixed_osc, self.samplerate)
            sid = self.output.play_sample(sample)
            self.currently_playing[(first_note, self.octave)] = sid
        except:
            print("Error: Sample cannot be streamed")

    def alter_bias(self, dir = 1):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            if dir == 1:
                self.bias = (((((self.bias*10)+13)%20)-10)/10)
            else:
                self.bias = (((((self.bias*10)-13)%20)-10)/10)
            self.time_passed = curr
    
    def grouper(iterable, n, fillvalue=None):
        args = [iter(iterable)] * n
        return zip_longest(*args, fillvalue=fillvalue)

    def envelope(self, source, deque):
        if deque == None:
            return source
        attack = 0.1
        decay = 0.07
        sustain = 1
        sustain_level = 0.13
        release =1.14
        if len(deque) >= 4:
            deque_groups = list(self.grouper(deque, len(deque) // 4, fillvalue=None))
            attack = deque_groups[0][0]
            decay =deque_groups[1][0]
            sustain = deque_groups[2][0]
            sustain_level = 0.10
            release =deque_groups[3][0]
        else:
            pass
        return EnvelopeFilter(source, attack, decay, sustain, sustain_level, release, False)

    def increment_wave_ctr(self):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            self.ctr = (self.ctr+1)%len(self.waveforms)
            self.time_passed = curr

    def increment_fm_ctr(self):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            self.fm_ctr = (self.fm_ctr+1)%len(self.waveforms)
        self.time_passed = curr
    
    def stop_osc(self, notes=None):
        if not notes:
            notes = [self.note]
        for note in notes:
            if (note, self.octave) in self.currently_playing:
                # stop the note
                sid = self.currently_playing[(note, self.octave)]
                self.output.stop_sample(sid)
        for sid in self.currently_playing:
            self.output.stop_sample(sid)
        self.currently_playing = {}

    def alter_octave(self, dir = 1):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            if dir == 1:
                self.octave = (self.octave+1)%8
            else:
                self.octave = (self.octave-1)%8
            self.time_passed = curr
    
    def alter_tremolo_numbers(self, dir = 1):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            if dir == 1: # mvment 1
                self.tremolo_rate = (self.tremolo_rate+1)%10
            elif dir == 2: #movment 2
                self.tremolo_depth = (((self.tremolo_depth*10)+1)%10)/10
            self.time_passed = curr

    def alter_tremolo_wave(self):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            self.tremolo_wave = (self.tremolo_wave+1)%5
            self.time_passed = curr

    def toggle_echo(self):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            self.echo = not self.echo
            self.time_passed = curr

    def alter_echo_delay(self, dir = 1):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            if dir == 1:
                self.echo_delay = (((self.echo_delay * 10) + 1)%5)/10
            else:
                self.echo_delay = (((self.echo_delay * 10) - 1)%5)/10
            self.time_passed = curr
    
    def alter_chords(self):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            self.chords = (self.chords+1)%3
            self.time_passed = curr

    def alter_volume(self, dir = 1):
        curr = time.time()
        if curr - self.time_passed > self.wait_time:
            self.amp = (self.amp+dir)%5
            self.time_passed = curr
        
    def get_details(self):
        info = {}
        info["wave"] = self.ctr
        info["fm_mod"] = "None"
        if self.fm_ctr <8:
            info["fm_mod"] = self.fm_ctr
        info["a4"] = self.a4
        info["octave"] = self.octave
        info["amp"] = self.amp
        info["phase"] = self.phase
        info["bias"] = self.bias
        info["fm"] = self.fm 
        info["samplerate"] = self.samplerate
        info["samplewidth"] = self.samplewidth
        
        info["tremolo_wave"] = self.tremolo_wave
        info["tremolo_rate"] =self.tremolo_rate 
        info["tremolo_depth"] =self.tremolo_depth

        info["echo"] = 1 if self.echo else 0
        info["echo_amount"] = self.echo_amount
        info["echo_delay"] = self.echo_delay
        info["echo_decay"] = self.echo_decay

        info["currently_playing"] = 1 if self.currently_playing !={} else 0
        info["chords"] = self.chords
        return info
    
    def reset(self):
        self.ctr = 0
        self.fm_ctr = 8
        self.a4 = 440
        self.octave = 3
        self.amp = 0.5
        self.phase = 0
        self.bias = 0
        self.fm = 7
        self.samplerate = 22050
        self.samplewidth = 2

        self.tremolo_wave = 0
        self.tremolo_rate = 0
        self.tremolo_depth = 0.5

        self.echo = False
        self.echo_after = 0.5
        self.echo_amount = 2
        self.echo_delay = 0.06
        self.echo_decay = 1.0
        self.chords = 0
        self.currently_playing={}
        self.sid = None
        self.echos_ending_time = 0
        

###### MANUAL TESTING SCRIPT ######
def on_keydown(event, w):
    if (event.name =='a'):
        w.play_osc(['A'])
    if (event.name =='f'):
        print("play synth")
        w.play_osc(['F'])
    elif (event.name =='s'):
        print("stop synth A")
        w.stop_osc(['A'])
    elif (event.name =='d'):
        print("stopSynth F")
        w.stop_osc(['F'])
    elif (event.name =='g'):
        print("add bias")
        w.alter_bias()
    elif (event.name =='w'):
        print("change wave")
        w.increment_wave_ctr()
    elif(event.name == "q"):
        print("addfm")
        w.increment_fm_ctr()
    elif(event.name == "e"):
        w.toggle_echo()
    elif(event.name == "c"):
        w.alter_chords()
    else:
        print("Key up:", event.name)

def on_keyup(event, w):
    if (event.name =='a'):
        print("stop synth")
    elif (event.name =='s'):
        print("stop adjust")
    else:
        print("Key up:", event.name)
        
if __name__ == "__main__":

    w1 = SimpleWave("A")
    w1.create_synth()
    print(w1.get_details())
    # # Bind keydown and keyup events
    keyboard.on_press(lambda event: on_keydown(event, w1))
    keyboard.on_release(lambda event: on_keyup(event, w1))
    # # Wait for key events
    keyboard.wait()
