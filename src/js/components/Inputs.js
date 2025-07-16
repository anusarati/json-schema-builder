import { getActiveSchemaState } from '../state.js';
import { ICONS } from '../config.js';

export function renderRefInputs(item) {
    const activeSchema = getActiveSchemaState();
    return `
        <div>
            <label for="ref_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Reference ($ref)</label>
            <select id="ref_${item.id}" data-property="ref">
                <option value="">Select a definition...</option>
                ${activeSchema.definitions
                    .filter(d => d.name)
                    .map(d => `<option value="#/$defs/${d.name}" ${item.ref === `#/$defs/${d.name}` ? 'selected' : ''}>${d.name}</option>`)
                    .join('')
                }
            </select>
        </div>`;
}

export function renderStringInputs(item) {
    const isCollapsed = item.isValidationCollapsed;
    return `
        <div class="validation-panel p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
            <div data-action="toggle-validation-collapse" class="flex items-center justify-between cursor-pointer">
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-300">String Validation</h4>
                <span class="toggle-chevron text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-180'
                }">${ICONS.chevronUp}</span>
            </div>
            <div class="collapsible-content space-y-4 mt-2 ${isCollapsed ? 'collapsed' : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="pattern_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Pattern (RegEx)</label>
                        <input type="text" id="pattern_${item.id}" data-property="pattern" value="${item.pattern || ''}" placeholder="^\\d{3}$">
                    </div>
                    <div>
                        <label for="format_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Format</label>
                        <input type="text" id="format_${item.id}" data-property="format" value="${item.format || ''}" placeholder="email, date-time, etc.">
                    </div>
                    <div>
                        <label for="minLength_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Min Length</label>
                        <input type="number" id="minLength_${item.id}" data-property="minLength" value="${item.minLength !== undefined ? item.minLength : ''}">
                    </div>
                    <div>
                        <label for="maxLength_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Max Length</label>
                        <input type="number" id="maxLength_${item.id}" data-property="maxLength" value="${item.maxLength !== undefined ? item.maxLength : ''}">
                    </div>
                </div>
                <div>
                    <label for="enum_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Enum (comma-separated strings)</label>
                    <textarea id="enum_${item.id}" data-property="enum" rows="2" placeholder="value1, value2">${(item.enum || []).join(', ')}</textarea>
                </div>
            </div>
        </div>`;
}

export function renderNumberInputs(item) {
    const isCollapsed = item.isValidationCollapsed;
    return `
        <div class="validation-panel p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
            <div data-action="toggle-validation-collapse" class="flex items-center justify-between cursor-pointer">
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-300">Number Validation</h4>
                 <span class="toggle-chevron text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-180'
                }">${ICONS.chevronUp}</span>
            </div>
            <div class="collapsible-content space-y-4 mt-2 ${isCollapsed ? 'collapsed' : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="minimum_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Minimum (>=)</label>
                        <input type="number" id="minimum_${item.id}" data-property="minimum" value="${item.minimum !== undefined ? item.minimum : ''}">
                    </div>
                    <div>
                        <label for="exclusiveMinimum_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Exclusive Minimum (>)</label>
                        <input type="number" id="exclusiveMinimum_${item.id}" data-property="exclusiveMinimum" value="${item.exclusiveMinimum !== undefined ? item.exclusiveMinimum : ''}">
                    </div>
                    <div>
                        <label for="maximum_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Maximum (<=)</label>
                        <input type="number" id="maximum_${item.id}" data-property="maximum" value="${item.maximum !== undefined ? item.maximum : ''}">
                    </div>
                    <div>
                        <label for="exclusiveMaximum_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Exclusive Maximum (<)</label>
                        <input type="number" id="exclusiveMaximum_${item.id}" data-property="exclusiveMaximum" value="${item.exclusiveMaximum !== undefined ? item.exclusiveMaximum : ''}">
                    </div>
                </div>
            </div>
        </div>`;
}

export function renderObjectInputs(item) {
    const isCollapsed = item.isValidationCollapsed;
    return `
        <div class="validation-panel p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
            <div data-action="toggle-validation-collapse" class="flex items-center justify-between cursor-pointer">
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-300">Object Validation</h4>
                 <span class="toggle-chevron text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-180'
                }">${ICONS.chevronUp}</span>
            </div>
            <div class="collapsible-content space-y-4 mt-2 ${isCollapsed ? 'collapsed' : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="minProperties_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Min Properties</label>
                        <input type="number" id="minProperties_${item.id}" data-property="minProperties" value="${item.minProperties !== undefined ? item.minProperties : ''}">
                    </div>
                    <div>
                        <label for="maxProperties_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Max Properties</label>
                        <input type="number" id="maxProperties_${item.id}" data-property="maxProperties" value="${item.maxProperties !== undefined ? item.maxProperties : ''}">
                    </div>
                </div>
                <div>
                    <label for="additionalPropertiesType_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Additional Properties</label>
                    <select id="additionalPropertiesType_${item.id}" data-property="additionalPropertiesType">
                        <option value="allow" ${item.additionalPropertiesType === 'allow' ? 'selected' : ''}>Allow</option>
                        <option value="disallow" ${item.additionalPropertiesType === 'disallow' ? 'selected' : ''}>Disallow</option>
                        <option value="schema" ${item.additionalPropertiesType === 'schema' ? 'selected' : ''}>Validate with Schema</option>
                    </select>
                </div>
            </div>
        </div>`;
}

export function renderArrayInputs(item) {
    const isCollapsed = item.isValidationCollapsed;
     return `
        <div class="validation-panel p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
            <div data-action="toggle-validation-collapse" class="flex items-center justify-between cursor-pointer">
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-300">Array Validation</h4>
                 <span class="toggle-chevron text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-180'
                }">${ICONS.chevronUp}</span>
            </div>
            <div class="collapsible-content space-y-4 mt-2 ${isCollapsed ? 'collapsed' : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="minItems_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Min Items</label>
                        <input type="number" id="minItems_${item.id}" data-property="minItems" value="${item.minItems !== undefined ? item.minItems : ''}">
                    </div>
                    <div>
                        <label for="maxItems_${item.id}" class="text-xs font-medium text-slate-500 dark:text-slate-400">Max Items</label>
                        <input type="number" id="maxItems_${item.id}" data-property="maxItems" value="${item.maxItems !== undefined ? item.maxItems : ''}">
                    </div>
                </div>
                <div class="flex items-center pt-2">
                    <input type="checkbox" id="uniqueItems_${item.id}" data-property="uniqueItems" ${item.uniqueItems ? 'checked' : ''}>
                    <label for="uniqueItems_${item.id}" class="ml-2 text-sm text-slate-700 dark:text-slate-300">Unique Items</label>
                </div>
            </div>
        </div>`;
}
