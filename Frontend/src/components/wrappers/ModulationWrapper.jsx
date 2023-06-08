import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Constants from './constants';

const COLOUR = Constants.BLUE;
const attackReleaseOptions = [
  'linear',
  'exponential',
  'sine',
  'cosine',
  'bounce',
  'ripple',
  'step',
];
const decayOptions = ['linear', 'exponential'];

function ModulationADSR({ synths = [], synthObjs = [] }) {
  const [modulationADSR, setModulationADSR] = useState(null);
  const [modulationAttackCurveSelector, setModulationAttackCurveSelector] =
    useState(null);
  const [modulationDecayCurveSelector, setModulationDecayCurveSelector] =
    useState(null);
  const [modulationReleaseCurveSelector, setModulationReleaseCurveSelector] =
    useState(null);

  useEffect(() => {
    setModulationADSR(
      new Nexus.Multislider('#modulation-adsr', {
        size: [134, 134],
        numberOfSliders: 4,
        min: 0,
        max: 1,
        step: 0,
        candycane: 3,
        values: [0.005, 0.005, 1, 0.1],
        smoothing: 0,
        mode: 'bar',
      })
    );
    setModulationAttackCurveSelector(
      new Nexus.Select('#modulation-attack-curve', {
        size: [117, 27],
        options: attackReleaseOptions,
      })
    );
    setModulationDecayCurveSelector(
      new Nexus.Select('#modulation-decay-curve', {
        size: [117, 27],
        options: decayOptions,
      })
    );
    setModulationReleaseCurveSelector(
      new Nexus.Select('#modulation-release-curve', {
        size: [117, 27],
        options: attackReleaseOptions,
      })
    );
  }, []);

  useEffect(() => {
    if (modulationADSR) {
      modulationADSR.colorize('accent', COLOUR);
      if (synthObjs) {
        modulationADSR.on('change', function (v) {
          synthObjs.forEach((obj) => {
            obj.synth.set({
              envelope: {
                attack: Nexus.scale(v[0], 0, 1, 0, 2),
                decay: Nexus.scale(v[1], 0, 1, 0, 2),
                sustain: v[2],
                release: Nexus.scale(v[3], 0, 1, 0, 5),
              },
            });
          });
        });
      } else {
        modulationADSR.on('change', function (v) {
          synths.forEach((synth) => {
            synth.set({
              envelope: {
                attack: Nexus.scale(v[0], 0, 1, 0, 2),
                decay: Nexus.scale(v[1], 0, 1, 0, 2),
                sustain: v[2],
                release: Nexus.scale(v[3], 0, 1, 0, 5),
              },
            });
          });
        });
      }

      setModulationADSR(modulationADSR);
    }
  }, [modulationADSR, synths, synthObjs]);

  useEffect(() => {
    if (modulationAttackCurveSelector) {
      if (synthObjs) {
        modulationAttackCurveSelector.on('change', function (v) {
          synthObjs.forEach((obj) => {
            obj.synth.modulationEnvelope.attackCurve = v.value;
          });
        });
      } else {
        modulationAttackCurveSelector.on('change', function (v) {
          synths.forEach((synth) => {
            synth.modulationEnvelope.attackCurve = v.value;
          });
        });
      }
      setModulationAttackCurveSelector(modulationAttackCurveSelector);
    }
  }, [modulationAttackCurveSelector, synths, synthObjs]);

  useEffect(() => {
    if (modulationDecayCurveSelector) {
      if (synthObjs) {
        modulationDecayCurveSelector.on('change', function (v) {
          synthObjs.forEach((obj) => {
            obj.synth.modulationEnvelope.decayCurve = v.value;
          });
        });
      } else {
        modulationDecayCurveSelector.on('change', function (v) {
          synths.forEach((synth) => {
            synth.modulationEnvelope.decayCurve = v.value;
          });
        });
      }
      setModulationDecayCurveSelector(modulationDecayCurveSelector);
    }
  }, [modulationDecayCurveSelector, synths, synthObjs]);

  useEffect(() => {
    if (modulationReleaseCurveSelector) {
      if (synthObjs) {
        modulationReleaseCurveSelector.on('change', function (v) {
          synthObjs.forEach((obj) => {
            obj.synth.modulationEnvelope.releaseCurve = v.value;
          });
        });
      } else {
        modulationReleaseCurveSelector.on('change', function (v) {
          synths.forEach((synth) => {
            synth.modulationEnvelope.releaseCurve = v.value;
          });
        });
      }
      setModulationReleaseCurveSelector(modulationReleaseCurveSelector);
    }
  }, [modulationReleaseCurveSelector, synths, synthObjs]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* <p style={{ transform: 'rotate(-90deg)', marginRight: '-20px' }}>
      <b>modulation</b>
    </p> */}
        <div style={{ marginLeft: '60px' }} id="modulation-adsr"></div>
      </div>
      <div style={{ marginLeft: '65px' }}>
        <p style={{ color: COLOUR }}>
          <b>Attack Curve</b>
        </p>
        <div id="modulation-attack-curve"></div>
        <p style={{ color: COLOUR }}>
          <b>Decay Curve</b>
        </p>
        <div id="modulation-decay-curve"></div>
        <p style={{ color: COLOUR }}>
          <b>Sustain Curve</b>
        </p>
        <div id="modulation-release-curve"></div>
      </div>
    </>
  );
}

export default ModulationADSR;
