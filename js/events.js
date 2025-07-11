import { appState } from './state.js';
import { dom } from './dom.js';
import { createSchemaItem, generateAndDisplaySchema, mapJsonToInternal } from './schema.js';
import { findItemAndParent, showToast } from './utils.js';
import { render } from './renderer.js';
import { ICONS, FIELD_TYPES } from './config.js';
import { clearState } from './persistence.js';

export function handleGlobalDetailChange(e) {
    const { id, value } = e.target;
    if (id === 'schemaTitle') appState.title = value;
    if (id === 'schemaDescription') appState.description = value;
    generateAndDisplaySchema();
}

export function handleRootTypeChange(e) {
    appState.rootSchemaType = e.target.value;
    resetSchemaDefinitionForRootType();
    render();
}

export function resetSchemaDefinitionForRootType() {
    appState.nextId = 0;
    const type = appState.rootSchemaType;
    if (type === 'object' || type === 'oneOf') {
        appState.schemaDefinition = [];
    } else if (type === 'array') {
        appState.schemaDefinition = createSchemaItem({ type: 'string' });
    } else {
        appState.schemaDefinition = createSchemaItem({ type });
    }
}

export function handleAddRootItem() {
    const newItem = createSchemaItem({ type: 'string' });
    appState.schemaDefinition.push(newItem);
    render();
}

export function handleAddDefinition() {
    const newDef = createSchemaItem({ isDefinition: true, type: 'object' });
    appState.definitions.push(newDef);
    render();
}

export function handleAddNestedItem(parentId, property) {
    const found = findItemAndParent(parentId);
    if (found && found.item) {
        const newItem = createSchemaItem({ type: 'string' });
        found.item[property].push(newItem);
        render();
    }
}

export function handleItemUpdate(e) {
    const input = e.target;
    const card = input.closest('.schema-item-card');
    if (!card) return;
    
    const itemId = card.dataset.itemId;
    const property = input.dataset.property;
    let value = input.type === 'checkbox' ? input.checked : input.value;
    
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;
    
    const item = found.item;
    const oldType = item.type;

    if (input.type === 'number') {
        value = value === '' ? undefined : parseFloat(value);
    }
    if (property === 'enum') {
        value = value.split(',').map(s => s.trim()).filter(Boolean);
    }

    item[property] = value;
    
    if (property === 'type' && value !== oldType) {
        item.properties = [];
        item.items = null;
        item.oneOfSchemas = [];
        item.ref = '';
        if (value === 'object') item.properties = [];
        if (value === 'array') item.items = createSchemaItem({ type: 'string' });
        if (value === 'oneOf') item.oneOfSchemas = [];
        render();
    } else {
        generateAndDisplaySchema();
    }
}

export function handleToggleCollapse(itemId) {
    const found = findItemAndParent(itemId);
    if(found && found.item) {
        found.item.isCollapsed = !found.item.isCollapsed;
        const card = document.querySelector(`[data-item-id="${itemId}"]`);
        if(card) {
            card.querySelector('.collapsible-content').classList.toggle('collapsed');
            card.querySelector('[data-action="toggleCollapse"]').innerHTML = found.item.isCollapsed ? ICONS.chevronDown : ICONS.chevronUp;
        }
    }
}

export function handleDeleteItem(itemId) {
    const found = findItemAndParent(itemId);
    if (found && found.parentArray) {
        found.parentArray.splice(found.index, 1);
        render();
    }
}

export function handleMoveItem(itemId, direction) {
    const found = findItemAndParent(itemId);
    if (!found || !found.parentArray) return;

    const { parentArray, index } = found;
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < parentArray.length) {
        [parentArray[index], parentArray[newIndex]] = [parentArray[newIndex], parentArray[index]];
        render();
    }
}

export function handleDragStart(e) {
    const card = e.target.closest('.schema-item-card');
    if (card) {
        appState.draggedItemId = card.dataset.itemId;
        e.dataTransfer.setData('text/plain', appState.draggedItemId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => card.classList.add('dragging'), 0);
    }
}

export function handleDragEnd(e) {
    const card = e.target.closest('.schema-item-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.drop-zone-active').forEach(dz => dz.classList.remove('drop-zone-active'));
    appState.draggedItemId = null;
}

export function handleDragOver(e) {
    e.preventDefault();
    const card = e.target.closest('.schema-item-card');
    if (card && card.dataset.itemId !== appState.draggedItemId) {
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drop-zone-active');
    }
}

export function handleDragLeave(e) {
    const card = e.target.closest('.schema-item-card');
    if (card) card.classList.remove('drop-zone-active');
}

export function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const targetCard = e.target.closest('.schema-item-card');
    if (targetCard) targetCard.classList.remove('drop-zone-active');

    if (targetCard && appState.draggedItemId && targetCard.dataset.itemId !== appState.draggedItemId) {
        const dragged = findItemAndParent(appState.draggedItemId);
        const target = findItemAndParent(targetCard.dataset.itemId);

        if (dragged && target && dragged.parentArray === target.parentArray) {
            const itemToMove = dragged.parentArray.splice(dragged.index, 1)[0];
            target.parentArray.splice(target.index, 0, itemToMove);
            render();
        } else {
            showToast("Can only reorder items at the same level.", "error");
        }
    }
}

