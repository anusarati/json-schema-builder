import { appState, getActiveSchemaState } from './state.js';
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
        exclusiveMinimum: initialData.exclusiveMinimum,
        exclusiveMaximum: initialData.exclusiveMaximum,
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
        allOfSchemas: [],
        anyOfSchemas: [],
        notSchema: null,
        required: initialData.required || false,
        isDefinition: initialData.isDefinition || false,
        isCollapsed: initialData.isCollapsed || false,

        // New properties for object validation
        additionalPropertiesType: initialData.additionalPropertiesType || 'allow', // 'allow', 'disallow', 'schema'
        additionalPropertiesSchema: initialData.additionalPropertiesSchema || null,
        minProperties: initialData.minProperties,
        maxProperties: initialData.maxProperties,

        // New properties for conditional validation
        ifSchema: initialData.ifSchema || null,
        thenSchema: initialData.thenSchema || null,
        elseSchema: initialData.elseSchema || null,
        isConditionalCollapsed: initialData.isConditionalCollapsed || false,
    };

    if (item.type === 'object') {
        item.properties = Array.isArray(initialData.properties) ? initialData.properties.map(p => createSchemaItem(p)) : [];
        if (item.additionalPropertiesSchema) {
            item.additionalPropertiesSchema = createSchemaItem(item.additionalPropertiesSchema);
        }
    } else if (item.type === 'array') {
        item.items = initialData.items ? createSchemaItem(initialData.items) : createSchemaItem({ type: 'string' });
    } else if (item.type === 'oneOf') {
        item.oneOfSchemas = Array.isArray(initialData.oneOfSchemas) ? initialData.oneOfSchemas.map(o => createSchemaItem(o)) : [];
    } else if (item.type === 'allOf') {
        item.allOfSchemas = Array.isArray(initialData.allOfSchemas) ? initialData.allOfSchemas.map(o => createSchemaItem(o)) : [];
    } else if (item.type === 'anyOf') {
        item.anyOfSchemas = Array.isArray(initialData.anyOfSchemas) ? initialData.anyOfSchemas.map(o => createSchemaItem(o)) : [];
    } else if (item.type === 'not') {
        item.notSchema = initialData.notSchema ? createSchemaItem(initialData.notSchema) : createSchemaItem({ type: 'string' });
    }

    // Initialize conditional schemas if they exist
    if (item.ifSchema) item.ifSchema = createSchemaItem(item.ifSchema);
    if (item.thenSchema) item.thenSchema = createSchemaItem(item.thenSchema);
    if (item.elseSchema) item.elseSchema = createSchemaItem(item.elseSchema);
    
    return item;
}

