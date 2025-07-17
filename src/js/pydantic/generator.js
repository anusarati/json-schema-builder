class PydanticGenerator {
    constructor(schema) {
        this.schema = schema;
        this.imports = {
            pydantic: new Set(['BaseModel']),
            typing: new Set(),
            datetime: new Set(),
        };
        this.models = [];
        this.processedDefs = new Set();
    }

    sanitizeClassName(name) {
        if (!name) return 'MySchema';
        let sanitized = name.replace(/[^a-zA-Z0-9_]/g, ' ').trim().replace(/\s+/g, '_');
        sanitized = sanitized.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        if (!/^[a-zA-Z_]/.test(sanitized)) {
            sanitized = 'Model' + sanitized;
        }
        return sanitized || 'MySchema';
    }

    getDef(ref) {
        if (!ref || !ref.startsWith('#/$defs/')) return null;
        const defName = ref.substring(8);
        return {
            name: this.sanitizeClassName(defName),
            schema: this.schema.$defs?.[defName]
        };
    }

    getTypeHint(propSchema, propName) {
        if (propSchema.$ref) {
            const def = this.getDef(propSchema.$ref);
            if (def) return { typeHint: def.name };
        }

        if (propSchema.oneOf) {
            this.imports.typing.add('Union');
            const types = propSchema.oneOf.map(s => this.getTypeHint(s, propName).typeHint).join(', ');
            return { typeHint: `Union[${types}]` };
        }

        switch (propSchema.type) {
            case 'string':
                if (propSchema.format === 'date-time') {
                    this.imports.datetime.add('datetime');
                    return { typeHint: 'datetime' };
                }
                if (propSchema.format === 'date') {
                    this.imports.datetime.add('date');
                    return { typeHint: 'date' };
                }
                return { typeHint: 'str' };
            case 'number':
                return { typeHint: 'float' };
            case 'integer':
                return { typeHint: 'int' };
            case 'boolean':
                return { typeHint: 'bool' };
            case 'array':
                this.imports.typing.add('List');
                const itemHint = this.getTypeHint(propSchema.items || {}, `${propName}Item`);
                if (itemHint.nestedModel) this.models.unshift(itemHint.nestedModel);
                return { typeHint: `List[${itemHint.typeHint}]` };
            case 'object':
                const nestedClassName = this.sanitizeClassName(propName);
                const nestedModel = this.buildModel(nestedClassName, propSchema);
                this.models.unshift(nestedModel);
                return { typeHint: nestedClassName };
            default:
                this.imports.typing.add('Any');
                return { typeHint: 'Any' };
        }
    }

    getFieldArgs(propSchema, isRequired) {
        const args = [];
        let defaultValue = '...';

        if ('default' in propSchema) {
            defaultValue = JSON.stringify(propSchema.default);
        } else if (!isRequired) {
            defaultValue = 'None';
        }

        if (defaultValue !== '...') {
            args.push(`default=${defaultValue}`);
        }

        if (propSchema.description) args.push(`description=${JSON.stringify(propSchema.description)}`);
        if (propSchema.title) args.push(`title=${JSON.stringify(propSchema.title)}`);

        // String constraints
        if (propSchema.minLength !== undefined) args.push(`min_length=${propSchema.minLength}`);
        if (propSchema.maxLength !== undefined) args.push(`max_length=${propSchema.maxLength}`);
        if (propSchema.pattern) args.push(`pattern=r'${propSchema.pattern}'`);
        
        // Number constraints
        if (propSchema.minimum !== undefined) args.push(`ge=${propSchema.minimum}`);
        if (propSchema.maximum !== undefined) args.push(`le=${propSchema.maximum}`);
        if (propSchema.exclusiveMinimum !== undefined) args.push(`gt=${propSchema.exclusiveMinimum}`);
        if (propSchema.exclusiveMaximum !== undefined) args.push(`lt=${propSchema.exclusiveMaximum}`);

        if (args.length > 0) {
            this.imports.pydantic.add('Field');
            return args.join(', ');
        }
        return null;
    }

    buildModel(className, schema) {
        let modelString = `class ${className}(BaseModel):\n`;
        const fields = [];
        const required = new Set(schema.required || []);

        if (schema.description && !schema.properties) {
             modelString += `    """${schema.description}"""\n\n`;
        }

        if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const isRequired = required.has(propName);
                const { typeHint } = this.getTypeHint(propSchema, propSchema.title || propName);
                
                let finalTypeHint = typeHint;
                if (!isRequired) {
                    this.imports.typing.add('Optional');
                    finalTypeHint = `Optional[${typeHint}]`;
                }

                const fieldArgs = this.getFieldArgs(propSchema, isRequired);

                if (fieldArgs) {
                    fields.push(`    ${propName}: ${finalTypeHint} = Field(${fieldArgs})`);
                } else {
                    fields.push(`    ${propName}: ${finalTypeHint}${!isRequired ? ' = None' : ''}`);
                }
            }
        }

        if (fields.length === 0) {
            modelString += '    pass';
        } else {
            modelString += fields.join('\n');
        }

        return modelString;
    }

    generate() {
        // First, process all $defs so they are available for $ref
        if (this.schema.$defs) {
            for (const [defName, defSchema] of Object.entries(this.schema.$defs)) {
                const modelName = this.sanitizeClassName(defName);
                if (!this.processedDefs.has(modelName)) {
                    this.processedDefs.add(modelName);
                    const modelCode = this.buildModel(modelName, defSchema);
                    this.models.push(modelCode);
                }
            }
        }

        const rootClassName = this.sanitizeClassName(this.schema.title);
        const rootModelCode = this.buildModel(rootClassName, this.schema);
        this.models.push(rootModelCode);

        // Assemble final code
        const typingImports = Array.from(this.imports.typing).sort().join(', ');
        const pydanticImports = Array.from(this.imports.pydantic).sort().join(', ');
        const datetimeImports = Array.from(this.imports.datetime).sort().join(', ');

        let importBlock = '';
        if (typingImports) importBlock += `from typing import ${typingImports}\n`;
        if (datetimeImports) importBlock += `from datetime import ${datetimeImports}\n`;
        if (pydanticImports) importBlock += `from pydantic import ${pydanticImports}\n`;

        return `${importBlock}\n\n${this.models.join('\n\n')}`;
    }
}

export function schemaToPydantic(schema) {
    // datamodel-code-generator can't handle function-calling schemas directly
    if (schema.type === 'function' && schema.function) {
        const params = schema.function.parameters;
        params.title = schema.function.name;
        params.description = schema.function.description;
        schema = params;
    }
    const generator = new PydanticGenerator(schema);
    return generator.generate();
}
