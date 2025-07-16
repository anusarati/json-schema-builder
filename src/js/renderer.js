import { appState, getActiveSchemaState } from './state.js';
import { dom } from './dom.js';
import { generateAndDisplaySchema } from './schema.js';
import { renderItem } from './components/Item.js';
import { renderNestedBuilder } from './components/Nested.js';
import { ICONS } from './config.js';
import { handleAddRootItem } from './handlers/item.js';
import { handleAddSchema, handleSwitchSchema, handleCloseSchema } from './handlers/tabs.js';

/**
 * Updates the disabled state of the undo/redo buttons based on the
 * current position in the history stack.
 */
export function updateUndoRedoButtons() {
    if (dom.undoBtn && dom.redoBtn) {
        dom.undoBtn.disabled = appState.historyPointer <= 0;
        dom.redoBtn.disabled = appState.historyPointer >= appState.history.length - 1;
    }
}

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
    const type = activeSchema.rootSchemaType;
    if (type === 'object') btnText = 'Add Root Property';
    else if (type === 'function') btnText = 'Add Parameter';
    else if (type === 'oneOf') btnText = 'Add Root Option';
    else if (type === 'allOf' || type === 'anyOf') btnText = 'Add Schema';
    
    if (btnText) {
        const addBtn = document.createElement('button');
        addBtn.innerHTML = `${ICONS.plus} ${btnText}`;
        addBtn.className = 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-colors';
        addBtn.addEventListener('click', handleAddRootItem);
        dom.rootActionControls.appendChild(addBtn);
    }
}

function renderRootConditionals() {
    const activeSchema = getActiveSchemaState();
    const container = dom.rootConditionalContainer;
    container.innerHTML = '';
    
    // Only show for types that support it
    if (!['object', 'array'].includes(activeSchema.rootSchemaType)) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    const renderSection = (type, schema) => {
        if (schema) {
            return `
                <div class="conditional-section">
                    <div class="flex justify-between items-center mb-2">
                        <h5 class="text-sm font-semibold uppercase text-${type === 'if' ? 'green' : (type === 'then' ? 'blue' : 'orange')}-600 dark:text-${type === 'if' ? 'green' : (type === 'then' ? 'blue' : 'orange')}-400">${type}</h5>
                        <button data-action="root-delete-conditional" data-conditional-type="${type}" title="Delete ${type.toUpperCase()} Schema" class="p-1 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">${ICONS.trash}</button>
                    </div>
                    <div id="root_nested_${type}"></div>
                </div>`;
        }
        return `
            <button data-action="root-add-conditional" data-conditional-type="${type}" class="flex items-center gap-2 mt-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors">
                ${ICONS.plus} Add ${type.toUpperCase()} Schema
            </button>`;
    };
    
    const isCollapsed = activeSchema.isConditionalCollapsed;

    container.innerHTML = `
        <div data-action="root-toggle-conditional-collapse" class="flex items-center justify-between cursor-pointer">
            <h2 class="text-lg font-semibold text-slate-700 dark:text-slate-200">Root Conditional Validation</h2>
            <span class="toggle-chevron p-1.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                isCollapsed ? '' : 'rotate-180'
            }">${ICONS.chevronUp}</span>
        </div>
        <div class="collapsible-content space-y-4 mt-2 ${isCollapsed ? 'collapsed' : ''}">
            ${renderSection('if', activeSchema.ifSchema)}
            ${activeSchema.ifSchema ? renderSection('then', activeSchema.thenSchema) : ''}
            ${activeSchema.ifSchema ? renderSection('else', activeSchema.elseSchema) : ''}
        </div>
    `;

    // Now render the builders inside the containers
    if (!isCollapsed) {
        if (activeSchema.ifSchema) {
            const ifContainer = container.querySelector('#root_nested_if');
            ifContainer.appendChild(renderNestedBuilder([activeSchema.ifSchema], 'if-schema', null, null, null, { isSubSchema: true }));
        }
        if (activeSchema.thenSchema) {
            const thenContainer = container.querySelector('#root_nested_then');
            thenContainer.appendChild(renderNestedBuilder([activeSchema.thenSchema], 'then-schema', null, null, null, { isSubSchema: true }));
        }
        if (activeSchema.elseSchema) {
            const elseContainer = container.querySelector('#root_nested_else');
            elseContainer.appendChild(renderNestedBuilder([activeSchema.elseSchema], 'else-schema', null, null, null, { isSubSchema: true }));
        }
        const conditionalCollapsible = container.querySelector('.collapsible-content');
        if(conditionalCollapsible) {
            setTimeout(() => (conditionalCollapsible.style.maxHeight = `${conditionalCollapsible.scrollHeight}px`), 0);
        }
    }
}


