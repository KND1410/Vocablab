# 📚 VocabLab

**Live app: <https://vocablab-one.vercel.app>** — no install, nothing to run.

Turn a **Google Sheet of vocabulary** into AI-generated quizzes: multiple choice,
fill-in-the-blank, typed translation, whole-paragraph translation and **shadowing**
with pronunciation feedback. Built for learning **French** (Vietnamese meanings
out of the box), but works with any language.

- Every **tab** of your sheet becomes a **topic**.
- Questions are written by an **AI model** — a free keyless model works out of the
  box (no account, no key), or bring your own key for Google Gemini, Groq,
  Cerebras, OpenRouter, Mistral, DeepSeek, xAI Grok, Cloudflare or a local
  Ollama — with a solid built-in generator when AI is unavailable.
- **Daily quests + streak**: the home page greets you, shows the date, and picks
  three small daily quests — one quiz, one production (paragraph or shadowing) and
  one review (flashcards or grammar). Finish any one to extend your streak — the
  other two are optional; one missed day is a grace day (the flame shows a **!**),
  two resets it. Progress is
  filled HP-style as you practise, and every quest's **Start** jumps straight into
  that exact practice. Click the **VocabLab logo** (or **Home** on the results
  screen) to return to the dashboard and see the updated quest bars.
- **Accounts**: email + password, with your name and a one-time recovery code (no
  email service needed). The whole app is behind the login screen. Name, daily
  quests and streak sync to **your own MongoDB Atlas database** through `/api`;
  the deck, mastery, grammar progress, settings and recordings stay local.
- **Grammar → two courses**: **French Tenses Atlas**, an 18-chapter DELF B2 tenses course
  (`js/grammar-data.js`), and **Grammaire progressive du français**, the 52 teaching
  chapters of the *Grammaire progressive du français, niveau intermédiaire (3e
  édition)* (`js/grammar-handbook.js`). Each has a course map, bilingual
  Vietnamese/English explanations, tables, short exercises and a lesson-aware AI
  tutor, and each keeps its own progress in this browser. The source PDFs stay local.- **Full-screen pages** behind hash routes — `#/home`, `#/files`, `#/lessons`,
  `#/practice`, `#/exam`, `#/community`, `#/progress`. Every existing feature lives
  on one of them; Exam holds a full DELF B2 white paper and Community is a finished
  placeholder until it is defined. A deep link survives a reload, and the sidebar
  marks the current page.
  The class file itself (source, reload, topics) is shown straight on the home page,
  so there is no separate Files entry in the sidebar — `#/files` still opens the same
  cards in their own page.
- **Interface language**: English (default), Vietnamese or French, from the sidebar
  selector. Every string — navigation, settings, dialogs and the whole Help guide —
  follows it, and the choice is saved in your browser. Lesson and deck content stays
  in its own language.
- **Level up (B1/B2)**: after a *perfect* Vietnamese → target paragraph, or a correct
  typed Vietnamese → target quiz answer, VocabLab offers up to 12 optional B1/B2
  upgrades, B2 first. Each one shows the original wording highlighted in your own
  text next to the suggested replacement, so nothing is rewritten behind your back:
  apply one, or **Apply all safe**. Single words are checked against
  [FreeDictionaryAPI](https://freedictionaryapi.com/) and then Wiktionary (data
  licensed CC BY-SA 4.0); a phrase or sentence is labelled as an AI suggestion.
  Nothing is ever applied automatically.
- No build step: static files plus Vercel serverless functions. The optional Azure
  Speech SDK is loaded from a pinned CDN only when you use the cloud voice or Azure
  pronunciation scoring; Gemini scoring uses your existing AI key.

```
language/
├── index.html          the app + auth screen + home dashboard
├── css/styles.css      styles (light/dark)
├── js/util.js          helpers + storage
├── js/demo.js          built-in French demo deck (36 words)
├── js/sources.js       Google Sheet loading + table parsing
├── js/ai.js            Gemini + OpenAI-compatible clients (JSON mode, retries)
├── js/generator.js     built-in offline question generator
├── js/quiz.js          selection, batching, caching, grading, mastery
├── js/quests.js        shared quest definitions, daily picker, progress, streak
├── js/account.js       auth client, local home cache, offline progress queue
├── js/speech.js        Azure neural TTS, pronunciation assessment, local recordings
├── js/grammar-data.js  18-chapter French Tenses Atlas (bilingual data)
├── js/grammar-handbook.js 52-chapter Grammaire progressive course (book lessons)
├── js/grammar.js       course map, lessons, exercises, progress, AI tutor
├── js/i18n.js          UI language catalogues (EN/VI/FR) + static text mapping
├── js/i18n-strings-vi.js / -fr.js  translated markup and Help text
├── js/dict.js          dictionary client: FreeDictionaryAPI → Wiktionary → AI
├── js/app.js           UI wiring, routes, dashboard, quest hooks
├── api/                Vercel functions: auth, home, progress, profile
├── lib/                Mongo client, scrypt/session helpers, daily/streak logic
├── scripts/init-db.mjs creates the Atlas indexes
├── scripts/dev-server.mjs local app + api server (no Vercel, no MongoDB)
├── my-sheet.txt.example  template for your own link list (copy to my-sheet.txt)
├── sample-sheet.csv    example of the sheet format
├── tests/run-tests.mjs logic + API tests (node tests/run-tests.mjs)
├── tests/browser-smoke.mjs real-UI test in headless Chrome
└── tests/e2e/          Playwright suite (npm run test:e2e) + its in-memory server
```

---

## 1 · Run it

**Hosted:** <https://vocablab-one.vercel.app> — Vercel serves the static app and
the `/api` functions. The account data goes to the MongoDB Atlas database set in
`MONGODB_URI`.

