import { ICONS, FIELD_TYPES } from '../config.js';
import { renderStringInputs, renderNumberInputs, renderArrayInputs, renderRefInputs } from './Inputs.js';
import { renderNestedBuilder } from './Nested.js';

export function renderItem(item, options = {}) {
    const { 
        isRootArrayItem = false, 
        isRootPrimitive = false, 
        isDefinition = false, 
        isOneOfOption = false,
        isFunctionParameter = false 
    } = options;
    const isRoot = isRootArrayItem || isRootPrimitive;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'schema-item-card bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm';
    itemDiv.dataset.itemId = item.id;
    itemDiv.draggable = !isRoot;

    const isRef = item.type === '$ref';
    const canCollapse = !isRoot;
    const canImportProperty = ['object', 'array', 'oneOf'].includes(item.type) && !isRef;
    const canCopyProperty = !isRoot && !isOneOfOption;

    let headerText = item.name || '(unnamed)';
    let headerClass = 'text-slate-800 dark:text-slate-100';
    if (isDefinition) {
        headerText = item.name || '(unnamed definition)';
        headerClass = 'text-amber-600 dark:text-amber-400';
    } else if (isFunctionParameter) {
        headerText = item.name || '(unnamed parameter)';
    } else if (isRootArrayItem) {
        headerText = 'Array Item Schema';
    } else if (isRootPrimitive) {
        headerText = 'Root Schema Details';
    } else if (isOneOfOption) {
        headerText = `oneOf Option (Type: ${isRef ? 'Reference' : item.type})`;
        headerClass = 'text-violet-600 dark:text-violet-400';
    }

    const availableTypes = isOneOfOption || isFunctionParameter ? FIELD_TYPES.all : FIELD_TYPES.all.filter(t => t !== 'function');
    const typeOptions = availableTypes.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('');
    
    itemDiv.innerHTML = `
        <div ${canCollapse ? 'data-action="toggleCollapse"' : ''} class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 ${canCollapse ? 'cursor-pointer' : ''}">
            <div class="flex items-center gap-3 min-w-0">
                ${!isRoot ? `<span class="drag-handle text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" title="Drag to reorder">${ICONS.move}</span>` : ''}
                <h3 class="font-semibold truncate ${headerClass}" title="${headerText}">${headerText}</h3>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                ${canImportProperty ? `<button data-action="import-property" title="Import JSON for this property" aria-label="Import JSON for this property" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.import}</button>` : ''}
                ${canCopyProperty ? `<button data-action="copy-json" title="Copy property JSON" aria-label="Copy property JSON" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.copy}</button>` : ''}
                ${canCollapse ? `<span class="p-1.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${item.isCollapsed ? '' : 'rotate-180'}">${ICONS.chevronUp}</span>` : ''}
                ${!isRoot ? `
                <button data-action="moveUp" title="Move Up" aria-label="Move field up" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.chevronUp}</button>
                <button data-action="moveDown" title="Move Down" aria-label="Move field down" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.chevronDown}</button>
                <button data-action="delete" title="Delete" aria-label="Delete field" class="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">${ICONS.trash}</button>
                ` : ''}
            </div>
        </div>
        <div class="collapsible-content ${item.isCollapsed ? 'collapsed' : ''} mt-4">
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${!isOneOfOption && !isRoot ? `
                    <div>
                        <label for="name_${item.id}">Name</label>
                        <input type="text" id="name_${item.id}" data-property="name" value="${item.name || ''}" placeholder="${isDefinition ? 'DefinitionName' : 'fieldName'}">
                    </div>` : '<div class="hidden md:block"></div>'}
                    <div>
                        <label for="type_${item.id}">Type</label>
                        <select id="type_${item.id}" data-property="type">${typeOptions}</select>
                    </div>
                </div>
                <div id="type_specific_${item.id}" class="space-y-4"></div>
                <div id="nested_builder_${item.id}" class="mt-4"></div>
            </div>
        </div>`;

    const typeSpecificDiv = itemDiv.querySelector(`#type_specific_${item.id}`);
    if (isRef) {
        typeSpecificDiv.innerHTML = renderRefInputs(item);
    } else {
        typeSpecificDiv.innerHTML = `
            <div>
                <label for="desc_${item.id}">Description</label>
                <textarea id="desc_${item.id}" data-property="description" rows="2" placeholder="Field description...">${item.description || ''}</textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="default_${item.id}">Default Value (JSON)</label>
                    <textarea id="default_${item.id}" data-property="defaultValue" rows="2" placeholder='"a string", 42, true' class="font-mono">${item.defaultValue || ''}</textarea>
                </div>
                <div>
                    <label for="const_${item.id}">Constant Value (JSON)</label>
                    <textarea id="const_${item.id}" data-property="constValue" rows="2" placeholder='"USA", 100, false' class="font-mono">${item.constValue || ''}</textarea>
                </div>
            </div>
            ${item.type === 'string' ? renderStringInputs(item) : ''}
            ${item.type === 'number' || item.type === 'integer' ? renderNumberInputs(item) : ''}
            ${item.type === 'array' ? renderArrayInputs(item) : ''}
            ${!isOneOfOption && !isRoot && !isDefinition ? `
            <div class="flex items-center pt-2">
                <input type="checkbox" id="required_${item.id}" data-property="required" ${item.required ? 'checked' : ''}>
                <label for="required_${item.id}" class="ml-2 text-sm text-slate-700 dark:text-slate-300">Is Required?</label>
            </div>` : ''}`;
    }

    const nestedBuilder = itemDiv.querySelector(`#nested_builder_${item.id}`);
    if (item.type === 'object') {
        nestedBuilder.appendChild(renderNestedBuilder(item.properties, 'object-properties', 'Property', item.id, 'properties', options));
    } else if (item.type === 'array' && item.items) {
        nestedBuilder.appendChild(renderNestedBuilder([item.items], 'array-items', null, null, null, options));
    } else if (item.type === 'oneOf') {
        nestedBuilder.appendChild(renderNestedBuilder(item.oneOfSchemas, 'oneof-options', 'Option', item.id, 'oneOfSchemas', options));
    }
    
    return itemDiv;
}
