import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  MouseEventHandler,
} from 'react';
import * as ini from 'ini';
import './background.css';
import Instructions from './Instructions';
import SoundObject from './SoundObject';

import {
  parseStringToJsonList,
  calculateDisplacement,
} from '../functions/utils';

const location = {
  x: 50,
  y: 50,
};

interface JsonObject {
  id: number;
  obj: string;
  action: string;
  pos_x: number;
  pos_y: number;
}

interface Props {
  parentRef: React.RefObject<HTMLDivElement>;
  actx: any;
}

const dialSize = [50, 50];

let disp_x = 0;
let disp_y = 0;

const readIniFile = () => {
  window.electron.ipcRenderer
    .invoke('read-ini-file', './src/components/config.ini')
    .then((data) => {
      // Process the contents of the .ini file
      // @ts-ignore
      const parsedIni = ini.parse(data);
      console.log(parsedIni);
      disp_x = parseInt(parsedIni.GENERAL.disp_x);
      disp_y = parseInt(parsedIni.GENERAL.disp_y);
      console.log(disp_x, disp_y);
    })
    .catch((err) => {
      console.error('Error reading .ini file:', err);
    });
};

// readIniFile();

const k = 2;
const a = 10;

const SpawnSoundObject: React.FC<Props> = ({ parentRef, actx }) => {
  const [showText, setShowText] = useState(true);
  const [displayText, setDisplayText] = useState('Place an object here...');
  const [displayTextColor, setDisplayTextColour] = useState('black');
  const [count, setCount] = React.useState(0);
  const [components, setComponents] = useState<JSX.Element[]>([]);
  const [posInit, setPosInit] = useState(false);
  const [metronomePos, setMetronomePos] = React.useState<number[]>([]);
  useEffect(() => {
    if (showText) {
      const timeout = setTimeout(() => {
        setShowText(false);
      }, 10000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [showText]);
  useEffect(() => {
    // Listen for the 'use-loc' event from the main process
    const listener = window.electron.ipcRenderer.on(
      'use-loc',
      (event, receivedMessage) => {
        // Update the component state with the received message
        // @ts-ignore
        const parsedJsonList = parseStringToJsonList(event);
        setCount(count + 1);
        // @ts-ignore
        if (event.includes('circle')) {
          setDisplayText(
            'Move the object around!  \n Close your hand to toggle effects. Move the objects to the areas to change the sound.'
          );
          setDisplayTextColour('black');
        } else {
          setDisplayText('Place an object here...');
          setDisplayTextColour('black');
        }


        if (parsedJsonList.length > 0) {
          setComponents((prevComponents) => {
            // Create a new array to hold the updated components
            const updatedComponents = [...prevComponents];
            // Iterate through the parsed JSON objects
            parsedJsonList.forEach((obj: JsonObject) => {
              if (obj.obj == 'circle') {
                // Find the index of the component in the updatedComponents array
                const index = updatedComponents.findIndex(
                  (component) => component.props.spawnId === obj.id
                );
    
                const adjusted_x = obj.pos_x; /// + calculateDisplacement(obj.pos_x, 320 + disp_x, 10, a)
                const adjusted_y = obj.pos_y; // +disp_y/2.5+ calculateDisplacement(obj.pos_y, disp_y, k, a)///-disp_y//+ calculateDisplacement(obj.pos_y, disp_y, k, a)
                if (index !== -1) {
                  updatedComponents[index] = React.cloneElement(
                    updatedComponents[index],
                    {
                      // Replace the action,  pos_x and pos_y props of the existing component
                      action: obj.action,
                      pos_x: adjusted_x,
                      pos_y: adjusted_y,
                    }
                  );
                } else {
                  updatedComponents.push(
                    <SoundObject
                      key={obj.id} // Add key prop to ensure React can track the components correctly
                      spawnId={obj.id}
                      pos_x={adjusted_x}
                      pos_y={adjusted_y}
                    />
                  );
                }
              }
            });

            // Remove components that no longer exist in the parsed JSON objects
            const existingObjKeys = new Set(
              parsedJsonList.map((obj: JsonObject) => obj.id)
            );
            const filteredComponents = updatedComponents.filter((component) =>
              existingObjKeys.has(component.props.spawnId)
            );

            return filteredComponents;
          });
        } else {
          setComponents([]);
          setDisplayText('Place an object here...');
          setDisplayTextColour('black');
        }
      }
    );

    const listenerEffect = window.electron.ipcRenderer.on(
      'effects-toggle',
      (event, receivedMessage) => {
        // @ts-ignore
        const jsonList = parseStringToJsonList(event);
        if (jsonList.at(-1)['effects-toggle'] === 'True') {
          setDisplayText('Use one finger to decrement and two fingers to increment!\n Rotate your finger clockwise and anticlockwise to undo and redo the effect changes.');
        }
      }
    );
    // Clean up the event listener when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeListener('use-loc', listener);
      window.electron.ipcRenderer.removeListener('effects-toggle', listenerEffect);
    };
  }, []);



  return (
    <div className="spawn-sound-object">
      {components.map((component) => component)}
      {showText && <Instructions text={displayText} color={displayTextColor} />}
    </div>
  );
};

export default SpawnSoundObject;
