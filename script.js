const sideNav = document.querySelector(".side-nav");
const navLinks = sideNav.querySelectorAll("a");

const addBookButtons = document.querySelectorAll(".add-book, .add-tile");

const modalOverlay = document.querySelector(".modal-overlay");
const addBookForm = document.querySelector("#add-book-form");
const discardButton = document.querySelector("#discard-btn");

const bookshelfGrid = document.querySelector(".bookshelf-grid");
const readingList = document.querySelector(".reading-list");
const wantList = document.querySelector(".want-list");
const finishedList = document.querySelector(".finished-grid");

const currentCard = document.querySelector(".current-card");

const STORAGE_KEY = "myBookReaderBooks";

let editingBookId = null;

/* =================================
   PROFILE
================================= */

const profileButton =
  document.querySelector("#profile-btn");

const profileSection =
  document.querySelector("#profile");

const editProfileButton =
  document.querySelector("#edit-profile-btn");

const profileEditCard =
  document.querySelector("#profile-edit-card");

const profileForm =
  document.querySelector("#profile-form");

const cancelProfileButton =
  document.querySelector("#cancel-profile-btn");

const profileDisplayName =
  document.querySelector("#profile-display-name");

const profileDisplayAge =
  document.querySelector("#profile-display-age");

const profileDisplayDescription =
  document.querySelector("#profile-display-description");

const profileNameInput =
  document.querySelector("#profile-name");

const profileAgeInput =
  document.querySelector("#profile-age");

const profileDescriptionInput =
  document.querySelector("#profile-description");

const PROFILE_STORAGE_KEY =
  "myBookReaderProfile";


/* =================================
   DEFAULT PROFILE
================================= */

const defaultProfile = {
  name: "Reader",
  age: "",
  description: ""
};


/* =================================
   LOAD PROFILE
================================= */

function loadProfile() {

  const savedProfile =
    localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!savedProfile) {
    return { ...defaultProfile };
  }

  try {

    return {
      ...defaultProfile,
      ...JSON.parse(savedProfile)
    };

  } catch (error) {

    console.error(
      "Could not load profile:",
      error
    );

    return { ...defaultProfile };
  }
}


let profile = loadProfile();


/* =================================
   SAVE PROFILE
================================= */

function saveProfile() {

  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );
}


/* =================================
   DISPLAY PROFILE
================================= */

function renderProfile() {

  if (!profileDisplayName) {
    return;
  }

  profileDisplayName.textContent =
    profile.name || "Reader";


  if (profile.age) {

    profileDisplayAge.textContent =
      `${profile.age} years old`;

  } else {

    profileDisplayAge.textContent =
      "Age not set";

  }


  profileDisplayDescription.textContent =
    profile.description ||
    "Tell us a little about yourself.";
}


/* =================================
   OPEN PROFILE
================================= */

if (profileButton) {

  profileButton.addEventListener(
    "click",
    () => {

      showSection("profile");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}


/* =================================
   EDIT PROFILE
================================= */

if (editProfileButton) {

  editProfileButton.addEventListener(
    "click",
    () => {

      profileNameInput.value =
        profile.name || "";

      profileAgeInput.value =
        profile.age || "";

      profileDescriptionInput.value =
        profile.description || "";

      profileEditCard.classList.remove(
        "invisible-page"
      );

      profileEditCard.classList.add(
        "visible-page"
      );

      profileNameInput.focus();

    }
  );

}


/* =================================
   CANCEL PROFILE EDIT
================================= */

if (cancelProfileButton) {

  cancelProfileButton.addEventListener(
    "click",
    () => {

      profileEditCard.classList.remove(
        "visible-page"
      );

      profileEditCard.classList.add(
        "invisible-page"
      );

    }
  );

}


/* =================================
   SAVE PROFILE FORM
================================= */

if (profileForm) {

  profileForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      profile = {

        name:
          profileNameInput.value.trim() ||
          "Reader",

        age:
          profileAgeInput.value.trim(),

        description:
          profileDescriptionInput.value.trim()

      };

      saveProfile();

      renderProfile();


      profileEditCard.classList.remove(
        "visible-page"
      );

      profileEditCard.classList.add(
        "invisible-page"
      );

    }
  );

}
/* =================================
   INITIALIZE PROFILE
================================= */

renderProfile();
/* =================================
   SAMPLE BOOKS
================================= */

