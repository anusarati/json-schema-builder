import { appState } from './state.js';
import { dom } from './dom.js';

export const createId = () => `item_${appState.nextId++}`;

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icon = type === 'success' ? 
        `<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>` :
        `<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
    
    toast.className = `flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800 transform transition-all duration-300 ease-in-out translate-y-4 opacity-0`;
    toast.innerHTML = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">${icon}</div>
        <div class="ml-3 text-sm font-normal">${message}</div>
        <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
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

export function findItemAndParent(itemId, startNode = appState) {
    const collections = ['schemaDefinition', 'definitions'];
    for (const collectionName of collections) {
        const searchArray = startNode[collectionName];
        if (!Array.isArray(searchArray)) continue;

        for (let i = 0; i < searchArray.length; i++) {
            const item = searchArray[i];
            if (item.id === itemId) {
                return { item, parentArray: searchArray, index: i };
            }
            const foundInChildren = findItemAndParent(itemId, item);
            if (foundInChildren) return foundInChildren;
        }
    }
    const subContainers = ['properties', 'items', 'oneOfSchemas'];
    for (const prop of subContainers) {
        if (startNode[prop]) {
            const container = startNode[prop];
            if (Array.isArray(container)) {
                 for (let i = 0; i < container.length; i++) {
                    const item = container[i];
                    if (item.id === itemId) {
                        return { item, parentArray: container, index: i };
                    }
                    const foundInChildren = findItemAndParent(itemId, item);
                    if (foundInChildren) return foundInChildren;
                }
            } else if (typeof container === 'object' && container.id === itemId) {
                return { item: container, parentObject: startNode, key: prop };
            } else if (typeof container === 'object') {
                const foundInChildren = findItemAndParent(itemId, container);
                if (foundInChildren) return foundInChildren;
            }
        }
    }
    return null;
}
