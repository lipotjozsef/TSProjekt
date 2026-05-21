import type { EPosition } from "./EPosition.ts"
import type { IIdentifiable } from "./IIdentifiable.ts"

export interface IPlayer extends IIdentifiable
{

    id: string | undefined,
    teamID: string,
    name: string,
    goals: number,
    matches: number,
    skill: number,
    position: EPosition

}