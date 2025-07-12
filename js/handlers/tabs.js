import { appState, createDefaultSchemaState } from '../state.js';
import { render } from '../renderer.js';
import { showToast } from '../utils.js';

export function handleAddSchema() {
    const newSchema = createDefaultSchemaState();
    newSchema.title = `Schema ${appState.schemas.length + 1}`;
    appState.schemas.push(newSchema);
    appState.activeSchemaIndex = appState.schemas.length - 1;
    render();
    showToast("New schema added.");
}

export function handleSwitchSchema(index) {
    if (index >= 0 && index < appState.schemas.length && index !== appState.activeSchemaIndex) {
        appState.activeSchemaIndex = index;
        render();
    }
}

export function handleCloseSchema(index) {
    if (appState.schemas.length <= 1) {
        showToast("Cannot close the last schema.", "error");
        return;
    }
    
    if (!confirm(`Are you sure you want to close "${appState.schemas[index].title}"? This cannot be undone.`)) {
        return;
    }

    const closedTitle = appState.schemas[index].title;
    appState.schemas.splice(index, 1);
    
    // Adjust active index if necessary
    if (appState.activeSchemaIndex >= index) {
        appState.activeSchemaIndex = Math.max(0, appState.activeSchemaIndex - 1);
    }
    
    render();
    showToast(`Schema "${closedTitle}" closed.`);
}
