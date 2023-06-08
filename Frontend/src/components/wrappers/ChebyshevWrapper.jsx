import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';
import * as Constants from './constants';

const COLOUR = Constants.ORANGE;

function ChebyshevControl({ synths, dest, Chebyshev, dialSize }) {
  const [chebyshev, setChebyshev] = useState(Chebyshev);
  const [chebyshevToggle, setChebyshevToggle] = useState(null);
  const [chebyshevAmount, setChebyshevAmount] = useState(null);

  useEffect(() => {
    console.log('init');
    setChebyshevToggle(
      new Nexus.Toggle('#chebyshev-toggle', {
        size: [36, 18],
        state: false,
      })
    );
    setChebyshevAmount(
      new Nexus.Dial('#chebyshev-order', {
        size: dialSize,
        interaction: 'vertical', // "radial", "vertical", or "horizontal"
        mode: 'relative', // "absolute" or "relative"
        min: 1,
        max: 100,
        step: 1,
        value: 51,
      })
    );
    setChebyshev(
      chebyshev.set({
        order: 51,
        wet: 0,
      })
    );
  }, []);

  useEffect(() => {
    if (chebyshevToggle) {
      chebyshevToggle.colorize('accent', COLOUR);
      chebyshevToggle.on('change', function (v) {
        chebyshev.set({ wet: v ? 1 : 0 });
      });
      setChebyshevToggle(chebyshevToggle);
    }
  }, [chebyshevToggle, chebyshev]);

  useEffect(() => {
    if (chebyshevAmount) {
      chebyshevAmount.colorize('accent', COLOUR);
      chebyshevAmount.on('change', function (v) {
        chebyshev.set({
          order: v,
        });
      });
      setChebyshevAmount(chebyshevAmount);
    }
  }, [chebyshevAmount, chebyshev]);

  useEffect(() => {
    synths.forEach((synth) => {
      synth.connect(chebyshev);
      chebyshev.connect(dest);
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
        <b>chebyshev</b>
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div id="chebyshev-toggle"></div>
        <div id="chebyshev-order"></div>
      </div>
    </div>
  );
}

export default ChebyshevControl;
