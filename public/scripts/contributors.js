const ulElement = document.querySelector("#link-list");

const contributors = [
    ["lipotjozsef", "https://github.com/lipotjozsef"],
    ["PinterGabor7", "https://github.com/PinterGabor7"],
    ["PopDavid", "https://github.com/PopDavid"]
]


document.body.onload = main;

function main() {
    fillUpLinks();
}

function fillUpLinks() {
    if (!ulElement) return;
    contributors.forEach(([name, link], index) => {
        const newItemElement = document.createElement("li");

        let showIndex = index + 1;
        let linkHTML = `<a href="${link}" target="_blank">\t${link}</a>`;
        newItemElement.innerHTML = `[${showIndex}] ${name}\t- ${linkHTML}`;

        ulElement.appendChild(newItemElement);
    })
}