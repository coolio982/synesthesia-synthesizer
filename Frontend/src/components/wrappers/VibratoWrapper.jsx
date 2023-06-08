import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';
import '../background.css';
const COLOUR = Constants.BLUE;

function VibratoControl({ synths, dest, dialSize }) {
  const [vibrato, setVibrato] = useState(
    new Tone.Vibrato(9, 0.8).toDestination()
  );
  const [vibratoToggle, setVibratoToggle] = useState(null);
  const [vibratoFreq, setVibratoFreq] = useState(null);
  const [vibratoDepth, setVibratoDepth] = useState(null);

  useEffect(() => {
    setVibratoToggle(
      new Nexus.Toggle('#vibrato-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setVibratoFreq(
      new Nexus.Dial('#vibrato-freq', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 2000,
        step: 1,
        value: 9,
      })
    );
    setVibratoDepth(
      new Nexus.Dial('#vibrato-depth', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 1,
        step: 0,
        value: 0.75,
      })
    );
    setVibrato(
      vibrato.set({
        frequency: 9, // range:0-900
        depth: 0.75, // range:0-1
        wet: 0,
      })
    );
  }, []);

  useEffect(() => {
    if (vibratoToggle) {
      vibratoToggle.colorize('accent', COLOUR);
      vibratoToggle.on('change', function (v) {
        vibrato.set({ wet: v ? 1 : 0 });
      });
      setVibratoToggle(vibratoToggle);
    }
  }, [vibratoToggle, vibrato]);

  useEffect(() => {
    if (vibratoFreq) {
      vibratoFreq.colorize('accent', COLOUR);
      vibratoFreq.on('change', function (v) {
        vibrato.set({
          frequency: v,
        });
      });
      setVibratoFreq(vibratoFreq);
    }
  }, [vibratoFreq, vibrato]);

  useEffect(() => {
    if (vibratoDepth) {
      vibratoDepth.colorize('accent', COLOUR);
      vibratoDepth.on('change', function (v) {
        vibrato.set({
          depth: v,
        });
      });
      setVibratoFreq(vibratoFreq);
    }
  }, [vibratoDepth, vibrato]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(vibrato);
      vibrato.connect(dest);
    });
  }, [synths]);

  return (
    <>
      <div style={{ textAlign: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLOUR }}>
          <b>vibrato</b>
          <br />
          freq | depth
        </p>
        <div style={{ display: 'inline-block' }} id="vibrato-toggle"></div>

        <div className="row">
          <div id="vibrato-freq"></div>
          <div id="vibrato-depth"></div>
        </div>
      </div>
    </>
  );
}

export default VibratoControl;
