import { ICONS, FIELD_TYPES } from './config.js';
import { appState } from './state.js';
import { handleAddNestedItem } from './events.js';

function renderRefInputs(item) {
    const defOptions = appState.definitions
        .filter(d => d.name)
        .map(d => `<option value="#/$defs/${d.name}" ${item.ref === `#/$defs/${d.name}` ? 'selected' : ''}>${d.name}</option>`)
        .join('');
    return `
        <div>
            <label for="ref_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Reference ($ref)</label>
            <select id="ref_${item.id}" data-property="ref" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <option value="">Select a definition...</option>
                ${defOptions}
            </select>
        </div>`;
}

function renderStringInputs(item) {
    return `
        <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300">String Validation</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="pattern_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Pattern (RegEx)</label>
                    <input type="text" id="pattern_${item.id}" data-property="pattern" value="${item.pattern || ''}" placeholder="^\\d{3}$" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
                <div>
                    <label for="format_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Format</label>
                    <input type="text" id="format_${item.id}" data-property="format" value="${item.format || ''}" placeholder="email, date-time, etc." class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
                <div>
                    <label for="minLength_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Min Length</label>
                    <input type="number" id="minLength_${item.id}" data-property="minLength" value="${item.minLength !== undefined ? item.minLength : ''}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
                <div>
                    <label for="maxLength_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Max Length</label>
                    <input type="number" id="maxLength_${item.id}" data-property="maxLength" value="${item.maxLength !== undefined ? item.maxLength : ''}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
            </div>
            <div>
                <label for="enum_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Enum (comma-separated strings)</label>
                <textarea id="enum_${item.id}" data-property="enum" rows="2" placeholder="value1, value2" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">${(item.enum || []).join(', ')}</textarea>
            </div>
        </div>`;
}

function renderNumberInputs(item) {
    return `
        <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300">Number Validation</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="minimum_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Minimum</label>
                    <input type="number" id="minimum_${item.id}" data-property="minimum" value="${item.minimum !== undefined ? item.minimum : ''}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
                <div>
                    <label for="maximum_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Maximum</label>
                    <input type="number" id="maximum_${item.id}" data-property="maximum" value="${item.maximum !== undefined ? item.maximum : ''}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
                <div class="flex items-center pt-2">
                    <input type="checkbox" id="exclusiveMinimum_${item.id}" data-property="exclusiveMinimum" ${item.exclusiveMinimum ? 'checked' : ''} class="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                    <label for="exclusiveMinimum_${item.id}" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Exclusive Minimum</label>
                </div>
                <div class="flex items-center pt-2">
                    <input type="checkbox" id="exclusiveMaximum_${item.id}" data-property="exclusiveMaximum" ${item.exclusiveMaximum ? 'checked' : ''} class="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                    <label for="exclusiveMaximum_${item.id}" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Exclusive Maximum</label>
                </div>
            </div>
        </div>`;
}

function renderArrayInputs(item) {
     return `
        <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300">Array Validation</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="minItems_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Min Items</label>
                    <input type="number" id="minItems_${item.id}" data-property="minItems" value="${item.minItems !== undefined ? item.minItems : ''}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
                <div>
                    <label for="maxItems_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Max Items</label>
                    <input type="number" id="maxItems_${item.id}" data-property="maxItems" value="${item.maxItems !== undefined ? item.maxItems : ''}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>
            </div>
            <div class="flex items-center pt-2">
                <input type="checkbox" id="uniqueItems_${item.id}" data-property="uniqueItems" ${item.uniqueItems ? 'checked' : ''} class="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                <label for="uniqueItems_${item.id}" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Unique Items</label>
            </div>
        </div>`;
}

function renderNestedBuilder(items, containerClass, addBtnText, addHandler) {
    const containerDiv = document.createElement('div');
    containerDiv.className = `nested-level ${containerClass} space-y-4`;

    if (items.length > 0) {
        items.forEach(nestedItem => {
            const options = { isOneOfOption: containerClass === 'oneof-options' };
            containerDiv.appendChild(renderItem(nestedItem, options));
        });
    } else if(addHandler) {
        // FIXED: Corrected "propertys" typo by handling pluralization properly.
        const emptyText = addBtnText === 'Property' ? 'properties' : `${addBtnText.toLowerCase()}s`;
        containerDiv.innerHTML = `<div class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No ${emptyText} added.</div>`;
    }

    if (addHandler) {
        const addBtn = document.createElement('button');
        addBtn.innerHTML = `${ICONS.plus} Add ${addBtnText}`;
        addBtn.className = 'flex items-center gap-2 mt-4 px-3 py-1.5 text-xs font-medium text-white bg-gray-500 dark:bg-gray-600 rounded-md hover:bg-gray-600 dark:hover:bg-gray-500';
        addBtn.addEventListener('click', addHandler);
        containerDiv.appendChild(addBtn);
    }
    
    return containerDiv;
}

export function renderItem(item, options = {}) {
    const { isRootArrayItem = false, isRootPrimitive = false, isDefinition = false, isOneOfOption = false } = options;
    const isRoot = isRootArrayItem || isRootPrimitive;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'schema-item-card bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm';
    itemDiv.dataset.itemId = item.id;
    itemDiv.draggable = !isRoot;

    const isRef = item.type === '$ref';
    const isComplex = ['object', 'array', 'oneOf'].includes(item.type);

    let headerText = item.name || '(unnamed)';
    let headerClass = 'text-gray-800 dark:text-gray-100';
    if (isDefinition) {
        headerText = item.name || '(unnamed definition)';
        headerClass = 'text-amber-700 dark:text-amber-400';
    } else if (isRootArrayItem) headerText = 'Array Item Schema';
    else if (isRootPrimitive) headerText = 'Root Schema Details';
    else if (isOneOfOption) {
        headerText = `oneOf Option (Type: ${isRef ? 'Reference' : item.type})`;
        headerClass = 'text-violet-700 dark:text-violet-400';
    }

    const availableTypes = isOneOfOption ? FIELD_TYPES.all.filter(t => t !== 'oneOf') : FIELD_TYPES.all;
    const typeOptions = availableTypes.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('');
    
    itemDiv.innerHTML = `
        <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 min-w-0">
                ${!isRoot ? `<span class="drag-handle text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" title="Drag to reorder">${ICONS.move}</span>` : ''}
                <h3 class="font-semibold truncate ${headerClass}" title="${headerText}">${headerText}</h3>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                 ${isComplex ? `<button data-action="toggleCollapse" title="Collapse/Expand" aria-label="Toggle details section" class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">${item.isCollapsed ? ICONS.chevronDown : ICONS.chevronUp}</button>` : ''}
                ${!isRoot ? `
                <button data-action="moveUp" title="Move Up" aria-label="Move field up" class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">${ICONS.chevronUp}</button>
                <button data-action="moveDown" title="Move Down" aria-label="Move field down" class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">${ICONS.chevronDown}</button>
                <button data-action="delete" title="Delete" aria-label="Delete field" class="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">${ICONS.trash}</button>
                ` : ''}
            </div>
        </div>
        <div class="collapsible-content ${item.isCollapsed ? 'collapsed' : ''} mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${!isOneOfOption && !isRoot ? `
                <div>
                    <label for="name_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <input type="text" id="name_${item.id}" data-property="name" value="${item.name || ''}" placeholder="${isDefinition ? 'DefinitionName' : 'fieldName'}" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                </div>` : ''}
                <div>
                    <label for="type_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                    <select id="type_${item.id}" data-property="type" class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">${typeOptions}</select>
                </div>
            </div>
            <div id="type_specific_${item.id}" class="mt-4 space-y-4"></div>
            <div id="nested_builder_${item.id}" class="mt-4"></div>
        </div>`;

    const typeSpecificDiv = itemDiv.querySelector(`#type_specific_${item.id}`);
    if (isRef) {
        typeSpecificDiv.innerHTML = renderRefInputs(item);
    } else {
        typeSpecificDiv.innerHTML = `
            <div>
                <label for="desc_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
                <textarea id="desc_${item.id}" data-property="description" rows="2" placeholder="Field description..." class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">${item.description || ''}</textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="default_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Default Value (JSON)</label>
                    <textarea id="default_${item.id}" data-property="defaultValue" rows="2" placeholder='"a string", 42, true' class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md font-mono">${item.defaultValue || ''}</textarea>
                </div>
                <div>
                    <label for="const_${item.id}" class="text-xs font-medium text-gray-500 dark:text-gray-400">Constant Value (JSON)</label>
                    <textarea id="const_${item.id}" data-property="constValue" rows="2" placeholder='"USA", 100, false' class="mt-1 p-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md font-mono">${item.constValue || ''}</textarea>
                </div>
            </div>
            ${item.type === 'string' ? renderStringInputs(item) : ''}
            ${item.type === 'number' || item.type === 'integer' ? renderNumberInputs(item) : ''}
            ${item.type === 'array' ? renderArrayInputs(item) : ''}
            ${!isOneOfOption && !isRoot && !isDefinition ? `
            <div class="flex items-center pt-2">
                <input type="checkbox" id="required_${item.id}" data-property="required" ${item.required ? 'checked' : ''} class="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                <label for="required_${item.id}" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Is Required?</label>
            </div>` : ''}`;
    }

    const nestedBuilder = itemDiv.querySelector(`#nested_builder_${item.id}`);
    if (item.type === 'object') {
        nestedBuilder.appendChild(renderNestedBuilder(item.properties, 'object-properties', 'Property', handleAddNestedItem.bind(null, item.id, 'properties')));
    } else if (item.type === 'array' && item.items) {
        nestedBuilder.appendChild(renderNestedBuilder([item.items], 'array-items', 'Item Schema', null));
    } else if (item.type === 'oneOf') {
        nestedBuilder.appendChild(renderNestedBuilder(item.oneOfSchemas, 'oneof-options', 'Option', handleAddNestedItem.bind(null, item.id, 'oneOfSchemas')));
    }
    
    return itemDiv;
}
