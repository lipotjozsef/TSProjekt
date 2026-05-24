import { TableManager } from '../../storage/tablemanager.service.ts'
import { HttpService } from '../../api/http.service'

import * as SimulationUtils from './utils/simulationForm.ts';
import * as tabDeletionUtils from './utils/tabDeletion.ts';
import * as HTMLUtils from './utils/htmlUtils.ts';

import { createTeamInput } from './utils/modalTeamInput.ts';
import { renderTableView } from './utils/tabChange.ts';

import tabCreatorModal from './HTMLcode/tabCreatorModal.html?raw';

let application: HTMLElement;

export function init(parent: HTMLElement, _: Function)
{
  application = parent;
  listenerForTableChange();

  TableManager.loadStorage();
  loadTableModal();

  createTeamsInputsForModal();

  listenersForDetailModal();
  listenersForTableModal();
}

function loadTableModal()
{
    const modalTitle = application.querySelector<HTMLElement>(".modal-title");
    const modalBody = application.querySelector<HTMLElement>(".modal-body");

    if (!modalTitle || !modalBody)
        return;

    modalTitle.innerText = "Tabella Kreáló"
    modalTitle.classList = "fw-bold text-decoration-underline p-1";
    modalBody.innerHTML = tabCreatorModal;
}

function listenersForTableModal(): void
{
  const form: HTMLFormElement | null = document.querySelector("#form-modal");

  if (!form)
    throw new Error("A form element nem található, #form-modal!");

  const cancelButton: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#btn-modal-cancel");
  cancelButton?.addEventListener("click", () =>  { form.reset(); });

  form.addEventListener("submit", async (ev: SubmitEvent) =>
  {
    ev.preventDefault();

    const formData = SimulationUtils.extractSimulationData(form);
    if (!SimulationUtils.validateTableForm(formData)) return;

    try
    {
      await SimulationUtils.createAndSimulateTable(formData);
      HTMLUtils.closeModal(application, "btn-modal-submit", "modal");
      form.reset();
    }
    catch (error)
    {
      console.error("Hiba történt a szimuláció vagy mentése során: ", error);
    }
  });
}

function listenersForDetailModal()
{
  const deleteButton = application.querySelector<HTMLButtonElement>("#btn-detail-delete");
  const tableHiddenInput = application.querySelector<HTMLInputElement>("#view-table-id");

  if (!deleteButton || !tableHiddenInput)
    return;

  deleteButton.addEventListener("click", async () =>
  {
    if (!confirm('Biztosan végleg törli ezt a tabellát?')) return;

    const tableID = Number.parseInt(tableHiddenInput.value, 10);
    const tableData = TableManager.getTable(tableID);
    
    if (tableData) {
      if (tableData.initialSnapshot)
      {
        tabDeletionUtils.rollBackTabData(tableData);
        await tabDeletionUtils.rollbackOnServer(tableData);
        
        TableManager.deleteTable(tableID);
        TableManager.saveStorage();
      }
    }

    tableHiddenInput.value = '-1';
  });
}

function listenerForTableChange(): void
{
  const tableContainer = document.querySelector<HTMLElement>("#table-container");
  if (!tableContainer)
    return;

  window.addEventListener("tableschanged", () => renderTableView(tableContainer, application));
}

function createTeamsInputsForModal(): void
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