export async function handleCopySchema() {
    const schemaText = dom.schemaOutput.textContent;
    const originalBtnHTML = dom.copySchemaBtn.innerHTML;
    try {
        await navigator.clipboard.writeText(schemaText);
        showToast("Schema copied to clipboard!");
        dom.copySchemaBtn.innerHTML = `${ICONS.check} Copied!`;
        dom.copySchemaBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        dom.copySchemaBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        setTimeout(() => {
            dom.copySchemaBtn.innerHTML = originalBtnHTML;
            dom.copySchemaBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            dom.copySchemaBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 2000);
    } catch (err) {
        showToast("Failed to copy schema.", "error");
        console.error('Failed to copy: ', err);
    }
}

export function handleExportSchema() {
    const schemaText = dom.schemaOutput.textContent;
    const blob = new Blob([schemaText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appState.title.replace(/[\s/]/g, '_') || 'schema'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function toggleImportModal(show = true) {
    dom.importModal.classList.toggle('hidden', !show);
}

export function handleImportFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            dom.importSchemaText.value = e.target.result;
            showToast(`Loaded ${file.name} successfully.`);
        };
        reader.onerror = () => showToast(`Error reading file.`, "error");
        reader.readAsText(file);
    }
}

export function handleParseAndLoad() {
    const schemaStr = dom.importSchemaText.value;
    if (!schemaStr.trim()) {
        showToast("Import field is empty.", "error");
        return;
    }

    if (!confirm('Importing a new schema will replace your current work. Are you sure you want to continue?')) {
        return;
    }

    try {
        const importedObj = JSON.parse(schemaStr);
        parseAndLoadRootSchema(importedObj);
        showToast("Schema imported successfully!");
        toggleImportModal(false);
        dom.importSchemaText.value = '';
    } catch (error) {
        showToast(`Error parsing schema: ${error.message}`, "error");
    }
}

function parseAndLoadRootSchema(schema) {
    appState.nextId = 0;
    appState.title = schema.title || 'Imported Schema';
    appState.description = schema.description || '';
    appState.definitions = [];
    
    if (schema.$defs) {
        appState.definitions = Object.entries(schema.$defs).map(([name, defSchema]) => 
            mapJsonToInternal(defSchema, {name, isDefinition: true}));
    }

    if (schema.oneOf) {
        appState.rootSchemaType = 'oneOf';
        appState.schemaDefinition = schema.oneOf.map(s => mapJsonToInternal(s));
    } else if (schema.type === 'object' || (!schema.type && schema.properties)) {
        appState.rootSchemaType = 'object';
        const required = schema.required || [];
        appState.schemaDefinition = schema.properties ? Object.entries(schema.properties).map(([name, propSchema]) => 
            mapJsonToInternal(propSchema, { name, required: required.includes(name) })) : [];
    } else if (schema.type === 'array') {
        appState.rootSchemaType = 'array';
        appState.schemaDefinition = schema.items ? mapJsonToInternal(schema.items) : createSchemaItem({type: 'string'});
    } else if (FIELD_TYPES.root.includes(schema.type)) {
        appState.rootSchemaType = schema.type;
        appState.schemaDefinition = mapJsonToInternal(schema);
    } else {
        appState.rootSchemaType = 'object';
        appState.schemaDefinition = [];
    }
    render();
}

export function handleClearSchema() {
    if (confirm('Are you sure you want to clear the entire schema and start over? This cannot be undone.')) {
        clearState();
        
        // Reset state to initial values
        appState.rootSchemaType = 'object';
        appState.title = 'Generated Schema';
        appState.description = 'A schema generated by the JSON Schema Builder';
        appState.definitions = [];
        appState.schemaDefinition = [];
        appState.nextId = 0;
        
        resetSchemaDefinitionForRootType();
        render();
        showToast("Schema cleared.");
    }
}

export function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('schemaBuilderTheme', isDark ? 'dark' : 'light');
    dom.themeToggleBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
}

export function initResizablePanels() {
    const savedWidth = localStorage.getItem('schemaBuilderLeftPanelWidth');
    if (savedWidth) dom.leftPanel.style.flexBasis = savedWidth;
    else dom.leftPanel.style.flexBasis = '50%';

    const mouseMoveHandler = (e) => {
        e.preventDefault();
        const containerRect = dom.mainContainer.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;
        if (newLeftWidth > 300 && newLeftWidth < (containerRect.width - 300)) {
            dom.leftPanel.style.flexBasis = `${newLeftWidth}px`;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        localStorage.setItem('schemaBuilderLeftPanelWidth', dom.leftPanel.style.flexBasis);
    };

    dom.resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
}
