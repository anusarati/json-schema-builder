function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

function waitForTailwind() {
    return new Promise(resolve => {
        // This observer waits for the JIT engine to inject its generated stylesheet.
        const observer = new MutationObserver((mutationsList, observer) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if(node.tagName === 'STYLE' && node.id.startsWith('__tw_')) {
                            observer.disconnect();
                            resolve();
                            return;
                        }
                    }
                }
            }
        });
        observer.observe(document.head, { childList: true, subtree: true });
    });
}


export async function loadPartials() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
        console.error("Critical placeholder element #app-root not found.");
        return false;
    }

    const fetchPartial = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch partial ${url}: ${response.status} ${response.statusText}`);
        }
        return response.text();
    };

    const bodyPartials = [
        'partials/builder-panel.html',
        'partials/viewer-panel.html',
        'partials/import-modal.html',
        'partials/toast-container.html'
    ];
    
    const resizerHtml = '<div id="resizer" class="flex-shrink-0 bg-slate-300 dark:bg-slate-800 cursor-col-resize z-10 basis-[6px] transition-colors hover:bg-indigo-500 hidden md:block"></div>';

    try {
        // Fetch and inject all HTML content first
        const bodyPromises = bodyPartials.map(fetchPartial);
        const [builder, viewer, modal, toast] = await Promise.all(bodyPromises);
        
        appRoot.innerHTML = `
            <div id="main-container" class="flex flex-col md:flex-row h-screen w-full font-sans overflow-hidden">
                ${builder}
                ${resizerHtml}
                ${viewer}
            </div>
            ${modal}
            ${toast}
        `;
        
        // Load the Tailwind script and wait for it to finish processing
        await loadScript('https://cdn.tailwindcss.com');
        await waitForTailwind();
        
        return true; // Signal success

    } catch (error) {
        console.error("CRITICAL: Failed to load application resources.", error);
        appRoot.innerHTML = `<div class="p-8 text-center text-red-600"><strong>Application Failed to Load.</strong> Check the browser console (F12) for details.</div>`;
        return false;
    }
}
