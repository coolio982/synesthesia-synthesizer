import CanvasComponent from 'components/wrappers/CanvasWrapper';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Docs = () => {
  const navigate = useNavigate();
  const navigateHome = () => {
    // 👇️ navigate to /
    navigate('/');
  };
  const navigateSynth = () => {
    navigate('/synth');
  };
  const navigateCalibrate = () => {
    navigate('/calibrate');
  };

  return (
    <div>
      <CanvasComponent />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          zIndex: 10,
        }}
      >
        <div style={{ zIndex: 1 }}>
          <button
            type="button"
            style={{ margin: '10px' }}
            onClick={navigateSynth}
          >
            <span role="img" aria-label="keyboard">
              🎹
            </span>
            Synthesizer
          </button>
          <button
            type="button"
            className="small-button"
            onClick={navigateCalibrate}
          >
            <span role="img" aria-label="books">
              🎯
            </span>
            Calibrate Camera
          </button>
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
      </div>
      <div className="Hello">
        <div
          className="about"
          style={{
            backgroundColor: 'black',
            opacity: '0.7',
            height: '500px',
            width: '600px',
            overflow: 'auto',
          }}
        >
          <p>
            The Synesthesia Synthesizer is a project that uses computer vision
            to create an interactive synthesizer through augmented reality.
            <br />
            User Interaction Guide:
            <ul>
              <li>Use a single finger tap to decrease values.</li>
              <li>Use a two-finger tap to increase values.</li>
              <li>
                Open and close your fist to reveal adjustable components of the
                synthesizer.
              </li>
              <li>
                Rotate your index finger clockwise to undo the previous
                synthesizer effect.
              </li>
              <li>
                Rotate your index finger anticlockwise to reset all settings.
              </li>
            </ul>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
            sapien vel lacus luctus consectetur. Sed in massa vitae nulla
            facilisis sodales. Suspendisse at vestibulum metus, a Lorem ipsum
            dolor sit amet, consectetur adipiscing elit. Sed euismod sapien vel
            lacus luctus consectetur. Sed in massa vitae nulla facilisis
            sodales. Suspendisse at vestibulum metus, a Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Sed euismod sapien vel lacus
            luctus consectetur. Sed in massa vitae nulla facilisis sodales.
            Suspendisse at vestibulum metus, a Lorem ipsum dolor sit amet,
            consectetur adipiscing elit. Sed euismod sapien vel lacus luctus
            consectetur. Sed in massa vitae nulla facilisis sodales. Suspendisse
            at vestibulum metus, a Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed euismod sapien vel lacus luctus consectetur.
            Sed in massa vitae nulla facilisis sodales. Suspendisse at
            vestibulum metus, a Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed euismod sapien vel lacus luctus consectetur.
            Sed in massa vitae nulla facilisis sodales. Suspendisse at
            vestibulum metus, a Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed euismod sapien vel lacus luctus consectetur.
            Sed in massa vitae nulla facilisis sodales. Suspendisse at
            vestibulum metus, a Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed euismod sapien vel lacus luctus consectetur.
            Sed in massa vitae nulla facilisis sodales. Suspendisse at
            vestibulum metus, a Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed euismod sapien vel lacus luctus consectetur.
            Sed in massa vitae nulla facilisis sodales. Suspendisse at
            vestibulum metus, a sapien vel lacus luctus consectetur. Sed in
            massa vitae nulla facilisis sodales. Suspendisse at vestibulum
            metus, a Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed euismod sapien vel lacus luctus consectetur. Sed in massa vitae
            nulla facilisis sodales. Suspendisse at vestibulum metus, a Lorem
            ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
            sapien vel lacus luctus consectetur. Sed in massa vitae nulla
            facilisis sodales. Suspendisse at vestibulum metus, a sapien vel
            lacus luctus consectetur. Sed in massa vitae nulla facilisis
            sodales. Suspendisse at vestibulum metus, a Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Sed euismod sapien vel lacus
            luctus consectetur. Sed in massa vitae nulla facilisis sodales.
            Suspendisse at vestibulum metus, a Lorem ipsum dolor sit amet,
            consectetur adipiscing elit. Sed euismod sapien vel lacus luctus
            consectetur. Sed in massa vitae nulla facilisis sodales. Suspendisse
            at vestibulum metus, a
          </p>
        </div>
      </div>
    </div>
  );
};

export default Docs;
