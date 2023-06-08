import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  MouseEventHandler,
} from 'react';
import interact from 'interactjs';
import * as Tone from 'tone';
import './background.css';
import SoundDraggable from './SoundDraggable';
import ModulationADSR from './wrappers/ModulationWrapper';
import ReverbControl from './wrappers/ReverbWrapper';
import PingPongControl from './wrappers/PingPongWrapper';
import TremoloControl from './wrappers/TremoloWrapper';
import VibratoControl from './wrappers/VibratoWrapper';
import DistortionControl from './wrappers/DistortionWrapper';
import ChebyshevControl from './wrappers/ChebyshevWrapper';
import FrequencyShiftControl from './wrappers/FrequencyShifterWrapper';
import SynthRecorder from './wrappers/RecorderWrapper';
import VolumeControl from './wrappers/VolumeWrapper';
import Metronome from './wrappers/MetronomeWrapper';
import CanvasComponent from './wrappers/CanvasWrapper';
import BitCrusherControl from './wrappers/BitCrusherWrapper';
import ResetButton from './wrappers/ResetButton';
import SVGWaves from './wrappers/Waves';

interface Props {
  parentRef: React.RefObject<HTMLDivElement>;
  // colour?: string;
}

const SpawnSoundDraggable: React.FC<Props> = ({ parentRef }) => {
  const actx = Tone.context;
  const dest = actx.createMediaStreamDestination();
  const recorder = new MediaRecorder(dest.stream);
  const dialSize = [50, 50];
  const chebyshevObj = useMemo(
    () => new Tone.Chebyshev(50).toDestination(),
    []
  );
  const [count, setCount] = React.useState(0);
  const [components, setComponents] = useState<JSX.Element[]>([]);
  const [posInit, setPosInit] = useState(false);
  const [spawnerPos, setSpawnerPos] = React.useState<number[]>([]);
  const [envPos, setEnvPos] = React.useState<number[]>([]);
  const [pingPongPos, setPingPongPos] = React.useState<number[]>([]);
  const [vibPos, setVibPos] = React.useState<number[]>([]);
  const [freqShiftPos, setFreqShiftPos] = React.useState<number[]>([]);
  const [revPos, setRevPos] = React.useState<number[]>([]);
  const [metronomePos, setMetronomePos] = React.useState<number[]>([]);
  const [bottomPanePos, setBottomPanePos] = React.useState<number[]>([]);
  const [soundOscPos, setSoundOscPos] = React.useState<number[]>([]);
  const [modOscPos, setModOscPos] = React.useState<number[]>([]);
  const binRef = useRef<HTMLDivElement>(null);
  const [spawnedSynths, setSpawnedSynths] = useState<Tone.FMSynth[]>([]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setCount(count + 1);
    // add a new component to the existing components
    const spawnedSynth = new Tone.FMSynth().toDestination();
    spawnedSynth.set({
      modulationIndex: 50,
      modulation: { type: 'triangle' },
    });
    setSpawnedSynths([...spawnedSynths, spawnedSynth]);
    const newComponent = (
      <SoundDraggable
        parentRef={parentRef}
        synth={spawnedSynth}
        spawnId={count}
        x={e.clientX}
        y={e.clientY}
      />
    );
    setComponents([...components, newComponent]);
  };

  if (binRef?.current) {
    interact(binRef.current).dropzone({
      ondrop: (event) => {
        const componentIndex = Number(
          event.relatedTarget.getAttribute('data-spawn-id')
        );
        console.log(count);
        console.log('delete ', componentIndex);
        for (let c = 0; c < components.length; c += 1) {
          console.log(components[c].props);
        }
        // remove the spawn id of the thing to be deleted - it should delete that but it is not deleting it
        setComponents((prevComponents) =>
          prevComponents.filter((c) => c.props.spawnId !== componentIndex)
        );
      },
    });
  }

  useEffect(() => {
    const rectangleElements = document.querySelectorAll('[class^="rectangle"]');
    if (rectangleElements.length > 0) {
      setPosInit(true);
      rectangleElements.forEach((rectangleElement) => {
        const number = parseInt(
          rectangleElement.className.replace('rectangle', '')
        );
        const position = rectangleElement.getBoundingClientRect();
        if (number === 11) {
          setSpawnerPos([position.left, position.top, position.width]);
        } else if (number === 12) {
          setEnvPos([position.left, position.top, position.width]);
        } else if (number === 3) {
          setPingPongPos([position.left, position.top, position.width]);
        } else if (number === 17) {
          setVibPos([position.left, position.top, position.width]);
        } else if (number === 13) {
          setFreqShiftPos([position.left, position.top, position.width]);
        } else if (number === 18) {
          setRevPos([position.left, position.top, position.width]);
        } else if (number === 20) {
          setBottomPanePos([position.left, position.top, position.width]);
        } else if (number === 14) {
          setMetronomePos([position.left, position.top, position.width]);
        } else if (number === 4) {
          setSoundOscPos([position.left, position.top, position.width]);
        } else if (number === 15) {
          setModOscPos([position.left, position.top, position.width]);
        }
      });
    }
  }, []); // run once on start up

  const memoizedComponents = useMemo(() => {
    return components.map((component, index) => (
      <SoundDraggable
        key={index}
        spawnId={component.props.spawnId}
        synth={spawnedSynths[component.props.spawnId]}
        parentRef={component.props.parentRef}
        x={component.props.x}
        y={component.props.y}
      />
    ));
  }, [components, spawnedSynths]);

  return (
    <>
      {posInit ? (
        <div className="row" data-testid="spawner">
          <button
            type="button"
            onClick={handleClick}
            style={{
              position: 'absolute',
              left: `${spawnerPos[0] + 10}px`,
              top: `${spawnerPos[1] + 10}px`,
            }}
          >
            Add Note
          </button>
          <div
            style={{
              position: 'absolute',
              left: `${spawnerPos[0] + 10}px`,
              top: `${spawnerPos[1] + 50}px`,
            }}
          >
            <VolumeControl synths={spawnedSynths} sliderArea={[120, 20]} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${bottomPanePos[0] + 10}px`,
              top: `${bottomPanePos[1] + 20}px`,
            }}
          >
            <div className="row">
              <SynthRecorder
                trackId={1}
                synths={spawnedSynths}
                dest={dest}
                recorder={recorder}
                initialDuration={60}
              />
              <SynthRecorder
                trackId={2}
                synths={spawnedSynths}
                dest={dest}
                recorder={recorder}
                initialDuration={60}
              />
              <SynthRecorder
                trackId={3}
                synths={spawnedSynths}
                dest={dest}
                recorder={recorder}
                initialDuration={60}
              />
              <SynthRecorder
                trackId={4}
                synths={spawnedSynths}
                dest={dest}
                recorder={recorder}
                initialDuration={60}
              />
              <SynthRecorder
                trackId={5}
                synths={spawnedSynths}
                dest={dest}
                recorder={recorder}
                initialDuration={60}
              />
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${envPos[0] - 50}px`,
              top: `${envPos[1] + 10}px`,
            }}
          >
            <ModulationADSR synths={spawnedSynths} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${pingPongPos[0] + 20}px`,
              top: `${pingPongPos[1] - 10}px`,
            }}
          >
            <PingPongControl
              synths={spawnedSynths}
              dest={dest}
              dialSize={dialSize}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${vibPos[0] + 20}px`,
              top: `${vibPos[1] + 15}px`,
            }}
          >
            {' '}
            <ResetButton />
            <VibratoControl
              synths={spawnedSynths}
              dest={dest}
              dialSize={dialSize}
            />
            <TremoloControl
              synths={spawnedSynths}
              dest={dest}
              dialSize={dialSize}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${freqShiftPos[0] + 20}px`,
              top: `${freqShiftPos[1]}px`,
            }}
          >
            <FrequencyShiftControl
              synths={spawnedSynths}
              dest={dest}
              dialSize={dialSize}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              left: `${revPos[0]}px`,
              top: `${revPos[1] - 10}px`,
            }}
          >
            <div className="row">
              <div style={{ marginRight: '20px' }}>
                <ReverbControl
                  synths={spawnedSynths}
                  dest={dest}
                  dialSize={dialSize}
                />
              </div>
              <DistortionControl
                synths={spawnedSynths}
                dest={dest}
                dialSize={dialSize}
              />
            </div>
            <ChebyshevControl
              synths={spawnedSynths}
              dest={dest}
              Chebyshev={chebyshevObj}
              dialSize={dialSize}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${metronomePos[0]}px`,
              top: `${metronomePos[1] - 10}px`,
            }}
          >
            <Metronome />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${soundOscPos[0]}px`,
              top: `${soundOscPos[1] + 10}px`,
              width: `${soundOscPos[2]}px`,
            }}
          >
            WAVES
            <SVGWaves />
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${modOscPos[0]}px`,
              top: `${modOscPos[1] + 10}px`,
              width: `${modOscPos[2]}px`,
            }}
          >
            FILTERS | ENVELOPE
            <SVGWaves />
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}

      <div
        style={{
          position: 'fixed',
          left: 50,
          top: 100,
        }}
      />

      {/* bitcrusher doesnt work yet */}
      {/* <BitCrusherControl synths={spawnedSynths}/> */}

      {/* return all of the components */}
      {memoizedComponents}
    </>
  );
};

export default SpawnSoundDraggable;
