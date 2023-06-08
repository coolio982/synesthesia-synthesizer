import { FC, memo, useState, useEffect, useRef } from 'react';
import useIntersectionObserver from '@react-hook/intersection-observer';
import './background.css';
import { ipcRenderer } from 'electron';
import { parseStringToJsonList } from 'functions/utils';

interface Props {
  className?: string;
}
interface JsonObject {
  id: number;
  obj: string;
  action: string;
  pos_x: number;
  pos_y: number;
}
const areas = [
  { id: 1, name: 'amplitude', text: 'AMP' },
  { id: 2, name: 'fmmod', text: 'FREQUENCY MODULATION' },
  { id: 3, name: 'bias', text: 'BIAS' },
  { id: 4, name: 'echo', text: 'ECHO' },
  { id: 5, name: 'chords', text: 'ADD VOICES' },
  { id: 6, name: 'waves', text: 'WAVEFORMS' },
  { id: 7, name: 'octave', text: '8VE' },
  { id: 8, name: 'tremolo', text: 'TREM' },
];
function areComponentsOverlapping(component1: Element, component2: Element) {
  const rect1 = component1.getBoundingClientRect();
  const rect2 = component2.getBoundingClientRect();

  const isOverlapping = !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );

  if (isOverlapping) {
    const zIndex1 = parseInt(window.getComputedStyle(component1).zIndex);
    const zIndex2 = parseInt(window.getComputedStyle(component2).zIndex);

    return zIndex1 < zIndex2;
  }

  return false;
}

function isSVGinsideRectangle(
  soundObjectBounds: { x: number; y: number; width: number; height: number },
  rectBounds: { x: number; y: number; width: number; height: number }
) {
  // Check for intersection
  if (
    soundObjectBounds.x + soundObjectBounds.width > rectBounds.x &&
    soundObjectBounds.x < rectBounds.x + rectBounds.width &&
    soundObjectBounds.y + soundObjectBounds.height > rectBounds.y &&
    soundObjectBounds.y < rectBounds.y + rectBounds.height
  ) {
    return true; // Rectangles intersect
  }

  return false; // Rectangles do not intersect
}

function isPointInsideRectangle(
  x: number,
  y: number,
  rect: { left: number; right: number; top: number; bottom: number }
) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

const BackgroundHw = () => {
  const [showText, setShowText] = useState('');
  const [effectsToggle, setEffectsToggle] = useState(false);

  useEffect(() => {
    // Listen for the 'effects toggle' event from the main process
    const listener = window.electron.ipcRenderer.on(
      'effects-toggle',
      (event, receivedMessage) => {
        // @ts-ignore
        const jsonList = parseStringToJsonList(event);
        if (jsonList.at(-1)['effects-toggle'] === 'True') {
          setEffectsToggle(true);
        } else {
          setEffectsToggle(false);
        }
      }
    );
    // Clean up the event listener when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeListener('effects-toggle', listener);
    };
  }, []);

  useEffect(() => {
    // Listen for the 'use-loc' event from the main process
    const listener = window.electron.ipcRenderer.on(
      'use-loc',
      (event, receivedMessage) => {
        const soundObjects = document.querySelectorAll(
          '[data-testid="sound-object"]'
        );
        let newText = '';
        if (effectsToggle) {
          // Check if each coordinate is inside any of the rectangles
          for (let i = 0; i < soundObjects.length; i++) {
            const soundObjectBounds = soundObjects[i].getBoundingClientRect();
            for (let j = 0; j < areas.length; j++) {
              const rect = document.querySelector(`.rectangle10${areas[j].id}`);

              if (rect) {
                const rectBounds = rect.getBoundingClientRect();
                if (isSVGinsideRectangle(soundObjectBounds, rectBounds)) {
                  newText += areas[j].name;
                }
              }
            }
          }
        }
        setShowText(newText);
      }
    );
    return () => {
      window.electron.ipcRenderer.removeListener('use-loc', listener);
    };
  }, [effectsToggle]);

  return (
    <>
      <div className="rectangle100" />
      {areas.map(
        (rect) =>
          effectsToggle && (
            <div
              key={rect.id}
              className={`rectangle10${rect.id}`}
              data-text={rect.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              {/* {showText.includes(rect.name) && (
                <p style={{ fontFamily: 'Arial', fontSize: '50px', fontWeight: 'bold', color: '#333', textAlign: 'center', margin: '0', transform: 'scale(1, 1)', transformOrigin: 'center' }}>{rect.text}</p>
              )} */}
              <p
                style={{
                  fontSize: '50px',
                  color: '#333',
                  textAlign: 'center',
                  margin: '0',
                  animation: 'pulse 1s ease-in-out infinite',
                }}
              >
                {rect.text}
              </p>
            </div>
          )
      )}
    </>
  );
};

export default BackgroundHw;
