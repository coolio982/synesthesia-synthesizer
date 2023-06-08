// @ts-nocheck
import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  faTimesCircle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'components/background.css';

const Calibrate = () => {
  const navigate = useNavigate();
  const [showErr, setShowErr] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [dots, setDots] = useState('');
  const navigateHome = () => {
    // 👇️ navigate to /
    navigate('/');
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length < 3) {
          return `${prevDots}.`;
        }
        return '';
      });
    }, 500); // Adjust the interval as desired

    return () => {
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    const handleGetLoc = (event: any, message: any) => {
      console.log(event);
      if (event.includes('No device found')) {
        setShowErr(true);
      } else if (event.includes('SUCCESS')) {
        setIsCalibrated(true);
      }
    };
    window.electron.ipcRenderer.sendMessage('calibrate', ['begin sending']);
    window.electron.ipcRenderer.on('calibrate', handleGetLoc);
  }, []);

  return (
    <div
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
      <div className="Hello">
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
          </div>
        )}
        {!showErr && !isCalibrated && <h1>Calibrating{dots}</h1>}
        {isCalibrated && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: '10000',
            }}
          >
            <div className="success-msg">
              <FontAwesomeIcon icon={faCheckCircle} />
              Calibration Complete!
            </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Calibrate;
