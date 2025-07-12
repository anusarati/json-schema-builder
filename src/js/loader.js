import builderPanelHtml from '../partials/builder-panel.html?raw';
import viewerPanelHtml from '../partials/viewer-panel.html?raw';
import importModalHtml from '../partials/import-modal.html?raw';
import toastContainerHtml from '../partials/toast-container.html?raw';

/**
 * This is a synchronous function that builds the main application layout.
 * Vite's '?raw' imports happen at build time, so the HTML content is
 * bundled directly into our JavaScript, making this process instant.
 */
export function loadApp() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
        console.error("Critical placeholder element #app-root not found in index.html.");
        return;
    }

    const resizerHtml = '<div id="resizer" class="resizer hidden md:block"></div>';

    appRoot.innerHTML = `
        <div id="main-container" class="flex flex-col md:flex-row h-screen w-full font-sans overflow-hidden">
            ${builderPanelHtml}
            ${resizerHtml}
            ${viewerPanelHtml}
        </div>
        ${importModalHtml}
        ${toastContainerHtml}
    `;
}
