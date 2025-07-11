const LOCAL_STORAGE_KEY = 'jsonSchemaBuilderState';

/**
 * Saves the relevant parts of the application state to localStorage.
 * @param {object} state The global application state.
 */
export function saveState(state) {
    try {
        const stateToSave = {
            title: state.title,
            description: state.description,
            rootSchemaType: state.rootSchemaType,
            schemaDefinition: state.schemaDefinition,
            definitions: state.definitions,
            nextId: state.nextId,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
        console.error("Failed to save state to localStorage", e);
    }
}

/**
 * Loads the application state from localStorage.
 * @returns {object|undefined} The saved state object, or undefined if none exists.
 */
export function loadState() {
    try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState === null) {
            return undefined; // No saved state
        }
        return JSON.parse(savedState);
    } catch (e) {
        console.error("Failed to load state from localStorage", e);
        return undefined;
    }
}

/**
 * Removes the saved state from localStorage.
 */
export function clearState() {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear state from localStorage", e);
    }
}
