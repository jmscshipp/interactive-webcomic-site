let pages = [];
var currentPageIndex = 0;

// site navigation
const comicView = document.getElementById("comic-view");
const aboutView = document.getElementById("about-view");
const archiveView = document.getElementById("archive-view");

document.getElementById("home-button").addEventListener("click", () => {
  comicView.classList.remove("disabled");
  aboutView.classList.add("disabled");
  archiveView.classList.add("disabled");
});
document.getElementById("about-button").addEventListener("click", () => {
  comicView.classList.add("disabled");
  aboutView.classList.remove("disabled");
  archiveView.classList.add("disabled");
});
document.getElementById("archive-button").addEventListener("click", () => {
  comicView.classList.add("disabled");
  aboutView.classList.add("disabled");
  archiveView.classList.remove("disabled");
});

// page nav buttons
const firstButtons = document.querySelectorAll(".first");
const prevButtons = document.querySelectorAll(".prev");
const nextButtons = document.querySelectorAll(".next");
const latestButtons = document.querySelectorAll(".latest");

const comicImage = document.querySelector(".comic-image");

firstButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigateToPage(0);
  });
});

prevButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigateToPage(currentPageIndex - 1);
  });
});

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigateToPage(currentPageIndex + 1);
  });
});

latestButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigateToPage(pages.length - 1);
  });
});

function navigateToPage(index) {
  currentPageIndex = index;
  comicImage.src = "pages/" + pages[currentPageIndex].fileName;
  updateNavButtons();
}

function updateNavButtons() {
  firstButtons.forEach((button) => {
    button.disabled = currentPageIndex === 0;
  });
  prevButtons.forEach((button) => {
    button.disabled = currentPageIndex === 0;
  });
  nextButtons.forEach((button) => {
    button.disabled = currentPageIndex === pages.length - 1;
  });
  latestButtons.forEach((button) => {
    button.disabled = currentPageIndex === pages.length - 1;
  });
}

// resizing central column based on comic page size
comicImage.addEventListener("load", updateColumnWidth);
window.addEventListener("resize", updateColumnWidth);

function updateColumnWidth() {
  const centralColumn = document.getElementById("central-column");
  centralColumn.style.width = `${comicImage.width}px`;
}

// setting up archive page
function setUpArchive() {
  const archiveParent = document.getElementById("archive-parent");
  for (let i = pages.length - 1; i >= 0; i--) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("center-horizontally");
    newDiv.classList.add("med-gap");
    newDiv.classList.add("archive-button");

    const newDateText = document.createElement("p");
    newDateText.textContent = pages[i].dateUploaded;
    newDateText.classList.add("archive-date-text");

    const newPageText = document.createElement("p");
    newPageText.textContent = `page ${i + 1}`;
    newPageText.classList.add("archive-page-text");

    newDiv.addEventListener("click", () => {
      comicView.classList.remove("disabled");
      aboutView.classList.add("disabled");
      archiveView.classList.add("disabled");
      navigateToPage(i);
    });
    newDiv.appendChild(newDateText);
    newDiv.appendChild(newPageText);
    archiveParent.appendChild(newDiv);
  }
}

fetch("pages.json")
  .then((response) => response.json())
  .then((data) => {
    pages = data;
    setUpArchive();
    navigateToPage(0);
  })
  .catch((error) => {
    console.error("Failed to load pages.json:", error);
  });
