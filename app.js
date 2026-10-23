const express = require('express');
const app = express();
const port = 3000;

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const bookwormPath = path.join(__dirname, "index.html");
const streakPath = path.join(__dirname, "data", "streak.json");
const authDirectory = path.join(__dirname, "data", ".auth");
const usersPath = path.join(authDirectory, "users.json");
const sessionsPath = path.join(authDirectory, "sessions.json");
const userBooksDirectory = path.join(authDirectory, "books");

async function getBooksForRequest(req) {
  const user = findAuthenticatedUser(req);
  if (!user) return { user: null, books: [] };

  const userBooksPath = path.join(userBooksDirectory, `${user.id}.json`);
  try {
    const storedBooks = JSON.parse(await fs.promises.readFile(userBooksPath, 'utf8'));
    const books = Array.isArray(storedBooks) ? storedBooks.filter(book => book?.default !== true) : [];
    if (!Array.isArray(storedBooks) || books.length !== storedBooks.length) {
      await saveBooksForUser(user, books);
    }
    return { user, books };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const emptyBooks = [];
    await fs.promises.mkdir(userBooksDirectory, { recursive: true });
    await fs.promises.writeFile(userBooksPath, JSON.stringify(emptyBooks, null, 2) + "\n", "utf8");
    return { user, books: emptyBooks };
  }
}

async function saveBooksForUser(user, books) {
  await fs.promises.mkdir(userBooksDirectory, { recursive: true });
  await fs.promises.writeFile(
    path.join(userBooksDirectory, `${user.id}.json`),
    JSON.stringify(books, null, 2) + "\n",
    "utf8"
  );
}
const sessionCookie = 'bookworm_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

app.use(express.static(__dirname));
app.use(express.json({ limit: '10kb' }));

function readAuthFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function writeAuthFile(filePath, data) {
  fs.mkdirSync(authDirectory, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function getSessionToken(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.map(cookie => cookie.trim()).find(cookie => cookie.startsWith(`${sessionCookie}=`));
  return entry ? decodeURIComponent(entry.slice(sessionCookie.length + 1)) : '';
}

function cleanExpiredSessions(sessions) {
  const now = Date.now();
  return sessions.filter(session => session.expiresAt > now);
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationMs / 1000}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function findAuthenticatedUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = cleanExpiredSessions(readAuthFile(sessionsPath));
  const session = sessions.find(item => item.tokenHash === tokenHash);
  if (!session) return null;
  const users = readAuthFile(usersPath);
  return users.find(user => user.id === session.userId) || null;
}

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!name || name.length > 80) return res.status(400).json({ error: 'Enter a name up to 80 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const users = readAuthFile(usersPath);
    if (users.some(user => user.email === email)) return res.status(409).json({ error: 'An account with that email already exists.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    const user = { id: crypto.randomUUID(), name, email, salt, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    writeAuthFile(usersPath, users);

    const token = crypto.randomBytes(32).toString('base64url');
    const sessions = cleanExpiredSessions(readAuthFile(sessionsPath));
    sessions.push({ tokenHash: crypto.createHash('sha256').update(token).digest('hex'), userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    writeAuthFile(sessionsPath, sessions);
    setSessionCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error('Account registration failed:', error);
    res.status(500).json({ error: 'Could not create your account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  try {
    const users = readAuthFile(usersPath);
    const user = users.find(item => item.email === email);
    if (!user || password.length > 200) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const passwordHash = await scrypt(password, user.salt, 64);
    const storedHash = Buffer.from(user.passwordHash, 'hex');
    if (storedHash.length !== passwordHash.length || !crypto.timingSafeEqual(storedHash, passwordHash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const sessions = cleanExpiredSessions(readAuthFile(sessionsPath));
    sessions.push({ tokenHash: crypto.createHash('sha256').update(token).digest('hex'), userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    writeAuthFile(sessionsPath, sessions);
    setSessionCookie(res, token);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Could not log in right now.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const user = findAuthenticatedUser(req);
    res.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    console.error('Could not read login session:', error);
    res.status(500).json({ error: 'Could not check login status.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const token = getSessionToken(req);
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const sessions = cleanExpiredSessions(readAuthFile(sessionsPath)).filter(session => session.tokenHash !== tokenHash);
      writeAuthFile(sessionsPath, sessions);
    }
    clearSessionCookie(res);
    res.json({ user: null });
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).json({ error: 'Could not log out right now.' });
  }
});

function readStreakData() {
  try {
    const data = JSON.parse(fs.readFileSync(streakPath, 'utf8'));
    return {
      activityDates: Array.isArray(data.activityDates) ? data.activityDates : [],
      longestStreak: Number(data.longestStreak) || 0
    };
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not read streak data:', error);
    return { activityDates: [], longestStreak: 0 };
  }
}

function dateDifference(from, to) {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
}

function streakSummary(data, today) {
  const dates = [...new Set(data.activityDates)].sort();
  const lastReadDate = dates.at(-1) || null;
  const gap = lastReadDate ? dateDifference(lastReadDate, today) : null;
  const isBroken = gap !== null && gap > 1;
  let currentStreak = 0;

  if (lastReadDate && !isBroken) {
    currentStreak = 1;
    for (let index = dates.length - 1; index > 0; index -= 1) {
      if (dateDifference(dates[index - 1], dates[index]) !== 1) break;
      currentStreak += 1;
    }
  }

  return {
    currentStreak,
    longestStreak: data.longestStreak,
    lastReadDate,
    activityDates: dates,
    readToday: dates.includes(today),
    status: isBroken ? 'broken' : currentStreak ? 'active' : 'new'
  };
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function saveStreakData(data) {
  fs.writeFileSync(streakPath, JSON.stringify(data, null, 2));
}

app.get('/api/streak', (req, res) => {
  if (!findAuthenticatedUser(req)) return res.status(401).json({ error: 'Log in to view your reading streak.' });
  const today = String(req.query.today || '');
  if (!isDate(today)) return res.status(400).json({ error: 'A valid local date is required.' });
  res.json(streakSummary(readStreakData(), today));
});

app.post('/api/streak/activity', (req, res) => {
  if (!findAuthenticatedUser(req)) return res.status(401).json({ error: 'Log in to save reading activity.' });
  const { date } = req.body || {};
  if (!isDate(date)) return res.status(400).json({ error: 'A valid reading date is required.' });

  try {
    const data = readStreakData();
    data.activityDates = [...new Set([...data.activityDates, date])].sort();
    let run = 0;
    for (let index = 0; index < data.activityDates.length; index += 1) {
      run = index > 0 && dateDifference(data.activityDates[index - 1], data.activityDates[index]) === 1
        ? run + 1
        : 1;
      data.longestStreak = Math.max(data.longestStreak, run);
    }
    saveStreakData(data);
    res.json(streakSummary(data, date));
  } catch (error) {
    console.error('Could not save reading activity:', error);
    res.status(500).json({ error: 'Could not save reading activity.' });
  }
});

app.get('/api/books/search', async (req, res) => {
  if (!findAuthenticatedUser(req)) {
    return res.status(401).json({ error: 'Log in to search your books.' });
  }
  const query = String(req.query.q || '').trim().slice(0, 100);

  if (!query) {
    return res.json({ results: [] });
  }

  try {
    const { books } = await getBooksForRequest(req);
    const needle = query.toLocaleLowerCase();
    const results = deduplicateServerBooks(books).filter(book =>
      [book.title, book.author, book.genre]
        .some(value => String(value || '').toLocaleLowerCase().includes(needle))
    );
    res.json({ results });
  } catch (error) {
    console.error('Could not search books:', error);
    res.status(500).json({ error: 'Book search is unavailable.' });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    const { user, books } = await getBooksForRequest(req);
    if (!user) return res.status(401).json({ error: "Log in to view your books." });
    res.json(books);
  } catch (error) {
    console.error("Failed to read books:", error);
    res.status(500).json({ error: "Could not load books." });
  }
});

function deduplicateServerBooks(books) {
  const seen = new Set();
  return books.filter(book => {
    const key = `${String(book.title || '').trim().toLocaleLowerCase()}|${String(book.author || '').trim().toLocaleLowerCase()}`;
    if (!key.split('|')[0] || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Add a new book and save it to books.json
app.post("/api/books", async (req, res) => {
  try {
    const { user } = await getBooksForRequest(req);
    if (!user) return res.status(401).json({ error: "Log in to save books to your account." });
    const {
      title,
      author,
      genre,
      pages,
      currentPage,
      cover,
      description,
      status
    } = req.body;

    if (
      typeof title !== "string" || !title.trim() ||
      typeof author !== "string" || !author.trim() ||
      typeof genre !== "string" || !genre.trim()
    ) {
      return res.status(400).json({
        error: "Title, author, and genre are required."
      });
    }

    const totalPages = Number(pages);
    const page = Number(currentPage ?? 0);

    if (
      !Number.isSafeInteger(totalPages) ||
      totalPages < 1 ||
      !Number.isSafeInteger(page) ||
      page < 0 ||
      page > totalPages
    ) {
      return res.status(400).json({
        error: "Page numbers are invalid."
      });
    }

    const allowedStatuses = ["want", "current", "finished"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid reading status."
      });
    }

    const books = deduplicateServerBooks((await getBooksForRequest(req)).books);

    const duplicateSafeBooks = books;

    const newBook = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      pages: totalPages,
      currentPage:
        status === "want" ? 0 :
        status === "finished" ? totalPages :
        Math.max(1, page),
      cover: typeof cover === "string" ? cover.trim() : "",
      description:
        typeof description === "string" ? description.trim() : "",
      status,
      default: false
    };

    if (books.some(book =>
      String(book.title).trim().toLocaleLowerCase() === newBook.title.toLocaleLowerCase() &&
      String(book.author).trim().toLocaleLowerCase() === newBook.author.toLocaleLowerCase()
    )) {
      return res.status(409).json({ error: "That book is already in the library." });
    }

    duplicateSafeBooks.push(newBook);

    await saveBooksForUser(user, duplicateSafeBooks);

    res.status(201).json(newBook);
  } catch (error) {
    console.error("Failed to save book:", error);
    res.status(500).json({
      error: "Could not save the book."
    });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const { user } = await getBooksForRequest(req);
    if (!user) return res.status(401).json({ error: "Log in to update books." });
    const input = req.body || {};
    const title = String(input.title || '').trim();
    const author = String(input.author || '').trim();
    const genre = String(input.genre || '').trim();
    const pages = Number(input.pages);
    const currentPage = Number(input.currentPage ?? 0);

    if (!title || !author || !genre || !Number.isSafeInteger(pages) || pages < 1 ||
        !Number.isSafeInteger(currentPage) || currentPage < 0 || currentPage > pages) {
      return res.status(400).json({ error: 'Book details or page numbers are invalid.' });
    }

    const status = currentPage === 0 ? 'want' : currentPage >= pages ? 'finished' : 'current';
    const books = deduplicateServerBooks((await getBooksForRequest(req)).books);
    const requestedId = String(req.params.id);
    let index = books.findIndex(book => book.id === requestedId);
    if (index === -1 && input.previousTitle && input.previousAuthor) {
      index = books.findIndex(book =>
        String(book.title).trim().toLocaleLowerCase() === String(input.previousTitle).trim().toLocaleLowerCase() &&
        String(book.author).trim().toLocaleLowerCase() === String(input.previousAuthor).trim().toLocaleLowerCase()
      );
    }
    if (index === -1) return res.status(404).json({ error: 'Book was not found in books.json.' });

    const updatedBook = {
      ...books[index],
      title,
      author,
      genre,
      pages,
      currentPage,
      status,
      cover: typeof input.cover === 'string' ? input.cover.trim() : '',
      description: typeof input.description === 'string' ? input.description.trim() : ''
    };
    books[index] = updatedBook;
    await saveBooksForUser(user, books);
    res.json(updatedBook);
  } catch (error) {
    console.error('Failed to update book:', error);
    res.status(500).json({ error: 'Could not update the book.' });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const { user, books } = await getBooksForRequest(req);
    if (!user) return res.status(401).json({ error: "Log in to remove books." });
    const index = books.findIndex(book => String(book.id) === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Book was not found." });

    books.splice(index, 1);
    await saveBooksForUser(user, books);
    res.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete book:", error);
    res.status(500).json({ error: "Could not remove the book." });
  }
});

app.get('/', (req, res) => {
  res.sendFile(bookwormPath);
});

app.get('/about', (req, res) => {
  res.send('About Hello World!');
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
