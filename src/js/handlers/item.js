import {
  appState,
  getActiveSchemaState
} from '../state.js';

import {
  createSchemaItem,
  generateAndDisplaySchema,
  mapJsonToInternal,
  buildSchemaFromItem
} from '../schema.js';

import {
  findItemAndParent,
  showToast
} from '../utils.js';

import { render }     from '../renderer.js';
import { ICONS }      from '../config.js';

/* ------------------------------------------------------------------ */
/*  1.  ADD / REMOVE helpers                                          */
/* ------------------------------------------------------------------ */

export function handleAddRootItem() {
  const activeSchema = getActiveSchemaState();
  const newItem      = createSchemaItem({ type: 'string' });
  activeSchema.schemaDefinition.push(newItem);
  render();
}

export function handleAddDefinition() {
  const activeSchema = getActiveSchemaState();
  const newDef       = createSchemaItem({
    isDefinition : true,
    type         : 'object',
    name         : `NewDefinition${activeSchema.definitions.length + 1}`
  });
  activeSchema.definitions.push(newDef);
  render();
}

export function handleAddNestedItem(parentId, property) {
  const found = findItemAndParent(parentId);
  if (found && found.item) {
    const newItem = createSchemaItem({ type: 'string' });
    found.item[property].push(newItem);
    render();
  }
}

/* ------------------------------------------------------------------ */
/*  2.  LIVE UPDATE & TYPE HANDLING                                   */
/* ------------------------------------------------------------------ */

export function handleItemUpdate(itemId, inputElement) {
  const found = findItemAndParent(itemId);
  if (!found || !found.item) return;

  const item     = found.item;
  const property = inputElement.dataset.property;
  const oldType  = item.type;

  let value =
    inputElement.type === 'checkbox'
      ? inputElement.checked
      : inputElement.value;

  if (inputElement.type === 'number') {
    value = value === '' ? undefined : parseFloat(value);
  }
  if (property === 'enum') {
    value = value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  item[property] = value;

  /* ---- real-time header text refresh ---- */
  if (property === 'name') {
    const card  = inputElement.closest('.schema-item-card');
    const title = card?.querySelector('.field-title');
    if (title) {
      const display =
        value ||
        (item.isDefinition ? '(unnamed definition)' : '(unnamed)');
      title.textContent = display;
      title.title       = display;
    }
  }

  /* ---- type transitions ---- */
  if (property === 'type' && value !== oldType) {
    item.properties   = [];
    item.items        = null;
    item.oneOfSchemas = [];
    item.ref          = '';

    if (value === 'object') item.properties   = [];
    if (value === 'array')  item.items        = createSchemaItem({ type: 'string' });
    if (value === 'oneOf')  item.oneOfSchemas = [];

    render();                        // full re-render for layout changes
  } else {
    generateAndDisplaySchema();      // lightweight rebuild of the JSON output
  }
}

/* ------------------------------------------------------------------ */
/*  3.  COLLAPSE / EXPAND with ANIMATION                              */
/* ------------------------------------------------------------------ */

export function handleToggleCollapse(itemId) {
  const found = findItemAndParent(itemId);
  if (!found || !found.item) return;

  const card    = document.querySelector(
    `.schema-item-card[data-item-id="${itemId}"]`
  );
  const content = card?.querySelector('.collapsible-content');
  const chevron = card?.querySelector('.toggle-chevron');
  if (!card || !content || !chevron) return;

  const willExpand = found.item.isCollapsed;

  if (willExpand) {
    content.classList.remove('collapsed');
    content.style.maxHeight = `${content.scrollHeight}px`;
    chevron.classList.add('rotate-180');

    content.addEventListener('transitionend', function handler() {
      content.style.maxHeight = 'none';
      content.removeEventListener('transitionend', handler);
    });
  } else {
    content.style.maxHeight = `${content.scrollHeight}px`;
    requestAnimationFrame(() => {
      content.classList.add('collapsed');
      content.style.maxHeight = '0';
      chevron.classList.remove('rotate-180');
    });
  }

  found.item.isCollapsed = !found.item.isCollapsed;
}

/* ------------------------------------------------------------------ */
/*  4.  DELETE, MOVE, IMPORT, COPY (unchanged from original)          */
/* ------------------------------------------------------------------ */

export function handleDeleteItem(itemId) {
  const found = findItemAndParent(itemId);
  if (found && found.parentArray) {
    if (
      confirm(
        `Are you sure you want to delete "${
          found.item.name || 'this item'
        }"?`
      )
    ) {
      found.parentArray.splice(found.index, 1);
      render();
    }
  }
}

export function handleMoveItem(itemId, direction) {
  const found = findItemAndParent(itemId);
  if (!found || !found.parentArray) return;

  const { parentArray, index } = found;
  const newIndex = direction === 'up' ? index - 1 : index + 1;

  if (newIndex >= 0 && newIndex < parentArray.length) {
    [parentArray[index], parentArray[newIndex]] = [
      parentArray[newIndex],
      parentArray[index]
    ];
    render();
  }
}

/* ------------------ import helpers (unchanged) ------------------- */
export function handleParseRootProperties(jsonString) { /* ...original code... */ }
export function handleParseProperty(itemId, jsonString) { /* ...original code... */ }

/* ------------------ copy helper (unchanged) ---------------------- */
export async function handleCopyPropertyJson(itemId, buttonElement) { /* ...original code... */ }