export function render() {
    updateUndoRedoButtons();

    renderTabs();

    const activeSchema = getActiveSchemaState();
    if (!activeSchema) {
        dom.leftPanelScroller.classList.add('hidden');
        generateAndDisplaySchema();
        return;
    }
    dom.leftPanelScroller.classList.remove('hidden');

    const isFunctionMode = activeSchema.rootSchemaType === 'function';
    const isObjectMode = activeSchema.rootSchemaType === 'object';
    const rootType = activeSchema.rootSchemaType;

    // Update global schema details
    dom.schemaTitle.value = activeSchema.title;
    dom.schemaDescription.value = activeSchema.description;
    dom.rootSchemaTypeSelector.value = rootType;
    dom.schemaTitleLabel.textContent = isFunctionMode ? 'Function Name' : 'Title';
    dom.schemaTitle.placeholder = isFunctionMode ? 'e.g. get_current_weather' : 'My Awesome Schema';
    dom.rootSchemaHeading.textContent = isFunctionMode ? 'Function Parameters' : 'Root Schema Definition';

    dom.includeSchemaToggle.checked = activeSchema.includeSchemaProperty;
    dom.schemaPropertyToggleContainer.classList.toggle('hidden', isFunctionMode);

    // Render root object controls
    const rootObjectControlsContainer = dom.rootObjectControlsContainer;
    rootObjectControlsContainer.classList.toggle('hidden', !isObjectMode);
    if (isObjectMode) {
        const isCollapsed = activeSchema.isRootValidationCollapsed;
        const chevron = rootObjectControlsContainer.querySelector('.toggle-chevron');
        const content = rootObjectControlsContainer.querySelector('.collapsible-content');

        chevron.innerHTML = ICONS.chevronUp;
        chevron.classList.toggle('rotate-180', !isCollapsed);

        dom.rootMinProperties.value = activeSchema.minProperties !== undefined ? activeSchema.minProperties : '';
        dom.rootMaxProperties.value = activeSchema.maxProperties !== undefined ? activeSchema.maxProperties : '';
        dom.rootAdditionalPropertiesType.value = activeSchema.additionalPropertiesType;
        const additionalSchemaContainer = dom.rootAdditionalPropertiesSchemaContainer;
        additionalSchemaContainer.innerHTML = '';
        if (activeSchema.additionalPropertiesType === 'schema' && activeSchema.additionalPropertiesSchema) {
            additionalSchemaContainer.classList.remove('hidden');
            additionalSchemaContainer.appendChild(renderNestedBuilder([activeSchema.additionalPropertiesSchema], 'additional-properties', null, null, null, { isSubSchema: true }));
        } else {
            additionalSchemaContainer.classList.add('hidden');
        }

        // Animation logic
        if (isCollapsed) {
            content.classList.add('collapsed');
            content.style.maxHeight = '0';
        } else {
            content.classList.remove('collapsed');
            
            // KEY FIX: Force a reflow to ensure the browser calculates the layout of the
            // newly visible element before we try to read its scrollHeight.
            void content.offsetHeight; 

            content.style.maxHeight = `${content.scrollHeight}px`;
            
            // After the transition, remove the inline style to allow the content
            // to resize dynamically (e.g. for responsive design).
            content.addEventListener('transitionend', () => {
                if (!content.classList.contains('collapsed')) {
                    content.style.maxHeight = 'none';
                }
            }, { once: true });
        }
    }


    renderRootControls();
    dom.schemaBuilderRoot.innerHTML = '';
    
    const rootItemOptions = { isFunctionParameter: isFunctionMode };

    // This handles all types that have an array of children at the root
    if (['object', 'oneOf', 'allOf', 'anyOf', 'function'].includes(rootType)) {
        if(activeSchema.schemaDefinition.length > 0) {
            activeSchema.schemaDefinition.forEach(item => {
                const options = { ...rootItemOptions };
                if (['oneOf', 'allOf', 'anyOf'].includes(rootType)) {
                    options.isSubSchema = true;
                }
                dom.schemaBuilderRoot.appendChild(renderItem(item, options));
            });
        } else {
            let emptyText = 'items';
            if (rootType === 'object') emptyText = 'properties';
            else if (rootType === 'function') emptyText = 'parameters';
            else if (rootType === 'oneOf') emptyText = 'options';
            else if (rootType === 'allOf' || rootType === 'anyOf') emptyText = 'schemas';
            dom.schemaBuilderRoot.innerHTML = `<div class="text-center py-8 text-slate-500 dark:text-slate-500">No ${emptyText} defined.</div>`;
        }
    } else if (rootType === 'array') {
        dom.schemaBuilderRoot.appendChild(renderItem(activeSchema.schemaDefinition, { isRootArrayItem: true }));
    } else if (rootType === 'not') {
        dom.schemaBuilderRoot.appendChild(renderItem(activeSchema.schemaDefinition, { isRootNot: true }));
    } else { // Primitives
        dom.schemaBuilderRoot.appendChild(renderItem(activeSchema.schemaDefinition, { isRootPrimitive: true }));
    }

    renderRootConditionals();

    dom.definitionsBuilderRoot.innerHTML = '';
     if(activeSchema.definitions.length > 0) {
        activeSchema.definitions.forEach(def => dom.definitionsBuilderRoot.appendChild(renderItem(def, { isDefinition: true })));
    } else {
        dom.definitionsBuilderRoot.innerHTML = `<div class="text-center py-4 text-slate-500 dark:text-slate-500">No reusable definitions created.</div>`;
    }

    generateAndDisplaySchema();

    // Notify history module that a state change has occurred and been rendered.
    window.dispatchEvent(new CustomEvent('builder:rendered'));
}
