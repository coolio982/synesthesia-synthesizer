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
  const[anticlockwise, setAnticlockwise]= useState<[number, number][]>([]);
  const[clockwise, setClockwise]= useState<[number, number][]>([]);
  const [rotationAngle, setRotationAngle] = useState(0); 
  
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
    const gestListener = window.electron.ipcRenderer.on('use-gest', (event, receivedMessage) => {
      // @ts-ignore
      const jsonList = parseStringToJsonList(event);
      // @ts-ignore
      const filteredList = jsonList.filter(obj => obj["obj"] === "gesture");
      console.log(filteredList)
      const coordinates = filteredList.map((obj: { action: any, x: any; y: any ,x_w: any, x_h:any}) => {
        return {
          action: obj.action,
          x: obj.x * 2 + obj.x_w,
          y: obj.y * 2+ obj.x_h,
        };
      });
      if (filteredList.length === 0 || coordinates.length === 0){
        setClockwise([]);
        setAnticlockwise([]);
      }else{
      for (let i = 0; i < coordinates.length; i++) {
        if (coordinates[i].action === "Anticlockwise"){
          setAnticlockwise([coordinates[i].x, coordinates[i].y]);
          setClockwise([]);
          break;
        }else if (coordinates[i].action === "Clockwise"){
          setClockwise([coordinates[i].x, coordinates[i].y]);
          setAnticlockwise([]);
          break;
        }else{
          setClockwise([]);
          setAnticlockwise([]);
        }
      }
    }
    })
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeListener('effects-toggle', listener);
      window.electron.ipcRenderer.removeListener('use-gest', gestListener);
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


  useEffect(() => {
    const animateRotation = () => {
      const rotationSpeed = 1; 

      setRotationAngle(prevAngle => prevAngle - rotationSpeed);

      requestAnimationFrame(animateRotation);
    };

    if (anticlockwise.length > 0) {
      animateRotation(); // Start the rotation animation
    } else {
      setRotationAngle(0); // Stop the rotation animation
    }

    // Rest of the code...
  }, [anticlockwise]);

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
      {anticlockwise.length > 0 && (
        <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          textAlign: 'center',
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          style={{
            animation: 'pulseRotateACW 2s linear infinite,  pulseFill 4s linear infinite',
            transformOrigin: 'center',
            opacity: 0.8,
          }}
        >
          <path
            d="M18.885 3.515c-4.617-4.618-12.056-4.676-16.756-.195l-2.129-2.258v7.938h7.484l-2.066-2.191c2.82-2.706 7.297-2.676 10.073.1 4.341 4.341 1.737 12.291-5.491 12.291v4.8c3.708 0 6.614-1.244 8.885-3.515 4.686-4.686 4.686-12.284 0-16.97z"
          />
        </svg>
      </div>
      )} 
            {clockwise.length > 0 && (
        <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          textAlign: 'center',
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          style={{
            animation: 'pulseRotateCW 2s linear infinite,  pulseFill 4s linear infinite',
            transformOrigin: 'center',
            opacity: 0.8,
          }}
        >
          <path
            d="M4.115 5.515c4.617-4.618 12.056-4.676 16.756-.195l2.129-2.258v7.938h-7.484l2.066-2.191c-2.819-2.706-7.297-2.676-10.074.1-2.992 2.993-2.664 7.684.188 10.319l-3.314 3.5c-4.716-4.226-5.257-12.223-.267-17.213z"
          />
        </svg>
      </div>
      )} 
    </>
  );
};

export default BackgroundHw;
