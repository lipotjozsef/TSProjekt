import { HttpService, CategoryID } from '../../api/http.service'
import * as HttpInterfaces from '../../types/TSTypes'

import teamModal from "./teamModal.html?raw"

let application: HTMLElement | null;

export function init(parent: HTMLElement, _: Function) {
    application = parent;

    if (!application)
        return () => {};

    loadTableModal();
    displayTeams();


    const handler = () => {
        displayTeams();
    }
    window.addEventListener("cachechanged", handler);

    listenForUpdateTeam();
    listenForCreateTeam();
 
    application.querySelector("#main-new-btn")?.addEventListener("click", createPlayerInputs);

    return () => {
        window.removeEventListener("cachechanged", handler);
        application!.querySelector("#main-new-btn")?.removeEventListener("click", createPlayerInputs);
        application = null;
    }
}

function createPlayerInputs()
{
    (application!.querySelector("#name") as HTMLInputElement).value = "";
    application!.querySelector("#players_new")!.innerHTML = ' '
    HttpService.getPlayers.forEach(p => {
        let checkbox = `<input type='checkbox' id='${p.id}_player_new' name='${p.id}_player_new'><label for='${p.id}_player_new'>${p.name}</label><br>`;
        application!.querySelector("#players_new")!.innerHTML += checkbox;
    });
}

function loadTableModal()
{
    const modalTitle = application!.querySelector<HTMLElement>(".modal-title");
    const modalBody = application!.querySelector<HTMLElement>(".modal-body");

    if (!modalTitle || !modalBody)
        return;

    modalTitle.innerText = "Csapat Kreáló"
    modalTitle.className = "modal-title fw-bold text-decoration-underline p-1";
    modalBody.innerHTML = teamModal;
}

async function displayTeams() {

    const tabContent = application!.querySelector<HTMLElement>(".tab-content");
    const table = application!.querySelector<HTMLTableElement>("#teamsTable");

    if (!tabContent || !table)
        return;

    const tbody = table.tBodies[0];

    tbody.innerHTML = '';
    let i = 1;
    HttpService.getTeams.forEach(t => {

        const tr = document.createElement("tr");
        tr.innerHTML = `
    <td>${i++}</td>
    <td>${t.name}</td>
    <td>${t.points}</td>
    <td>${getPlayerNumber(t.id)}</td>
    <td>
    <button class = 'btn btn-update' data-id=${t.id} data-bs-toggle='modal' data-bs-target='#updateModal'>Szerkesztés</button>
    <button class = 'btn btn-delete' data-id=${t.id}>Törlés</button>
    </td>
    `;
        tbody.appendChild(tr);
    });

    application!.querySelector("#teamsTable")?.addEventListener("click", async (e) => {
        let btn = e.target as HTMLButtonElement;
        let id = btn.dataset.id!;
        if (btn.classList.contains("btn-delete")) {
            console.log(id);

            console.log(await HttpService.deleteEntry(id, CategoryID.ITeams, "teams"));

        }
        if (btn.classList.contains("btn-update")) {
            let team : HttpInterfaces.ITeam;
            HttpService.getTeams.forEach(t => {
                if (t.id == btn.dataset.id) { 
                    team = t
                }
            });
            application!.querySelector<HTMLFormElement>("#adatok")!.dataset.id = team!.id!.toString();
            (application!.querySelector("#name") as HTMLInputElement).value = team!.name;
            application!.querySelector("#players")!.innerHTML = ' '
            HttpService.getPlayers.forEach(p => {
                let checkbox = `<input type='checkbox' id='${p.id}_player' name='${p.id}_player' ${p.teamID == team.id ? "checked" : ""}><label for='${p.id}_player'>${p.name}</label><br>`;
                application!.querySelector("#players")!.innerHTML += checkbox;
            })
        }
        // if (btn.classList.contains("btn-create")) {
    });
}

function getPlayerNumber(id: string | undefined): number {
    let return_val = 0;
    HttpService.getPlayers.forEach(t => {
        if (t.teamID?.toString() == id?.toString()) {
            return_val += 1;
        }

    });
    return return_val;
}

function listenForCreateTeam() {
    let form = application!.querySelector<HTMLFormElement>("#form-modal");
    if (!form) {
        console.log("GATYA");
        return;
    }
    console.log(form)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        console.log(data);
        form.reset();   
        
        if (data.get("name") === "") return;
        const new_team: HttpInterfaces.ITeam = {
            id: undefined,
            name: data.get("name")!.toString(),
            points: 0,
            played: 0,
            wins: 0,
            draws: 0,
            loses: 0,
            matchHistory: undefined
        }
        const created_team = await HttpService.submitEntry(new_team, CategoryID.ITeams, "teams");
        let players = HttpService.getPlayers;
        if (created_team == null) {
            console.log("Sikertelen csapat létrehozás");
            return;
        };
        players.forEach(async p => {
            if (data.get(`${p.id}_player_new`) && p.teamID != created_team.id) {
                const old_player = { ...p };
                const new_player = { ...p };
                new_player.teamID = created_team.id!;
                console.log(await HttpService.updateEntry(old_player, new_player, old_player.id!, CategoryID.IPlayers, "players") ? `sikeres játékos ${p.name} módosítás` : `sikertelen játékos ${p.name} módosítás`);
            }    
            else console.log(`Játékos ${p.id} nem lett módosítva, mert nincs kijelölve új csapat létrehozásakor`);
        })
        
    })
}

function listenForUpdateTeam() {
    let form = application!.querySelector<HTMLFormElement>("#adatok");
    if (!form) {
        console.log("GATYA");
        
        return;
    }
    form.addEventListener("submit", async (e) => {
        let teamID = form?.dataset.id;
        e.preventDefault();
        const data = new FormData(form);
        console.log(data);

        const team = HttpService.getTeams.find(t => t.id == teamID)
        if (!team) return;

        const old_team = { ...team };
        const new_team = { ...team };
        form.reset();   

        if (data.get("name") != "") new_team.name = data.get("name")!.toString(); 
        if (old_team.name != new_team.name) console.log(await HttpService.updateEntry(old_team, new_team, old_team.id!, CategoryID.ITeams, "teams") ? "sikeres név módosítás" : "sikertelen név módosítás");
        else console.log("Név nem változott", old_team.name, new_team.name);  

        let players = HttpService.getPlayers;
        players.forEach(async p => {
            if (data.get(`${p.id}_player`) && p.teamID != teamID) {
                const old_player = { ...p };
                const new_player = { ...p };
                new_player.teamID = teamID!;
                console.log(await HttpService.updateEntry(old_player, new_player, old_player.id!, CategoryID.IPlayers, "players") ? `sikeres játékos ${p.name} módosítás` : `sikertelen játékos ${p.name} módosítás`);
            }    
            else if (!data.get(`${p.id}_player`) && p.teamID == teamID) {
                const old_player = { ...p };
                const new_player = { ...p };
                new_player.teamID = "-1";
                console.log(await HttpService.updateEntry(old_player, new_player, old_player.id!, CategoryID.IPlayers, "players") ? `sikeres játékos ${p.name} módosítás` : `sikertelen játékos ${p.name} módosítás`);
            }
        })
        
    })
}

