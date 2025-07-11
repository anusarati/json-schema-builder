import { appState } from './state.js';
import { dom } from './dom.js';
import { createId } from './utils.js';
import { FIELD_TYPES } from './config.js';
import { saveState } from './persistence.js';

export function createSchemaItem(initialData = {}) {
    const defaultType = 'string';
    const item = {
        id: createId(),
        name: initialData.name || '',
        type: initialData.type || defaultType,
        description: initialData.description || '',
        pattern: initialData.pattern || '',
        format: initialData.format || '',
        minLength: initialData.minLength,
        maxLength: initialData.maxLength,
        minimum: initialData.minimum,
        maximum: initialData.maximum,
        exclusiveMinimum: initialData.exclusiveMinimum || false,
        exclusiveMaximum: initialData.exclusiveMaximum || false,
        minItems: initialData.minItems,
        maxItems: initialData.maxItems,
        uniqueItems: initialData.uniqueItems || false,
        defaultValue: initialData.defaultValue,
        examples: initialData.examples || '',
        enum: Array.isArray(initialData.enum) ? initialData.enum : [],
        constValue: initialData.constValue,
        ref: initialData.ref || '',
        properties: [],
        items: null,
        oneOfSchemas: [],
        required: initialData.required || false,
        isDefinition: initialData.isDefinition || false,
        isCollapsed: initialData.isCollapsed || false,
    };

    if (item.type === 'object') {
        item.properties = Array.isArray(initialData.properties) ? initialData.properties.map(p => createSchemaItem(p)) : [];
    } else if (item.type === 'array') {
        item.items = initialData.items ? createSchemaItem(initialData.items) : createSchemaItem({ type: 'string' });
    } else if (item.type === 'oneOf') {
        item.oneOfSchemas = Array.isArray(initialData.oneOfSchemas) ? initialData.oneOfSchemas.map(o => createSchemaItem(o)) : [];
    }
    
    return item;
}

function buildSchemaFromItem(item) {
    let schema = {};
    
    if (item.type === '$ref') {
        if (item.ref) schema.$ref = item.ref;
        return schema;
    }

    schema.type = item.type;
    if (item.description) schema.description = item.description;
    
    ['defaultValue', 'constValue', 'examples'].forEach(prop => {
        const key = prop === 'defaultValue' ? 'default' : (prop === 'constValue' ? 'const' : prop);
        const value = item[prop];
        if (value !== undefined && value !== null && value !== '') {
            try {
                schema[key] = JSON.parse(value);
            } catch (e) {
                if (prop === 'examples') schema[key] = [value];
                else schema[key] = value;
            }
        }
    });

    switch(item.type) {
        case 'string':
            if (item.pattern) schema.pattern = item.pattern;
            if (item.format) schema.format = item.format;
            if (item.minLength !== undefined) schema.minLength = item.minLength;
            if (item.maxLength !== undefined) schema.maxLength = item.maxLength;
            if (item.enum && item.enum.length > 0) schema.enum = item.enum;
            break;
        case 'number':
        case 'integer':
            if (item.minimum !== undefined) schema.minimum = item.minimum;
            if (item.maximum !== undefined) schema.maximum = item.maximum;
            if (item.exclusiveMinimum) schema.exclusiveMinimum = item.minimum;
            if (item.exclusiveMaximum) schema.exclusiveMaximum = item.maximum;
            break;
        case 'object':
            if (item.properties && item.properties.length > 0) {
                schema.properties = {};
                const requiredFields = [];
                item.properties.forEach(prop => {
                    if (prop.name) {
                        schema.properties[prop.name] = buildSchemaFromItem(prop);
                        if (prop.required) requiredFields.push(prop.name);
                    }
                });
                if (Object.keys(schema.properties).length === 0) delete schema.properties;
                if (requiredFields.length > 0) schema.required = requiredFields;
            }
            break;
        case 'array':
            if (item.items) schema.items = buildSchemaFromItem(item.items);
            if (item.minItems !== undefined) schema.minItems = item.minItems;
            if (item.maxItems !== undefined) schema.maxItems = item.maxItems;
            if (item.uniqueItems) schema.uniqueItems = true;
            break;
        case 'oneOf':
            if (item.oneOfSchemas && item.oneOfSchemas.length > 0) {
                schema.oneOf = item.oneOfSchemas.map(buildSchemaFromItem);
                delete schema.type;
            }
            break;
    }
    return schema;
}

