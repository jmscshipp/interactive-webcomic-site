const pageFiles = ["01.png", "02.png", "03.png", "04.png"];

var currentPageIndex = 0;

// nav buttons
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
    navigateToPage(pageFiles.length - 1);
  });
});

function navigateToPage(index) {
  currentPageIndex = index;
  comicImage.src = "pages/" + pageFiles[currentPageIndex];
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
    button.disabled = currentPageIndex === pageFiles.length - 1;
  });
  latestButtons.forEach((button) => {
    button.disabled = currentPageIndex === pageFiles.length - 1;
  });
}

navigateToPage(0);
