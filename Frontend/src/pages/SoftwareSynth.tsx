// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SpawnSoundDraggable from 'components/Spawner';
import Background from 'components/background';
import OscilloscopeWrapper from '../components/wrappers/OscilloscopeWrapper';
import SynthComponent from '../components/SynthFunctions';
import 'components/background.css';

const SoftwareSynth = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    setAudioContext(new AudioContext());
  }, [AudioContext]);

  return (
    <div
      ref={boxRef}
      id="box"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'black',
        zIndex: 1,
      }}
    >
      <div
        ref={parentRef}
        id="projection"
        style={{
          width: '1280px',
          height: '600px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '0',
        }}
      >
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: -2,
          }}
        >
          <Background />
        </div>
        {audioContext && (
          <OscilloscopeWrapper audioContext={audioContext} bg={-1} />
        )}
        <SpawnSoundDraggable parentRef={parentRef} />
      </div>
    </div>
  );
};

export default SoftwareSynth;
