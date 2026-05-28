import * as HttpInterfaces from '../../../types/TSTypes'

import { TableManager } from "../../../storage/tablemanager.service";
import type { ITable } from "../../../types/ITable";

import * as HTMLUtils from '../utils/htmlUtils.ts';

import emptyTabFormTable from '../HTMLcode/emptyTabFormTable.html?raw';
import tabFormTable from '../HTMLcode/tabFormTable.html?raw';
import detailModalTabTable from '../HTMLcode/detailModalTabTable.html?raw'

export function renderTableView(container: HTMLElement, application: HTMLElement): void
{
  container.innerHTML = '';
  const parentrow = HTMLUtils.createElement<HTMLElement>( {
      name: "div",
      className: "row text-center border-bottom",
      parent: container
    } as HTMLUtils.ElementOptions);

  if (TableManager.getTablesLength == 0)
  {
    parentrow.innerHTML = emptyTabFormTable;
    return;
  }
    
  parentrow.innerHTML = tabFormTable;

  const tbody = parentrow.querySelector<HTMLTableElement>("#tables-body");
  if (!tbody)
    return;

  TableManager.getTables.forEach((table: ITable, index: number) =>
  {
    const tr = createTableRow(table, index, application);
    tbody.appendChild(tr);
  });
}

function createTableRow(table: ITable, index: number, application: HTMLElement): HTMLTableRowElement
{
  const tr = document.createElement("tr");

  const rowNumber = (index+1).toString().padStart(2, '0');
  const btnID = `btn-detail-${index}`;

  tr.innerHTML = `
    <td>${rowNumber}</td>
    <td>${table.name}</td>
    <td>
      <button type="button" id="${btnID}" class="btn-lin text-decoration-underline text-primary" data-bs-toggle="modal" data-bs-target="#details-model">
        Részletek
      </button>
    </td>
  `;

  const detailButton = tr.querySelector<HTMLButtonElement>("#".concat(btnID));
  detailButton!.addEventListener("click", () => handleDetailClick(index, application));

  return tr;
}

function handleDetailClick(index: number, application: HTMLElement): void
{
  const tableHiddenInput = application.querySelector<HTMLInputElement>("#view-table-id");
  if (!tableHiddenInput)
    return;
  tableHiddenInput.value = index.toString();

  fillDetailModal(tableHiddenInput.value, application);
}

function fillDetailModal(tableIndex: string, application: HTMLElement): void
{
  const modalBody = application.querySelector("#detail-body");
  if (!modalBody)
    return;

  modalBody.innerHTML = '';

  const index = Number.parseInt(tableIndex)
  const teams: Map<number, HttpInterfaces.ITeam> = TableManager.getTable(index).teamResults;

  let leaderboard: HttpInterfaces.ITeam[] = [];
  if (teams)
    leaderboard = [...teams.values()].sort((a, b) =>  a.points - b.points);

  modalBody.innerHTML = detailModalTabTable;

  const tabNumber = (index+1).toString().padStart(2, '0');
  const tabNumSpan = modalBody.querySelector<HTMLElement>("#tab-num");
  tabNumSpan!.innerText = tabNumber;

  const detailTBody = modalBody.querySelector("#detail-tbody");
  detailTBody!.innerHTML = leaderboard.map((entry, index) => {
    const team = entry;

    let lastFiveMatchesIcons = "";
    const length = team.matchHistory?.length ?? -1;
    for(let i = 0; i < 6; i++)
    {
      if (i > length)
        lastFiveMatchesIcons += '<img class="tab-result-ico" src="./images/noinfoIcon.svg" />';
      else
      {
        let currentHistory = team.matchHistory![i];
        if (currentHistory == "D")
          lastFiveMatchesIcons += '<img class="tab-result-ico" src="./images/drawIcon.svg" />';
        else if (currentHistory == "L")
          lastFiveMatchesIcons += '<img class="tab-result-ico" src="./images/lossIcon.svg" />';
        else if (currentHistory == "W")
          lastFiveMatchesIcons += '<img class="tab-result-ico" src="./images/winIcon.svg" />';
      }

    }

    return `
      <tr class="border-bottom">
        <td class="mb-3 fw-bold">${index + 1}.</td>
        <td class="mb-3">${team.name}</td>
        <td class="mb-3 text-center">${team.played}</td>
        <td class="mb-3 text-center">${team.wins}</td>
        <td class="mb-3 text-center">${team.draws}</td>
        <td class="mb-3 text-center">${team.loses}</td>
        <td class="mb-3 text-center text-success fw-bold">${Math.abs(team.points)}</td>
        <td class="text-center align-middle">
          <div class="d-flex gap-1 justify-content-center align-items-center">
            ${lastFiveMatchesIcons}
          </div>
        </td>
      </tr>`;
  }).join('');
}