import React, { Component } from 'react';
import '../background.css';

class Metronome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isPlaying: false,
      count: 0,
      bpm: 100,
      beatsPerMeasure: 4,
    };

    this.audioContext = null;
    this.timer = null;
    this.beepFrequency = 1000; // Frequency of the beep sound
    this.beepDuration = 50; // Duration of the beep sound in milliseconds
  }

  handleInputChange = (event) => {
    const bpm = event.target.value;

    if (this.state.isPlaying) {
      clearInterval(this.timer);
      this.timer = setInterval(this.playBeep, (60 / bpm) * 1000);

      this.setState({
        count: 0,
        bpm,
      });
    } else {
      this.setState({ bpm });
    }
  };

  playBeep = () => {
    const { count, beatsPerMeasure } = this.state;

    if (count % beatsPerMeasure === 0) {
      this.playSound(this.beepFrequency, this.beepDuration);
    }

    this.setState((state) => ({
      count: (state.count + 1) % state.beatsPerMeasure,
    }));
  };

  playSound = (frequency, duration) => {
    const { count, beatsPerMeasure } = this.state;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    if (count % beatsPerMeasure === 0) {
      gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    } else {
      gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    }
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  };

  startStop = () => {
    if (this.state.isPlaying) {
      clearInterval(this.timer);
      this.setState({
        isPlaying: false,
      });
    } else {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      this.timer = setInterval(
        this.playBeep,
        (60 / this.state.bpm) * (1000 / this.state.beatsPerMeasure)
      );
      this.setState(
        {
          count: 0,
          isPlaying: true,
        },
        this.playBeep
      );
    }
  };

  render() {
    const { isPlaying, bpm } = this.state;

    return (
      <div className="metronome">
        <div className="bpm-slider">
          <p>{bpm} BPM</p>
          <input
            type="range"
            min="60"
            max="240"
            value={bpm}
            onChange={this.handleInputChange}
          />
        </div>
        <button onClick={this.startStop}>{isPlaying ? 'Stop' : 'Start'}</button>
      </div>
    );
  }
}

export default Metronome;
