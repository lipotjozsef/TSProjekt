import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

import { HttpService } from './api/http.service'

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
  myApp.className =  "bg-light";
  
  await loadView('main', myApp);
}

async function loadView(viewName: string, parent: HTMLElement): Promise<void>
{
  if (!myApp)
    return;

  try
  {
    const htmlModule = await import(`./views/${viewName}/${viewName}.html?raw`);
    const htmlContent = htmlModule.default;

    parent.innerHTML = htmlContent;

    const scriptModule = await import(`./views/${viewName}/${viewName}.ts`);

    await scriptModule.init(myApp, loadView);
  }
  catch (error)
  {
    console.error('A nézetet nem sikerült betölteni: ', viewName, error);
    myApp.innerHTML = '<div class="alert alert-danger">Az oldal betöltése sikertelen volt.</div>';
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