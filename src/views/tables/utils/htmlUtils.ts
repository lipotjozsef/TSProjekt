export interface ElementOptions {
    name: string;
    parent: HTMLElement | null;
    id: string;
    className: string;
    innerHTML: string;
    innerText: string;
    attributes: object;
}

export function createElement<T extends HTMLElement>({ name, parent, id, innerHTML, innerText, className, attributes }: ElementOptions): T {
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

export function closeModal(
  application: HTMLElement,
  submitButtonID: string,
  dismissModalID: string
)
{
  const submitButton = application.querySelector<HTMLButtonElement>("#".concat(submitButtonID));
  if (!submitButton) return;

  submitButton.type = "button"; // so the submit event doesn't double fire!
  submitButton.setAttribute("data-bs-dismiss", dismissModalID);
  submitButton.click();
  submitButton.setAttribute("data-bs-dismiss", "");
  submitButton.type = "submit";
}