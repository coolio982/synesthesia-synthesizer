import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';
const COLOUR = Constants.ORANGE;

function ReverbControl({ synths, dest, dialSize }) {
  const [reverb, setReverb] = useState(new Tone.Reverb(1).toDestination());
  const [reverbToggle, setReverbToggle] = useState(null);
  const [reverbDecay, setReverbDecay] = useState(null);

  useEffect(() => {
    setReverbToggle(
      new Nexus.Toggle('#reverb-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setReverbDecay(
      new Nexus.Dial('#reverb-decay', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 30,
        step: 0,
        value: 18,
      })
    );
  }, []);

  useEffect(() => {
    if (reverbToggle) {
      reverbToggle.colorize('accent', COLOUR);
      reverbToggle.on('change', function (v) {
        reverb.set({ wet: v ? 1 : 0 });
      });
      setReverbToggle(reverbToggle);
      console.log(reverb.wet);
    }
  }, [reverbToggle, reverb]);

  useEffect(() => {
    if (reverbDecay) {
      reverbDecay.colorize('accent', COLOUR);
      reverbDecay.on('change', function (v) {
        reverb.set({
          decay: v,
        });
        console.log(reverb);
      });
      setReverbDecay(reverbDecay);
    }
    if (reverbToggle) {
      reverbToggle.colorize('accent', COLOUR);
      reverbToggle.on('change', function (v) {
        reverb.set({ wet: v ? 1 : 0 });
      });
      setReverbToggle(reverbToggle);
      console.log(reverb.wet);
    }
  }, [reverbDecay, reverb]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(reverb);
      reverb.connect(dest);
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
        <b>reverb</b>
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          id="reverb-toggle"
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
        ></div>
        <div id="reverb-decay"></div>
      </div>
    </div>
  );
}

export default ReverbControl;
