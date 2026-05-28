import { HttpService } from '../../api/http.service'
import * as HttpInterfaces from '../../types/TSTypes'

function getTeamPower(teamID: string) {
    const teamPlayers = HttpService.getPlayers.filter(p => p.teamID === teamID);

    if (teamPlayers.length === 0)
        return 50;

    const totalSkill = teamPlayers.reduce((sum, p) => sum + p.skill, 0);
    return totalSkill / teamPlayers.length;
}

export function simulateMatch(teamA: HttpInterfaces.ITeam, teamB: HttpInterfaces.ITeam, playersA: HttpInterfaces.IPlayer[], playersB: HttpInterfaces.IPlayer[]): [HttpInterfaces.ITeam, HttpInterfaces.ITeam]
{
    if (!teamA.id || !teamB.id)
        return [{} as HttpInterfaces.ITeam, {} as HttpInterfaces.ITeam];

    const inital: HttpInterfaces.ITeam[] = structuredClone([teamA, teamB]);

    playersA.forEach(p => p.matches++);
    playersB.forEach(p => p.matches++);

    const powerA = getTeamPower(teamA.id);
    const powerB = getTeamPower(teamB.id);

    const luckA = Math.random() * 20;
    const luckB = Math.random() * 20;

    const finalScoreA = powerA + luckA;
    const finalScoreB = powerB + luckB;

    const goalsA = Math.max(0, Math.floor(finalScoreA / 15));
    const goalsB = Math.max(0, Math.floor(finalScoreB / 15));

    distributeGoalsToPlayers(goalsA, playersA);
    distributeGoalsToPlayers(goalsB, playersB);

    teamA.played++;
    teamB.played++;


    let resultA: "W" | "D" | "L";
    let resultB: "W" | "D" | "L";
    //console.log(`\n MECCS: ${teamA.name} vs ${teamB.name}`);

    if (Math.abs(finalScoreA - finalScoreB) < 5) {
        teamA.draws++;
        teamB.draws++;
        teamA.points += 1;
        teamB.points += 1;

        resultA = "D";
        resultB = "D";
        //console.log(`Végeredmény: Döntetlen!`);
    } else if (finalScoreA > finalScoreB) {
        teamA.wins++;
        teamA.points += 3;
        teamB.loses++;

        resultA = "W";
        resultB = "L";
        //console.log(`Végeredmény: ${teamA.name} nyert!`);
    } else {
        teamB.wins++;
        teamB.points += 3;
        teamA.loses++;

        resultA = "L";
        resultB = "W";
        //console.log(`Végeredmény: ${teamB.name} nyert!`);
    }

    return [
        createSnapshot(inital[0], teamA, resultA),
        createSnapshot(inital[1], teamB, resultB)
    ];
}

export function addToResult(snapshot: HttpInterfaces.ITeam, existing: HttpInterfaces.ITeam | undefined): HttpInterfaces.ITeam
{
    const existingTeam = existing || { points: 0, played: 0, wins: 0, draws: 0, loses: 0, matchHistory: [] };

    const updatedHistory = existingTeam.matchHistory ? [...existingTeam.matchHistory] : [];
    
    if (snapshot.matchHistory && snapshot.matchHistory.length > 0) {
        updatedHistory.push(snapshot.matchHistory[0]);
    }

    if (updatedHistory.length > 5) {
        updatedHistory.shift();
    }

    console.log(snapshot.points);

    return {
      ...snapshot,
      played: existingTeam.played + (snapshot.played || 0),
      wins: existingTeam.wins + (snapshot.wins || 0),
      draws: existingTeam.draws + (snapshot.draws || 0),
      loses: existingTeam.loses + (snapshot.loses || 0),
      points: existingTeam.points - snapshot.points, // így működik lol
      matchHistory: updatedHistory,
    }
}

function createSnapshot(initialTeam: HttpInterfaces.ITeam, updatedTeam: HttpInterfaces.ITeam, result: string): HttpInterfaces.ITeam
{
    const snapshot = {
        id: initialTeam.id,
        name: initialTeam.name,
        points: updatedTeam.points - initialTeam.points,
        played: updatedTeam.played - initialTeam.played,
        wins: updatedTeam.wins - initialTeam.wins,
        draws: updatedTeam.draws - initialTeam.draws,
        loses: updatedTeam.loses - initialTeam.loses,
        matchHistory: [result]
    } as HttpInterfaces.ITeam;

    console.log(snapshot);

    return snapshot;
}

function distributeGoalsToPlayers(totalGoals: number, players: HttpInterfaces.IPlayer[]) {
    const outfieldPlayers = players.filter(p => p.position !== "Kapus");
    
    if (outfieldPlayers.length === 0) return;

    for (let i = 0; i < totalGoals; i++) {
        const totalSkill = outfieldPlayers.reduce((sum, p) => sum + p.skill, 0);
        let randomWeight = Math.random() * totalSkill;
        
        for (const player of outfieldPlayers) {
            randomWeight -= player.skill;
            if (randomWeight <= 0) {
                player.goals++;
                break;
            }
        }
    }
}