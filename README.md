```
.------------------------------------------.
|                                          |
|        _   _     _      _   _            |
|   __ _| |_| |__ | | ___| |_(_) ___ __ _  |
|  / _` | __| '_ \| |/ _ \ __| |/ __/ _` | |
| | (_| | |_| | | | |  __/ |_| | (_| (_| | |
|  \__,_|\__|_| |_|_|\___|\__|_|\___\__,_| |
|                                          |
'------------------------------------------'
```

# Sport Manager Simulator

Egy modern, webalapú sportmenedzser szimulációs alkalmazás, amely lehetővé teszi a felhasználók számára saját sportegyesületek, csapatok és játékosok menedzselését, valamint egy egyszerűsített bajnoki tabella szimuláció futtatását. A projekt célja egy könnyen kezelhető, reszponzív felület biztosítása a sportszeretők és menedzser-játékok kedvelői számára.

## Használt technológiák felsorolása

* **Vite** – Gyors és modern frontend felépítő eszköz (build tool)
* **TypeScript** – Típusbiztos JavaScript a megbízhatóbb és tisztább kódért
* **Bootstrap** – Reszponzív, modern CSS keretrendszer a letisztult felhasználói felületért
* **JSON-Server** – npm packeage, Gyors és könnyen konfigurálható REST API szimuláció a háttéradatok (mock adatok) tárolására

## Telepítési és futtatási lépések

A projekt futtatásához szükség van a **Node.js** környezetre. Kövesd az alábbi lépéseket a lokális indításhoz:

1.  **Klónozd a tárolót (repository) és lépj be a mappába:**
    ```bash
    git clone https://github.com/lipotjozsef/TSProjekt.git
    cd TSProjekt
    ```

2.  **Telepítsd a szükséges függőségeket:**
    ```bash
    npm i
    ```

3.  **Indítsd el a környezetet:**
    *Megjegyzés: JSON-server és Vite egy consoleban indul!*
    ```bash
    npm run dev
    ```

5.  **Nyisd meg a böngészőben:**
    A terminálban megjelenő linken (alapértelmezetten `http://localhost:5173`) érheted el az alkalmazást.

## Főbb funkciók ismertetése

* **Játékosok kezelése (CRUD):**
    * **Létrehozás:** Új igazolások, játékosok hozzáadása a rendszerhez (név, pozíció, ügyességi szint megadásával).
    * **Módosítás:** Meglévő játékosok statisztikáinak, személyes adatainak vagy státuszának frissítése.
    * **Törlés:** Játékosok eltávolítása, például visszavonulás vagy szerződésbontás esetén.

* **Csapatok kezelése (CRUD):**
    * **Létrehozás:** Új klubok vagy franchise-ok alapítása (csapatnév).
    * **Módosítás:** Csapatnevek, klubadatok szerkesztése.
    * **Törlés:** Csapatok véglegen eltávolítása a bajnokságból.

* **Tabella szimuláció:**
    * Szimpla, egyszerűsített algoritmus.
    * A csapatok egymás elleni mérkőzéseinek eredményei alapján pontokat (győzelem, döntetlen, vereség) generál.
    * A mérkőzések után a rendszer automatikusan frissíti és sorba rendezi a bajnoki tabellát a szerzett pontok és gólkülönbségek alapján.

# Csapattagok neve és GitHub profil linkje
- [Lipót József Zoltán](https://github.com/lipotjozsef)
- [Pintér Gábor](https://github.com/PinterGabor7)
- [Pop Dávid Tibor](https://github.com/PopDavid)