export function generateAndDisplaySchema() {
    let finalSchema = { "$schema": "http://json-schema.org/draft-2020-12/schema#" };
    if (appState.title) finalSchema.title = appState.title;
    if (appState.description) finalSchema.description = appState.description;

    const rootItem = {
        type: appState.rootSchemaType,
        properties: appState.rootSchemaType === 'object' ? appState.schemaDefinition : [],
        items: appState.rootSchemaType === 'array' ? appState.schemaDefinition : null,
        oneOfSchemas: appState.rootSchemaType === 'oneOf' ? appState.schemaDefinition : [],
        ...((!['object', 'array', 'oneOf'].includes(appState.rootSchemaType)) ? appState.schemaDefinition : {})
    };
    Object.assign(finalSchema, buildSchemaFromItem(rootItem));

    if (appState.definitions.length > 0) {
        finalSchema.$defs = {};
        appState.definitions.forEach(def => {
            if (def.name) finalSchema.$defs[def.name] = buildSchemaFromItem(def);
        });
        if (Object.keys(finalSchema.$defs).length === 0) delete finalSchema.$defs;
    }

    const newCode = document.createElement('code');
    newCode.id = 'schemaOutput';
    newCode.className = 'language-json block';
    newCode.textContent = JSON.stringify(finalSchema, null, 2);
    
    dom.schemaOutput.replaceWith(newCode);
    dom.schemaOutput = newCode;
    hljs.highlightElement(dom.schemaOutput);

    // Persist the state after every successful generation
    saveState(appState);
}

export function mapJsonToInternal(schemaPart, options = {}) {
    const { name = '', required = false, isDefinition = false } = options;
    
    let type = schemaPart.type;
    if (schemaPart.$ref) type = '$ref';
    else if (schemaPart.oneOf) type = 'oneOf';
    else if (!type && schemaPart.properties) type = 'object';

    const internalItem = createSchemaItem({
        name, type, required, isDefinition,
        description: schemaPart.description,
        pattern: schemaPart.pattern,
        format: schemaPart.format,
        minLength: schemaPart.minLength,
        maxLength: schemaPart.maxLength,
        minimum: schemaPart.minimum,
        maximum: schemaPart.maximum,
        exclusiveMinimum: !!schemaPart.exclusiveMinimum,
        exclusiveMaximum: !!schemaPart.exclusiveMaximum,
        minItems: schemaPart.minItems,
        maxItems: schemaPart.maxItems,
        uniqueItems: !!schemaPart.uniqueItems,
        defaultValue: schemaPart.default !== undefined ? JSON.stringify(schemaPart.default, null, 2) : undefined,
        examples: schemaPart.examples !== undefined ? JSON.stringify(schemaPart.examples, null, 2) : undefined,
        enum: schemaPart.enum,
        constValue: schemaPart.const !== undefined ? JSON.stringify(schemaPart.const, null, 2) : undefined,
        ref: schemaPart.$ref,
    });

    if (type === 'object' && schemaPart.properties) {
        const nestedRequired = schemaPart.required || [];
        internalItem.properties = Object.entries(schemaPart.properties).map(([propName, propSchema]) => 
            mapJsonToInternal(propSchema, { name: propName, required: nestedRequired.includes(propName) }));
    } else if (type === 'array' && schemaPart.items) {
        internalItem.items = mapJsonToInternal(schemaPart.items);
    } else if (type === 'oneOf' && schemaPart.oneOf) {
        internalItem.oneOfSchemas = schemaPart.oneOf.map(s => mapJsonToInternal(s));
    }
    
    return internalItem;
}
