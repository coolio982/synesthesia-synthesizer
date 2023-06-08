import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import AudioPlayer from './AudioPlayerWrapper';
const SynthRecorder = ({
  trackId,
  synths,
  dest,
  recorder,
  initialDuration,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [duration, setDuration] = useState(initialDuration);
  const recorderRef = useRef(null);
  const [displayText, setDisplayText] = useState('Track ' + trackId);

  //start and stop the flashing animation when recording state changes
  useEffect(() => {
    let timerId;
    if (isRecording) {
      timerId = setInterval(() => {
        setDisplayText((prevText) => (prevText === '⏺' ? ' ' : '⏺'));
      }, 500); // Change text every 500ms (half a second)
    } else {
      setDisplayText('Track ' + trackId);
    }

    return () => {
      clearInterval(timerId);
    };
  }, [isRecording, trackId]);

  const startRecording = async () => {
    setIsRecording(true);
    // const actx = Tone.context;
    const chunks = [];

    synths.forEach((synth) => synth.connect(dest));
    recorderRef.current = recorder;

    recorder.ondataavailable = (evt) => chunks.push(evt.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
      const audioUrl = URL.createObjectURL(blob);
      setRecording(audioUrl);
      setIsRecording(false);
    };

    recorder.start();
    await Tone.start();
    Tone.Transport.start();
    Tone.Transport.scheduleOnce(() => {
      Tone.Transport.stop();
      recorder.stop();
    }, `+${duration}`);
  };

  const stopRecording = () => {
    setIsRecording(false);
    Tone.Transport.stop();
    recorderRef.current.stop();
  };
  const buttonStyle = {
    width: isRecording ? '80px' : '150px',
  };

  return (
    <div
      style={{
        display: 'flex',
        margin: '0 20px',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          style={buttonStyle}
          onClick={startRecording}
          disabled={isRecording}
        >
          {displayText}
        </button>
        {isRecording && (
          <button onClick={stopRecording} disabled={!isRecording}>
            ⏹
          </button>
        )}
      </div>

      <div>
        {/* <audio controls src={recording} /> */}
        <AudioPlayer src={recording} />
      </div>

      <div>
        {/* <label htmlFor="duration">Duration (seconds):</label> */}
        {/* <input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          disabled={isRecording}
        /> */}
      </div>
    </div>
  );
};

export default SynthRecorder;
