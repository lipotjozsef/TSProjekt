import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

import { HttpService, CategoryID } from './api/http.service'
import { TableManager } from './storage/localstorage.service'
import * as HttpInterfaces from './types/TSTypes';

import tablesHTML from "../src/components/tables.html?raw"

const myApp: HTMLElement | null = document.querySelector("#app");

document.body.onload = initialize;

async function initialize(): Promise<void>
{
  TableManager.loadStorage();

  await tryUpdateCache();

  if (!myApp)
    throw new Error("Could not find #app div element!");

  myApp.className =  "bg-light";

  myApp!.innerHTML =
  `
    ${tablesHTML}
  `;

  createTableModalTeams();

  listenForTableModal();
  listenForTableChange();
}

async function tryUpdateCache(): Promise<void>
{
  try
  {
    let status = await HttpService.updateCache();
    if (!status)
    {
      alert("Sikertelen cachelés!");
      return;
    }
  }
  catch(err)
  {
    let myError = err as Error;
    alert(myError.message);
  }
}

function listenForTableModal(): void
{
  const form: HTMLFormElement | null = document.querySelector("#table-form-modal");

  if (!form)
    throw new Error("The form was not found!");

  form.addEventListener("submit", (ev: SubmitEvent) =>
  {
    ev.preventDefault();

    const data: FormData = new FormData(form);
    let tableName = data.get("tableName")!.toString();
    let teams: string[] = [];

    Array.from(data.entries()).forEach(([key, value]) =>
    {
      if (key.includes("csapat_id"))
        teams.push(value.toString());
    });

    TableManager.addTable(tableName, teams);

    form.reset();

  });
}

function listenForTableChange(): void
{
  window.addEventListener("tableschanged", () =>
  {
    
  });
}

function createTableModalTeams(): void
{
  const divModalTeam: HTMLElement | null = myApp!.querySelector("#team-body");

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

  const parent: HTMLElement = document.createElement("div");
  parent.className = "form-check";

  const teamIDValue: string = team.id!.toString();

  const checkbox: HTMLInputElement = document.createElement("input");
  const checkboxID: string = `csapat_id_${teamIDValue}`;
  checkbox.className = "form-check-input";
  checkbox.type = "checkbox";
  checkbox.id = checkboxID;
  checkbox.name = checkboxID;
  checkbox.value = teamIDValue;

  parent.appendChild(checkbox);

  const teamLabel: HTMLLabelElement = document.createElement("label");
  teamLabel.className = "form-check-label";
  teamLabel.setAttribute("for", checkboxID);
  teamLabel.innerText = team.name;

  parent.appendChild(teamLabel);

  return parent;
}