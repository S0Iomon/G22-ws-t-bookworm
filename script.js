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
const STREAK_STORAGE_KEY = "myBookReaderStreak";

let editingBookId = null;

/* =================================
   PROFILE
================================= */

const profileButton =
  document.querySelector("#profile-btn");

const accountButton = document.querySelector("#account-btn");
const authOverlay = document.querySelector("#auth-overlay");
const authForm = document.querySelector("#auth-form");
const authNameGroup = document.querySelector("#auth-name-group");
const authNameInput = document.querySelector("#auth-name");
const authEmailInput = document.querySelector("#auth-email");
const authPasswordInput = document.querySelector("#auth-password");
const authTitle = document.querySelector("#auth-title");
const authStatus = document.querySelector("#auth-status");
const authSubmitButton = document.querySelector("#auth-submit-btn");
const authSwitchPrompt = document.querySelector("#auth-switch-prompt");
const authSwitchButton = document.querySelector("#auth-switch-btn");
let authMode = "login";
let authenticatedUser = null;

function setAuthenticatedUser(user) {
  authenticatedUser = user;
  accountButton.textContent = user ? "Log out" : "Log in";
  accountButton.setAttribute("aria-label", user ? `Log out ${user.name}` : "Log in");
  accountButton.title = user ? `Signed in as ${user.email}` : "Log in or create an account";
  document.body.classList.toggle("auth-required", !user);
}

async function loadBooksForUser() {
  const response = await fetch("/api/books");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("The books API was not found. Restart the Express server with npm start.");
  }
  const serverBooks = await response.json();
  if (!response.ok) throw new Error(serverBooks.error || "Could not load your books.");
  books = deduplicateBooks(serverBooks.map(normalizeBookProgress));
  saveBooks();
  renderBooks();
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegistering = mode === "register";
  authTitle.textContent = isRegistering ? "Create account" : "Log in";
  authSubmitButton.textContent = isRegistering ? "Create account" : "Log in";
  authNameGroup.hidden = !isRegistering;
  authNameInput.required = isRegistering;
  authNameInput.autocomplete = isRegistering ? "name" : "off";
  authPasswordInput.autocomplete = isRegistering ? "new-password" : "current-password";
  authSwitchPrompt.textContent = isRegistering ? "Already have an account?" : "Need an account?";
  authSwitchButton.textContent = isRegistering ? "Log in" : "Create one";
  authStatus.textContent = "";
}

function openAuthDialog() {
  setAuthMode("login");
  authOverlay.classList.remove("invisible-page");
  authOverlay.classList.add("visible-page");
  document.body.style.overflow = "hidden";
  authEmailInput.focus();
}

function closeAuthDialog() {
  if (!authenticatedUser) return;
  authOverlay.classList.remove("visible-page");
  authOverlay.classList.add("invisible-page");
  document.body.style.overflow = "";
  accountButton.focus();
}

async function loadAuthState() {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) throw new Error("Could not check login status.");
    const data = await response.json();
    if (data.user) {
      await loadBooksForUser();
      setAuthenticatedUser(data.user);
      closeAuthDialog();
      loadStreak();
    } else {
      setAuthenticatedUser(null);
      clearBooks();
    }
  } catch (error) {
    setAuthenticatedUser(null);
    clearBooks();
    authStatus.textContent = "Account service is unavailable.";
  }
}

async function logOut() {
  accountButton.disabled = true;
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Logout failed");
    setAuthenticatedUser(null);
    clearBooks();
    openAuthDialog();
  } catch (error) {
    accountButton.title = "Could not log out. Check the server connection.";
  } finally {
    accountButton.disabled = false;
  }
}

accountButton.addEventListener("click", () => {
  if (authenticatedUser) logOut();
  else openAuthDialog();
});

document.querySelector("#close-auth-btn").addEventListener("click", closeAuthDialog);
authSwitchButton.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

authOverlay.addEventListener("click", event => {
  if (event.target === authOverlay) closeAuthDialog();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && authOverlay.classList.contains("visible-page")) {
    closeAuthDialog();
  }
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  authStatus.textContent = authMode === "register" ? "Creating your account…" : "Logging in…";
  authSubmitButton.disabled = true;

  const payload = {
    email: authEmailInput.value,
    password: authPasswordInput.value
  };
  if (authMode === "register") payload.name = authNameInput.value;

  try {
    const response = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const isGitHubPages = location.hostname.endsWith(".github.io");
      throw new Error(isGitHubPages
        ? "Sign-in is unavailable on GitHub Pages because it only hosts the frontend. The Express backend must be deployed separately to enable accounts here."
        : "The account API was not found. Restart the Express server with npm start, then open http://localhost:3000.");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Authentication failed.");
    await loadBooksForUser();
    setAuthenticatedUser(data.user);
    loadStreak();
    authForm.reset();
    closeAuthDialog();
  } catch (error) {
    authStatus.textContent = error.message || "Could not connect to the account service.";
  } finally {
    authSubmitButton.disabled = false;
  }
});

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

const profilePhotoInput =
  document.querySelector("#profile-photo-input");

