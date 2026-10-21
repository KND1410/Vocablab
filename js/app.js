/* =========================================================
   VocabLab — app.js
   UI wiring: screens, topics, quiz flow, flashcards,
   settings dialog, theme, keyboard shortcuts.
   ========================================================= */
(function () {
  'use strict';
  const U = Util;

  /* ---------- Settings ---------- */
  const DEFAULTS = {
    aiProvider: 'gemini', geminiKey: '', geminiModel: '',
    oaiBase: 'https://api.groq.com/openai/v1', oaiKey: '', oaiModel: '', aiConns: {},
    targetLang: 'French', targetCode: 'fr-FR', autoPlay: true,
    sheetMode: 'links', sheetUrl: '', sheetApiKey: '', scriptUrl: '', links: '',
    quizTypes: ['mc', 'blank', 'translate'], direction: 'mixed', count: 20, source: 'auto',
    rotation: 0
  };
  const settings = Object.assign({}, DEFAULTS, U.lsGet('settings', {}));
  function saveSettings() { U.lsSet('settings', settings); }

  /* ---------- State ---------- */
  const state = {
    deck: U.lsGet('deck', null),
    selected: [],
    session: null,
    answered: false,
    flashcards: null,
    controller: null,
    screen: 'welcome'
  };

  const E = {};
  function cacheEls() {
    const ids = ['srcBadge', 'btnHelp', 'btnTheme', 'btnSettings', 'btnReload', 'srcName', 'srcMeta',
      'btnChangeSource', 'btnAllTopics', 'btnNoTopics', 'topicSearch', 'topicList', 'selectedSummary',
      'typeMc', 'typeBlank', 'typeTranslate', 'selDirection', 'selCount', 'selSource', 'btnStart', 'btnFlashcards',
      'statWords', 'statMastered', 'statAcc', 'screenWelcome', 'btnDemo', 'btnQuickSheet', 'btnQuickAi',
      'screenQuiz', 'progressBar', 'qProgressText', 'qStreak', 'qScore', 'btnExitQuiz', 'qCard', 'qTypeBadge',
      'qTopicBadge', 'btnSpeakPrompt', 'qPrompt', 'qHintBox', 'qOptions', 'qInputRow', 'qInput', 'btnSubmit',
      'btnDontKnow', 'qFeedback', 'fbIcon', 'fbTitle', 'fbBody', 'fbTerm', 'fbSpeak', 'fbPron', 'fbMeaning',
      'fbExample', 'btnNext', 'screenResults', 'resRing', 'resPct', 'resFraction', 'resTitle', 'resMeta',
      'resBreakdown', 'btnRetryMistakes', 'btnNewQuiz', 'btnResultsFlashcards', 'resMistakes', 'resMistakeList',
      'screenFlashcards', 'fcProgress', 'btnFcShuffle', 'btnFcExit', 'fcCard', 'fcTerm', 'fcPron', 'fcSpeak',
      'fcMeaning', 'fcExample', 'btnFcAgain', 'btnFcGood', 'btnFcPrev', 'btnFcNext',
      'settingsDialog', 'selProvider', 'providerHint', 'paneGemini', 'inpGeminiKey', 'btnToggleKey',
      'paneOai', 'inpOaiBase', 'inpOaiKey', 'btnToggleOaiKey',
      'btnTestKey', 'inpModel', 'modelList', 'btnRefreshModels',
      'aiStatus', 'aiIssue', 'usageToday', 'cachedCount', 'btnClearQCache', 'inpTargetLang', 'inpTargetCode', 'chkAutoPlay',
      'inpSheetUrl', 'inpSheetApiKey', 'btnLoadApi', 'inpScriptUrl', 'btnLoadScript', 'inpLinks', 'btnLoadLinks',
      'btnLoadDemo', 'sheetStatus', 'lnkShowScript', 'dataInfo', 'btnClearDeck', 'btnClearMastery',
      'btnClearAll', 'helpDialog', 'scriptCode', 'btnCopyScript', 'overlay', 'loadTitle', 'loadMsg',
      'loadBar', 'btnCancelLoad', 'fileWarn', 'sheetWarnings'];
    ids.forEach(function (id) { E[id] = U.$('#' + id); });
  }

  /* ---------- Theme ---------- */
  function applyTheme(pref) {
    const stored = pref || U.lsGet('theme', 'auto');
    const dark = stored === 'dark' ||
      (stored === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    E.btnTheme.textContent = dark ? '☀️' : '🌙';
  }
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    U.lsSet('theme', isDark ? 'light' : 'dark');
    applyTheme(isDark ? 'light' : 'dark');
  }

  /* ---------- Overlay ---------- */
  function showOverlay(title, msg) {
    E.loadTitle.textContent = title;
    E.loadMsg.textContent = msg || '';
    E.loadBar.style.width = '0%';
    E.overlay.hidden = false;
  }
  function overlayProgress(done, total, label) {
    const pct = total ? Math.round((done / total) * 100) : 5;
    E.loadBar.style.width = pct + '%';
    E.loadMsg.textContent = (label || '') + (total ? ' (' + done + '/' + total + ')' : '');
  }
  function hideOverlay() { E.overlay.hidden = true; }

  /* ---------- Screens ---------- */
  function showScreen(name) {
    state.screen = name;
    const map = { welcome: E.screenWelcome, quiz: E.screenQuiz, results: E.screenResults, flashcards: E.screenFlashcards };
    Object.keys(map).forEach(function (k) { map[k].hidden = k !== name; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Deck & topics ---------- */
  function allWords() { return Quiz.flattenDeck(state.deck, null); }
  function selectedWords() { return Quiz.flattenDeck(state.deck, state.selected); }

  function setDeck(deck, opts) {
    opts = opts || {};
    const previousIds = state.deck ? state.deck.topics.map(function (t) { return t.id; }) : [];
    state.deck = deck;
    U.lsSet('deck', deck);
    const validIds = deck.topics.map(function (t) { return t.id; });
    state.selected = state.selected.filter(function (id) { return validIds.indexOf(id) !== -1; });
    // New or renamed tabs get selected automatically — the sheet keeps growing.
    const fresh = validIds.filter(function (id) { return previousIds.indexOf(id) === -1; });
    if (fresh.length && state.selected.length) state.selected = state.selected.concat(fresh);
    if (!state.selected.length) state.selected = validIds.slice();
    renderTopics();
    updateSourceUI();
    updateStatsUI();
    updateControls();
    if (!opts.silent) {
      U.toast('Loaded ' + deck.wordCount + ' words in ' + deck.topics.length + ' topic' + (deck.topics.length === 1 ? '' : 's') + '.', 'ok');
    }
  }

  /** Persistent loading notes (shown in Settings → Google Sheet); toasts are transient. */
  function renderSheetWarnings(warnings) {
    const box = E.sheetWarnings;
    if (!box) return;
    box.innerHTML = '';
    if (!warnings || !warnings.length) { box.hidden = true; return; }
    const strong = document.createElement('strong');
    strong.textContent = warnings.length === 1 ? 'Loading note:' : 'Loading notes:';
    const ul = document.createElement('ul');
    warnings.forEach(function (w) {
      const li = document.createElement('li');
      li.textContent = w;
      ul.appendChild(li);
    });
    box.appendChild(strong);
    box.appendChild(ul);
    if (warnings.some(function (w) { return /tab names/i.test(w); })) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-subtle';
      btn.textContent = 'Add my tab names';
      btn.addEventListener('click', function () {
        openSettings('sheet');
        const input = E.inpLinks;
        if (input) {
          input.focus();
          if (input.scrollIntoView) input.scrollIntoView({ block: 'center' });
        }
      });
      box.appendChild(btn);
    }
    box.hidden = false;
  }

  function renderTopics() {
    const filter = U.normalize(E.topicSearch.value);
    const list = E.topicList;
    list.innerHTML = '';
    if (!state.deck) return;
    state.deck.topics.forEach(function (topic) {
      if (filter && U.normalize(topic.name).indexOf(filter) === -1) return;
      const li = document.createElement('li');
      li.className = 'topic-item' + (state.selected.indexOf(topic.id) !== -1 ? ' checked' : '');
      li.setAttribute('data-topic-id', topic.id);
      li.innerHTML = '<input type="checkbox" tabindex="-1"' + (state.selected.indexOf(topic.id) !== -1 ? ' checked' : '') + '>' +
        '<span class="t-name">' + U.esc(topic.name) + '</span>' +
        '<span class="t-count">' + topic.words.length + '</span>';
      list.appendChild(li);
    });
    updateSelected();
  }

  function toggleTopic(id) {
    const i = state.selected.indexOf(id);
    if (i === -1) state.selected.push(id); else state.selected.splice(i, 1);
    renderTopics();
    updateControls();
  }

  function updateSelected() {
    const words = selectedWords().length;
    E.selectedSummary.textContent = state.selected.length
      ? state.selected.length + ' topic' + (state.selected.length === 1 ? '' : 's') + ' selected · ' + words + ' words'
      : 'No topics selected';
  }

  function updateSourceUI() {
    if (!state.deck) {
      E.srcBadge.textContent = 'No deck loaded';
      E.srcName.textContent = 'Nothing loaded yet';
      E.srcMeta.textContent = 'Connect a Google Sheet or load the demo deck.';
      return;
    }
    const d = state.deck;
    E.srcBadge.textContent = d.source.label + ' · ' + d.wordCount + ' words';
    E.srcName.textContent = d.source.label;
    const when = d.loadedAt ? new Date(d.loadedAt).toLocaleString() : '';
    E.srcMeta.textContent = d.source.detail + ' · ' + d.topics.length +
      (d.topics.length === 1 ? ' topic' : ' topics') + ' · loaded ' + when;
  }

  function updateStatsUI() {
    if (!state.deck) {
      E.statWords.textContent = '0'; E.statMastered.textContent = '0'; E.statAcc.textContent = '–';
      return;
    }
    const words = allWords();
    E.statWords.textContent = String(words.length);
    E.statMastered.textContent = String(Quiz.masteredCount(words));
    const stats = Quiz.getStats();
    E.statAcc.textContent = stats.accuracy == null ? '–' : stats.accuracy + '%';
  }

  function updateControls() {
    const hasDeck = !!state.deck && state.deck.topics.length > 0;
    const hasTopics = state.selected.length > 0;
    const hasTypes = E.typeMc.checked || E.typeBlank.checked || E.typeTranslate.checked;
    E.btnStart.disabled = !(hasDeck && hasTopics && hasTypes);
    E.btnFlashcards.disabled = !(hasDeck && hasTopics);
  }

  /* ---------- Loading decks ---------- */
  async function loadDeck(config) {
    state.controller = new AbortController();
    showOverlay('Loading vocabulary…', 'Contacting the source…');
    try {
      const deck = await Sources.load(config, overlayProgress, state.controller.signal);
      if (!deck.topics.length) {
        throw Object.assign(new Error('No vocabulary found'),
          { friendly: 'No usable rows were found. Check that each tab has a Vocab column and a Vietnamese column.' });
      }
      const warnings = (deck.source && deck.source.warnings) || [];
      // One outcome message: either the plain success toast, or a single warning
      // that also reports what did load (never both).
      setDeck(deck, { silent: warnings.length > 0 });
      saveSettings();
      if (E.settingsDialog.open) E.settingsDialog.close();
      renderSheetWarnings(warnings);
      E.sheetStatus.textContent = 'Loaded: ' + deck.source.label + ' — ' + deck.wordCount + ' words' +
        (warnings.length ? ' · ' + warnings.length + ' warning' + (warnings.length === 1 ? '' : 's') : '') + '.';
      if (warnings.length) {
        // One sentence, so it reads as a single notice: what loaded — and what to do.
        const caveat = warnings[0].charAt(0).toLowerCase() + warnings[0].slice(1);
        U.toast('Loaded ' + deck.wordCount + ' words in ' + deck.topics.length + ' topic' +
          (deck.topics.length === 1 ? '' : 's') + ' — ' + caveat +
          (warnings.length > 1 ? ' (+' + (warnings.length - 1) + ' more — see Settings → Google Sheet.)' : ''), 'warn');
      }
    } catch (e) {
      if (e && e.name === 'AbortError') {
        U.toast('Loading cancelled.', 'warn');
      } else {
        U.toast(e.friendly || e.message || 'Failed to load vocabulary.', 'bad');
        E.sheetStatus.textContent = 'Error: ' + (e.friendly ? e.friendly.split('\n')[0] : e.message);
      }
    } finally {
      state.controller = null;
      hideOverlay();
      updateControls();
    }
  }

  /* ---------- Quiz flow ---------- */
  function readSetup() {
    const types = [];
    if (E.typeMc.checked) types.push('mc');
    if (E.typeBlank.checked) types.push('blank');
    if (E.typeTranslate.checked) types.push('translate');
    settings.quizTypes = types;
    settings.direction = E.selDirection.value;
    settings.count = parseInt(E.selCount.value, 10) || 0;
    settings.source = E.selSource.value;
    saveSettings();
    return { types: types, direction: settings.direction, count: settings.count, source: settings.source };
  }

  /* ---------- Active AI provider ---------- */
  /* Ai.providers is the whole list Settings → AI shows. A provider is either
     Google's own API ('gemini') or an OpenAI-compatible endpoint, which only
     differs by base URL — so everything below keeps working off the transport. */
  const PROVIDERS = Ai.providers;

  function providerDef(id) { return Ai.providerById(id) || PROVIDERS[0]; }
  /** The provider the learner picked (an id from the provider table). */
  function activeProviderId() {
    return Ai.providerById(settings.aiProvider) ? settings.aiProvider : 'gemini';
  }
  /** How we talk to it: Google's API, or OpenAI-compatible. */
  function activeProvider() { return providerDef(activeProviderId()).transport; }
  function activeKey() {
    return Ai.normalizeKey(activeProvider() === 'openai' ? settings.oaiKey : settings.geminiKey);
  }
  function activeBase() { return activeProvider() === 'openai' ? (settings.oaiBase || '') : ''; }
  function baseKey(base) { return String(base || '').trim().replace(/\/+$/, '').toLowerCase(); }
  function sameBase(a, b) { return !!baseKey(a) && baseKey(a) === baseKey(b); }
  function defaultModelForBase(base) {
    for (const p of PROVIDERS) {
      if (p.base && sameBase(p.base, base)) return p.model || '';
    }
    if (Ai.isLocalBaseUrl(base)) return 'llama3.2';
    return '';
  }
  function activeModel() {
    if (activeProvider() === 'openai') {
      return settings.oaiModel || defaultModelForBase(settings.oaiBase) ||
        providerDef(activeProviderId()).model || 'openrouter/free';
    }
    return settings.geminiModel || 'gemini-flash-latest';
  }
  function setActiveModel(id) {
    if (activeProvider() === 'openai') settings.oaiModel = id; else settings.geminiModel = id;
    rememberConn();
    saveSettings();
  }

  /* Each OpenAI-compatible provider keeps the base URL, key and model you last
     used with it, so switching providers never means retyping a key. */
  function connStore() {
    if (!settings.aiConns || typeof settings.aiConns !== 'object') settings.aiConns = {};
    return settings.aiConns;
  }
  function rememberConn() {
    const id = activeProviderId();
    if (id === 'gemini') return;
    connStore()[id] = {
      base: settings.oaiBase || '', key: Ai.normalizeKey(settings.oaiKey), model: settings.oaiModel || ''
    };
  }
  function loadConn(id) {
    const def = providerDef(id);
    const saved = connStore()[id] || {};
    settings.oaiBase = saved.base || def.base || '';
    settings.oaiKey = Ai.normalizeKey(saved.key);
    settings.oaiModel = saved.model || def.model || defaultModelForBase(settings.oaiBase);
  }
  /** Older settings only knew 'openai' + a base URL: name the provider we recognise. */
  function migrateProvider() {
    if (settings.aiProvider !== 'openai') return;
    for (const p of PROVIDERS) {
      if (p.base && sameBase(p.base, settings.oaiBase)) {
        settings.aiProvider = p.id;
        saveSettings();
        return;
      }
    }
  }
  /**
   * Keys saved before the field cleaned them up (e.g. “Bearer gsk_…”, quotes,
   * a stray newline) would keep failing with 401. Clean them in place once.
   */
  function normalizeStoredKeys() {
    const oai = Ai.normalizeKey(settings.oaiKey);
    const gem = Ai.normalizeKey(settings.geminiKey);
    if (oai !== (settings.oaiKey || '') || gem !== (settings.geminiKey || '')) {
      settings.oaiKey = oai;
      settings.geminiKey = gem;
      saveSettings();
    }
  }
  // Ready when a key exists — or, for local servers (Ollama), when the base URL is localhost.
  function aiReady() {
    return !!activeKey() || (activeProvider() === 'openai' && Ai.isLocalBaseUrl(activeBase()));
  }
  function providerName() { return activeProvider() === 'openai' ? 'AI provider' : 'Gemini'; }

  async function startQuiz(opts) {
    opts = opts || {};
    if (!state.deck) { U.toast('Load a vocabulary deck first.', 'warn'); return; }
    const setup = readSetup();
    if (!setup.types.length) { U.toast('Pick at least one question type.', 'warn'); return; }

    let words = opts.words;
    if (!words) {
      const available = selectedWords();
      if (!available.length) { U.toast('Select at least one topic.', 'warn'); return; }
      words = Quiz.selectWords(available, setup.count);
    }
    if (!words.length) { U.toast('No words to practise.', 'warn'); return; }

    const items = Quiz.planItems(words, setup.types, setup.direction, settings.rotation);
    settings.rotation = (settings.rotation + words.length) % 1000;
    saveSettings();

    const pool = selectedWords().length >= 4 ? selectedWords() : allWords();
    const useAi = (setup.source === 'ai' || setup.source === 'auto') && aiReady();

    state.controller = new AbortController();
    showOverlay('Building your quiz…', useAi ? 'Asking the AI for fresh questions…' : 'Preparing questions…');
    try {
      const result = await Quiz.buildPool({
        items: items,
        pool: pool,
        source: setup.source,
        aiProvider: activeProvider(),
        aiBaseUrl: activeBase(),
        aiKey: activeKey(),
        aiModel: activeModel(),
        targetLang: settings.targetLang,
        meaningLang: 'Vietnamese',
        onProgress: overlayProgress,
        signal: state.controller.signal
      });

      if (!result.questions.length) {
        throw Object.assign(new Error('No questions'),
          { friendly: 'Could not build any questions from these words.' });
      }

      state.session = {
        questions: Quiz.makeSession(result.questions, 0),
        index: 0,
        answers: [],
        score: 0,
        streak: 0,
        bestStreak: 0,
        startedAt: Date.now(),
        fromMistakes: !!opts.words
      };
      state.answered = false;

      if (setup.source === 'ai' && !aiReady()) {
        U.toast('No ' + providerName() + ' key set — using built-in questions. Add one in Settings → AI.', 'warn');
      } else if (result.aiError) {
        const err = result.aiError;
        const detail = err.friendly || err.message || 'AI generation failed.';
        // A local server that is not there, or a provider whose quota ran out:
        // both have an obvious way out, so offer it.
        const quota = err.status === 429 || /429|quota|rate limit|free-tier limit/i.test(String(detail));
        showAiIssue(err.detail || detail, err.hint === 'offline' ? 'local' : (quota ? 'quota' : ''));
        U.toast('AI generation issue — built-in questions cover the rest.\n' + detail, 'warn', 14000);
      } else if (result.aiUsed) {
        showAiIssue('');
        U.toast((activeProvider() === 'openai' ? providerDef(activeProviderId()).short : 'Gemini') + ' wrote ' + result.aiUsed + ' questions.', 'ok');
      }
      updateUsageUI();
      showScreen('quiz');
      renderQuestion();
    } catch (e) {
      if (e && e.name === 'AbortError') U.toast('Generation cancelled — falling back to built-in questions is available.', 'warn');
      else U.toast(e.friendly || e.message || 'Could not build the quiz.', 'bad');
    } finally {
      state.controller = null;
      hideOverlay();
    }
  }

  function renderQuestion() {
    const s = state.session;
    const q = s.questions[s.index];
    state.answered = false;

    E.progressBar.style.width = Math.round((s.index / s.questions.length) * 100) + '%';
    E.qProgressText.textContent = 'Question ' + (s.index + 1) + ' of ' + s.questions.length;
    E.qScore.textContent = s.score + ' ✓';
    if (s.streak >= 2) { E.qStreak.hidden = false; E.qStreak.querySelector('span').textContent = String(s.streak); }
    else E.qStreak.hidden = true;

    E.qTypeBadge.textContent = Quiz.typeLabel(q.type) + (q.source === 'ai' ? ' ✨' : '');
    E.qTopicBadge.hidden = !q.word.topicName;
    E.qTopicBadge.textContent = q.word.topicName || '';

    E.qPrompt.innerHTML = U.esc(q.prompt).replace(/(_{2,})/g, '<span class="blank">$1</span>');
    E.qHintBox.hidden = !q.hint;
    E.qHintBox.textContent = q.hint || '';

    const speakable = q.type !== 'blank' && q.direction !== 'meaning2term';
    E.btnSpeakPrompt.hidden = !speakable;

    E.qFeedback.hidden = true;
    E.qFeedback.className = 'feedback';
    E.qOptions.innerHTML = '';
    E.qOptions.hidden = true;
    E.qInputRow.hidden = true;
    E.btnDontKnow.hidden = false;
    E.qInput.disabled = false;

    if (q.type === 'mc') {
      E.qOptions.hidden = false;
      q.options.forEach(function (option, i) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option';
        btn.innerHTML = '<span class="opt-letter">' + 'ABCD'[i % 4] + '</span>' +
          '<span class="opt-main"><span class="opt-text">' + U.esc(option) + '</span></span>';
        btn.addEventListener('click', function () { answerMc(option, i); });
        E.qOptions.appendChild(btn);
      });
    } else {
      E.qInputRow.hidden = false;
      E.qInput.value = '';
      E.qInput.placeholder = q.type === 'blank' ? 'Type the missing word…' : 'Type your answer…';
      E.qInput.focus();
    }

    E.qCard.classList.remove('enter');
    void E.qCard.offsetWidth;
    E.qCard.classList.add('enter');
  }

  /** The question currently on screen (the session owns the index). */
  function currentQuestion() {
    const s = state.session;
    if (!s || !s.questions) return null;
    return s.questions[s.index] || null;
  }

  function answerMc(value, index) {
    if (state.answered) return;
    const q = currentQuestion();
    if (!q || !q.options) return;
    state.answered = true;
    const buttons = Array.from(E.qOptions.querySelectorAll('.option'));
    buttons.forEach(function (btn, i) {
      btn.disabled = true;
      const text = q.options[i];
      if (Quiz.sameAnswer(text, q.answer)) btn.classList.add('correct');
      else if (i === index) btn.classList.add('wrong');
      else btn.classList.add('dim');
      revealTranslation(btn, text, q.direction);
    });
    finishAnswer(Quiz.grade(q, value), value);
  }

  function submitTyped(skip) {
    if (state.answered) return;
    const q = currentQuestion();
    if (!q) return;
    if (q.type === 'mc') { answerMc('', -1); return; }
    const value = skip ? '' : E.qInput.value;
    state.answered = true;
    E.qInput.disabled = true;
    finishAnswer(skip ? { verdict: 'wrong', correctAnswer: q.answer, note: '' } : Quiz.grade(q, value), value);
  }

  function finishAnswer(result, response) {
    const s = state.session;
    const q = s.questions[s.index];
    const correct = result.verdict === 'correct' || result.verdict === 'accent';

    s.answers.push({ question: q, response: response, verdict: result.verdict, correct: correct, at: Date.now() });
    if (correct) { s.score += 1; s.streak += 1; s.bestStreak = Math.max(s.bestStreak, s.streak); }
    else s.streak = 0;
    Quiz.recordAnswer(q, correct);

    E.qScore.textContent = s.score + ' ✓';
    if (s.streak >= 2) { E.qStreak.hidden = false; E.qStreak.querySelector('span').textContent = String(s.streak); }
    E.progressBar.style.width = Math.round(((s.index + 1) / s.questions.length) * 100) + '%';

    const fb = E.qFeedback;
    fb.hidden = false;
    fb.className = 'feedback ' + (result.verdict === 'wrong' ? 'bad' : (result.verdict === 'close' ? 'close' : 'ok'));
    E.fbIcon.textContent = correct ? '✓' : (result.verdict === 'close' ? '≈' : '✕');

    let title = 'Correct!';
    let body = q.explanation ? U.esc(q.explanation) : '';
    if (result.verdict === 'accent') {
      title = 'Correct — watch the accents';
      body = (result.note ? U.esc(result.note) + ' ' : '') + 'Full spelling: <strong>' + U.esc(result.correctAnswer) + '</strong>';
    } else if (result.verdict === 'close') {
      title = 'So close!';
      body = 'Check your spelling — correct answer: <strong>' + U.esc(result.correctAnswer) + '</strong>';
    } else if (!correct) {
      title = "Not quite";
      body = 'Correct answer: <strong>' + U.esc(result.correctAnswer) + '</strong>' +
        (q.explanation ? '<br>' + U.esc(q.explanation) : '');
    } else {
      if (!body) body = 'Nice one.';
      if (result.note) body += '<br>' + U.esc(result.note);
    }
    E.fbTitle.textContent = title;
    E.fbBody.innerHTML = body;

    E.fbTerm.textContent = q.word.term;
    E.fbPron.hidden = !q.word.pron;
    E.fbPron.textContent = q.word.pron || '';
    E.fbMeaning.textContent = '🇻🇳 ' + q.word.meaning;
    E.fbExample.hidden = !q.word.example;
    E.fbExample.textContent = q.word.example || '';
    E.btnDontKnow.hidden = true;

    if (settings.autoPlay) U.speak(q.word.term, settings.targetCode);
    setTimeout(function () { E.btnNext.focus(); }, 60);
    updateStatsUI();
  }

  /**
   * After answering, show what each option means in the other language, right
   * under the option: a card of `cardiaque` gets `tim mạch` underneath, and a
   * Vietnamese option shows the French word it belongs to. Options the sheet
   * never defines (some AI-written distractors) simply stay as they are.
   */
  function revealTranslation(btn, text, direction) {
    const others = Quiz.counterpart(text, direction, allWords());
    if (!others.length) return;
    const main = btn.querySelector('.opt-main');
    if (!main) return;
    const line = document.createElement('span');
    line.className = 'opt-sub';
    line.textContent = others.join(' · ');
    main.appendChild(line);
  }

  function nextQuestion() {
    if (!state.session) return;
    state.session.index += 1;
    if (state.session.index >= state.session.questions.length) showResults();
    else renderQuestion();
  }

  /* ---------- Results ---------- */
  function showResults() {
    const s = state.session;
    if (!s) { showScreen('welcome'); return; }
    const total = s.answers.length;
    const correct = s.answers.filter(function (a) { return a.correct; }).length;
    const pct = total ? Math.round((correct / total) * 100) : 0;

    const C = 2 * Math.PI * 52;
    E.resRing.style.strokeDasharray = String(C);
    E.resRing.style.strokeDashoffset = String(C);
    E.resPct.textContent = pct + '%';
    E.resFraction.textContent = correct + '/' + total;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        E.resRing.style.strokeDashoffset = String(C * (1 - pct / 100));
      });
    });

    E.resTitle.textContent = pct >= 90 ? 'Outstanding! 🎉' : pct >= 70 ? 'Nice work!' : pct >= 50 ? 'Good effort' : 'Keep practising';
    const elapsed = Date.now() - s.startedAt;
    E.resMeta.textContent = correct + ' of ' + total + ' correct · ' + U.formatDuration(elapsed) +
      (s.bestStreak >= 3 ? ' · best streak ' + s.bestStreak : '') +
      (s.fromMistakes ? ' · mistake review' : '');

    // Per-type breakdown
    const byType = {};
    s.answers.forEach(function (a) {
      const t = a.question.type;
      byType[t] = byType[t] || { total: 0, correct: 0 };
      byType[t].total += 1;
      if (a.correct) byType[t].correct += 1;
    });
    E.resBreakdown.innerHTML = Object.keys(byType).map(function (t) {
      const b = byType[t];
      const p = Math.round((b.correct / b.total) * 100);
      return '<div class="bd-row"><span>' + U.esc(Quiz.typeLabel(t)) + '</span>' +
        '<span class="bd-bar"><div style="width:' + p + '%"></div></span>' +
        '<span class="bd-count">' + b.correct + '/' + b.total + '</span></div>';
    }).join('');

    // Mistake list (unique words)
    const byWord = {};
    s.answers.forEach(function (a) {
      if (a.correct) return;
      const key = Quiz.masteryKey(a.question.word);
      if (!byWord[key]) byWord[key] = { word: a.question.word, count: 0 };
      byWord[key].count += 1;
    });
    const mistakes = Object.keys(byWord).map(function (k) { return byWord[k]; });
    E.resMistakes.hidden = !mistakes.length;
    E.resMistakeList.innerHTML = mistakes.map(function (m) {
      return '<li class="mistake-row"><span class="mistake-term">' + U.esc(m.word.term) + '</span>' +
        '<span class="mistake-meaning">' + U.esc(m.word.meaning) + '</span>' +
        '<button class="icon-btn icon-btn-sm speak-btn" data-term="' + U.esc(m.word.term) + '" title="Listen">🔊</button>' +
        '<span class="mistake-count">×' + m.count + '</span></li>';
    }).join('');
    E.resMistakeList.querySelectorAll('.speak-btn').forEach(function (b) {
      b.addEventListener('click', function () { U.speak(b.getAttribute('data-term'), settings.targetCode); });
    });
    E.btnRetryMistakes.hidden = !mistakes.length;
    E.btnRetryMistakes.onclick = function () {
      startQuiz({ words: mistakes.map(function (m) { return m.word; }) });
    };

    showScreen('results');
    updateStatsUI();
  }

  /* ---------- Flashcards ---------- */
  function startFlashcards() {
    if (!state.deck) return;
    const available = selectedWords();
    if (!available.length) { U.toast('Select at least one topic.', 'warn'); return; }
    const count = parseInt(E.selCount.value, 10) || 0;
    let list = U.shuffle(available);
    if (count > 0 && count < list.length) list = list.slice(0, count);
    state.flashcards = { list: list, index: 0, flipped: false };
    showScreen('flashcards');
    renderFlashcard();
  }

  function renderFlashcard() {
    const fc = state.flashcards;
    if (!fc || !fc.list.length) return;
    const word = fc.list[fc.index];
    E.fcProgress.textContent = (fc.index + 1) + ' / ' + fc.list.length +
      (fc.list.length !== selectedWords().length ? ' · ' + word.topicName : '');
    E.fcTerm.textContent = word.term;
    E.fcPron.hidden = !word.pron;
    E.fcPron.textContent = word.pron || '';
    E.fcMeaning.textContent = word.meaning;
    E.fcExample.hidden = !word.example;
    E.fcExample.textContent = word.example || '';
    E.fcCard.classList.toggle('flipped', !!fc.flipped);
  }

  function fcFlip() {
    const fc = state.flashcards;
    if (!fc) return;
    fc.flipped = !fc.flipped;
    E.fcCard.classList.toggle('flipped', fc.flipped);
  }

  function fcMove(delta) {
    const fc = state.flashcards;
    if (!fc) return;
    fc.index = (fc.index + delta + fc.list.length) % fc.list.length;
    fc.flipped = false;
    renderFlashcard();
  }

  function fcMark(correct) {
    const fc = state.flashcards;
    if (!fc) return;
    const word = fc.list[fc.index];
    Quiz.recordAnswer({ word: word }, correct);
    updateStatsUI();
    if (correct) {
      fc.index += 1;
      if (fc.index >= fc.list.length) {
        U.toast('You reached the end of the deck! 🎉', 'ok');
        fc.index = 0;
      }
    } else {
      const card = fc.list.splice(fc.index, 1)[0];
      fc.list.push(card);
      if (fc.index >= fc.list.length) fc.index = 0;
    }
    fc.flipped = false;
    renderFlashcard();
  }

  /* ---------- Settings dialog ---------- */
  function syncSettingsUI() {
    E.inpGeminiKey.value = settings.geminiKey || '';
    E.inpTargetLang.value = settings.targetLang || 'English';
    E.inpTargetCode.value = settings.targetCode || 'en-US';
    E.chkAutoPlay.checked = !!settings.autoPlay;
    E.inpSheetUrl.value = settings.sheetUrl || '';
    E.inpSheetApiKey.value = settings.sheetApiKey || '';
    E.inpScriptUrl.value = settings.scriptUrl || '';
    E.inpLinks.value = settings.links || '';
    E.typeMc.checked = settings.quizTypes.indexOf('mc') !== -1;
    E.typeBlank.checked = settings.quizTypes.indexOf('blank') !== -1;
    E.typeTranslate.checked = settings.quizTypes.indexOf('translate') !== -1;
    E.selDirection.value = settings.direction;
    E.selCount.value = String(settings.count);
    E.selSource.value = settings.source;
    const mode = settings.sheetMode || 'api';
    U.$$('input[name="sheetMode"]').forEach(function (r) { r.checked = r.value === mode; });
    syncModePanes(mode);
    syncAiUI();
    updateUsageUI();
    updateDataInfo();
  }

  function syncAiUI() {
    const id = activeProviderId();
    const transport = activeProvider();
    renderProviderOptions();
    E.selProvider.value = id;
    if (E.providerHint) E.providerHint.innerHTML = providerHint(id);
    E.paneGemini.hidden = transport !== 'gemini';
    E.paneOai.hidden = transport !== 'openai';
    E.inpGeminiKey.value = settings.geminiKey || '';
    E.inpOaiBase.value = settings.oaiBase || '';
    E.inpOaiKey.value = settings.oaiKey || '';
    const model = activeModel();
    ensureModelOption(model);
    E.inpModel.value = model;
    E.btnTestKey.textContent = transport === 'openai' ? 'Test & load models' : 'Test key & load models';
  }

  function renderProviderOptions() {
    if (E.selProvider.dataset.filled) return;
    E.selProvider.innerHTML = '';
    PROVIDERS.forEach(function (p) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      E.selProvider.appendChild(opt);
    });
    E.selProvider.dataset.filled = '1';
  }

  function linkTo(url) {
    return '<a href="' + url + '" target="_blank" rel="noopener">' + url.replace(/^https?:\/\//, '') + '</a>';
  }

  /** What it takes to use the selected provider — where the key comes from, and
      what it costs (so “out of free tier” is visible before it happens). */
  function providerHint(id) {
    const def = providerDef(id);
    if (id === 'ollama') {
      return 'Runs on your computer, not online: install <a href="' + def.keyUrl + '" target="_blank" rel="noopener">Ollama</a>, ' +
        'start it (<code>ollama serve</code>) and pull a model (<code>ollama pull llama3.2</code>). No key, no sign-up.';
    }
    if (id === 'openai') {
      return 'Paste any OpenAI-compatible Base URL and its API key, then press “Test &amp; load models”.';
    }
    if (id === 'gemini') {
      return 'Google\'s own API. The free tier is a daily quota per project — when it runs out, pick another provider ' +
        'above (Groq, Cerebras and OpenRouter have their own free tiers) instead of making a new project.';
    }
    if (def.needsAccountId) {
      return 'Key and account ID from ' + linkTo(def.keyUrl) + '. Replace <code>REPLACE_WITH_ACCOUNT_ID</code> in the ' +
        'Base URL below with your account ID, then press “Test &amp; load models”.';
    }
    const cost = def.cost === 'paid' ? ' — paid, but only a few cents per quiz'
      : def.cost === 'trial' ? ' — free trial credit, then pay as you go'
        : ' — free';
    const fmt = def.keyPrefix ? ' ' + def.short + ' keys look like “' + def.keyPrefix + '…”.' : '';
    // Groq and Grok are one letter apart and get mixed up constantly.
    const notGrok = id === 'groq'
      ? ' (Not xAI\'s Grok — a different company, different keys: xai-….)'
      : '';
    return 'Get a key at ' + linkTo(def.keyUrl) + cost + '.' + fmt + notGrok +
      ' Each provider keeps its own key, so you can switch back and forth without retyping. ' +
      'Stored only in this browser — requests go straight to the provider.';
  }

  /** The status line under the test button, after picking a provider. */
  function providerStatus(id) {
    const def = providerDef(id);
    if (def.needsAccountId && /REPLACE_WITH_ACCOUNT_ID/.test(settings.oaiBase)) {
      E.aiStatus.textContent = 'Preset loaded — replace REPLACE_WITH_ACCOUNT_ID in the Base URL with your Cloudflare account ID, paste the key, then test.';
    } else if (Ai.isLocalBaseUrl(settings.oaiBase)) {
      const local = typeof location !== 'undefined' && location.protocol === 'file:';
      E.aiStatus.textContent = 'Preset loaded — no API key needed, but Ollama must be installed and running on this computer (ollama serve; then “Test & load models”).' +
        (local
          ? ' This page is a file:// URL, which Ollama refuses by default: restart Ollama with OLLAMA_ORIGINS=*, or serve the folder over http (python3 -m http.server 8000) and open it there.'
          : ' If it blocks this page, restart Ollama with OLLAMA_ORIGINS=*.');
    } else if (id === 'gemini') {
      E.aiStatus.textContent = 'Gemini selected — paste your free key above, then press “Test key & load models”.';
    } else {
      E.aiStatus.textContent = def.short + ' selected — paste its key above, then press “Test & load models”.';
    }
  }

  /** Switch provider, keeping whatever was set up for the previous one. */
  function useProvider(id) {
    if (id === activeProviderId()) return;
    rememberConn();
    settings.aiProvider = id;
    if (id !== 'gemini') loadConn(id);
    saveSettings();
    syncAiUI();
    showAiIssue('');
    keyShapeShown = '';
    providerStatus(id);
    warnKeyShape();
    focusActiveKey();
  }

  function focusActiveKey() {
    const field = activeProvider() === 'openai' ? E.inpOaiKey : E.inpGeminiKey;
    if (field && !field.value) field.focus();
  }

  function syncModePanes(mode) {
    U.$$('.mode-pane').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== mode; });
  }

  function modelLabel(id) {
    return activeProvider() === 'openai' ? id : Ai.prettifyModel(id);
  }

  function ensureModelOption(id) {
    if (!id) return;
    const exists = Array.from(E.modelList.options).some(function (o) { return o.value === id; });
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.label = modelLabel(id);
      E.modelList.appendChild(opt);
    }
  }

  /**
   * Keep the full “what to do about it” text of an AI failure in Settings → AI,
   * with a way out when there is an obvious one: a locally-run provider that
   * isn't there, or a provider whose free quota is used up.
   */
  function showAiIssue(text, offer) {
    const msg = String(text || '').trim();
    if (!E.aiIssue) return;
    E.aiIssue.textContent = msg; // also drops any previous action button
    E.aiIssue.hidden = !msg;
    if (!msg || !offer) return;
    const to = offer === 'quota' ? 'groq' : 'gemini';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-subtle btn-sm';
    btn.id = 'btnAiUseKey';
    btn.style.marginTop = '.5rem';
    btn.textContent = offer === 'quota' ? 'Switch to Groq (free)' : 'Use a free Gemini/Groq key instead';
    btn.addEventListener('click', function () { useKeyProvider(to); });
    E.aiIssue.appendChild(btn);
  }

  /** Leave a provider that can't work and point the user at one that can. */
  function useKeyProvider(to) {
    const id = Ai.providerById(to) ? to : 'gemini';
    const def = providerDef(id);
    useProvider(id);
    U.toast(id === 'gemini'
      ? 'Switched to Gemini — paste your free key, then press “Test key & load models”.'
      : def.short + ' selected — get a key at ' + def.keyUrl + ', paste it, then press “Test & load models”.',
      'ok');
  }

  /**
   * The moment a key is pasted, say if it can't be the selected provider's —
   * waiting for the 401 it would earn only hides that fact behind a status code.
   */
  let keyShapeShown = '';
  function warnKeyShape() {
    const issue = Ai.keyShapeWarning(activeProviderId(), activeKey());
    if (issue) {
      keyShapeShown = issue;
      showAiIssue(issue);
      E.aiStatus.textContent = '✕ ' + issue;
      return;
    }
    // Nothing wrong any more — clear the warning we put there ourselves.
    if (keyShapeShown && E.aiIssue && E.aiIssue.textContent === keyShapeShown) {
      keyShapeShown = '';
      showAiIssue('');
      E.aiStatus.textContent = activeProvider() === 'gemini'
        ? 'Key saved — press “Test key & load models” to check it and load the model list.'
        : 'Key saved — press “Test & load models” to check it and load the model list.';
    }
  }

  function populateModels(models) {
    E.modelList.innerHTML = '';
    models.forEach(function (m) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.label = m.label || m.id;
      E.modelList.appendChild(opt);
    });
    const current = activeModel();
    const preferred = models.some(function (m) { return m.id === current; })
      ? current
      : (Ai.pickDefaultModel(models, activeProvider()) || current);
    ensureModelOption(preferred);
    E.inpModel.value = preferred;
    setActiveModel(preferred);
  }

  async function testKey() {
    const provider = activeProvider();
    if (provider === 'openai') {
      settings.oaiBase = E.inpOaiBase.value.trim();
      settings.oaiKey = Ai.normalizeKey(E.inpOaiKey.value);
    } else {
      settings.geminiKey = Ai.normalizeKey(E.inpGeminiKey.value);
    }
    saveSettings();
    // A key pasted from the wrong dashboard can never work, so say so before
    // spending a round trip on the 401 it would earn.
    const shape = Ai.keyShapeWarning(activeProviderId(), activeKey());
    if (shape) { E.aiStatus.textContent = 'Testing connection… (' + shape.split(' — ')[0] + ')'; }
    else E.aiStatus.textContent = 'Testing connection…';
    try {
      const models = await Ai.listModels({ provider: provider, key: activeKey(), baseUrl: activeBase() });
      showAiIssue('');
      if (!models.length) {
        E.aiStatus.textContent = 'Connection works, but no chat models were listed. Type a model ID in the box, then start a quiz.';
        return;
      }
      populateModels(models);
      E.aiStatus.textContent = '✓ Works — ' + models.length + ' models available. Using: ' + activeModel();
      U.toast(providerDef(activeProviderId()).short + ' works. Model: ' + activeModel(), 'ok');
    } catch (e) {
      const detail = e.friendly || e.message;
      // The shape problem explains this failure better than the 401 does.
      const message = shape && /401|403|rejected this key/.test(detail) ? shape : detail;
      E.aiStatus.textContent = '✕ ' + message;
      showAiIssue(message, e.hint === 'offline');
      U.toast(message, 'bad', 12000);
    }
  }

  function updateUsageUI() {
    const u = Ai.usageGet();
    E.usageToday.textContent = String(u.count);
    E.cachedCount.textContent = String(Quiz.cacheCount());
  }

  function updateDataInfo() {
    const parts = [];
    if (state.deck) {
      parts.push('Cached deck: ' + state.deck.source.label + ' — ' + state.deck.wordCount + ' words in ' +
        state.deck.topics.length + ' topics.');
    } else {
      parts.push('No deck cached.');
    }
    const stats = Quiz.getStats();
    parts.push('Answered: ' + stats.answers + (stats.accuracy == null ? '' : ' · accuracy ' + stats.accuracy + '%'));
    parts.push('Cached AI questions: ' + Quiz.cacheCount());
    parts.push('Browser storage used: ' + (U.lsBytes() / 1024).toFixed(1) + ' KB');
    E.dataInfo.innerHTML = parts.map(U.esc).join('<br>');
  }

  function openSettings(tab) {
    syncSettingsUI();
    if (tab) {
      U.$$('.tab-btn', E.settingsDialog).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
      U.$$('.tab-pane', E.settingsDialog).forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pane') === tab); });
    }
    E.settingsDialog.showModal();
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    E.btnTheme.addEventListener('click', toggleTheme);
    E.btnSettings.addEventListener('click', function () { openSettings('ai'); });
    E.btnChangeSource.addEventListener('click', function () { openSettings('sheet'); });
    E.btnHelp.addEventListener('click', function () { E.helpDialog.showModal(); });
    E.btnQuickSheet.addEventListener('click', function () { openSettings('sheet'); });
    E.btnQuickAi.addEventListener('click', function () { openSettings('ai'); });
    E.lnkShowScript.addEventListener('click', function (e) {
      e.preventDefault();
      E.settingsDialog.close();
      E.helpDialog.showModal();
    });
    E.btnCopyScript.addEventListener('click', function () {
      const text = E.scriptCode.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { U.toast('Script copied.', 'ok'); },
          function () { U.toast('Copy failed — select the code manually.', 'bad'); });
      } else {
        U.toast('Clipboard not available — select the code manually.', 'warn');
      }
    });

    // Reload
    E.btnReload.addEventListener('click', function () {
      loadDeck({ mode: settings.sheetMode, sheetUrl: settings.sheetUrl, sheetApiKey: settings.sheetApiKey, scriptUrl: settings.scriptUrl, links: settings.links });
    });

    // Topics
    E.topicSearch.addEventListener('input', U.debounce(renderTopics, 120));
    E.btnAllTopics.addEventListener('click', function () { state.selected = state.deck ? state.deck.topics.map(function (t) { return t.id; }) : []; renderTopics(); updateControls(); });
    E.btnNoTopics.addEventListener('click', function () { state.selected = []; renderTopics(); updateControls(); });
    E.topicList.addEventListener('click', function (e) {
      const item = e.target.closest('.topic-item');
      if (item) toggleTopic(item.getAttribute('data-topic-id'));
    });

    // Quiz setup controls
    ['typeMc', 'typeBlank', 'typeTranslate', 'selDirection', 'selCount', 'selSource'].forEach(function (id) {
      E[id].addEventListener('change', function () { readSetup(); updateControls(); });
    });
    E.btnStart.addEventListener('click', function () { startQuiz(); });
    E.btnFlashcards.addEventListener('click', startFlashcards);
    E.btnSubmit.addEventListener('click', function () { submitTyped(false); });
    E.btnDontKnow.addEventListener('click', function () { submitTyped(true); });
    E.btnNext.addEventListener('click', nextQuestion);
    E.btnExitQuiz.addEventListener('click', function () {
      if (state.session && state.session.answers.length) showResults();
      else { state.session = null; showScreen('welcome'); }
    });
    E.btnNewQuiz.addEventListener('click', function () { startQuiz(); });
    E.btnResultsFlashcards.addEventListener('click', startFlashcards);
    E.btnSpeakPrompt.addEventListener('click', function () {
      const q = state.session && state.session.questions[state.session.index];
      if (q) U.speak(q.prompt.replace(/_+/g, ''), settings.targetCode);
    });
    E.fbSpeak.addEventListener('click', function () {
      const q = state.session && state.session.questions[state.session.index];
      if (q) U.speak(q.word.term, settings.targetCode);
    });

    // Flashcards
    E.fcCard.addEventListener('click', fcFlip);
    E.fcCard.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fcFlip(); }
    });
    E.btnFcPrev.addEventListener('click', function () { fcMove(-1); });
    E.btnFcNext.addEventListener('click', function () { fcMove(1); });
    E.btnFcShuffle.addEventListener('click', function () {
      state.flashcards.list = U.shuffle(state.flashcards.list);
      state.flashcards.index = 0;
      state.flashcards.flipped = false;
      renderFlashcard();
    });
    E.btnFcExit.addEventListener('click', function () { state.flashcards = null; showScreen('welcome'); });
    E.btnFcAgain.addEventListener('click', function () { fcMark(false); });
    E.btnFcGood.addEventListener('click', function () { fcMark(true); });
    E.fcSpeak.addEventListener('click', function (e) {
      e.stopPropagation();
      const word = state.flashcards && state.flashcards.list[state.flashcards.index];
      if (word) U.speak(word.term, settings.targetCode);
    });

    // Settings — AI tab
    E.selProvider.addEventListener('change', function () {
      useProvider(E.selProvider.value);
    });
    // A pasted key has to count even if the field never loses focus, so save on
    // input as well as on change.
    function keepGeminiKey() {
      settings.geminiKey = Ai.normalizeKey(E.inpGeminiKey.value);
      saveSettings();
      warnKeyShape();
    }
    E.inpGeminiKey.addEventListener('input', keepGeminiKey);
    E.inpGeminiKey.addEventListener('change', keepGeminiKey);
    E.btnToggleKey.addEventListener('click', function () {
      const show = E.inpGeminiKey.type === 'password';
      E.inpGeminiKey.type = show ? 'text' : 'password';
      E.btnToggleKey.textContent = show ? 'Hide' : 'Show';
    });
    E.inpOaiBase.addEventListener('change', function () {
      const typed = E.inpOaiBase.value.trim();
      const def = providerDef(activeProviderId());
      const matches = !!def.base && sameBase(def.base, typed);
      // A hand-edited Base URL is no longer that named provider: keep it as a
      // custom OpenAI-compatible connection instead of mislabelling it.
      if (activeProviderId() !== 'openai' && !matches) settings.aiProvider = 'openai';
      settings.oaiBase = typed;
      const guess = defaultModelForBase(typed);
      if (guess && guess !== settings.oaiModel) {
        settings.oaiModel = guess;
        ensureModelOption(guess);
        E.inpModel.value = guess;
      }
      rememberConn();
      saveSettings();
      syncAiUI();
    });
    function keepOaiKey() {
      settings.oaiKey = Ai.normalizeKey(E.inpOaiKey.value);
      rememberConn();
      saveSettings();
      warnKeyShape();
    }
    E.inpOaiKey.addEventListener('input', keepOaiKey);
    E.inpOaiKey.addEventListener('change', keepOaiKey);
    E.btnToggleOaiKey.addEventListener('click', function () {
      const show = E.inpOaiKey.type === 'password';
      E.inpOaiKey.type = show ? 'text' : 'password';
      E.btnToggleOaiKey.textContent = show ? 'Hide' : 'Show';
    });
    E.btnTestKey.addEventListener('click', testKey);
    E.btnRefreshModels.addEventListener('click', testKey);
    E.inpModel.addEventListener('change', function () { setActiveModel(E.inpModel.value.trim()); });
    E.inpModel.addEventListener('input', function () { setActiveModel(E.inpModel.value.trim()); });
    E.inpTargetLang.addEventListener('change', function () { settings.targetLang = E.inpTargetLang.value.trim() || 'English'; saveSettings(); });
    E.inpTargetCode.addEventListener('change', function () { settings.targetCode = E.inpTargetCode.value.trim() || 'en-US'; saveSettings(); });
    E.chkAutoPlay.addEventListener('change', function () { settings.autoPlay = E.chkAutoPlay.checked; saveSettings(); });
    E.btnClearQCache.addEventListener('click', function () {
      Quiz.clearCache(); updateUsageUI(); updateDataInfo();
      U.toast('Question cache cleared.', 'ok');
    });

    // Settings — Sheet tab
    U.$$('input[name="sheetMode"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        settings.sheetMode = radio.value;
        saveSettings();
        syncModePanes(radio.value);
      });
    });
    [['inpSheetUrl', 'sheetUrl'], ['inpSheetApiKey', 'sheetApiKey'], ['inpScriptUrl', 'scriptUrl'], ['inpLinks', 'links']].forEach(function (pair) {
      E[pair[0]].addEventListener('change', function () { settings[pair[1]] = E[pair[0]].value; saveSettings(); });
    });
    E.btnLoadApi.addEventListener('click', function () {
      settings.sheetMode = 'api';
      settings.sheetUrl = E.inpSheetUrl.value.trim();
      settings.sheetApiKey = E.inpSheetApiKey.value.trim();
      saveSettings();
      loadDeck({ mode: 'api', sheetUrl: settings.sheetUrl, sheetApiKey: settings.sheetApiKey });
    });
    E.btnLoadScript.addEventListener('click', function () {
      settings.sheetMode = 'script';
      settings.scriptUrl = E.inpScriptUrl.value.trim();
      saveSettings();
      loadDeck({ mode: 'script', scriptUrl: settings.scriptUrl });
    });
    E.btnLoadLinks.addEventListener('click', function () {
      settings.sheetMode = 'links';
      settings.links = E.inpLinks.value;
      saveSettings();
      loadDeck({ mode: 'links', links: settings.links });
    });
    E.btnLoadDemo.addEventListener('click', function () {
      settings.sheetMode = 'demo';
      saveSettings();
      loadDeck({ mode: 'demo' });
    });
    E.btnDemo.addEventListener('click', function () {
      settings.sheetMode = 'demo';
      saveSettings();
      loadDeck({ mode: 'demo' });
    });

    // Settings — Data tab
    E.btnClearDeck.addEventListener('click', function () {
      U.lsRemove('deck');
      state.deck = null;
      state.selected = [];
      renderTopics(); updateSourceUI(); updateStatsUI(); updateControls(); updateDataInfo();
      showScreen('welcome');
      U.toast('Cached vocabulary removed.', 'ok');
    });
    E.btnClearMastery.addEventListener('click', function () {
      U.lsRemove('mastery'); U.lsRemove('stats');
      updateStatsUI(); updateDataInfo();
      U.toast('Progress reset.', 'ok');
    });
    E.btnClearAll.addEventListener('click', function () {
      if (!window.confirm('Delete the API keys, cached deck, progress and question cache from this browser?')) return;
      U.lsKeys().forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      });
      window.location.reload();
    });

    // Settings tabs
    U.$$('.tab-btn', E.settingsDialog).forEach(function (btn) {
      btn.addEventListener('click', function () {
        const tab = btn.getAttribute('data-tab');
        U.$$('.tab-btn', E.settingsDialog).forEach(function (b) { b.classList.toggle('active', b === btn); });
        U.$$('.tab-pane', E.settingsDialog).forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pane') === tab); });
        if (tab === 'data') updateDataInfo();
      });
    });
    E.settingsDialog.addEventListener('close', function () { updateDataInfo(); updateUsageUI(); });

    // Overlay cancel
    E.btnCancelLoad.addEventListener('click', function () {
      if (state.controller) state.controller.abort();
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented) return;
      if (E.settingsDialog.open || E.helpDialog.open) return;
      const tag = (e.target && e.target.tagName) || '';
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (state.screen === 'quiz' && state.session) {
        const q = currentQuestion();
        if (!q) return;
        if (q.type === 'mc') {
          const n = parseInt(e.key, 10);
          if (!state.answered && n >= 1 && n <= q.options.length) {
            e.preventDefault();
            answerMc(q.options[n - 1], n - 1);
            return;
          }
        }
        if (e.key === 'Enter') {
          if (state.answered) { e.preventDefault(); nextQuestion(); }
          else if (q.type !== 'mc') { e.preventDefault(); submitTyped(false); }
        }
      } else if (state.screen === 'flashcards' && state.flashcards) {
        if (e.key === ' ' && !inInput) { e.preventDefault(); fcFlip(); }
        else if (e.key === 'ArrowRight') fcMove(1);
        else if (e.key === 'ArrowLeft') fcMove(-1);
      }
    });
    E.qInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!state.answered) submitTyped(false); }
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    cacheEls();
    applyTheme();
    U.initVoices();
    // Name a provider saved before the list existed, and remember its connection
    // so switching providers can bring it back later.
    migrateProvider();
    normalizeStoredKeys();
    rememberConn();
    syncSettingsUI();
    bindEvents();
    if (E.fileWarn) E.fileWarn.hidden = window.location.protocol !== 'file:';
    if (state.deck) {
      const validIds = state.deck.topics.map(function (t) { return t.id; });
      state.selected = validIds.slice();
      renderTopics();
      updateSourceUI();
      updateStatsUI();
      updateControls();
      renderSheetWarnings((state.deck.source && state.deck.source.warnings) || []);
      showScreen('welcome');
    } else {
      updateControls();
      showScreen('welcome');
    }
    updateDataInfo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
