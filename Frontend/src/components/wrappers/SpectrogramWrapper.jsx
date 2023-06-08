import React, { useEffect, useRef } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';

import * as Constants from './constants';
const COLOUR = Constants.DARKBLUE;

const SpectrogramWrapper = ({ audioContext, darkMode }) => {
  const spectrogramRef = useRef(null);

  useEffect(() => {
    const spectrogram = new Nexus.Spectrogram(spectrogramRef.current, {
      size: [300, 150],
    });
    spectrogram.connect(Tone.getDestination());
    spectrogram.colorize('accent', COLOUR);
    if (darkMode) {
      spectrogram.colorize('accent', 'gray');
    }

    return () => {
      // Disconnect the spectrogram when the component unmounts
      spectrogram.disconnect();
    };
  }, [audioContext, darkMode]);

  return <div ref={spectrogramRef} />;
};

export default SpectrogramWrapper;
