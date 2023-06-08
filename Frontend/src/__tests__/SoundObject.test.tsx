import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SoundObject from 'components/SoundObject';

interface MockIpcRenderer {
  on: jest.Mock;
  // add any other IPC renderer methods you use in your component
}

const mockIpcRenderer: MockIpcRenderer = {
  on: jest.fn(),
  // add mock implementations for other methods
};

beforeAll(() => {
  // @ts-ignore
  window.electron = { ipcRenderer: mockIpcRenderer };
});

afterAll(() => {
  // @ts-ignore
  delete window.electron;
});

describe('SoundObject component', () => {
  const spawnId = 1;
  const posX = 100;
  const posY = 100;

  test('renders SoundObject component', () => {
    render(<SoundObject spawnId={spawnId} pos_x={posX} pos_y={posY} />);

    // Assert that the SoundObject component is rendered
    const soundObject = screen.getByTestId('sound-object');
    expect(soundObject).toBeInTheDocument();
    // Assert that the SoundObject component goes to the correct position
    expect(soundObject).toHaveStyle(`left: ${posX * 2}px`);
    expect(soundObject).toHaveStyle(`top: ${posY * 2}px`);
    // Assert that it has the ecorrect graphical representation
    expect(soundObject.querySelector('path')).toHaveAttribute(
      'd',
      "M 2.757 76.8408 L 9.282 70.1416 C 16.5445 63.4164 27.816 51.6736 37.8735 49.2928 C 47.8265 46.7008 57.7995 59.7972 67.3725 66.8496 C 76.9475 73.802 86.586 78.3892 96.1665 69.7896 C 105.747 61.19 115.426 47.1936 124.551 44.19 C 133.675 41.1864 142.314 55.5496 148.038 62.848 L 153.763 70.1464 L 152.22 0.1368 L 146.119 0.1368 C 140.018 0.1368 129.816 0.1368 119.618 0.1368 C 109.418 0.1368 99.2175 0.1368 89.017 0.1368 C 78.8165 0.1368 68.616 0.1368 58.4155 0.1368 C 48.216 0.1368 38.0155 0.1368 27.815 0.1368 C 17.6145 0.1368 7.415 0.1368 2.3145 0.1368 L -2.786 0.1368 L 2.757 76.8408 Z"
    );
  });
});
