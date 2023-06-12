import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import * as ini from 'ini';
import { oscillatorTypes, notes, colours, lightenHexColor } from './constants';
import { parseStringToJsonList } from '../functions/utils';
import './background.css';

interface Props {
  spawnId: number;
  pos_x: number;
  pos_y: number;
  action?: string;
  size?: number;
}
interface waveObject {
  id: number;
  wave: number;
  fm_mod: number;
  octave: number;
  amp: number;
  bias: number;
  tremolo_wave: number;
  tremolo_rate: number;
  tremolo_depth: number;
  echo: number;
  echo_amount: number;
  echo_delay: number;
  echo_decay: number;
  currently_playing: string;
  chords: number;
}

const disp_x = 0;
const disp_y = 0;

// constants that will never change
const waves = [
  'sine',
  'triangle',
  'pulse',
  'sawtooth',
  'square',
  'semicircle',
  'pointy',
  'noise',
];
const chordLetters = ['none', 'maj3', 'maj7'];

const SoundObject: React.FC<Props> = ({
  spawnId,
  pos_x,
  pos_y,
  action = 'stationary',
  size = 130,
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const [position, setPosition] = useState({ pos_x, pos_y });
  const [colour, setColour] = useState<string>(colours[spawnId % 12]);
  const currSize = useRef(size);
  const [colourLight, setColourLight] = useState<string>(
    lightenHexColor(colours[spawnId % 12], 0.4)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNotes, setPlayingNotes] = useState<string[]>([]);
  const [isSelected, setIsSelected] = useState(false);
  const [prevAction, setPrevAction] = useState('stationary');
  const [touch, setTouch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Effects - the actionable IMPLEMENTED EFFECTS ARE:
  // VOLUME, FM, BIAS, ECHO, CHORD, WAVE, OCTAVE, TREMOLO
  const volumeRef = useRef<DOMRect | null>(null);
  const fmRef = useRef<DOMRect | null>(null);
  const biasRef = useRef<DOMRect | null>(null);
  const echoRef = useRef<DOMRect | null>(null);
  const chordRef = useRef<DOMRect | null>(null);
  const waveRef = useRef<DOMRect | null>(null);
  const octaveRef = useRef<DOMRect | null>(null);
  const tremoloRef = useRef<DOMRect | null>(null);

  const inVolume = useRef(false);
  const inFM = useRef(false);
  const inBias = useRef(false);
  const inEcho = useRef(false);
  const inChord = useRef(false);
  const inWaveform = useRef(false);
  const inOctave = useRef(false);
  const inTremolo = useRef(false);

  const oscCtr = useRef(0);
  const modOscCtr = useRef(0);
  const octave = useRef(3);
  const chords = useRef(0);
  const amp = useRef(1);
  const bias = useRef(0);
  const tremoloWave = useRef(0);
  const tremoloDepth = useRef(0);
  const echo = useRef(0);
  const echoAmount = useRef(0);
  const echoDelay = useRef(0);
  const echoDecay = useRef(0);
  const currentlyPlaying = useRef('');

  const sf = 2;
  // constants that may change. useMemo is used to optimize the rendering of functional components by preventing unnecessary re-renders when the component's props haven't changed
  const shapesOsc = useMemo(
    () => [
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 2.757 76.8408 L 9.282 70.1416 C 16.5445 63.4164 27.816 51.6736 37.8735 49.2928 C 47.8265 46.7008 57.7995 59.7972 67.3725 66.8496 C 76.9475 73.802 86.586 78.3892 96.1665 69.7896 C 105.747 61.19 115.426 47.1936 124.551 44.19 C 133.675 41.1864 142.314 55.5496 148.038 62.848 L 153.763 70.1464 L 152.22 0.1368 L 146.119 0.1368 C 140.018 0.1368 129.816 0.1368 119.618 0.1368 C 109.418 0.1368 99.2175 0.1368 89.017 0.1368 C 78.8165 0.1368 68.616 0.1368 58.4155 0.1368 C 48.216 0.1368 38.0155 0.1368 27.815 0.1368 C 17.6145 0.1368 7.415 0.1368 2.3145 0.1368 L -2.786 0.1368 L 2.757 76.8408 Z"

      />, // sine
      <polygon
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        points="117.888 0.135 5.468 0.135 -0.372 0.247 0.293 63.938 26.31 37.841 53.21 65.143 75.294 36.556 100.588 64.099 118.013 36.395"
      />, // triangle
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L 22.051 36.983 L 22.583 67.577 L 58.547 66.987 L 58.474 37.061 L 118.013 36.395 L 117.888 0.135 Z"
      />, // pulse
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 119.888 0.135 L 7.468 0.135 L 1.628 0.247 L 1.033 37.148 L 1.054 68.487 L 39.737 38.599 L 40.874 71.506 L 85.332 37.726 L 84.59 70.812 L 120.013 36.395 L 119.888 0.135 Z"
      />, // sawtooth
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        //d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.946 68.487 L 39.864 68.774 L 40.204 36.414 L 78.945 35.732 L 79.134 69.483 L 117.935 68.733 L 118.013 36.395 L 117.888 0.135 Z"
        d="M 124.888 0.135 L 12.468 0.135 L 6.628 0.247 L 6.033 37.148 L 6.054 68.487 L 46.864 68.774 L 47.204 36.414 L 85.945 35.732 L 86.134 69.483 L 124.935 68.733 L 125.013 36.395 L 124.888 0.135 Z"
      />, // square
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 135.066 0.155 L 6.262 0.155 L -0.429 0.284 L -1.112 42.617 L -1.090 78.761 C 3.971 16.465 48.824 39.269 45.853 79.185 L 46.388 78.817 C 49.119 16.468 96.112 38.737 91.014 79.905 C 93.385 23.665 137.085 39.743 135.577 79.046 L 135.915 42.058 L 135.066 0.155 Z"
        //d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.946 68.487 C 3.453 14.152 42.455 34.142 39.864 68.774 L 40.337 68.45 C 43.06 14.222 83.749 33.702 79.134 69.483 C 81.286 20.578 119.291 34.563 117.935 68.733 L 118.013 36.395 L 117.888 0.135 Z"
      />, // semicircle
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -1.212 69.684 C -3.037 55.347 31.365 41.752 31.775 30.24 C 38.067 45.446 59.513 62.294 57.901 73.832 C 59.505 61.604 86.015 50.557 89.048 31.554 C 90.061 49.724 120.443 57.799 118.481 73.869 L 118.865 74.714 L 118.013 36.395 L 117.888 0.135 Z"
      />, // pointy
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 117.888 0.135 L 5.468 0.135 L -0.372 0.247 L -0.967 37.148 L -0.547 51.738 L 16.888 47.52 L 17.624 69.711 L 39.066 69.572 L 41.533 39.072 L 60.473 38.462 L 61.833 52.895 L 83.597 49.158 L 82.59 70.812 L 99.388 70.46 L 98.394 33.506 L 118.013 36.395 L 117.888 0.135 Z"
      />, // noise
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 0 32 L 84.771 161.065 L 116.062 202.785 L 254.315 64.266 L 339.087 193.33 L 423.858 257.863 L 423.858 322.394 L 339.087 322.394 L 254.315 322.394 L 169.543 322.394 L 84.771 322.394 L 0 322.394 L 0 32 Z"
      />, // wave
      <path
        fill={colour}
        stroke="#ffffff"
        strokeWidth="2"
        className="synth"
        d="M 0 254.723 L 1.596 175.255 L 182.296 176.616 L 181.884 176.936 L 183.193 95.521 L 183.193 0 L 274.789 0 L 273.991 179.6 L 367.982 180.399 L 366.386 318.404 L 274.789 318.404 L 183.193 318.404 L 91.596 318.404 L 0 318.404 L 0 254.723 Z"
      />,
    ],
    [colour]
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
    [colourLight, size]
  );

  const shapesChords = useMemo(
    () => [
      <></>,
      <>
        <circle
          cx={size / 4}
          cy={(size * 2) / 3}
          r={size / 6}
          stroke="white"
          strokeWidth="1"
          fill={colour || '#ffff00'}
        />
        <circle
          cx={(size * 2) / 4}
          cy={(size * 2) / 3}
          r={size / 6}
          stroke="white"
          strokeWidth="1"
          fill={colourLight || '#ffff00'}
        />
        <circle
          cx={(size * 3) / 4}
          cy={(size * 2) / 3}
          r={size / 6}
          stroke="white"
          strokeWidth="1"
          fill={colour || '#ffff00'}
        />{' '}
      </>,
      <>
        <circle
          cx={size / 4}
          cy={(size * 2) / 3}
          r={size / 6}
          stroke="white"
          strokeWidth="1"
          fill={colour || '#ffff00'}
        />
        <circle
          cx={(size * 2) / 4}
          cy={(size * 3) / 4}
          r={size / 6}
          stroke="white"
          strokeWidth="1"
          fill={colourLight || '#ffff00'}
        />
        <circle
          cx={(size * 3) / 4}
          cy={(size * 2) / 3}
          r={size / 6}
          stroke="white"
          strokeWidth="1"
          fill={colour || '#ffff00'}
        />{' '}
      </>,
    ],
    [colour, colourLight, size]
  );

  useEffect(() => {
    volumeRef.current = document
      .querySelector('.rectangle101')
      ?.getBoundingClientRect() as DOMRect;
    fmRef.current = document
      .querySelector('.rectangle102')
      ?.getBoundingClientRect() as DOMRect;
    biasRef.current = document
      .querySelector('.rectangle103')
      ?.getBoundingClientRect() as DOMRect;
    echoRef.current = document
      .querySelector('.rectangle104')
      ?.getBoundingClientRect() as DOMRect;
    chordRef.current = document
      .querySelector('.rectangle105')
      ?.getBoundingClientRect() as DOMRect;
    waveRef.current = document
      .querySelector('.rectangle106')
      ?.getBoundingClientRect() as DOMRect;
    octaveRef.current = document
      .querySelector('.rectangle107')
      ?.getBoundingClientRect() as DOMRect;
    tremoloRef.current = document
      .querySelector('.rectangle108')
      ?.getBoundingClientRect() as DOMRect;
  }, [size]);

  useLayoutEffect(() => {
    if (touch) {
      const note =
        notes[spawnId % 12] + (octave.current + Math.floor(spawnId / 12));
      if (!isPlaying) {
        setIsPlaying(true);
      }
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = 1280;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return;
        }
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = pos_x * 2 + size / 2;
        const centerY = pos_y * 2 + size / 2;
        let radius = (size - 10) / 2;
        const maxRadius = radius * 2;


        function drawRotatingSquare(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const rotationSpeed = 1;
          const squareSize = 100 + radius; // Adjust the size of the square based on the radius
          const rotationAngle = rotationSpeed * radius; // Adjust the rotation angle based on the radius

          // Clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Translate to the center of the square
          ctx.translate(centerX, centerY);

          // Rotate the canvas by the rotation angle
          ctx.rotate((rotationAngle * Math.PI) / 180);

          // Draw the square
          ctx.fillStyle = colourLight; // Adjust the color for the square
          ctx.fillRect(
            -squareSize / 2,
            -squareSize / 2,
            squareSize,
            squareSize
          );

          // Reset the transformations
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        function drawScribble(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }

          const numLines = 50; // Number of random lines in the scribble

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);

          for (let i = 0; i < numLines; i++) {
            const angle = Math.random() * 2 * Math.PI; // Random angle for each line
            const lineLength = Math.random() * radius; // Random line length

            const endX = centerX + lineLength * Math.cos(angle);
            const endY = centerY + lineLength * Math.sin(angle);

            ctx.lineTo(endX, endY);
          }

          ctx.lineWidth = 5;
          ctx.strokeStyle = colour; // Adjust the color for the scribble
          ctx.stroke();
        }
        function drawSineWaveInCircle(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const numPoints = 360; // Number of points on the circle
          const angleIncrement = (2 * Math.PI) / numPoints;
          const waveAmplitude = 30; // Amplitude of the sine wave
          const waveFrequency = 10; // Frequency of the sine wave

          ctx.beginPath();
          ctx.moveTo(
            centerX + radius * Math.sin(0),
            centerY + radius * Math.cos(0)
          );

          for (let angle = 0; angle < 2 * Math.PI; angle += angleIncrement) {
            const distortedRadius =
              radius + waveAmplitude * Math.sin(waveFrequency * angle);
            const x = centerX + distortedRadius * Math.sin(angle);
            const y = centerY + distortedRadius * Math.cos(angle);
            ctx.lineTo(x, y);
          }

          ctx.closePath();
          ctx.lineWidth = 50;
          ctx.strokeStyle = colour;
          ctx.stroke();
        }
        function drawSemiCirclesInCircle(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const numSemiCircles = 5;
          const rotationAngle = 5;
          const semiCircleRadius = radius / numSemiCircles; // Radius of each semi-circle
          const angleIncrement = (2 * Math.PI) / numSemiCircles; // Angle increment for each semi-circle

          for (let i = 0; i < numSemiCircles; i++) {
            const angle = i * angleIncrement + rotationAngle;

            // Calculate the coordinates of the semi-circle center
            const semiCircleCenterX = centerX + radius * Math.cos(angle);
            const semiCircleCenterY = centerY + radius * Math.sin(angle);

            // Draw the semi-circle
            ctx.beginPath();
            ctx.arc(
              semiCircleCenterX,
              semiCircleCenterY,
              semiCircleRadius,
              0,
              Math.PI,
              false
            );
            ctx.lineWidth = 50;
            ctx.strokeStyle = colour;
            ctx.stroke();
          }
        }
        function drawDistortedRect(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const rectWidth = 100; // Width of each rectangle
          const angleIncrement = (2 * Math.PI) / 5; // Angle increment for each rectangle

          for (let i = 0; i < 5; i++) {
            const angle = i * angleIncrement;

            // Calculate the coordinates of the rectangle
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Draw the rectangle
            ctx.fillStyle = colour; // Adjust the color for the rectangles
            ctx.fillRect(x, y, rectWidth, rectWidth);
          }
        }

        function drawDistortedTriangularShape(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const segments = 100; // Number of line segments to approximate the shape
          const angleIncrement = (2 * Math.PI) / segments;
          const distortionFactor = 0.1; // Adjust this value to control the distortion

          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const angle = i * angleIncrement;

            // Calculate the coordinates of the distorted point
            const distortedRadius =
              radius * (1 + distortionFactor * Math.sin(angle * 3));
            const x = centerX + distortedRadius * Math.cos(angle);
            const y = centerY + distortedRadius * Math.sin(angle);

            // Connect the points to form the shape
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.fillStyle = colour; // Adjust the color and opacity as needed
          ctx.fill();
        }
        function drawRotatingPointy(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const numPoints = 6;
          const rotationAngle = 30;
          ctx.beginPath();
          const angleIncrement = (2 * Math.PI) / numPoints; // Angle increment for each point

          for (let i = 0; i < numPoints + 1; i++) {
            const angle = i * angleIncrement + rotationAngle;

            // Calculate the coordinates of the point
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Calculate the control point for the curved line
            const controlX =
              centerX + radius * 0.5 * Math.cos(angle - angleIncrement / 2);
            const controlY =
              centerY + radius * 0.5 * Math.sin(angle - angleIncrement / 2);

            if (i === 0) {
              ctx.moveTo(x, y); // Move to the first point
            } else {
              ctx.quadraticCurveTo(controlX, controlY, x, y); // Draw a quadratic curve to the next point
            }
          }

          // Close the shape
          ctx.closePath();

          // Set line width, stroke color, and fill color
          ctx.lineWidth = 2;
          ctx.strokeStyle = colour;
          ctx.fillStyle = colour;

          // Fill and stroke the shape
          ctx.fill();
          ctx.stroke();
        }
        function drawSawtoothWaveInCircle(
          centerX: number,
          centerY: number,
          radius: number
        ) {
          if (!ctx) {
            return;
          }
          const rotationSpeed = 1;
          const triangleSize = 100 + radius; // Size of each triangle
          const rotationAngle = rotationSpeed * radius; // Adjust the rotation angle based on the radius

          // Clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Translate to the center of the circle
          ctx.translate(centerX, centerY);

          // Rotate the canvas by the rotation angle
          ctx.rotate((rotationAngle * Math.PI) / 180);

          // Draw the triangles
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(radius + 20, 0);
          ctx.lineTo(0, radius + 20);
          ctx.closePath();
          ctx.fillStyle = colour; // Adjust the color for the triangles
          ctx.fill();

          // Reset the transformations
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 1;
        ctx.strokeStyle = colour;
        ctx.stroke();

        let animationId = requestAnimationFrame(growCircle);

        function growCircle() {
          if (!ctx) {
            return;
          }
          if (radius < maxRadius) {
            // Increase the radius
            if (modOscCtr.current!==0 && radius === maxRadius - 1){
               // pulse effect if frequency modulated
                radius -= 35;
            }
            else{
              radius += 1;
            }

            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Redraw the growing circle
            switch (oscCtr.current) {
              case 0:
                drawSineWaveInCircle(centerX, centerY, radius);
                break;
              case 1:
                drawDistortedTriangularShape(centerX, centerY, radius);
                break;
              case 2: // pulse
                drawDistortedRect(centerX - 30, centerY - 30, radius);
                break;
              case 3: // sawtooth
                drawSawtoothWaveInCircle(centerX, centerY, radius);
                break;
              case 4: // square
                drawRotatingSquare(centerX, centerY, radius);
                break;
              case 5: // semi
                drawSemiCirclesInCircle(centerX, centerY, radius);
                break;
              case 6: // pointy
                drawRotatingPointy(centerX, centerY, radius);
                break;
              case 7: // noise
                drawScribble(centerX, centerY, radius);
                break;
              default:
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.lineWidth = 100;
                ctx.strokeStyle = colour;
                ctx.stroke();
                break;
            }

            // Request the next animation frame
            // Check if the circle has reached the desired size
            if (radius >= size * 2) {
              cancelAnimationFrame(animationId);
            } else {
              // Request the next animation frame
              animationId = requestAnimationFrame(growCircle);
            }
          }
        }

        // Cleanup function
        return () => cancelAnimationFrame(animationId);
      }
    } else {
      setIsSelected(false);
      setPlayingNotes([]);
      setIsPlaying(false);
    }
  }, [touch]);

  useLayoutEffect(() => {
    if (action === 'touch') {
      setTouch(true);
    } else {
      setTouch(false);
    }
    setPrevAction(action);
  }, [action]);
  useLayoutEffect(() => {
    const listener = window.electron.ipcRenderer.on(
      'use-wav',
      (event, receivedMessage) => {
        // Update the component state with the received message
        // @ts-ignore
        const parsedJsonList = parseStringToJsonList(event);
        parsedJsonList.forEach((obj: waveObject) => {
          if (obj.id == spawnId) {
            oscCtr.current = obj.wave;
            modOscCtr.current = obj.fm_mod;
            chords.current = obj.currently_playing != '{}' ? obj.chords : 0;
            echo.current = obj.echo;
            amp.current = obj.amp;
            tremoloWave.current = obj.tremolo_wave;
          }
        });
      }
    );
  });

  useLayoutEffect(() => {
    if (ref.current) {
      const new_pos_x = pos_x * sf;
      const new_pos_y = pos_y * sf;
      // Update the left and top style values when x and y props change
      ref.current.style.left = `${new_pos_x}px`;
      ref.current.style.top = `${new_pos_y}px`;
      setPosition({ pos_x, pos_y });

      inVolume.current = false;
      inWaveform.current = false;
      inFM.current = false;
      inBias.current = false;
      inEcho.current = false;
      inChord.current = false;
      inOctave.current = false;
      inTremolo.current = false;
      if (
        volumeRef.current &&
        new_pos_x > volumeRef.current.left &&
        new_pos_x < volumeRef.current.right &&
        new_pos_y > volumeRef.current.top &&
        new_pos_y < volumeRef.current.bottom
      ) {
        inVolume.current = true;
      } else if (
        waveRef.current &&
        new_pos_x > waveRef.current.left &&
        new_pos_x < waveRef.current.right &&
        new_pos_y > waveRef.current.top &&
        new_pos_y < waveRef.current.bottom
      ) {
        inWaveform.current = true;
      } else if (
        fmRef.current &&
        new_pos_x > fmRef.current.left &&
        new_pos_x < fmRef.current.right &&
        new_pos_y > fmRef.current.top &&
        new_pos_y < fmRef.current.bottom
      ) {
        inFM.current = true;
      } else if (
        biasRef.current &&
        new_pos_x > biasRef.current.left &&
        new_pos_x < biasRef.current.right &&
        new_pos_y > biasRef.current.top &&
        new_pos_y < biasRef.current.bottom
      ) {
        inBias.current = true;
      } else if (
        echoRef.current &&
        new_pos_x > echoRef.current.left &&
        new_pos_x < echoRef.current.right &&
        new_pos_y > echoRef.current.top &&
        new_pos_y < echoRef.current.bottom
      ) {
        inEcho.current = true;
      } else if (
        chordRef.current &&
        new_pos_x > chordRef.current.left &&
        new_pos_x < chordRef.current.right &&
        new_pos_y > chordRef.current.top &&
        new_pos_y < chordRef.current.bottom
      ) {
        inChord.current = true;
      } else if (
        octaveRef.current &&
        new_pos_x > octaveRef.current.left &&
        new_pos_x < octaveRef.current.right &&
        new_pos_y > octaveRef.current.top &&
        new_pos_y < octaveRef.current.bottom
      ) {
        inOctave.current = true;
      } else if (
        tremoloRef.current &&
        new_pos_x > tremoloRef.current.left &&
        new_pos_x < tremoloRef.current.right &&
        new_pos_y > tremoloRef.current.top &&
        new_pos_y < tremoloRef.current.bottom
      ) {
        inTremolo.current = true;
      }
    }
  }, [pos_x, pos_y]); // Only re-run effect when x or y props change

  useEffect(() => {
    // Clean up the synth when the component unmounts
    return () => {};
  }, []);

  return (
    <>
      {touch && (
        <canvas
          data-testid="canvas-element"
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0 }}
          className="canvas-behind-sound-object"
        />
      )}
      {isSelected && (
        <svg
          className="animated-svg"
          viewBox={`0 0 ${currSize.current * sf} ${currSize.current * sf}`}
        >
          {shapesMod[modOscCtr.current]}
        </svg>
      )}
      <svg
        data-testid="sound-object"
        data-spawn-id={spawnId}
        ref={ref}
        width={currSize.current}
        viewBox={`0 0 ${currSize.current + 2} ${currSize.current + 2}`}
        style={{
          position: 'absolute',
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="circle-clip">
            <circle
              cx={currSize.current / 2}
              cy={currSize.current / 2}
              r={currSize.current / 2}
              stroke="white"
              strokeWidth="1"
            />
          </clipPath>
        </defs>
        {chords.current !== 0 && (
          <rect
            x={0}
            y={0}
            width={currSize.current}
            height={currSize.current}
            fill={colourLight || '#ffff00'}
          />
        )}
        <circle
          cx={currSize.current / 2}
          cy={currSize.current / 2}
          r={currSize.current / 2}
          stroke="white"
          strokeWidth="2"
          fill={colourLight || '#ffff00'}
          filter={isSelected ? 'url(#glow)' : ''}
        />
        {echo.current == 1 && (
          <>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2.4}
              stroke="white"
              strokeWidth="1"
              fill={colour || '#ffff00'}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 3}
              stroke="white"
              strokeWidth="1"
              fill={colourLight || '#ffff00'}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 4}
              stroke="white"
              strokeWidth="1"
              fill={colour || '#ffff00'}
            />{' '}
          </>
        )}
        <g clipPath="url(#circle-clip)">
          {shapesChords[chords.current]}
          {tremoloWave.current != 0 && (
            <>
              <rect
                x={0}
                y={0}
                width={size * 2}
                height={size * 2}
                fill={colour || '#ffff00'}
                stroke="white"
                strokeWidth="1"
              />
              <rect
                x={(size * 1) / 4}
                y={0}
                width={size * 2}
                height={size * 2}
                fill={colourLight || '#ffff00'}
                stroke="white"
                strokeWidth="1"
              />
              <rect
                x={(size * 2) / 4}
                y={0}
                width={size * 2}
                height={size * 2}
                fill={colour || '#ffff00'}
                stroke="white"
                strokeWidth="1"
              />
              <rect
                x={(size * 3) / 4}
                y={0}
                width={size * 2}
                height={size * 2}
                fill={colourLight || '#ffff00'}
                stroke="white"
                strokeWidth="1"
              />
            </>
          )}
          {shapesOsc[oscCtr.current]}
        </g>
        {inVolume.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {amp.current}
          </text>
        )}
        {inBias.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {bias.current}
          </text>
        )}
        {inChord.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {chordLetters[chords.current]}
          </text>
        )}
        {inEcho.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {echoAmount.current}
          </text>
        )}
        {inFM.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {waves[modOscCtr.current]}
          </text>
        )}
        {inOctave.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {octave.current}
          </text>
        )}
        {inTremolo.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '30px' }}
          >
            {tremoloDepth.current}
          </text>
        )}
        {inWaveform.current && (
          <text
            x={10}
            y={currSize.current / 2}
            style={{ fill: 'black', fontSize: '40px' }}
          >
            {waves[oscCtr.current]}
          </text>
        )}
      </svg>
    </>
  );
};

export default SoundObject;
