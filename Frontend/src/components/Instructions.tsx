import React from 'react';

interface InstructionsProps {
  text: string;
  color: string;
}

const Instructions: React.FC<InstructionsProps> = ({
  text,
  color = 'black',
}) => {
  return (
    <div
      style={{
        padding: '250px',
        paddingRight: '350px',
        zIndex: '9999',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '30px', color, display: 'inline-block' }}>
        {text}
      </span>
    </div>
  );
};

export default Instructions;
