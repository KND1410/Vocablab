# 📚 VocabLab

**Live: <https://vocablab-one.vercel.app>** — no install, nothing to run.

Turns a **Google Sheet of vocabulary** into AI-generated practice: multiple choice,
fill-in-the-blank, typed translation, whole-paragraph translation and shadowing with
pronunciation feedback. Built for French (Vietnamese meanings by default) and works
with any language.

- **One tab = one topic.** Vocab and meaning are the only required columns.
- **AI questions** from a free keyless model, or your own key (Gemini, Groq,
  Cerebras, OpenRouter, Mistral, DeepSeek, xAI, Cloudflare, local Ollama). A
  built-in generator covers everything except paragraphs when AI is unavailable.
- **Accounts**: email + password + one-time recovery code, synced to your own
  MongoDB Atlas database through `/api`. Everything else stays in the browser.
- **Daily quests**: three small tasks (quiz, production, review). Finish **any one**
  to extend the streak; one missed day is a grace day.
- **Grammar**: two French courses — Tenses Atlas (18 chapters) and *Grammaire
  progressive* (52 chapters) — with bilingual VI/EN explanations, exercises and a
  lesson-aware AI tutor. Progress is local.
- **Exam room**: two full DELF B2 white papers (listening, reading, 250-word
  writing) with a 24-hour attempt, audio players and AI essay feedback.
- **Community**: every member's name, partly hidden email, last login, current
  streak and days practised, with initials avatars and a presence dot. Online
  members come first (by streak), then everyone else (by streak).
- **Level up (B1/B2)**: optional rewrites after a perfect paragraph or a correct
  typed VI → target answer; nothing is applied automatically.
- **No build step**: static files plus Vercel serverless functions.

## Run it

Hosted: <https://vocablab-one.vercel.app>. A static-only host can show the UI, but
sign-in needs the `/api` functions.

**Local, no database (fastest):**

```bash
npm install
npm run dev:local        # http://localhost:3000, PORT=4000 to change
```

Accounts and streaks go to `.data/local-db.json` (git-ignored) when `MONGODB_URI`
is unset. `VOCABLAB_DB_MODE=local` forces that store even when Atlas is configured.

**Local, full app:**

```bash
cp .env.example .env.local     # paste MONGODB_URI (database: vocablab)
npm run db:init                # create the Atlas indexes once
npx vercel dev                 # or npm run dev
```

**Deploy:** import the repo in Vercel, add `MONGODB_URI` (and optionally
`MONGODB_DB`) to Production and Preview, deploy. Atlas must allow Vercel's egress
(`0.0.0.0/0` is the simple option). Rotate any connection string that has been
pasted into a chat or screenshot.

## Your Google Sheet

One tab per topic; first row = headers (recommended). Only the first two columns are
required.

| Column | Names recognised | Used for |
|---|---|---|
| **Vocab** *(required)* | `Vocab`, `Word`, `Term`, `Français`, `Từ vựng`… | word/phrase |
| **Vietnamese** *(required)* | `Vietnamese`, `Meaning`, `Nghĩa`, `Tiếng Việt`… | meaning |
| Pronunciation | `Pronunciation`, `Phát âm`, `IPA`… | hint on the card |
| Example | `Example`, `Ví dụ`, `Sentence`… | card + cloze |
| Part of speech | `POS`, `Từ loại`… | better distractors |
| Note / Level | `Note`, `Level`, `Ghi chú`… | extra info |

- No header? Column 1 = vocab, column 2 = meaning.
- Empty, duplicate, header and label rows (no meaning or emoji) are skipped; hidden
  and chart tabs are skipped too.
- Columns are matched by fixed rules, not by AI. Limits: 6 000 rows/tab, 160 chars
  per word, 400 per meaning.
- `sample-sheet.csv` is an example.

**Connect it — pick one:**

1. **⭐ Sheet link, no key (recommended)** — Share → *Anyone with the link → Viewer*,
   then Settings → Google Sheet → paste the link → **Load sheet**. New tabs appear
   after **↻ Reload**.