export function buildSchemaFromItem(item, sourceMap, path) {
    let schema = {};
    
    sourceMap[path] = item.id;
    
    if (item.type === '$ref') {
        if (item.ref) schema.$ref = item.ref;
        return schema;
    }

    if (item.type && !['oneOf', 'allOf', 'anyOf', 'not'].includes(item.type)) {
        schema.type = item.type;
    }
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
            if (item.exclusiveMinimum !== undefined) schema.exclusiveMinimum = item.exclusiveMinimum;
            if (item.exclusiveMaximum !== undefined) schema.exclusiveMaximum = item.exclusiveMaximum;
            break;
        case 'object':
            if (item.minProperties !== undefined) schema.minProperties = item.minProperties;
            if (item.maxProperties !== undefined) schema.maxProperties = item.maxProperties;
            if (item.properties && item.properties.length > 0) {
                schema.properties = {};
                const requiredFields = [];
                item.properties.forEach(prop => {
                    if (prop.name) {
                        const newPath = path ? `${path}.properties.${prop.name}` : `properties.${prop.name}`;
                        schema.properties[prop.name] = buildSchemaFromItem(prop, sourceMap, newPath);
                        if (prop.required) requiredFields.push(prop.name);
                    }
                });
                if (Object.keys(schema.properties).length === 0) delete schema.properties;
                if (requiredFields.length > 0) schema.required = requiredFields;
            }
            if (item.additionalPropertiesType === 'disallow') {
                schema.additionalProperties = false;
            } else if (item.additionalPropertiesType === 'schema' && item.additionalPropertiesSchema) {
                const newPath = path ? `${path}.additionalProperties` : `additionalProperties`;
                schema.additionalProperties = buildSchemaFromItem(item.additionalPropertiesSchema, sourceMap, newPath);
            }
            break;
        case 'array':
            if (item.items) {
                const newPath = path ? `${path}.items` : `items`;
                schema.items = buildSchemaFromItem(item.items, sourceMap, newPath);
            }
            if (item.minItems !== undefined) schema.minItems = item.minItems;
            if (item.maxItems !== undefined) schema.maxItems = item.maxItems;
            if (item.uniqueItems) schema.uniqueItems = true;
            break;
        case 'oneOf':
            if (item.oneOfSchemas && item.oneOfSchemas.length > 0) {
                schema.oneOf = item.oneOfSchemas.map((oneOfItem, i) => {
                    const newPath = path ? `${path}.oneOf[${i}]` : `oneOf[${i}]`;
                    return buildSchemaFromItem(oneOfItem, sourceMap, newPath);
                });
            }
            break;
        case 'allOf':
            if (item.allOfSchemas && item.allOfSchemas.length > 0) {
                schema.allOf = item.allOfSchemas.map((allOfItem, i) => {
                    const newPath = path ? `${path}.allOf[${i}]` : `allOf[${i}]`;
                    return buildSchemaFromItem(allOfItem, sourceMap, newPath);
                });
            }
            break;
        case 'anyOf':
            if (item.anyOfSchemas && item.anyOfSchemas.length > 0) {
                schema.anyOf = item.anyOfSchemas.map((anyOfItem, i) => {
                    const newPath = path ? `${path}.anyOf[${i}]` : `anyOf[${i}]`;
                    return buildSchemaFromItem(anyOfItem, sourceMap, newPath);
                });
            }
            break;
        case 'not':
            if (item.notSchema) {
                const newPath = path ? `${path}.not` : `not`;
                schema.not = buildSchemaFromItem(item.notSchema, sourceMap, newPath);
            }
            break;
    }
    
    // Build conditional schemas
    if (item.ifSchema) {
        const newPath = path ? `${path}.if` : `if`;
        schema.if = buildSchemaFromItem(item.ifSchema, sourceMap, newPath);
    }
    if (item.thenSchema) {
        const newPath = path ? `${path}.then` : `then`;
        schema.then = buildSchemaFromItem(item.thenSchema, sourceMap, newPath);
    }
    if (item.elseSchema) {
        const newPath = path ? `${path}.else` : `else`;
        schema.else = buildSchemaFromItem(item.elseSchema, sourceMap, newPath);
    }

    return schema;
}

function schemaToHtmlRecursive(value, sourceMap, path = '', depth = 0) {
    const indent = '  '.repeat(depth);
    const nextIndent = '  '.repeat(depth + 1);

    if (value === null) return `<span class="hljs-literal">null</span>`;
    if (typeof value === 'string') return `<span class="hljs-string">"${value.replace(/"/g, '\\"')}"</span>`;
    if (typeof value === 'number') return `<span class="hljs-number">${value}</span>`;
    if (typeof value === 'boolean') return `<span class="hljs-literal">${value}</span>`;

    if (Array.isArray(value)) {
        const itemId = sourceMap[path];
        const dataAttr = itemId ? `data-item-id="${itemId}" data-clickable="true"` : '';
        if (value.length === 0) return `<span ${dataAttr}>[]</span>`;

        let html = `<span ${dataAttr}>[</span>\n`;
        html += value.map((val, i) => {
            const newPath = `${path}[${i}]`;
            const valueHtml = schemaToHtmlRecursive(val, sourceMap, newPath, depth + 1);
            const comma = i < value.length - 1 ? ',' : '';
            return `${nextIndent}${valueHtml}${comma}`;
        }).join('\n');
        html += `\n${indent}<span ${dataAttr}>]</span>`;
        return html;
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value);
        const containerItemId = sourceMap[path];
        const dataAttr = containerItemId ? `data-item-id="${containerItemId}" data-clickable="true"` : '';

        if (entries.length === 0) return `<span ${dataAttr}>{ }</span>`;
        
        let html = `<span ${dataAttr}>{</span>\n`;
        html += entries.map(([key, val], i) => {
            const newPath = path ? `${path}.${key}` : key;
            const valueItemId = sourceMap[newPath];
            
            // A key is clickable if its value is a new item, or if the container itself is an item.
            const clickableIdForKey = valueItemId || containerItemId;
            const keyDataAttr = clickableIdForKey ? `data-item-id="${clickableIdForKey}" data-clickable="true"` : '';
            const keySpan = `<span class="hljs-attr" ${keyDataAttr}>"${key}"</span>`;
            
            let valueHtml = schemaToHtmlRecursive(val, sourceMap, newPath, depth + 1);

            // If the value is a primitive (not an object/array), it should be clickable if its key was.
            if (clickableIdForKey && (typeof val !== 'object' || val === null)) {
                valueHtml = `<span data-item-id="${clickableIdForKey}" data-clickable="true">${valueHtml}</span>`;
            }

            const comma = i < entries.length - 1 ? ',' : '';
            return `${nextIndent}${keySpan}: ${valueHtml}${comma}`;
        }).join('\n');
        html += `\n${indent}<span ${dataAttr}>}</span>`;
        return html;
    }

    return String(value);
}

