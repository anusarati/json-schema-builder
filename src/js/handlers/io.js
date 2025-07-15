import { dom } from '../dom.js';
import { appState, getActiveSchemaState } from '../state.js';
import { ICONS, FIELD_TYPES } from '../config.js';
import { showToast, findItemAndParent } from '../utils.js';
import { createSchemaItem, mapJsonToInternal } from '../schema.js';
import { render } from '../renderer.js';
import { handleParseProperty, handleParseRootProperties } from './item.js';

export async function handleCopySchema() {
    const schemaText = dom.schemaOutput.textContent;
    const originalBtnHTML = dom.copySchemaBtn.innerHTML;
    try {
        await navigator.clipboard.writeText(schemaText);
        showToast("Schema copied to clipboard!");
        dom.copySchemaBtn.innerHTML = `${ICONS.check} Copied!`;
        dom.copySchemaBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        dom.copySchemaBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        setTimeout(() => {
            dom.copySchemaBtn.innerHTML = originalBtnHTML;
            dom.copySchemaBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            dom.copySchemaBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        }, 2000);
    } catch (err) {
        showToast("Failed to copy schema.", "error");
        console.error('Failed to copy: ', err);
    }
}

export function handleExportSchema() {
    const activeSchema = getActiveSchemaState();
    const schemaText = dom.schemaOutput.textContent;
    const blob = new Blob([schemaText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeSchema.title || 'schema').replace(/[\s/]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toggleImportModal(show = true) {
    dom.importModal.classList.toggle('hidden', !show);
}

export function closeImportModal() {
    toggleImportModal(false);
    appState.importTargetItemId = null; // Clear any property-level target
    dom.importSchemaText.value = ''; // Clear textarea
}

export function openRootImportModal() {
    appState.importTargetItemId = null;
    dom.importModalTitle.textContent = 'Import Full Schema';
    dom.importModalDescription.textContent = 'Paste a full JSON schema or OpenAI function definition. This will replace the entire schema in the current tab.';
    dom.importSchemaText.placeholder = '{ "type": "function", "function": { ... } }';
    toggleImportModal(true);
}

export function handleOpenRootPropertiesImport() {
    const activeSchema = getActiveSchemaState();
    const rootType = activeSchema.rootSchemaType;

    if (!['object', 'function', 'oneOf', 'allOf', 'anyOf', 'not', 'array'].includes(rootType)) {
        showToast(`Cannot import properties for root type '${rootType}'.`, 'error');
        return;
    }

    appState.importTargetItemId = 'root';
    dom.importModalTitle.textContent = `Import Root ${rootType === 'function' ? 'Parameters' : 'Properties'}`;

    let description = '';
    let placeholder = '';
    if (rootType === 'object' || rootType === 'function') {
        description = 'Paste a JSON object containing the properties/parameters to use for this schema.';
        placeholder = `{ "property_name": { "type": "string" } }`;
    } else if (['oneOf', 'allOf', 'anyOf'].includes(rootType)) {
        description = `Paste a JSON array containing the schema options for the root \`${rootType}\`.`;
        placeholder = '[{ "type": "string" }, { "type": "number" }]';
    } else if (rootType === 'not') {
        description = 'Paste a JSON object representing the schema to negate.';
        placeholder = '{ "type": "string", "maxLength": 5 }';
    } else if (rootType === 'array') {
        description = 'Paste a JSON object representing the schema for the items in the root array.';
        placeholder = '{ "type": "string", "description": "An item in the array" }';
    }

    dom.importModalDescription.textContent = description;
    dom.importSchemaText.placeholder = placeholder;
    toggleImportModal(true);
}


export function handleOpenPropertyImport(itemId) {
    const found = findItemAndParent(itemId);
    if (!found) return;
    
    appState.importTargetItemId = itemId;
    dom.importModalTitle.textContent = `Import for '${found.item.name || 'unnamed'}'`;
    let placeholder = '';
    let description = '';

    if (found.item.type === 'object') {
        description = 'Paste a JSON object containing the properties to add to this object.';
        placeholder = `{ "new_property": { "type": "string" } }`;
    } else if (found.item.type === 'array') {
        description = 'Paste a JSON object representing the schema for items in this array.';
        placeholder = '{ "type": "number" }';
    } else if (['oneOf', 'allOf', 'anyOf'].includes(found.item.type)) {
        description = `Paste a JSON array containing the schema options for this ${found.item.type} property.`;
        placeholder = '[{ "type": "string" }, { "type": "number" }]';
    } else if (found.item.type === 'not') {
        description = 'Paste a JSON object representing the schema to negate.';
        placeholder = '{ "type": "string", "maxLength": 5 }';
    }

    dom.importModalDescription.textContent = description;
    dom.importSchemaText.placeholder = placeholder;
    toggleImportModal(true);
}


export function handleImportFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            dom.importSchemaText.value = e.target.result;
            showToast(`Loaded ${file.name} successfully.`);
        };
        reader.onerror = () => showToast(`Error reading file.`, "error");
        reader.readAsText(file);
    }
    event.target.value = '';
}

