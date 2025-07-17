import { ICONS } from '../config.js';
import { renderItem } from './Item.js';
import { handleAddNestedItem } from '../handlers/item.js';

const BORDER_CLASSES = {
    'object-properties': 'border-sky-500',
    'array-items': 'border-teal-500',
    'oneof-options': 'border-violet-500',
    'allOf-options': 'border-cyan-500',
    'anyOf-options': 'border-lime-500',
    'not-options': 'border-red-500',
    'defs-properties': 'border-amber-500',
    'additional-properties': 'border-rose-500',
    'if-schema': 'border-green-500',
    'then-schema': 'border-blue-500',
    'else-schema': 'border-orange-500',
};

export function renderNestedBuilder(items, containerClass, addBtnText, parentId, property, parentOptions = {}) {
    // Expanded .nested-level classes
    const containerDiv = document.createElement('div');
    const borderColorClass = BORDER_CLASSES[containerClass] || 'border-slate-300 dark:border-slate-700';
    containerDiv.className = `ml-4 pl-4 border-l-2 mt-3 pt-3 space-y-4 ${borderColorClass}`;
    
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'space-y-4';

    if (items.length > 0) {
        items.forEach(nestedItem => {
            if (!nestedItem) return; // Guard against initially null 'not' schema
            const newOptions = { 
                ...parentOptions,
                isDefinition: false, // A property inside a definition is not a definition itself.
                isRootArrayItem: false,
                isRootPrimitive: false,
                isSubSchema: ['oneof-options', 'allOf-options', 'anyOf-options', 'not-options', 'if-schema', 'then-schema', 'else-schema', 'additional-properties'].includes(containerClass),
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
        addBtn.dataset.action = 'add-nested';
        addBtn.dataset.property = property;
        containerDiv.appendChild(addBtn);
    }
    
    return containerDiv;
}
