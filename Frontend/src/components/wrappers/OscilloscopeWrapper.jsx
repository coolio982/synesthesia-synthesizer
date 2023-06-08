import { useEffect, useRef, useState } from 'react';
import Nexus from 'nexusui';
import * as Tone from 'tone';

const OscilloscopeWrapper = ({ audioContext, bg, darkMode }) => {
  const oscilloscopeRef = useRef(null);
  const [opcty, setOpcty] = useState(1);
  useEffect(() => {
    const oscilloscope = new Nexus.Oscilloscope(oscilloscopeRef.current, {
      size: [300, 150],
    });
    if (bg == -1) {
      oscilloscope.resize(980, 500); // set size to window size
      setOpcty(0.3);
    }
    oscilloscope.connect(Tone.getDestination());
    oscilloscope.colorize('accent', 'black');
    if (darkMode) {
      oscilloscope.colorize('accent', 'white');
    }
    const handleClick = (event) => {
      const oscRect = oscilloscopeRef.current.getBoundingClientRect();
      const { clientX, clientY } = event;

      // Check if the click position is within the oscilloscope area
      if (
        clientX >= oscRect.left &&
        clientX <= oscRect.right &&
        clientY >= oscRect.top &&
        clientY <= oscRect.bottom
      ) {
        // Fade the oscilloscope a bit
        setOpcty((prevOpacity) => prevOpacity - 0.01);
      }
    };

    if (bg !== -1) {
      // Attach the click event listener to the document
      document.addEventListener('click', handleClick);
    }

    return () => {
      oscilloscope.disconnect();
      if (bg !== -1) {
        document.removeEventListener('click', handleClick);
      }
    };
  }, [audioContext, darkMode, bg]);

  useEffect(() => {
    // Remove the oscilloscope once it has completely faded (opacity reaches 0)
    if (opcty === 0) {
      oscilloscope.disconnect();
      // Perform any necessary cleanup or trigger component removal here
    }
  }, [opcty]);

  if (opcty === 0) {
    return null; // Return null when oscilloscope is fully faded
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        opacity: opcty,
        zIndex: bg,
      }}
      ref={oscilloscopeRef}
    />
  );
};

export default OscilloscopeWrapper;
