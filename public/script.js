import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  increment,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAn5VWDMoNKj91PWjJ66MrXYCxnTFCOX5o",
  authDomain: "interactive-webcomic.firebaseapp.com",
  projectId: "interactive-webcomic",
  storageBucket: "interactive-webcomic.firebasestorage.app",
  messagingSenderId: "200808841305",
  appId: "1:200808841305:web:54b97c5f806002a2deb148",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let unsubScribeFromPageComments = null;
const comments = document.getElementById("comments");

function loadComments() {
  if (unsubScribeFromPageComments) unsubScribeFromPageComments();

  const getComments = query(
    collection(db, "comments"),
    where("pageIndex", "==", currentPageIndex),
    orderBy("timestamp", "desc"),
  );

  unsubScribeFromPageComments = onSnapshot(getComments, (snapshot) => {
    comments.innerHTML = "";
    if (snapshot.size < 1) {
      const emptyComment = document.createElement("p");
      emptyComment.classList.add("readable-text");
      emptyComment.textContent = "Be the first to add a thought";
      comments.appendChild(emptyComment);
    } else {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const commentContainer = document.createElement("div");
        commentContainer.classList.add("comment-container");
        const commentInfo = document.createElement("div");
        commentInfo.classList.add("comment-info");
        const commentAuthor = document.createElement("p");
        commentAuthor.classList.add("comment-author");
        commentAuthor.textContent = data.authorName;
        const commentDate = document.createElement("p");
        commentDate.classList.add("comment-date");
        commentDate.textContent = formatCommentDate(data.timestamp);
        const commentContent = document.createElement("p");
        commentContent.classList.add("comment-content");
        commentContent.textContent = data.content;

        commentInfo.appendChild(commentAuthor);
        commentInfo.appendChild(commentDate);
        commentContainer.appendChild(commentInfo);
        commentContainer.appendChild(commentContent);
        comments.appendChild(commentContainer);
      });
    }
  });
}

