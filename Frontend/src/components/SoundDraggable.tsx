import { useRef, useState, useEffect, useMemo } from 'react';
import interact from 'interactjs';
import keyMapper from 'functions/keymapper';
import {
  oscillatorTypes,
  notes,
  colours,
  keyboard,
  lightenHexColor,
  hexToRGBA,
} from './constants';
import CanvasComponent from './wrappers/CanvasWrapper';

interface Props {
  parentRef: React.RefObject<HTMLDivElement> | null;
  spawnId: number;
  synth: any;
  x: number;
  y: number;
}

const octave = 4;

const SoundDraggable: React.FC<Props> = ({
  parentRef,
  synth,
  spawnId,
  x = 50,
  y = 50,
}) => {
  console.log('spawned');
  const ref = useRef<SVGSVGElement>(null);
  const initialSpawnIdRef = useRef(spawnId);
  const colour = useMemo(() => colours[spawnId % 12], [spawnId]);
  const colourLight = useMemo(
    () => lightenHexColor(colours[spawnId % 12], 0.4),
    [spawnId]
  );
  const [position, setPosition] = useState({ x, y });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNotes, setPlayingNotes] = useState<string[]>([]);
  const [isSelected, setIsSelected] = useState(false);
  const [oscCtr, setOscCtr] = useState(0);
  const [modOscCtr, setModOscCtr] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasPos, setCanvasPos] = useState<number[]>([]);
  const lines = useRef<
    {
      points: { x: number; y: number }[];
      alpha: number;
      thickness: number;
      color: string;
    }[]
  >([]);
  const currentLine = useRef<{
    points: { x: number; y: number }[];
    alpha: number;
    thickness: number;
    color: string;
  } | null>(null);
  const fadeRate = 0.0006;

  const size = 120;

  const shapesOsc = useMemo(
    () => [
      <path
        fill={colour}
        stroke="white"
        strokeWidth="1"
        className="synth"
        d="M 0.302 64.034 L 4.188 59.308 C 8.071 54.492 15.844 45.17 23.7 43.904 C 31.559 42.728 39.499 49.831 47.415 54.557 C 55.335 59.373 63.227 61.594 71.035 55.757 C 78.842 49.831 86.566 35.628 94.412 33.251 C 102.256 30.964 110.221 40.286 114.204 45.103 L 118.186 49.831 L 117.678 0.115 L 113.743 0.115 C 109.809 0.115 101.941 0.115 94.071 0.115 C 86.203 0.115 78.334 0.115 70.466 0.115 C 62.598 0.115 54.728 0.115 46.859 0.115 C 38.992 0.115 31.122 0.115 23.254 0.115 C 15.383 0.115 7.517 0.115 3.582 0.115 L -0.354 0.115 L 0.302 64.034 Z"
      />, // sine
      <path
        fill={colour}
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.946 68.487 L 39.864 68.774 L 40.204 36.414 L 78.945 35.732 L 79.134 69.483 L 117.935 68.733 L 118.013 36.395 L 117.888 0.135 Z"
      />, // square
      <path
        fill={colour}
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.946 68.487 L 37.737 38.599 L 38.874 71.506 L 83.332 37.726 L 82.59 70.812 L 118.013 36.395 L 117.888 0.135 Z"
      />, // sawtooth
      <polygon
        fill={colour}
        className="synth"
        points="117.888 0.135 5.468 0.135 -0.372 0.247 0.293 63.938 26.31 37.841 53.21 65.143 75.294 36.556 100.588 64.099 118.013 36.395"
      />, // triangle
      <path
        fill={colour}
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L 22.051 36.983 L 22.583 67.577 L 58.547 66.987 L 58.474 37.061 L 118.013 36.395 L 117.888 0.135 Z"
      />, // pulse

      <path
        fill={colour}
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.946 68.487 C 3.453 14.152 42.455 34.142 39.864 68.774 L 40.337 68.45 C 43.06 14.222 83.749 33.702 79.134 69.483 C 81.286 20.578 119.291 34.563 117.935 68.733 L 118.013 36.395 L 117.888 0.135 Z"
      />, // semicircle
      <path
        fill={colour}
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -1.212 69.684 C -3.037 55.347 31.365 41.752 31.775 30.24 C 38.067 45.446 59.513 62.294 57.901 73.832 C 59.505 61.604 86.015 50.557 89.048 31.554 C 90.061 49.724 120.443 57.799 118.481 73.869 L 118.865 74.714 L 118.013 36.395 L 117.888 0.135 Z"
      />, // pointy
      <path
        fill={colour}
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.547 51.738 L 16.888 47.52 L 17.624 69.711 L 39.066 69.572 L 41.533 39.072 L 60.473 38.462 L 61.833 52.895 L 83.597 49.158 L 82.59 70.812 L 99.388 70.46 L 98.394 33.506 L 118.013 36.395 L 117.888 0.135 Z"
      />, // noise
      <path
        fill={colour}
        className="synth"
        d="M 0 32 L 84.771 161.065 L 116.062 202.785 L 254.315 64.266 L 339.087 193.33 L 423.858 257.863 L 423.858 322.394 L 339.087 322.394 L 254.315 322.394 L 169.543 322.394 L 84.771 322.394 L 0 322.394 L 0 32 Z"
      />, // wave
      <path
        fill={colour}
        className="synth"
        d="M 0 254.723 L 1.596 175.255 L 182.296 176.616 L 181.884 176.936 L 183.193 95.521 L 183.193 0 L 274.789 0 L 273.991 179.6 L 367.982 180.399 L 366.386 318.404 L 274.789 318.404 L 183.193 318.404 L 91.596 318.404 L 0 318.404 L 0 254.723 Z"
      />,
    ],
    [oscCtr]
  );

  const shapesMod = useMemo(
    () => [
      <path
        fill={colourLight}
        className="synth"
        d="M 0.302 64.034 L 4.188 59.308 C 8.071 54.492 15.844 45.17 23.7 43.904 C 31.559 42.728 39.499 49.831 47.415 54.557 C 55.335 59.373 63.227 61.594 71.035 55.757 C 78.842 49.831 86.566 35.628 94.412 33.251 C 102.256 30.964 110.221 40.286 114.204 45.103 L 118.186 49.831 L 117.678 0.115 L 113.743 0.115 C 109.809 0.115 101.941 0.115 94.071 0.115 C 86.203 0.115 78.334 0.115 70.466 0.115 C 62.598 0.115 54.728 0.115 46.859 0.115 C 38.992 0.115 31.122 0.115 23.254 0.115 C 15.383 0.115 7.517 0.115 3.582 0.115 L -0.354 0.115 L 0.302 64.034 Z"
      />, // wave
      <rect
        fill={colourLight}
        className="synth"
        x="10"
        y="10"
        width={size / 2}
        height={size / 2}
      />,
      <path fill={colourLight} className="synth" d="M3 3 L3 25 L23 14 z" />,
      <path
        fill={colourLight}
        className="synth"
        d="M 0 32 L 84.771 161.065 L 116.062 202.785 L 254.315 64.266 L 339.087 193.33 L 423.858 257.863 L 423.858 322.394 L 339.087 322.394 L 254.315 322.394 L 169.543 322.394 L 84.771 322.394 L 0 322.394 L 0 32 Z"
      />, // wave
      <path
        fill={colourLight}
        className="synth"
        d="M 0 254.723 L 1.596 175.255 L 182.296 176.616 L 181.884 176.936 L 183.193 95.521 L 183.193 0 L 274.789 0 L 273.991 179.6 L 367.982 180.399 L 366.386 318.404 L 274.789 318.404 L 183.193 318.404 L 91.596 318.404 L 0 318.404 L 0 254.723 Z"
      />,
    ],
    [modOscCtr]
  );

  useEffect(() => {
    if (spawnId !== initialSpawnIdRef.current) {
      // Ignore subsequent spawnId values
    }
  }, [spawnId, initialSpawnIdRef]);

  useEffect(() => {
    const rectangleElements = document.querySelectorAll('[class^="rectangle"]');
    if (rectangleElements.length > 0) {
      rectangleElements.forEach((rectangleElement) => {
        const number = parseInt(
          rectangleElement.className.replace('rectangle', '')
        );
        const position = rectangleElement.getBoundingClientRect();
        if (number === 0) {
          setCanvasPos([position.left, position.top]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    let drawing = false;
    canvas.width = 980;
    canvas.height = 500;

    const startDrawing = (e: MouseEvent) => {
      drawing = true;
      const { clientX, clientY } = e;
      const { left, top } = canvas.getBoundingClientRect();
      const offsetX = clientX - left;
      const offsetY = clientY - top;
      const rgbaColor = hexToRGBA(colour, 0.6);
      currentLine.current = {
        points: [{ x: offsetX, y: offsetY }],
        alpha: 1,
        thickness: 10,
        color: rgbaColor,
      };
    };

    const drawLine = (e: MouseEvent) => {
      if (!drawing || !currentLine.current) return;

      const { clientX, clientY } = e;
      const { left, top } = canvas.getBoundingClientRect();
      const offsetX = clientX - left;
      const offsetY = clientY - top;
      const newPoint = { x: offsetX, y: offsetY };
      currentLine.current.points = [...currentLine.current.points, newPoint];
      drawLines();
    };

    const endDrawing = () => {
      if (!drawing || !currentLine.current) return;
      drawing = false;
      lines.current = [...lines.current, { ...currentLine.current }];
      currentLine.current = null;
    };

    const drawLines = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      lines.current.forEach((line) => {
        context.beginPath();
        context.moveTo(line.points[0].x, line.points[0].y);

        line.points.forEach((point) => {
          context.lineTo(point.x, point.y);
        });

        context.strokeStyle = line.color;
        context.lineWidth = line.thickness;
        context.lineCap = 'round';
        context.stroke();
      });

      if (currentLine.current && currentLine.current.points.length > 1) {
        context.beginPath();
        context.moveTo(
          currentLine.current.points[0].x,
          currentLine.current.points[0].y
        );

        currentLine.current.points.forEach((point) => {
          context.lineTo(point.x, point.y);
        });

        context.strokeStyle = currentLine.current.color;
        context.lineWidth = currentLine.current.thickness;
        context.lineCap = 'round';
        context.stroke();
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);

      lines.current.forEach((line) => {
        line.thickness += 0.5; // Adjust the thickness increment here
        line.alpha -= fadeRate; // Adjust the alpha decrement here
        if (line.alpha <= 0) {
          // Remove the line if its alpha becomes less than or equal to 0
          lines.current = lines.current.filter((l) => l !== line);
        } else {
          // Modify the line's color alpha component based on its current alpha value
          line.color = `rgba(${line.color},${line.alpha})`;
        }
      });

      drawLines();
    };

    animate();
    const elements = document.querySelectorAll('[data-spawn-id]');
    elements.forEach((element) => {
      if (element.getAttribute('data-spawn-id') === spawnId.toString()) {
        element.addEventListener('mousedown', startDrawing as EventListener);
        element.addEventListener('mousemove', drawLine as EventListener);
        element.addEventListener('mouseup', endDrawing);
        element.addEventListener('mouseout', endDrawing);
      }
    });
    return () => {
      // Cleanup function to remove event listeners
      elements.forEach((element) => {
        console.log('bye');
        if (element.getAttribute('data-spawn-id') === spawnId.toString()) {
          element.removeEventListener(
            'mousedown',
            startDrawing as EventListener
          );
          element.removeEventListener('mousemove', drawLine as EventListener);
          element.removeEventListener('mouseup', endDrawing);
          element.removeEventListener('mouseout', endDrawing);
        }
      });
    };
  }, []);

  useEffect(() => {
    const keysPressed: { [key: string]: boolean } = {};
    const handleKeyDown = (event: { key: string; code: string }) => {
      keysPressed[event.code] = true;
      if (keyMapper(event.key, 0) === spawnId) {
        setIsSelected(true);
        if (keysPressed.Space) {
          console.log(keysPressed);
          synth.set({
            oscillator: { type: oscillatorTypes[oscCtr] },
          });
          setOscCtr((oscCtr + 1) % oscillatorTypes.length);
        }
        if (keysPressed.ShiftLeft) {
          console.log(keysPressed);
          synth.set({
            modulation: { type: oscillatorTypes[modOscCtr] },
          });
          console.log(synth);
          setModOscCtr((modOscCtr + 1) % oscillatorTypes.length);
        }
        const note = notes[spawnId % 12] + (octave + Math.floor(spawnId / 12));
        if (!playingNotes.includes(note)) {
          setIsPlaying(true);
          synth.triggerAttack(note);
          setPlayingNotes([...playingNotes, note]);
        }
      }
      if (keysPressed.ShiftRight) {
        console.log(keysPressed);
        synth.set({
          oscillator: { type: oscillatorTypes[0] },
          modulation: { type: oscillatorTypes[0] },
        });
        setOscCtr(0);
        setModOscCtr(0);
      }
    };
    const handleKeyUp = (event: { key: string; code: string }) => {
      keysPressed[event.code] = false;
      if (keyMapper(event.key, 0) === spawnId) {
        setIsPlaying(false);
        setIsSelected(false);
        setPlayingNotes([]);
        // synth.releaseAll();
        synth.triggerRelease();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    // cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, modOscCtr, oscCtr, playingNotes, spawnId, synth]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !parentRef?.current) {
      return;
    }

    interact(element)
      .draggable({
        modifiers: [
          interact.modifiers.restrict({
            restriction: 'parent',
            endOnly: true,
          }),
        ],
        listeners: {
          start(event) {},
          move(event) {
            const { target } = event;
            const x =
              (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y =
              (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

            setPosition((prevPosition) => ({
              x: prevPosition.x + event.dx,
              y: prevPosition.y + event.dy,
            }));
          },
          end(event) {},
        },
      })
      .on('mousedown', (event) => {
        console.log('mousedown');
        if (!isPlaying) {
          try {
            synth.triggerAttack(
              notes[spawnId % 12] + (octave + Math.floor(spawnId / 12))
            );
          } catch (err) {
            console.log(err);
            synth.triggerRelease(0);
            synth.triggerAttack(
              notes[spawnId % 12] + (octave + Math.floor(spawnId / 12))
            );
          }
          setIsPlaying(true);
        }
      })
      .on('mouseup', (event) => {
        setIsPlaying(!isPlaying);
        setIsSelected(false);
        synth.triggerRelease();
      });
  }, [parentRef, isPlaying, position, spawnId, synth, isSelected]);

  useEffect(() => {
    const handleMouseDown = () => {
      const svgElement = ref.current;
      if (!isSelected && svgElement) {
        const { x, y } = svgElement.getBoundingClientRect() ?? { x: 0, y: 0 };
        const elemWave = document
          .querySelector('.rectangle4')
          ?.getBoundingClientRect();
        const elemMod = document
          .querySelector('.rectangle15')
          ?.getBoundingClientRect();
        if (
          elemWave &&
          x > elemWave.left &&
          x < elemWave.right &&
          y > elemWave.top &&
          y < elemWave.bottom
        ) {
          const newOscillator = (oscCtr + 1) % oscillatorTypes.length;
          synth.set({
            oscillator: { type: oscillatorTypes[newOscillator] },
          });
          setOscCtr(newOscillator);
          // Set the flag to indicate that the effect has been executed
          setIsSelected(true);
        } else if (
          elemMod &&
          x > elemMod.left &&
          x < elemMod.right &&
          y > elemMod.top &&
          y < elemMod.bottom
        ) {
          const newOscillator = (modOscCtr + 1) % oscillatorTypes.length;
          synth.set({
            modulation: { type: oscillatorTypes[newOscillator] },
          });
          setOscCtr(newOscillator);
          // Set the flag to indicate that the effect has been executed
          setIsSelected(true);
        }
      }
    };
    const svgElement = ref.current;
    // Attach the event listener
    if (svgElement) {
      svgElement.addEventListener('mousedown', handleMouseDown);
    }

    // Clean up the event listener
    return () => {
      if (svgElement) {
        svgElement.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [ref, isSelected]);

  return (
    <>
      <svg
        data-testid="sound-object"
        data-spawn-id={spawnId}
        ref={ref}
        width="130"
        viewBox="0 0 120 120"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          zIndex: 1,
        }}
      >
        {/* <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polygon
          className="synth"
          points="36,0,47.16791979355699,20.628677106875998,70.23803458662553,24.87538820250189,54.07007380960792,41.871322893124,57.16026908252904,65.1246117974981,36,55,14.83973091747097,65.1246117974981,17.929926190392084,41.871322893124,1.7619654133744689,24.8753882025019,24.832080206443006,20.628677106876"
          fill={colour}
          filter={isSelected ? 'url(#glow)' : ''}
        /> */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="circle-clip">
            <circle cx={size / 2} cy={size / 2} r={size / 2} />
          </clipPath>
        </defs>
        {/* <rect x={0} y={0} width={size * 2} height={size * 2} fill={colourLight || '#ffff00'}/> for chords or fm */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          stroke="white"
          strokeWidth="1"
          fill={colourLight || '#ffff00'}
          filter={isSelected ? 'url(#glow)' : ''}
        />
        {/* <circle cx={size / 2} cy={size / 2} r={size / 2.4} stroke="white" strokeWidth="1" fill={colour || '#ffff00'} />
      <circle cx={size / 2} cy={size / 2} r={size / 3} stroke="white" strokeWidth="1" fill={colourLight || '#ffff00'} />
      <circle cx={size / 2} cy={size / 2} r={size / 4} stroke="white" strokeWidth="1" fill={colour || '#ffff00'} />  for echo */}
        <g clipPath="url(#circle-clip)">
          {/* <circle cx={size/4} cy={size *2/3} r={size / 6} stroke="white" strokeWidth="1" fill={colour || '#ffff00'} />
      <circle cx={size *2/4} cy={size *2/3} r={size / 6} stroke="white" strokeWidth="1" fill={colourLight || '#ffff00'} />
      <circle cx={size *3/4} cy={size *2/3} r={size / 6} stroke="white" strokeWidth="1" fill={colour || '#ffff00'} />  for chord 1 */}
          {/* <circle cx={size/4} cy={size *2/3} r={size / 6} stroke="white" strokeWidth="1" fill={colour || '#ffff00'} />
      <circle cx={size *2/4} cy={size *3/4} r={size / 6} stroke="white" strokeWidth="1" fill={colourLight || '#ffff00'} />
      <circle cx={size *3/4} cy={size *2/3} r={size / 6} stroke="white" strokeWidth="1" fill={colour || '#ffff00'} />   for chord 2 */}

          {/* <rect x={0} y={0} width={size * 2} height={size * 2} fill={colour || '#ffff00'}  stroke="white" strokeWidth="1" /> 
      <rect x={size*1/4} y={0} width={size * 2} height={size * 2} fill={colourLight || '#ffff00'}  stroke="white" strokeWidth="1" /> 
        <rect x={size*2/4} y={0} width={size * 2} height={size * 2} fill={colour || '#ffff00'}  stroke="white" strokeWidth="1" /> 
        <rect x={size*3/4} y={0} width={size * 2} height={size * 2} fill={colourLight || '#ffff00'}  stroke="white" strokeWidth="1" />  for trem */}
          {shapesOsc[oscCtr]}
        </g>
        <text x="50" y="65" style={{ fill: 'white', fontSize: '30px' }}>
          {keyboard[spawnId % 12]}
        </text>
      </svg>

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: `${canvasPos[0] + 150}px`,
          top: `${canvasPos[1] + 150}px`,
          zIndex: 0,
        }}
      />
    </>
  );
};

export default SoundDraggable;
