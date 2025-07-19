import { appState } from '../state.js';
import { findItemAndParent, showToast } from '../utils.js';
import { render } from '../renderer.js';

/**
 * Gets the actual element from an event target, handling cases where
 * the target might be a text node.
 * @param {EventTarget|null} target The event target.
 * @returns {HTMLElement|null} The element, or null.
 */
function getElementFromTarget(target) {
    if (!target) return null;
    // If the target is a text node (nodeType 3), get its parent element.
    return target.nodeType === 3 ? target.parentNode : target;
}


export function handleDragStart(e) {
  const targetElement = getElementFromTarget(e.target);
  if (!targetElement) return;

  // We only care about drags that start within a card's header.
  const header = targetElement.closest('.card-header');
  if (!header) {
    e.preventDefault();
    return;
  }

  const card = header.closest('.schema-item-card');
  if (card) {
    appState.draggedItemId = card.dataset.itemId;
    e.dataTransfer.setData('text/plain', appState.draggedItemId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  }
}

export function handleDragEnd(e) {
  // Use a global selector to find the dragged item, which is more robust.
  const draggedCard = document.querySelector('.schema-item-card.dragging');
  if (draggedCard) {
    draggedCard.classList.remove('dragging');
  }
  
  document
    .querySelectorAll('.drop-zone-active')
    .forEach((dz) => dz.classList.remove('drop-zone-active'));
  appState.draggedItemId = null;
}

export function handleDragOver(e) {
  if (!appState.draggedItemId) return;
  e.preventDefault();

  const targetElement = getElementFromTarget(e.target);
  if (!targetElement) return;

  const card = targetElement.closest('.schema-item-card');
  if (card && card.dataset.itemId !== appState.draggedItemId) {
    e.dataTransfer.dropEffect = 'move';
    card.classList.add('drop-zone-active');
  }
}

export function handleDragLeave(e) {
  const targetElement = getElementFromTarget(e.target);
  if (!targetElement) return;
  
  const card = targetElement.closest('.schema-item-card');
  if (card) {
    card.classList.remove('drop-zone-active');
  }
}

export function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!appState.draggedItemId) return;

  const targetElement = getElementFromTarget(e.target);
  if (!targetElement) return;

  const targetCard = targetElement.closest('.schema-item-card');
  if (targetCard) targetCard.classList.remove('drop-zone-active');

  if (
    targetCard &&
    targetCard.dataset.itemId !== appState.draggedItemId
  ) {
    const dragged = findItemAndParent(appState.draggedItemId);
    const target  = findItemAndParent(targetCard.dataset.itemId);

    if (dragged && target && dragged.parentArray === target.parentArray) {
      const itemToMove = dragged.parentArray.splice(dragged.index, 1)[0];
      target.parentArray.splice(target.index, 0, itemToMove);
      render();
    } else {
      showToast('Can only reorder items at the same level.', 'error');
    }
  }
}