export function generateAndDisplaySchema() {
    const activeSchema = getActiveSchemaState();
    if (!activeSchema) {
        dom.schemaOutput.textContent = '{}';
        hljs.highlightElement(dom.schemaOutput);
        return;
    }
    
    let finalSchema;
    const sourceMap = {};
    
    if (activeSchema.rootSchemaType === 'function') {
        const parameters = {
            type: 'object',
            properties: {}
        };
        const requiredFields = [];
        
        activeSchema.schemaDefinition.forEach(prop => {
            if (prop.name) {
                const path = `function.parameters.properties.${prop.name}`;
                parameters.properties[prop.name] = buildSchemaFromItem(prop, sourceMap, path);
                if (prop.required) requiredFields.push(prop.name);
            }
        });

        if (requiredFields.length > 0) {
            parameters.required = requiredFields;
        }

        if (activeSchema.definitions.length > 0) {
            parameters.$defs = {};
            activeSchema.definitions.forEach(def => {
                if (def.name) {
                    const path = `function.parameters.$defs.${def.name}`;
                    parameters.$defs[def.name] = buildSchemaFromItem(def, sourceMap, path);
                }
            });
            if (Object.keys(parameters.$defs).length === 0) delete parameters.$defs;
        }

        finalSchema = {
            type: 'function',
            function: {
                name: activeSchema.title || 'unnamed_function',
                description: activeSchema.description || '',
                parameters: parameters,
            }
        };

    } else {
        finalSchema = {};
        if (activeSchema.includeSchemaProperty) {
            finalSchema["$schema"] = "http://json-schema.org/draft-2020-12/schema#";
        }
        if (activeSchema.title) finalSchema.title = activeSchema.title;
        if (activeSchema.description) finalSchema.description = activeSchema.description;

        const rootItem = {
            type: activeSchema.rootSchemaType,
            properties: activeSchema.rootSchemaType === 'object' ? activeSchema.schemaDefinition : [],
            items: activeSchema.rootSchemaType === 'array' ? activeSchema.schemaDefinition : null,
            oneOfSchemas: activeSchema.rootSchemaType === 'oneOf' ? activeSchema.schemaDefinition : [],
            allOfSchemas: activeSchema.rootSchemaType === 'allOf' ? activeSchema.schemaDefinition : [],
            anyOfSchemas: activeSchema.rootSchemaType === 'anyOf' ? activeSchema.schemaDefinition : [],
            notSchema: activeSchema.rootSchemaType === 'not' ? activeSchema.schemaDefinition : null,
            additionalPropertiesType: activeSchema.additionalPropertiesType,
            additionalPropertiesSchema: activeSchema.additionalPropertiesSchema,
            minProperties: activeSchema.minProperties,
            maxProperties: activeSchema.maxProperties,
            ...((!['object', 'array', 'oneOf', 'allOf', 'anyOf', 'not'].includes(activeSchema.rootSchemaType)) ? activeSchema.schemaDefinition : {})
        };
        
        Object.assign(finalSchema, buildSchemaFromItem(rootItem, sourceMap, ''));
        
        if (activeSchema.ifSchema) {
            finalSchema.if = buildSchemaFromItem(activeSchema.ifSchema, sourceMap, 'if');
        }
        if (activeSchema.thenSchema) {
            finalSchema.then = buildSchemaFromItem(activeSchema.thenSchema, sourceMap, 'then');
        }
        if (activeSchema.elseSchema) {
            finalSchema.else = buildSchemaFromItem(activeSchema.elseSchema, sourceMap, 'else');
        }

        if (activeSchema.definitions.length > 0) {
            finalSchema.$defs = {};
            activeSchema.definitions.forEach(def => {
                if (def.name) {
                    const path = `$defs.${def.name}`;
                    finalSchema.$defs[def.name] = buildSchemaFromItem(def, sourceMap, path);
                }
            });
            if (Object.keys(finalSchema.$defs).length === 0) delete finalSchema.$defs;
        }
    }

    const newCode = document.createElement('code');
    newCode.id = 'schemaOutput';
    newCode.className = 'language-json block w-full h-full p-4';
    newCode.innerHTML = schemaToHtmlRecursive(finalSchema, sourceMap);
    
    dom.schemaOutput.replaceWith(newCode);
    dom.schemaOutput = newCode;
    
    saveState(appState);
}

