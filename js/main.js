import { dom } from './dom.js';
import { FIELD_TYPES, ICONS } from './config.js';
import { render } from './renderer.js';
import { 
    toggleTheme, 
    initResizablePanels, 
    handleGlobalDetailChange, 
    handleRootTypeChange, 
    handleAddDefinition, 
    handleCopySchema, 
    handleExportSchema, 
    toggleImportModal, 
    handleImportFile, 
    handleParseAndLoad, 
    handleItemUpdate, 
    handleDeleteItem, 
    handleMoveItem, 
    handleToggleCollapse, 
    handleDragStart, 
    handleDragEnd, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop, 
    resetSchemaDefinitionForRootType,
    handleClearSchema
} from './events.js';

function init() {
    dom.rootSchemaTypeSelector.innerHTML = FIELD_TYPES.root.map(t => `<option value="${t}">${t}</option>`).join('');
    dom.themeToggleBtn.innerHTML = document.documentElement.classList.contains('dark') ? ICONS.sun : ICONS.moon;
    
    // --- Global Listeners ---
    dom.themeToggleBtn.addEventListener('click', toggleTheme);
    dom.clearSchemaBtn.addEventListener('click', handleClearSchema);
    dom.schemaTitle.addEventListener('input', handleGlobalDetailChange);
    dom.schemaDescription.addEventListener('input', handleGlobalDetailChange);
    dom.rootSchemaTypeSelector.addEventListener('change', handleRootTypeChange);
    dom.addDefinitionBtn.addEventListener('click', handleAddDefinition);
    dom.copySchemaBtn.addEventListener('click', handleCopySchema);
    dom.exportBtn.addEventListener('click', handleExportSchema);
    
    // --- Modal Listeners ---
    dom.importBtn.addEventListener('click', () => toggleImportModal(true));
    dom.closeImportModalBtn.addEventListener('click', () => toggleImportModal(false));
    dom.importFileBtn.addEventListener('click', () => dom.importFileInput.click());
    dom.importFileInput.addEventListener('change', handleImportFile);
    dom.parseSchemaBtn.addEventListener('click', handleParseAndLoad);
    dom.importModal.addEventListener('click', (e) => {
        if (e.target === dom.importModal) toggleImportModal(false);
    });

    // --- Event Delegation for Builder Panel ---
    const builderPanel = dom.leftPanelScroller;
    builderPanel.addEventListener('input', e => {
        if (e.target.matches('input, select, textarea')) handleItemUpdate(e);
    });
    builderPanel.addEventListener('change', e => {
         if (e.target.matches('input[type="checkbox"]')) handleItemUpdate(e);
    });
    builderPanel.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const card = button.closest('.schema-item-card');
        if (card && action) {
            const itemId = card.dataset.itemId;
            if (action === 'delete') handleDeleteItem(itemId);
            if (action === 'moveUp') handleMoveItem(itemId, 'up');
            if (action === 'moveDown') handleMoveItem(itemId, 'down');
            if (action === 'toggleCollapse') handleToggleCollapse(itemId);
        }
    });
    builderPanel.addEventListener('dragstart', handleDragStart);
    builderPanel.addEventListener('dragend', handleDragEnd);
    builderPanel.addEventListener('dragover', handleDragOver);
    builderPanel.addEventListener('dragleave', handleDragLeave);
    builderPanel.addEventListener('drop', handleDrop);

    // --- Initial Setup ---
    initResizablePanels();
    // resetSchemaDefinitionForRootType(); // No longer needed here, state is loaded from persistence
    render();
}

document.addEventListener('DOMContentLoaded', init);
