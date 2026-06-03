import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import './styles/style.css'

import { HttpService } from './api/http.service'

import SpinnerHTML from './components/spinnerLoader.html?raw';

type ViewInit = (appDiv: HTMLElement, callback: Function) => Function;
type ViewReturn = {status: boolean, cleanUp: Function | null}

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
  const myApp: HTMLElement | null = document.querySelector("#app");
  
  if (!myApp)
    throw new Error("Could not find #app div element!");
  myApp.className = "bg-light h-100";
  await loadView('main', myApp);
}

async function loadView(viewName: string, parent: HTMLElement): Promise<ViewReturn>
{

  const loadViewObject: ViewReturn = {
    status: false,
    cleanUp: null
  }

  if (!myApp)
    return loadViewObject;

  try
  {

    parent.innerHTML = SpinnerHTML;

    const htmlModule = await import(`./views/${viewName}/${viewName}.html?raw`);
    const htmlContent = htmlModule.default;

    parent.innerHTML = htmlContent;

    const scriptModule = await import(`./views/${viewName}/${viewName}.ts`);

    const initFunction = scriptModule.init as ViewInit;
    if (initFunction)
    {
      const cleanUp = await initFunction(myApp, loadView);
      loadViewObject.cleanUp = cleanUp;
    }
    else
      throw new Error(`A ${viewName}.ts nem exportál egy init(myApp: HTMLElement, callback: Function) function-t!`);

    loadViewObject.status = true;
    return loadViewObject;
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
    return loadViewObject;
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

var consoleVerbose = false;

var console = (function(oldCons){
    return {
        log: function(...data: any[]){
          if(consoleVerbose) oldCons.log(...data);  
        },
        info: function (...data: any[]) {
            if(consoleVerbose) oldCons.info(...data);
        },
        warn: function (...data: any[]) {
            if(consoleVerbose) oldCons.warn(...data);
        },
        error: function (...data: any[]) {
            oldCons.error(...data);
        },
        debug: function(...data: any[]){
          oldCons.log(...data);  
        }
    } as Console;
}(window.console));

window.console = console;