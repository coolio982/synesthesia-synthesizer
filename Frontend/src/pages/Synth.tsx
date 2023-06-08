// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as Tone from 'tone';
import BackgroundHw from 'components/hwbackground';
import Background from 'components/background';
import OscilloscopeWrapper from '../components/wrappers/OscilloscopeWrapper';
import SpawnSoundObject from '../components/SoundObjectSpawner';
import 'components/background.css';

const Synth = () => {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [showComponent, setShowComponent] = useState(false);
  const [showErr, setShowErr] = useState<boolean>(false);
  const [showSW, setShowSW] = useState<boolean>(false);
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const actx = Tone.context;
  const [audioContext, setAudioContext] = useState(null);
  const navigateHome = () => {
    // 👇️ navigate to /
    navigate('/');
  };

  const navigateSoftware = () => {
    // 👇️ navigate to /
    navigate('/softwareSynth');
    setShowSW(true);
  };

  useEffect(() => {
    setAudioContext(null);
  }, [AudioContext]);

  useEffect(() => {
    console.log('ew');
    const handleGetLoc = (event: any, message: any) => {
      console.log(event);
      if (
        event.includes('No device found') ||
        (message && message[0] == 'No device found')
      ) {
        setShowErr(true);
      } else {
        console.log('show component');
        setShowComponent(true);
      }
    };
    window.electron.ipcRenderer.sendMessage('get-loc', ['begin sending']);
    window.electron.ipcRenderer.on('get-loc', handleGetLoc);
    const handleResize = () => {
      const box = document.getElementById('box');
      if (box) {
        box.style.transform = 'translate(0%, 0%)';
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.electron.ipcRenderer.removeListener('get-loc', handleGetLoc);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      {!showComponent && !showErr && (
        <div className="loader">
          <div className="loader-inner">
            <div className="loader-line-wrap">
              <div className="loader-line" />
            </div>
            <div className="loader-line-wrap">
              <div className="loader-line" />
            </div>
            <div className="loader-line-wrap">
              <div className="loader-line" />
            </div>
            <div className="loader-line-wrap">
              <div className="loader-line" />
            </div>
            <div className="loader-line-wrap">
              <div className="loader-line" />
            </div>
          </div>
        </div>
      )}
      {showErr && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: '10000',
          }}
        >
          <div className="error-msg">
            <FontAwesomeIcon icon={faTimesCircle} />
            Device not found!
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <button
                style={{ margin: '10px' }}
                className="small-button"
                type="button"
                onClick={navigateHome}
              >
                <span role="img" aria-label="home">
                  🏠
                </span>
                Home
              </button>

              <button
                className="small-button"
                type="button"
                onClick={navigateSoftware}
              >
                <span role="img" aria-label="home">
                  🎹
                </span>
                Software Synthesizer
              </button>
            </div>
          </div>
        </div>
      )}
      {showComponent && (
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
          {showSW && (
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
          )}
          {!showSW && (
            <div
              style={{ position: 'fixed', top: '0%', left: '-5%', zIndex: -2 }}
            >
              <BackgroundHw />
            </div>
          )}
          <SpawnSoundObject parentRef={parentRef} actx={actx} />
        </div>
      )}
    </div>
  );
};

export default Synth;
