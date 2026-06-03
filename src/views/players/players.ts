import { HttpService, CategoryID } from '../../api/http.service'
import { EPosition } from '../../types/EPosition';
import * as HttpInterfaces from '../../types/TSTypes'

import playerModal from "./playerModal.html?raw"

let application: HTMLElement;
let clickedPlayer: any;

export function init(parent: HTMLElement, _: Function): Function {
    application = parent;

    loadPlayerModal();
    displayPlayers();

    const handler = () => {
        displayPlayers();
    }
    window.addEventListener("cachechanged", handler);

    listenForUpdatePlayer();

    return () => {
        window.removeEventListener("cachechanged", handler);
    }
}


function loadPlayerModal()
{
    const modalTitle = application.querySelector<HTMLElement>(".modal-title");
    const modalBody = application.querySelector<HTMLElement>(".modal-body");

    if (!modalTitle || !modalBody)
        return;

    modalTitle.innerText = "Játékos Kreáló"
    modalTitle.className = "modal-title fw-bold text-decoration-underline p-1";
    modalBody.innerHTML = playerModal;

    let form = application.querySelector<HTMLFormElement>("#form-modal")!;

    form!.addEventListener("submit", async (e) => {
        e.preventDefault();
        let data = new FormData(form);
        let data_entries = Array.from(data.entries());
        console.log(data_entries);

        let newPlayer: any = { ...HttpService.getPlayers[0]};

        delete (newPlayer as any).id;
        newPlayer.name = data_entries[0][1].toString();
        newPlayer.teamID = data_entries[1][1].toString();
        newPlayer.goals = Number(data_entries[2][1].toString());
        newPlayer.matches = Number(data_entries[3][1].toString());
        newPlayer.skill = Number(data_entries[4][1].toString());
        Object.entries(EPosition).forEach(pos => {
            if(pos[0].toString() == data_entries[5][1].toString()){
                newPlayer.position = pos[1];
                
            }
        });

        form.reset();
        await HttpService.submitEntry(newPlayer, CategoryID.IPlayers, "players");
        console.log(newPlayer);
        
    });

}

async function displayPlayers() {

    const tabContent = application.querySelector<HTMLElement>(".tab-content");
    const table = application.querySelector<HTMLTableElement>("#playersTable");

    if (!tabContent || !table)
        return;

    const tbody = table.tBodies[0];

    tbody.innerHTML = '';
    let currID = 1;

    HttpService.getPlayers.forEach(p => {

    const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${currID}</td>
            <td>${p.name}</td>
            <td>${getTeamById(p.teamID)}</td>
            <td>${p.position}</td>
            <td>
            <button class = 'btn btn-update' data-id=${p.id} data-bs-toggle='modal' data-bs-target='#updateModal'>Szerkesztés</button>
            <button class = 'btn btn-delete' data-id=${p.id}>Törlés</button>
            </td>
        `;
        tbody.appendChild(tr);
        currID += 1;
    });

    application.querySelector("#playersTable")?.addEventListener("click", deletePlayerClickFunction);


}   

async function deletePlayerClickFunction(e: Event)
{
    let btn = e.target as HTMLButtonElement;
    let id = btn.dataset.id!;
    if (btn.classList.contains("btn-delete")) {
        if(confirm(`Biztosan törölni szeretnéd a kiválasztott játékost?`)){
            console.log(await HttpService.deleteEntry(id, CategoryID.IPlayers, "players"));
        }

    }
    else if(btn.classList.contains("btn-update")){
        clickedPlayer = getPlayerById(id);
        //document.querySelector("#updatename")!.ariaValueText = clickedPlayer!.name;
        
        (application.querySelector("#name") as HTMLInputElement).value = clickedPlayer!.name;
        (application.querySelector("#teamID") as HTMLInputElement).value = clickedPlayer!.teamID;
        (application.querySelector("#goals") as HTMLInputElement).value = clickedPlayer!.goals.toString();
        (application.querySelector("#matches") as HTMLInputElement).value = clickedPlayer!.matches.toString();
        (application.querySelector("#skill") as HTMLInputElement).value = clickedPlayer!.skill.toString();

        (Object.entries(EPosition)).forEach(pos => {
            if(pos[1] == clickedPlayer!.position){
                (application.querySelector(`#${pos[0]}`) as HTMLOptionElement).selected = true;
            }
        });    
        }
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
    let form = application.querySelector<HTMLFormElement>("#adatok");
    if (!form) {
        console.log("GATYA");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        
        let newPlayer: any = {...clickedPlayer!};
        let data_entries = Array.from(data.entries())
        
        newPlayer.name = data_entries[0][1].toString();
        newPlayer.teamID = data_entries[1][1].toString();
        newPlayer.goals = Number(data_entries[2][1].toString());
        newPlayer.matches = Number(data_entries[3][1].toString());
        newPlayer.skill = Number(data_entries[4][1].toString());
        Object.entries(EPosition).forEach(pos => {
            if(pos[0].toString() == data_entries[5][1].toString()){
                newPlayer.position = pos[1];
                
            }
        });
        await HttpService.updateEntry(clickedPlayer, newPlayer, newPlayer.id, CategoryID.IPlayers, "players");

        closeModal(application, "hidden-modal-close");
        form.reset();
    });
}

function closeModal(
  application: HTMLElement,
  submitButtonID: string
)
{
    const submitButton = application.querySelector<HTMLButtonElement>("#".concat(submitButtonID));
    if (!submitButton) return;
    submitButton.click();
}