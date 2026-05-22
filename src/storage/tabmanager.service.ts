import { globals } from "./localstorage.globals"

interface tabOptions
{
    current_tab: string
}

export abstract class TabManager
{
    private static readonly STORAGEKEY = globals.STORAGEKEY;
    private static readonly TabManagerKey = "tab-manager";
    private static options: tabOptions = { current_tab: "" }; 

    public static get currentTab(): string
    {
        return this.options.current_tab;
    }

    public static changeTab(newTabName: string): void
    {
        this.options.current_tab = newTabName;
        this.saveTabManager();
    }

    public static loadTabManager()
    {
        try {
            const raw = localStorage.getItem(this.STORAGEKEY);
            if (!raw) return;

            const currentRoot = JSON.parse(raw);
            
            if (currentRoot[this.TabManagerKey]) {
                this.options = currentRoot[this.TabManagerKey] as tabOptions;
            }
            
        } catch (error) {
            console.error("TabManager beállításainak betöltése sikertelen volt: ", error);
        }
    }

    private static saveTabManager(): void
    {
        try {
            const rawStorage = localStorage.getItem(this.STORAGEKEY);
            const currentRoot = rawStorage ? JSON.parse(rawStorage) : {};

            currentRoot[this.TabManagerKey] = this.options;

            localStorage.setItem(this.STORAGEKEY, JSON.stringify(currentRoot));
        } catch (error) {
            console.error("TabManager beállításainak mentése sikertelen volt: ", error);
        }
    }
}