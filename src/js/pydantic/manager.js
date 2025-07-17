import { dom } from '../dom.js';

let worker = null;
let isInitializing = false;
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
                isInitializing = false;
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

export async function initPyodide() {
    const w = getWorker();
    if (w.isReady) return;
    if (isInitializing) {
        // If initialization is already in progress, wait for it to complete.
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (w.isReady) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
    
    isInitializing = true;
    if (dom.pydanticLoader) dom.pydanticLoader.classList.remove('hidden');
    if (dom.pydanticLoaderText) dom.pydanticLoaderText.textContent = 'Loading Pyodide...';
    
    await postMessage('init', {});
    w.isReady = true;
}

export function jsonToPydantic(jsonSchema) {
    return postMessage('json-to-pydantic', { jsonSchema });
}

export function pydanticToJson(pydanticCode) {
    return postMessage('pydantic-to-json', { pydanticCode });
}