2. **Google Sheets API key** — enable the Sheets API in Google Cloud, create an API
   key, paste it with the link in Settings. This is *not* the Gemini key.
3. **Apps Script** — in the sheet: Extensions → Apps Script, paste:

```javascript
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = ss.getSheets().map(function (sh) {
    return { title: sh.getName(), values: sh.getDataRange().getDisplayValues() };
  });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy as a web app (*Execute as: Me*, *Access: Anyone*), paste the `/exec` URL in
Settings.

Optional: `my-sheet.txt` (copy `my-sheet.txt.example`) takes the link plus tab names
on separate lines to load only those tabs; `Topic name | URL` lines also work. Saved
decks are cached in the browser and open offline. If tab discovery fails, the last
known tab list is reused (one note explains it).

## AI questions

Settings → AI has two modes, both stored in your browser:

- **Simple** (default) — free, keyless, shared service limited to one request every
  30 seconds; VocabLab batches and waits for the next slot.
- **Advanced** — your own key; requests go browser → provider with no shared queue.

| Provider | Free tier / notes | Base URL |
|---|---|---|
| Free AI (Simple) | keyless, one request per 30 s | `https://text.pollinations.ai/openai` |
| Google Gemini | Flash models, daily allowance per project | built in |
| Groq | ~30 req/min, 1000/day, very fast — not xAI Grok | `https://api.groq.com/openai/v1` |
| Cerebras | free trial credit, fastest | `https://api.cerebras.ai/v1` |
| OpenRouter | models ending in `:free` | `https://openrouter.ai/api/v1` |
| Mistral | free Experiment plan | `https://api.mistral.ai/v1` |
| DeepSeek | paid, cents per quiz | `https://api.deepseek.com/v1` |
| xAI Grok | $25 credit, then per token | `https://api.x.ai/v1` |
| Cloudflare Workers AI | daily free allowance | `…/accounts/{ACCOUNT_ID}/ai/v1` |
| Ollama (local) | free, no key, must run on your machine | `http://localhost:11434/v1` |
| Other | any OpenAI-compatible service | your base URL |

Get a Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey);
press **Test & load models** to replace the default with what the provider really
serves. For Ollama: `ollama serve` (with `OLLAMA_ORIGINS=*`) and
`ollama pull llama3.2`, then check `http://localhost:11434/api/tags`.

Staying inside free tiers:

- **Batching** — up to 10 words per request with your own key (20 keyless); a
  20-question quiz is usually 1–2 requests.
- **Caching** — questions are stored by word + type + provider/model, so replays
  cost 0 requests.
- **Fallbacks** — retries, JSON-mode repair, then built-in questions; a retired
  model is replaced and saved automatically.
- **Counters** — Settings → AI shows requests used today and cache size.

Generator → **Built-in (offline)** uses no AI at all.

## Practice

- **Types**: multiple choice, fill in the blank, typed translation; separate
  **Paragraph** and **Shadowing** tabs.
- **Settings**: direction (mixed / FR→VI / VI→FR), difficulty (A1–A2 / A2–B2 /
  B1–C1) and an optional topic/focus prompt for the AI.
- **Smart picking**: wrong words come back more often; mastered = ≥3 attempts,
  ≥80 % correct.
- **Grading** ignores case, punctuation and missing Vietnamese diacritics (with a
  reminder) and flags typos. With several meanings in one cell, any of them counts.
- **Options are translated after you answer**, and an option that duplicates the
  answer is never offered.
- **Paragraph**: AI writes 3–8 sentences from your words and marks the words you
  must use. Feedback gives a /100 score, a minimal correction, a note per real error
  and the words used/missed. Fix everything and recheck until **100/100**; checks
  are unlimited, and rechecking identical text costs no request. `Ctrl/⌘ + Enter`
  checks.
- **Shadowing**: AI paragraph split into sentences; record, replay, optionally reveal
  the translation. **Check pronunciation** uses Gemini (AI estimate, no Azure hours)
  or Azure (word-level scores). Unsaved recordings live in memory only; **Save**
  writes them to IndexedDB.
