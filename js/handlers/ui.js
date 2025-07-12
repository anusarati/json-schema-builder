import { dom } from '../dom.js';
import { ICONS } from '../config.js';
import { appState } from '../state.js';
import { render } from '../renderer.js';

export function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('schemaBuilderTheme', isDark ? 'dark' : 'light');
    dom.themeToggleBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;

    // Toggle highlight.js theme
    const lightTheme = document.getElementById('hljs-light-theme');
    const darkTheme = document.getElementById('hljs-dark-theme');
    if (lightTheme && darkTheme) {
        lightTheme.disabled = isDark;
        darkTheme.disabled = !isDark;
    }
    // Re-highlight the code to apply the new theme
    hljs.highlightElement(dom.schemaOutput);
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
    setAllCollapsed(true, appState.schemaDefinition);
    setAllCollapsed(true, appState.definitions);
    render();
}

export function handleExpandAll() {
    setAllCollapsed(false, appState.schemaDefinition);
    setAllCollapsed(false, appState.definitions);
    render();
}
