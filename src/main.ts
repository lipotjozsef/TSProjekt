import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

import { HttpService, CategoryID } from './api/http.service'
import type * as HttpInterfaces from './types/TSTypes';

document.body.onload = initialize;

function initialize(): void
{

  tryUpdateCache();

  

  const myApp: HTMLElement | null = document.querySelector("#app");

  if (!myApp)
    throw new Error("Could not find #app div element!");

  //myApp.className =  "bg-light";

  myApp!.innerHTML =
  `
    <div class="position-absolute top-50 start-50 translate-middle text-center w-75">
      <h2 class="fw-light">A weboldal még fejlesztés alatt áll...</h2>
      <h4 class="fst-italic">Térj vissza később!</h4>
    </div>
  `;
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