const profilePhotoPreview =
  document.querySelector("#profile-photo-preview");

const profilePhotoStatus =
  document.querySelector("#profile-photo-status");

const removeProfilePhotoButton =
  document.querySelector("#remove-profile-photo");

const profileAvatarImage =
  document.querySelector(".profile-avatar img");

const headerUserImage =
  document.querySelector(".user-icon");

const DEFAULT_PROFILE_PHOTO = "./resources/user.png";
const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;

const PROFILE_STORAGE_KEY =
  "myBookReaderProfile";


/* =================================
   DEFAULT PROFILE
================================= */

const defaultProfile = {
  name: "Reader",
  age: "",
  description: "",
  photo: ""
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

  const photo = profile.photo || DEFAULT_PROFILE_PHOTO;
  if (profileAvatarImage) profileAvatarImage.src = photo;
  if (headerUserImage) headerUserImage.src = photo;
  if (profilePhotoPreview) profilePhotoPreview.src = photo;
}

if (profilePhotoInput) {
  profilePhotoInput.addEventListener("change", () => {
    const file = profilePhotoInput.files && profilePhotoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      profilePhotoStatus.textContent = "Choose an image file.";
      profilePhotoInput.value = "";
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      profilePhotoStatus.textContent = "Choose an image smaller than 2 MB.";
      profilePhotoInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      profile.photo = String(reader.result || "");
      saveProfile();
      renderProfile();
      profilePhotoStatus.textContent = "Profile picture updated.";
    });
    reader.addEventListener("error", () => {
      profilePhotoStatus.textContent = "Could not read that image.";
    });
    reader.readAsDataURL(file);
  });
}

if (removeProfilePhotoButton) {
  removeProfilePhotoButton.addEventListener("click", () => {
    profile.photo = "";
    saveProfile();
    renderProfile();
    if (profilePhotoInput) profilePhotoInput.value = "";
    if (profilePhotoStatus) profilePhotoStatus.textContent = "Profile picture removed.";
  });
}


/* =================================
   OPEN PROFILE
================================= */

