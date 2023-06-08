import React, { useRef, useEffect } from 'react';
import { colours } from '../constants';

const CanvasComponent = ({ fixedColour = null }) => {
  const canvasRef = useRef(null);
  const lines = useRef([]);
  const currentLine = useRef(null);
  const fadeRate = 0.005; // Rate at which the opacity decreases

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let drawing = false;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const startDrawing = (e) => {
      drawing = true;
      const { clientX, clientY } = e;
      const { left, top } = canvas.getBoundingClientRect();
      const offsetX = clientX - left;
      const offsetY = clientY - top;

      const randomColor = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
        Math.random() * 256
      )}, ${Math.floor(Math.random() * 256)})`;
      if (fixedColour) {
        currentLine.current = {
          points: [{ x: offsetX, y: offsetY }],
          alpha: 1,
          thickness: 10,
          color: fixedColour,
        };
      } else {
        currentLine.current = {
          points: [{ x: offsetX, y: offsetY }],
          alpha: 1,
          thickness: 10,
          color: randomColor,
        };
      }
    };

    const drawLine = (e) => {
      if (!drawing) return;

      const { clientX, clientY } = e;
      const { left, top } = canvas.getBoundingClientRect();
      const offsetX = clientX - left;
      const offsetY = clientY - top;
      const newPoint = { x: offsetX, y: offsetY };
      currentLine.current.points = [...currentLine.current.points, newPoint];
      drawLines();
    };

    const endDrawing = () => {
      if (!drawing) return;
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
      });

      drawLines();
    };

    animate();
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', drawLine);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseout', endDrawing);
    return () => {
      // Cleanup function to remove event listeners
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', drawLine);
      canvas.removeEventListener('mouseup', endDrawing);
      canvas.removeEventListener('mouseout', endDrawing);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default CanvasComponent;