- **Speech**: Azure neural voice when configured, otherwise the browser voice
  (Settings → Speech). Set the language code in Settings → AI (`fr-FR`, `de-DE`…).
- **Flashcards**: quick review with *Again / Got it*; **Practice mistakes** on results.

Keyboard: `1`–`4` answer · `Enter` check/next · `Space` flip · `←`/`→` cards.

## Grammar

- **Tenses Atlas** (`js/grammar-data.js`): 18 chapters, 123 exercises and a
  27-question mock exam. Bilingual VI/EN explanations, French examples, conjugation
  tables, traps, AI tutor.
- ***Grammaire progressive du français*** (`js/grammar-handbook.js`): the 52 teaching
  chapters in book order, with 3–5 short checks each (the book's own exercises are
  not reproduced).
- Each course keeps its own progress in this browser. Source PDFs stay local and
  git-ignored. Accents are expected; a correct answer without accents is accepted
  with a reminder.

## Exam room

Two DELF B2 papers (`js/exam-data.js`), each with listening (20 questions), reading
(20) and a 250-word writing task. Open a paper to see its overview, then **Start
exam**.

- **24-hour attempt**: answers and the essay autosave; after 24 hours the attempt
  resets. An unfinished paper shows **Continue exam**.
- **Audio**: each listening exercise has its own player (pause, seek, replay).
- **Review answers** lists your choices — the book has no answer key in the scan.
- **AI feedback** follows the Wattier *Production écrite DELF B2* grid: content
  14/25 + form 11/25, 250 words (225–275 accepted), the required article or letter
  layout, plus targeted corrections and priorities.
- To add a paper: append it to `EXAMS` in `js/exam-data.js` and put its audio under
  `exam/No.N/`. PDFs are git-ignored; the MP3s are tracked.

## Admin

One account can own the panel: the **Admin** entry appears in the sidebar only for
that account, and every `/api/admin/*` route re-checks the role on the server — the
front end is public JavaScript, so hiding the link is not the gate.

**Who is the admin.** In order: the account whose email matches `ADMIN_EMAIL`; else,
while no admin exists, the **oldest account** claims the panel the next time it signs
in or loads the app. That means an existing database needs no migration script — just
reload the app as the first account you ever created. Accounts created afterwards are
ordinary learners.

**What it does.**

- **Accounts** — name, email, status, current streak, days practised and last seen,
  with search. Accounts that need attention (awaiting approval, suspended) sort first.
- **Approve** — required only when the approval setting is on. Until then the account
  exists but has no session: it cannot sign in and sees “waiting for approval”.
- **Suspend / Restore** — a suspension deletes every session immediately, so the
  account is cut off on its next request, not on its next sign-in. Suspending asks for
  a second click. An admin can never suspend themselves or another admin, so the panel
  cannot be locked out.
- **Signup approval** — off by default. Turn it on when you are opening the app to a
  class: new accounts wait for you instead of walking in.
- **Admin log** — the last 20 actions with who, what, who it was done to and when.

Passwords and recovery hashes never leave the database; the panel only receives the
fields listed above. Set `ADMIN_EMAIL` in Vercel if you want the role to follow a
specific address rather than the first account.

## Settings

| Tab | Contents |
|---|---|
| **AI** | Simple/Advanced mode, provider + key, model list, requests today, cache, learning language (16 options) and speech code |
| **Speech** | Browser voice + test, Azure key/region/voice, scoring engine (Gemini estimate / Azure / automatic) |
| **Google Sheet** | The three connection modes and load buttons |
| **Data** | Cached deck, saved recordings, reset progress, wipe everything |

