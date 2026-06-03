import type { ITable } from "../types/ITable";
import type { ITeam } from "../types/ITeam";
import { globals } from "./localstorage.globals";

export abstract class TableManager
{
    private static readonly STORAGEKEY = globals.STORAGEKEY;
    private static readonly TableManagerKey = "tables";
    private static tables: ITable[] = [];

    private static EventTables = new CustomEvent("tableschanged");
    static readonly CallTablesEvent: Function = function() { window.dispatchEvent(TableManager.EventTables); }

    static get getTablesLength(): number
    {
        return this.tables ? this.tables.length : 0;
    }

    static get getTables(): readonly ITable[]
    {
        return this.tables.slice();
    }

    static getTable(teamIndex: number): ITable
    {
        const table = this.tables[teamIndex];
        return table;
    }

    static saveStorage(): void
    {
        try {
            const rawStorage = localStorage.getItem(this.STORAGEKEY);
            const currentRoot = rawStorage ? JSON.parse(rawStorage) : {};

            currentRoot[this.TableManagerKey] = { tables: this.tables };

            localStorage.setItem(this.STORAGEKEY, JSON.stringify(currentRoot, (_, value) => {
                if (value instanceof Map) {
                    return { _type: 'Map', data: Array.from(value.entries()) };
                }
                return value;
            }));
            this.CallTablesEvent();
        } catch (error) {
            console.error("Tabellák mentése sikertelen volt: ", error);
        }
    }

    static loadStorage(): void
    {
        try {
            const raw = localStorage.getItem(this.STORAGEKEY);
            if (!raw)
            {
                this.tables = [];
                this.CallTablesEvent();
                return;
            }

            const currentRoot = JSON.parse(raw, (_, value) => {
                if (value && value._type === 'Map') {
                return new Map(value.data);
                }
                return value;
            });
            const container = currentRoot[this.TableManagerKey];

            if (container && Array.isArray(container.tables))
            {
                this.tables = container.tables;
            }
            else
            {
                this.tables = [];
            }
            this.CallTablesEvent();
        }
        catch (error)
        {
            console.error("Tabellák betöltése sikertelen volt: ", error);
            this.tables = [];
        }
    }

    static addTable(tableName: string, teams: string[]): ITable {
        const newTable: ITable = {
            name: tableName,
            teams: teams,
            teamResults: new Map<number, ITeam>(),
            initialSnapshot: {teams: [], players: []}
        };

        this.tables.push(newTable);
        return newTable;
    }

    static deleteTable(tableID: number): void {
        if (tableID < 0 || tableID >= this.tables.length) return;

        this.tables.splice(tableID, 1);
    }
}