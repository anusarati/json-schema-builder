import { appState, getActiveSchemaState } from '../state.js';
import { createSchemaItem, generateAndDisplaySchema, mapJsonToInternal, buildSchemaFromItem } from '../schema.js';
import { findItemAndParent, showToast } from '../utils.js';
import { render } from '../renderer.js';
import { ICONS } from '../config.js';
import { snapshotNow } from '../history.js';

export function handleAddRootItem() {
    const activeSchema = getActiveSchemaState();
    const newItem = createSchemaItem({ type: 'string' });
    activeSchema.schemaDefinition.push(newItem);
    render();
}

export function handleAddDefinition() {
    const activeSchema = getActiveSchemaState();
    const newDef = createSchemaItem({
        isDefinition: true,
        type: 'object',
        name: `NewDefinition${activeSchema.definitions.length + 1}`
    });
    activeSchema.definitions.push(newDef);
    render();
}

export function handleAddNestedItem(itemId, property) {
    const found = findItemAndParent(itemId);
    if (found && found.item) {
        const newItem = createSchemaItem({ type: 'string' });
        found.item[property].push(newItem);
        render();
    }
}

export function handleAddConditionalSchema(itemId, conditionalType) {
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;
    
    const key = `${conditionalType}Schema`;
    if (!found.item[key]) {
        found.item[key] = createSchemaItem({ type: 'object' });
        render();
    }
}

export function handleDeleteConditionalSchema(itemId, conditionalType) {
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;

    if (confirm(`Are you sure you want to delete the ${conditionalType.toUpperCase()} schema?`)) {
        const key = `${conditionalType}Schema`;
        found.item[key] = null;
        render();
    }
}

export function handleAddRootConditionalSchema(conditionalType) {
    const activeSchema = getActiveSchemaState();
    const key = `${conditionalType}Schema`;
    if (!activeSchema[key]) {
        activeSchema[key] = createSchemaItem({ type: 'object' });
        render();
    }
}

export function handleDeleteRootConditionalSchema(conditionalType) {
    if (confirm(`Are you sure you want to delete the root ${conditionalType.toUpperCase()} schema?`)) {
        const activeSchema = getActiveSchemaState();
        const key = `${conditionalType}Schema`;
        activeSchema[key] = null;
        render();
    }
}

export function handleToggleConditionalCollapse(itemId) {
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;
    found.item.isConditionalCollapsed = !found.item.isConditionalCollapsed;
    render(); // Re-render to update the chevron and container class
}

export function handleToggleRootConditionalCollapse() {
    const activeSchema = getActiveSchemaState();
    activeSchema.isConditionalCollapsed = !activeSchema.isConditionalCollapsed;
    render(); // Re-render to update the chevron and container class
}

export function handleToggleValidationCollapse(itemId) {
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;
    found.item.isValidationCollapsed = !found.item.isValidationCollapsed;
    render();
}

export function handleToggleRootValidationCollapse() {
    const activeSchema = getActiveSchemaState();
    activeSchema.isRootValidationCollapsed = !activeSchema.isRootValidationCollapsed;
    render();
}


export function handleItemUpdate(itemId, inputElement, options = {}) {
    const { commit = false } = options;
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;

    const item = found.item;
    const property = inputElement.dataset.property;
    const oldType = item.type;
    const oldAdditionalPropertiesType = item.additionalPropertiesType;

    let value = inputElement.type === 'checkbox' ?
        inputElement.checked :
        inputElement.value;

    if (inputElement.type === 'number') {
        value = value === '' ? undefined : parseFloat(value);
    }
    if (property === 'enum') {
        value = value.split(',').map((s) => s.trim()).filter(Boolean);
    }

    item[property] = value;

    // --- START: NEW MUTUAL EXCLUSION LOGIC ---
    const card = inputElement.closest('.schema-item-card');
    if (card && value !== undefined) { // Only clear if a value was actually entered
        if (property === 'minimum') {
            item.exclusiveMinimum = undefined;
            const exMinInput = card.querySelector(`input[data-property="exclusiveMinimum"]`);
            if (exMinInput) exMinInput.value = '';
        } else if (property === 'exclusiveMinimum') {
            item.minimum = undefined;
            const minInput = card.querySelector(`input[data-property="minimum"]`);
            if (minInput) minInput.value = '';
        } else if (property === 'maximum') {
            item.exclusiveMaximum = undefined;
            const exMaxInput = card.querySelector(`input[data-property="exclusiveMaximum"]`);
            if (exMaxInput) exMaxInput.value = '';
        } else if (property === 'exclusiveMaximum') {
            item.maximum = undefined;
            const maxInput = card.querySelector(`input[data-property="maximum"]`);
            if (maxInput) maxInput.value = '';
        }
    }
    // --- END: NEW MUTUAL EXCLUSION LOGIC ---

    if (property === 'name') {
        const card = inputElement.closest('.schema-item-card');
        const title = card?.querySelector('.field-title');
        if (title) {
            const display = value || (item.isDefinition ? '(unnamed definition)' : '(unnamed)');
            title.textContent = display;
            title.title = display;
        }
    }

    // If additionalPropertiesType changes, we might need to re-render
    if (property === 'additionalPropertiesType' && value !== oldAdditionalPropertiesType) {
        if (value === 'schema' && !item.additionalPropertiesSchema) {
            item.additionalPropertiesSchema = createSchemaItem({ type: 'string' });
        }
        render();
        return; // Full render handles snapshot
    }

    if (property === 'type' && value !== oldType) {
        item.properties = [];
        item.items = null;
        item.oneOfSchemas = [];
        item.allOfSchemas = [];
        item.anyOfSchemas = [];
        item.notSchema = null;
        item.ref = '';

        if (value === 'object') item.properties = [];
        if (value === 'array') item.items = createSchemaItem({ type: 'string' });
        if (value === 'oneOf') item.oneOfSchemas = [];
        if (value === 'allOf') item.allOfSchemas = [];
        if (value === 'anyOf') item.anyOfSchemas = [];
        if (value === 'not') item.notSchema = createSchemaItem({ type: 'string' });

        render(); // This triggers an immediate snapshot via the 'builder:rendered' event.
    } else {
        generateAndDisplaySchema();
        if (commit) {
            snapshotNow();
        }
    }
}

