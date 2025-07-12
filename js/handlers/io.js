import { dom } from '../dom.js';
import { appState, getActiveSchemaState } from '../state.js';
import { ICONS, FIELD_TYPES } from '../config.js';
import { showToast } from '../utils.js';
import { createSchemaItem, mapJsonToInternal } from '../schema.js';
import { render } from '../renderer.js';

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
    a.download = `${activeSchema.title.replace(/[\s/]/g, '_') || 'schema'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function toggleImportModal(show = true) {
    dom.importModal.classList.toggle('hidden', !show);
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
}

function parseAndLoadRootSchema(schema) {
    const activeSchema = getActiveSchemaState();
    
    activeSchema.nextId = 0;
    activeSchema.title = schema.title || 'Imported Schema';
    activeSchema.description = schema.description || '';
    activeSchema.definitions = [];
    
    if (schema.$defs) {
        activeSchema.definitions = Object.entries(schema.$defs).map(([name, defSchema]) => 
            mapJsonToInternal(defSchema, {name, isDefinition: true}));
    }

    if (schema.oneOf) {
        activeSchema.rootSchemaType = 'oneOf';
        activeSchema.schemaDefinition = schema.oneOf.map(s => mapJsonToInternal(s));
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
        // Fallback for schemas without a defined type but with other properties
        activeSchema.rootSchemaType = 'object';
        activeSchema.schemaDefinition = [];
        showToast("Imported schema has an unknown root type, defaulting to object.", "error");
    }
    render();
}

export function handleParseAndLoad() {
    const schemaStr = dom.importSchemaText.value;
    if (!schemaStr.trim()) {
        showToast("Import field is empty.", "error");
        return;
    }

    if (!confirm('Importing a new schema will replace the content of the current tab. Are you sure?')) {
        return;
    }

    try {
        const importedObj = JSON.parse(schemaStr);
        parseAndLoadRootSchema(importedObj);
        showToast("Schema imported successfully!");
        toggleImportModal(false);
        dom.importSchemaText.value = '';
    } catch (error) {
        showToast(`Error parsing schema: ${error.message}`, "error");
    }
}
