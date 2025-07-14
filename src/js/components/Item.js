import { ICONS, FIELD_TYPES } from '../config.js';
import { renderStringInputs, renderNumberInputs, renderArrayInputs, renderRefInputs } from './Inputs.js';
import { renderNestedBuilder } from './Nested.js';

const inputClasses   =
  "w-full mt-1 p-2 text-sm rounded-md transition-all duration-200 shadow-inner bg-slate-100 border border-slate-300 placeholder-slate-400 text-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:outline-none focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-slate-200 dark:hover:border-slate-600 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/50 dark:focus:border-indigo-500";
const checkboxClasses =
  "h-4 w-4 rounded shrink-0 transition-colors duration-200 text-indigo-600 border-slate-400 bg-white focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:focus:ring-indigo-600 dark:focus:ring-offset-slate-900 dark:checked:bg-indigo-600";
const labelClasses   =
  "block text-xs font-medium text-slate-600 dark:text-slate-400";

export function renderItem(item, options = {}) {
  const {
    isRootArrayItem = false,
    isRootPrimitive = false,
    isDefinition = false,
    isOneOfOption = false,
    isFunctionParameter = false,
  } = options;

  const isRoot        = isRootArrayItem || isRootPrimitive;
  const isRef         = item.type === '$ref';
  const canCollapse   = !isRoot;
  const canImportProp = ['object', 'array', 'oneOf'].includes(item.type) && !isRef;
  const canCopyProp   = !isRoot && !isOneOfOption;

  /* ---------- card shell ---------- */
  const itemDiv = document.createElement('div');
  itemDiv.className =
    'schema-item-card bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-shadow ease-in-out duration-200';
  itemDiv.dataset.itemId = item.id;
  itemDiv.draggable      = false;               // <— drag now happens ONLY on the handle

  /* ---------- header text ---------- */
  let headerText  = item.name || '(unnamed)';
  let headerClass = 'text-slate-800 dark:text-slate-100';
  if (isDefinition)          headerClass = 'text-amber-600 dark:text-amber-400';
  else if (isOneOfOption)    headerClass = 'text-violet-600 dark:text-violet-400';
  else if (isRootArrayItem)  headerText  = 'Array Item Schema';
  else if (isRootPrimitive)  headerText  = 'Root Schema Details';
  else if (isFunctionParameter)
    headerText = item.name || '(unnamed parameter)';

  /* ---------- type selector ---------- */
  const availableTypes = isOneOfOption || isFunctionParameter
    ? FIELD_TYPES.all
    : FIELD_TYPES.all.filter((t) => t !== 'function');
  const typeOptions = availableTypes
    .map((t) => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`)
    .join('');

  /* ---------- template ---------- */
  itemDiv.innerHTML = `
    <div ${canCollapse ? 'data-action="toggleCollapse"' : ''} class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 ${canCollapse ? 'cursor-pointer' : ''}">
      <div class="flex items-center gap-3 min-w-0">
        ${
          !isRoot
            ? `<span class="drag-handle cursor-grab text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Drag to reorder" draggable="true">${ICONS.move}</span>`
            : ''
        }
        <h3 class="field-title font-semibold truncate ${headerClass}" title="${headerText}">${headerText}</h3>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        ${
          canImportProp
            ? `<button data-action="import-property" title="Import JSON for this property" aria-label="Import JSON for this property"
                       class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.import}</button>`
            : ''
        }
        ${
          canCopyProp
            ? `<button data-action="copy-json" title="Copy property JSON" aria-label="Copy property JSON"
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
          !isRoot
            ? `
          <button data-action="moveUp"   title="Move Up"   aria-label="Move field up"   class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.chevronUp}</button>
          <button data-action="moveDown" title="Move Down" aria-label="Move field down" class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">${ICONS.chevronDown}</button>
          <button data-action="delete"   title="Delete"    aria-label="Delete field"    class="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">${ICONS.trash}</button>`
            : ''
        }
      </div>
    </div>

    <div class="collapsible-content ${item.isCollapsed ? 'collapsed' : ''}"
         style="max-height:${item.isCollapsed ? 0 : '2000px'}; margin-top:${item.isCollapsed ? 0 : '1rem'};">
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${
            !isOneOfOption && !isRoot
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
      ${
        !isOneOfOption && !isRoot && !isDefinition
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
  } else if (item.type === 'array' && item.items) {
    nestedBuilder.appendChild(
      renderNestedBuilder([item.items], 'array-items', null, null, null, options)
    );
  } else if (item.type === 'oneOf') {
    nestedBuilder.appendChild(
      renderNestedBuilder(item.oneOfSchemas, 'oneof-options', 'Option', item.id, 'oneOfSchemas', options)
    );
  }

  /* ---------- initial max-height for smooth open ---------- */
  const collapsible = itemDiv.querySelector('.collapsible-content');
  if (collapsible && !item.isCollapsed)
    setTimeout(() => (collapsible.style.maxHeight = `${collapsible.scrollHeight}px`), 0);

  return itemDiv;
}
