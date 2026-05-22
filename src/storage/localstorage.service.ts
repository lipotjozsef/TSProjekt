import type { ITable } from "../types/ITable";
import type { ITeam } from "../types/ITeam";

export abstract class TableManager
{
    static readonly STORAGEKEY = "athletica"
    private static tables: ITable[] = [];

    private static EventTables = new CustomEvent("tableschanged");
    static readonly CallTablesEvent: Function = function() { window.dispatchEvent(TableManager.EventTables); }

    private static get tablesJSON(): string
    {
        return JSON.stringify(
            {
                tables: TableManager.tables
            }
        );
    }

    static get getTablesLenght(): Number
    {
        return this.tables.length;
    }

    static get getTables(): readonly ITable[]
    {
        const tablesValue = this.tables.slice();
        return tablesValue;
    }

    static getTable(teamIndex: number): ITable
    {
        const table = this.tables[teamIndex];
        return table;
    }

    static saveStorage(): void
    {

        if (TableManager.tables.length == 0)
            return;

        const json = TableManager.tablesJSON;

        localStorage.setItem(TableManager.STORAGEKEY, json);
        TableManager.CallTablesEvent();
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
        TableManager.CallTablesEvent();
    }

    static addTable(tableName: string, teams: string[]): ITable
    {
        const newTable: ITable = {
            name: tableName,
            teams: teams,
            teamResults: new Map<number, ITeam>()
        };

        TableManager.tables.push(newTable);

        return newTable;
    }

    static deleteTable(tableID: number): void
    {
        if (tableID == -1)
            return;

        this.tables.splice(tableID, 1);

        this.saveStorage();
    }
}