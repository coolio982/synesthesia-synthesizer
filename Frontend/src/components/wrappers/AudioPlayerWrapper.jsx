import React, { useRef, useState, useEffect } from 'react';

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const handleTogglePlayback = async () => {
    try {
      if (isPlaying) {
        await audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleLoop = () => {
    audioRef.current.loop = !audioRef.current.loop;
    setIsLooping(audioRef.current.loop);
  };

  return (
    <div>
      {/* '⏸' : '⏵' */}
      {src !== '' && <audio ref={audioRef} src={src} />}

      <button onClick={handleTogglePlayback}>{isPlaying ? '⏺️' : '▶️'}</button>
      <button
        style={{
          backgroundColor: isLooping ? 'darkgray' : 'white',
        }}
        onClick={handleToggleLoop}
      >
        🔁
      </button>
    </div>
  );
};

export default AudioPlayer;
