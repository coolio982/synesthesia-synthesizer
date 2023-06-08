import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';
const COLOUR = Constants.ORANGE;

function FrequencyShiftControl({ synths, dest, dialSize }) {
  const [frequencyShift, setFrequencyShift] = useState(
    new Tone.FrequencyShifter(42).toDestination()
  );
  const [frequencyShiftToggle, setFrequencyShiftToggle] = useState(null);
  const [frequencyShiftAmount, setFrequencyShiftAmount] = useState(null);

  useEffect(() => {
    console.log('init');
    setFrequencyShiftToggle(
      new Nexus.Toggle('#frequencyShift-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setFrequencyShiftAmount(
      new Nexus.Dial('#frequencyShift-order', {
        size: dialSize,
        interaction: 'vertical', // "radial", "vertical", or "horizontal"
        mode: 'relative', // "absolute" or "relative"
        min: -600,
        max: 600,
        step: 0,
        value: 42,
      })
    );
    setFrequencyShift(
      frequencyShift.set({
        frequency: 42,
        wet: 0,
      })
    );
  }, []);

  useEffect(() => {
    if (frequencyShiftToggle) {
      frequencyShiftToggle.colorize('accent', COLOUR);
      frequencyShiftToggle.on('change', function (v) {
        frequencyShift.set({ wet: v ? 1 : 0 });
      });
      setFrequencyShiftToggle(frequencyShiftToggle);
    }
  }, [frequencyShiftToggle, frequencyShift]);

  useEffect(() => {
    if (frequencyShiftAmount) {
      frequencyShiftAmount.colorize('accent', COLOUR);
      frequencyShiftAmount.on('change', function (v) {
        frequencyShift.set({
          freqency: v,
        });
      });
      setFrequencyShiftAmount(frequencyShiftAmount);
    }
  }, [frequencyShiftAmount, frequencyShift]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(frequencyShift);
      frequencyShift.connect(dest);
    });
  }, [synths]);

  return (
    <>
      <div style={{ textAlign: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLOUR }}>Frequency Shift</p>
        <div
          style={{ display: 'inline-block' }}
          id="frequencyShift-toggle"
        ></div>
        <div
          style={{ display: 'inline-block' }}
          id="frequencyShift-order"
        ></div>
      </div>
    </>
  );
}

export default FrequencyShiftControl;
