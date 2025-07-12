import { appState } from '../state.js';
import { createSchemaItem, generateAndDisplaySchema } from '../schema.js';
import { findItemAndParent } from '../utils.js';
import { render } from '../renderer.js';

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
        render();
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
