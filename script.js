

const READING_GOAL = 25;
const STORAGE_KEY = "chapterAndVerseBooks";

// A few starter books :DD
const STARTER_BOOKS = [
  {
    id: "1",
    title: "The Night Circus",
    author: "Erin Morgenstern",
    genre: "Fantasy",
    description: "A magical competition unfolds within a mysterious circus that only opens at night.",
    totalPages: 387,
    currentPage: 120,
    status: "current",
    rating: 0
  },
  {
    id: "2",
    title: "Circe",
    author: "Madeline Miller",
    genre: "Mythology",
    description: "The story of the witch who turned Odysseus's men into swine, told from her point of view.",
    totalPages: 300,
    currentPage: 150,
    status: "current",
    rating: 0
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Sci-Fi",
    description: "A lone astronaut wakes up with no memory and must save humanity from extinction.",
    totalPages: 250,
    currentPage: 0,
    status: "want",
    rating: 0
  },
  {
    id: "4",
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    description: "A woman raised in a strict survivalist family fights her way to a formal education.",
    totalPages: 158,
    currentPage: 158,
    status: "finished",
    rating: 5
  }
];

let books = loadBooks();
let activeShelfTab = "current";   // which bookshelf tab is showing
let currentDetailBookId = null;   // which book is open in the detail modal
let selectedRatingValue = 0;      // rating chosen but not yet saved

function loadBooks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : STARTER_BOOKS;
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}


//NAVIGATION (Home / My Bookshelf)

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    const targetPage = link.dataset.page;

    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(targetPage).classList.add("active");

    renderEverything();
  });
});


//BOOKSHELF TABS (Current / Want / Finished)

const tabLinks = document.querySelectorAll(".tab-link");

tabLinks.forEach(tab => {
  tab.addEventListener("click", () => {
    activeShelfTab = tab.dataset.status;

    tabLinks.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    renderBookshelf();
  });
});


//For rendering

function renderEverything() {
  renderDashboard();
  renderBookshelf();
}

function renderDashboard() {
  const finishedBooks = books.filter(b => b.status === "finished");
  const currentBooks = books.filter(b => b.status === "current");

  document.getElementById("statBooksRead").textContent = finishedBooks.length;
  document.getElementById("statGoalProgress").textContent =
    `${finishedBooks.length} / ${READING_GOAL}`;
  document.getElementById("statCurrentCount").textContent = currentBooks.length;

  const list = document.getElementById("currentlyReadingList");
  list.innerHTML = "";

  if (currentBooks.length === 0) {
    list.innerHTML = `<p class="empty-note">Nothing on the go — add a book to get started.</p>`;
    return;
  }

  currentBooks.forEach(book => {
    list.appendChild(buildBookCard(book));
  });
}

function renderBookshelf() {
  const shelfBooks = books.filter(b => b.status === activeShelfTab);
  const grid = document.getElementById("bookshelfGrid");
  grid.innerHTML = "";

  document.getElementById("shelfCount").textContent =
    `${shelfBooks.length} book${shelfBooks.length === 1 ? "" : "s"}`;

  if (shelfBooks.length === 0) {
    grid.innerHTML = `<p class="empty-note">No books on this shelf yet.</p>`;
    return;
  }

  shelfBooks.forEach(book => {
    grid.appendChild(buildBookCard(book));
  });
}

// Builds one clickable book card, used on both Home and the Bookshelf.
function buildBookCard(book) {
  const card = document.createElement("div");
  card.className = `book-card status-${book.status}`;
  card.addEventListener("click", () => openBookDetail(book.id));

  const percent = book.totalPages
    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
    : 0;

  let metaLine = `${book.genre || "General"}`;
  if (book.status === "finished") {
    metaLine += ` · ${book.rating || 0}/5 stars`;
  } else {
    metaLine += ` · ${book.currentPage}/${book.totalPages} pages`;
  }

  card.innerHTML = `
    <h3>${escapeHtml(book.title)}</h3>
    <p class="card-author">${escapeHtml(book.author)}</p>
    ${book.status !== "want" ? `
      <div class="card-progress-track">
        <div class="card-progress-fill" style="width:${percent}%"></div>
      </div>` : ""}
    <p class="card-meta">${metaLine}</p>
  `;

  return card;
}

