import '../main.css';
import { loadApp } from './loader.js'; // Correctly imports the 'loadApp' function
import { initDom, dom } from './dom.js';
import { FIELD_TYPES, ICONS } from './config.js';
import { render, updateUndoRedoButtons } from './renderer.js';
import { handleCollapseAll, handleExpandAll, initResizablePanels, toggleTheme, toggleDensity } from './handlers/ui.js';
import { handleClearSchema, handleGlobalDetailChange, handleRootTypeChange, handleSchemaPropertyToggle } from './handlers/state.js';
import { handleAddDefinition, handleDeleteItem, handleItemUpdate, handleMoveItem, handleToggleCollapse, handleCopyPropertyJson } from './handlers/item.js';
import { handleCopySchema, handleExportSchema, handleImportFile, handleOpenPropertyImport, handleOpenRootPropertiesImport, handleParseAndLoad, closeImportModal, openRootImportModal } from './handlers/io.js';
import { handleDragEnd, handleDragLeave, handleDragOver, handleDragStart, handleDrop } from './handlers/dnd.js';
import { undo, redo } from './history.js';

function init() {
    dom.rootSchemaTypeSelector.innerHTML = FIELD_TYPES.root.map(t => `<option value="${t}">${t}</option>`).join('');
    
    // Set initial UI states from localStorage
    const isDark = document.documentElement.classList.contains('dark');
    dom.themeToggleBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    
    const savedDensity = localStorage.getItem('schemaBuilderDensity') || 'comfortable';
    if (savedDensity === 'dense') {
        dom.appRoot.classList.add('dense');
        dom.densityToggleBtn.innerHTML = ICONS.densityComfortable;
    } else if (savedDensity === 'compact') {
        dom.appRoot.classList.add('compact');
        dom.densityToggleBtn.innerHTML = ICONS.densityDense;
    } else { // comfortable
        dom.densityToggleBtn.innerHTML = ICONS.densityCompact;
    }

    dom.importRootPropertiesBtn.innerHTML = ICONS.import;
    
    // --- Global Listeners ---
    dom.themeToggleBtn.addEventListener('click', toggleTheme);
    dom.densityToggleBtn.addEventListener('click', toggleDensity);
    dom.undoBtn.addEventListener('click', undo);
    dom.redoBtn.addEventListener('click', redo);
    dom.clearSchemaBtn.addEventListener('click', handleClearSchema);
    dom.collapseAllBtn.addEventListener('click', handleCollapseAll);
    dom.expandAllBtn.addEventListener('click', handleExpandAll);
    dom.rootSchemaTypeSelector.addEventListener('change', handleRootTypeChange);
    dom.addDefinitionBtn.addEventListener('click', handleAddDefinition);
    dom.copySchemaBtn.addEventListener('click', handleCopySchema);
    dom.exportBtn.addEventListener('click', handleExportSchema);
    dom.importRootPropertiesBtn.addEventListener('click', handleOpenRootPropertiesImport);
    
    // --- History Listener ---
    window.addEventListener('builder:historychange', updateUndoRedoButtons);

    // --- Global Inputs: Real-time update on 'input', commit to history on 'change' ---
    ['schemaTitle', 'schemaDescription'].forEach(id => {
        const el = dom[id];
        el.addEventListener('input', (e) => handleGlobalDetailChange(e, { commit: false }));
        el.addEventListener('change', (e) => handleGlobalDetailChange(e, { commit: true }));
    });
    dom.includeSchemaToggle.addEventListener('change', (e) => handleSchemaPropertyToggle(e, { commit: true }));


    // --- Modal Listeners ---
    dom.importBtn.addEventListener('click', openRootImportModal);
    dom.closeImportModalBtn.addEventListener('click', closeImportModal);
    dom.importFileBtn.addEventListener('click', () => dom.importFileInput.click());
    dom.importFileInput.addEventListener('change', handleImportFile);
    dom.parseSchemaBtn.addEventListener('click', handleParseAndLoad);
    dom.importModal.addEventListener('click', (e) => {
        if (e.target === dom.importModal) closeImportModal();
    });

    // --- Keyboard Shortcuts ---
    window.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea, select')) return;

        const isMac = navigator.platform.toUpperCase().includes('MAC');
        const isUndo = (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key === 'z';
        const isRedo = (isMac ? e.metaKey && e.shiftKey && e.key === 'z' : e.ctrlKey && e.key === 'y');

        if (isUndo) { e.preventDefault(); undo(); } 
        else if (isRedo) { e.preventDefault(); redo(); }
    });

    // --- Event Delegation for Builder Panel ---
    const builderPanel = dom.leftPanelScroller;
    builderPanel.addEventListener('input', e => {
        const target = e.target;
        if (target.matches('input:not([type="checkbox"]), textarea')) {
            const card = target.closest('.schema-item-card');
            if (card) handleItemUpdate(card.dataset.itemId, target, { commit: false });
        }
    });

    builderPanel.addEventListener('change', e => {
        const target = e.target;
        if (target.matches('input, select, textarea')) {
            const card = target.closest('.schema-item-card');
            if (card) handleItemUpdate(card.dataset.itemId, target, { commit: true });
        }
    });
    
    builderPanel.addEventListener('click', e => {
        const actionTarget = e.target.closest('[data-action]');
        if (!actionTarget) return;

        const card = actionTarget.closest('.schema-item-card');
        if (!card) return;
        
        const itemId = card.dataset.itemId;
        const action = actionTarget.dataset.action;

        if (action === 'delete') handleDeleteItem(itemId);
        if (action === 'moveUp') handleMoveItem(itemId, 'up');
        if (action === 'moveDown') handleMoveItem(itemId, 'down');
        if (action === 'toggleCollapse') handleToggleCollapse(itemId);
        if (action === 'import-property') handleOpenPropertyImport(itemId);
        if (action === 'copy-json') handleCopyPropertyJson(itemId, actionTarget);
    });

    builderPanel.addEventListener('dragstart', handleDragStart);
    builderPanel.addEventListener('dragend', handleDragEnd);
    builderPanel.addEventListener('dragover', handleDragOver);
    builderPanel.addEventListener('dragleave', handleDragLeave);
    builderPanel.addEventListener('drop', handleDrop);

    // --- Initial Setup ---
    initResizablePanels();
    render();
}

/**
 * Main application entry point.
 */
function main() {
    loadApp();
    initDom();
    init();
}

document.addEventListener('DOMContentLoaded', main);
