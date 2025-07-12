import { ICONS } from '../config.js';
import { renderItem } from './Item.js';
import { handleAddNestedItem } from '../handlers/item.js';

export function renderNestedBuilder(items, containerClass, addBtnText, parentId, property, parentOptions = {}) {
    const containerDiv = document.createElement('div');
    containerDiv.className = `nested-level ${containerClass} space-y-4`;
    
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'space-y-4';

    if (items.length > 0) {
        items.forEach(nestedItem => {
            // Pass down the parent's options, but override with specifics for this container
            const newOptions = { 
                ...parentOptions,
                isRootArrayItem: false,
                isRootPrimitive: false,
                isOneOfOption: containerClass === 'oneof-options',
            };
            itemsContainer.appendChild(renderItem(nestedItem, newOptions));
        });
    } else if (addBtnText) {
        const emptyText = addBtnText === 'Property' ? 'properties' : `${addBtnText.toLowerCase()}s`;
        itemsContainer.innerHTML = `<div class="text-center py-4 text-sm text-slate-500 dark:text-slate-400">No ${emptyText} added.</div>`;
    }
    
    containerDiv.appendChild(itemsContainer);

    if (addBtnText && parentId && property) {
        const addBtn = document.createElement('button');
        addBtn.innerHTML = `${ICONS.plus} Add ${addBtnText}`;
        addBtn.className = 'flex items-center gap-2 mt-4 px-3 py-1.5 text-xs font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors';
        addBtn.addEventListener('click', () => handleAddNestedItem(parentId, property));
        containerDiv.appendChild(addBtn);
    }
    
    return containerDiv;
}
