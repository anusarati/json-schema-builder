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
    if (type === 'object' || type === 'oneOf') {
        activeSchema.schemaDefinition = [];
    } else if (type === 'array') {
        activeSchema.schemaDefinition = createSchemaItem({ type: 'string' });
    } else {
        activeSchema.schemaDefinition = createSchemaItem({ type });
    }
}

export function handleRootTypeChange(e) {
    getActiveSchemaState().rootSchemaType = e.target.value;
    resetSchemaDefinitionForRootType();
    render();
}

export function handleClearSchema() {
    if (confirm('Are you sure you want to clear the current schema and start over? This cannot be undone.')) {
        // Reset current schema to default state, including title and description.
        appState.schemas[appState.activeSchemaIndex] = createDefaultSchemaState();
        
        resetSchemaDefinitionForRootType();
        render();
        showToast("Current schema has been reset.");
    }
}