const defaultBooks = [
  {
    id: crypto.randomUUID(),
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    pages: 304,
    cover: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    description: "A story about choices, possibilities, and the lives we might have lived.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    pages: 320,
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    description: "A practical guide to building good habits and breaking bad ones.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    pages: 688,
    cover: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
    description: "An epic science-fiction story about power, politics, and survival on Arrakis.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    pages: 310,
    cover: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
    description: "Bilbo Baggins leaves his quiet life behind and joins an unexpected adventure.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    pages: 328,
    cover: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    description: "A dystopian novel exploring surveillance, control, and individual freedom.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Adventure",
    pages: 208,
    cover: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
    description: "A young shepherd travels in search of treasure while discovering his purpose.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    genre: "Fantasy",
    pages: 309,
    cover: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg",
    description: "A young boy discovers that he is a wizard and begins his magical education.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic",
    pages: 281,
    cover: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
    description: "A coming-of-age story centered on justice, morality, and prejudice.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    pages: 180,
    cover: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    description: "A story of wealth, love, ambition, and the American Dream.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    pages: 432,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    description: "Elizabeth Bennet navigates love, family expectations, and social class.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genre: "Classic",
    pages: 277,
    cover: "https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg",
    description: "A teenage boy struggles with identity, adulthood, and alienation.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    pages: 1178,
    cover: "https://covers.openlibrary.org/b/isbn/9780618640157-L.jpg",
    description: "An epic journey to destroy a powerful ring and defeat an ancient evil.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    genre: "Dystopian",
    pages: 249,
    cover: "https://covers.openlibrary.org/b/isbn/9781451678189-L.jpg",
    description: "A society where books are forbidden forces one fireman to question his world.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Book Thief",
    author: "Markus Zusak",
    genre: "Historical Fiction",
    pages: 584,
    cover: "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
    description: "A young girl finds comfort and resistance through books during World War II.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Hunger Games",
    author: "Suzanne Collins",
    genre: "Young Adult",
    pages: 374,
    cover: "https://covers.openlibrary.org/b/isbn/9780439023481-L.jpg",
    description: "Katniss Everdeen is forced to compete in a brutal televised competition.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Fault in Our Stars",
    author: "John Green",
    genre: "Romance",
    pages: 313,
    cover: "https://covers.openlibrary.org/b/isbn/9780525478812-L.jpg",
    description: "Two teenagers meet and form a deep connection while facing difficult circumstances.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Road",
    author: "Cormac McCarthy",
    genre: "Post-Apocalyptic",
    pages: 287,
    cover: "https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg",
    description: "A father and son travel through a devastated world searching for safety.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    genre: "Historical Fiction",
    pages: 371,
    cover: "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
    description: "A powerful story of friendship, guilt, redemption, and family.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    pages: 352,
    cover: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
    description: "A memoir about education, family, identity, and finding independence.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Memoir",
    pages: 448,
    cover: "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
    description: "A memoir covering childhood, career, family, and life in the public eye.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "Finance",
    pages: 256,
    cover: "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
    description: "Lessons about how behavior and psychology influence financial decisions.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Deep Work",
    author: "Cal Newport",
    genre: "Productivity",
    pages: 296,
    cover: "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
    description: "A guide to focused work and developing the ability to concentrate deeply.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    genre: "Self-Help",
    pages: 464,
    cover: "https://covers.openlibrary.org/b/isbn/9781982137274-L.jpg",
    description: "A framework for personal effectiveness, responsibility, and long-term growth.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "History",
    pages: 443,
    cover: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
    description: "An overview of human history from early humans to the modern world.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Martian",
    author: "Andy Weir",
    genre: "Science Fiction",
    pages: 369,
    cover: "https://covers.openlibrary.org/b/isbn/9780553418026-L.jpg",
    description: "An astronaut stranded on Mars must use science and ingenuity to survive.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Science Fiction",
    pages: 496,
    cover: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
    description: "A lone astronaut awakens with a mission to save humanity from extinction.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "A Man Called Ove",
    author: "Fredrik Backman",
    genre: "Fiction",
    pages: 337,
    cover: "https://covers.openlibrary.org/b/isbn/9781476738017-L.jpg",
    description: "A grumpy widower's life changes when a new family moves in next door.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Silent Patient",
    author: "Alex Michaelides",
    genre: "Thriller",
    pages: 336,
    cover: "https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg",
    description: "A famous painter stops speaking after a shocking crime, leaving a mystery to solve.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    genre: "Historical Fiction",
    pages: 400,
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    description: "An aging Hollywood star reveals the secrets of her extraordinary life.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Circe",
    author: "Madeline Miller",
    genre: "Fantasy",
    pages: 393,
    cover: "https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg",
    description: "A mythological retelling following the life of the goddess Circe.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    genre: "Literary Fiction",
    pages: 298,
    cover: "https://covers.openlibrary.org/b/isbn/9780375704024-L.jpg",
    description: "A reflective story about love, loss, memory, and growing up.",
    status: "finished",
    default: true
  }
];


