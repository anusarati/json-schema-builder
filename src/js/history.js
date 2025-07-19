import { appState, getActiveSchemaState } from './state.js';
import { render } from './renderer.js';
import { debounce } from './utils.js';

if (!('history' in appState)) {
    appState.history = [];
    appState.historyPointer = -1;
    appState.isRestoring = false;
}

const serialise = () => {
    // Only serialize the state of the currently active schema
    return JSON.stringify(getActiveSchemaState());
}

const restore = (snapshot) => {
    const parsed = JSON.parse(snapshot);
    // Restore the state to the correct index in the schemas array
    appState.schemas[appState.activeSchemaIndex] = parsed;
};

/**
 * Takes an immediate snapshot of the current state. This is the primary
 * method for creating a history entry and should be called when a change
 * is "committed" (e.g., on blur).
 */
export function snapshotNow() {
    if (appState.isRestoring) return;
    
    const initialPointer = appState.historyPointer;
    const initialLength = appState.history.length;
    const now = serialise();

    if (
        appState.historyPointer >= 0 &&
        appState.history[appState.historyPointer] === now
    ) {
        return; // Avoid duplicate history entries
    }

    // If we've undone something and now make a new change, clear the "redo" history.
    if (appState.historyPointer < appState.history.length - 1) {
        appState.history = appState.history.slice(0, appState.historyPointer + 1);
    }

    appState.history.push(now);
    appState.historyPointer = appState.history.length - 1;

    // Fire an event only if the history state actually changed.
    if (appState.historyPointer !== initialPointer || appState.history.length !== initialLength) {
        window.dispatchEvent(new CustomEvent('builder:historychange'));
    }
}

export function undo() {
    if (appState.historyPointer <= 0) return;
    appState.historyPointer--;
    appState.isRestoring = true;
    restore(appState.history[appState.historyPointer]);
    render();
    appState.isRestoring = false;
}

export function redo() {
    if (appState.historyPointer >= appState.history.length - 1) return;
    appState.historyPointer++;
    appState.isRestoring = true;
    restore(appState.history[appState.historyPointer]);
    render();
    appState.isRestoring = false;
}

// Listen for the 'builder:rendered' event fired by render() for major structural changes.
window.addEventListener('builder:rendered', snapshotNow);

// Take the very first snapshot when the application loads.
snapshotNow();