The app now needs its API for login. A static-only host (GitHub Pages, Netlify
Drop, Cloudflare Pages, `python3 -m http.server`) can still show the interface,
but the sign-in screen will report that the account server is unreachable.

### Locally, with no database (fastest)

```bash
npm install
npm run dev:local      # open http://localhost:3000
```

`scripts/dev-server.mjs` is a small Node server that serves the app **and** the
same `api/` handlers Vercel runs — no Vercel login required. When `MONGODB_URI`
is not set, accounts, daily quests and streaks live in `.data/local-db.json`
(git-ignored, scrypt-hashed), so sign-up and sign-in work without MongoDB Atlas.
Use `PORT=4000` to pick another port.

- `VOCABLAB_DB_MODE=local` forces the local file store **even when a
  `MONGODB_URI` is configured** — useful when Atlas is unreachable from this
  machine.
- Putting `MONGODB_URI` in `.env.local` switches you back to MongoDB on the next
  run. The two stores never share data.

### Locally (full app)

1. Install the one server dependency:

   ```bash
   npm install
   ```

2. Create a free **MongoDB Atlas M0** cluster and a database user, allow your IP
   under **Network Access**, then copy the connection string:

   ```bash
   cp .env.example .env.local
   # edit .env.local and paste MONGODB_URI; never commit this file
   ```

   The database name is `vocablab` (override with `MONGODB_DB`).

3. Create the indexes once:

   ```bash
   npm run db:init
   ```

4. Run the Vercel dev server (the API needs it; `python3 -m http.server` alone
   cannot sign anyone in):

   ```bash
   npx vercel dev        # or: npm run dev
   # open http://localhost:3000
   ```

### Deploy

- Import the repo in Vercel. The `api/` folder is detected automatically; there is
  no build command.
- Add `MONGODB_URI` (and optionally `MONGODB_DB`) to **Production** and
  **Preview** environment variables, then deploy.
- Atlas network access must allow Vercel's egress. `0.0.0.0/0` is the simple
  option; restrict it if you prefer.
- If a connection string has ever been pasted into a chat, a ticket or a
  screenshot, rotate that Atlas user's password in **Database Access** and update
  `MONGODB_URI` in Vercel and `.env.local`.

---

## 2 · Your Google Sheet

### Sheet layout

One tab per topic (Travel, Work, …). First row = headers (recommended).
Only the first two columns are required; extras are optional:

| Column | Names recognised (diacritics-insensitive) | Used for |
|---|---|---|
| **Vocab** *(required)* | `Vocab`, `Word`, `Term`, `Français`, `French`, `Tiếng Pháp`, `Tiếng …` (any language), `Từ vựng`… | the word/phrase you learn |
| **Vietnamese** *(required)* | `Vietnamese`, `Vietnamien`, `Meaning`, `Nghĩa`, `Nghĩa tiếng Việt`, `Tiếng Việt`… | the meaning |
| Pronunciation | `Pronunciation`, `Phát âm`, `IPA`, `Pinyin`… | spoken hint on the word card |
| Example | `Example`, `Ví dụ`, `Ví dụ đơn giản`, `Sentence`… | shown on the card + used for cloze |
| Part of speech | `POS`, `Part of speech`, `Từ loại`, `Giống / Từ loại`… | smarter distractors |
| Note / Level | `Note`, `Level`, `Unit`, `Ghi chú`… | extra info |

- No header row? VocabLab assumes column 1 = vocab, column 2 = Vietnamese.
- Empty rows, duplicate rows and repeated header rows are skipped.
- **Label rows are skipped**: rows with no meaning, or whose word/meaning contains
  an emoji (e.g. `🟢 Nhảy tới B1 (42 từ)` navigation links), are treated as
  decoration, not vocabulary.
- Hidden tabs and chart tabs are skipped.

**How it is read:** by fixed rules, not by AI. The header row is matched against
the names above (accent/case-insensitive), then the first two usable columns are
used as word and meaning; the AI only writes questions *from* the words it is
given and never guesses your columns. So any plain table works — extra columns,
section-title rows, or no header at all. Limits: 6 000 rows per tab, 160
characters per word, 400 per meaning.

See `sample-sheet.csv` for an example (French → Vietnamese).

### Connect it — pick one option

#### Option A — Google Sheets API key (automatic, needs a key)