function formatCommentDate(date) {
  const objectDate = new Date(date);
  const day = objectDate.toLocaleDateString("default", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const time = objectDate.toLocaleString("default", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${time}`;
}

const commentAuthorInput = document.getElementById("comment-author-input");
const commentContentInput = document.getElementById("comment-content-input");
const commentSubmitButton = document.getElementById("comment-submit-button");

commentSubmitButton.addEventListener("click", async () => {
  const authorName = commentAuthorInput.value.trim();
  const content = commentContentInput.value.trim();
  if (!authorName || !content) return;

  commentSubmitButton.disabled = true;
  commentAuthorInput.value = "";
  commentContentInput.value = "";
  try {
    await addDoc(collection(db, "comments"), {
      pageIndex: currentPageIndex,
      authorName: authorName,
      content: content,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to add comment: ", error);
  } finally {
    commentSubmitButton.disabled = false;
  }
});

let currentVoteCounts = {};
let highestVoteCount = 0;
let unsubscribeVoting = null;

function updateVoting() {
  if (unsubscribeVoting) {
    unsubscribeVoting();
    unsubscribeVoting = null;
  }

  selectedVotingOptionIndex = null;
  currentVoteCounts = {};

  if (pages[currentPageIndex].votingOptions.length < 1) {
    votingContainer.classList.add("disabled");
    unsubscribeVoteCountdown?.();
    clearInterval(votingTimerInterval);
    return;
  }

  votingContainer.classList.remove("disabled");
  displayVotes();
  updateVotingCountdown();

  unsubscribeVoting = onSnapshot(
    collection(db, "pageVotes", String(currentPageIndex), "options"),
    (snapshot) => {
      currentVoteCounts = {};
      snapshot.forEach((d) => {
        currentVoteCounts[d.id] = d.data().votes;
      });
      let voteCounts = pages[currentPageIndex].votingOptions.map(
        (optionText, i) => currentVoteCounts[i] ?? 0,
      );
      highestVoteCount = Math.max(...voteCounts, 0);
      displayVotes();
    },
  );
}

let localTimeOffset = 0;

async function syncTime() {
  try {
    const localBefore = Date.now();
    const serverResult = await fetch(`/?_=${localBefore}`, {
      method: "HEAD",
      cache: "no-store",
    });
    const localAfter = Date.now();
    const header = serverResult.headers.get("Date");
    if (!header) return;
    const serverNow = new Date(header).getTime();
    if (Number.isNaN(serverNow)) return;
    localTimeOffset =
      serverNow - (localBefore + (localAfter - localBefore) / 2);
  } catch (error) {
    console.error("Wasn't able to sync time: ", error);
  }
}

const getServerNow = () => Date.now() + localTimeOffset;

let unsubscribeVoteCountdown = null;
let votingTimerInterval = null;
const votingTimerText = document.querySelector(".voting-timer");
let voteAvailable = false;
const votingContainer = document.getElementById("voting-container");
const votingOptions = document.getElementById("voting-options");
let selectedVotingOptionIndex = null;
const voteSubmitButton = document.getElementById("vote-submit-button");

function updateVotingCountdown() {
  if (unsubscribeVoteCountdown) unsubscribeVoteCountdown();
  clearInterval(votingTimerInterval);
  voteAvailable = false;
  voteSubmitButton.disabled = true;
  votingTimerText.textContent = "";

  unsubscribeVoteCountdown = onSnapshot(
    doc(db, "pageVotes", String(currentPageIndex)),
    (snap) => {
      clearInterval(votingTimerInterval);
      const endsAt = snap.data()?.votingEndTime;
      if (!endsAt?.toMillis) {
        voteAvailable = false;
        voteSubmitButton.disabled = true;
        votingTimerText.textContent = "Vote isn't properly configured!";
        return;
      }
      startVotingTimer(snap.data().votingEndTime.toMillis());
    },
  );
}

function startVotingTimer(endTime) {
  if (endTime > getServerNow()) {
    voteAvailable = true;
    voteSubmitButton.disabled = false;
  } else {
    voteAvailable = false;
    voteSubmitButton.disabled = true;
  }
  function tick() {
    const timeRemaining = endTime - getServerNow();
    if (timeRemaining <= 0) {
      clearInterval(votingTimerInterval);
      onVotingClosed();
      return;
    }
    const s = Math.floor(timeRemaining / 1000);
    const h = Math.floor(s / 3600);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    votingTimerText.textContent = `Time until vote is over: ${h}:${m}:${sec}`;
  }
  tick();
  votingTimerInterval = setInterval(tick, 1000);
}

function onVotingClosed() {
  voteAvailable = false;
  votingTimerText.textContent = "This vote has finished";
  voteSubmitButton.disabled = true;
  displayVotes();
}

function displayVotes() {
  votingOptions.innerHTML = "";

  pages[currentPageIndex].votingOptions.forEach((option, index) => {
    const optionUI = document.createElement("div");
    const optionText = document.createElement("div");
    optionText.classList.add("horizontal");
    optionText.classList.add("horizontal-aligned");
    optionText.classList.add("med-gap");
    const lines = option.split(/\n\n+/);
    const optionDescription = document.createElement("p");
    optionDescription.classList.add("option-description");
    optionDescription.textContent = lines[0];
    optionText.appendChild(optionDescription);

    if (lines.length > 1) {
      const effectList = document.createElement("ul");
      effectList.classList.add("option-effects");
      for (let i = 1; i < lines.length; i++) {
        const effect = document.createElement("li");
        effect.textContent = lines[i];
        effectList.appendChild(effect);
      }
      optionText.appendChild(effectList);
    }
    optionUI.appendChild(optionText);
    const voteCount = document.createElement("p");
    voteCount.textContent = `${currentVoteCounts[index] ?? 0} votes`;
    optionUI.appendChild(voteCount);
    optionUI.classList.add("voting-option");
    if (index === selectedVotingOptionIndex) {
      optionUI.classList.add("selected-voting-option");
    }

    if (!voteAvailable) {
      console.log(currentVoteCounts[index]);
      console.log(highestVoteCount);

      if (currentVoteCounts[index] === highestVoteCount) {
        optionUI.classList.add("winner");
      } else {
        optionUI.classList.add("loser");
      }
    }
    optionUI.addEventListener("click", () => {
      if (!voteAvailable) return;
      selectedVotingOptionIndex = index;
      displayVotes();
    });
    votingOptions.appendChild(optionUI);
  });
}

voteSubmitButton.addEventListener("click", async () => {
  if (selectedVotingOptionIndex === null || !voteAvailable) return;

  voteSubmitButton.disabled = true;
  try {
    await setDoc(
      doc(
        db,
        "pageVotes",
        String(currentPageIndex),
        "options",
        String(selectedVotingOptionIndex),
      ),
      { votes: increment(1) },
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to add vote: ", error);
  } finally {
    voteSubmitButton.disabled = !voteAvailable;
  }
});

let pages = [];
var currentPageIndex = 0;

const comicImage = document.querySelector(".comic-image");
const informationDate = document.getElementById("information-date");
const informationDescription = document.getElementById(
  "information-description",
);
const pageTextContainer = document.querySelector(".description-container");
const pageText = document.querySelector(".description");
const navButtonContainer = document.querySelectorAll(
  ".nav-button-container",
)[0];
const bannerImg = document.querySelector(".banner-img");

// site navigation
const comicView = document.getElementById("comic-view");
const aboutView = document.getElementById("about-view");
const archiveView = document.getElementById("archive-view");

document.getElementById("home-button").addEventListener("click", () => {
  navButtonContainer.classList.remove("disabled");
  comicView.classList.remove("disabled");
  aboutView.classList.add("disabled");
  archiveView.classList.add("disabled");
  navigateToPage(0);
});
document.getElementById("about-button").addEventListener("click", () => {
  navButtonContainer.classList.add("disabled");
  comicView.classList.add("disabled");
  aboutView.classList.remove("disabled");
  archiveView.classList.add("disabled");
});
document.getElementById("archive-button").addEventListener("click", () => {
  navButtonContainer.classList.add("disabled");
  comicView.classList.add("disabled");
  aboutView.classList.add("disabled");
  archiveView.classList.remove("disabled");
});

// page nav buttons
const firstButtons = document.querySelectorAll(".first");
const prevButtons = document.querySelectorAll(".prev");
const nextButtons = document.querySelectorAll(".next");
const latestButtons = document.querySelectorAll(".latest");

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

  updateDescription();
  updateVoting();
  updateNavButtons();
  setColorTheme(pages[currentPageIndex].siteColorTheme);
  loadComments();
  window.scrollTo(window.innerWidth / 2, 0);
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

function updateDescription() {
  informationDate.textContent = formatDescriptionDate(
    pages[currentPageIndex].dateUploaded,
  );
  informationDescription.textContent = pages[currentPageIndex].creatorComment;
  if (pages[currentPageIndex].description == "") {
    pageTextContainer.classList.add("disabled");
    return;
  }
  pageTextContainer.classList.remove("disabled");
  pageText.textContent = pages[currentPageIndex].description;
}

function formatDescriptionDate(date) {
  const formattedDatetime = new Date(date);
  return formattedDatetime.toLocaleString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function setColorTheme(themeKey) {
  if (themeKey === "real") {
    if (mobileLayoutMode) bannerImg.src = "images/banner-overworld-mobile.png";
    else bannerImg.src = "images/banner-overworld-web.png";

    document.documentElement.style.setProperty("--dark-bg-color", "#2d2607");
    document.documentElement.style.setProperty("--light-bg-color", "#645444");
    document.documentElement.style.setProperty(
      "--dark-secondary-color",
      "#544d37",
    );
    document.documentElement.style.setProperty(
      "--header-text-color",
      "#ebbc9e",
    );
    document.documentElement.style.setProperty("--faint-text-color", "#99945c");
    document.documentElement.style.setProperty(
      "--dimmed-text-color",
      "#9a8678",
    );
    document.documentElement.style.setProperty("--light-text-color", "#e1dcc9");
    document.documentElement.style.setProperty(
      "--inverse-text-color",
      "#ff6900",
    );
  } else if (themeKey === "dream") {
    if (mobileLayoutMode) bannerImg.src = "images/banner-dreamworld-mobile.png";
    else bannerImg.src = "images/banner-dreamworld-web.png";

    document.documentElement.style.setProperty("--dark-bg-color", "#2d0e03");
    document.documentElement.style.setProperty("--light-bg-color", "#5c352b");
    document.documentElement.style.setProperty(
      "--dark-secondary-color",
      "#5e4549",
    );
    document.documentElement.style.setProperty(
      "--header-text-color",
      "#ebbc9e",
    );
    document.documentElement.style.setProperty("--faint-text-color", "#b49097");
    document.documentElement.style.setProperty(
      "--dimmed-text-color",
      "#9a8678",
    );
    document.documentElement.style.setProperty("--light-text-color", "#e1dcc9");
    document.documentElement.style.setProperty(
      "--inverse-text-color",
      "#8a8e55",
    );
  } else {
    throw new Error(
      `Tried to use themeKey: ${themeKey}, no specified theme for that key`,
    );
  }
}

// setting up archive page
function setUpArchive() {
  const archiveParent = document.getElementById("archive-parent");
  for (let i = pages.length - 1; i >= 0; i--) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("horizontal");
    newDiv.classList.add("centered");
    newDiv.classList.add("med-gap");
    newDiv.classList.add("archive-button");

    const newDateText = document.createElement("p");
    newDateText.textContent = pages[i].dateUploaded;
    newDateText.classList.add("archive-date-text");

    const newPageText = document.createElement("p");
    newPageText.textContent = `${i < 10 ? 0 : ""}${i + 1}`;
    newPageText.classList.add("archive-page-text");

    newDiv.addEventListener("click", () => {
      navButtonContainer.classList.remove("disabled");
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

const mobileQuery = window.matchMedia("(max-width: 840px)");
let mobileLayoutMode = mobileQuery.matches;

function updateLayout() {
  mobileLayoutMode = mobileQuery.matches;

  const aboutContainers = document.querySelectorAll(".about-container");
  const aboutHeaders = document.querySelectorAll(".about-header");
  if (mobileLayoutMode) {
    aboutContainers.forEach((container) => {
      container.classList.remove("horizontal");
      container.classList.remove("med-gap");
      container.classList.add("small-gap");
      container.parentElement.classList.remove("small-gap");
      container.parentElement.classList.add("med-gap");
    });
    aboutHeaders.forEach((header) => {
      if (header.classList.contains("mobile-only")) {
        header.parentElement.classList.remove("disabled");
      } else {
        header.classList.add("disabled");
      }
    });
  } else {
    aboutContainers.forEach((container) => {
      container.classList.add("horizontal");
      container.classList.remove("small-gap");
      container.classList.add("med-gap");
      container.parentElement.classList.remove("med-gap");
      container.parentElement.classList.add("small-gap");
    });
    aboutHeaders.forEach((header) => {
      if (header.classList.contains("mobile-only")) {
        header.parentElement.classList.add("disabled");
      } else {
        header.classList.remove("disabled");
      }
    });
  }
}

fetch("pages.json")
  .then((response) => response.json())
  .then((data) => {
    pages = data;
    syncTime();
    setUpArchive();
    navigateToPage(0);
  })
  .catch((error) => {
    console.error("Failed to load pages.json:", error);
  });

mobileQuery.addEventListener("change", () => {
  updateLayout();
  setColorTheme(pages[currentPageIndex].siteColorTheme);
});

updateLayout();
