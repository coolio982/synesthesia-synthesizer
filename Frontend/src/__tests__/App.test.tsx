import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../renderer/App';

// We have to mock nexus ui as it is not directly compatible with
// electron and typescript. this is a known issue
jest.mock('nexusui', () => ({
  // Provide a fake implementation of the NexusUI module
  init: jest.fn(),
  add: jest.fn(),
  Toggle: jest.fn(),
  Dial: jest.fn(),
  removeAllListeners: jest.fn(),
}));

// Mock Tone.js library
jest.mock('tone', () => {
  const mockChebyshev = jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    toDestination: jest.fn(),
  }));

  return {
    Chebyshev: mockChebyshev,
  };
});

// Mock the ipcRenderer
const mockIpcRenderer = {
  on: jest.fn(),
};

// Mock the window.electron object
const mockElectron = {
  ipcRenderer: mockIpcRenderer,
};

// reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('App', () => {
  it('should render', () => {
    // @ts-ignore
    window.electron = mockElectron;

    expect(render(<App />)).toBeTruthy();
  });
  it('renders menu buttons and handles interactions', () => {
    // @ts-ignore
    window.electron = mockElectron;

    // Render the App component with the Router and desired props
    render(<App />);

    // Assert that the menu buttons are rendered
    expect(screen.getByText('Synthesizer')).toBeInTheDocument();
    expect(screen.getByText('Calibrate Camera')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();

    // Simulate interactions with menu buttons
    const synthButton = screen.getByText('Synthesizer');
    userEvent.click(synthButton);
    expect(screen.queryByText('synth')).not.toBeInTheDocument();
    const calibrateButton = screen.getByText('Calibrate Camera');
    userEvent.click(calibrateButton);
    expect(screen.queryByText('Calibrate')).not.toBeInTheDocument();
    const docsButton = screen.getByText('Getting Started');
    userEvent.click(docsButton);
    expect(screen.queryByText('Home')).toBeInTheDocument();
  });
});
