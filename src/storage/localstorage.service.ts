import type { ITable } from "../types/ITable";

export abstract class TableManager
{
    static readonly STORAGEKEY = "athletica"
    private static tables: ITable[] = [];

    private static EventTables = new CustomEvent("tableschanged");
    static readonly CallTablesEvent: Function = function() { window.dispatchEvent(TableManager.EventTables); }

    static get tablesJSON(): string
    {
        return JSON.stringify(
            {
                tables: TableManager.tables
            }
        );
    }

    static saveStorage(): void
    {
        if (TableManager.tables.length == 0)
            return;

        const json = TableManager.tablesJSON;

        localStorage.setItem(TableManager.STORAGEKEY, json);
    }

    static loadStorage(): void
    {
        if (localStorage.length == 0)
            return;

        const raw = localStorage.getItem(TableManager.STORAGEKEY);

        if (!raw)
            return;

        const data = JSON.parse(raw);
        TableManager.tables = Object.values(data['tables']);
    }

    static addTable(tableName: string, teams: string[]): void
    {
        const newTable: ITable = {
            name: tableName,
            teams: teams
        } as ITable;

        console.log(newTable);

        TableManager.tables.push(newTable);

        TableManager.CallTablesEvent();
        TableManager.saveStorage();
    }
}