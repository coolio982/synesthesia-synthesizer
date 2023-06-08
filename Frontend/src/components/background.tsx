import { FC, memo, useState, useEffect, useRef } from 'react';
import useIntersectionObserver from '@react-hook/intersection-observer';
import './background.css';
import { parseStringToJsonList } from 'functions/utils';

interface Props {
  className?: string;
}

const areas = [
  { id: 3, name: 'record', text: 'RECORD' },
  { id: 17, name: 'tracks', text: 'TRACKS' },
  { id: 16, name: 'pingpong', text: 'PingPong' },
  { id: 18, name: 'modulation', text: 'Modulations' },
  { id: 4, name: 'waves', text: 'ALTER WAVEFORM' },
  { id: 15, name: 'envelope', text: 'Envelope' },
  { id: 11, name: 'reset', text: 'RESET' },
  { id: 12, name: 'metronome', text: 'Metronome' },
  { id: 13, name: 'stuff', text: 'Stuff' },
  { id: 14, name: 'octave', text: 'Change OCtave' },
  { id: 20, name: 'global', text: 'Global' },
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

function isPointInsideRectangle(
  x: number,
  y: number,
  rect: { left: number; right: number; top: number; bottom: number }
) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

const Background = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showText, setShowText] = useState('');
  const [showTexts, setShowTexts] = useState([]);
  const effectsToggle = useRef(false);

  const handleMouseOver = (id: string) => {
    setShowText(id);
  };

  const handleMouseOut = () => {
    setShowText('');
  };

  useEffect(() => {
    // Listen for the 'use location' event from the main process

    window.electron.ipcRenderer.on('use-loc', (event, receivedMessage) => {
      // Update the component state with the received message
      // setMessage(receivedMessage);
      // @ts-ignore
      const jsonList = parseStringToJsonList(event);
      const coordinates = jsonList.map((obj: { pos_x: any; pos_y: any }) => {
        return {
          x: obj.pos_x * 2,
          y: obj.pos_y * 2,
        };
      });
      let newText = '';
      if (effectsToggle) {
        // Check if each coordinate is inside any of the rectangles
        for (let i = 0; i < coordinates.length; i++) {
          for (let j = 0; j < areas.length; j++) {
            const rect = document.querySelector(`.rectangle${areas[j].id}`);
            if (rect) {
              const rectBounds = rect.getBoundingClientRect();
              if (
                isPointInsideRectangle(
                  coordinates[i].x,
                  coordinates[i].y,
                  rectBounds
                )
              ) {
                newText += areas[j].name;
                break;
              }
            }
          }
        }
      }
      setShowText(newText);
    });
  });

  return (
    <>
      <div className="rectangle0" />
      {areas.map((rect) => (
        <div
          key={rect.id}
          className={`rectangle${rect.id}`}
          data-text={rect.text}
        >
          {showText.includes(rect.name) && <p>{rect.text}</p>}
        </div>
      ))}
    </>
  );
};

export default Background;