if (profileButton) {

  profileButton.addEventListener(
    "click",
    () => {

      showSection("profile");
      closeMobileMenu();

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
   LOAD BOOKS
================================= */


/* =================================
   LOAD BOOKS
================================= */

function clearBooks() {
  books = [];
  localStorage.removeItem(STORAGE_KEY);
  renderBooks();
}

function deduplicateBooks(bookList) {
  const seen = new Set();
  return bookList.filter(book => {
    const title = String(book.title || "").trim().toLocaleLowerCase();
    const author = String(book.author || "").trim().toLocaleLowerCase();
    const description = String(book.description || "").trim().toLocaleLowerCase();

    // Remove the accidental test entry: Life / Life adventure / 124 pages.
    if (
      Number(book.pages) === 124 &&
      (title === "life" || description.includes("life adventure"))
    ) {
      return false;
    }

    const key = `${title}|${author}`;
    if (!title || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeBookProgress(book) {
  const pages = Number(book.pages) || 0;
  let currentPage = Math.max(0, Number(book.currentPage) || 0);

  // Keep books explicitly on the wishlist unread during migration.
  if (book.status === "want") currentPage = 0;
  if (pages > 0) currentPage = Math.min(currentPage, pages);

  const status = currentPage === 0
    ? "want"
    : pages > 0 && currentPage >= pages
      ? "finished"
      : "current";

  return { ...book, currentPage, status };
}

let books = [];

/* =================================
   SAVE BOOKS
================================= */

function saveBooks() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(books)
  );
}

async function saveNewBookToServer(book) {
  const response = await fetch("/api/books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...book,
      pages: book.pages ?? book.totalPages
    })
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const isGitHubPages = location.hostname.endsWith(".github.io");
    throw new Error(isGitHubPages
      ? "Books cannot be saved on GitHub Pages because it only hosts the frontend. Run the Express server locally or deploy the backend."
      : "The book API was not found. Restart the Express server with npm start, then open http://localhost:3000.");
  }
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Could not save book to server."
    );
  }

  return result;
}

async function updateBookOnServer(book, previousBook) {
  const response = await fetch(`/api/books/${encodeURIComponent(book.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...book,
      previousTitle: previousBook.title,
      previousAuthor: previousBook.author
    })
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("The book update API was not found. Restart the Express server with npm start.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not update book on server.");
  return result;
}

async function deleteBookOnServer(bookId) {
  const response = await fetch(`/api/books/${encodeURIComponent(bookId)}`, { method: "DELETE" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not remove book.");
  return result;
}

async function saveBookProgress(bookId, page, slider = null) {
  const index = books.findIndex(book => book.id === bookId);
  if (index === -1) return;

  const previousBook = { ...books[index] };
  const nextBook = normalizeBookProgress({ ...previousBook, currentPage: Number(page) });
  if (slider) slider.disabled = true;
  try {
    const savedBook = await updateBookOnServer(nextBook, previousBook);
    books[index] = savedBook;
    saveBooks();
    if (savedBook.currentPage > Number(previousBook.currentPage || 0)) recordReadingActivity();

    if (savedBook.status !== previousBook.status) {
      renderBooks();
      showSection(savedBook.status);
      closeMobileMenu();
      const destinationSelector = savedBook.status === "want" ? ".want-card" : ".finished-card";
      const destinationCard = document.querySelector(
        `${destinationSelector}[data-book-id="${CSS.escape(bookId)}"]`
      );
      destinationCard?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const card = readingList.querySelector(`[data-book-id="${CSS.escape(bookId)}"]`);
    if (card) {
      const percentage = Math.round((savedBook.currentPage / savedBook.pages) * 100);
      card.querySelector(".progress span").style.width = `${percentage}%`;
      const labels = card.querySelectorAll(".progress-labels span");
      if (labels.length >= 2) {
        labels[0].textContent = `${savedBook.currentPage} / ${savedBook.pages} pages`;
        labels[1].textContent = `${percentage}%`;
      }
      const pageInput = card.querySelector(".bookmark-page-input");
      if (pageInput) pageInput.value = savedBook.currentPage;
      const cardSlider = card.querySelector(".progress-slider");
      const output = card.querySelector(".progress-slider-control output");
      if (cardSlider) cardSlider.value = savedBook.currentPage;
      if (output) output.textContent = `${savedBook.currentPage} / ${savedBook.pages} pages`;
    }

    if (currentCard.dataset.bookId === bookId) showDashboardCurrentBook(savedBook);
  } catch (error) {
    console.error("Could not save reading progress:", error);
    if (slider) {
      slider.value = previousBook.currentPage;
      const output = slider.parentElement.querySelector("output");
      if (output) output.textContent = `${previousBook.currentPage} / ${previousBook.pages} pages`;
      slider.title = `Could not save progress: ${error.message}`;
    }
  } finally {
    if (slider?.isConnected) slider.disabled = false;
  }
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderStreakWeek(activityDates = []) {
  const week = document.querySelector("#streak-week");
  const dates = new Set(activityDates);
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  const fragment = document.createDocumentFragment();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let daysRead = 0;

  weekdays.forEach((weekday, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    const dateKey = getLocalDateString(date);
    const isRead = dates.has(dateKey);
    if (isRead) daysRead += 1;

    const day = document.createElement("div");
    day.className = "streak-week-day";
    if (isRead) day.classList.add("is-read");
    if (dateKey === getLocalDateString()) day.classList.add("is-today");
    day.setAttribute("aria-label", `${weekday}, ${dateKey}: ${isRead ? "read" : "no reading recorded"}`);

    const label = document.createElement("span");
    label.className = "streak-week-label";
    label.textContent = weekday;
    const circle = document.createElement("span");
    circle.className = "streak-week-circle";
    circle.textContent = isRead ? "✓" : "";
    circle.setAttribute("aria-hidden", "true");
    day.append(label, circle);
    fragment.appendChild(day);
  });

  week.replaceChildren(fragment);
  document.querySelector("#streak-week-summary").textContent = `${daysRead} of 7 days read this week`;
}

function renderStreak(streak) {
  const weekActivityDates = streak.activityDates ||
    (streak.lastReadDate ? [streak.lastReadDate] : []);
  renderStreakWeek(weekActivityDates);
  document.querySelector("#current-streak").textContent = streak.currentStreak;
  document.querySelector("#best-streak").textContent = streak.longestStreak;
  const message = document.querySelector("#streak-message");

  if (streak.status === "broken") {
    message.textContent = `Streak ended after ${streak.lastReadDate}. Read today to start a new one.`;
    message.classList.add("streak-broken");
  } else if (streak.readToday) {
    message.textContent = "You read today. Come back tomorrow to keep it going!";
    message.classList.remove("streak-broken");
  } else if (streak.currentStreak) {
    message.textContent = "Read today to keep your streak alive.";
    message.classList.remove("streak-broken");
  } else {
    message.textContent = "Log pages read each day to build a streak.";
    message.classList.remove("streak-broken");
  }
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
}

async function loadStreak() {
  try {
    const response = await fetch(`/api/streak?today=${getLocalDateString()}`);
    if (!response.ok) throw new Error("Could not load streak");
    renderStreak(await response.json());
  } catch (error) {
    document.querySelector("#streak-message").textContent = "Streak data is unavailable. Start the server to sync your progress.";
  }
}

async function recordReadingActivity() {
  document.querySelector("#streak-message").textContent = "Saving today’s reading…";
  try {
    const response = await fetch("/api/streak/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: getLocalDateString() })
    });
    if (!response.ok) throw new Error("Could not save reading activity");
    renderStreak(await response.json());
  } catch (error) {
    document.querySelector("#streak-message").textContent = "Could not save today’s reading. Check your server connection.";
  }
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
   MOBILE HAMBURGER MENU
================================= */

const hamburgerButton =
  document.querySelector("#hamburger-btn");

const sidebar =
  document.querySelector(".sidebar");


function openMobileMenu() {

  sidebar.classList.add(
    "mobile-open"
  );

  hamburgerButton.classList.add(
    "menu-open"
  );

  hamburgerButton.setAttribute(
    "aria-expanded",
    "true"
  );
  hamburgerButton.setAttribute("aria-label", "Close navigation menu");

}


function closeMobileMenu() {

  sidebar.classList.remove(
    "mobile-open"
  );

  hamburgerButton.classList.remove(
    "menu-open"
  );

  hamburgerButton.setAttribute(
    "aria-expanded",
    "false"
  );
  hamburgerButton.setAttribute("aria-label", "Open navigation menu");

}


function toggleMobileMenu() {

  const isOpen =
    sidebar.classList.contains(
      "mobile-open"
    );

  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }

}


if (hamburgerButton && sidebar) {

  hamburgerButton.addEventListener(
    "click",
    toggleMobileMenu
  );

}

/* =================================
   LOGO → DASHBOARD
================================= */

const logoButton = document.querySelector("#logo-btn");
const mobileMenuHeader = document.querySelector("#mobile-menu-header");
const sidebarTitle = document.querySelector(".sidebar > h2");
let logoPlaceholder = null;
let profilePlaceholder = null;
let titlePlaceholder = null;

function placeBrandControlsForViewport() {
  const isMobile = window.matchMedia("(max-width: 650px)").matches;

  if (isMobile) {
    if (logoButton.parentElement !== mobileMenuHeader) {
      logoPlaceholder = document.createComment("logo topbar position");
      logoButton.before(logoPlaceholder);
      mobileMenuHeader.appendChild(logoButton);
    }
    if (sidebarTitle.parentElement !== mobileMenuHeader) {
      titlePlaceholder = document.createComment("sidebar title position");
      sidebarTitle.before(titlePlaceholder);
      mobileMenuHeader.appendChild(sidebarTitle);
    }
    if (profileButton.parentElement !== mobileMenuHeader) {
      profilePlaceholder = document.createComment("profile topbar position");
      profileButton.before(profilePlaceholder);
      mobileMenuHeader.appendChild(profileButton);
    }
    return;
  }

  if (logoPlaceholder?.parentNode) {
    logoPlaceholder.replaceWith(logoButton);
    logoPlaceholder = null;
  }
  if (titlePlaceholder?.parentNode) {
    titlePlaceholder.replaceWith(sidebarTitle);
    titlePlaceholder = null;
  }
  if (profilePlaceholder?.parentNode) {
    profilePlaceholder.replaceWith(profileButton);
    profilePlaceholder = null;
  }
}

placeBrandControlsForViewport();
window.matchMedia("(max-width: 650px)").addEventListener("change", placeBrandControlsForViewport);
window.addEventListener("resize", placeBrandControlsForViewport);

if (logoButton) {
  logoButton.addEventListener("click", event => {
    event.preventDefault();

    showSection("home");
    closeMobileMenu();

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
    closeMobileMenu();

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
  const pages =
    Number(
      document.querySelector("#book-pages").value
    );

  let currentPage =
    Number(
      document.querySelector("#book-current-page").value
    );

  /*
     Make sure current page is valid.
  */

  if (currentPage < 0) {
    currentPage = 0;
  }

  if (currentPage > pages) {
    currentPage = pages;
  }

  
  /*
     Automatically determine status
     based on reading progress.
  */

  const status = currentPage === 0
    ? "want"
    : currentPage >= pages
      ? "finished"
      : "current";

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

    pages,

    currentPage,

    status,

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

  document.querySelector("#book-current-page").value =
    book.currentPage || 0;

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

  if (book.cover && book.cover.trim()) {
    cover.style.backgroundImage = `url("${book.cover.trim()}")`;
    cover.classList.add("has-cover-image");
  } else {
    cover.classList.add("placeholder-cover");
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

function createProgressControl(book) {
  const control = document.createElement("div");
  control.className = "progress-slider-control";

  const label = document.createElement("label");
  label.textContent = "Reading progress";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "progress-slider";
  slider.min = "0";
  slider.max = String(Math.max(1, Number(book.pages) || 1));
  slider.value = String(Math.min(Number(book.currentPage) || 0, Number(slider.max)));
  slider.setAttribute("aria-label", `Reading progress for ${book.title}`);

  const value = document.createElement("output");
  value.textContent = `${slider.value} / ${slider.max} pages`;
  slider.addEventListener("input", () => {
    value.textContent = `${slider.value} / ${slider.max} pages`;
  });
  slider.addEventListener("change", () => saveBookProgress(book.id, slider.value, slider));

  control.append(label, slider, value);
  return control;
}

function createBookActions(book, includeFinish = false) {
  const actions = document.createElement("div");
  actions.className = "book-actions";
  actions.appendChild(createEditButton(book));

  if (includeFinish) {
    const finishButton = document.createElement("button");
    finishButton.type = "button";
    finishButton.className = "mark-finished-btn";
    finishButton.textContent = "Mark as finished";
    finishButton.addEventListener("click", () => saveBookProgress(book.id, book.pages));
    actions.appendChild(finishButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-book-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", async () => {
    if (!confirm(`Delete “${book.title}” from your library?`)) return;
    try {
      await deleteBookOnServer(book.id);
      books = books.filter(item => item.id !== book.id);
      saveBooks();
      renderBooks();
    } catch (error) {
      alert(`Book could not be deleted: ${error.message}`);
    }
  });
  actions.appendChild(deleteButton);
  return actions;
}


/* =================================
   BOOKSHELF
================================= */

function navigateToBook(bookId) {
  const book = books.find(item => item.id === bookId);
  if (!book) return;

  const destinations = {
    current: { section: "current", selector: ".reading-card" },
    want: { section: "want", selector: ".want-card" },
    finished: { section: "finished", selector: ".finished-card" }
  };
  const destination = destinations[book.status];
  if (!destination) return;

  showSection(destination.section);
  closeMobileMenu();

  const target = [...document.querySelectorAll(destination.selector)]
    .find(card => card.dataset.bookId === bookId);
  if (!target) return;

  target.hidden = false;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("book-navigation-highlight");
    setTimeout(() => target.classList.remove("book-navigation-highlight"), 1400);
  });
}

function addBookToBookshelf(book) {
  const bookTile =
    document.createElement("div");

  bookTile.classList.add(
    "book-tile"
  );

  bookTile.dataset.bookId = book.id;
  bookTile.setAttribute("role", "button");
  bookTile.tabIndex = 0;
  const statusLabel = book.status === "current"
    ? "currently reading"
    : book.status === "finished" ? "finished" : "wishlist";
  bookTile.setAttribute("aria-label", `${book.title}, ${statusLabel}. Open book`);
  bookTile.addEventListener("click", () => navigateToBook(book.id));
  bookTile.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToBook(book.id);
    }
  });

  bookTile.dataset.genre =
  book.genre;

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

  card.dataset.bookId = book.id;

  card.dataset.genre =
  book.genre;

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


  /* ==============================
     BOOK INFORMATION
  ============================== */

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


  /* ==============================
     READING PROGRESS
  ============================== */

  const currentPage =
    Number(book.currentPage || 0);

  const totalPages =
    Number(book.pages || 1);

  const percentage =
    Math.min(
      100,
      Math.round(
        (currentPage / totalPages) * 100
      )
    );


  const progress =
    document.createElement("div");

  progress.classList.add(
    "progress"
  );

  const progressBar =
    document.createElement("span");
  
  progressBar.style.width =
    `${percentage}%`;

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
      `${currentPage} / ${totalPages} pages`
    );


  const percentLabel =
    createTextElement(
      "span",
      `${percentage}%`
    );


  progressLabels.appendChild(
    pageLabel
  );

  progressLabels.appendChild(
    percentLabel
  );


  /* ==============================
     BOOKMARK PAGE
  ============================== */

  const bookmarkArea =
    document.createElement("div");

  bookmarkArea.classList.add(
    "bookmark-area"
  );


  const bookmarkLabel =
    createTextElement(
      "label",
      "Current Page"
    );


  const bookmarkControls =
    document.createElement("div");

  bookmarkControls.classList.add(
    "bookmark-controls"
  );


  const pageInput =
    document.createElement("input");

  pageInput.type = "number";

  pageInput.min = "0";

  pageInput.max =
    totalPages;

  pageInput.value =
    currentPage;

  pageInput.classList.add(
    "bookmark-page-input"
  );


  const bookmarkButton =
    document.createElement("button");

  bookmarkButton.type =
    "button";

  bookmarkButton.classList.add(
    "bookmark-btn"
  );

  bookmarkButton.textContent =
    "Bookmark Page";


  bookmarkButton.addEventListener(
    "click",
    () => {
      const newPage = Math.max(0, Math.min(totalPages, Number(pageInput.value) || 0));
      saveBookProgress(book.id, newPage);
    }
  );


  bookmarkControls.appendChild(
    pageInput
  );

  bookmarkControls.appendChild(
    bookmarkButton
  );


  bookmarkArea.appendChild(
    bookmarkLabel
  );

  bookmarkArea.appendChild(
    bookmarkControls
  );


  /* ==============================
     EDIT BUTTON
  ============================== */

  const actions = createBookActions(book, true);


  /* ==============================
     BUILD CARD
  ============================== */

  info.appendChild(title);

  info.appendChild(author);

  info.appendChild(genre);

  info.appendChild(description);

  info.appendChild(progress);

  info.appendChild(progressLabels);

  info.appendChild(createProgressControl(book));

  info.appendChild(bookmarkArea);

  info.appendChild(actions);


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

  card.dataset.bookId = book.id;

  card.dataset.genre =
  book.genre;

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

  const actions = createBookActions(book);

  info.appendChild(title);
  info.appendChild(author);
  info.appendChild(genre);
  info.appendChild(description);
  info.appendChild(pageCount);
  info.appendChild(actions);

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

  card.dataset.bookId = book.id;

  card.dataset.genre =
  book.genre;

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

  const actions = createBookActions(book);

  card.appendChild(cover);
  card.appendChild(title);
  card.appendChild(author);
  card.appendChild(genre);
  card.appendChild(pageCount);
  card.appendChild(description);
  card.appendChild(actions);

  finishedList.appendChild(card);
}


/* =================================
   DASHBOARD CURRENT BOOK
================================= */

function showDashboardCurrentBook(book) {

  if (!currentCard || !book) {
    return;
  }

  currentCard.dataset.bookId = book.id;
  currentCard.setAttribute("role", "button");
  currentCard.tabIndex = 0;
  currentCard.setAttribute("aria-label", `${book.title}, currently reading. Open in Current Reads`);
  if (currentCard.dataset.navigationBound !== "true") {
    currentCard.addEventListener("click", () => {
      navigateToBook(currentCard.dataset.bookId);
    });
    currentCard.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToBook(currentCard.dataset.bookId);
      }
    });
    currentCard.dataset.navigationBound = "true";
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


  const currentPage =
    Number(book.currentPage || 0);

  const totalPages =
    Number(book.pages || 1);

  const percentage =
    Math.min(
      100,
      Math.round(
        (currentPage / totalPages) * 100
      )
    );


  if (cover) {
    cover.style.backgroundImage = book.cover && book.cover.trim()
      ? `url("${book.cover.trim()}")`
      : "";
    cover.classList.toggle("has-cover-image", Boolean(book.cover && book.cover.trim()));
    cover.classList.toggle("placeholder-cover", !book.cover || !book.cover.trim());

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
      `${currentPage} / ${totalPages} pages`;

  }


  if (progressBar) {

    progressBar.style.width =
      `${percentage}%`;

  }


  if (progressLabels.length >= 2) {

    progressLabels[0].textContent =
      `${percentage}%`;

    progressLabels[1].textContent =
      `${currentPage} / ${totalPages} pages`;

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
   GENRE FILTERS
================================= */

const genreFilters =
  document.querySelectorAll(
    ".genre-filter-select"
  );

const sortOptions = [
  ["title", "Title"],
  ["author", "Author"],
  ["recent", "Recently Added"],
  ["progress", "Progress"]
];

document.querySelectorAll(".genre-filter").forEach(filterGroup => {
  const section = filterGroup.querySelector("select")?.dataset.section;
  if (!section) return;
  const sortGroup = document.createElement("div");
  sortGroup.className = "genre-filter sort-filter";
  const label = document.createElement("label");
  label.textContent = "Sort by";
  label.htmlFor = `${section}-sort`;
  const select = document.createElement("select");
  select.id = `${section}-sort`;
  select.className = "sort-books-select";
  select.dataset.section = section;
  sortOptions.forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  });
  sortGroup.append(label, select);
  filterGroup.parentElement.appendChild(sortGroup);
  select.addEventListener("change", () => sortBooksInSection(section, select.value));
});

function getSectionContainer(section) {
  return {
    bookshelf: bookshelfGrid,
    current: readingList,
    want: wantList,
    finished: finishedList
  }[section];
}

function compareBooks(a, b, sort) {
  if (sort === "progress") {
    const progress = book => Number(book.pages) > 0 ? Number(book.currentPage || 0) / Number(book.pages) : 0;
    return progress(b) - progress(a);
  }
  if (sort === "recent") {
    return String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
      String(b.id).localeCompare(String(a.id));
  }
  return String(a[sort] || "").localeCompare(String(b[sort] || ""), undefined, { sensitivity: "base" });
}

function sortBooksInSection(section, sort = "title") {
  const container = getSectionContainer(section);
  if (!container) return;
  const sectionBooks = books
    .filter(book => section === "bookshelf" ||
      (section === "current" && book.status === "current") ||
      (section === "want" && book.status === "want") ||
      (section === "finished" && book.status === "finished"))
    .sort((a, b) => compareBooks(a, b, sort));

  sectionBooks.forEach(book => {
    const card = container.querySelector(`[data-book-id="${CSS.escape(book.id)}"]`);
    if (card) container.appendChild(card);
  });

  if (section === "bookshelf") {
    const addTile = container.querySelector(".add-tile");
    if (addTile) container.appendChild(addTile);
  }
}


/* =================================
   GET AVAILABLE GENRES
================================= */

function getAvailableGenres() {

  return [
    ...new Set(
      books
        .map(book => book.genre)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );
}


/* =================================
   POPULATE GENRE FILTERS
================================= */

function populateGenreFilters() {

  const genres =
    getAvailableGenres();

  genreFilters.forEach(select => {

    /*
       Remember the currently
       selected genre.
    */

    const previousValue =
      select.value || "all";


    /*
       Clear existing options.
    */

    select.innerHTML = "";


    /*
       Add "All Genres".
    */

    const allOption =
      document.createElement("option");

    allOption.value = "all";
    allOption.textContent =
      "All Genres";

    select.appendChild(allOption);


    /*
       Add every genre found
       in the book collection.
    */

    genres.forEach(genre => {

      const option =
        document.createElement("option");

      option.value = genre;
      option.textContent = genre;

      select.appendChild(option);

    });


    /*
       Restore the previous selection
       if that genre still exists.
    */

    const genreStillExists =
      [...select.options].some(
        option =>
          option.value === previousValue
      );

    select.value =
      genreStillExists
        ? previousValue
        : "all";

  });
}


/* =================================
   FILTER BOOKS BY GENRE
================================= */

function filterBooksByGenre(
  section,
  genre
) {

  /*
     MY BOOKSHELF
  */

  if (section === "bookshelf") {

    const bookTiles =
      bookshelfGrid.querySelectorAll(
        ".book-tile:not(.add-tile)"
      );

    bookTiles.forEach(tile => {

      const bookGenre =
        tile.dataset.genre;

      tile.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }


  /*
     CURRENT READS
  */

  if (section === "current") {

    const cards =
      readingList.querySelectorAll(
        ".reading-card"
      );

    cards.forEach(card => {

      const bookGenre =
        card.dataset.genre;

      card.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }


  /*
     WANT TO READ
  */

  if (section === "want") {

    const cards =
      wantList.querySelectorAll(
        ".want-card"
      );

    cards.forEach(card => {

      const bookGenre =
        card.dataset.genre;

      card.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }


  /*
     FINISHED BOOKS
  */

  if (section === "finished") {

    const cards =
      finishedList.querySelectorAll(
        ".finished-card"
      );

    cards.forEach(card => {

      const bookGenre =
        card.dataset.genre;

      card.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }
}


/* =================================
   FILTER CHANGE EVENT
================================= */

genreFilters.forEach(select => {

  select.addEventListener(
    "change",
    () => {

      filterBooksByGenre(
        select.dataset.section,
        select.value
      );

    }
  );

});

/* =================================
   RENDER ALL BOOKS
================================= */

function renderBooks() {

  const uniqueBooks = deduplicateBooks(books.map(normalizeBookProgress));
  if (uniqueBooks.length !== books.length) {
    books = uniqueBooks;
    saveBooks();
  }

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
  populateGenreFilters();

  document.querySelectorAll(".sort-books-select").forEach(select => {
    sortBooksInSection(select.dataset.section, select.value);
  });

  genreFilters.forEach(select => {

    filterBooksByGenre(
      select.dataset.section,
      select.value
    );

  });

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
  } else {
    currentCard.removeAttribute("data-book-id");
    currentCard.removeAttribute("role");
    currentCard.removeAttribute("aria-label");
    currentCard.tabIndex = -1;
    currentCard.querySelector("h2").textContent = "No current book yet";
    currentCard.querySelector(".book-author").textContent = "";
    currentCard.querySelector(".book-genre").textContent = "";
    currentCard.querySelector(".description").textContent = "";
    currentCard.querySelector(".pages").textContent = "0 / 0 pages";
    currentCard.querySelector(".cover").style.backgroundImage = "";
    currentCard.querySelector(".progress span").style.width = "0%";
    const labels = currentCard.querySelectorAll(".progress-labels span");
    if (labels.length >= 2) {
      labels[0].textContent = "0%";
      labels[1].textContent = "0 / 0 pages";
    }
  }
}


/* =================================
   ADD / EDIT BOOK
================================= */

addBookForm.addEventListener("submit", async event => {
  event.preventDefault();

  const formBook = getBookFromForm();

  try {
    /* EDIT EXISTING BOOK */
    if (editingBookId) {
      const bookIndex = books.findIndex(
        book => book.id === editingBookId
      );

      if (bookIndex !== -1) {
        const previousBook = { ...books[bookIndex] };
        books[bookIndex] = {
          ...books[bookIndex],
          ...formBook
        };
        books[bookIndex] = await updateBookOnServer(books[bookIndex], previousBook);
      }
    }

    /* ADD NEW BOOK */
    else {
      const newBook = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...formBook
      };

      // Save to books.json through the server.
      const savedBook = await saveNewBookToServer(newBook);

      // Use the book returned by the server.
      books.push(savedBook);
    }

    saveBooks();
    renderBooks();
    closeAddBookForm();

  } catch (error) {
    console.error("Failed to save book:", error);

    alert(
      `Could not save book: ${error.message}`
    );
  }
});

/* =================================
   STAT CARD NAVIGATION
================================= */

const statCards =
  document.querySelectorAll(".stat-card");

statCards.forEach(card => {

  card.addEventListener("click", () => {

    const sectionId =
      card.dataset.section;

    if (!sectionId) {
      return;
    }

    showSection(sectionId);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


/* =================================
   SEARCH OVERLAY CONTROLS
================================= */

const searchBtn = document.getElementById("search-btn");
const searchOverlay = document.getElementById("search-overlay");
const closeSearchBtn = document.getElementById("close-search-btn");
const bookSearchInput = document.getElementById("book-search-input");
const searchResults = document.getElementById("search-results");
const mobileBookSearchInput = document.getElementById("mobile-book-search-input");
const mobileSearchResults = document.getElementById("mobile-search-results");
let searchRequestController;
let searchDebounce;

function showSearchMessage(message, target = searchResults) {
  if (target === mobileSearchResults) target.hidden = false;
  const status = document.createElement("p");
  status.className = "search-empty-state";
  status.textContent = message;
  target.replaceChildren(status);
}

function renderSearchResults(books, target = searchResults) {
  if (!books.length) {
    showSearchMessage("No books found. Try another title, author, or genre.", target);
    return;
  }

  const fragment = document.createDocumentFragment();
  books.forEach(book => {
    const result = document.createElement("article");
    result.className = "search-result-card";
    result.setAttribute("role", "button");
    result.tabIndex = 0;
    const localBook = booksForNavigation(book);
    const statusLabel = localBook
      ? localBook.status === "current" ? "Currently Reading"
        : localBook.status === "finished" ? "Finished Books" : "Want to Read"
      : "Book details";
    result.setAttribute("aria-label", `${book.title}. ${statusLabel}. Open book`);
    result.addEventListener("click", () => openBookFromSearch(book));
    result.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openBookFromSearch(book);
      }
    });

    const cover = document.createElement("div");
    cover.className = "search-result-cover";
    if (book.cover && book.cover.trim()) {
      cover.style.backgroundImage = `url("${book.cover.trim()}")`;
      cover.classList.add("has-cover-image");
    } else {
      cover.classList.add("placeholder-cover");
    }
    cover.setAttribute("aria-hidden", "true");

    const details = document.createElement("div");
    details.className = "search-result-details";
    const title = document.createElement("h3");
    title.textContent = book.title;
    const metadata = document.createElement("p");
    metadata.textContent = [book.author, book.genre, statusLabel].filter(Boolean).join(" · ");

    details.append(title, metadata);
    result.append(cover, details);
    fragment.append(result);
  });

  if (target === mobileSearchResults) target.hidden = false;
  target.replaceChildren(fragment);
}

function booksForNavigation(book) {
  return books.find(item => item.id === book.id) || books.find(item =>
    String(item.title || "").trim().toLocaleLowerCase() === String(book.title || "").trim().toLocaleLowerCase() &&
    String(item.author || "").trim().toLocaleLowerCase() === String(book.author || "").trim().toLocaleLowerCase()
  );
}

function openBookFromSearch(book) {
  const localBook = booksForNavigation(book);
  if (!localBook) {
    showSearchMessage("This book is not in your bookshelf yet.");
    return;
  }

  if (searchOverlay.classList.contains("visible-page")) closeSearch();
  navigateToBook(localBook.id);
}

async function searchBooks(query, target = searchResults) {
  searchRequestController?.abort();
  if (!query) {
    if (target === mobileSearchResults) {
      target.replaceChildren();
      target.hidden = true;
    } else {
      showSearchMessage("Start typing to find a book.", target);
    }
    return;
  }

  const controller = new AbortController();
  searchRequestController = controller;
  showSearchMessage("Searching your bookshelf…", target);

  try {
    const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    });
    if (!response.ok) throw new Error("Search request failed");
    const { results } = await response.json();
    if (!controller.signal.aborted) renderSearchResults(results, target);
  } catch (error) {
    if (error.name !== "AbortError") {
      showSearchMessage("Search is unavailable right now. Please try again.", target);
    }
  }
}

bookSearchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  const query = bookSearchInput.value.trim();
  searchDebounce = setTimeout(() => searchBooks(query), 180);
});

mobileBookSearchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  const query = mobileBookSearchInput.value.trim();
  searchDebounce = setTimeout(() => searchBooks(query, mobileSearchResults), 180);
});

function openSearch() {
  searchOverlay.classList.remove("invisible-page");
  searchOverlay.classList.add("visible-page");

  document.body.style.overflow = "hidden";

  bookSearchInput.focus();
  searchBooks(bookSearchInput.value.trim());
}

function closeSearch() {
  clearTimeout(searchDebounce);
  searchRequestController?.abort();
  searchOverlay.classList.remove("visible-page");
  searchOverlay.classList.add("invisible-page");

  document.body.style.overflow = "";

  searchBtn.focus();
}

searchBtn.addEventListener("click", openSearch);
closeSearchBtn.addEventListener("click", closeSearch);

// Close when clicking the dark backdrop.
searchOverlay.addEventListener("click", event => {
  if (event.target === searchOverlay) {
    closeSearch();
  }
});

// Close with Escape.
document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    searchOverlay.classList.contains("visible-page")
  ) {
    closeSearch();
  }
});


/* =================================
   INITIALIZE
================================= */

renderBooks();
loadAuthState();



/* DARK MODE SETTING */
const darkModeToggle = document.getElementById("dark-mode-toggle");

if (darkModeToggle) {
  const savedTheme = localStorage.getItem("bookworm-theme");
  if (savedTheme === "dark") document.body.classList.add("dark-mode");

  function updateDarkModeButton() {
    const isDark = document.body.classList.contains("dark-mode");
    darkModeToggle.querySelector("span").textContent = isDark ? "\u2600" : "\u263e";
    darkModeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    darkModeToggle.title = `Switch to ${isDark ? "light" : "dark"} mode`;
    darkModeToggle.setAttribute("aria-pressed", String(isDark));
  }

  updateDarkModeButton();
  darkModeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("bookworm-theme", isDark ? "dark" : "light");
    updateDarkModeButton();
  });
}