1. In the sheet: **Share → Anyone with the link → Viewer**.
2. Open [Google Cloud → Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
   and click **Enable** (free).
3. **Credentials → Create credentials → API key**, copy it.
4. In VocabLab: **Settings ⚙ → Google Sheet → Google Sheets API**, paste the sheet
   link + the API key, press **Load all tabs**.

Every tab loads automatically. (This key is *not* the Gemini key — it is only for
reading Sheets.) Can't or don't want to create a key? **Option C does the same
without any key.**

#### Option B — Apps Script web app (no Google Cloud account)

1. In the sheet: **Extensions → Apps Script**, paste this, save:

```javascript
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = ss.getSheets().map(function (sh) {
    return {
      title: sh.getName(),
      values: sh.getDataRange().getDisplayValues()
    };
  });
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
```

2. **Deploy → New deployment → Web app**. Execute as: **Me**, access: **Anyone**.
   Authorise it, copy the `/exec` URL.
3. In VocabLab: **Settings → Google Sheet → Apps Script web app**, paste the URL,
   press **Load all tabs**.

The same in-app instructions (with a copy button) are in the **?** Help dialog.

#### Option C — Sheet link, no key (easiest, recommended)

1. In the sheet: **Share → Anyone with the link → Viewer**.
2. In VocabLab: **Settings → Google Sheet → ⭐ Sheet link — no key**, paste your
   sheet link, press **Load sheet**.

That's it. VocabLab downloads the sheet's own preview, reads the tab list from it
and loads every tab as a topic — no API key, no Apps Script, no “Publish to web”.
**New tabs are picked up automatically**: press **↻ Reload** and they appear.
(Handy: `my-sheet.txt.example` shows the format — copy it to `my-sheet.txt` and
paste your own link; that file is git-ignored, it is yours.)

Optional extras:

- Put tab names on separate lines under the link to load **only those tabs**.
- `Topic name | URL` lines also work: published-to-web CSV links, gviz links, or
  tab links containing `#gid=…`.

Things to know:

- **New words in existing tabs** — just press **↻ Reload**. New/renamed topics are
  selected automatically; the topics you deselected stay deselected.
- If discovery fails (old browser, offline), the tab list from the **last load** of
  that sheet is reused — including a tab-name list you typed once — and a single
  note explains what happened (also kept in **Settings → Google Sheet**).
- If the preview download is blocked, VocabLab asks the public
  **[r.jina.ai](https://r.jina.ai)** reader for the same tab list — still no key and
  nothing to type. That reader is a free third-party service, so treat it as
  best-effort: if it is unreachable the remembered tab list is used, and failing
  that you get one honest “first tab only” note.
- If the browser blocks requests to Google (for example a strict ad blocker),
  VocabLab retries the words themselves with a **script-tag (JSONP) method**, which
  does not need a server.
- Loaded decks are **cached in the browser**, so the app opens instantly and works
  offline afterwards.

---

## 3 · AI questions (free models)

Open **Settings → AI**. There are two modes, both stored only in your browser:

- **Simple** *(default)* — pick a free model and go. **No account, no API key.**
  It uses a shared public AI service limited to **one request every 30 seconds**;
  VocabLab batches up to 20 words per request and automatically waits for the next
  free slot (a paragraph costs one request to write and one per correction check,
  up to the retry limit). For heavy
  use, switch to Advanced.
- **Advanced** — choose any provider below and paste your own key. Requests then
  go straight from your browser to that provider, with no shared queue.

Each provider remembers its own base URL, key and model, so you can switch back
and forth without retyping anything.

| Provider | Free tier | Base URL (OpenAI-compatible mode) | Key from |
|---|---|---|---|
| **Free AI** *(Simple mode)* | shared, keyless, no sign-up — one request per 30 s | `https://text.pollinations.ai/openai` | — none |
| **Google Gemini** *(first in Advanced)* | Flash models, daily allowance **per project** | built in — select *Google Gemini* | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Groq** | ~30 req/min · 1000 req/day · very fast — **not** xAI's Grok | `https://api.groq.com/openai/v1` | [console.groq.com/keys](https://console.groq.com/keys) — keys look like `gsk_…`, 56 characters |
| **Cerebras** | free trial credit, then pay as you go · fastest | `https://api.cerebras.ai/v1` | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **OpenRouter** | every model ending in `:free` + the `openrouter/free` router | `https://openrouter.ai/api/v1` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Mistral** | free “Experiment” plan | `https://api.mistral.ai/v1` | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |
| **DeepSeek** | paid — no free tier, but only cents per quiz | `https://api.deepseek.com/v1` | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| **xAI Grok** | $25 promotional credit, then per token — the *other* “Grok” | `https://api.x.ai/v1` | [console.x.ai](https://console.x.ai) — keys look like `xai-…` |
| **Cloudflare Workers AI** | daily free allowance | `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1` | Cloudflare dashboard |
| **Ollama (local)** | free forever, **no key** — but the app must be installed and running on your computer | `http://localhost:11434/v1` | — |
| **Other OpenAI-compatible** | whatever that service offers | paste any base URL | that service |

Picking one fills in its Base URL and a current default model; press **Test &
load models** to replace that with whatever the provider really serves right now
(the model box is a searchable list). The line under the menu says where to get
the key and what the offer actually is — free, free trial, or paid. Ran out of
Gemini's daily quota? Pick another provider instead of making a new project:
Groq, Cerebras and OpenRouter have free tiers of their own, and a `429` offers a
one-click switch.

**Google Gemini (first in Advanced):** get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey),
paste it, press **Test key & load models**.

**Groq / Cerebras / OpenRouter / Mistral / DeepSeek / xAI Grok / Cloudflare:** pick the
provider, paste its key, press **Test & load models**. For Cloudflare, put your
account ID where the preset says `REPLACE_WITH_ACCOUNT_ID`.

**Ollama (fully local, private)** — install it first
([ollama.com/download](https://ollama.com/download)); it is a program on your own
computer, not a web service, and VocabLab can't start it for you:

```bash
ollama serve                      # start it (OLLAMA_ORIGINS=* lets the browser call it)
ollama pull llama3.2              # or any model you like
```

then pick the *Ollama (local app)* provider (no API key needed). Check it works by
opening `http://localhost:11434/api/tags` in a new tab — if that fails, the app
will fail too. If VocabLab reports *“nothing is running there”*, it couldn't find
anything on that port (not installed, not started, or another port); *“a server
answered, but it blocked this page”* means CORS (restart with `OLLAMA_ORIGINS=*`
and serve VocabLab over `http://` rather than `file://`). The full text stays in
**Settings → AI**. No local setup at all? Leave Simple mode on (free, no key) —
or set Generator to *Built-in*.

How it keeps you inside the free tier:

- **Batching** — up to 10 words per request with your own key (20 in Simple mode,
  whose free service only allows one request every 30 s); a 20-question quiz is
  usually 1–2 requests.
- **Caching** — every generated question is stored locally by word + type +
  provider/model, so replays and reviews cost **0 requests**.
- **Retries/fallback** — rate limits and 5xx are retried briefly, JSON mode falls
  back to plain prompting, then the built-in generator fills the gaps so a quiz is
  never blocked. A reply that isn't the requested JSON gets one explicit second
  ask (shape spelled out, colder, more room), and a provider that is out of quota
  tells you to switch provider (or switches for you in one click) instead of
  leaving you stuck.
- **Free-slot queue** — the keyless service allows one reply per IP every 30 s,
  and it says how long to wait. That wait is read from the answer itself and
  waited out (up to three times per call), so a paragraph and its correction can
  queue back-to-back instead of reporting a failure.
- **Retired models** — providers drop model names regularly (the free service
  especially). A model the provider no longer serves is replaced by one it does,
  the choice is saved, and the message says what changed — every AI feature keeps
  working without a trip to Settings. Opening **Settings → AI** also checks the
  saved free model quietly, once per session.
- **Counter** — Settings → AI shows requests used today and cache size.

Notes:

- The Sheets API key and the AI provider key are **different keys** from different places.
- Prefer no account at all? Everything works with **Generator → Built-in (offline)**;
  the built-in questions also make a good “hard mode”.

---

## 4 · Studying

### French tenses course (Grammar)

Open the **Study** card in the sidebar to enter a separate 18-chapter course based
on the DELF B2 tenses handbook:

- **Course map**: seven parts, chapter cards with time estimates and exercise
  counts, a progress bar, “Continue learning” and “Review” shortcuts.
- **Lessons**: bilingual Vietnamese/English explanations toggled with **VI / EN**,
  French examples with translations and audio, conjugation tables, memory tips,
  common traps and an English comparison where useful. Chapter titles and examples
  stay in French.
- **Exercises**: 123 short questions — fill in the blank (including multi-blank
  answers), multiple choice and translation — ending with a 27-question mock exam in
  the review chapter. Accents are expected, but a missing accent is accepted with a
  reminder. Correct answers and exercise progress are saved in this browser. All
  exercises correct automatically completes the chapter; you can also mark a lesson
  complete by hand.
- **AI tutor**: every lesson has a tutor that receives the chapter context. Use the
  presets (*Explain simply*, *More examples*, *Quiz me*, *Fix my sentence*) or ask
  your own question. It replies in the currently selected explanation language and
  uses the same **Settings → AI** setup as the rest of the app: Simple mode works
  without a key, Advanced uses your provider. If AI is not configured, the tutor
  says so and links to Settings instead of inventing an answer.
- **Progress**: the Study card and the course map show completed chapters; your
  place in the course and the VI/EN choice are remembered. Progress is local to this
  browser. The source PDF is git-ignored and is not included in the deployment.

### Grammaire progressive du français (Grammar)

The second course card on **Lessons** opens the 52 chapters of the book's teaching
pages, in the book's order and six parts (first steps, the world around you, degree
and space, pronouns and sentences, verbs through time, hypothesis and formal French):

- **One chapter per lesson point** — « être », adjectives, the noun and its article,
  possessives, time and numbers, then the verb groups, pronouns, the past and future
  tenses, the subjunctive and the logical connectors of B2 writing.
- **Teaching only**: the book's exercise pages are deliberately not reproduced; each
  chapter ends with three to five short checks of our own (fill in the blank, multiple
  choice, translation) that grade and save as in the tenses course.
- **Same reading rhythm as the Tenses Atlas**: a Vietnamese/English summary first, then
  short paragraphs, tables and bullet lists, French examples with translations, a tip
  or trap callout, and the AI tutor with the chapter context.
- **Explanations are bilingual, examples stay French**. Switch **VI / EN** at the top of
  a lesson; the choice and the per-chapter progress are remembered in this browser.

### Exam room — Examen blanc n°1 & n°2 (DELF B2)

**Exam** keeps a list of papers, two scanned white papers transcribed into the app:

- **Examen blanc n°1** — listening (20 questions on pistes 25–27), reading (20
  questions on the *small talk*, *écocirque* and *gentillesse* texts) and the
  250-word article for a reading association.
- **Examen blanc n°2** — listening (20 questions on pistes 28–30: a cat café in
  Tours, an employer bonus, three short documents), reading (20 questions on the
  *Alain Gomis* interview, *la sieste au travail* and the *plate-formes ou salles de
  cinéma* debate between Asma, Julie and Antoine) and the 250-word réclamation for a
  late train and an 80-euro taxi.

Pick a paper, review its three parts, then press **Start exam**. Every question is a
tick box with the paper's three choices, and the written task has an editor with a
live word count.

- **Choose, then start**: opening a paper only shows its overview. Answers and the
  24-hour clock exist only after **Start exam**, and an unfinished attempt shows
  **Continue exam** until it expires. To add Examen 3, append it to the `EXAMS`
  array in `js/exam-data.js` and drop its pistes under `exam/No.3/`; the catalogue
  picks it up automatically.
- **24-hour session**: the countdown starts at **Start exam**. Answers and the essay
  are saved in this browser as you type; after 24 hours the attempt is cleared and
  the paper returns to its overview for a fresh Start.
- **Audio**: each listening exercise plays its own `exam/No.1/delf_b2_ibk_*.mp3` or
  `exam/No.2/delf_b2_ibk_*.mp3` track directly in the page — pause, seek and replay as
  often as you like. A track that fails to load says so under the player instead of
  staying silent.
- **No answer key**: the book's corrigé is not part of the scan, so **Review answers**
  shows your choices (and the unanswered questions) for self-checking instead of a
  score.
- **AI feedback** on the essay follows the DELF B2 writing method of Stéphane
  Wattier (*Production écrite DELF B2*, 2017), distilled into `js/exam-guide.js`:
  content 14/25 (consigne, register, facts, argumentation, coherence) + form 11/25
  (vocabulary range and control, spelling, grammar forms, sentence complexity), the
  250-word target with its 225–275 tolerance, and the requirements of the form asked
  for: the article rules (title, chapeau, signature, one main idea per paragraph,
  examples) for Examen 1, the correspondence rules (formule d'appel, daté facts,
  explicit request, formule de politesse) for the réclamation of Examen 2. The reply
  gives a criterion-by-criterion /25, three targeted corrections and two priorities in
  the interface language, using the same **Settings → AI** setup as the rest of the
  app. The book PDF itself stays local and git-ignored; only this distilled rubric is
  in the app.
- The scanned PDFs stay local in `exam/` (git-ignored as `exam/**/*.pdf`); the MP3
  tracks are tracked and ship with the site, so the player works on any device. The
  paper, questions and writing grid are all in `js/`.

### Vocabulary practice

- **Question types**: Multiple choice · Fill in the blank (AI sentence with `___`,
  or spelling practice / example cloze in built-in mode) · Translate (typed).
- **Practice modes**: **Quiz**, **Paragraph translation** and **Shadowing** are
  separate tabs. Paragraph translation is not a quiz question type; it has its own
  direction, count and **Start paragraph** button.
- **Direction** (quiz): mixed, French ➜ Vietnamese, or Vietnamese ➜ French (under
  **More options**). Paragraph direction is set in its own tab.
- **Difficulty**: Easy / Standard / Hard sets the sentence length and CEFR level
  (A1–A2 / A2–B2 / B1–C1) of AI questions and paragraphs. Built-in questions keep
  their fixed style.
- **Topic or focus** (optional): a short instruction for the AI — for example
  “short sentences about city life; focus on the passé composé”. Suggestion chips
  add common themes. It steers both word questions and paragraphs; the built-in
  generator ignores it.
- **Smart picking**: words you get wrong come back more often; unseen words first.
  Progress is stored per word (mastered = ≥3 attempts, ≥80 % correct).
- **Grading** forgives case, punctuation and missing Vietnamese diacritics
  (it tells you to mind the tones), and flags typos as “so close”.
  When a cell lists several meanings — `làm tổn hại, đe dọa (kết quả, sự công bằng)` —
  **any one of them counts** (text in brackets is treated as a clarification), and
  listing several yourself is fine as long as each one is valid.
- **Fair options**: a multiple-choice option that reads like the answer is never
  offered — that happens easily when a sheet gives several words almost the same
  meaning (`có tác động đến` · `tác động đến` · `tác động tích cực (đến)`), and
  guessing between them would not be a fair question. The check runs on every
  question, including AI-written ones and ones already cached in your browser.
- **A shared meaning is never held against you**: if two words in your sheet carry
  the same meaning, a typed answer with either wording counts as correct (the
  feedback still shows the word the question came from, so you learn the exact one).
- **Every option translated**: once you answer a multiple-choice question, each
  option shows its translation underneath (`évoluer` → `tiến triển, thay đổi,
  phát triển`; a Vietnamese option shows the French word it belongs to). A wrong
  pick still teaches you all the other words — and the translations stay hidden
  until you answer, so they never give the answer away. Every option is a word
  your sheet defines: if the AI writes an option your sheet does not have, the
  app swaps it for one of your own words, so nothing is ever left untranslated.
- **📝 Paragraph translation** (needs AI): open the **Paragraph** tab, set its
  direction and count there, then press **Start paragraph**.
  The AI writes a short paragraph out of your own sheet words (3–4 sentences on Easy,
  4–6 on Standard, 6–8 on Hard) and picks the **words you must use** (4–5 on Easy,
  5–6 on Standard and Hard) — they sit next to the text, so the paragraph
  stays comfortable to read and the page doesn't grow long. The **Topic or focus**
  box also guides the subject and style. Write your translation
  below (French ➜ Vietnamese, Vietnamese ➜ French, or both, one card per paragraph),
  press **Check with AI**, and get:
  * a score out of 100 and a one-line comment,
  * your text next to the **minimally corrected** version — the AI is told to keep
    your words, sentence order and length, and only fix real errors: spelling,
    accents, a verb that doesn't agree with **the subject you wrote**, adjective
    agreement, a wrong preposition, or a word that changes the meaning. Your own
    pronoun (`je`, `elle`, `nous`, `vous`, `on`…), tense and synonyms are accepted:
    the reference translation is only a guide to the meaning, not the required answer.
    The score still weighs the source's meaning and the required words, so omitting an
    idea or a required word costs points even when the grammar is perfect.
  * a **Corrections** list quoting exactly what changed and why (one note per fix —
    never a bundle, never a note where nothing changed),
  * the sheet words you used (✓) and the ones you missed (✗).

  When the AI finds something to fix, the paragraph stays editable. Press
  **Apply fixes and edit**, adjust anything you like, and **Check again**; only the
  final attempt is scored and added to the results. The correction lists **every**
  error it finds in that one reply — there is no cap on the number of notes — and
  there is no limit on the number of checks: keep fixing what the feedback lists
  and rechecking until the AI gives **100/100** with no notes left. **Finish
  anyway** stops early with the last score. Re-checking the exact same text does
  not spend another AI request. Each feedback panel shows the previous attempt
  scores.

  Paragraphs are never faked locally: when AI is unavailable (Advanced with no key)
  **Start paragraph** is disabled with the reason, and a failed generation or
  correction says so in Settings → AI instead of quietly swapping in another
  exercise. Simple mode (free, keyless) is enough for it. Paragraph practice always
  uses AI, so the quiz Generator setting does not affect it. `Ctrl/⌘ + Enter`
  checks without leaving the textarea.
- **🎙 Shadowing** (AI paragraph + pronunciation feedback): open the **Shadowing**
  tab and press **Start shadowing**. The AI writes a short French paragraph from
  your sheet words and splits it into sentences. For each one: **Listen**, record
  yourself with **Record**, replay it, and keep the translation hidden until you
  press **Show translation**. **Check pronunciation** sends only that recording to
  the engine chosen in Settings → Speech:
  - **Gemini** (default when a Gemini key exists) listens to a short WAV clip on
    its free tier. You get a transcript, estimated accuracy/fluency/completeness,
    word highlights and two tips. This is labelled **AI estimate** and spends **no
    Azure speech hours**; free-tier audio is sent to Google.
  - **Azure** returns real word-level Pronunciation Assessment scores but consumes
    your 5 free speech-to-text hours (TTS characters are a separate quota).
  Re-record after listening, then continue. The summary shows the average and each
  sentence's score.
  Recordings are in memory only until **Save**; saved audio goes to this browser's
  IndexedDB, never to this app's server or database. Leaving shadowing, moving to the next
  sentence, finishing, recording again, or closing the tab deletes unsaved audio.
  See **Settings → Speech** for both keys and the engine switch.
- **🔊 pronunciation** uses Azure's neural voice when configured (Settings → Speech),
  otherwise the browser's speech synthesis. Pick a local voice in **Settings → Speech**
  (with a **Test browser voice** button); set the language code in Settings → AI
  (`fr-FR`, `de-DE`, `ja-JP`, …). On Linux, Firefox's default speech-dispatcher/eSpeak
  voice is robotic, so choose a better installed voice or use Azure. Answers never play
  automatically — use the speaker buttons when you want to hear a word.
- **🃏 Flashcards** mode for quick review with *Again / Got it*.
- **Practice mistakes** button on the results screen.

Keyboard: `1`–`4` answer · `Enter` check/next · `Space` flip card · `←`/`→` move cards.

---

## 5 · Settings reference

| Tab | What's there |
|---|---|
| **AI** | Simple mode (free, keyless model picker) / Advanced mode (Gemini, Groq, Cerebras, OpenRouter, Mistral, DeepSeek, xAI Grok, Cloudflare, local Ollama, custom), one key kept per provider, model list, requests used today, question cache, learning language (16 options) + speech code |
| **Speech** | Browser voice picker + **Test browser voice**, Azure Speech key + region, French neural voice, “use Azure for every speaker icon” toggle, **Test Azure voice**, pronunciation-scoring engine (Gemini estimate / Azure / automatic) |
| **Google Sheet** | the three connection modes, load buttons, setup help |
| **Data** | cached deck info, saved-recording count and deletion, forget deck, reset progress, wipe everything |

Switch the **learning language** in Settings → AI (French, English, Japanese, Spanish,
German, Italian, Portuguese, Korean, Chinese, Vietnamese, Russian, Arabic, Dutch,
Turkish, Polish, Thai) and the speech code follows it (`Japanese` → `ja-JP`). The AI
prompt, the paragraph direction labels, the shadowing copy, the browser voice list and
the test phrase all use that language, so a Japanese deck practises Japanese. The two
Grammar courses (French tenses and *Grammaire progressive*) remain French lessons.

---

## 6 · Troubleshooting

| Symptom | Fix |
|---|---|
| `403` from Sheets (API mode) | Sheet is not “Anyone with the link”, or the API key is restricted and doesn't allow the Sheets API |
| “Missing Sheets API key” | That mode needs a Google Cloud key — switch to **⭐ Sheet link — no key** instead |
| “Could not open the sheet” (Sheet link mode) | Set sharing to “Anyone with the link → Viewer” |
| `429` from the AI provider | Free-tier limit. Wait a minute, or pick another provider in Settings → AI (Groq, Cerebras and OpenRouter are free too) — the error offers a one-click switch, and the app falls back to built-in questions meanwhile. In Simple mode, the keyless service is shared: retry, or switch to Advanced |
| Free AI is busy / slow (Simple) | It is a public, shared service with a queue. The app waits out the “one reply per 30 s” slot by itself, so this is mostly only visible as a pause. Retry in a minute, press **Check the free AI**, or switch to Advanced with your own key (Groq and Gemini have free tiers). The built-in generator still covers everything except paragraphs |
| Free AI stuck on “Generating…” (Simple) | Every request now has a deadline, and a keyless failure falls back to built-in questions at once instead of retrying into another 30-second slot — a whole quiz no longer waits minutes. If the service itself answers `500`, that is their outage, not your setup: the quiz starts with built-in questions and the reason is shown. Paragraph practice needs AI, so it offers Advanced (a free Groq or Gemini key) instead of spinning. **Check the free AI** now asks for a real reply, so it reports an outage instead of “works” |
| Gemini stuck on “Generating… / Checking…” | Advanced mode now defaults to **`gemini-2.5-flash`**; an old saved `gemini-flash-latest` is migrated on load, because that alias can point at a model that accepts the request and never answers. If a model is overloaded (`503`) or silent (deadline), the app switches to a stable Flash model your key can use and saves it, saying so. Every Gemini request is cut off after 50 seconds and the whole step after 100 seconds, then the reason is shown (and a quiz falls back to built-in questions) — reload the page if your copy predates this, as an old tab keeps the old scripts. Quota (`429`) is reported immediately instead of being retried. **Test key & load models** asks for a real reply, so “✓ Works” means the model answered. A retired model is also replaced automatically |
| Every AI action says it failed in Simple mode | The model saved in Settings → AI is probably one the free service has retired — it answers `404` for every request from then on. The app now asks what is served, switches to it, saves it, and repeats the request; the message names the old and new model. Press **Check the free AI** in Settings → AI to see the list yourself. Advanced providers get the same treatment when they retire a model |
| Provider rejects the key (`401`/`403`) | The app now names the provider and its own reason (“Invalid API Key”). Keys are *not* shared between providers: `gsk_…` (56 chars) = Groq, `xai-…` = xAI **Grok**, `sk-or-…` = OpenRouter, `sk-…` = DeepSeek, `AIza…` or `AQ.…` = Gemini (Google issues both shapes). **Groq (fast inference, free) and Grok (xAI, paid) are different companies one letter apart** — a key from a “Grok” page will never work on the Groq provider. A key that matches no provider's format, or another provider's, is called out the moment you paste it, with the console it should come from. A pasted `Bearer ` prefix, quotes or a stray newline are stripped automatically (keys saved earlier are repaired on load). On OpenRouter use a `:free` model; on Cloudflare include your account ID in the Base URL |
| AI replies, but the quiz still shows built-in questions | The model answered in a shape VocabLab can't use. The prompt now spells out the exact JSON (`{"questions":[…]}`, one object per word) and the app retries once, colder and with more room, before giving up. If it still fails, the model ignores JSON mode: open Settings → AI (the box shows how the reply began) and pick a plain chat model instead of a reasoning one |
| Paragraph translation is greyed out | It is AI-only, by design: use Simple mode (free, no key) in Settings → AI, or add your own key in Advanced. The quiz Generator setting does **not** affect paragraph practice — it always uses AI. A paragraph is written **and** corrected by AI, so it is never replaced by a built-in question; if a generation fails mid-session the reason is kept in Settings → AI |
| Shadowing is greyed out | **Start shadowing** needs AI to write the paragraph (Simple mode is enough). Recording and replay then work without a scoring key; **Check pronunciation** needs a free Gemini key (Settings → AI) or an Azure key (Settings → Speech). If there is no microphone, allow the site permission and use `https://` or `localhost` |
| Gemini pronunciation check fails | The key must be a Google AI Studio key (`AIza…` or the newer `AQ.…`); test it in **Settings → AI**. A 429 means the free-tier audio limit is briefly used up — wait a minute or switch scoring to Azure. A 403 can mean audio input is unavailable for that key's region. Gemini scores are an **estimate**, not a certified test |
| Can't reach the provider (CORS/network) | The message says which side is broken. *“nothing is running there”* → for a local server: it isn't installed/started (`ollama serve`, then `ollama pull <model>`; check `http://localhost:11434/api/tags` in a new tab); *“a server answered, but it blocked this page”* → CORS: restart Ollama with `OLLAMA_ORIGINS=*` and serve the page over `http(s)://`, not `file://`. Gemini, Groq, OpenRouter and Mistral need no CORS setup |
| A renamed tab shows up twice | Only happens with a manual tab-name list: Google serves the *first* tab for an unknown name. Delete/rename that line, or use the link-only mode for auto-detection |
| New words/tabs don't show up | Press **↻ Reload** in the header |
| “Network error…” when opened as `file://` | Chrome/Edge block requests to Google from double-clicked pages. VocabLab asks the public `r.jina.ai` reader for the tab list (no key, nothing to type), falls back to the remembered list, and only then says “first tab only” in one message (kept in Settings → Google Sheet). To drop the third party, serve the folder (`python3 -m http.server 8080` → `http://localhost:8080`) |
| Sign-in says “server is not reachable” | The page needs the `/api` functions. Run `npm run dev:local` (plain Node, works without a database) or `npx vercel dev` (not `python3 -m http.server`), or use the deployed site. With `MONGODB_URI` set but unreachable, add `VOCABLAB_DB_MODE=local` to fall back to the local account store. |
| `npm run db:init` cannot connect | Check the Atlas database user's password, the cluster hostname in `MONGODB_URI`, and Atlas **Network Access** for your current IP. A pasted password should be rotated. |
| I lost my recovery code | There is no email reset by design. Create a new account; only the name, daily quests and streak are lost — the local deck, mastery, grammar progress and recordings stay in this browser. |
| The flame shows **!** | You missed one day. Finish any one quest today and the streak continues; a second missed day resets it (the best streak is kept). |
| A quest target is bigger than my deck | Progress accumulates across sessions: start the quest again and the bar continues from where it was. |
| Voice is silent | Press **Test speaker** on the home screen; it tests Azure first when configured, otherwise reports how many browser voices are available. On Linux, Chrome does not use speech-dispatcher — use Firefox and restart it after speech-dispatcher starts. Also pick a BCP-47 code matching an installed voice (`fr-FR`); some browsers require one user interaction first |
| French sounds robotic or wrong | On Linux/Firefox the default is speech-dispatcher's eSpeak voice, which mispronounces many French words. Open **Settings → Speech**, choose a different installed voice, and press **Test browser voice**. If the list only has eSpeak, install a Piper/RHVoice French voice in the system or add Azure Speech (free F0 tier), which is much more natural. Check that the language code in Settings → AI is `fr-FR`, not `en-US` |
| Azure rejects the key or region | They must belong to the same Azure Speech resource. Copy the region from the resource's **Keys and Endpoint** page (e.g. `southeastasia`), not the resource-group location. A new free F0 resource can take a minute to become active. Use **Settings → Speech → Test Azure voice** for the exact error |
| Azure voice works but scoring is off | Scoring needs a key for the selected engine and a recording. Gemini scoring needs a Gemini key in **Settings → AI**; Azure scoring needs the key + region in **Settings → Speech**. Record again after changing the engine. Without either key, recording/replay still works but **Check pronunciation** stays disabled |
| Save does nothing / recordings missing | Saved audio uses IndexedDB, not localStorage. Check that the browser allows site data for this page; **Settings → Data** shows the saved-recording count and can delete them. Unsaved recordings disappear when you leave shadowing or record again, by design |
| Wrong columns read | Add a header row, or name columns with one of the recognised words above |
| Apps Script returns HTML | Redeploy with access **Anyone**, and copy the `/exec` URL |

---

## 7 · Tests

```bash
node tests/run-tests.mjs          # logic (no browser needed)
node tests/browser-smoke.mjs      # drives the real UI in headless Chrome
npm run test:e2e                  # Playwright: routes, i18n, dictionary, upgrades
node tests/browser-smoke.mjs --live       # …and loads your sheet from my-sheet.txt
node tests/browser-smoke.mjs --discover   # …and pastes only the sheet link (auto-detects tabs)
```

`--live` and `--discover` read **`my-sheet.txt`** (your sheet link + tab names).
It is git-ignored: copy **`my-sheet.txt.example`** to `my-sheet.txt` first, or
those two runs skip themselves with a note.

The logic suite covers CSV/TSV/gviz parsing, header detection (EN/FR/VI, `Tiếng …`),
link lists (sheet link + tab names, renamed-tab detection), xlsx tab auto-discovery
(stored + deflated zips, hidden tabs), the online tab-list fallback (`r.jina.ai` htmlview
parsing incl. JS escapes), the tab-list fallbacks used when that download is blocked
(remembered list, last deck), the built-in generator, answer grading (incl.
Vietnamese diacritics, typos and comma/slash lists with bracketed clarifications), AI JSON repair, OpenAI-compatible request
building, question planning, the cache path, the full quiz pipeline, the grammar
course data (18 chapters, 123 exercises, bilingual feedback), grammar progress,
the prose tutor transport, Azure voice mapping, WAV encoding, shadowing sentence
splitting, the exam paper data (40 questions, three parts at 25 points, pistes
25–27, the three MP3 files on disk, the 250-word task), the Wattier writing grid
(criteria summing to 14 + 11 = 25, the 225–275 word band, article layout, and the
compact examiner prompt), and the `app.js` ↔ `index.html` element wiring. It also covers the daily
quest picker (deterministic per user + date, one of each group, all seven types over
time), progress clamping/merging, every streak transition (perfect day, grace day,
reset, idempotent sync), scrypt password hashing, recovery-code rotation, validation,
and a full in-memory API flow: signup → home → complete a quest → streak → rename →
logout → login → reset → old sessions invalidated.

The browser smoke test serves the folder with a fake `/api`, opens it in headless
Chrome (`CHROME=/path/to/chrome` to override, or it is skipped when no browser is
installed) and checks the things only a browser can: the signed-out gate, sign-in,
the greeting/date/streak/daily-quest card, a quiz answer filling the HP bar and
completing a pre-seeded day (streak +1), the progress POST reaching the API, the
deck loading, multiple-choice options actually being clickable (nothing covering
them), clicks and digit keys answering, typed answers being graded, the quiz
reaching the results screen, paragraph retry applying the AI fixes and finishing,
shadowing recording (with a stubbed microphone in headless Chrome), saving locally,
rendering Azure-style scores and reaching its summary, flashcards flipping, the
Grammar course opening with all 18 chapters, a lesson exercise being graded and
saved, the AI tutor rendering a reply, the VI/EN toggle working and the course
returning to vocabulary — and that no JavaScript error is thrown.

The Playwright suite (`npm run test:e2e`) is the browser-level contract for the
routes and the level-up feature. It starts `tests/e2e/server.mjs` (static files plus
an in-memory `/api` and fake AI/dictionary providers, so no key or database is
needed), signs in through that API and checks: all seven pages open, mark their nav
item and survive a deep-link reload; the exam catalogue opens a paper overview and
starts nothing until **Start exam**; the paper renders all 40 tick boxes and three
audio tracks (with byte-range seeking and real playback), keeps answers and the
essay across a reload, continues an unfinished attempt, restarts after the 24-hour
session expires, lists every answer on review, scrolls from the parts list without
leaving the route, asks the AI for essay feedback and checks the request carries the
Wattier rubric, and Community stays a usable placeholder; the
interface language switch reaches every visible string on every page plus the
Settings and Help dialogs; French course content is never translated by that switch;
the dictionary chain answers from FreeDictionaryAPI, then Wiktionary, then reports a
missing word, an unavailable service and a non-headword phrase correctly; and
upgrades appear only when the paragraph gate is met (score 100, no notes, every
required word used) or for a correct typed VI → target answer, never for
Target → VI, multiple choice, fill-in-the-blank or a wrong answer, capped at 12 and
never applied on their own.

---

## Privacy

Your **account** (name, email, password hash, recovery-code hash, daily quests and
streak) is stored in the **MongoDB Atlas database you created** and reaches it only
through this app's own `/api` functions. The server keeps one HttpOnly session
cookie (30 days) and no other browser identifier. Passwords are hashed with Node's
`scrypt`; the recovery code is stored hashed and is shown in plain text exactly once
(at signup, and again after a reset because it rotates).

Everything else stays in this browser: the deck cache, settings, per-word mastery,
quiz/stats history, grammar progress and the question cache are in `localStorage`;
saved shadowing recordings are in IndexedDB. The other network calls are: your
Google Sheet, the AI provider you configure (with your key — this includes the
exam essay when you press **AI feedback**), Gemini when it scores a recording,
Azure Speech when you use the cloud voice or ask it for pronunciation scoring, the
pinned Azure Speech SDK from jsDelivr, and the Google Fonts stylesheet.
Azure receives text for synthesis and (only if you choose Azure scoring) the
recorded sentence; Gemini receives the short WAV clip. Saved audio is never
uploaded. No analytics, no ads.

**No email is sent** (there is no email service in this app), so signup does not
verify that an address belongs to you and password reset uses the recovery code,
not an email link. There is no "forgot my code" path by design — save the code
when it is shown.
