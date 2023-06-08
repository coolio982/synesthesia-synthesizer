import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import SoundDraggable from 'components/SoundDraggable';

describe('SoundDraggable', () => {
  it('renders correctly', () => {
    const synth = { dispose: jest.fn() };
    const spawnId = 0;
    const x = 100;
    const y = 100;
    const parentRef = { current: document.createElement('div') };

    const { getByTestId } = render(
      <SoundDraggable
        synth={synth}
        spawnId={spawnId}
        x={x}
        y={y}
        parentRef={parentRef}
      />
    );

    const draggableElement = getByTestId('sound-object');
    expect(draggableElement).toBeInTheDocument();
    expect(draggableElement.style.left).toBe(`${x}px`);
    expect(draggableElement.style.top).toBe(`${y}px`);
  });
  it('triggers synth functions on key down and key up events', () => {
    // Mock the synth object
    const synth = {
      set: jest.fn(),
      triggerAttack: jest.fn(),
      triggerRelease: jest.fn(),
      dispose: jest.fn(),
    };

    // Mock the keyMapper function to return 0
    const keyMapperMock = jest.fn(() => 0);
    const spawnId = 0;
    const x = 100;
    const y = 100;
    const parentRef = { current: document.createElement('div') };

    const { getByTestId } = render(
      <SoundDraggable
        synth={synth}
        spawnId={spawnId}
        x={x}
        y={y}
        parentRef={parentRef}
      />
    );
    // Assert that the component is in the document
    expect(getByTestId('sound-object')).toBeInTheDocument();

    // Find the input element using data-testid
    const inputElement = getByTestId('sound-object');

    // Key presses
    const eventA = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' });
    const eventShiftRight = new KeyboardEvent('keydown', {
      key: 'Shift',
      code: 'ShiftRight',
    });

    // Fire key down event on window object
    fireEvent(document, eventA);
    // Assert that synth functions are called with the expected arguments
    expect(synth.triggerAttack).toHaveBeenCalled();

    // Fire key up event on window object
    fireEvent(document, new KeyboardEvent('keyup', { key: 'a', code: 'KeyA' }));

    // Assert that synth functions are called with the expected arguments
    expect(synth.triggerRelease).toHaveBeenCalled();

    // Fire key up event on window object
    fireEvent(document, eventShiftRight);
    // Assert that synth properties can be set via override
    expect(synth.set).toHaveBeenCalled();

    // Cleanup

    jest.clearAllMocks();
  });
});
