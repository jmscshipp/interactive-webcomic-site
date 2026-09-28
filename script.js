import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.18.0//firebase-firestore.js";

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

function formatDescriptionDate(date) {
  const formattedDatetime = new Date(date);
  return formattedDatetime.toLocaleString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

const comicImage = document.querySelector(".comic-image");
const informationDate = document.getElementById("information-date");
const informationDescription = document.getElementById(
  "information-description",
);
const pageTextContainer = document.querySelector(".page-text-container");
const pageText = document.querySelector(".page-text");

function navigateToPage(index) {
  currentPageIndex = index;
  comicImage.src = "pages/" + pages[currentPageIndex].fileName;
  console.log(pages[currentPageIndex].description);
  if (pages[currentPageIndex].description) {
    pageTextContainer.classList.remove("disabled");
    pageText.textContent = pages[currentPageIndex].description;
  } else {
    pageTextContainer.classList.add("disabled");
  }
  informationDate.textContent = formatDescriptionDate(
    pages[currentPageIndex].dateUploaded,
  );
  informationDescription.textContent = pages[currentPageIndex].creatorComment;
  updateNavButtons();
  loadComments();
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