/* =================================
   LOAD BOOKS
================================= */

function loadBooks() {
  const savedBooks = localStorage.getItem(STORAGE_KEY);

  if (savedBooks) {
    try {
      const parsedBooks = JSON.parse(savedBooks);

      /*
         Only load books that were originally
         part of the sample collection.
      */

      const savedDefaultBooks = parsedBooks.filter(
        book => book.default === true
      );

      /*
         If valid default books exist,
         use those saved versions.
      */

      if (savedDefaultBooks.length > 0) {
        return savedDefaultBooks;
      }

    } catch (error) {
      console.error(
        "Could not load saved books:",
        error
      );
    }
  }

  /*
     No valid saved sample books found.
     Start with the original six.
  */

  const initialBooks = structuredClone(defaultBooks);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialBooks)
  );

  return initialBooks;
}


let books = loadBooks();


/* =================================
   SAVE BOOKS
================================= */

function saveBooks() {
  /*
     ONLY the original/sample books
     are saved permanently.
  */

  const booksToSave = books.filter(
    book => book.default === true
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(booksToSave)
  );
}


/* =================================
   PAGE NAVIGATION
================================= */

function showSection(sectionId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(page => {
    const isSelected = page.id === sectionId;

    page.classList.toggle(
      "visible-page",
      isSelected
    );

    page.classList.toggle(
      "invisible-page",
      !isSelected
    );
  });

  navLinks.forEach(link => {
    const isSelected =
      link.getAttribute("href") === `#${sectionId}`;

    link.classList.toggle(
      "selected-section",
      isSelected
    );
  });
}

/* =================================
   LOGO → DASHBOARD
================================= */

const logoButton = document.querySelector("#logo-btn");

