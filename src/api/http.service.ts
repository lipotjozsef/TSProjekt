import type { IPlayer, ITeam, IIdentifiable } from '../types/TSTypes.ts'
import * as APIErrors from "./APIErrors/APIErrors.ts"

export enum CategoryID
{
    IPlayers,
    ITeams
}

export abstract class HttpService
{
    private static cache: Map<number, Map<string, object>> = new Map<number, Map<string, object>>();
    static APIURL: string = "http://localhost:4512/";

    private static eventCacheChange: CustomEvent = new CustomEvent("cachechanged");

    static callCacheChanged: Function = () => { window.dispatchEvent(this.eventCacheChange) };

    private static getValues<T>(objectMap: Map<string, object> | undefined): readonly T[]
    {
        if (!objectMap)
            return [];
        let objectValues: object[] = Array.from(objectMap.values());
        return objectValues as T[] ?? [];
    }

    static get getCache(): {players: readonly IPlayer[], teams: readonly ITeam[]}
    {
        return {
            players: this.getPlayers,
            teams: this.getTeams
        };
    }

    static get getPlayers(): readonly IPlayer[]
    {
        return this.getValues<IPlayer>(this.cache.get(CategoryID.IPlayers));
    }

    static get getTeams(): readonly ITeam[]
    {
        return this.getValues<ITeam>(this.cache.get(CategoryID.ITeams));
    }

    static async updateCache(): Promise<boolean>
    {
        const players: IPlayer[] = await this.queryAll<IPlayer>("players");
        if (!players)
            throw new APIErrors.ErrorCacheFailed("A játékosok lekérésében hiba lépett fel!");

        const teams: ITeam[] = await this.queryAll<ITeam>("teams");
        if (!teams)
            throw new APIErrors.ErrorCacheFailed("A csapatok lekérésében hiba lépett fel!");

        {
            let playersMap = new Map<string, IPlayer>();
            players.forEach(player =>
            {
                if (player.id)
                    playersMap.set(player.id, player);
            });
            this.cache.set(CategoryID.IPlayers, playersMap);
        }

        {
            let teamsMap = new Map<string, ITeam>();
            teams.forEach((team: ITeam) =>
            {
                if (team.id)
                    teamsMap.set(team.id, team);
            })
            this.cache.set(CategoryID.ITeams, teamsMap);
        }

        if (this.cache.size == 0)
            return false;

        this.callCacheChanged();

        return true;
    }

    private static checkEndPoint(response: Response, ePRP: string): Promise<any>
    {
        if (response.ok)
        {
            return response.json();
        }
        throw new APIErrors.ErrorUnreachableEndPoint(`Az API "${this.APIURL}${ePRP}" endpontján nem érhető el!`);
    }

    static async queryAll<T>(endPointRealtivePath: string): Promise<T[]>
    {
        let objects: T[] = [];

        const requestOptions: RequestInit = {
            method: 'GET',
            redirect: 'follow'
        };
        
        await fetch(`${this.APIURL}${endPointRealtivePath}`, requestOptions)
        .then(response => this.checkEndPoint(response, endPointRealtivePath))
        .then(result =>
        {
            let newObject: T[] = result as T[];
            if (newObject)
                objects = newObject;
        })
        .catch(error =>
        {
            console.log('A GET kérelemmel hiba történt:', error);
            objects = [];
        });

        return objects;
    }

    private static getSubCacheMap<T>(valueID: string, categoryID: CategoryID, ignoreCheck: boolean = false): Map<string, T> | undefined
    {
        let subMap: Map<string, T>;
        if (this.cache.has(categoryID))
        {
            subMap = this.cache.get(categoryID)! as Map<string, T>;
            if (!subMap.has(valueID) && !ignoreCheck)
                return undefined;
        }
        else
            return undefined;

        return subMap;
    }

    static async submitEntry<T extends IIdentifiable>(newValue: T, categoryID: CategoryID, endPointRealtivePath: string): Promise<T | null>
    {

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(newValue);

        const requestOptions: RequestInit = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        let newObject: T | null = await fetch(`${this.APIURL}${endPointRealtivePath}`, requestOptions)
        .then(response => this.checkEndPoint(response, endPointRealtivePath))
        .then(result => result as T)
        .catch(error =>
        {
            console.log('A POST kérelemmel hiba történt: ', error);
            return null;
        });

        if (newObject && newObject.id)
        {
            const subMap: Map<string, T> | undefined = this.getSubCacheMap<T>(newObject.id, categoryID, true);
            if (!subMap)
                throw new Error("A json-server által adott új objektum hibás!");
            subMap.set(newObject.id, newObject);
            this.callCacheChanged();
        }

        return newObject;
    }

    static async putEntry<T extends IIdentifiable>(newValue: T, valueID: string, categoryID: CategoryID, endPointRealtivePath: string): Promise<boolean>
    {
        const subMap: Map<string, T> | undefined = this.getSubCacheMap<T>(valueID, categoryID);
        if (!subMap)
            return false;

        if (newValue.id && !subMap.has(newValue.id))
            return false;

        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        let raw = JSON.stringify(newValue);

        let requestOptions: RequestInit = {
            method: 'PUT',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        let status: boolean = await fetch(`${this.APIURL}${endPointRealtivePath}\\${valueID}`, requestOptions)
        .then(response => this.checkEndPoint(response, endPointRealtivePath))
        .then(_ => true)
        .catch(error =>
        {
            console.log('A PUT kérelemmel hiba történt: ', error);
            return false;
        });

        if (newValue.id)
            subMap.set(newValue.id, newValue);

        return status;
    }

    static async updateEntry<T extends IIdentifiable>(oldValue: T, newValue: T, valueID: string, categoryID: CategoryID, endPointRealtivePath: string): Promise<boolean>
    {

        const subMap: Map<string, T> | undefined = this.getSubCacheMap<T>(valueID, categoryID);
        if (!subMap)
            return false;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        let difference: Partial<T> = {};

        {
            const keys = Object.keys(newValue) as Array<keyof T>;

            keys.forEach((key) => {
                if (newValue[key] !== oldValue[key]) {
                    difference[key] = newValue[key];
                }
            });
        }

        const raw = JSON.stringify(difference);

        const requestOptions: RequestInit = {
            method: 'PATCH',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        let status: boolean = await fetch(`${this.APIURL}${endPointRealtivePath}\\${valueID}`, requestOptions)
        .then(response => this.checkEndPoint(response, endPointRealtivePath))
        .then(_ => true)
        .catch(error =>
        {
            console.log('A PATCH kérelemmel hiba történt: ', error);
            return false;
        });

        if (status)
        {
            subMap.set(valueID, newValue);
            this.callCacheChanged();
        }

        return status;
    }

    static async deleteEntry(valueID: string, categoryID: CategoryID, endPointRealtivePath: string): Promise<boolean>
    {
        const subMap: Map<string, object> | undefined = this.getSubCacheMap<object>(valueID, categoryID);
        if (!subMap)
            return false;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const requestOptions: RequestInit = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
        };

        let status: boolean = await fetch(`${this.APIURL}${endPointRealtivePath}\\${valueID}`, requestOptions)
        .then(response => this.checkEndPoint(response, endPointRealtivePath))
        .then(_ => true)
        .catch(error => 
        {
            console.log('A DELETE kérelemmel hiba történt: ', error);
            return false;
        });

        if (status)
        {
            subMap.delete(valueID);
            this.callCacheChanged();
        }

        return status;
    }
}