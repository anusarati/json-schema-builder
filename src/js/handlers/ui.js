import { dom } from '../dom.js';
import { ICONS } from '../config.js';
import { appState, getActiveSchemaState } from '../state.js';
import { render } from '../renderer.js';

export function toggleTheme() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const lightTheme = document.getElementById('hljs-light-theme');
    const darkTheme = document.getElementById('hljs-dark-theme');

    if (isCurrentlyDark) {
        // Switch to light mode
        document.documentElement.classList.remove('dark');
        localStorage.setItem('schemaBuilderTheme', 'light');
        dom.themeToggleBtn.innerHTML = ICONS.moon;
        if (lightTheme) lightTheme.disabled = false;
        if (darkTheme) darkTheme.disabled = true;
    } else {
        // Switch to dark mode
        document.documentElement.classList.add('dark');
        localStorage.setItem('schemaBuilderTheme', 'dark');
        dom.themeToggleBtn.innerHTML = ICONS.sun;
        if (lightTheme) lightTheme.disabled = true;
        if (darkTheme) darkTheme.disabled = false;
    }

    // Re-highlight the code to apply the new theme.
    // The main schema viewer has the `hljs` class and is re-themed by the browser.
    // We only need to re-highlight content in modals that use auto-highlighting.
    if (!dom.pydanticModal.classList.contains('hidden') && dom.pydanticOutput.textContent) {
        dom.pydanticOutput.removeAttribute('data-highlighted');
        hljs.highlightElement(dom.pydanticOutput);
    }
}

export function toggleDensity() {
    const root = dom.appRoot;
    let newDensity;

    // Corrected logic: The icon shows the state you will enter.
    if (root.classList.contains('dense')) {
        // From DENSE -> COMFORTABLE
        root.classList.remove('dense');
        newDensity = 'comfortable';
        dom.densityToggleBtn.innerHTML = ICONS.densityCompact; // Next click will go to compact
    } else if (root.classList.contains('compact')) {
        // From COMPACT -> DENSE
        root.classList.remove('compact');
        root.classList.add('dense');
        newDensity = 'dense';
        dom.densityToggleBtn.innerHTML = ICONS.densityComfortable; // Next click will go to comfortable
    } else {
        // From COMFORTABLE -> COMPACT
        root.classList.add('compact');
        newDensity = 'compact';
        dom.densityToggleBtn.innerHTML = ICONS.densityDense; // Next click will go to dense
    }

    localStorage.setItem('schemaBuilderDensity', newDensity);
}

export function initResizablePanels() {
    const resizer = dom.resizer;
    if (!resizer) return; // Exit if resizer is not on the page (e.g. mobile)

    const leftPanel = dom.leftPanel;
    const container = dom.mainContainer;

    const mouseMoveHandler = (e) => {
        e.preventDefault();
        const containerRect = container.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;
        
        // Clamp values to prevent panels from becoming too small
        if (newLeftWidth > 300 && newLeftWidth < (containerRect.width - 300)) {
            const newBasis = (newLeftWidth / containerRect.width) * 100;
            leftPanel.style.flexBasis = `${newBasis}%`;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        localStorage.setItem('schemaBuilderLeftPanelWidth', leftPanel.style.flexBasis);
    };

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    // Set initial width from localStorage, otherwise default to 50%
    const savedWidth = localStorage.getItem('schemaBuilderLeftPanelWidth');
    if (savedWidth) {
        leftPanel.style.flexBasis = savedWidth;
    } else {
        leftPanel.style.flexBasis = '50%';
    }
}

function setAllCollapsed(isCollapsed, items) {
    if (!items) return;
    const itemsArray = Array.isArray(items) ? items : [items];
    
    itemsArray.forEach(item => {
        if (typeof item !== 'object' || item === null) return;
        
        item.isCollapsed = isCollapsed;
        
        if (item.properties) setAllCollapsed(isCollapsed, item.properties);
        if (item.items) setAllCollapsed(isCollapsed, item.items);
        if (item.oneOfSchemas) setAllCollapsed(isCollapsed, item.oneOfSchemas);
    });
}

export function handleCollapseAll() {
    const activeSchema = getActiveSchemaState();
    setAllCollapsed(true, activeSchema.schemaDefinition);
    setAllCollapsed(true, activeSchema.definitions);
    render();
}

export function handleExpandAll() {
    const activeSchema = getActiveSchemaState();
    setAllCollapsed(false, activeSchema.schemaDefinition);
    // FIX: Corrected this line which was a duplicate of the one above.
    setAllCollapsed(false, activeSchema.definitions);
    render();
}
