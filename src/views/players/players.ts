import { HttpService, CategoryID } from '../../api/http.service'
import { EPosition } from '../../types/EPosition';
import * as HttpInterfaces from '../../types/TSTypes'

import playerModal from "./playerModal.html?raw"

let application: HTMLElement;

export function init(parent: HTMLElement, _: Function) {
    application = parent;

    loadTableModal();
    displayPlayers();

    window.addEventListener("cachechanged", () => {
        displayPlayers();
    });

    listenForUpdatePlayer();
}


function loadTableModal()
{
    const modalTitle = application.querySelector<HTMLElement>(".modal-title");
    const modalBody = application.querySelector<HTMLElement>(".modal-body");

    if (!modalTitle || !modalBody)
        return;

    modalTitle.innerText = "Játékos Kreáló"
    modalBody.innerHTML = playerModal;
}

async function displayPlayers() {

    const tabContent = document.querySelector<HTMLElement>(".tab-content");
    const table = document.querySelector<HTMLTableElement>("#playersTable");

    if (!tabContent || !table)
        return;

    const tbody = table.tBodies[0];

    const teams = HttpService.getTeams;

    tbody.innerHTML = '';

    HttpService.getPlayers.forEach(p => {

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${p.id}</td>
    <td>${p.name}</td>
    <td>${getTeamById(p.teamID)}</td>
    <td>${p.position}</td>
    <td>
    <button class = 'btn btn-update' data-id=${p.id} data-bs-toggle='modal' data-bs-target='#updateModal'>Szerkesztés</button>
    <button class = 'btn btn-delete' data-id=${p.id}>Törlés</button>
    </td>
    `;
        tbody.appendChild(tr);
    });

    document.querySelector("#playersTable")?.addEventListener("click", async (e) => {
        let btn = e.target as HTMLButtonElement;
        let id = btn.dataset.id!;
        if (btn.classList.contains("btn-delete")) {
            if(confirm(`Biztosan törölni szeretnéd a(z) ${id}. játékost?`)){
                console.log(await HttpService.deleteEntry(id, CategoryID.IPlayers, "players"));
            }

        }else if(btn.classList.contains("btn-update")){
            let clickedPlayer = getPlayerById(id);
            
            //document.querySelector("#updatename")!.ariaValueText = clickedPlayer!.name;
            
            (document.querySelector("#name") as HTMLInputElement).value = clickedPlayer!.name;
            (document.querySelector("#teamID") as HTMLInputElement).value = clickedPlayer!.teamID;
            (document.querySelector("#goals") as HTMLInputElement).value = clickedPlayer!.goals.toString();
            (document.querySelector("#matches") as HTMLInputElement).value = clickedPlayer!.matches.toString();
            (document.querySelector("#skill") as HTMLInputElement).value = clickedPlayer!.skill.toString();

            (Object.entries(EPosition)).forEach(pos => {
                if(pos[1] == clickedPlayer!.position){
                    console.log(document.querySelector(`#${pos[0]}`) as HTMLOptionElement);
                    
                    (document.querySelector(`#${pos[0]}`) as HTMLOptionElement).selected = true;
                }
            });    
            
                        
            
        }
    });

}

function getTeamById(id: string): string {
    let return_val = "Nincs csapata";
    HttpService.getTeams.forEach(t => {
        if (t.id?.toString() == id) {
            return_val = t.name;
        }

    });
    return return_val;
}

function getPlayerById(id: string): HttpInterfaces.IPlayer | null {
    let player = null;
    HttpService.getPlayers.forEach(p => {
        if (p.id?.toString() == id) {
            player = p;
        }

    });

    return player;
}

function listenForUpdatePlayer() {
    let form = document.querySelector<HTMLFormElement>("#adatok");
    if (!form) {
        console.log("GATYA");

        return;
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(form);
        form.reset();
        console.log(Array.from(data.entries()));

    });
}

