import { HttpService, CategoryID } from '../../api/http.service'
import * as HttpInterfaces from '../../types/TSTypes'

function getTeamPower(teamID: string) {
    const teamPlayers = HttpService.getPlayers.filter(p => p.teamID === teamID);

    if (teamPlayers.length === 0)
        return 50;

    const totalSkill = teamPlayers.reduce((sum, p) => sum + p.skill, 0);
    return totalSkill / teamPlayers.length;
}

export function simulateMatch(teamA: HttpInterfaces.ITeam, teamB: HttpInterfaces.ITeam)
{
    if (!teamA.id || !teamB.id)
        return;

    const powerA = getTeamPower(teamA.id);
    const powerB = getTeamPower(teamB.id);

    const luckA = Math.random() * 20;
    const luckB = Math.random() * 20;

    const finalScoreA = powerA + luckA;
    const finalScoreB = powerB + luckB;

    teamA.played++;
    teamB.played++;

    console.log(`\n⚽ MECCS: ${teamA.name} vs ${teamB.name}`);

    if (Math.abs(finalScoreA - finalScoreB) < 5) {
        teamA.draws++;
        teamB.draws++;
        teamA.points += 1;
        teamB.points += 1;
        console.log(`Végeredmény: Döntetlen!`);
    } else if (finalScoreA > finalScoreB) {
        teamA.wins++;
        teamA.points += 3;
        teamB.loses++;
        console.log(`Végeredmény: ${teamA.name} nyert!`);
    } else {
        teamB.wins++;
        teamB.points += 3;
        teamA.loses++;
        console.log(`Végeredmény: ${teamB.name} nyert!`);
    }
}

function saveResult(): void
{

}