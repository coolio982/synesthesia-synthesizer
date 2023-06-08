import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import SpawnSoundObject from 'components/SoundObjectSpawner';

const ipcRendererMock = {
  on: jest.fn(),
  invoke: jest.fn(),
  removeListener: jest.fn(),
  sendMessage: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
};

(window as any).electron = {
  ipcRenderer: ipcRendererMock,
};
let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container) {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

describe('SpawnSoundObject', () => {
  it('renders without crashing', () => {
    act(() => {
      render(
        <SpawnSoundObject parentRef={React.createRef()} actx={null} />,
        container
      );
    });
    expect(container?.querySelector('.spawn-sound-object')).toBeTruthy();
  });

  it('displays the initial text', () => {
    act(() => {
      render(
        <SpawnSoundObject parentRef={React.createRef()} actx={null} />,
        container
      );
    });
    expect(container?.textContent).toContain('Place an object here...');
  });

  // Add more tests as needed for other functionality and behaviors of the component
});