if (logoButton) {
  logoButton.addEventListener("click", event => {
    event.preventDefault();

    showSection("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}


navLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const sectionId =
      link
        .getAttribute("href")
        .substring(1);

    showSection(sectionId);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});


/* =================================
   MODAL
================================= */

function openAddBookForm() {
  editingBookId = null;

  setFormMode("add");

  addBookForm.reset();

  modalOverlay.classList.remove(
    "invisible-page"
  );

  modalOverlay.classList.add(
    "visible-page"
  );

  document
    .querySelector("#book-title")
    .focus();
}


function closeAddBookForm() {
  modalOverlay.classList.remove(
    "visible-page"
  );

  modalOverlay.classList.add(
    "invisible-page"
  );

  addBookForm.reset();

  editingBookId = null;
}


addBookButtons.forEach(button => {
  button.addEventListener(
    "click",
    openAddBookForm
  );
});


discardButton.addEventListener(
  "click",
  closeAddBookForm
);


/* =================================
   FORM MODE
================================= */

function setFormMode(mode) {
  const modalTitle =
    modalOverlay.querySelector(".modal-title");

  const submitButton =
    modalOverlay.querySelector("#save-book-btn");

  if (mode === "edit") {

    if (modalTitle) {
      modalTitle.textContent = "Edit Book";
    }

    if (submitButton) {
      submitButton.textContent = "Save Changes";
    }

  } else {

    if (modalTitle) {
      modalTitle.textContent = "Add Book";
    }

    if (submitButton) {
      submitButton.textContent = "Add Book";
    }
  }
}


/* =================================
   GET FORM DATA
================================= */

function getBookFromForm() {
  const selectedStatus =
    document.querySelector(
      'input[name="book-status"]:checked'
    );

  return {
    title:
      document
        .querySelector("#book-title")
        .value
        .trim(),

    author:
      document
        .querySelector("#book-author")
        .value
        .trim(),

    genre:
      document
        .querySelector("#book-genre")
        .value
        .trim(),

    pages:
      Number(
        document
          .querySelector("#book-pages")
          .value
      ),

    status:
      selectedStatus
        ? selectedStatus.value
        : "want",

    cover:
      document
        .querySelector("#book-cover")
        .value
        .trim(),

    description:
      document
        .querySelector("#book-description")
        .value
        .trim()
  };
}


/* =================================
   FILL EDIT FORM
================================= */

function fillEditForm(book) {
  document.querySelector("#book-title").value =
    book.title;

  document.querySelector("#book-author").value =
    book.author;

  document.querySelector("#book-genre").value =
    book.genre;

  document.querySelector("#book-pages").value =
    book.pages;

  document.querySelector("#book-cover").value =
    book.cover || "";

  document.querySelector("#book-description").value =
    book.description || "";

  const statusRadio =
    document.querySelector(
      `input[name="book-status"][value="${book.status}"]`
    );

  if (statusRadio) {
    statusRadio.checked = true;
  }
}


/* =================================
   OPEN EDIT FORM
================================= */

function openEditBookForm(bookId) {
  const book = books.find(
    book => book.id === bookId
  );

  if (!book) {
    return;
  }

  editingBookId = bookId;

  setFormMode("edit");

  fillEditForm(book);

  modalOverlay.classList.remove(
    "invisible-page"
  );

  modalOverlay.classList.add(
    "visible-page"
  );

  document
    .querySelector("#book-title")
    .focus();
}


/* =================================
   CREATE BOOK COVER
================================= */

function createBookCover(book, className = "") {
  const cover =
    document.createElement("div");

  cover.classList.add("cover");

  if (className) {
    cover.classList.add(className);
  }

  if (book.cover) {
    cover.style.backgroundImage =
      `url("${book.cover}")`;
  }

  return cover;
}


/* =================================
   CREATE TEXT ELEMENT
================================= */

function createTextElement(
  tag,
  text,
  className = ""
) {
  const element =
    document.createElement(tag);

  element.textContent = text;

  if (className) {
    element.classList.add(className);
  }

  return element;
}


/* =================================
   CREATE EDIT BUTTON
================================= */

function createEditButton(book) {
  const button =
    document.createElement("button");

  button.type = "button";

  button.classList.add(
    "edit-book-btn"
  );

  button.textContent = "Edit";

  button.addEventListener(
    "click",
    () => {
      openEditBookForm(book.id);
    }
  );

  return button;
}


/* =================================
   BOOKSHELF
================================= */

function addBookToBookshelf(book) {
  const bookTile =
    document.createElement("div");

  bookTile.classList.add(
    "book-tile"
  );

  const cover =
    createBookCover(book);

  const title =
    createTextElement(
      "b",
      book.title
    );

  bookTile.appendChild(cover);
  bookTile.appendChild(title);

  const addTile =
    bookshelfGrid.querySelector(
      ".add-tile"
    );

  if (addTile) {
    bookshelfGrid.insertBefore(
      bookTile,
      addTile.nextSibling
    );
  } else {
    bookshelfGrid.appendChild(
      bookTile
    );
  }
}


/* =================================
   CURRENT READS
================================= */

function addBookToCurrentReads(book) {
  const card =
    document.createElement("article");

  card.classList.add(
    "reading-card"
  );

  const cover =
    createBookCover(
      book,
      "large-cover"
    );

  const info =
    document.createElement("div");

  info.classList.add(
    "reading-info"
  );

  const title =
    createTextElement(
      "h2",
      book.title
    );

  const author =
    createTextElement(
      "p",
      book.author
    );

  const genre =
    createTextElement(
      "p",
      book.genre
    );

  const description =
    createTextElement(
      "p",
      book.description,
      "description"
    );

  const progress =
    document.createElement("div");

  progress.classList.add(
    "progress"
  );

  const progressBar =
    document.createElement("span");

  progressBar.style.width = "0%";

  progress.appendChild(
    progressBar
  );

  const progressLabels =
    document.createElement("div");

  progressLabels.classList.add(
    "progress-labels"
  );

  const pageLabel =
    createTextElement(
      "span",
      `0 / ${book.pages} pages`
    );

  const percentLabel =
    createTextElement(
      "span",
      "0%"
    );

  progressLabels.appendChild(
    pageLabel
  );

  progressLabels.appendChild(
    percentLabel
  );

  const editButton =
    createEditButton(book);

  info.appendChild(title);
  info.appendChild(author);
  info.appendChild(genre);
  info.appendChild(description);
  info.appendChild(progress);
  info.appendChild(progressLabels);
  info.appendChild(editButton);

  card.appendChild(cover);
  card.appendChild(info);

  readingList.appendChild(card);
}


/* =================================
   WANT TO READ
================================= */

function addBookToWantList(book) {
  const card =
    document.createElement("article");

  card.classList.add(
    "want-card"
  );

  const cover =
    createBookCover(
      book,
      "medium-cover"
    );

  const info =
    document.createElement("div");

  const title =
    createTextElement(
      "h2",
      book.title
    );

  const author =
    createTextElement(
      "p",
      book.author
    );

  const genre =
    createTextElement(
      "p",
      book.genre
    );

  const description =
    createTextElement(
      "p",
      book.description,
      "description"
    );

  const pageCount =
    createTextElement(
      "span",
      `${book.pages} pages`,
      "page-count"
    );

  const editButton =
    createEditButton(book);

  info.appendChild(title);
  info.appendChild(author);
  info.appendChild(genre);
  info.appendChild(description);
  info.appendChild(pageCount);
  info.appendChild(editButton);

  card.appendChild(cover);
  card.appendChild(info);

  wantList.appendChild(card);
}


/* =================================
   FINISHED BOOKS
================================= */

function addBookToFinished(book) {
  const card =
    document.createElement("article");

  card.classList.add(
    "finished-card"
  );

  const cover =
    createBookCover(
      book,
      "finished-cover"
    );

  const title =
    createTextElement(
      "h2",
      book.title
    );

  const author =
    createTextElement(
      "p",
      book.author
    );

  const genre =
    createTextElement(
      "p",
      book.genre
    );

  const pageCount =
    createTextElement(
      "p",
      `${book.pages} pages`
    );

  const description =
    createTextElement(
      "p",
      book.description,
      "description"
    );

  const editButton =
    createEditButton(book);

  card.appendChild(cover);
  card.appendChild(title);
  card.appendChild(author);
  card.appendChild(genre);
  card.appendChild(pageCount);
  card.appendChild(description);
  card.appendChild(editButton);

  finishedList.appendChild(card);
}


/* =================================
   DASHBOARD CURRENT BOOK
================================= */

function showDashboardCurrentBook(book) {
  if (!currentCard || !book) {
    return;
  }

  const cover =
    currentCard.querySelector(".cover");

  const title =
    currentCard.querySelector("h2");

  const author =
    currentCard.querySelector(".book-author");

  const genre =
    currentCard.querySelector(".book-genre");

  const description =
    currentCard.querySelector(".description");

  const pageCount =
    currentCard.querySelector(".pages");

  const progressBar =
    currentCard.querySelector(
      ".progress span"
    );

  const progressLabels =
    currentCard.querySelectorAll(
      ".progress-labels span"
    );

  if (cover) {
    cover.style.backgroundImage =
      book.cover
        ? `url("${book.cover}")`
        : "";
  }

  if (title) {
    title.textContent =
      book.title;
  }

  if (author) {
    author.textContent =
      book.author;
  }

  if (genre) {
    genre.textContent =
      book.genre;
  }

  if (description) {
    description.textContent =
      book.description;
  }

  if (pageCount) {
    pageCount.textContent =
      `0 / ${book.pages} pages`;
  }

  if (progressBar) {
    progressBar.style.width =
      "0%";
  }

  if (progressLabels.length >= 2) {
    progressLabels[0].textContent =
      "0%";

    progressLabels[1].textContent =
      `0 / ${book.pages} pages`;
  }
}


/* =================================
   UPDATE BOOK COUNTS
================================= */

function updateBookCounts() {
  const bookshelfCount =
    document.querySelector(
      "#bookshelf-count"
    );

  const currentCount =
    document.querySelector(
      "#current-count"
    );

  const wantCount =
    document.querySelector(
      "#want-count"
    );

  const finishedCount =
    document.querySelector(
      "#finished-count"
    );

  const currentBooks =
    books.filter(
      book => book.status === "current"
    );

  const wantBooks =
    books.filter(
      book => book.status === "want"
    );

  const finishedBooks =
    books.filter(
      book => book.status === "finished"
    );

  if (bookshelfCount) {
    bookshelfCount.textContent =
      `${books.length} ${
        books.length === 1
          ? "book"
          : "books"
      }`;
  }

  if (currentCount) {
    currentCount.textContent =
      `${currentBooks.length} ${
        currentBooks.length === 1
          ? "book"
          : "books"
      }`;
  }

  if (wantCount) {
    wantCount.textContent =
      `${wantBooks.length} ${
        wantBooks.length === 1
          ? "book"
          : "books"
      }`;
  }

  if (finishedCount) {
    finishedCount.textContent =
      `${finishedBooks.length} ${
        finishedBooks.length === 1
          ? "book"
          : "books"
      }`;
  }
}

/* =================================
   UPDATE DASHBOARD STATISTICS
================================= */

function updateDashboardStats() {
  const booksReadStat =
    document.querySelector("#books-read-stat");

  const totalBooksStat =
    document.querySelector("#total-books-stat");

  const currentReadsStat =
    document.querySelector("#current-reads-stat");

  const wantToReadStat =
    document.querySelector("#want-to-read-stat");


  const booksRead =
    books.filter(
      book => book.status === "finished"
    ).length;


  const totalBooks =
    books.length;


  const currentReads =
    books.filter(
      book => book.status === "current"
    ).length;


  const wantToRead =
    books.filter(
      book => book.status === "want"
    ).length;


  if (booksReadStat) {
    booksReadStat.textContent =
      booksRead;
  }


  if (totalBooksStat) {
    totalBooksStat.textContent =
      totalBooks;
  }


  if (currentReadsStat) {
    currentReadsStat.textContent =
      currentReads;
  }


  if (wantToReadStat) {
    wantToReadStat.textContent =
      wantToRead;
  }
}


/* =================================
   RENDER ALL BOOKS
================================= */

function renderBooks() {

  /*
     Remove generated bookshelf books
  */

  bookshelfGrid
    .querySelectorAll(
      ".book-tile:not(.add-tile)"
    )
    .forEach(bookTile => {
      bookTile.remove();
    });


  /*
     Clear status sections
  */

  readingList.innerHTML = "";
  wantList.innerHTML = "";
  finishedList.innerHTML = "";


  /*
     Render every book
     into My Bookshelf
  */

  books.forEach(book => {
    addBookToBookshelf(book);
  });


  /*
     Render books according
     to their current status
  */

  books.forEach(book => {

    switch (book.status) {

      case "current":
        addBookToCurrentReads(book);
        break;

      case "want":
        addBookToWantList(book);
        break;

      case "finished":
        addBookToFinished(book);
        break;

    }

  });


  /*
     Update counts once
  */

  updateBookCounts();
  updateDashboardStats();

  /*
     Pick a random CURRENT book
     for the dashboard.

     This does NOT change the
     book's actual status.
  */

  const currentBooks =
    books.filter(
      book => book.status === "current"
    );

  if (currentBooks.length > 0) {

    const randomBook =
      currentBooks[
        Math.floor(
          Math.random() *
          currentBooks.length
        )
      ];

    showDashboardCurrentBook(
      randomBook
    );

  }
}


/* =================================
   ADD / EDIT BOOK
================================= */

addBookForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const formBook =
      getBookFromForm();


    /* =================================
       EDIT EXISTING BOOK
    ================================= */

    if (editingBookId) {

      const bookIndex =
        books.findIndex(
          book =>
            book.id === editingBookId
        );

      if (bookIndex !== -1) {

        /*
           Preserve the original
           "default: true" property.

           Therefore, editing one of
           the six original books still
           saves it permanently.
        */

        books[bookIndex] = {
          ...books[bookIndex],
          ...formBook
        };

      }

    }


    /* =================================
       ADD NEW BOOK
    ================================= */

    else {

      /*
         IMPORTANT:
         No "default: true" here.

         This means newly added books
         exist only for this session.
      */

      books.push({
        id: crypto.randomUUID(),
        ...formBook
      });

    }


    /*
       Only default/sample books
       are saved to localStorage.
    */

    saveBooks();


    /*
       Update the screen.
    */

    renderBooks();


    /*
       Close the modal.
    */

    closeAddBookForm();

  }
);


/* =================================
   INITIALIZE
================================= */

renderBooks();
