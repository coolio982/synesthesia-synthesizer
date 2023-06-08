import React from 'react';

const ResetButton = () => {
  const handleReset = () => {
    window.location.reload();
  };

  return <button onClick={handleReset}>Reset</button>;
};

export default ResetButton;