export function mapJsonToInternal(schemaPart, options = {}) {
    const { name = '', required = false, isDefinition = false } = options;
    
    let type = schemaPart.type;
    if (schemaPart.$ref) type = '$ref';
    else if (schemaPart.oneOf) type = 'oneOf';
    else if (schemaPart.allOf) type = 'allOf';
    else if (schemaPart.anyOf) type = 'anyOf';
    else if (schemaPart.not) type = 'not';
    else if (!type && (schemaPart.properties || schemaPart.if)) type = 'object';

    // Handle modern and legacy exclusive min/max
    let { minimum, maximum, exclusiveMinimum, exclusiveMaximum } = schemaPart;
    if (typeof schemaPart.exclusiveMinimum === 'number') {
        exclusiveMinimum = schemaPart.exclusiveMinimum;
        minimum = undefined; // Per 2020-12, these are independent. Clear the other for our UI.
    } else if (schemaPart.exclusiveMinimum === true && schemaPart.minimum !== undefined) {
        exclusiveMinimum = schemaPart.minimum; // Legacy conversion
        minimum = undefined;
    } else {
        exclusiveMinimum = undefined; // Not present or not a boolean `true`
    }
    
    if (typeof schemaPart.exclusiveMaximum === 'number') {
        exclusiveMaximum = schemaPart.exclusiveMaximum;
        maximum = undefined;
    } else if (schemaPart.exclusiveMaximum === true && schemaPart.maximum !== undefined) {
        exclusiveMaximum = schemaPart.maximum; // Legacy conversion
        maximum = undefined;
    } else {
        exclusiveMaximum = undefined;
    }

    const internalItem = createSchemaItem({
        name, type, required, isDefinition,
        description: schemaPart.description,
        pattern: schemaPart.pattern,
        format: schemaPart.format,
        minLength: schemaPart.minLength,
        maxLength: schemaPart.maxLength,
        minimum: minimum,
        maximum: maximum,
        exclusiveMinimum: exclusiveMinimum,
        exclusiveMaximum: exclusiveMaximum,
        minItems: schemaPart.minItems,
        maxItems: schemaPart.maxItems,
        uniqueItems: !!schemaPart.uniqueItems,
        defaultValue: schemaPart.default !== undefined ? JSON.stringify(schemaPart.default, null, 2) : undefined,
        examples: schemaPart.examples !== undefined ? JSON.stringify(schemaPart.examples, null, 2) : undefined,
        enum: schemaPart.enum,
        constValue: schemaPart.const !== undefined ? JSON.stringify(schemaPart.const, null, 2) : undefined,
        ref: schemaPart.$ref,
    });
    
    if (schemaPart.if) internalItem.ifSchema = mapJsonToInternal(schemaPart.if);
    if (schemaPart.then) internalItem.thenSchema = mapJsonToInternal(schemaPart.then);
    if (schemaPart.else) internalItem.elseSchema = mapJsonToInternal(schemaPart.else);

    if (type === 'object') {
        internalItem.minProperties = schemaPart.minProperties;
        internalItem.maxProperties = schemaPart.maxProperties;
        if (schemaPart.properties) {
            const nestedRequired = schemaPart.required || [];
            internalItem.properties = Object.entries(schemaPart.properties).map(([propName, propSchema]) => 
                mapJsonToInternal(propSchema, { name: propName, required: nestedRequired.includes(propName) }));
        }
        if (schemaPart.additionalProperties === false) {
            internalItem.additionalPropertiesType = 'disallow';
        } else if (typeof schemaPart.additionalProperties === 'object') {
            internalItem.additionalPropertiesType = 'schema';
            internalItem.additionalPropertiesSchema = mapJsonToInternal(schemaPart.additionalProperties);
        } else {
            internalItem.additionalPropertiesType = 'allow';
        }
    } else if (type === 'array' && schemaPart.items) {
        internalItem.items = mapJsonToInternal(schemaPart.items);
    } else if (type === 'oneOf' && schemaPart.oneOf) {
        internalItem.oneOfSchemas = schemaPart.oneOf.map(s => mapJsonToInternal(s));
    } else if (type === 'allOf' && schemaPart.allOf) {
        internalItem.allOfSchemas = schemaPart.allOf.map(s => mapJsonToInternal(s));
    } else if (type === 'anyOf' && schemaPart.anyOf) {
        internalItem.anyOfSchemas = schemaPart.anyOf.map(s => mapJsonToInternal(s));
    } else if (type === 'not' && schemaPart.not) {
        internalItem.notSchema = mapJsonToInternal(schemaPart.not);
    }
    
    return internalItem;
}
