import { TabManager } from "../../storage/tabmanager.service";

const tabContainer: HTMLElement | null = document.querySelector("#my-tab-content");

let application: HTMLElement;

type LoadViewFn = (viewName: string, parent: HTMLElement) => Promise<boolean>;
let onViewChange: LoadViewFn;

let fallbackView: string = "tables";
let fallbackCounter: number = 0;

export function init(myApp: HTMLElement, loadViewCallback: LoadViewFn)
{
    if (!tabContainer)
        return;

    application = myApp;
    onViewChange = loadViewCallback;

    TabManager.loadTabManager();

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
    if (TabManager.currentTab)
    {
        application.querySelectorAll<HTMLButtonElement>(".nav-link").forEach((button: HTMLButtonElement) =>
        {
            if (button.getAttribute("data-view") == TabManager.currentTab)
                button.className = "nav-link active";
            else
                button.className = "nav-link";
        });
    }

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
    {
        if (await onViewChange(viewName, tabContainer))
        {
            TabManager.changeTab(viewName);
            fallbackCounter = 0;
        }
        else if(fallbackCounter != 1)
        {
            TabManager.changeTab(fallbackView);
            fallbackCounter = 1;
        }
    }
}