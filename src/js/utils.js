import { getActiveSchemaState } from './state.js';
import { dom } from './dom.js';

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export const createId = () => {
    const activeSchema = getActiveSchemaState();
    if (!activeSchema) {
        console.error("Could not get active schema to generate an ID.");
        return `item_error_${Date.now()}`; 
    }
    // The 'nextId' is now correctly scoped to the active schema.
    return `item_${activeSchema.nextId++}`;
};

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icon = type === 'success' ? 
        `<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>` :
        `<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
    
    toast.className = `flex items-center w-full max-w-xs p-4 text-slate-600 bg-white rounded-lg shadow-lg dark:text-slate-300 dark:bg-slate-800 border border-transparent dark:border-slate-700 transform transition-all duration-300 ease-in-out translate-y-4 opacity-0`;
    toast.innerHTML = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">${icon}</div>
        <div class="ml-3 text-sm font-normal">${message}</div>
        <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 inline-flex h-8 w-8 dark:text-slate-400 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>`;
    
    dom.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    }, 100);

    const closeBtn = toast.querySelector('button');
    const removeToast = () => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 300);
    };

    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, 5000);
}

/**
 * Recursively traverses all items in a schema structure and applies a callback.
 * @param {Function} callback - The function to call for each item.
 * @param {...(object|object[]|null)} collections - The top-level collections or items to start traversal from.
 */
export function traverseSchema(callback, ...collections) {
    const visited = new Set();

    function recurse(item) {
        if (!item || typeof item !== 'object' || (item.id && visited.has(item.id))) {
            return;
        }
        if(item.id) visited.add(item.id);

        callback(item);

        const subContainers = [
            'properties', 'items', 'oneOfSchemas', 'allOfSchemas', 'anyOfSchemas', 
            'notSchema', 'additionalPropertiesSchema', 'ifSchema', 'thenSchema', 'elseSchema'
        ];

        for (const prop of subContainers) {
            const container = item[prop];
            if (container) {
                if (Array.isArray(container)) {
                    container.forEach(recurse);
                } else if (typeof container === 'object') {
                    recurse(container);
                }
            }
        }
    }

    collections.forEach(collection => {
        if (!collection) return;
        if (Array.isArray(collection)) {
            collection.forEach(recurse);
        } else if (typeof collection === 'object') {
            recurse(collection);
        }
    });
}

/**
 * A dedicated recursive helper function. It only knows how to search *inside* an item.
 * @param {string} itemId - The ID of the item to find.
 * @param {object} currentItem - The item object to search within.
 * @returns {object|null}
 */
function findRecursive(itemId, currentItem) {
    if (!currentItem || typeof currentItem !== 'object') return null;

    // Updated to include all possible schema containers
    const subContainers = [
        'properties', 'items', 'oneOfSchemas', 'allOfSchemas', 'anyOfSchemas', 
        'notSchema', 'additionalPropertiesSchema', 'ifSchema', 'thenSchema', 'elseSchema'
    ];

    for (const prop of subContainers) {
        if (currentItem[prop]) {
            const container = currentItem[prop];
            if (Array.isArray(container)) {
                for (let i = 0; i < container.length; i++) {
                    const item = container[i];
                    if (item.id === itemId) {
                        return { item, parentArray: container, index: i };
                    }
                    const foundInChildren = findRecursive(itemId, item);
                    if (foundInChildren) return foundInChildren;
                }
            } else if (typeof container === 'object' && container !== null) { // For single schema properties
                if (container.id === itemId) {
                    return { item: container, parentObject: currentItem, key: prop };
                }
                const foundInChildren = findRecursive(itemId, container);
                if (foundInChildren) return foundInChildren;
            }
        }
    }
    return null;
}

/**
 * Finds an item and its parent within the currently active schema.
 * This is the main entry point for searching.
 * @param {string} itemId - The ID of the item to find.
 * @returns {object|null}
 */
export function findItemAndParent(itemId) {
    const activeSchema = getActiveSchemaState();
    if (!activeSchema) return null;

    // Search root-level single schemas first
    const rootSubSchemaKeys = ['additionalPropertiesSchema', 'ifSchema', 'thenSchema', 'elseSchema'];
    for (const key of rootSubSchemaKeys) {
        const schema = activeSchema[key];
        if (schema) {
             if (schema.id === itemId) {
                return { item: schema, parentObject: activeSchema, key };
            }
            const foundInChildren = findRecursive(itemId, schema);
            if (foundInChildren) return foundInChildren;
        }
    }

    // Search top-level collections: schemaDefinition (root items) and definitions ($defs)
    const topLevelCollections = ['schemaDefinition', 'definitions'];
    for (const collectionName of topLevelCollections) {
        const collection = activeSchema[collectionName];

        if (Array.isArray(collection)) { // For object/oneOf roots, and definitions
            for (let i = 0; i < collection.length; i++) {
                const item = collection[i];
                if (item.id === itemId) {
                    return { item, parentArray: collection, index: i };
                }
                // If not found at this level, search inside this item
                const foundInChildren = findRecursive(itemId, item);
                if (foundInChildren) return foundInChildren;
            }
        } else if (typeof collection === 'object' && collection !== null) { // For array/primitive roots
            if (collection.id === itemId) {
                return { item: collection, parentObject: activeSchema, key: collectionName };
            }
            const foundInChildren = findRecursive(itemId, collection);
            if (foundInChildren) return foundInChildren;
        }
    }

    return null; // Item not found in the active schema
}
