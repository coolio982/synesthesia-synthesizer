import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';

function BitCrusherControl({ synths, dialSize }) {
  const [bitCrusher, setBitCrusher] = useState(
    new Tone.BitCrusher(7).toDestination()
  );
  const [bitCrusherToggle, setBitCrusherToggle] = useState(null);
  const [bitCrusherAmount, setBitCrusherAmount] = useState(null);

  useEffect(() => {
    setBitCrusherToggle(
      new Nexus.Toggle('#bitCrusher-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setBitCrusherAmount(
      new Nexus.Dial('#bitCrusher-decay', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 6,
        max: 10,
        step: 0.01,
        value: 7,
      })
    );
    setBitCrusher(
      bitCrusher.set({
        bits: 7,
        wet: 0,
      })
    );
  }, [bitCrusher]);

  useEffect(() => {
    if (bitCrusherToggle) {
      bitCrusherToggle.colorize('accent', Constants.ORANGE);
      bitCrusherToggle.on('change', function (v) {
        bitCrusher.set({ wet: v ? 1 : 0 });
      });
      setBitCrusherToggle(bitCrusherToggle);
    }
  }, [bitCrusherToggle, bitCrusher]);

  useEffect(() => {
    if (bitCrusherAmount) {
      bitCrusherAmount.colorize('accent', Constants.ORANGE);
      bitCrusherAmount.on('change', function (v) {
        bitCrusher.set({
          bits: v,
        });
      });
      setBitCrusherAmount(bitCrusherAmount);
    }
  }, [bitCrusherAmount, bitCrusher]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(bitCrusher);
    });
  }, [synths]);

  return (
    <>
      <p style={{ color: Constants.ORANGE }}>bitCrusher</p>
      <div id="bitCrusher-toggle"></div>
      <div id="bitCrusher-decay"></div>
    </>
  );
}

export default BitCrusherControl;
