import { ICONS, FIELD_TYPES } from '../config.js';
import { renderStringInputs, renderNumberInputs, renderArrayInputs, renderRefInputs, renderObjectInputs } from './Inputs.js';
import { renderNestedBuilder } from './Nested.js';

const inputClasses   =
  "w-full mt-1 p-2 text-sm rounded-md transition-all duration-200 shadow-inner bg-slate-100 border border-slate-300 placeholder-slate-400 text-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:outline-none focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-slate-200 dark:hover:border-slate-600 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/50 dark:focus:border-indigo-500";
const checkboxClasses =
  "h-4 w-4 rounded shrink-0 transition-colors duration-200 text-indigo-600 border-slate-400 bg-white focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:focus:ring-indigo-600 dark:focus:ring-offset-slate-900 dark:checked:bg-indigo-600";
const labelClasses   =
  "block text-xs font-medium text-slate-600 dark:text-slate-400";

function renderConditionalBuilder(item) {
    const renderSection = (type, schema) => {
        if (schema) {
            return `
                <div class="conditional-section">
                    <div class="flex justify-between items-center mb-2">
                        <h5 class="text-sm font-semibold uppercase text-${type === 'if' ? 'green' : (type === 'then' ? 'blue' : 'orange')}-600 dark:text-${type === 'if' ? 'green' : (type === 'then' ? 'blue' : 'orange')}-400">${type}</h5>
                        <button data-action="delete-conditional" data-conditional-type="${type}" title="Delete ${type.toUpperCase()} Schema" class="p-1 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">${ICONS.trash}</button>
                    </div>
                    <div id="nested_${type}_${item.id}"></div>
                </div>`;
        }
        return `
            <button data-action="add-conditional" data-conditional-type="${type}" class="flex items-center gap-2 mt-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors">
                ${ICONS.plus} Add ${type.toUpperCase()} Schema
            </button>`;
    };

    const isCollapsed = item.isConditionalCollapsed;

    return `
        <div class="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
            <div data-action="toggle-conditional-collapse" class="flex items-center justify-between cursor-pointer">
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-300">Conditional Validation</h4>
                <span class="toggle-chevron p-1.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-180'
                  }">${ICONS.chevronUp}</span>
            </div>
            <div class="collapsible-content space-y-4 mt-2 ${isCollapsed ? 'collapsed' : ''}">
                ${renderSection('if', item.ifSchema)}
                ${item.ifSchema ? renderSection('then', item.thenSchema) : ''}
                ${item.ifSchema ? renderSection('else', item.elseSchema) : ''}
            </div>
        </div>`;
}

