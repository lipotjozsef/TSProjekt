import { TableManager } from '../../storage/localstorage.service'
import type { ITable } from "../../types/ITable";
import { HttpService, CategoryID } from '../../api/http.service'
import * as HttpInterfaces from '../../types/TSTypes'

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

    console.log(teams);
    
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

    TableManager.addTable(tableName, teams);

    const submitButton = application.querySelector<HTMLButtonElement>("#btn-modal-submit");

    if (submitButton)
    {
      submitButton.setAttribute("data-bs-dismiss", "modal");
      submitButton.click();
      submitButton.setAttribute("data-bs-dismiss", "");
    }

    form.reset();
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

    TableManager.getTables.forEach((table: ITable) =>
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
          <a href="#" class="btn-table-detail">Részletek</a>
        </div>
      `;

      parentrow.querySelector<HTMLElement>(".btn-table-detail")!.addEventListener("click", (ev) =>
      {
        ev.preventDefault();

        alert("details " + table.name);
      })
    }
    )
  });
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
