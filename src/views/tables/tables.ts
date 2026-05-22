import { TableManager } from '../../storage/tablemanager.service.ts'
import type { ITable } from "../../types/ITable";
import { HttpService, CategoryID } from '../../api/http.service'
import * as HttpInterfaces from '../../types/TSTypes'

import * as Simulation from './simulation.ts';

let application: HTMLElement;

import tableModal from './tablemodal.html?raw';

export interface ElementOptions {
    name: string;
    parent: HTMLElement | null;
    id: string;
    className: string;
    innerHTML: string;
    innerText: string;
    attributes: object;
}

export function init(parent: HTMLElement, _: Function)
{
  application = parent;

  listenForTableChange();

  TableManager.loadStorage();

  loadTableModal();
  createTableModalTeams();

  listenForTableModal();
  listenForDetailModal();
}

function loadTableModal()
{
    const modalTitle = application.querySelector<HTMLElement>(".modal-title");
    const modalBody = application.querySelector<HTMLElement>(".modal-body");

    if (!modalTitle || !modalBody)
        return;

    modalTitle.innerText = "Tabella Kreáló"
    modalBody.innerHTML = tableModal;
}


function listenForTableModal(): void
{
  const form: HTMLFormElement | null = document.querySelector("#form-modal");

  if (!form)
    throw new Error("A form element nem található, #form-modal!");

  form.addEventListener("submit", (ev: SubmitEvent) =>
  {
    ev.preventDefault();

    const data = new FormData(form);
    let tableName = data.get("tableName")!.toString();
    let teams = data.getAll("csapat_id").map(val => val.toString());
    
    if (!tableName)
    {
      alert("Kérem adjon meg tabella nevet!");
      return;
    }

    if (teams.length < 2)
    {
      alert("Legalább 2 csapatot ki kell választani a tabellához!");
      return;
    }

    const table = TableManager.addTable(tableName, teams);

    const submitButton = application.querySelector<HTMLButtonElement>("#btn-modal-submit");

    const playingTeams: HttpInterfaces.ITeam[] = HttpService.getTeams.filter(team => teams.includes(team.id ?? '-1'));
    const playingPlayers = HttpService.getPlayers.filter(player => playingTeams.some(team => team.id === player.teamID.toString()));

    table.initialSnapshot = {
      teams: structuredClone(playingTeams),
      players: structuredClone(playingPlayers)
    };

    const playerByTeam: Record<string, HttpInterfaces.IPlayer[]> = playingPlayers.reduce((acc, player) => 
    {
      if (!acc[player.teamID])
      {
        acc[player.teamID] = [];
      }

      acc[player.teamID].push(player);

      return acc;
    }, {} as Record<string, HttpInterfaces.IPlayer[]>)

    for (let i = 0; i < playingTeams.length; i++) {
      for (let j = i + 1; j < playingTeams.length; j++) {
        const teamA = playingTeams[i];
        const teamB = playingTeams[j];
        if (!teamA.id || !teamB.id)
          continue;

        const [matchSnapshotA, matchSnapshotB] = Simulation.simulateMatch(
          teamA, 
          teamB, 
          playerByTeam[teamA.id] || [], 
          playerByTeam[teamB.id] || []
        );
        
        const existingA = table.teamResults.get(Number(teamA.id));
        const existingB = table.teamResults.get(Number(teamB.id));

        if (matchSnapshotA.points != undefined || matchSnapshotB.points != undefined)
        {
          table.teamResults.set(Number(teamA.id), Simulation.addToResult(matchSnapshotA, existingA));
          table.teamResults.set(Number(teamB.id), Simulation.addToResult(matchSnapshotB, existingB)); 
        }
      }
    }

    Promise.all([
    ...playingTeams.map(t => HttpService.putEntry(t, t.id!, CategoryID.ITeams, "teams")),
    ...playingPlayers.map(p => HttpService.putEntry(p, p.id!, CategoryID.IPlayers, "players"))
    ])//.then(() => console.log("Tabella adatok elmentve"));

    if (submitButton)
    {
      submitButton.setAttribute("data-bs-dismiss", "modal");
      submitButton.click();
      submitButton.setAttribute("data-bs-dismiss", "");
    }

    TableManager.saveStorage();
    form.reset();
  });

  const cancelButton: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#btn-modal-cancel");

  cancelButton?.addEventListener("click", (ev) =>
  {
    form.reset();
  });
}

