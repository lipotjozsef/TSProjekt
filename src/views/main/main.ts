const tabContainer: HTMLElement | null = document.querySelector("#my-tab-content");

let application: HTMLElement;

type LoadViewFn = (viewName: string, parent: HTMLElement) => Promise<void>;
let onViewChange: LoadViewFn;

export function init(myApp: HTMLElement, loadViewCallback: LoadViewFn)
{
    if (!tabContainer)
        return;

    application = myApp;
    onViewChange = loadViewCallback;

    displayCurrentYear();
    loadCurrentlyActive();
    
    listenForNavLinks();

}

function displayCurrentYear(): void
{
    const spanYear = document.querySelector<HTMLSpanElement>("#year");
    if (spanYear)
        spanYear.innerText = new Date().getFullYear().toString();
}

function loadCurrentlyActive(): void
{
    const activeTab = application.querySelector<HTMLButtonElement>('.nav-link.active');
    const defaultView = activeTab?.getAttribute('data-view');
    if (defaultView)
        triggerSubViewLoad(defaultView);
}

function listenForNavLinks(): void
{
    const navLinks = document.querySelectorAll<HTMLElement>(".nav-link");

    navLinks.forEach( link =>
    {
        link.addEventListener("click", async (ev) =>
        {
            const button = ev?.currentTarget as HTMLHtmlElement;
            const viewName = button.getAttribute('data-view');

            if (viewName)
                await triggerSubViewLoad(viewName);
        })
    })
}

async function triggerSubViewLoad(viewName: string): Promise<void>
{
    if (tabContainer)
        await onViewChange(viewName, tabContainer);
}