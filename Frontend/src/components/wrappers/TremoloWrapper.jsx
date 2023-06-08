import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';
import '../background.css';
const COLOUR = Constants.BLUE;
function TremoloControl({ synths, dest, dialSize }) {
  const [tremolo, setTremolo] = useState(
    new Tone.Tremolo(9, 0.75).toDestination().start()
  );
  const [tremoloToggle, setTremoloToggle] = useState(null);
  const [tremoloFreq, setTremoloFreq] = useState(null);
  const [tremoloDepth, setTremoloDepth] = useState(null);

  useEffect(() => {
    setTremoloToggle(
      new Nexus.Toggle('#tremolo-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setTremoloFreq(
      new Nexus.Dial('#tremolo-freq', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 50,
        step: 1,
        value: 9,
      })
    );
    setTremoloDepth(
      new Nexus.Dial('#tremolo-depth', {
        size: dialSize,
        interaction: 'vertical',
        mode: 'relative',
        min: 0,
        max: 1,
        step: 0,
        value: 0.75,
      })
    );
  }, []);

  useEffect(() => {
    if (tremoloToggle) {
      tremoloToggle.colorize('accent', COLOUR);
      tremoloToggle.on('change', function (v) {
        tremolo.set({ wet: v ? 1 : 0 });
      });
      setTremoloToggle(tremoloToggle);
    }
  }, [tremoloToggle, tremolo]);

  useEffect(() => {
    if (tremoloFreq) {
      tremoloFreq.colorize('accent', COLOUR);
      tremoloFreq.on('change', function (v) {
        tremolo.set({
          frequency: v,
        });
      });
      setTremoloFreq(tremoloFreq);
    }
  }, [tremoloFreq, tremolo]);

  useEffect(() => {
    if (tremoloDepth) {
      tremoloDepth.colorize('accent', COLOUR);
      tremoloDepth.on('change', function (v) {
        tremolo.set({
          depth: v,
        });
      });
      setTremoloFreq(tremoloFreq);
    }
  }, [tremoloDepth, tremolo]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(tremolo);
      tremolo.connect(dest);
    });
  }, [synths]);

  return (
    <>
      <div style={{ textAlign: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLOUR }}>
          <b>tremolo</b>
          <br />
          freq | depth
        </p>
        <div style={{ display: 'inline-block' }} id="tremolo-toggle"></div>

        <div className="row">
          <div id="tremolo-freq"></div>
          <div id="tremolo-depth"></div>
        </div>
      </div>
    </>
  );
}

export default TremoloControl;