function listenForDetailModal()
{
  const deleteButton = application.querySelector<HTMLButtonElement>("#btn-detail-delete");

  if (!deleteButton)
    return;

  const tableHiddenInput = application.querySelector<HTMLInputElement>("#view-table-id");
  if (!tableHiddenInput)
    return;

  deleteButton.addEventListener("click", () =>
  {
    if (!confirm('Biztosan végleg törli ezt a tabellát?'))
      return;

    const tableID = Number.parseInt(tableHiddenInput.value);
    const tableData = TableManager.getTable(tableID);
    
    if (tableData && tableData.initialSnapshot) {
      const snapshot = tableData.initialSnapshot;

      snapshot.teams.forEach((oldTeam: HttpInterfaces.ITeam) => {
        const current = HttpService.getTeams.find(t => t.id === oldTeam.id);
        if (current) {
          current.points -= tableData.teamResults.get(Number(oldTeam.id))!.points;
          current.played -= tableData.teamResults.get(Number(oldTeam.id))!.played;
          current.wins   -= tableData.teamResults.get(Number(oldTeam.id))!.wins;
          current.draws  -= tableData.teamResults.get(Number(oldTeam.id))!.draws;
          current.loses  -= tableData.teamResults.get(Number(oldTeam.id))!.loses;
        }
      });

      snapshot.players.forEach((oldPlayer: HttpInterfaces.IPlayer) => {
        const current = HttpService.getPlayers.find(p => p.id === oldPlayer.id);
        if (current && tableData.teamResults.has(Number(oldPlayer.teamID))) {
          const goalsGained = current.goals - oldPlayer.goals;
          const matchesGained = current.matches - oldPlayer.matches;
          
          current.goals -= Math.max(0, goalsGained);
          current.matches -= Math.max(0, matchesGained);
        }
      });

      const playingTeamIDs = Array.from(tableData.teamResults.keys()).map(id => id.toString());
      
      const serverTeamsToUpdate = HttpService.getTeams.filter(t => playingTeamIDs.includes(t.id ?? ''));
      const serverPlayersToUpdate = HttpService.getPlayers.filter(p => playingTeamIDs.includes(p.teamID.toString()));

      Promise.all([
        ...serverTeamsToUpdate.map(t => HttpService.putEntry(t, t.id!, CategoryID.ITeams, "teams")),
        ...serverPlayersToUpdate.map(p => HttpService.putEntry(p, p.id!, CategoryID.IPlayers, "players"))
      ])//.then(() => console.log("Adatok levonva!"));
    }

    TableManager.deleteTable(tableID);
    TableManager.saveStorage();

    tableHiddenInput.value = '-1';
  });
}

function listenForTableChange(): void
{
  const tableContainer = document.querySelector("#table-container");
  if (!tableContainer)
    return;

  window.addEventListener("tableschanged", () =>
  {
    tableContainer.innerHTML = '';
    const parentrow = createElement<HTMLElement>(
      {
        name: "div",
        className: "row text-center border-bottom",
        parent: tableContainer
      } as ElementOptions
    );

    if (TableManager.getTablesLength == 0)
    {
      parentrow.innerHTML =
      `
        <p class="fst-italic">Jelenleg nincsen egy tabella sem felvéle...</p>
      `;
    }

    TableManager.getTables.forEach((table: ITable, tableIndex: number) =>
    {
      const parentrow = createElement<HTMLElement>(
        {
          name: "div",
          className: "row",
          parent: tableContainer
        } as ElementOptions
      );

      parentrow.innerHTML =
      `
        <div class="col-6">
          <p>${table.name}</p>
        </div>
        <div class="col-6 text-end">
          <button type="button" class="btn-link text-decoration-underline text-primary" data-bs-toggle="modal" data-bs-target="#details-model">
            Részletek
          </button>
        </div>
      `;

      parentrow.querySelector<HTMLButtonElement>(".btn-link")?.addEventListener("click", () =>
      {
          const tableHiddenInput = application.querySelector<HTMLInputElement>("#view-table-id");
          if (!tableHiddenInput)
            return;
          tableHiddenInput.value = tableIndex.toString();

          fillDetailModal(tableHiddenInput.value);
      });
    }
    )
  });
}

