import type { IPlayer } from "./IPlayer";
import type { ITeam } from "./ITeam";

export interface ITable
{
    name: string;
    teams: string[];
    teamResults: Map<number, ITeam>,
    initialSnapshot: {teams: ITeam[], players: IPlayer[]}
}