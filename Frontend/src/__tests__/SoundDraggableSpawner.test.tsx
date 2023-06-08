import * as Tone from 'tone';
import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import SpawnSoundDraggable from 'components/Spawner';

const mockMediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        // reject(new Error('Error: getUserMedia failed!')),
        resolve(MediaStream);
      });
    });
  }),
};

Object.defineProperty(window.navigator, 'mediaDevices', {
  writable: true,
  value: mockMediaDevices,
});

Object.defineProperty(global, 'MediaStream', {
  writable: true,
  value: jest
    .fn()
    .mockImplementation(() => {
      return {
        active: true,
        id: `id${window.performance.now().toString()}`,
        onactive: jest.fn(),
        onaddtrack: jest.fn(),
        oninactive: jest.fn(),
        onremovetrack: jest.fn(),
      };
    })
    .mockName('MediaStream'),
});

Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: jest
    .fn()
    .mockImplementation(() => {
      return {
        ondataavailable: jest.fn(),
        audioBitrateMode: 'variable',
        audioBitsPerSecond: 0,
        onerror: jest.fn(),
        onpause: jest.fn(),
        onresume: jest.fn(),
        mimeType: 'audio/webm',
        stream: global.MediaStream,
        state: 'inactive',
        start: () => {},
        stop: jest.fn((state) => {}),
        pause: jest.fn(),
        resume: jest.fn(),
        requestData: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    })
    .mockName('MediaRecorder'),
});

Object.defineProperty(global.MediaRecorder.prototype, 'state', {
  writable: true,
  value: 'inactive',
});

Object.defineProperty(global.MediaRecorder, 'isTypeSupported', {
  writable: true,
  value: () => true,
});

jest.mock('nexusui', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
  },
}));
// Mock Tone.js library
jest.mock('tone', () => {
  const createMediaStreamDestination = jest.fn(() => ({
    stream: {}, // Provide an empty stream object or customize as needed
  }));
  const context = {
    createMediaStreamDestination,
  };
  const synthMock = {
    toDestination: jest.fn(),
    set: jest.fn(),
  };
  const FMSynthMock = jest.fn(() => synthMock);
  const ChebyshevMock = jest.fn(() => ({
    toDestination: jest.fn(),
    set: jest.fn(),
  }));
  return {
    context,
    FMSynth: FMSynthMock,
    MediaRecorder: global.MediaRecorder,
    Chebyshev: ChebyshevMock,
    // Any other properties or methods you need to mock from Tone
  };
});

describe('SpawnSoundDraggable', () => {
  test('renders the "Loading..." message if posInit is false', () => {
    render(<SpawnSoundDraggable parentRef={React.createRef()} />);

    const loadingMessage = screen.getByText('Loading...');
    expect(loadingMessage).toBeInTheDocument();
  });
  test('renders other components when posInit is true', () => {
    render(<SpawnSoundDraggable parentRef={React.createRef()} />);
    const loadingMessage = screen.getByText('Loading...');
    expect(loadingMessage).toBeInTheDocument();
  });
});
