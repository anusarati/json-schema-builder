import { appState, getActiveSchemaState, createDefaultSchemaState } from '../state.js';
import { generateAndDisplaySchema, createSchemaItem } from '../schema.js';
import { render } from '../renderer.js';
import { showToast } from '../utils.js';
import { dom } from '../dom.js';

export function handleGlobalDetailChange(e) {
    const activeSchema = getActiveSchemaState();
    const { id, value } = e.target;
    if (id === 'schemaTitle') {
        activeSchema.title = value;
        // Also update tab text in real-time
        const tabText = dom.schemaTabsContainer.querySelector(`[data-schema-index="${appState.activeSchemaIndex}"] .tab-text`);
        if (tabText) {
            tabText.textContent = value || 'Untitled Schema';
        }
    }
    if (id === 'schemaDescription') {
        activeSchema.description = value;
    }
    generateAndDisplaySchema();
}

export function resetSchemaDefinitionForRootType() {
    const activeSchema = getActiveSchemaState();
    const type = activeSchema.rootSchemaType;
    activeSchema.nextId = 0; // Reset ID counter for a clean slate
    if (type === 'object' || type === 'oneOf' || type === 'function') {
        activeSchema.schemaDefinition = [];
    } else if (type === 'array') {
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

    // Gracefully handle conversion between object and function, as they share
    // the same underlying structure for their properties/parameters.
    if ((oldType === 'object' && newType === 'function') || (oldType === 'function' && newType === 'object')) {
        activeSchema.rootSchemaType = newType;
    } else {
        // For all other type changes, reset the definition to a clean slate.
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
