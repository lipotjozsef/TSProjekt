import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import './styles/style.css'

import { HttpService } from './api/http.service'

type ViewInit = (appDiv: HTMLElement, callback: Function) => void;

const myApp: HTMLElement | null = document.querySelector("#app");

document.body.onload = initialize;

async function initialize(): Promise<void>
{
  if (window.location.pathname.includes("static"))
  {
    console.log("Statikus oldal! Dinamikus oldal betöltés kihagyása!");
    return;
  }

  await tryUpdateCache();

  if (!myApp)
    throw new Error("Could not find #app div element!");
  myApp.className = "bg-light h-100";
  
  await loadView('main', myApp);
}

async function loadView(viewName: string, parent: HTMLElement): Promise<boolean>
{
  if (!myApp)
    return false;

  try
  {
    const htmlModule = await import(`./views/${viewName}/${viewName}.html?raw`);
    const htmlContent = htmlModule.default;

    parent.innerHTML = htmlContent;

    const scriptModule = await import(`./views/${viewName}/${viewName}.ts`);

    const initFunction = scriptModule.init as ViewInit;
    if (initFunction)
      await initFunction(myApp, loadView);
    else
      throw new Error(`A ${viewName}.ts nem exportál egy init(myApp: HTMLElement, callback: Function) function-t!`);
    return true;
  }
  catch (error)
  {
    let err = error as Error;
    console.error('A nézetet nem sikerült betölteni: ', viewName, err);
    console.error(err.message);
    myApp.className = 'p-3';
    myApp.innerHTML = `
    <div class="alert alert-danger">Az oldal betöltése sikertelen volt. F12 több információért!</div>
    <button class="btn btn-outline-warning d-block mx-auto">Újratöltés</button>`;

    myApp.querySelector<HTMLButtonElement>(".btn")!.onclick = () => {location.reload()};
    return false;
  }
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