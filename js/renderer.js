import { appState } from './state.js';
import { dom } from './dom.js';
import { generateAndDisplaySchema } from './schema.js';
import { renderItem } from './components.js';
import { ICONS } from './config.js';
import { handleAddRootItem } from './events.js';

function renderRootControls() {
    dom.rootActionControls.innerHTML = '';
    let btnText = '';
    if (appState.rootSchemaType === 'object') btnText = 'Add Root Property';
    else if (appState.rootSchemaType === 'oneOf') btnText = 'Add Root Option';
    
    if (btnText) {
        const addBtn = document.createElement('button');
        addBtn.innerHTML = `${ICONS.plus} ${btnText}`;
        addBtn.className = 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800';
        addBtn.addEventListener('click', handleAddRootItem);
        dom.rootActionControls.appendChild(addBtn);
    }
}

export function render() {
    dom.schemaTitle.value = appState.title;
    dom.schemaDescription.value = appState.description;
    dom.rootSchemaTypeSelector.value = appState.rootSchemaType;
    
    renderRootControls();
    dom.schemaBuilderRoot.innerHTML = '';
    if (['object', 'oneOf'].includes(appState.rootSchemaType)) {
        if(appState.schemaDefinition.length > 0) {
            appState.schemaDefinition.forEach(item => dom.schemaBuilderRoot.appendChild(renderItem(item)));
        } else {
            dom.schemaBuilderRoot.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400">No ${appState.rootSchemaType === 'object' ? 'properties' : 'options'} defined.</div>`;
        }
    } else if (appState.rootSchemaType === 'array') {
        dom.schemaBuilderRoot.appendChild(renderItem(appState.schemaDefinition, { isRootArrayItem: true }));
    } else {
        dom.schemaBuilderRoot.appendChild(renderItem(appState.schemaDefinition, { isRootPrimitive: true }));
    }

    dom.definitionsBuilderRoot.innerHTML = '';
     if(appState.definitions.length > 0) {
        appState.definitions.forEach(def => dom.definitionsBuilderRoot.appendChild(renderItem(def, { isDefinition: true })));
    } else {
        dom.definitionsBuilderRoot.innerHTML = `<div class="text-center py-4 text-gray-500 dark:text-gray-400">No reusable definitions created.</div>`;
    }

    generateAndDisplaySchema();
}
