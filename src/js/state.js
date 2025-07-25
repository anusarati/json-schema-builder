import { loadState } from './persistence.js';

// Function to create a default state for a single schema
export function createDefaultSchemaState() {
    return {
        title: 'New Schema',
        description: 'A schema generated by the JSON Schema Builder',
        rootSchemaType: 'object',
        includeSchemaProperty: true,
        schemaDefinition: [],
        definitions: [],
        nextId: 0,
        // New properties for root object validation
        additionalPropertiesType: 'allow', // 'allow', 'disallow', 'schema'
        additionalPropertiesSchema: null,
        minProperties: undefined,
        maxProperties: undefined,
        isRootValidationCollapsed: false,
        // New properties for root conditional validation
        ifSchema: null,
        thenSchema: null,
        elseSchema: null,
        isConditionalCollapsed: false,
    };
}

const initialState = {
    schemas: [createDefaultSchemaState()],
    activeSchemaIndex: 0,
    draggedItemId: null,
    importTargetItemId: null, // To track which item is being imported into
};

const loadedState = loadState();

export let appState = {
    ...initialState,
    ...loadedState, // Overwrite defaults with any saved state.
};

// Getter for the active schema's state
export function getActiveSchemaState() {
    if (!appState.schemas || appState.schemas.length === 0) {
        // This is a fallback, should ideally not be reached if state is managed properly
        appState.schemas = [createDefaultSchemaState()];
        appState.activeSchemaIndex = 0;
    }
    return appState.schemas[appState.activeSchemaIndex];
}
