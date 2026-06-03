import * as HttpInterfaces from '../../../types/TSTypes'

import * as HTMLUtils from './htmlUtils.ts';

export function createTeamInput(team: HttpInterfaces.ITeam): HTMLElement
{

  const parent = HTMLUtils.createElement<HTMLElement>(
    {
      name: "div",
      className: "form-check"
    } as HTMLUtils.ElementOptions
  )

  const teamIDValue: string = team.id!.toString();
  const checkboxID: string = `csapat_id_${teamIDValue}`;
  const checkboxName: string = "csapat_id";

  HTMLUtils.createElement<HTMLInputElement>(
    {
      name: "input",
      className: "form-check-input",
      id: checkboxID,
      attributes: {
        "type": "checkbox",
        "name": checkboxName,
        "value": teamIDValue
      },
      parent: parent
    } as HTMLUtils.ElementOptions
  )

  HTMLUtils.createElement<HTMLLabelElement>(
    {
      name: "label",
      className: "form-check-label",
      innerText: team.name,
      attributes:
      {
        "for": checkboxID
      },
      parent: parent
    } as HTMLUtils.ElementOptions
  )

  return parent;
}