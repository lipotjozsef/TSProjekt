import { CategoryID, HttpService } from "../../../api/http.service";
import * as HttpInterfaces from '../../../types/TSTypes'

import type { ITable } from "../../../types/ITable";

export function rollBackTabData(data: ITable)
{
  const { initialSnapshot, teamResults } = data;

  initialSnapshot.teams.forEach((oldTeam: HttpInterfaces.ITeam) => {
    const currentTeam = HttpService.getTeams.find(t => t.id === oldTeam.id);
    const resultDelta = teamResults.get(Number(oldTeam.id));

    if (currentTeam && resultDelta) {
      currentTeam.points += resultDelta.points;
      currentTeam.played -= resultDelta.played;
      currentTeam.wins   -= resultDelta.wins;
      currentTeam.draws  -= resultDelta.draws;
      currentTeam.loses  -= resultDelta.loses;
    }
  });

  initialSnapshot.players.forEach((oldPlayer: HttpInterfaces.IPlayer) => {
    const currentPlayer = HttpService.getPlayers.find(p => p.id === oldPlayer.id);
    
    if (currentPlayer && teamResults.has(Number(oldPlayer.teamID))) {
      const goalsGained   = Math.max(0, currentPlayer.goals - oldPlayer.goals);
      const matchesGained = Math.max(0, currentPlayer.matches - oldPlayer.matches);
          
      currentPlayer.goals   -= Math.max(0, goalsGained);
      currentPlayer.matches -= Math.max(0, matchesGained);
    }
  });
}

export async function rollbackOnServer(data: ITable): Promise<void>
{
  const playingTeamIDs = new Set(
    Array.from( data.teamResults.keys()).map(id => id.toString())
  );
      
  const serverTeamsToUpdate = HttpService.getTeams.filter(t => playingTeamIDs.has(t.id ?? ''));
  const serverPlayersToUpdate = HttpService.getPlayers.filter(p => playingTeamIDs.has(p.teamID.toString()));

  try
  {
    await Promise.all([
      ...serverTeamsToUpdate.map(t => HttpService.putEntry(t, t.id!, CategoryID.ITeams, "teams")),
      ...serverPlayersToUpdate.map(p => HttpService.putEntry(p, p.id!, CategoryID.IPlayers, "players"))
    ]);
  }
  catch (error)
  {
    console.error("Hiba történt a szerver adatok frissítése közben: ", error);
  }
}