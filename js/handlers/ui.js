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

    // Re-highlight the code to apply the new theme
    if (dom.schemaOutput) {
       hljs.highlightElement(dom.schemaOutput);
    }
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
    setAllCollapsed(false, activeSchema.definitions);
    render();
}
