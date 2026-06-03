import { TabManager } from "../../storage/tabmanager.service";

const tabContainer: HTMLElement | null = document.querySelector("#my-tab-content");

let application: HTMLElement;

type ViewReturn = {status: boolean, cleanUp: Function | null}
type LoadViewFn = (viewName: string, parent: HTMLElement) => Promise<ViewReturn>;
let onViewChange: LoadViewFn;

let fallbackView: string = "tables";
let fallbackCounter: number = 0;
let currentViewCleanUp: Function | null;

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
            disableButtons(navLinks, true);

            const button = ev?.currentTarget as HTMLHtmlElement;
            const viewName = button.getAttribute('data-view');

            if (viewName)
            {
                clearEventListenersForSharedForm();
                
                currentViewCleanUp?.();

                await triggerSubViewLoad(viewName);
            }

            disableButtons(navLinks, false);
        })
    })
}

function disableButtons(Buttons: NodeList, state: boolean)
{
    Buttons.forEach( btn =>
    {
        const myButton = btn as HTMLButtonElement;
        if (myButton)
            myButton.disabled = state;
    })
}

function clearEventListenersForSharedForm(): void
{
    const old_form = application.querySelector<HTMLFormElement>("#form-modal");
    const new_form = old_form?.cloneNode() as HTMLElement;

    if (old_form && new_form)
    {
        new_form.innerHTML = old_form.innerHTML;
        old_form.replaceWith(new_form);
    }
}

async function triggerSubViewLoad(viewName: string): Promise<void>
{
    if (tabContainer)
    {
        const viewReturn = await onViewChange(viewName, tabContainer);
        if (viewReturn.status)
        {
            TabManager.changeTab(viewName);

            currentViewCleanUp = viewReturn.cleanUp;

            fallbackCounter = 0;
        }
        else if(fallbackCounter != 1)
        {
            TabManager.changeTab(fallbackView);
            fallbackCounter = 1;
        }
    }
}