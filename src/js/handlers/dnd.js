import { appState } from '../state.js';
import { findItemAndParent, showToast } from '../utils.js';
import { render } from '../renderer.js';

export function handleDragStart(e) {
  // The `dragstart` event's target is the element with `draggable="true"`.
  // In our case, this is the header of a schema item card.
  const header = e.target;

  // Verify we are dragging a header and not something else by mistake.
  if (!header.classList.contains('card-header')) {
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
  const card = e.target.closest('.schema-item-card');
  if (card) card.classList.remove('dragging');
  document
    .querySelectorAll('.drop-zone-active')
    .forEach((dz) => dz.classList.remove('drop-zone-active'));
  appState.draggedItemId = null;
}

export function handleDragOver(e) {
  if (!appState.draggedItemId) return;
  e.preventDefault();
  const card = e.target.closest('.schema-item-card');
  if (card && card.dataset.itemId !== appState.draggedItemId) {
    e.dataTransfer.dropEffect = 'move';
    card.classList.add('drop-zone-active');
  }
}

export function handleDragLeave(e) {
  const card = e.target.closest('.schema-item-card');
  if (card) card.classList.remove('drop-zone-active');
}

export function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!appState.draggedItemId) return;

  const targetCard = e.target.closest('.schema-item-card');
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
