import type { IIdentifiable } from "./IIdentifiable.ts"

export interface ITeam extends IIdentifiable
{

    id: number | undefined,
    name: string,
    points: number,
    played: number,
    wins: number,
    draws: number,
    loses: number

}