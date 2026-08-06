var currentPageIndex = 0;

const firstButtons = document.querySelectorAll(".first");
const prevButtons = document.querySelectorAll(".prev");
const nextButtons = document.querySelectorAll(".next");
const latestButtons = document.querySelectorAll(".latest");

firstButtons.forEach((button) => {
  button.addEventListener("click", () => {});
});

function updateNavButtons() {
  if (currentPageIndex === 0) {
    firstButtons.forEach((button) => {
      button.disabled = true;
    });
    prevButtons.forEach((button) => {
      button.disabled = true;
    });
  }

  // once I have a way to load the pages, actually count the page number
  const totalPages = 4;
  if (currentPageIndex === totalPages - 1) {
    nextButtons.forEach((button) => {
      button.disabled = true;
    });
    latestButtons.forEach((button) => {
      button.disabled = true;
    });
  }
}
