import { appState, getActiveSchemaState } from '../state.js';
import { createSchemaItem, generateAndDisplaySchema, mapJsonToInternal, buildSchemaFromItem } from '../schema.js';
import { findItemAndParent, showToast } from '../utils.js';
import { render } from '../renderer.js';
import { ICONS } from '../config.js';

export function handleAddRootItem() {
    const activeSchema = getActiveSchemaState();
    const newItem = createSchemaItem({ type: 'string' });
    activeSchema.schemaDefinition.push(newItem);
    render();
}

export function handleAddDefinition() {
    const activeSchema = getActiveSchemaState();
    const newDef = createSchemaItem({ isDefinition: true, type: 'object', name: `NewDefinition${activeSchema.definitions.length + 1}` });
    activeSchema.definitions.push(newDef);
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

export function handleItemUpdate(itemId, inputElement) {
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;

    const item = found.item;
    const property = inputElement.dataset.property;
    const oldType = item.type;
    let value = inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value;

    if (inputElement.type === 'number') {
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
        if (confirm(`Are you sure you want to delete "${found.item.name || 'this item'}"?`)) {
            found.parentArray.splice(found.index, 1);
            render();
        }
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

export function handleParseRootProperties(jsonString) {
    const activeSchema = getActiveSchemaState();
    const importedData = JSON.parse(jsonString);
    const rootType = activeSchema.rootSchemaType;

    if (rootType === 'object' || rootType === 'function') {
        if (typeof importedData !== 'object' || Array.isArray(importedData)) {
            throw new Error("Expected a JSON object of properties.");
        }
        const required = importedData.required || [];
        const properties = importedData.properties || importedData;
        activeSchema.schemaDefinition = Object.entries(properties).map(([name, schema]) => 
            mapJsonToInternal(schema, { name, required: required.includes(name) })
        );
    } else if (rootType === 'oneOf') {
        if (!Array.isArray(importedData)) {
            throw new Error("Expected a JSON array for oneOf options.");
        }
        activeSchema.schemaDefinition = importedData.map(schema => mapJsonToInternal(schema));
    } else if (rootType === 'array') {
        if (typeof importedData !== 'object' || Array.isArray(importedData)) {
            throw new Error("Expected a JSON object for item schema.");
        }
        activeSchema.schemaDefinition = mapJsonToInternal(importedData);
    }
}

export function handleParseProperty(itemId, jsonString) {
    const found = findItemAndParent(itemId);
    if (!found) {
        throw new Error("Target item not found.");
    }
    
    const importedData = JSON.parse(jsonString);
    const item = found.item;

    if (item.type === 'object') {
        if (typeof importedData !== 'object' || Array.isArray(importedData)) {
            throw new Error("Expected a JSON object for properties.");
        }
        const required = importedData.required || [];
        const properties = importedData.properties || importedData;
        const newProperties = Object.entries(properties).map(([name, schema]) => 
            mapJsonToInternal(schema, { name, required: required.includes(name) })
        );
        item.properties.push(...newProperties);
    } else if (item.type === 'array') {
            if (typeof importedData !== 'object' || Array.isArray(importedData)) {
            throw new Error("Expected a JSON object for item schema.");
        }
        item.items = mapJsonToInternal(importedData);
    } else if (item.type === 'oneOf') {
        if (!Array.isArray(importedData)) {
            throw new Error("Expected a JSON array for oneOf options.");
        }
        const newOptions = importedData.map(schema => mapJsonToInternal(schema));
        item.oneOfSchemas.push(...newOptions);
    }
}

export async function handleCopyPropertyJson(itemId, buttonElement) {
    const found = findItemAndParent(itemId);
    if (!found) {
        showToast("Could not find item to copy.", "error");
        return;
    }

    const itemSchema = buildSchemaFromItem(found.item);
    // If it's a property (has a name and is not a definition), copy the { "name": schema } structure.
    // Otherwise (for definitions), just copy the schema object itself.
    const objectToCopy = (found.item.name && !found.item.isDefinition)
        ? { [found.item.name]: itemSchema }
        : itemSchema;
    
    const jsonString = JSON.stringify(objectToCopy, null, 2);

    const originalBtnHTML = buttonElement.innerHTML;
    try {
        await navigator.clipboard.writeText(jsonString);
        showToast(`JSON for "${found.item.name || 'item'}" copied!`);
        
        buttonElement.innerHTML = ICONS.check;
        buttonElement.classList.add('text-green-500');

        setTimeout(() => {
            buttonElement.innerHTML = originalBtnHTML;
            buttonElement.classList.remove('text-green-500');
        }, 2000);
    } catch (err) {
        showToast("Failed to copy JSON.", "error");
        console.error('Failed to copy: ', err);
    }
}