function parseAndLoadRootSchema(schema) {
    const activeSchema = getActiveSchemaState();
    
    // Clear all existing definitions and root-level schemas
    activeSchema.nextId = 0;
    activeSchema.definitions = [];
    activeSchema.ifSchema = null;
    activeSchema.thenSchema = null;
    activeSchema.elseSchema = null;
    activeSchema.additionalPropertiesSchema = null;
    
    if (schema.type === 'function' && schema.function) {
        activeSchema.rootSchemaType = 'function';
        activeSchema.title = schema.function.name || 'Imported Function';
        activeSchema.description = schema.function.description || '';
        
        const params = schema.function.parameters || { type: 'object', properties: {} };
        const required = params.required || [];
        activeSchema.schemaDefinition = params.properties ? Object.entries(params.properties).map(([name, propSchema]) => 
            mapJsonToInternal(propSchema, { name, required: required.includes(name) })) : [];
        
        if (params.$defs) {
            activeSchema.definitions = Object.entries(params.$defs).map(([name, defSchema]) => 
                mapJsonToInternal(defSchema, {name, isDefinition: true}));
        }
    } else { 
        activeSchema.title = schema.title || 'Imported Schema';
        activeSchema.description = schema.description || '';
        
        if (schema.$defs) {
            activeSchema.definitions = Object.entries(schema.$defs).map(([name, defSchema]) => 
                mapJsonToInternal(defSchema, {name, isDefinition: true}));
        }

        // Map root-level conditional and additional properties
        if (schema.if) activeSchema.ifSchema = mapJsonToInternal(schema.if);
        if (schema.then) activeSchema.thenSchema = mapJsonToInternal(schema.then);
        if (schema.else) activeSchema.elseSchema = mapJsonToInternal(schema.else);
        if (schema.additionalProperties === false) {
            activeSchema.additionalPropertiesType = 'disallow';
        } else if (typeof schema.additionalProperties === 'object') {
            activeSchema.additionalPropertiesType = 'schema';
            activeSchema.additionalPropertiesSchema = mapJsonToInternal(schema.additionalProperties);
        } else {
            activeSchema.additionalPropertiesType = 'allow';
        }

        const keyword = ['oneOf', 'allOf', 'anyOf'].find(k => schema[k]);
        if (keyword) {
            activeSchema.rootSchemaType = keyword;
            activeSchema.schemaDefinition = schema[keyword].map(s => mapJsonToInternal(s));
        } else if (schema.not) {
            activeSchema.rootSchemaType = 'not';
            activeSchema.schemaDefinition = mapJsonToInternal(schema.not);
        } else if (schema.type === 'object' || (!schema.type && schema.properties)) {
            activeSchema.rootSchemaType = 'object';
            const required = schema.required || [];
            activeSchema.schemaDefinition = schema.properties ? Object.entries(schema.properties).map(([name, propSchema]) => 
                mapJsonToInternal(propSchema, { name, required: required.includes(name) })) : [];
        } else if (schema.type === 'array') {
            activeSchema.rootSchemaType = 'array';
            activeSchema.schemaDefinition = schema.items ? mapJsonToInternal(schema.items) : createSchemaItem({type: 'string'});
        } else if (FIELD_TYPES.root.includes(schema.type)) {
            activeSchema.rootSchemaType = schema.type;
            activeSchema.schemaDefinition = mapJsonToInternal(schema);
        } else {
            activeSchema.rootSchemaType = 'object';
            activeSchema.schemaDefinition = [];
            showToast("Imported schema has an unknown root type, defaulting to object.", "error");
        }
    }
}

export function handleParseAndLoad() {
    const schemaStr = dom.importSchemaText.value;
    if (!schemaStr.trim()) {
        showToast("Import field is empty.", "error");
        return;
    }

    try {
        if (appState.importTargetItemId) {
            if (appState.importTargetItemId === 'root') {
                handleParseRootProperties(schemaStr);
                const rootType = getActiveSchemaState().rootSchemaType;
                showToast(`Root ${rootType === 'function' ? 'parameters' : 'properties'} imported successfully.`, "success");
            } else {
                const targetId = appState.importTargetItemId;
                handleParseProperty(targetId, schemaStr);
                const found = findItemAndParent(targetId);
                showToast(`Properties imported successfully for '${found.item.name || found.item.type}'.`, "success");
            }
            render();
            closeImportModal();
        } else {
            if (!confirm('Importing a new schema will replace the content of the current tab. Are you sure?')) {
                return;
            }
            const importedObj = JSON.parse(schemaStr);
            parseAndLoadRootSchema(importedObj);
            render();
            showToast("Schema imported successfully!");
            closeImportModal();
        }
    } catch (error) {
        showToast(`Import failed: ${error.message}`, "error");
    }
}
