import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';

const COLOUR = Constants.ORANGE;

function DistortionControl({ synths, dest, dialSize }) {
  const [distortion, setDistortion] = useState(
    new Tone.Distortion(1).toDestination()
  );
  const [distortionToggle, setDistortionToggle] = useState(null);
  const [distortionAmount, setDistortionAmount] = useState(null);

  useEffect(() => {
    setDistortionToggle(
      new Nexus.Toggle('#distortion-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setDistortionAmount(
      new Nexus.Dial('#distortion-decay', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 1,
        step: 0,
        value: 0.9,
      })
    );
    setDistortion(
      distortion.set({
        distortion: 0.9,
        wet: 0,
      })
    );
  }, []);

  useEffect(() => {
    if (distortionToggle) {
      distortionToggle.colorize('accent', COLOUR);
      distortionToggle.on('change', function (v) {
        distortion.set({ wet: v ? 1 : 0 });
      });
      setDistortionToggle(distortionToggle);
      console.log(distortion.wet);
    }
  }, [distortionToggle, distortion]);

  useEffect(() => {
    if (distortionAmount) {
      distortionAmount.colorize('accent', COLOUR);
      distortionAmount.on('change', function (v) {
        distortion.set({
          distortion: v,
        });
      });
      setDistortionAmount(distortionAmount);
    }
    if (distortionToggle) {
      distortionToggle.colorize('accent', COLOUR);
      distortionToggle.on('change', function (v) {
        distortion.set({ wet: v ? 1 : 0 });
      });
      setDistortionToggle(distortionToggle);
      console.log(distortion.wet);
    }
  }, [distortionAmount, distortion]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(distortion);
      distortion.connect(dest);
    });
  }, [synths]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p style={{ color: COLOUR }}>
        <b>distortion</b>
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div id="distortion-toggle"></div>
        <div id="distortion-decay"></div>
      </div>
    </div>
  );
}

export default DistortionControl;
