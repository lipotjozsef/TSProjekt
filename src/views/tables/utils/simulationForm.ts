import { CategoryID, HttpService } from "../../../api/http.service";
import * as HttpInterfaces from '../../../types/TSTypes'

import { TableManager } from "../../../storage/tablemanager.service";
import type { ITable } from "../../../types/ITable";

import * as Simulation from '../simulation.ts';

interface TableData
{
  tableName: string;
  teams: string[]
}

export function extractSimulationData(form: HTMLFormElement): TableData
{
  const data = new FormData(form);
  return {
    tableName: data.get("tableName")?.toString().trim() ?? "",
    teams: data.getAll("csapat_id").map(val => val.toString())
  }
}

export function validateTableForm(formData: TableData)
{
  let error: string = "";

  if (!formData.tableName)
    error = "Kérem adjon meg tabella nevet!";
  else if (formData.teams.length < 2)
    error = "Legalább 2 csapatot ki kell választani a tabellához!";
  
  if (error) {
    alert(error);
    return false;
  }
  
  return true;
}

export async function createAndSimulateTable(data: TableData)
{
  const teamIDSet = new Set(data.teams);
  const table: ITable = TableManager.addTable(data.tableName, data.teams);

  const playingTeams = HttpService.getTeams.filter(team => teamIDSet.has(team.id ?? '-1'));
  const playingPlayers = HttpService.getPlayers.filter(player =>
    playingTeams.some(team => team.id === player.teamID.toString())
  );

  table.initialSnapshot = {
    teams: structuredClone(playingTeams),
    players: structuredClone(playingPlayers)
  };

  const playerByTeam = playingPlayers.reduce<Record<string, HttpInterfaces.IPlayer[]>>((acc, player) => 
  {
    if (!acc[player.teamID]) {
      acc[player.teamID] = [];
    }

    acc[player.teamID].push(player);
    return acc;
  }, {})

  runSimulationRound(table, playingTeams, playerByTeam);

  await Promise.all([
    ...playingTeams.map(t => HttpService.putEntry(t, t.id!, CategoryID.ITeams, "teams")),
    ...playingPlayers.map(p => HttpService.putEntry(p, p.id!, CategoryID.IPlayers, "players"))
  ]);
    
  TableManager.saveStorage();
}

export function runSimulationRound(
  table: ITable,
  playingTeams: HttpInterfaces.ITeam[],
  playerByTeam: Record<string, HttpInterfaces.IPlayer[]>
)
{
  for (let i = 0; i < playingTeams.length; i++) {
    for (let j = i + 1; j < playingTeams.length; j++) {
      const teamA = playingTeams[i];
      const teamB = playingTeams[j];

      if (!teamA.id || !teamB.id)
        continue;

      const [matchSnapshotA, matchSnapshotB] = Simulation.simulateMatch(
        teamA, 
        teamB, 
        playerByTeam[teamA.id] ?? [], 
        playerByTeam[teamB.id] ?? []
      );

      if (matchSnapshotA.points !== undefined || matchSnapshotB.points !== undefined)
      {
        const existingA = table.teamResults.get(teamA.id);
        const existingB = table.teamResults.get(teamB.id);

        table.teamResults.set(teamA.id, Simulation.addToResult(matchSnapshotA, existingA));
        table.teamResults.set(teamB.id, Simulation.addToResult(matchSnapshotB, existingB)); 
      }
    }
  }
}