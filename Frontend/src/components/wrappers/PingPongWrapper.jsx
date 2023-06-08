import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import '../background.css';
import * as Constants from './constants';
const COLOUR = Constants.GREEN;

function PingPongControl({ synths, dest, dialSize }) {
  const [pingpong, setPingpong] = useState(
    new Tone.PingPongDelay('4n', 0.2).toDestination()
  );
  const [pingpongToggle, setPingpongToggle] = useState(null);
  const [pingpongDelay, setPingpongDelay] = useState(null);
  const [pingpongDelayFeedback, setPingpongDelayFeedback] = useState(null);

  useEffect(() => {
    setPingpong(
      pingpong.set({
        delayTime: 2, // range:0-4 (choice)
        feedback: 0.2, // range:0-1
        wet: 0,
      })
    );
    setPingpongToggle(
      new Nexus.Toggle('#pingpong-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setPingpongDelay(
      new Nexus.Dial('#pingpong-delay', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 4,
        step: 0,
        value: 1,
      })
    );
    setPingpongDelayFeedback(
      new Nexus.Dial('#pingpong-delay-feedback', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 1,
        step: 0,
        value: 0.2,
      })
    );
  }, []);

  useEffect(() => {
    if (pingpongToggle) {
      pingpongToggle.colorize('accent', COLOUR);
      pingpongToggle.on('change', function (v) {
        pingpong.set({ wet: v ? 1 : 0 });
      });
      setPingpongToggle(pingpongToggle);
    }
  }, [pingpongToggle, pingpong]);

  useEffect(() => {
    if (pingpongDelayFeedback) {
      pingpongDelayFeedback.colorize('accent', COLOUR);
      pingpongDelayFeedback.on('change', function (v) {
        pingpong.set({ feedback: v });
      });
      setPingpongDelayFeedback(pingpongDelayFeedback);
    }
  }, [pingpongDelayFeedback]);

  useEffect(() => {
    if (pingpongDelay) {
      pingpongDelay.colorize('accent', COLOUR);
      pingpongDelay.on('change', function (v) {
        pingpong.set({
          delay: v,
        });
      });
      setPingpongDelay(pingpongDelay);
    }
    if (pingpongToggle) {
      pingpongToggle.colorize('accent', COLOUR);
      pingpongToggle.on('change', function (v) {
        pingpong.set({ wet: v ? 1 : 0 });
      });
      setPingpongToggle(pingpongToggle);
    }
  }, [pingpongDelay, pingpong]);

  useEffect(() => {
    synths.forEach((synth) => {
      if (synth.isDisposed) {
        return; // Skip if the synth is disposed
      }

      try {
        synth.connect(pingpong);
        // pingpong.connect(dest);
      } catch (err) {
        console.log(err);
      }
    });
  }, [synths]);

  return (
    <>
      <div style={{ textAlign: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLOUR }}>
          <b>pingpong</b>
          <br />
          delay | feedback
        </p>
        <div style={{ display: 'inline-block' }} id="pingpong-toggle"></div>

        <div className="row">
          <div id="pingpong-delay"></div>
          <div id="pingpong-delay-feedback"></div>
        </div>
      </div>
    </>
  );
}

export default PingPongControl;
