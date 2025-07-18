import { appState, getActiveSchemaState, createDefaultSchemaState } from '../state.js';
import { generateAndDisplaySchema, createSchemaItem } from '../schema.js';
import { render } from '../renderer.js';
import { showToast } from '../utils.js';
import { dom } from '../dom.js';
import { snapshotNow } from '../history.js';

export function handleGlobalDetailChange(e, options = {}) {
    const { commit = false } = options;
    const activeSchema = getActiveSchemaState();
    const { id, value } = e.target;
    const property = e.target.id.replace('root', '').charAt(0).toLowerCase() + e.target.id.replace('root', '').slice(1);


    if (id === 'schemaTitle') {
        activeSchema.title = value;
        const tabText = dom.schemaTabsContainer.querySelector(`[data-schema-index="${appState.activeSchemaIndex}"] .tab-text`);
        if (tabText) {
            tabText.textContent = value || 'Untitled Schema';
        }
    } else if (id === 'schemaDescription') {
        activeSchema.description = value;
    } else if (id === 'rootMinProperties' || id === 'rootMaxProperties') {
        activeSchema[property] = value === '' ? undefined : parseFloat(value);
    }


    generateAndDisplaySchema();
    if (commit) {
        snapshotNow();
    }
}

export function handleRootAdditionalPropertiesChange(e) {
    const activeSchema = getActiveSchemaState();
    const { value } = e.target;
    activeSchema.additionalPropertiesType = value;
    if (value === 'schema' && !activeSchema.additionalPropertiesSchema) {
        activeSchema.additionalPropertiesSchema = createSchemaItem({ type: 'string' });
    }
    render();
}


export function handleSchemaPropertyToggle(e, options = {}) {
    const { commit = false } = options;
    const activeSchema = getActiveSchemaState();
    activeSchema.includeSchemaProperty = e.target.checked;
    
    generateAndDisplaySchema();
    if (commit) {
        snapshotNow();
    }
}

export function resetSchemaDefinitionForRootType() {
    const activeSchema = getActiveSchemaState();
    const type = activeSchema.rootSchemaType;
    activeSchema.nextId = 0; // Reset ID counter for a clean slate
    if (['object', 'oneOf', 'allOf', 'anyOf', 'function'].includes(type)) {
        activeSchema.schemaDefinition = [];
    } else if (type === 'array') {
        activeSchema.schemaDefinition = createSchemaItem({ type: 'string' });
    } else if (type === 'not') {
        activeSchema.schemaDefinition = createSchemaItem({ type: 'string' });
    } else {
        // Primitives like string, number, etc.
        activeSchema.schemaDefinition = createSchemaItem({ type });
    }
}

export function handleRootTypeChange(e) {
    const activeSchema = getActiveSchemaState();
    const oldType = activeSchema.rootSchemaType;
    const newType = e.target.value;

    if ((oldType === 'object' && newType === 'function') || (oldType === 'function' && newType === 'object')) {
        activeSchema.rootSchemaType = newType;
    } else {
        activeSchema.rootSchemaType = newType;
        resetSchemaDefinitionForRootType();
    }
    
    render();
}

export function handleClearSchema() {
    if (confirm('Are you sure you want to clear the current schema and start over? This cannot be undone.')) {
        const currentType = getActiveSchemaState().rootSchemaType;
        const newDefault = createDefaultSchemaState();
        newDefault.rootSchemaType = currentType; // Preserve the selected root type
        appState.schemas[appState.activeSchemaIndex] = newDefault;
        
        resetSchemaDefinitionForRootType();
        render();
        showToast("Current schema has been reset.");
    }
}