export function handleToggleCollapse(itemId) {
    const found = findItemAndParent(itemId);
    if (!found || !found.item) return;

    const card = document.querySelector(`.schema-item-card[data-item-id="${itemId}"]`);
    const content = card?.querySelector('.collapsible-content');
    const chevron = card?.querySelector('.toggle-chevron');
    if (!card || !content || !chevron) return;

    const willExpand = found.item.isCollapsed;

    if (willExpand) {
        content.classList.remove('collapsed');
        content.style.maxHeight = `${content.scrollHeight}px`;
        chevron.classList.add('rotate-180');

        content.addEventListener('transitionend', function handler() {
            content.style.maxHeight = 'none';
            content.removeEventListener('transitionend', handler);
        });
    } else {
        content.style.maxHeight = `${content.scrollHeight}px`;
        requestAnimationFrame(() => {
            content.classList.add('collapsed');
            content.style.maxHeight = '0';
            chevron.classList.remove('rotate-180');
        });
    }

    found.item.isCollapsed = !found.item.isCollapsed;
}

export function handleDeleteItem(itemId) {
    const found = findItemAndParent(itemId);
    if (found && found.parentArray) {
        if (
            confirm(
                `Are you sure you want to delete "${
          found.item.name || 'this item'
        }"?`
            )
        ) {
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
        [parentArray[index], parentArray[newIndex]] = [
            parentArray[newIndex],
            parentArray[index]
        ];
        render();
    }
}

export function handleParseRootProperties(jsonString) {
    const activeSchema = getActiveSchemaState();
    const rootType = activeSchema.rootSchemaType;
    const parsed = JSON.parse(jsonString);

    if (rootType === 'object' || rootType === 'function') {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object for properties.');
        const required = parsed.required || [];
        const newProps = Object.entries(parsed.properties || parsed).map(([name, propSchema]) =>
            mapJsonToInternal(propSchema, { name, required: required.includes(name) })
        );
        activeSchema.schemaDefinition.push(...newProps);
    } else if (['oneOf', 'allOf', 'anyOf'].includes(rootType)) {
        if (!Array.isArray(parsed)) throw new Error(`Expected a JSON array for ${rootType} options.`);
        const newOptions = parsed.map(s => mapJsonToInternal(s));
        activeSchema.schemaDefinition.push(...newOptions);
    } else if (rootType === 'array') {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object for array items.');
        activeSchema.schemaDefinition = mapJsonToInternal(parsed);
    } else if (rootType === 'not') {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object for the not schema.');
        activeSchema.schemaDefinition = mapJsonToInternal(parsed);
    }
    render();
}

export function handleParseProperty(itemId, jsonString) {
    const found = findItemAndParent(itemId);
    if (!found) return;
    const parsed = JSON.parse(jsonString);

    if (found.item.type === 'object') {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object for properties.');
        const required = parsed.required || [];
        const newProps = Object.entries(parsed.properties || parsed).map(([name, propSchema]) =>
            mapJsonToInternal(propSchema, { name, required: required.includes(name) })
        );
        found.item.properties.push(...newProps);
    } else if (['oneOf', 'allOf', 'anyOf'].includes(found.item.type)) {
        if (!Array.isArray(parsed)) throw new Error(`Expected a JSON array for ${found.item.type} options.`);
        const newOptions = parsed.map(s => mapJsonToInternal(s));
        const key = `${found.item.type}Schemas`;
        found.item[key].push(...newOptions);
    } else if (found.item.type === 'not') {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object for the not schema.');
        found.item.notSchema = mapJsonToInternal(parsed);
    } else if (found.item.type === 'array') {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object for array items.');
        found.item.items = mapJsonToInternal(parsed);
    }
    render();
}

export async function handleCopyPropertyJson(itemId, buttonElement) {
    const found = findItemAndParent(itemId);
    if (!found) return;

    const originalBtnHTML = buttonElement.innerHTML;
    try {
        const schemaJson = buildSchemaFromItem(found.item);
        await navigator.clipboard.writeText(JSON.stringify(schemaJson, null, 2));
        showToast("Property JSON copied!");
        buttonElement.innerHTML = ICONS.check;
        setTimeout(() => {
            buttonElement.innerHTML = originalBtnHTML;
        }, 2000);
    } catch (err) {
        showToast("Failed to copy JSON.", "error");
    }
}