function fillDetailModal(tableIndex: string): void
{
  const modalBody = application.querySelector("#detail-body");
  if (!modalBody)
    return;

  modalBody.innerHTML = '';

  const index = Number.parseInt(tableIndex)
  const table: ITable = TableManager.getTable(index);
  const teams = table.teamResults;

  let leaderboard: HttpInterfaces.ITeam[] = [];
  if (teams)
    leaderboard = [...teams.values()].sort((a, b) => b.points - a.points);

  modalBody.innerHTML = `
    <div class="table-detail-container">
      <h3>Bajnoki Tabella - ${(index+1).toString().padStart(2, '0')}. csoport</h3>
      <table class="leaderboard-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr class=border-bottom border-3 border-secondary bg-secondary text-start">
            <th class="mb-3">#</th>
            <th class="mb-3">Csapat</th>
            <th class="mb-3 text-center">M</th>
            <th class="mb-3 text-center">Gy</th>
            <th class="mb-3 text-center">D</th>
            <th class="mb-3 text-center">V</th>
            <th class="mb-3 text-center">PT</th>
          </tr>
        </thead>
        <tbody>
          ${leaderboard.map((entry, index) => {
            const team = entry;
            return `
              <tr class="border-bottom">
                <td class="mb-3 fw-bold">${index + 1}.</td>
                <td class="mb-3">${team.name}</td>
                <td class="mb-3 text-center">${team.played}</td>
                <td class="mb-3 text-center">${team.wins}</td>
                <td class="mb-3 text-center">${team.draws}</td>
                <td class="mb-3 text-center">${team.loses}</td>
                <td class="mb-3 text-center fw-bold">${team.points}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function createTableModalTeams(): void
{
  const divModalTeam: HTMLElement | null = application!.querySelector("#team-body");

  if (!divModalTeam)
    return;

  HttpService.getTeams.forEach(team =>
  {
    divModalTeam.appendChild(
      createTeamInput(team)
    );
  })
}

function createTeamInput(team: HttpInterfaces.ITeam): HTMLElement
{

  const parent = createElement<HTMLElement>(
    {
      name: "div",
      className: "form-check"
    } as ElementOptions
  )

  const teamIDValue: string = team.id!.toString();
  const checkboxID: string = `csapat_id`;

  createElement<HTMLInputElement>(
    {
      name: "input",
      className: "form-check-input",
      id: checkboxID,
      attributes: {
        "type": "checkbox",
        "name": checkboxID,
        "value": teamIDValue
      },
      parent: parent
    } as ElementOptions
  )

  createElement<HTMLLabelElement>(
    {
      name: "label",
      className: "form-check-label",
      innerText: team.name,
      attributes:
      {
        "for": checkboxID
      },
      parent: parent
    } as ElementOptions
  )

  return parent;
}

function createElement<T extends HTMLElement>({ name, parent, id, innerHTML, innerText, className, attributes }: ElementOptions): T {
  const el = document.createElement(name) as T;
  parent?.appendChild(el);
  if (id) el.id = id;
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  if (innerText) el.innerText = innerText;

  if(attributes != undefined) {
    Object.entries(attributes)?.forEach(([key, value]) => {
      el.setAttribute(String(key), String(value));
    })
  }

  return el;
}
