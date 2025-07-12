import builderPanelHtml from '../partials/builder-panel.html?raw';
import viewerPanelHtml from '../partials/viewer-panel.html?raw';
import importModalHtml from '../partials/import-modal.html?raw';
import toastContainerHtml from '../partials/toast-container.html?raw';

export function loadApp() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
        console.error("Critical placeholder element #app-root not found.");
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