The learning language drives the AI prompt, direction labels, shadowing copy and
test phrase. The two grammar courses stay French.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `403` from Sheets | Sheet is not “Anyone with the link”, or the key doesn't allow the Sheets API |
| `429` from the provider | Free-tier limit: wait, switch provider (the error offers a one-click switch), or rely on built-in questions meanwhile |
| Free AI slow or stuck | Shared queue with a 30 s slot; requests have deadlines and keyless failures fall back to built-in questions. Paragraphs need AI, so use Advanced |
| Gemini stuck | A saved `gemini-flash-latest` is migrated to `gemini-2.5-flash`; overloaded or silent models are swapped and saved. Requests time out (50 s each, 100 s per step). Reload an old tab |
| Provider rejects the key | Keys are per provider: `gsk_…` = Groq, `xai-…` = xAI Grok, `sk-or-…` = OpenRouter, `sk-…` = DeepSeek, `AIza…`/`AQ.…` = Gemini. Groq and Grok are different companies. Pasted `Bearer `, quotes and newlines are stripped |
| AI quiz still uses built-in questions | The reply wasn't usable JSON; the app retries once. If it persists, pick a plain chat model, not a reasoning one (the reply start is shown in Settings → AI) |
| Paragraph or shadowing greyed out | Both need AI to write the text (Simple mode is enough). Pronunciation scoring also needs a Gemini or Azure key |
| Can't reach Ollama/provider | *“nothing is running there”* → install/start it; *“blocked this page”* → CORS: `OLLAMA_ORIGINS=*` and serve over `http(s)://`, not `file://` |
| New words/tabs don't show | Press **↻ Reload** |
| Sign-in says server unreachable | Use `npm run dev:local`, `npx vercel dev` or the deployed site (not `python3 -m http.server`). With Atlas unreachable, set `VOCABLAB_DB_MODE=local` |
| `db:init` cannot connect | Check the Atlas user password, cluster hostname and Network Access for your IP |
| Lost recovery code | No email reset by design. Only the name, quests and streak are lost; local deck, progress and recordings stay |
| Voice is silent or robotic | Test the speaker on the home screen; pick a BCP-47 code matching an installed voice. On Linux, use Firefox or add Azure Speech (free F0) |
| Azure rejects key/region | Both must belong to the same Speech resource; copy the region from **Keys and Endpoint** (e.g. `southeastasia`), not the resource group |
| Save does nothing | Saved audio uses IndexedDB; allow site data. Settings → Data shows the count and can delete them |
| Wrong columns read | Add a header row, or name columns with one of the recognised words |
| Apps Script returns HTML | Redeploy with access **Anyone** and copy the `/exec` URL |

## Tests

```bash
npm test                                  # logic + API, no browser
npm run smoke                             # real UI in headless Chrome
npm run test:e2e                          # Playwright: routes, i18n, exam, upgrades
node tests/browser-smoke.mjs --live       # loads your sheet from my-sheet.txt
node tests/browser-smoke.mjs --discover   # pastes only the sheet link
```

`--live` / `--discover` skip themselves when `my-sheet.txt` is absent (copy
`my-sheet.txt.example`). The smoke test needs Chrome/Chromium (`CHROME=…` to
override) and skips without one.

The logic suite covers sheet parsing and discovery, link lists, the generator, AI
transport and JSON repair, the quiz pipeline and grading, the daily quest and streak
rules, accounts/API (scrypt, recovery codes, sessions), grammar data and progress,
exam data and the Wattier rubric, the admin rules (who owns the panel, who may be
suspended, the audit entry) and the admin API, plus `app.js` ↔ `index.html` wiring.

The Playwright suite covers all routes and deep links, i18n on every page, the exam
flow (start, autosave, audio, review, AI feedback), the dictionary chain, the
level-up gate and the admin panel (hidden for learners, approve/suspend/local log for
the admin).

## Privacy

Account data (name, email, password hash, recovery-code hash, quests, streak) goes
to **your MongoDB Atlas database** through `/api`, with one HttpOnly session cookie
(30 days) and scrypt-hashed passwords. The recovery code is stored hashed and shown
once.

Everything else stays in this browser: deck cache, settings, mastery, history,
grammar and exam progress, question cache (`localStorage`), recordings (IndexedDB).
Other network calls: your Google Sheet, the AI provider you configure (including
exam feedback), Gemini or Azure when scoring a recording, the pinned Azure SDK from
jsDelivr and Google Fonts. Saved audio is never uploaded. No analytics, no ads.

No email is sent, so signup does not verify the address and password reset needs the
recovery code — save it when it is shown.
