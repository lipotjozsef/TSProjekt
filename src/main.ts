import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

import { HttpService, CategoryID } from './api/http.service'
import * as HttpInterfaces from './types/TSTypes';

document.body.onload = initialize;

async function initialize(): Promise<void>
{

  await tryUpdateCache();
  
  


  displayPlayers();





  const myApp: HTMLElement | null = document.querySelector("#app");
  
  if (!myApp)
    throw new Error("Could not find #app div element!");
  
  //myApp.className =  "bg-light";
  
  window.addEventListener("cachechanged", () => {
    displayPlayers();
  });

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

async function displayPlayers() {

  const playerHTML = (await import('../src/components/players.html?raw')).default;
  const myApp: HTMLElement | null = document.querySelector("#app");
  const tabContent = document.createElement("div");
  const table = document.createElement("table");
  table.id = "playersTable"
  const teams = HttpService.getTeams;

  myApp!.innerHTML = playerHTML;

  tabContent.classList += "tab-content";
  tabContent.id = "myTabContent";

  table.classList += `table`;
  table.innerHTML += `
    <thead>
        <th>#</th>
        <th>Név</th>
        <th>Csapata</th>
        <th>Pozíció</th>
        <th>Műveletek</th>
    </thead>
  `;
  HttpService.getPlayers.forEach(p => {
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${p.id}</td>
    <td>${p.name}</td>
    <td>${getTeamById(p.teamID)}</td>
    <td>${p.position}</td>
    <td>
    <button class = 'btn btn-update' data-id=${p.id}>Szerkesztés</button>
    <button class = 'btn btn-delete' data-id=${p.id}>Törlés</button>
    </td>
    `;
    table.appendChild(tr);
  });
  tabContent?.appendChild(table);
  myApp?.appendChild(tabContent);

  document.querySelector("#playersTable")?.addEventListener("click", async (e) => {
    let btn = e.target as HTMLButtonElement;
    let id = Number.parseInt(btn.dataset.id!);
    if(btn.classList.contains("btn-delete")){
      console.log(id);
      
      console.log(await HttpService.deleteEntry(id, CategoryID.IPlayers, "players"));
      
    }
  });

}

function getTeamById(id: string) : string{
  let return_val = "Nincs csapata";
  HttpService.getTeams.forEach(t => {
    if(t.id?.toString() == id){
      return_val = t.name;
    }
    
  });
  return return_val;
}
