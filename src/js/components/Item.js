import { ICONS, FIELD_TYPES } from '../config.js';
import { renderStringInputs, renderNumberInputs, renderArrayInputs, renderRefInputs, renderObjectInputs } from './Inputs.js';
import { renderNestedBuilder } from './Nested.js';

function renderConditionalBuilder(item) {
    // This function can remain as string-based for simplicity, as it's self-contained.
    // Or it could be converted to the template pattern as well.
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

  const template = document.getElementById('schema-item-template');
  const itemDiv = template.content.firstElementChild.cloneNode(true);
  
  // Create a map of references to the elements in the template
  const refs = {};
  itemDiv.querySelectorAll('[data-ref]').forEach(el => {
    refs[el.dataset.ref] = el;
  });

  // Set top-level data
  itemDiv.dataset.itemId = item.id;
  itemDiv.querySelector('.card-header').setAttribute('data-action', canCollapse ? 'toggleCollapse' : '');
  itemDiv.querySelector('.card-header').classList.toggle('cursor-grab', canCollapse);

  // Configure header text and style
  let headerText  = item.name || '(unnamed)';
  let headerClass = 'text-slate-800 dark:text-slate-100';
  if (isDefinition)          headerClass = 'text-amber-600 dark:text-amber-400';
  else if (isRootNot)        headerText  = 'Negated Schema';
  else if (isSubSchema)      headerText  = 'Schema Option';
  else if (isRootArrayItem)  headerText  = 'Array Item Schema';
  else if (isRootPrimitive)  headerText  = 'Root Schema Details';
  else if (isFunctionParameter) headerText = item.name || '(unnamed parameter)';
  
  refs.headerText.textContent = headerText;
  refs.headerText.title = headerText;
  refs.headerText.className += ` ${headerClass}`;

  // Configure controls
  refs.dragHandle.innerHTML = ICONS.move;
  refs.dragHandle.style.display = (isRoot || isRootNot) ? 'none' : '';
  
  refs.importBtn.innerHTML = ICONS.import;
  refs.importBtn.style.display = canImportProp ? '' : 'none';

  refs.copyBtn.innerHTML = ICONS.copy;
  refs.copyBtn.style.display = canCopyProp ? '' : 'none';

  refs.collapseChevron.innerHTML = ICONS.chevronUp;
  refs.collapseChevron.style.display = canCollapse ? '' : 'none';
  refs.collapseChevron.classList.toggle('rotate-180', !item.isCollapsed);
  
  const moveDeleteControls = [refs.moveUpBtn, refs.moveDownBtn, refs.deleteBtn];
  moveDeleteControls.forEach(btn => btn.style.display = (!isRoot && !isRootNot) ? '' : 'none');
  refs.moveUpBtn.innerHTML = ICONS.chevronUp;
  refs.moveDownBtn.innerHTML = ICONS.chevronDown;
  refs.deleteBtn.innerHTML = ICONS.trash;

  // Configure collapsible content
  refs.collapsibleContent.classList.toggle('collapsed', item.isCollapsed);
  
  // Configure name and type inputs
  if (canHaveName) {
    refs.nameInput.value = item.name || '';
    refs.nameInput.placeholder = isDefinition ? 'DefinitionName' : 'fieldName';
    refs.nameInput.id = `name_${item.id}`;
    refs.nameLabel.htmlFor = `name_${item.id}`;
  } else {
    refs.nameContainer.remove();
  }

  refs.typeSelector.id = `type_${item.id}`;
  refs.typeLabel.htmlFor = `type_${item.id}`;
  const availableTypes = isSubSchema || isFunctionParameter || isRootNot
    ? FIELD_TYPES.all
    : FIELD_TYPES.all.filter((t) => t !== 'function');
  refs.typeSelector.innerHTML = availableTypes
    .map((t) => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`)
    .join('');

  // Render type-specific inputs
  const typeSpecificDiv = refs.typeSpecificContent;
  if (isRef) {
    typeSpecificDiv.innerHTML = renderRefInputs(item);
  } else {
    typeSpecificDiv.innerHTML = `
      <div>
        <label for="desc_${item.id}" class="block font-medium text-slate-600 dark:text-slate-400">Description</label>
        <textarea id="desc_${item.id}" data-property="description" rows="2"
                  placeholder="Field description..." class="w-full mt-1 p-2 text-sm rounded-md transition-all duration-200 shadow-inner">${item.description || ''}</textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="default_${item.id}" class="block font-medium text-slate-600 dark:text-slate-400">Default Value (JSON)</label>
          <textarea id="default_${item.id}" data-property="defaultValue" rows="2"
                    placeholder='"a string", 42, true' class="font-mono w-full mt-1 p-2 text-sm rounded-md transition-all duration-200 shadow-inner">${item.defaultValue || ''}</textarea>
        </div>
        <div>
          <label for="const_${item.id}" class="block font-medium text-slate-600 dark:text-slate-400">Constant Value (JSON)</label>
          <textarea id="const_${item.id}" data-property="constValue" rows="2"
                    placeholder='"USA", 100, false' class="font-mono w-full mt-1 p-2 text-sm rounded-md transition-all duration-200 shadow-inner">${item.constValue || ''}</textarea>
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
          <input type="checkbox" id="required_${item.id}" data-property="required" ${item.required ? 'checked' : ''} class="h-4 w-4 rounded shrink-0 transition-colors duration-200 text-indigo-600 border-slate-400 bg-white focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-600 dark:bg-slate-700 dark:focus:ring-indigo-600 dark:focus:ring-offset-slate-900 dark:checked:bg-indigo-600">
          <label for="required_${item.id}" class="ml-2 text-sm text-slate-700 dark:text-slate-300">Is Required?</label>
        </div>`
          : ''
      }
    `;
  }
  
  // Render nested builders
  const nestedBuilder = refs.nestedBuilder;
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

  // Render conditional builder
  if (!isRef) {
      const conditionalBuilderContainer = refs.conditionalBuilder;
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