export function renderItem(item, options = {}) {
  const {
    isRootArrayItem = false,
    isRootPrimitive = false,
    isDefinition = false,
    isSubSchema = false,
    isFunctionParameter = false,
    isRootNot = false,
  } = options;

  const isRoot        = isRootArrayItem || isRootPrimitive;
  const isRef         = item.type === '$ref';
  const canCollapse   = !isRoot;
  const canImportProp = ['object', 'array', 'oneOf', 'allOf', 'anyOf', 'not'].includes(item.type) && !isRef;
  const canCopyProp   = !isRoot && !isSubSchema && !isRootNot;
  const canHaveName   = !isSubSchema && !isRootArrayItem && !isRootPrimitive && !isRootNot;

  /* ---------- card shell ---------- */
  const itemDiv = document.createElement('div');
  itemDiv.className =
    'schema-item-card bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-shadow ease-in-out duration-200';
  itemDiv.dataset.itemId = item.id;
  itemDiv.draggable      = false; // The card itself is not draggable, only its header.

  /* ---------- header text ---------- */
  let headerText  = item.name || '(unnamed)';
  let headerClass = 'text-slate-800 dark:text-slate-100';
  if (isDefinition)          headerClass = 'text-amber-600 dark:text-amber-400';
  else if (isRootNot)        headerText  = 'Negated Schema';
  else if (isSubSchema)      headerText  = 'Schema Option';
  else if (isRootArrayItem)  headerText  = 'Array Item Schema';
  else if (isRootPrimitive)  headerText  = 'Root Schema Details';
  else if (isFunctionParameter)
    headerText = item.name || '(unnamed parameter)';

  /* ---------- type selector ---------- */
  const availableTypes = isSubSchema || isFunctionParameter || isRootNot
    ? FIELD_TYPES.all
    : FIELD_TYPES.all.filter((t) => t !== 'function');
  const typeOptions = availableTypes
    .map((t) => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`)
    .join('');

  /* ---------- template ---------- */
  itemDiv.innerHTML = `
    <div ${canCollapse ? 'data-action="toggleCollapse"' : ''} draggable="true" class="card-header flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 ${canCollapse ? 'cursor-grab' : ''}">
      <div class="flex items-center gap-3 min-w-0">
        ${
          !isRoot && !isRootNot
            ? `<span class="drag-handle text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Drag to reorder">${ICONS.move}</span>`
            : ''
        }
        <h3 class="field-title font-semibold truncate ${headerClass}" title="${headerText}">${headerText}</h3>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        ${
          canImportProp
            ? `<button draggable="false" data-action="import-property" title="Import JSON for this property" aria-label="Import JSON for this property"
                       class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.import}</button>`
            : ''
        }
        ${
          canCopyProp
            ? `<button draggable="false" data-action="copy-json" title="Copy property JSON" aria-label="Copy property JSON"
                       class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.copy}</button>`
            : ''
        }
        ${
          canCollapse
            ? `<span class="toggle-chevron p-1.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                item.isCollapsed ? '' : 'rotate-180'
              }">${ICONS.chevronUp}</span>`
            : ''
        }
        ${
          !isRoot && !isRootNot
            ? `
          <button draggable="false" data-action="moveUp"   title="Move Up"   aria-label="Move field up"   class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.chevronUp}</button>
          <button draggable="false" data-action="moveDown" title="Move Down" aria-label="Move field down" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.chevronDown}</button>
          <button draggable="false" data-action="delete"   title="Delete"    aria-label="Delete field"    class="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">${ICONS.trash}</button>`
            : ''
        }
      </div>
    </div>

    <div class="collapsible-content ${item.isCollapsed ? 'collapsed' : ''}">
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${
            canHaveName
              ? `
            <div>
              <label for="name_${item.id}" class="${labelClasses}">Name</label>
              <input  type="text" id="name_${item.id}" data-property="name"
                      value="${item.name || ''}"
                      placeholder="${isDefinition ? 'DefinitionName' : 'fieldName'}"
                      class="${inputClasses}">
            </div>`
              : '<div class="hidden md:block"></div>'
          }
          <div>
            <label for="type_${item.id}" class="${labelClasses}">Type</label>
            <select id="type_${item.id}" data-property="type" class="${inputClasses}">${typeOptions}</select>
          </div>
        </div>

        <div id="type_specific_${item.id}" class="space-y-4"></div>
        <div id="nested_builder_${item.id}" class="mt-4"></div>
        <div id="conditional_builder_${item.id}"></div>
      </div>
    </div>
  `;

  /* ---------- dynamic sub-sections ---------- */
  const typeSpecificDiv = itemDiv.querySelector(`#type_specific_${item.id}`);
  if (isRef) {
    typeSpecificDiv.innerHTML = renderRefInputs(item);
  } else {
    typeSpecificDiv.innerHTML = `
      <div>
        <label for="desc_${item.id}" class="${labelClasses}">Description</label>
        <textarea id="desc_${item.id}" data-property="description" rows="2"
                  placeholder="Field description..." class="${inputClasses}">${item.description || ''}</textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="default_${item.id}" class="${labelClasses}">Default Value (JSON)</label>
          <textarea id="default_${item.id}" data-property="defaultValue" rows="2"
                    placeholder='"a string", 42, true' class="font-mono ${inputClasses}">${item.defaultValue || ''}</textarea>
        </div>
        <div>
          <label for="const_${item.id}" class="${labelClasses}">Constant Value (JSON)</label>
          <textarea id="const_${item.id}" data-property="constValue" rows="2"
                    placeholder='"USA", 100, false' class="font-mono ${inputClasses}">${item.constValue || ''}</textarea>
        </div>
      </div>
      ${item.type === 'string'  ? renderStringInputs(item)  : ''}
      ${item.type === 'number' || item.type === 'integer' ? renderNumberInputs(item) : ''}
      ${item.type === 'array'   ? renderArrayInputs(item)  : ''}
      ${item.type === 'object'  ? renderObjectInputs(item) : ''}
      ${
        canHaveName && !isDefinition
          ? `
        <div class="flex items-center pt-2">
          <input type="checkbox" id="required_${item.id}" data-property="required" ${
              item.required ? 'checked' : ''
            } class="${checkboxClasses}">
          <label for="required_${item.id}"
                 class="ml-2 text-sm text-slate-700 dark:text-slate-300 ${labelClasses}">Is Required?</label>
        </div>`
          : ''
      }
    `;
  }

  /* ---------- nested builders ---------- */
  const nestedBuilder = itemDiv.querySelector(`#nested_builder_${item.id}`);
  if (item.type === 'object') {
    nestedBuilder.appendChild(
      renderNestedBuilder(item.properties, 'object-properties', 'Property', item.id, 'properties', options)
    );
    if (item.additionalPropertiesType === 'schema' && item.additionalPropertiesSchema) {
        nestedBuilder.appendChild(renderNestedBuilder([item.additionalPropertiesSchema], 'additional-properties', null, null, null, options));
    }
  } else if (item.type === 'array' && item.items) {
    nestedBuilder.appendChild(
      renderNestedBuilder([item.items], 'array-items', null, null, null, options)
    );
  } else if (item.type === 'oneOf') {
    nestedBuilder.appendChild(
      renderNestedBuilder(item.oneOfSchemas, 'oneof-options', 'Option', item.id, 'oneOfSchemas', options)
    );
  } else if (item.type === 'allOf') {
    nestedBuilder.appendChild(
      renderNestedBuilder(item.allOfSchemas, 'allOf-options', 'Schema', item.id, 'allOfSchemas', options)
    );
  } else if (item.type === 'anyOf') {
    nestedBuilder.appendChild(
      renderNestedBuilder(item.anyOfSchemas, 'anyOf-options', 'Schema', item.id, 'anyOfSchemas', options)
    );
  } else if (item.type === 'not') {
    nestedBuilder.appendChild(
      renderNestedBuilder(item.notSchema ? [item.notSchema] : [], 'not-options', null, null, null, options)
    );
  }
  
  /* ---------- conditional builder ---------- */
  if (!isRef) {
      const conditionalBuilderContainer = itemDiv.querySelector(`#conditional_builder_${item.id}`);
      conditionalBuilderContainer.innerHTML = renderConditionalBuilder(item);

      if (item.ifSchema) {
          const ifContainer = itemDiv.querySelector(`#nested_if_${item.id}`);
          if(ifContainer) ifContainer.appendChild(renderNestedBuilder([item.ifSchema], 'if-schema', null, null, null, options));
      }
      if (item.thenSchema) {
          const thenContainer = itemDiv.querySelector(`#nested_then_${item.id}`);
          if(thenContainer) thenContainer.appendChild(renderNestedBuilder([item.thenSchema], 'then-schema', null, null, null, options));
      }
      if (item.elseSchema) {
          const elseContainer = itemDiv.querySelector(`#nested_else_${item.id}`);
          if(elseContainer) elseContainer.appendChild(renderNestedBuilder([item.elseSchema], 'else-schema', null, null, null, options));
      }
  }

  return itemDiv;
}
