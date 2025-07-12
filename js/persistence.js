const LOCAL_STORAGE_KEY = 'jsonSchemaBuilderState_v2'; // New key to prevent conflicts

/**
 * Saves the application state to localStorage.
 * @param {object} state The global application state.
 */
export function saveState(state) {
    try {
        // We only need to save the schemas and the active index
        const stateToSave = {
            schemas: state.schemas,
            activeSchemaIndex: state.activeSchemaIndex,
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
            // Check for old state format and migrate if possible
            const oldState = localStorage.getItem('jsonSchemaBuilderState');
            if(oldState) {
                console.log("Found old state, migrating...");
                const parsedOldState = JSON.parse(oldState);
                localStorage.removeItem('jsonSchemaBuilderState'); // Clean up old key
                return {
                    schemas: [parsedOldState], // Wrap old state in the new structure
                    activeSchemaIndex: 0
                };
            }
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
        localStorage.removeItem('jsonSchemaBuilderState'); // Also clear old key
    } catch (e) {
        console.error("Failed to clear state from localStorage", e);
    }
}
