# 📚 VocabLab

Turn a **Google Sheet of vocabulary** into AI-generated quizzes: multiple choice,
fill-in-the-blank and typed translation. Built for learning **French** (Vietnamese
meanings out of the box), but works with any language.

- Every **tab** of your sheet becomes a **topic**.
- Questions are written by an **AI model you choose** — Google Gemini, Groq,
  Cerebras, OpenRouter, Mistral, DeepSeek, Cloudflare or a local Ollama — with a
  solid built-in generator when there is no key / no quota left.
- No build step, no backend, no dependencies: a static page + your browser.

```
language/
├── index.html          the app
├── css/styles.css      styles (light/dark)
├── js/util.js          helpers + storage
├── js/demo.js          built-in French demo deck (36 words)
├── js/sources.js       Google Sheet loading + table parsing
├── js/ai.js            Gemini + OpenAI-compatible clients (JSON mode, retries)
├── js/generator.js     built-in offline question generator
├── js/quiz.js          selection, batching, caching, grading, mastery
├── js/app.js           UI wiring
├── my-sheet.txt.example  template for your own link list (copy to my-sheet.txt)
├── sample-sheet.csv    example of the sheet format
├── tests/run-tests.mjs logic tests (node tests/run-tests.mjs)
└── tests/browser-smoke.mjs real-UI test in headless Chrome
```

---

## 1 · Run it

**Easiest:** double-click `index.html`. The demo deck works immediately.

**Better (recommended):** serve the folder so browser requests are never blocked:

```bash
cd language
python3 -m http.server 8080
# open http://localhost:8080
```

