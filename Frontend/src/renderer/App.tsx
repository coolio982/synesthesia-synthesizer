import {
  HashRouter as Router,
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Synth from '../pages/Synth';
import SoftwareSynth from '../pages/SoftwareSynth';
import Docs from '../pages/Docs';
import Calibrate from '../pages/Calibrate';
import icon from '../../assets/hand.svg';
import './App.css';

const Hello = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div>
      <h1>Synesthesia Synthesizer</h1>
    </div>
  );
};

type MenuButtonsProps = {
  isBlackBackground: boolean;
  justifyContent: string;
  disableCalibration: boolean;
};

function MenuButtons(props: MenuButtonsProps) {
  const location = useLocation();
  const backgroundStyle = props.isBlackBackground
    ? { backgroundColor: 'black' }
    : {};
  // Hide menu buttons on the /synth and /calibrate route
  if (location.pathname === '/docs') {
    return <></>;
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: props.justifyContent,
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 10,
        ...backgroundStyle,
      }}
    >
      <Link to="/synth">
        <button
          type="button"
          style={{ display: location.pathname === '/synth' ? 'none' : 'block' }}
          // onClick={handleSynthButtonClick}
        >
          <span role="img" aria-label="keyboard">
            🎹
          </span>
          Synthesizer
        </button>
      </Link>
      <Link
        to="/calibrate"
        style={{
          display: location.pathname === '/calibrate' ? 'none' : 'block',
        }}
      >
        <button type="button" disabled={props.disableCalibration}>
          <span role="img" aria-label="books">
            🎯
          </span>
          Calibrate Camera
        </button>
      </Link>
      <Link
        to="/docs"
        style={{ display: location.pathname === '/docs' ? 'none' : 'block' }}
      >
        <button type="button">
          <span role="img" aria-label="books">
            📚
          </span>
          Getting Started
        </button>
      </Link>
      <Link to="/">
        <button
          type="button"
          style={{ display: location.pathname === '/' ? 'none' : 'block' }}
          // onClick={handleHomeButtonClick}
        >
          <span role="img" aria-label="home">
            🏠
          </span>
          Home
        </button>
      </Link>
    </div>
  );
}

export default function App() {
  const [showMenuButtons, setShowMenuButtons] = useState(true);
  const [menuLocation, setMenuLocation] = useState('center');
  const [isBlackBackground, setIsBlackBackground] = useState(false);
  const [disableCalibration, setDisableCalibration] = useState(false);

  useEffect(() => {
    // Listen for the 'use-loc' event from the main process
    window.electron.ipcRenderer.on('use-loc', (event, receivedMessage) => {
      setDisableCalibration(true);
    });
  }); // run once on startup

  useEffect(() => {
    // Hide menu buttons on the /synth and /calibrate route
    setShowMenuButtons(
      window.location.pathname === '/index.html' ||
        window.location.pathname === '/'
    );
  }, []);
  useEffect(() => {
    const path = window.location.pathname;
    switch (path) {
      case '/synth':
        setIsBlackBackground(true);
        setMenuLocation('center');
        break;
      case '/docs':
        setIsBlackBackground(false);
        setMenuLocation('flex-start');
        break;
      case '/calibrate':
        setIsBlackBackground(false);
        setMenuLocation('flex-start');
        break;
      default:
        setIsBlackBackground(false);
    }
  });
  return (
    <Router>
      {showMenuButtons && (
        <MenuButtons
          isBlackBackground={isBlackBackground}
          justifyContent={menuLocation}
          disableCalibration={disableCalibration}
        />
      )}
      <Routes>
        <Route path="/docs" element={<Docs />} />
        <Route path="/synth" element={<Synth />} />
        <Route path="/calibrate" element={<Calibrate />} />
        <Route path="/" element={<Hello />} />
        <Route path="/softwareSynth" element={<SoftwareSynth />} />
      </Routes>
    </Router>
  );
}
