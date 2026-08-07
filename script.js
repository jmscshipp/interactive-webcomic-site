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
  if (currentPageIndex === 0) {
    firstButtons.forEach((button) => {
      button.disabled = true;
    });
    prevButtons.forEach((button) => {
      button.disabled = true;
    });

    if (pageFiles.length > 1) {
      nextButtons.forEach((button) => {
        button.disabled = false;
      });
      latestButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  } else if (currentPageIndex === pageFiles.length - 1) {
    firstButtons.forEach((button) => {
      button.disabled = false;
    });
    prevButtons.forEach((button) => {
      button.disabled = false;
    });
    nextButtons.forEach((button) => {
      button.disabled = true;
    });
    latestButtons.forEach((button) => {
      button.disabled = true;
    });
  } else {
    firstButtons.forEach((button) => {
      button.disabled = false;
    });
    prevButtons.forEach((button) => {
      button.disabled = false;
    });
    nextButtons.forEach((button) => {
      button.disabled = false;
    });
    latestButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

navigateToPage(0);
