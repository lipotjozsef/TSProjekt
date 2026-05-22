import { TableManager } from '../../storage/localstorage.service'
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

    for (let i = 0; i < playingTeams.length; i++) {
      for (let j = i + 1; j < playingTeams.length; j++) {
        const teamA = playingTeams[i];
        const teamB = playingTeams[j];

        Simulation.simulateMatch(teamA, teamB);
        table.teamResults.set(Number(teamA.id), teamA);
        table.teamResults.set(Number(teamB.id), teamB);
      }
    }

    if (submitButton)
    {
      submitButton.setAttribute("data-bs-dismiss", "modal");
      submitButton.click();
      submitButton.setAttribute("data-bs-dismiss", "");
    }

    TableManager.saveStorage();
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

    TableManager.deleteTable(tableID);
    tableHiddenInput.value = '-1';
  });
}

function listenForTableChange(): void
{
  const tableContainer = document.querySelector("#table-container");
  if (!tableContainer)
    return;

  if (TableManager.getTablesLenght == 0)
  {
    tableContainer.innerHTML = '';
    const parentrow = createElement<HTMLElement>(
      {
        name: "div",
        className: "row text-center border-bottom",
        parent: tableContainer
      } as ElementOptions
    );
    parentrow.innerHTML =
    `
      <p class="fst-italic">Jelenleg nincsen egy tabella sem felvéle...</p>
    `;
  }

  window.addEventListener("tableschanged", () =>
  {

    tableContainer.innerHTML = '';

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

  // HTML táblázat generálása a meglévő adatokkal
  modalBody.innerHTML = `
    <div class="table-detail-container">
      <h3>Bajnoki Tabella - ${(index+1).toString().padStart(2, '0')}. csoport</h3>
      <table class="leaderboard-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="border-bottom: 2px solid #ccc; text-align: left;">
            <th style="padding: 8px;">#</th>
            <th style="padding: 8px;">Csapat</th>
            <th style="padding: 8px; text-align: center;">M</th>
            <th style="padding: 8px; text-align: center;">Gy</th>
            <th style="padding: 8px; text-align: center;">D</th>
            <th style="padding: 8px; text-align: center;">V</th>
            <th style="padding: 8px; text-align: center;">PT</th>
          </tr>
        </thead>
        <tbody>
          ${leaderboard.map((entry, index) => {
            const team = entry; // A csapat adatai a meglévő modell szerint
            return `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold;">${index + 1}.</td>
                <td style="padding: 8px;">${team.name}</td>
                <td style="padding: 8px; text-align: center;">${team.played}</td>
                <td style="padding: 8px; text-align: center;">${team.wins}</td>
                <td style="padding: 8px; text-align: center;">${team.draws}</td>
                <td style="padding: 8px; text-align: center;">${team.loses}</td>
                <td style="padding: 8px; text-align: center; font-weight: bold;">${team.points}</td>
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

  const teamCheckbox: HTMLInputElement = createElement<HTMLInputElement>(
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

  const teamLabel: HTMLLabelElement = createElement<HTMLLabelElement>(
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
