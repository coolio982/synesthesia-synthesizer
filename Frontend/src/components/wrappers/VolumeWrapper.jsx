import { useState, useEffect } from 'react';
import Nexus from 'nexusui';
import * as Constants from './constants';
const COLOUR = Constants.ORANGE;

function VolumeControl({ sliderArea, synths = [], synthObjs = null }) {
  const [volumeChange, setVolumeChange] = useState(null);

  useEffect(() => {
    setVolumeChange(
      new Nexus.Slider('#volume-change', {
        size: sliderArea,
        interaction: 'vertical',
        mode: 'relative',
        min: -60,
        max: 20,
        step: 0,
        value: -28,
      })
    );
  }, []);

  useEffect(() => {
    if (volumeChange) {
      volumeChange.colorize('accent', COLOUR);
      if (synthObjs) {
        volumeChange.on('change', function (v) {
          synthObjs.current.forEach((obj) => {
            obj.synth.set({
              volume: v,
            });
          });
        });
      } else {
        volumeChange.on('change', function (v) {
          synths.forEach((synth) => {
            synth.set({
              volume: v,
            });
          });
        });
      }
    }
  }, [volumeChange, synths, synthObjs]);

  useEffect(() => {
    if (synthObjs) {
      synthObjs.current.forEach((obj) => {
        obj.synth.set({
          volume: volumeChange ? volumeChange.value : -28,
        });
      });
    } else {
      synths.forEach((synth) => {
        synth.set({
          volume: volumeChange ? volumeChange.value : -28,
        });
      });
    }
  }, [synths, volumeChange, synthObjs]);

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
        <b>volume</b>
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div id="volume-change"></div>
      </div>
    </div>
  );
}

export default VolumeControl;