To use it on your phone or share it, host the folder anywhere static
(GitHub Pages, Netlify Drop, Cloudflare Pages…). It is just files.

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
- On a double-clicked `file://` page the browser refuses to download Google's tab
  list (the page's origin is `null`, which Google blocks). VocabLab then asks the
  public **[r.jina.ai](https://r.jina.ai)** reader for the same page, which works
  from `file://`, and loads every tab — still no key and nothing to type. That
  reader is a free third-party service, so treat it as best-effort: if it is
  unreachable the remembered tab list is used, and failing that you get one honest
  “first tab only” note. Serving the folder over `http://localhost` needs no third
  party at all.
- If the browser blocks requests to Google (Chrome/Edge on a double-clicked
  `file://` page, or a strict ad blocker), VocabLab retries the words themselves
  with a **script-tag (JSONP) method**, which does not need a server.
- Loaded decks are **cached in the browser**, so the app opens instantly and works
  offline afterwards.

---

## 3 · AI questions (free models)

Open **Settings → AI** and pick a provider from the menu — the menu *is* the whole
list, not a choice between Gemini and “something else”. Keys are stored in your
browser only and requests go straight from your browser to the provider. Each
provider remembers its own base URL, key and model, so you can switch back and
forth without retyping anything.

| Provider | Free tier | Base URL (OpenAI-compatible mode) | Key from |
|---|---|---|---|
| **Google Gemini** *(default)* | Flash models, daily allowance **per project** | built in — select *Google Gemini* | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Groq** | ~30 req/min · 1000 req/day · very fast | `https://api.groq.com/openai/v1` | [console.groq.com/keys](https://console.groq.com/keys) |
| **Cerebras** | free trial credit, then pay as you go · fastest | `https://api.cerebras.ai/v1` | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **OpenRouter** | every model ending in `:free` + the `openrouter/free` router | `https://openrouter.ai/api/v1` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Mistral** | free “Experiment” plan | `https://api.mistral.ai/v1` | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |
| **DeepSeek** | paid — no free tier, but only cents per quiz | `https://api.deepseek.com/v1` | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
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

**Google Gemini (default):** get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey),
paste it, press **Test key & load models**.

**Groq / Cerebras / OpenRouter / Mistral / DeepSeek / Cloudflare:** pick the
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
**Settings → AI**. No local setup at all? Use a free Gemini/Groq key — or set
Generator to *Built-in*.

How it keeps you inside the free tier:

- **Batching** — up to 10 words per request (a 20-question quiz ≈ 2 requests).
- **Caching** — every generated question is stored locally by word + type +
  provider/model, so replays and reviews cost **0 requests**.
- **Retries/fallback** — rate limits and 5xx are retried briefly, JSON mode falls
  back to plain prompting, then the built-in generator fills the gaps so a quiz is
  never blocked. A provider that is out of quota tells you to switch provider (or
  switches for you in one click) instead of leaving you stuck.
- **Counter** — Settings → AI shows requests used today and cache size.

Notes:

- The Sheets API key and the AI provider key are **different keys** from different places.
- Prefer no account at all? Everything works with **Generator → Built-in (offline)**;
  the built-in questions also make a good “hard mode”.

---

## 4 · Studying

- **Question types**: Multiple choice · Fill in the blank (AI sentence with `___`,
  or spelling practice / example cloze in built-in mode) · Translate (typed).
- **Direction**: mixed, French ➜ Vietnamese, or Vietnamese ➜ French.
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
- **🔊 pronunciation** uses your browser's speech synthesis — set the voice code
  in Settings → AI (`fr-FR`, `de-DE`, `ja-JP`, …); “Auto-play” reads the word
  when a card is revealed.
- **🃏 Flashcards** mode for quick review with *Again / Got it*.
- **Practice mistakes** button on the results screen.

Keyboard: `1`–`4` answer · `Enter` check/next · `Space` flip card · `←`/`→` move cards.

---

## 5 · Settings reference

| Tab | What's there |
|---|---|
| **AI** | provider menu (Gemini, Groq, Cerebras, OpenRouter, Mistral, DeepSeek, Cloudflare, local Ollama, custom), one key kept per provider, model list, requests used today, question cache, target language + voice, auto-play |
| **Google Sheet** | the three connection modes, load buttons, setup help |
| **Data** | cached deck info, forget deck, reset progress, wipe everything |

Switching the **target language** (e.g. `French` / `fr-FR`) is all you need for a
different language — the AI prompt, RTL-free UI text and the TTS voice follow it.

---

## 6 · Troubleshooting

| Symptom | Fix |
|---|---|
| `403` from Sheets (API mode) | Sheet is not “Anyone with the link”, or the API key is restricted and doesn't allow the Sheets API |
| “Missing Sheets API key” | That mode needs a Google Cloud key — switch to **⭐ Sheet link — no key** instead |
| “Could not open the sheet” (Sheet link mode) | Set sharing to “Anyone with the link → Viewer” |
| `429` from the AI provider | Free-tier limit. Wait a minute, or pick another provider in Settings → AI (Groq, Cerebras and OpenRouter are free too) — the error offers a one-click switch, and the app falls back to built-in questions meanwhile |
| Provider rejects the key (`401`/`403`) | The app now names the provider and its own reason (“Invalid API Key”). Keys are *not* shared between providers: `gsk_…` = Groq, `sk-or-…` = OpenRouter, `sk-…` = DeepSeek, `AIza…` = Gemini. Pasting one of those into the wrong provider is called out the moment you paste it. A pasted `Bearer ` prefix, quotes or a stray newline are stripped automatically (keys saved earlier are repaired on load). On OpenRouter use a `:free` model; on Cloudflare include your account ID in the Base URL |
| Can't reach the provider (CORS/network) | The message says which side is broken. *“nothing is running there”* → for a local server: it isn't installed/started (`ollama serve`, then `ollama pull <model>`; check `http://localhost:11434/api/tags` in a new tab); *“a server answered, but it blocked this page”* → CORS: restart Ollama with `OLLAMA_ORIGINS=*` and serve the page over `http(s)://`, not `file://`. Gemini, Groq, OpenRouter and Mistral need no CORS setup |
| A renamed tab shows up twice | Only happens with a manual tab-name list: Google serves the *first* tab for an unknown name. Delete/rename that line, or use the link-only mode for auto-detection |
| New words/tabs don't show up | Press **↻ Reload** in the header |
| “Network error…” when opened as `file://` | Chrome/Edge block requests to Google from double-clicked pages. VocabLab asks the public `r.jina.ai` reader for the tab list (no key, nothing to type), falls back to the remembered list, and only then says “first tab only” in one message (kept in Settings → Google Sheet). To drop the third party, serve the folder (`python3 -m http.server 8080` → `http://localhost:8080`) |
| Voice is silent | Pick a BCP-47 code matching an installed voice (`fr-FR`), and note some browsers require one user interaction first |
| Wrong columns read | Add a header row, or name columns with one of the recognised words above |
| Apps Script returns HTML | Redeploy with access **Anyone**, and copy the `/exec` URL |

---

## 7 · Tests

```bash
node tests/run-tests.mjs          # logic (no browser needed)
node tests/browser-smoke.mjs      # drives the real UI in headless Chrome
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
building, question planning, the cache path, the full quiz pipeline, and the
`app.js` ↔ `index.html` element wiring.

The browser smoke test serves the folder, opens it in headless Chrome
(`CHROME=/path/to/chrome` to override, or it is skipped when no browser is
installed) and checks the things only a browser can: that the app initialises,
the deck loads, multiple-choice options are actually clickable (nothing covering
them), clicks and digit keys answer, typed answers are graded, the quiz reaches
the results screen, flashcards flip — and that no JavaScript error is thrown.

---

## Privacy

Everything lives in your browser's `localStorage` (keys, deck cache, progress,
question cache). The only network calls are: your Google Sheet, the AI provider
you configure (with your key), the Google Fonts stylesheet. No analytics, no server.