// Basic protection against odd characters breaking the HTML.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


//ADD BOOK MODAL

const addBookModal = document.getElementById("addBookModal");
const addBookForm = document.getElementById("addBookForm");

document.getElementById("openAddBookBtn").addEventListener("click", () => openModal("addBookModal"));
document.getElementById("openAddBookBtn2").addEventListener("click", () => openModal("addBookModal"));

addBookForm.addEventListener("submit", event => {
  event.preventDefault();

  const newBook = {
    id: Date.now().toString(),
    title: document.getElementById("titleInput").value.trim(),
    author: document.getElementById("authorInput").value.trim(),
    genre: document.getElementById("genreInput").value.trim(),
    description: document.getElementById("descriptionInput").value.trim(),
    totalPages: Number(document.getElementById("pagesInput").value) || 1,
    currentPage: 0,
    status: document.getElementById("statusInput").value,
    rating: 0
  };

  books.push(newBook);
  saveBooks();

  addBookForm.reset();
  closeModal("addBookModal");
  renderEverything();
});


//BOOK DETAIL MODAL

function openBookDetail(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  currentDetailBookId = bookId;
  selectedRatingValue = book.rating || 0;

  document.getElementById("detailTitle").textContent = book.title;
  document.getElementById("detailAuthor").textContent = book.author;
  document.getElementById("detailGenre").textContent = book.genre || "General";
  document.getElementById("detailDescription").textContent =
    book.description || "No description added yet.";

  // Progress section only makes sense once a book is being read
  const progressSection = document.getElementById("progressSection");
  progressSection.style.display = book.status === "want" ? "none" : "block";
  document.getElementById("pageProgressInput").value = book.currentPage;
  document.getElementById("progressOfTotal").textContent = `/ ${book.totalPages} pages`;
  updateProgressBar(book);

  drawStars(selectedRatingValue);

  document.getElementById("moveShelfSelect").value = book.status;

  openModal("bookDetailModal");
}

function updateProgressBar(book) {
  const percent = book.totalPages
    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
    : 0;
  document.getElementById("progressBarFill").style.width = `${percent}%`;
}

document.getElementById("saveProgressBtn").addEventListener("click", () => {
  const book = books.find(b => b.id === currentDetailBookId);
  if (!book) return;

  const newPage = Number(document.getElementById("pageProgressInput").value) || 0;
  book.currentPage = Math.min(newPage, book.totalPages);

  //When user reaches the last page it automatically moves the book to Finished.
  if (book.currentPage >= book.totalPages) {
    book.status = "finished";
    document.getElementById("moveShelfSelect").value = "finished";
  }

  saveBooks();
  updateProgressBar(book);
  renderEverything();
});

//star rating
const starEls = document.querySelectorAll("#starRating span");

function drawStars(value) {
  starEls.forEach(star => {
    star.classList.toggle("filled", Number(star.dataset.value) <= value);
  });
}

starEls.forEach(star => {
  star.addEventListener("click", () => {
    selectedRatingValue = Number(star.dataset.value);
    drawStars(selectedRatingValue);

    const book = books.find(b => b.id === currentDetailBookId);
    if (book) {
      book.rating = selectedRatingValue;
      saveBooks();
      renderEverything();
    }
  });
});

// Move to a different shelf
document.getElementById("moveShelfSelect").addEventListener("change", event => {
  const book = books.find(b => b.id === currentDetailBookId);
  if (!book) return;

  book.status = event.target.value;
  saveBooks();
  renderEverything();
});

//Delete book 
document.getElementById("deleteBookBtn").addEventListener("click", () => {
  books = books.filter(b => b.id !== currentDetailBookId);
  saveBooks();
  closeModal("bookDetailModal");
  renderEverything();
});


//HELPERS

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

// Clicking the dark overlay (outside the modal box) also closes it.
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      overlay.classList.remove("open");
    }
  });
});


//This is for the initial render 

renderEverything();
