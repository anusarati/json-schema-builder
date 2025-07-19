import { dom } from '../dom.js';

let worker = null;
let pyodideReadyPromise = null;
let messageId = 0;
const resolvers = new Map();

function getWorker() {
    if (worker) return worker;
    
    // Vite-specific worker syntax
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
        const { id, type, success, payload, error, message } = e.data;

        if (type === 'status') {
            if (dom.pydanticLoaderText) {
                dom.pydanticLoaderText.textContent = message;
            }
            if (success) {
                // This indicates the 'init' process is fully complete.
                worker.isReady = true;
            }
        }

        if (resolvers.has(id)) {
            const { resolve, reject } = resolvers.get(id);
            if (success) {
                resolve(payload);
            } else {
                reject(new Error(error));
            }
            resolvers.delete(id);
        }
    };
    
    return worker;
}

function postMessage(type, payload) {
    return new Promise((resolve, reject) => {
        const id = messageId++;
        resolvers.set(id, { resolve, reject });
        getWorker().postMessage({ id, type, payload });
    });
}

/**
 * Kicks off the Pyodide initialization in the background.
 * This should be called once when the application starts.
 * It's safe to call multiple times.
 */
export function startPyodideInitialization() {
    if (pyodideReadyPromise) {
        return; // Initialization already started.
    }

    console.log("Starting Pyodide initialization in background...");
    pyodideReadyPromise = postMessage('init', {});

    // Add a catch to prevent unhandled promise rejection console errors.
    // The actual error handling will happen where initPyodide() is awaited.
    pyodideReadyPromise.catch(err => {
        console.error("Background Pyodide initialization failed:", err);
        // If it fails, reset the promise so it can be tried again on-demand.
        pyodideReadyPromise = null;
    });
}

/**
 * Ensures Pyodide is initialized, waiting if necessary.
 * This function should be called before any Pydantic operations.
 * It does not handle any UI itself; the caller is responsible for showing/hiding indicators.
 */
export async function initPyodide() {
    // If background loading hasn't been started for some reason, start it now.
    if (!pyodideReadyPromise) {
        startPyodideInitialization();
    }
    // Wait for the initialization to complete.
    await pyodideReadyPromise;
}

export function pydanticToJson(pydanticCode) {
    return postMessage('pydantic-to-json', { pydanticCode });
}
