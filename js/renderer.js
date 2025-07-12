import { appState, getActiveSchemaState } from './state.js';
import { dom } from './dom.js';
import { generateAndDisplaySchema } from './schema.js';
import { renderItem } from './components/Item.js';
import { ICONS } from './config.js';
import { handleAddRootItem } from './handlers/item.js';
import { handleAddSchema, handleSwitchSchema, handleCloseSchema } from './handlers/tabs.js';

function renderTabs() {
    dom.schemaTabsContainer.innerHTML = '';
    const tabsList = document.createElement('div');
    tabsList.className = 'flex items-center gap-1 p-1';

    appState.schemas.forEach((schema, index) => {
        const isActive = index === appState.activeSchemaIndex;
        const tab = document.createElement('div');
        tab.className = `flex items-center justify-between gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-colors ${
            isActive 
            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
        }`;
        tab.dataset.schemaIndex = index;

        const tabText = document.createElement('span');
        tabText.className = 'tab-text whitespace-nowrap';
        tabText.textContent = schema.title || 'Untitled Schema';
        tab.appendChild(tabText);

        if (appState.schemas.length > 1) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'p-0.5 rounded-full text-slate-500 hover:bg-slate-300 dark:text-slate-600 dark:hover:bg-slate-500';
            closeBtn.innerHTML = ICONS.close;
            closeBtn.ariaLabel = 'Close schema';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleCloseSchema(index);
            });
            tab.appendChild(closeBtn);
        }
        
        tab.addEventListener('click', () => handleSwitchSchema(index));
        tabsList.appendChild(tab);
    });

    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'ml-1 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0';
    addTabBtn.innerHTML = ICONS.plus;
    addTabBtn.title = 'Add New Schema';
    addTabBtn.ariaLabel = 'Add new schema';
    addTabBtn.addEventListener('click', handleAddSchema);
    
    dom.schemaTabsContainer.appendChild(tabsList);
    dom.schemaTabsContainer.appendChild(addTabBtn);
}

function renderRootControls() {
    dom.rootActionControls.innerHTML = '';
    const activeSchema = getActiveSchemaState();
    if (!activeSchema) return;
    
    let btnText = '';
    if (activeSchema.rootSchemaType === 'object') btnText = 'Add Root Property';
    else if (activeSchema.rootSchemaType === 'oneOf') btnText = 'Add Root Option';
    
    if (btnText) {
        const addBtn = document.createElement('button');
        addBtn.innerHTML = `${ICONS.plus} ${btnText}`;
        addBtn.className = 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-colors';
        addBtn.addEventListener('click', handleAddRootItem);
        dom.rootActionControls.appendChild(addBtn);
    }
}

export function render() {
    renderTabs(); // Render tabs first

    const activeSchema = getActiveSchemaState();
    if (!activeSchema) {
        // This case should be handled by getActiveSchemaState, but as a fallback:
        dom.leftPanelScroller.classList.add('hidden');
        generateAndDisplaySchema();
        return;
    }
    dom.leftPanelScroller.classList.remove('hidden');

    dom.schemaTitle.value = activeSchema.title;
    dom.schemaDescription.value = activeSchema.description;
    dom.rootSchemaTypeSelector.value = activeSchema.rootSchemaType;
    
    renderRootControls();
    dom.schemaBuilderRoot.innerHTML = '';
    if (['object', 'oneOf'].includes(activeSchema.rootSchemaType)) {
        if(activeSchema.schemaDefinition.length > 0) {
            activeSchema.schemaDefinition.forEach(item => dom.schemaBuilderRoot.appendChild(renderItem(item)));
        } else {
            dom.schemaBuilderRoot.innerHTML = `<div class="text-center py-8 text-slate-500 dark:text-slate-500">No ${activeSchema.rootSchemaType === 'object' ? 'properties' : 'options'} defined.</div>`;
        }
    } else if (activeSchema.rootSchemaType === 'array') {
        dom.schemaBuilderRoot.appendChild(renderItem(activeSchema.schemaDefinition, { isRootArrayItem: true }));
    } else {
        dom.schemaBuilderRoot.appendChild(renderItem(activeSchema.schemaDefinition, { isRootPrimitive: true }));
    }

    dom.definitionsBuilderRoot.innerHTML = '';
     if(activeSchema.definitions.length > 0) {
        activeSchema.definitions.forEach(def => dom.definitionsBuilderRoot.appendChild(renderItem(def, { isDefinition: true })));
    } else {
        dom.definitionsBuilderRoot.innerHTML = `<div class="text-center py-4 text-slate-500 dark:text-slate-500">No reusable definitions created.</div>`;
    }

    generateAndDisplaySchema();
}
