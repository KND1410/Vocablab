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
    aiMode: 'simple', aiProvider: 'gemini', geminiKey: '', geminiModel: '',
    oaiBase: 'https://api.groq.com/openai/v1', oaiKey: '', oaiModel: '', aiConns: {},
    simpleModel: 'openai-fast', simpleModels: [],
    targetLang: 'French', targetCode: 'fr-FR',
    azureKey: '', azureRegion: 'southeastasia', azureVoice: 'fr-FR-DeniseNeural', cloudVoice: true,
    browserVoice: '', scoreEngine: 'auto',
    sheetMode: 'links', sheetUrl: '', sheetApiKey: '', scriptUrl: '', links: '',
    quizTypes: ['mc', 'blank', 'translate'], direction: 'mixed', count: 20, source: 'auto',
    difficulty: 'standard', requirement: '', practiceMode: 'quiz',
    paragraphDirection: 'both', paragraphCount: 1, uiLang: 'en',
    rotation: 0
  };
  const storedSettings = U.lsGet('settings', {}) || {};
  const settings = Object.assign({}, DEFAULTS, storedSettings);
  // New users start with the keyless free model (Simple). Anyone who already
  // pasted a key keeps their setup (Advanced) instead of losing it silently.
  if (!storedSettings.aiMode) {
    const hadKey = !!(storedSettings.geminiKey || storedSettings.oaiKey ||
      (storedSettings.aiConns && Object.keys(storedSettings.aiConns).length));
    settings.aiMode = hadKey ? 'advanced' : 'simple';
  }
  function saveSettings() {
    U.lsSet('settings', settings);
    U.setBrowserVoice(settings.browserVoice);
    if (window.Speech) Speech.configure(settings);
    if (window.I18n && settings.uiLang && I18n.lang() !== settings.uiLang) I18n.setLang(settings.uiLang);
    if (E.voiceHint) updateVoiceHint();
  }
  // Paragraph translation is its own practice mode now, not a question type.
  // Drop it from an older saved quiz setup instead of silently mixing it back in.
  if (!Array.isArray(settings.quizTypes)) settings.quizTypes = DEFAULTS.quizTypes.slice();
  if (settings.quizTypes.indexOf('paragraph') !== -1) {
    settings.quizTypes = settings.quizTypes.filter(function (t) { return t !== 'paragraph'; });
    saveSettings();
  }
  if (['quiz', 'paragraph', 'shadowing'].indexOf(settings.practiceMode) === -1) settings.practiceMode = 'quiz';

  /* ---------- State ---------- */
  const state = {
    deck: U.lsGet('deck', null),
    selected: [],
    session: null,
    answered: false,
    paraBusy: false,
    shadowing: null,
    flashcards: null,
    controller: null,
    screen: 'welcome',
    user: null,
    daily: null,
    streak: null,
    offline: false,
    booted: false,
    authMode: 'signin',
    authBusy: false,
    syncing: false,
    questTimer: null,
    questClock: null,
    questDate: '',
    recoveryResolve: null
  };

  const E = {};
  function cacheEls() {
    const ids = ['btnHome', 'btnNavToggle', 'selUiLang', 'navUserName', 'navUserEmail', 'navAvatar',
      'navDeckName', 'navStreak', 'navLevel',
      'routeFiles', 'routeLessons', 'routePractice', 'routeExam', 'routeCommunity', 'routeProgress',
      'filesSourceSlot', 'filesTopicsSlot', 'filesFormatSlot', 'lessonsStudySlot', 'practiceSetupSlot',
      'progressStatsSlot', 'btnOpenHandbook', 'handbookPct', 'handbookBar',
      'progressGrammar', 'progressGrammarBar', 'progressStreak',
      'progressBest', 'progressAccuracy',
      'btnHome', 'srcBadge', 'btnHelp', 'btnTheme', 'btnSettings', 'btnTestVoice', 'voiceHint', 'btnReload', 'srcName', 'srcMeta',
      'btnChangeSource', 'btnAllTopics', 'btnNoTopics', 'topicSearch', 'topicList', 'selectedSummary',
      'typeMc', 'typeBlank', 'typeTranslate', 'selPractice', 'quizSetupPane', 'paraSetupPane', 'shadowingSetupPane',
      'practiceTopics', 'practiceTopicChips', 'practiceTopicCount',
      'btnStartParagraph', 'paraStartHint', 'btnStartShadowing', 'shadowStartHint', 'btnShadowSavedSetup',
      'selParaDir', 'selParaCount',
      'selDirection', 'selCount', 'selSource', 'selDifficulty', 'difficultyHint',
      'inpRequirement', 'reqCount', 'btnClearRequirement', 'setupAiBadge', 'moreOptions',
      'btnStart', 'btnFlashcards',
      'statWords', 'statMastered', 'statAcc', 'screenWelcome', 'screenGrammar',
      'studyPct', 'studyBar', 'btnStudy',
      'screenQuiz', 'progressBar', 'qProgressText', 'qStreak', 'qScore', 'btnExitQuiz', 'qCard', 'qTypeBadge',
      'qTopicBadge', 'btnSpeakPrompt', 'qPrompt', 'qHintBox', 'qOptions', 'qInputRow', 'qInput', 'btnSubmit',
      'btnDontKnow', 'qFeedback', 'fbIcon', 'fbTitle', 'fbBody', 'fbTerm', 'fbSpeak', 'fbPron', 'fbMeaning',
      'fbExample', 'fbUpgrades', 'btnNext', 'qParagraph', 'paraDir', 'btnParaSpeak', 'paraText', 'paraKeywords',
      'paraInput', 'paraCount', 'btnParaSubmit', 'btnParaSkip', 'paraFeedback',
      'paraInspector', 'tabCorrections', 'tabLevelUp', 'corrCount', 'upgradeCount', 'paraHighlights', 'paraLevelUp',
      'screenShadowing', 'shProgressBar', 'shProgressText', 'btnShadowSaved', 'shSavedCount', 'btnShadowExit',
      'shadowCard', 'shSentence', 'btnShadowListen', 'selShadowSpeed', 'btnShadowTranslate', 'shTranslation',
      'shRecordStatus', 'shTimer', 'btnShadowRecord', 'btnShadowStop', 'btnShadowReplay', 'btnShadowSave',
      'btnShadowDelete', 'shAudioMeta', 'btnShadowAssess', 'shAssessHint', 'shResult', 'shScoreBig', 'shVerdict',
      'shRecognized', 'shAccuracy', 'shFluency', 'shCompleteness', 'shWords', 'shTips', 'btnShadowRetry',
      'shEnginePill', 'shScoreSource',
      'btnShadowNext', 'shadowSummary', 'shSummaryText', 'shSummaryAvg', 'shSummaryCount', 'shSummaryList',
      'btnShadowAgain', 'btnShadowBackSetup', 'shadowSavedPanel', 'btnShadowCloseSaved', 'shSavedList',
      'screenResults', 'resRing', 'resPct', 'resFraction', 'resTitle', 'resMeta',
      'resBreakdown', 'btnRetryMistakes', 'btnNewQuiz', 'btnResultsFlashcards', 'btnBackSetup', 'resMistakes', 'resMistakeList',
      'screenFlashcards', 'fcProgress', 'btnFcShuffle', 'btnFcExit', 'fcCard', 'fcTerm', 'fcPron', 'fcSpeak',
      'fcMeaning', 'fcExample', 'btnFcAgain', 'btnFcGood', 'btnFcPrev', 'btnFcNext',
      'settingsDialog', 'selProvider', 'providerHint', 'paneGemini', 'inpGeminiKey', 'btnToggleKey',
      'paneOai', 'inpOaiBase', 'inpOaiKey', 'btnToggleOaiKey',
      'modeSimple', 'modeAdvanced', 'paneSimple', 'aiAdvanced', 'selSimpleModel', 'btnTestSimple',
      'btnTestKey', 'inpModel', 'modelList', 'btnRefreshModels',
      'aiStatus', 'aiIssue', 'usageToday', 'cachedCount', 'btnClearQCache', 'inpTargetLang', 'inpTargetCode',
      'inpAzureKey', 'btnToggleAzureKey', 'inpAzureRegion', 'selAzureVoice', 'azureVoiceField', 'azureVoiceNote', 'chkCloudVoice', 'btnTestAzure', 'speechStatus',
      'browserVoiceLabel', 'browserVoiceIntro', 'azureVoiceIntro', 'speechLimitNote',
      'selBrowserVoice', 'browserVoiceHint', 'btnTestBrowserVoice', 'btnRefreshBrowserVoices',
      'selScoreEngine', 'scoreStatus', 'btnScoreAiSettings',
      'inpSheetUrl', 'inpSheetApiKey', 'btnLoadApi', 'inpScriptUrl', 'btnLoadScript', 'inpLinks', 'btnLoadLinks',
      'btnLoadDemo', 'sheetStatus', 'lnkShowScript', 'accountInfo', 'dataInfo', 'btnClearDeck', 'btnClearMastery',
      'btnClearRecordings', 'btnClearAll', 'helpDialog', 'scriptCode', 'btnCopyScript', 'overlay', 'loadTitle', 'loadMsg',
      'loadBar', 'btnCancelLoad', 'fileWarn', 'sheetWarnings',
      'authScreen', 'authTitle', 'authSub', 'authForm', 'authNameField', 'authName', 'authEmailField',
      'authEmail', 'authPasswordField', 'authPassword', 'authCodeField', 'authCode',
      'authNewPasswordField', 'authNewPassword', 'authError', 'authSubmit', 'authAlt', 'authDot',
      'authToReset', 'authToSignin', 'authOffline', 'btnSignOut',
      'homeDate', 'homeGreeting', 'homeName', 'btnEditName', 'nameEditor', 'inpName', 'btnSaveName', 'btnCancelName',
      'streakChip', 'streakCount', 'streakWarn', 'questCard', 'questSub', 'questCount', 'questList',
      'questAllDone', 'questStreakLine', 'questOffline', 'recoveryDialog', 'recoveryCode',
      'btnCopyRecovery', 'btnRecoveryDone', 'recoveryHint'];
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

  function speechReady() {
    return !!(window.Speech && Speech.isConfigured());
  }

  /** Gemini can score a recording from its audio; no Azure speech minutes used. */
  function geminiScoreReady() {
    return !!Ai.normalizeKey(settings.geminiKey);
  }

  /**
   * Which engine scores a recording. “auto” prefers Gemini when a key exists
   * (it spends no Azure speech-to-text hours), then Azure, and reports “none”
   * when neither is set up.
   */
  function scoreEngine() {
    const want = settings.scoreEngine || 'auto';
    if (want === 'gemini') return geminiScoreReady() ? 'gemini' : 'none';
    if (want === 'azure') return speechReady() ? 'azure' : 'none';
    if (geminiScoreReady()) return 'gemini';
    return speechReady() ? 'azure' : 'none';
  }
  function scoreReady() {
    return scoreEngine() !== 'none';
  }
  function scoreSetupHint() {
    return 'Add a free Gemini key in Settings → AI, or an Azure Speech key in Settings → Speech.';
  }

  /** The language being learned — every language-dependent label reads this. */
  function targetLangName() {
    return settings.targetLang || 'French';
  }
  function targetLangRoot() {
    return String(settings.targetCode || 'fr-FR').slice(0, 2).toLowerCase();
  }
  /** A greeting to test the voice in the language being learned. */
  function targetTestPhrase() {
    const phrases = {
      fr: 'Bonjour ! Ceci est un test de la voix.',
      en: 'Hello! This is a voice test.',
      ja: 'こんにちは。これは音声のテストです。',
      es: '¡Hola! Esta es una prueba de voz.',
      de: 'Hallo! Dies ist ein Stimmentest.',
      it: 'Ciao! Questa è una prova della voce.',
      pt: 'Olá! Este é um teste de voz.',
      ko: '안녕하세요. 음성 테스트입니다.',
      zh: '你好！这是语音测试。',
      vi: 'Xin chào! Đây là bài kiểm tra giọng nói.',
      ru: 'Здравствуйте! Это проверка голоса.',
      ar: 'مرحبًا! هذا اختبار للصوت.',
      nl: 'Hallo! Dit is een stemtest.',
      tr: 'Merhaba! Bu bir ses testi.',
      pl: 'Cześć! To test głosu.',
      th: 'สวัสดี! นี่คือการทดสอบเสียง'
    };
    return phrases[targetLangRoot()] || 'Hello! This is a voice test.';
  }

  /** Voices installed for the language being learned, not just French. */
  function targetVoices() {
    if (typeof window.speechSynthesis === 'undefined') return [];
    const root = targetLangRoot();
    return (window.speechSynthesis.getVoices() || []).filter(function (v) {
      return String(v.lang || '').toLowerCase().indexOf(root) === 0;
    });
  }

  function voiceKey(v) {
    return v ? String(v.voiceURI || v.name || '') : '';
  }

  function voiceIsRobotic(v) {
    return /espeak|speechd|speech-dispatcher/i.test(voiceKey(v) + ' ' + String((v && v.name) || ''));
  }

  function browserVoiceLabel() {
    const list = targetVoices();
    if (!list.length) return '';
    if (settings.browserVoice) {
      const picked = list.find(function (v) { return voiceKey(v) === settings.browserVoice; });
      if (picked) return picked.name || picked.voiceURI || 'selected voice';
    }
    return I18n.t('voice.automatic');
  }

  function populateBrowserVoices() {
    if (!E.selBrowserVoice) return;
    const list = targetVoices();
    const current = settings.browserVoice || '';
    E.selBrowserVoice.textContent = '';
    const auto = document.createElement('option');
    auto.value = '';
    auto.textContent = I18n.t('voice.autoBest', { lang: targetLangName() });
    E.selBrowserVoice.appendChild(auto);
    list.forEach(function (v) {
      const opt = document.createElement('option');
      opt.value = voiceKey(v);
      opt.textContent = (v.name || v.voiceURI || targetLangName() + ' voice') + ' — ' + (v.lang || targetLangRoot());
      E.selBrowserVoice.appendChild(opt);
    });
    const has = current && list.some(function (v) { return voiceKey(v) === current; });
    E.selBrowserVoice.value = has ? current : '';
    if (!E.browserVoiceHint) return;
    const lang = targetLangName();
    if (!list.length) {
      E.browserVoiceHint.textContent = 'No ' + lang + ' browser voice was found. Install a ' + lang +
        ' voice in your system, or use Azure Speech below; otherwise the browser may read ' + lang +
        ' with a different voice.';
      return;
    }
    const picked = has ? list.find(function (v) { return voiceKey(v) === current; }) : null;
    const robotic = picked ? voiceIsRobotic(picked) : list.every(voiceIsRobotic);
    E.browserVoiceHint.textContent = list.length + ' ' + lang + ' voice' + (list.length === 1 ? '' : 's') + ' found. ' +
      (robotic
        ? 'This is the Linux system voice (eSpeak) — it is robotic and can mispronounce ' + lang + '. Azure below is much more natural.'
        : 'Pick the one that sounds best, then press Test browser voice.');
  }

  function testBrowserVoice() {
    if (typeof window.speechSynthesis === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined') {
      U.toast('This browser cannot use local voices. Add Azure Speech below instead.', 'bad', 9000);
      return;
    }
    if (!targetVoices().length) {
      U.toast('No ' + targetLangName() + ' browser voice found. Install one or add Azure Speech below.', 'warn', 9000);
      return;
    }
    if (!U.browserSpeak(targetTestPhrase(), settings.targetCode, 0.95)) {
      U.toast('The browser could not start speech. Check the volume and output.', 'warn', 9000);
      return;
    }
    U.toast('Playing the selected browser voice.', 'ok', 4000);
  }

  function updateVoiceHint() {
    if (!E.voiceHint) return;
    if (Speech.enabled()) {
      E.voiceHint.textContent = 'Azure neural voice · ' +
        (targetLangRoot() === 'fr' ? (settings.azureVoice || 'fr-FR-DeniseNeural') : targetLangName());
      return;
    }
    const list = targetVoices();
    E.voiceHint.textContent = list.length
      ? I18n.t('voice.browser', { name: browserVoiceLabel() })
      : I18n.t('voice.none', { lang: targetLangName() });
  }

  /** Homepage diagnostic: try Azure first, then explain the browser-voice fallback. */
  function testVoice() {
    const phrase = targetTestPhrase();
    const code = settings.targetCode || 'fr-FR';
    if (Speech.enabled()) {
      E.btnTestVoice.disabled = true;
      U.toast('Testing the Azure voice…', 'ok', 4000);
      Speech.speak(phrase, code, 0.95, {
        noFallback: true,
        onStart: function () {
          E.btnTestVoice.disabled = false;
          U.toast('Azure voice is working — ' +
            (targetLangRoot() === 'fr' ? (settings.azureVoice || 'French neural voice') : targetLangName()) + '.', 'ok', 6000);
        },
        onError: function (err) {
          E.btnTestVoice.disabled = false;
          U.toast((err && err.message) || 'Azure voice failed. Opening Settings → Speech.', 'bad', 12000);
          openSettings('speech');
        }
      });
      return;
    }
    if (speechReady()) {
      U.toast('Cloud voice is turned off. Enable it in Settings → Speech, or use the browser voice below.', 'warn', 8000);
    }
    if (typeof window.speechSynthesis === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined') {
      U.toast('This browser does not support speech synthesis. On Linux, Firefox is the reliable option. ' +
        'For a voice that works everywhere, add Azure Speech in Settings → Speech.', 'bad', 12000);
      return;
    }
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) {
      U.toast('No speech voices found. On Linux, Chrome cannot use speech-dispatcher; Firefox can. ' +
        'Restart the browser after starting speech-dispatcher. Azure Speech avoids this entirely.', 'bad', 12000);
      return;
    }
    const local = targetVoices();
    if (!U.speak(phrase, code)) {
      U.toast('The browser could not start speech. Check its audio output and volume.', 'warn', 9000);
      return;
    }
    U.toast('Playing a ' + targetLangName() + ' test phrase — ' + voices.length + ' voice' +
      (voices.length === 1 ? '' : 's') + ' available' +
      (local.length ? '.' : '; no ' + targetLangName() + ' voice — open Settings → Speech to pick one or add Azure.'), 'ok', 6000);
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

  /* ---------- Routes / screens ---------- */
  const VIEWS = {
    welcome: { el: 'screenWelcome', nav: 'home' },
    files: { el: 'routeFiles', nav: 'files' },
    lessons: { el: 'routeLessons', nav: 'lessons' },
    practice: { el: 'routePractice', nav: 'practice' },
    exam: { el: 'routeExam', nav: 'exam' },
    community: { el: 'routeCommunity', nav: 'community' },
    progress: { el: 'routeProgress', nav: 'progress' },
    grammar: { el: 'screenGrammar', nav: 'lessons' },
    quiz: { el: 'screenQuiz', nav: 'practice' },
    shadowing: { el: 'screenShadowing', nav: 'practice' },
    results: { el: 'screenResults', nav: 'practice' },
    flashcards: { el: 'screenFlashcards', nav: 'practice' }
  };
  const ROUTE_VIEW = {
    'home': 'welcome',
    'files': 'files',
    'lessons': 'lessons',
    'lessons/grammar': 'grammar',
    'practice': 'practice',
    'practice/quiz': 'quiz',
    'practice/paragraph': 'quiz',
    'practice/shadowing': 'shadowing',
    'practice/results': 'results',
    'practice/flashcards': 'flashcards',
    'exam': 'exam',
    'community': 'community',
    'progress': 'progress'
  };
  const VIEW_ROUTE = {
    welcome: 'home', files: 'files', lessons: 'lessons', practice: 'practice',
    exam: 'exam', community: 'community', progress: 'progress', grammar: 'lessons/grammar',
    quiz: 'practice/quiz', shadowing: 'practice/shadowing',
    results: 'practice/results', flashcards: 'practice/flashcards'
  };

  // Assigned once the shell is built: moves the class file to the active page.
  let placeClassFile = function () {};

  function routeKey() {
    return String(window.location.hash || '').replace(/^#\/?/, '').replace(/\/+$/, '') || 'home';
  }

  function routeHash(route) {
    return '#/' + route;
  }

  function setHash(route) {
    const hash = routeHash(route);
    if (window.location.hash !== hash) {
      try { window.location.hash = hash; } catch (e) { /* older browsers */ }
    }
  }

  function setActiveNav(nav) {
    U.$$('.nav-item').forEach(function (a) {
      const active = a.getAttribute('data-route') === nav;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /**
   * Move the old setup cards into their route pages once, before bindings.
   * The class file (Source + Topics) belongs to the home page; the Files route
   * has no sidebar entry but still opens, and borrows those same cards then.
   */
  function buildRouteShell() {
    function cardOf(id) {
      const el = document.getElementById(id);
      return el ? el.closest('.card') : null;
    }
    function move(targetId, node) {
      const target = document.getElementById(targetId);
      if (target && node && node.parentNode !== target) target.appendChild(node);
    }
    const sourceCard = cardOf('srcName');
    const topicsCard = cardOf('topicList');
    move('filesFormatSlot', document.getElementById('sheetFormatCard'));
    move('lessonsStudySlot', cardOf('btnStudy'));
    move('practiceSetupSlot', cardOf('segPractice'));
    move('progressStatsSlot', cardOf('statWords'));
    const legacy = document.getElementById('legacySidebarCards');
    if (legacy) legacy.remove();

    return function placeClassFile(view) {
      const home = document.getElementById('homeFilesSlot');
      const host = view === 'files'
        ? [document.getElementById('filesSourceSlot'), document.getElementById('filesTopicsSlot')]
        : [home, home];
      if (!host[0] || !host[1]) return;
      if (sourceCard && sourceCard.parentNode !== host[0]) host[0].appendChild(sourceCard);
      if (topicsCard && topicsCard.parentNode !== host[1]) host[1].appendChild(topicsCard);
    };
  }

  function viewForRoute(route) {
    const key = route || routeKey();
    let view = ROUTE_VIEW[key] || 'welcome';
    // Active-session routes need state; otherwise land on the practice hub.
    if (view === 'quiz' && !state.session) view = 'practice';
    if (view === 'shadowing' && !state.shadowing) view = 'practice';
    if (view === 'results' && !state.session) view = 'practice';
    if (view === 'flashcards' && !state.flashcards) view = 'practice';
    return view;
  }

  function showScreen(name, opts) {
    opts = opts || {};
    if (!VIEWS[name]) name = 'welcome';
    state.screen = name;
    document.body.dataset.screen = name;
    Object.keys(VIEWS).forEach(function (key) {
      const el = document.getElementById(VIEWS[key].el);
      if (el) el.hidden = key !== name;
    });
    setActiveNav(VIEWS[name].nav);
    if (name === 'welcome' || name === 'files') placeClassFile(name);
    if (name === 'welcome') renderHome();
    if (name === 'files') updateSourceUI();
    if (!opts.fromRouter) setHash(VIEW_ROUTE[name] || 'home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncFromHash() {
    if (document.body.classList.contains('auth-locked')) return;
    const view = viewForRoute();
    if (state.screen === view) return;
    if (state.screen === 'quiz' && state.session && !state.answered) {
      const ok = window.confirm(I18n.t('practice.leaveConfirm'));
      if (!ok) { setHash(VIEW_ROUTE[state.screen] || 'home'); return; }
    }
    if (state.screen === 'shadowing' && state.shadowing) {
      const ok = window.confirm(I18n.t('practice.leaveConfirm'));
      if (!ok) { setHash(VIEW_ROUTE[state.screen] || 'home'); return; }
      exitShadowing(true);
    }
    showScreen(view, { fromRouter: true });
  }

  /** The logo and the results “Home” button both return to the daily quests. */
  function goHome() {
    if (window.Speech) Speech.stop();
    if (state.screen === 'shadowing') { exitShadowing(false); return; }
    state.session = null;
    state.flashcards = null;
    showScreen('welcome');
  }

  /* ---------- Account, greeting and daily quests ---------- */
  function localDate() { return Quests.dateKey(new Date()); }

  /** The long date follows the interface language, not the browser locale. */
  const DATE_LOCALES = { en: 'en-GB', vi: 'vi-VN', fr: 'fr-FR' };

  function formatHomeDate() {
    try {
      return new Date().toLocaleDateString(DATE_LOCALES[I18n.lang()] || 'en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) { return localDate(); }
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return I18n.t('home.goodMorning');
    return h < 18 ? I18n.t('home.goodAfternoon') : I18n.t('home.goodEvening');
  }

  function showAuthMessage(message) {
    if (!E.authError) return;
    E.authError.textContent = message || '';
    E.authError.hidden = !message;
  }

  function showAuthOffline() {
    if (!E.authOffline) return;
    E.authOffline.hidden = false;
    E.authOffline.textContent = 'The account server is not reachable. Use the deployed site, or run "vercel dev" for the API.';
  }

  function authSubmitLabel() {
    return state.authMode === 'signup' ? 'Create account'
      : state.authMode === 'reset' ? 'Set new password' : 'Sign in';
  }

  function setAuthMode(mode) {
    state.authMode = mode === 'signup' || mode === 'reset' ? mode : 'signin';
    const signup = state.authMode === 'signup';
    const reset = state.authMode === 'reset';
    E.authNameField.hidden = !signup;
    E.authPasswordField.hidden = reset;
    E.authCodeField.hidden = !reset;
    E.authNewPasswordField.hidden = !reset;
    E.authPassword.autocomplete = signup ? 'new-password' : 'current-password';
    E.authTitle.textContent = signup ? 'Create your account' : (reset ? 'Reset your password' : 'Welcome back');
    E.authSub.textContent = signup
      ? 'One account keeps your name, daily quests and streak together.'
      : reset
        ? 'Use your email and the recovery code you saved when you signed up.'
        : 'Sign in to keep your daily streak going.';
    E.authSubmit.textContent = authSubmitLabel();
    E.authAlt.hidden = reset;
    E.authAlt.textContent = signup ? 'Already have an account? Sign in' : 'Create an account';
    E.authDot.hidden = signup || reset;
    E.authToReset.hidden = signup || reset;
    E.authToSignin.hidden = !reset;
    E.authPassword.value = '';
    E.authNewPassword.value = '';
    E.authCode.value = '';
    showAuthMessage('');
  }

  function setAuthBusy(busy) {
    state.authBusy = !!busy;
    E.authSubmit.disabled = !!busy;
    E.authSubmit.textContent = busy ? 'Please wait…' : authSubmitLabel();
  }

  function showAuth() {
    document.body.classList.add('auth-locked');
    document.body.dataset.screen = 'auth';
    setAuthMode('signin');
    if (E.authScreen) E.authScreen.hidden = false;
    setTimeout(function () {
      if (E.authEmail && !E.authScreen.hidden) E.authEmail.focus();
    }, 60);
  }

  function showRecovery(code) {
    E.recoveryCode.textContent = code;
    E.recoveryHint.textContent = 'Passwords cannot be recovered without this code. It will not be shown again.';
    if (E.recoveryDialog.showModal) {
      if (!E.recoveryDialog.open) E.recoveryDialog.showModal();
    } else {
      E.recoveryDialog.setAttribute('open', '');
    }
    return new Promise(function (resolve) { state.recoveryResolve = resolve; });
  }

  function closeRecovery() {
    if (E.recoveryDialog.open && E.recoveryDialog.close) E.recoveryDialog.close();
    else E.recoveryDialog.removeAttribute('open');
    const resolve = state.recoveryResolve;
    state.recoveryResolve = null;
    if (resolve) resolve();
  }

  async function copyRecovery() {
    const code = E.recoveryCode.textContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const range = document.createRange();
        range.selectNodeContents(E.recoveryCode);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
      }
      U.toast('Recovery code copied.', 'ok');
    } catch (e) {
      U.toast('Select the code and copy it manually.', 'warn');
    }
  }

  async function submitAuth(event) {
    if (event) event.preventDefault();
    if (state.authBusy) return;
    const email = E.authEmail.value.trim();
    const password = state.authMode === 'reset' ? E.authNewPassword.value : E.authPassword.value;
    const name = E.authName.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAuthMessage('Enter a valid email address.');
      E.authEmail.focus();
      return;
    }
    if (state.authMode === 'signup' && !name) {
      showAuthMessage('Your name is required.');
      E.authName.focus();
      return;
    }
    if (state.authMode !== 'reset' && !password) {
      showAuthMessage('Enter your password.');
      E.authPassword.focus();
      return;
    }
    if (state.authMode === 'reset' && !E.authCode.value.trim()) {
      showAuthMessage('Enter the recovery code you saved at signup.');
      E.authCode.focus();
      return;
    }
    if (password.length < 8) {
      showAuthMessage('Use at least 8 characters for the password.');
      (state.authMode === 'reset' ? E.authNewPassword : E.authPassword).focus();
      return;
    }

    setAuthBusy(true);
    showAuthMessage('');
    try {
      let data;
      if (state.authMode === 'signup') data = await Account.signup(name, email, password);
      else if (state.authMode === 'reset') data = await Account.resetPassword(email, E.authCode.value, password);
      else data = await Account.login(email, password);

      if (data && data.recoveryCode) await showRecovery(data.recoveryCode);
      E.authOffline.hidden = true;
      await enterApp(data.user);
      if (state.authMode === 'signup') U.toast('Welcome to VocabLab!', 'ok');
    } catch (err) {
      if (err && (err.status === 0 || err.status === 404)) showAuthOffline();
      showAuthMessage(Account.authMessage(err));
    } finally {
      setAuthBusy(false);
    }
  }

  async function initAuth() {
    const cached = Account.cachedUser();
    if (cached) {
      // Local-first: a returning session opens instantly, then refreshes.
      state.user = cached.user;
      state.streak = cached.streak || Quests.defaultStreak();
      const home = Account.cachedHome(cached.user.id, localDate());
      if (home && home.daily) {
        state.daily = home.daily;
        state.streak = home.streak || state.streak;
      }
      document.body.classList.remove('auth-locked');
      await enterApp(cached.user, { skipLoad: true });
      refreshHome();
      return;
    }
    showAuth();
    try {
      const user = await Account.me();
      document.body.classList.remove('auth-locked');
      await enterApp(user);
    } catch (err) {
      if (err && (err.status === 0 || err.status === 404 || err.status >= 500)) showAuthOffline();
    }
  }

  async function enterApp(user, opts) {
    opts = opts || {};
    state.user = user;
    document.body.classList.remove('auth-locked');
    if (E.btnSignOut) E.btnSignOut.hidden = false;
    if (!opts.skipLoad) {
      try {
        await loadHomeData();
      } catch (err) {
        if (err && err.status === 401) { handleSignedOut('Your session expired. Sign in again.'); return; }
        state.offline = true;
      }
    } else if (!state.daily || state.daily.date !== localDate()) {
      const cached = Account.cachedHome(user.id, localDate());
      state.daily = cached && cached.daily ? cached.daily : Quests.newDaily(user.id, localDate());
      if (!state.streak) state.streak = Quests.streakView(Quests.defaultStreak(), localDate(), false);
      Account.saveHome({ user: user, daily: state.daily, streak: state.streak });
    }
    if (!state.booted) {
      state.booted = true;
      bootApp();
    }
    renderHome();
    if (window.location.hash && routeKey() !== 'home') syncFromHash();
    else showScreen('welcome');
    flushQuestQueue();
    if (!state.questClock) {
      state.questClock = setInterval(function () { maybeNewDay(); }, 60000);
    }
  }

  function mergeStreakState(local, server, date, completed) {
    const a = Quests.normalizeStreak(local);
    const b = Quests.normalizeStreak(server);
    const useLocal = a.lastCompletedDate > b.lastCompletedDate ||
      (a.lastCompletedDate === b.lastCompletedDate && a.current >= b.current);
    return Quests.streakView(useLocal ? a : b, date, completed);
  }

  async function loadHomeData() {
    const date = localDate();
    try {
      const data = await Account.loadHome(date);
      const localDaily = state.daily && state.daily.date === date ? state.daily : null;
      state.user = data.user;
      state.daily = localDaily ? Quests.mergeDaily(localDaily, data.daily) : data.daily;
      state.streak = mergeStreakState(state.streak, data.streak, date, !!state.daily.completedAt);
      state.offline = false;
      Account.saveHome({ user: state.user, daily: state.daily, streak: state.streak });
      renderHome();
      return data;
    } catch (err) {
      if (err && err.status === 401) throw err;
      state.offline = true;
      const cached = state.user ? Account.cachedHome(state.user.id, date) : null;
      if (!state.daily || state.daily.date !== date) {
        state.daily = cached && cached.daily ? cached.daily : Quests.newDaily(state.user.id, date);
      }
      if (!state.streak) {
        state.streak = cached && cached.streak
          ? cached.streak
          : Quests.streakView(Quests.defaultStreak(), date, false);
      }
      if (state.user && state.daily) {
        Account.saveHome({ user: state.user, daily: state.daily, streak: state.streak });
      }
      updateQuestOffline();
      renderHome();
      return null;
    }
  }

  async function refreshHome() {
    if (!state.user) return;
    try { await loadHomeData(); }
    catch (err) {
      if (err && err.status === 401) { handleSignedOut('Your session expired. Sign in again.'); return; }
    }
    flushQuestQueue();
  }

  function renderHome(flags) {
    if (!state.user || !E.homeDate) return;
    const date = localDate();
    E.homeDate.textContent = formatHomeDate();
    E.homeGreeting.textContent = greeting() + ',';
    E.homeName.textContent = state.user.name || 'there';
    if (E.navUserName) E.navUserName.textContent = state.user.name || 'there';
    if (E.navUserEmail) E.navUserEmail.textContent = state.user.email || '';
    if (E.navAvatar) E.navAvatar.textContent = String(state.user.name || 'L').trim().charAt(0).toUpperCase() || 'L';
    if (E.accountInfo) {
      E.accountInfo.textContent = 'Signed in as ' + (state.user.name || 'there') +
        (state.user.email ? ' · ' + state.user.email : '');
    }
    const daily = state.daily && state.daily.date === date ? state.daily : null;
    const completed = !!(daily && daily.completedAt);
    const view = Quests.streakView(state.streak || Quests.defaultStreak(), date, completed);
    if (E.navStreak) E.navStreak.textContent = '🔥 ' + view.current;
    if (E.progressStreak) {
      E.progressStreak.textContent = view.current + (view.current === 1 ? ' day' : ' days');
    }
    if (E.progressBest) E.progressBest.textContent = I18n.t('progress.best', { n: view.best || 0 });

    E.streakCount.textContent = String(view.current);
    E.streakWarn.hidden = !view.atRisk;
    E.streakChip.classList.toggle('is-at-risk', !!view.atRisk);
    E.streakChip.title = view.atRisk
      ? I18n.t('home.streakAtRisk', { n: view.current })
      : (view.best > 0
        ? I18n.t('home.streakBest', { n: view.best })
        : I18n.t('home.streakStart'));

    if (!daily) {
      E.questList.innerHTML = '';
      const loading = document.createElement('p');
      loading.className = 'muted small';
      loading.textContent = 'Loading today\'s quests…';
      E.questList.appendChild(loading);
      E.questCount.textContent = '–';
      E.questAllDone.hidden = true;
      updateQuestOffline();
      return;
    }

    const done = daily.quests.filter(function (q) { return q.done; }).length;
    E.questCount.textContent = done + ' / ' + daily.quests.length;
    E.questList.innerHTML = '';
    daily.quests.forEach(function (q) { E.questList.appendChild(renderQuestRow(q)); });

    const allDone = Quests.isAllDone(daily);
    E.questAllDone.hidden = !allDone;
    if (allDone) {
      const n = view.current;
      E.questStreakLine.textContent = flags && flags.justCompleted
        ? 'Streak +1 — you are on ' + n + ' day' + (n === 1 ? '' : 's') + '. Come back tomorrow.'
        : 'Today\'s streak is locked in — ' + n + ' day' + (n === 1 ? '' : 's') + '. Come back tomorrow.';
    }
    updateQuestOffline();
  }

  function renderQuestRow(q) {
    const def = Quests.def(q.id) || { icon: '⭐', title: q.id, desc: '', mode: '' };
    const row = document.createElement('article');
    row.className = 'quest' + (q.done ? ' is-done' : '');
    row.dataset.quest = q.id;

    const icon = document.createElement('span');
    icon.className = 'quest-ico';
    icon.textContent = def.icon;

    const main = document.createElement('div');
    main.className = 'quest-main';
    const titleRow = document.createElement('div');
    titleRow.className = 'quest-title-row';
    const title = document.createElement('strong');
    title.textContent = def.title;
    const count = document.createElement('span');
    count.className = 'quest-count';
    count.textContent = q.progress + ' / ' + q.target;
    titleRow.appendChild(title);
    titleRow.appendChild(count);

    const desc = document.createElement('p');
    desc.className = 'quest-desc muted';
    desc.textContent = def.desc;

    const hp = document.createElement('div');
    hp.className = 'hp';
    hp.setAttribute('role', 'progressbar');
    hp.setAttribute('aria-valuemin', '0');
    hp.setAttribute('aria-valuemax', String(q.target));
    hp.setAttribute('aria-valuenow', String(q.progress));
    hp.setAttribute('aria-label', def.title + ' progress');
    const fill = document.createElement('div');
    fill.className = 'hp-fill';
    fill.style.width = Math.round((Math.min(q.progress, q.target) / q.target) * 100) + '%';
    hp.appendChild(fill);

    main.appendChild(titleRow);
    main.appendChild(desc);
    main.appendChild(hp);

    const start = document.createElement('button');
    start.type = 'button';
    start.className = 'btn btn-primary btn-sm quest-start' + (q.done ? ' is-done' : '');
    start.textContent = q.done ? '✓ Done' : (q.progress > 0 ? 'Continue' : 'Start');
    start.disabled = !!q.done;
    if (!q.done) {
      start.addEventListener('click', function () { startQuest(q.id); });
    } else {
      start.setAttribute('aria-label', def.title + ' complete');
    }

    row.appendChild(icon);
    row.appendChild(main);
    row.appendChild(start);
    return row;
  }

  function setPracticeCount(n) {
    E.selCount.value = String(n);
    settings.count = n;
    saveSettings();
  }

  function setPracticeTypes(types) {
    E.typeMc.checked = types.indexOf('mc') !== -1;
    E.typeBlank.checked = types.indexOf('blank') !== -1;
    E.typeTranslate.checked = types.indexOf('translate') !== -1;
    settings.quizTypes = types.slice();
    saveSettings();
    updateControls();
  }

  function startQuest(id) {
    const def = Quests.def(id);
    if (!def) return;
    if (def.mode === 'grammar') { openGrammar(true); return; }
    if (!state.deck) {
      U.toast('Load a vocabulary deck first — the demo deck works instantly.', 'warn');
      openSettings('sheet');
      return;
    }
    if (def.mode === 'paragraph') {
      setPracticeMode('paragraph');
      E.selParaCount.value = '1';
      settings.paragraphCount = 1;
      saveSettings();
      startParagraphPractice();
      return;
    }
    if (def.mode === 'shadowing') {
      setPracticeMode('shadowing');
      startShadowingPractice();
      return;
    }
    if (def.mode === 'flashcards') {
      setPracticeCount(20);
      startFlashcards();
      return;
    }
    setPracticeMode('quiz');
    if (id === 'mc30') {
      setPracticeTypes(['mc']);
      setPracticeCount(30);
    } else if (id === 'mixed20') {
      setPracticeTypes(['mc', 'blank', 'translate']);
      setPracticeCount(20);
    } else {
      if (!settings.quizTypes.length) setPracticeTypes(['mc']);
      setPracticeCount(20);
    }
    startQuiz();
  }

  function questEvent(id, amount) {
    if (!state.user || !state.daily || state.daily.date !== localDate()) return;
    const quest = Quests.findQuest(state.daily, id);
    if (!quest || quest.done) return;
    const before = quest.progress;
    Quests.setProgress(state.daily, id, before + (amount || 1));
    if (quest.progress === before) return;

    let justCompleted = false;
    if (Quests.isAllDone(state.daily) && !state.daily.completedAt) {
      state.daily.completedAt = new Date().toISOString();
      state.streak = Quests.nextStreak(state.streak, state.daily.date);
      justCompleted = true;
      U.toast('All daily quests done — streak +1! 🔥', 'ok', 6500);
    }
    Account.updateCachedDaily(state.daily);
    Account.updateCachedStreak(state.user.id, state.streak);
    renderHome({ justCompleted: justCompleted });
    queueQuestSync(state.daily.date, id, quest.progress);
  }

  function queueQuestSync(date, questId, progress) {
    if (!state.user) return;
    Account.queueProgress(state.user.id, date, questId, progress);
    updateQuestOffline();
    if (state.questTimer) clearTimeout(state.questTimer);
    state.questTimer = setTimeout(function () {
      state.questTimer = null;
      flushQuestQueue();
    }, 700);
  }

  async function flushQuestQueue() {
    if (!state.user || state.syncing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      state.offline = true;
      updateQuestOffline();
      return;
    }
    state.syncing = true;
    try {
      const res = await Account.flush(state.user.id);
      if (res.unauthorized) { handleSignedOut('Your session expired. Sign in again.'); return; }
      state.offline = !!res.offline;
      if (res.results.length) {
        res.results.forEach(function (r) {
          if (r.daily && state.daily && r.daily.date === state.daily.date) {
            const beforeCompleted = state.daily.completedAt;
            state.daily = Quests.mergeDaily(state.daily, r.daily);
            if (!beforeCompleted && r.daily.completedAt) state.daily.completedAt = r.daily.completedAt;
            Account.updateCachedDaily(state.daily);
          }
          if (r.streak) {
            const local = Quests.normalizeStreak(state.streak);
            const remote = Quests.normalizeStreak(r.streak);
            if (remote.lastCompletedDate > local.lastCompletedDate ||
                (remote.lastCompletedDate === local.lastCompletedDate && remote.current !== local.current)) {
              state.streak = r.streak;
            }
          }
        });
        if (state.streak) Account.updateCachedStreak(state.user.id, state.streak);
        renderHome();
      }
    } catch (err) {
      state.offline = true;
    } finally {
      state.syncing = false;
      updateQuestOffline();
    }
  }

  function updateQuestOffline() {
    if (!E.questOffline) return;
    const pending = state.user ? Account.queueCount(state.user.id) : 0;
    const show = state.offline || pending > 0;
    E.questOffline.hidden = !show;
    if (!show) return;
    E.questOffline.textContent = pending > 0
      ? (state.offline ? 'Offline — ' : '') + pending + ' progress update' +
        (pending === 1 ? '' : 's') + ' waiting to sync.'
      : 'Offline — progress is saved here and will sync when you are back.';
  }

  function handleSignedOut(message) {
    state.user = null;
    state.daily = null;
    state.streak = null;
    state.offline = false;
    Account.forget();
    if (E.btnSignOut) E.btnSignOut.hidden = true;
    showAuth();
    if (message) showAuthMessage(message);
  }

  async function signOut() {
    try {
      await Account.logout();
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err) {
      U.toast('Could not sign out safely — check your connection and try again.', 'warn', 8000);
    }
  }

  function openNameEditor() {
    if (!state.user) return;
    E.inpName.value = state.user.name || '';
    E.nameEditor.hidden = false;
    E.btnEditName.hidden = true;
    E.inpName.focus();
    E.inpName.select();
  }

  function closeNameEditor() {
    E.nameEditor.hidden = true;
    E.btnEditName.hidden = false;
  }

  async function saveName() {
    const name = E.inpName.value.trim();
    if (!name) { U.toast('Enter your name first.', 'warn'); E.inpName.focus(); return; }
    E.btnSaveName.disabled = true;
    try {
      state.user = await Account.updateName(name);
      closeNameEditor();
      renderHome();
      U.toast('Name updated.', 'ok');
    } catch (err) {
      U.toast(Account.authMessage(err), 'bad');
    } finally {
      E.btnSaveName.disabled = false;
    }
  }

  function maybeNewDay() {
    if (!state.user) return;
    renderHome(); // refreshes the date and the morning/afternoon greeting
    if (!state.daily || state.daily.date !== localDate()) loadHomeData();
    else flushQuestQueue();
  }

  function bindAuthEvents() {
    E.authForm.addEventListener('submit', submitAuth);
    E.authAlt.addEventListener('click', function () {
      setAuthMode(state.authMode === 'signin' ? 'signup' : 'signin');
    });
    E.authToReset.addEventListener('click', function () { setAuthMode('reset'); });
    E.authToSignin.addEventListener('click', function () { setAuthMode('signin'); });
    E.btnRecoveryDone.addEventListener('click', closeRecovery);
    E.btnCopyRecovery.addEventListener('click', copyRecovery);
    if (E.recoveryDialog) {
      E.recoveryDialog.addEventListener('cancel', function (e) {
        e.preventDefault(); // the code is shown once: force the explicit button
      });
    }
    E.btnSignOut.addEventListener('click', signOut);
    E.btnEditName.addEventListener('click', openNameEditor);
    E.btnSaveName.addEventListener('click', saveName);
    E.btnCancelName.addEventListener('click', closeNameEditor);
    E.inpName.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); saveName(); }
      if (e.key === 'Escape') { e.preventDefault(); closeNameEditor(); }
    });
    window.addEventListener('online', function () {
      state.offline = false;
      flushQuestQueue();
      refreshHome();
    });
    window.addEventListener('offline', function () {
      state.offline = true;
      updateQuestOffline();
    });
    window.addEventListener('vocablab:quests-dropped', function (e) {
      const n = e && e.detail && e.detail.dropped ? e.detail.dropped.length : 0;
      if (n) U.toast('Some offline quest progress was too old to sync and was skipped.', 'warn', 8000);
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) maybeNewDay();
    });
    window.addEventListener('focus', maybeNewDay);
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
    const count = state.selected.length;
    E.selectedSummary.textContent = count
      ? I18n.t(count === 1 ? 'files.selectedOne' : 'files.selectedMany', { n: count, w: words })
      : I18n.t('files.noTopics');
  }

  /**
   * The Practice page repeats the chosen topics next to Start. What you pick on
   * the class file must be visible right before you begin, without switching pages.
   */
  function renderPracticeTopics() {
    const chips = E.practiceTopicChips;
    if (!chips) return;
    chips.innerHTML = '';
    const topics = [];
    if (state.deck) {
      state.deck.topics.forEach(function (topic) {
        if (state.selected.indexOf(topic.id) !== -1) topics.push(topic);
      });
    }
    topics.forEach(function (topic) {
      const chip = document.createElement('span');
      chip.className = 'topic-chip';
      chip.textContent = topic.name;
      chips.appendChild(chip);
    });
    if (!E.practiceTopicCount) return;
    if (!topics.length) {
      E.practiceTopicCount.textContent = state.deck
        ? I18n.t('files.noTopics') + ' — ' + I18n.t('practice.pickTopics')
        : I18n.t('practice.noDeck');
      E.practiceTopicCount.classList.add('is-empty');
      return;
    }
    E.practiceTopicCount.classList.remove('is-empty');
    E.practiceTopicCount.textContent = I18n.t(
      topics.length === 1 ? 'files.selectedOne' : 'files.selectedMany',
      { n: topics.length, w: selectedWords().length });
  }

  function updateSourceUI() {
    if (!state.deck) {
      E.srcBadge.textContent = 'No deck loaded';
      E.srcName.textContent = 'Nothing loaded yet';
      E.srcMeta.textContent = 'Connect a Google Sheet or load the demo deck.';
      if (E.navDeckName) E.navDeckName.textContent = 'No deck loaded';
      return;
    }
    const d = state.deck;
    E.srcBadge.textContent = d.source.label + ' · ' +
      I18n.t(d.wordCount === 1 ? 'files.wordOne' : 'files.wordMany', { n: d.wordCount });
    E.srcName.textContent = d.source.label;
    if (E.navDeckName) E.navDeckName.textContent = d.source.label;
    const when = d.loadedAt ? new Date(d.loadedAt).toLocaleString() : '';
    E.srcMeta.textContent = d.source.detail + ' · ' +
      I18n.t(d.topics.length === 1 ? 'files.topicOne' : 'files.topicMany', { n: d.topics.length }) +
      ' · ' + (when ? I18n.t('files.loadedAt', { when: when }) : I18n.t('files.loaded'));
  }

  function updateStatsUI() {
    if (!state.deck) {
      E.statWords.textContent = '0'; E.statMastered.textContent = '0'; E.statAcc.textContent = '–';
      if (E.progressAccuracy) E.progressAccuracy.textContent = '–';
      return;
    }
    const words = allWords();
    E.statWords.textContent = String(words.length);
    E.statMastered.textContent = String(Quiz.masteredCount(words));
    const stats = Quiz.getStats();
    E.statAcc.textContent = stats.accuracy == null ? '–' : stats.accuracy + '%';
    if (E.progressAccuracy) E.progressAccuracy.textContent = stats.accuracy == null ? '–' : stats.accuracy + '%';
  }

  /** Paragraph practice is written and corrected by AI, independent of the quiz generator. */
  function paragraphAvailable() {
    return aiReady();
  }

  /** Keep the pill controls in step with the hidden selects they drive. */
  function syncSegments() {
    U.$$('.seg[data-select]').forEach(function (seg) {
      const sel = U.$('#' + seg.getAttribute('data-select'));
      if (!sel) return;
      U.$$('.seg-btn', seg).forEach(function (btn) {
        const on = btn.getAttribute('data-value') === sel.value;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
    if (E.difficultyHint && E.selDifficulty) {
      const hints = {
        easy: 'A1–A2 · short sentences',
        standard: 'A2–B2 · everyday (default)',
        hard: 'B1–C1 · richer sentences'
      };
      E.difficultyHint.textContent = hints[E.selDifficulty.value] || hints.standard;
    }
  }

  function updateRequirementUI() {
    if (!E.inpRequirement) return;
    if (E.reqCount) E.reqCount.textContent = E.inpRequirement.value.length + '/600';
    if (E.btnClearRequirement) E.btnClearRequirement.hidden = !E.inpRequirement.value;
  }

  /** Quiz, paragraph translation and shadowing are separate practices, never mixed. */
  function setPracticeMode(mode) {
    settings.practiceMode = ['paragraph', 'shadowing'].indexOf(mode) !== -1 ? mode : 'quiz';
    if (E.selPractice) E.selPractice.value = settings.practiceMode;
    syncSegments();
    saveSettings();
    updateControls();
  }

  function updateControls() {
    const hasDeck = !!state.deck && state.deck.topics.length > 0;
    const hasTopics = state.selected.length > 0;
    const mode = ['paragraph', 'shadowing'].indexOf(settings.practiceMode) !== -1 ? settings.practiceMode : 'quiz';
    const aiOk = aiReady();
    const hasTypes = E.typeMc.checked || E.typeBlank.checked || E.typeTranslate.checked;
    if (E.quizSetupPane) E.quizSetupPane.hidden = mode !== 'quiz';
    if (E.paraSetupPane) E.paraSetupPane.hidden = mode !== 'paragraph';
    if (E.shadowingSetupPane) E.shadowingSetupPane.hidden = mode !== 'shadowing';
    E.btnStart.disabled = !(hasDeck && hasTopics && hasTypes);
    E.btnFlashcards.disabled = !(hasDeck && hasTopics);
    if (E.btnStartParagraph) E.btnStartParagraph.disabled = !(hasDeck && hasTopics && aiOk);
    if (E.paraStartHint) {
      E.paraStartHint.hidden = aiOk;
      if (!aiOk) {
        E.paraStartHint.textContent = 'Paragraph translation needs AI — open Settings → AI and use the free model (no key), or paste your own key.';
      }
    }
    if (E.btnStartShadowing) E.btnStartShadowing.disabled = !(hasDeck && hasTopics && aiOk);
    if (E.shadowStartHint) {
      const missingAi = !aiOk;
      const missingScore = !scoreReady();
      E.shadowStartHint.hidden = !missingAi && !missingScore;
      if (missingAi) {
        E.shadowStartHint.textContent = 'Shadowing needs AI to write the paragraph — open Settings → AI and use the free model (no key), or paste your own key.';
      } else if (missingScore) {
        E.shadowStartHint.textContent = 'You can record and replay now, but scoring needs a key. ' + scoreSetupHint();
      } else {
        E.shadowStartHint.textContent = '';
      }
    }
    const builtin = E.selSource.value === 'builtin';
    // The quiz generator only controls quiz questions. Paragraph practice always
    // uses AI, so the shared focus box stays editable there.
    const reqDisabled = mode === 'quiz' && builtin;
    if (E.inpRequirement) E.inpRequirement.disabled = reqDisabled;
    if (E.btnClearRequirement) E.btnClearRequirement.disabled = reqDisabled;
    U.$$('#reqChips .req-chip[data-fill]').forEach(function (b) { b.disabled = reqDisabled; });
    if (E.setupAiBadge) {
      const alwaysAi = mode === 'paragraph' || mode === 'shadowing';
      E.setupAiBadge.hidden = alwaysAi ? !aiOk : (builtin || !aiOk);
    }
    renderPracticeTopics();
  }

  /* ---------- Grammar study area ---------- */
  /** Both courses keep their own progress; each card shows its own count. */
  function updateStudyUI() {
    if (!window.Grammar || !E.studyPct) return;
    // Each card always shows its own course, whichever one is open.
    const p = Grammar.courseSummary ? Grammar.courseSummary('tenses') : Grammar.progressSummary();
    E.studyPct.textContent = p.done + ' / ' + p.total;
    if (E.studyBar) E.studyBar.style.width = p.pct + '%';
    if (E.progressGrammar) E.progressGrammar.textContent = p.done + ' / ' + p.total;
    if (E.progressGrammarBar) E.progressGrammarBar.style.width = p.pct + '%';
    if (E.btnStudy) {
      E.btnStudy.textContent = p.done > 0 ? I18n.t('lessons.continueAtlas') : I18n.t('lessons.openAtlas');
    }
    const hb = Grammar.courseSummary ? Grammar.courseSummary('handbook') : null;
    if (!hb) return;
    if (E.handbookPct) E.handbookPct.textContent = hb.done + ' / ' + hb.total;
    if (E.handbookBar) E.handbookBar.style.width = hb.pct + '%';
    if (E.btnOpenHandbook) {
      E.btnOpenHandbook.textContent = hb.done > 0
        ? I18n.t('lessons.continueHandbook')
        : I18n.t('lessons.openHandbook');
    }
  }

  function openGrammar(startLesson, courseId) {
    if (!window.Grammar) {
      U.toast('The grammar course could not be loaded.', 'bad');
      return;
    }
    if (courseId && Grammar.useCourse) Grammar.useCourse(courseId);
    if (startLesson === true && Grammar.openNextLesson) Grammar.openNextLesson();
    else Grammar.openCourse();
    showScreen('grammar');
  }

  /** Prose reply from the grammar tutor, using the same provider as everything else. */
  async function askTutor(prompt, opts) {
    opts = opts || {};
    if (!aiReady()) {
      const err = new Error('AI is not set up yet.');
      err.friendly = 'AI is not set up yet. Open Settings → AI and use the free model (no key), or add your own key.';
      throw err;
    }
    return Ai.askTutor({
      provider: activeProvider(), baseUrl: activeBase(), key: activeKey(), model: activeModel(),
      system: opts.system, prompt: prompt, onWait: opts.onWait,
      maxTokens: opts.maxTokens, temperature: opts.temperature
    });
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
    settings.paragraphDirection = E.selParaDir.value;
    settings.paragraphCount = parseInt(E.selParaCount.value, 10) || 1;
    settings.count = parseInt(E.selCount.value, 10) || 0;
    settings.source = E.selSource.value;
    settings.difficulty = E.selDifficulty.value || 'standard';
    settings.requirement = (E.inpRequirement.value || '').trim().slice(0, 600);
    saveSettings();
    return {
      types: types, direction: settings.direction, count: settings.count, source: settings.source,
      difficulty: settings.difficulty, requirement: settings.requirement,
      paragraphDirection: settings.paragraphDirection, paragraphCount: settings.paragraphCount
    };
  }

  /* ---------- Active AI provider ---------- */
  /* Ai.providers is the whole list Settings → AI shows. A provider is either
     Google's own API ('gemini') or an OpenAI-compatible endpoint, which only
     differs by base URL — so everything below keeps working off the transport. */
  const PROVIDERS = Ai.providers;

  function providerDef(id) { return Ai.providerById(id) || PROVIDERS[0]; }
  /** Simple mode = the keyless free provider; Advanced = whatever the learner picked. */
  function aiMode() { return settings.aiMode === 'advanced' ? 'advanced' : 'simple'; }
  const FREE_PROVIDER = Ai.providerById('pollinations');
  function simpleModel() { return settings.simpleModel || FREE_PROVIDER.model; }
  function aiKeyless() { return !!providerDef(activeProviderId()).keyless; }
  /** The provider in use: the free keyless one in Simple, the picked one in Advanced. */
  function activeProviderId() {
    if (aiMode() === 'simple') return FREE_PROVIDER.id;
    return Ai.providerById(settings.aiProvider) ? settings.aiProvider : 'gemini';
  }
  /** How we talk to it: Google's API, or OpenAI-compatible. */
  function activeProvider() { return providerDef(activeProviderId()).transport; }
  function activeKey() {
    if (aiKeyless()) return '';
    return Ai.normalizeKey(activeProvider() === 'openai' ? settings.oaiKey : settings.geminiKey);
  }
  function activeBase() {
    if (aiKeyless()) return FREE_PROVIDER.base;
    return activeProvider() === 'openai' ? (settings.oaiBase || '') : '';
  }
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
    if (aiKeyless()) return simpleModel();
    if (activeProvider() === 'openai') {
      return settings.oaiModel || defaultModelForBase(settings.oaiBase) ||
        providerDef(activeProviderId()).model || 'openrouter/free';
    }
    return settings.geminiModel || 'gemini-flash-latest';
  }
  function setActiveModel(id) {
    if (aiKeyless()) { settings.simpleModel = id; saveSettings(); return; }
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
    if (id === 'gemini' || aiKeyless()) return;
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
    const azure = Ai.normalizeKey(settings.azureKey);
    if (oai !== (settings.oaiKey || '') || gem !== (settings.geminiKey || '') || azure !== (settings.azureKey || '')) {
      settings.oaiKey = oai;
      settings.geminiKey = gem;
      settings.azureKey = azure;
      saveSettings();
    }
  }
  // Ready when the provider needs no key (Simple), a key exists — or, for local
  // servers (Ollama), when the base URL is localhost.
  function aiReady() {
    return aiKeyless() || !!activeKey() || (activeProvider() === 'openai' && Ai.isLocalBaseUrl(activeBase()));
  }
  function providerName() {
    if (aiMode() === 'simple') return 'free AI';
    return activeProvider() === 'openai' ? 'AI provider' : 'Gemini';
  }

  async function startQuiz(opts) {
    opts = opts || {};
    if (!state.deck) { U.toast('Load a vocabulary deck first.', 'warn'); return; }
    setPracticeMode('quiz');
    const setup = readSetup();
    if (!setup.types.length) { U.toast('Pick at least one question type.', 'warn'); return; }

    let words = opts.words;
    const available = selectedWords();
    if (!words) {
      if (!available.length) { U.toast('Select at least one topic.', 'warn'); return; }
      words = Quiz.selectWords(available, setup.count);
    }
    if (!words.length) { U.toast('No words to practise.', 'warn'); return; }

    let items = Quiz.planItems(words, setup.types, setup.direction, settings.rotation);
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
        aiKeyless: aiKeyless(),
        aiModel: activeModel(),
        difficulty: setup.difficulty,
        requirement: setup.requirement,
        targetLang: settings.targetLang,
        meaningLang: 'Vietnamese',
        onProgress: overlayProgress,
        signal: state.controller.signal
      });

      if (!result.questions.length) {
        throw Object.assign(new Error('No questions'), {
          friendly: 'Could not build any questions from these words.'
        });
      }

      state.session = {
        questions: Quiz.makeSession(result.questions, 0),
        index: 0,
        answers: [],
        score: 0,
        streak: 0,
        bestStreak: 0,
        startedAt: Date.now(),
        fromMistakes: !!opts.words,
        paragraphOnly: false
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

  /** Paragraph translation is its own practice: AI-only, never mixed with quiz questions. */
  async function startParagraphPractice() {
    if (!state.deck) { U.toast('Load a vocabulary deck first.', 'warn'); return; }
    const setup = readSetup();
    setPracticeMode('paragraph');
    if (!paragraphAvailable()) {
      const msg = 'Paragraph translation needs AI — open Settings → AI and use the free model (no key), or paste your own key.';
      U.toast(msg, 'warn');
      showAiIssue(msg);
      return;
    }
    const available = selectedWords();
    if (!available.length) { U.toast('Select at least one topic.', 'warn'); return; }
    // A paragraph needs a pool of candidate words. Prefer the selected topics;
    // fall back to the whole deck only when a topic is too small to draw from.
    let paraWords = available;
    if (paraWords.length < 6) {
      const all = allWords();
      if (all.length >= 6) paraWords = all;
    }
    const items = Quiz.planParagraphs(paraWords, setup.paragraphCount, setup.paragraphDirection);
    if (!items.length) {
      U.toast('Add at least 6 words to the selected topic to write a paragraph.', 'warn');
      return;
    }

    const pool = available.length >= 4 ? available : allWords();
    state.controller = new AbortController();
    showOverlay('Writing a paragraph…',
      aiMode() === 'simple' ? 'Asking the free AI for a short text…' : 'Asking the AI for a short text…');
    try {
      const result = await Quiz.buildPool({
        items: items,
        pool: pool,
        source: 'ai',
        aiProvider: activeProvider(),
        aiBaseUrl: activeBase(),
        aiKey: activeKey(),
        aiKeyless: aiKeyless(),
        aiModel: activeModel(),
        difficulty: setup.difficulty,
        requirement: setup.requirement,
        targetLang: settings.targetLang,
        meaningLang: 'Vietnamese',
        onProgress: overlayProgress,
        signal: state.controller.signal
      });

      if (!result.questions.length) {
        const why = result.aiError;
        throw Object.assign(new Error('No paragraph'), {
          friendly: why
            ? 'Paragraph translation could not be generated — ' + (why.friendly || 'the AI reply was unusable.')
            : 'Could not generate a paragraph from these words.'
        });
      }

      state.session = {
        questions: Quiz.makeSession(result.questions, 0),
        index: 0,
        answers: [],
        score: 0,
        streak: 0,
        bestStreak: 0,
        startedAt: Date.now(),
        fromMistakes: false,
        paragraphOnly: true
      };
      state.answered = false;
      if (result.aiError) {
        const err = result.aiError;
        const detail = err.friendly || err.message || 'Some paragraphs could not be generated.';
        showAiIssue(err.detail || detail);
        U.toast(detail, 'warn', 12000);
      } else {
        showAiIssue('');
      }
      updateUsageUI();
      showScreen('quiz');
      renderQuestion();
    } catch (e) {
      if (e && e.name === 'AbortError') {
        U.toast('Generation cancelled.', 'warn');
      } else {
        const msg = e.friendly || e.message || 'Could not write a paragraph.';
        showAiIssue(e.detail || msg);
        U.toast(msg, 'bad', 12000);
      }
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
    E.qProgressText.textContent = (s.paragraphOnly ? 'Paragraph ' : 'Question ') +
      (s.index + 1) + ' of ' + s.questions.length;
    E.qScore.textContent = s.score + ' ✓';
    E.btnExitQuiz.title = s.paragraphOnly ? 'End this practice' : 'End this quiz';
    if (s.streak >= 2) { E.qStreak.hidden = false; E.qStreak.querySelector('span').textContent = String(s.streak); }
    else E.qStreak.hidden = true;

    E.qTypeBadge.textContent = Quiz.typeLabel(q.type) + (q.source === 'ai' ? ' ✨' : '');
    E.qTopicBadge.hidden = !q.word.topicName;
    E.qTopicBadge.textContent = q.word.topicName || '';

    E.qPrompt.hidden = false;
    E.qPrompt.innerHTML = U.esc(q.prompt).replace(/(_{2,})/g, '<span class="blank">$1</span>');
    E.qHintBox.hidden = !q.hint;
    E.qHintBox.textContent = q.hint || '';

    // The global speaker reads a one-word prompt; a paragraph has its own button
    // so it can use the right language for the source text.
    const speakable = q.type !== 'blank' && q.type !== 'paragraph' && q.direction !== 'meaning2term';
    E.btnSpeakPrompt.hidden = !speakable;

    E.qFeedback.hidden = true;
    E.qFeedback.className = 'feedback';
    if (E.fbUpgrades) { E.fbUpgrades.hidden = true; E.fbUpgrades.innerHTML = ''; }
    E.qOptions.innerHTML = '';
    E.qOptions.hidden = true;
    E.qInputRow.hidden = true;
    E.btnDontKnow.hidden = false;
    E.qInput.disabled = false;
    E.qParagraph.hidden = true;
    E.paraFeedback.hidden = true;
    E.paraFeedback.innerHTML = '';
    E.paraFeedback.className = 'para-feedback';
    state.paraBusy = false;

    if (q.type === 'paragraph') {
      renderParagraph(q);
    } else if (q.type === 'mc') {
      E.qOptions.hidden = false;
      // A cached question is stored with one fixed option order, so replaying it
      // felt like the same choices every time. Reshuffle per render: every
      // question gets its own random order, and the answer is not always in the
      // same slot. Overlap with the previous question is fine — it is random.
      if (Array.isArray(q.options) && q.options.length > 1) {
        q.options = U.shuffle(q.options.slice());
      }
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
    if (q.type === 'mc') questEvent('mc30', 1);
    questEvent('mixed20', 1);
    if (correct) questEvent('correct10', 1);

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

    if (correct && q.type === 'translate' && q.direction === 'meaning2term' &&
      response && String(response).trim()) {
      loadQuizUpgrades(q, response);
    }
    setTimeout(function () { E.btnNext.focus(); }, 60);
    updateStatsUI();
  }

  /* ---------- B1/B2 upgrades for correct typed VI → target answers ---------- */
  const QUIZ_UPGRADE_KEY = 'quizUpgradeCache';
  const QUIZ_UPGRADE_TTL = 14 * 24 * 60 * 60 * 1000;

  function quizUpgradeKey(q, response) {
    return [settings.targetLang || 'French', U.normalize(q.word.term || q.answer || ''),
      U.normalize(response || '')].join('|');
  }

  function readQuizUpgradeCache(key) {
    const all = U.lsGet(QUIZ_UPGRADE_KEY, {}) || {};
    const hit = all[key];
    if (!hit || Date.now() - (hit.at || 0) > QUIZ_UPGRADE_TTL) return null;
    return Array.isArray(hit.list) ? hit.list : null;
  }

  function writeQuizUpgradeCache(key, list) {
    const all = U.lsGet(QUIZ_UPGRADE_KEY, {}) || {};
    all[key] = { at: Date.now(), list: list };
    const keys = Object.keys(all);
    if (keys.length > 200) {
      keys.sort(function (a, b) { return (all[a].at || 0) - (all[b].at || 0); });
      keys.slice(0, keys.length - 200).forEach(function (k) { delete all[k]; });
    }
    U.lsSet(QUIZ_UPGRADE_KEY, all);
  }

  function renderQuizUpgrades(list, cached) {
    if (!E.fbUpgrades) return;
    const upgrades = Array.isArray(list) ? list : [];
    E.fbUpgrades.hidden = false;
    E.fbUpgrades.innerHTML = '';
    const head = paraEl('div', 'fb-upgrades-head');
    head.appendChild(paraEl('strong', 'fb-upgrades-title', I18n.t('levelUp.title')));
    head.appendChild(paraEl('span', 'pill pill-accent', String(upgrades.length)));
    if (cached) head.appendChild(paraEl('span', 'muted tiny', 'cached'));
    E.fbUpgrades.appendChild(head);
    E.fbUpgrades.appendChild(paraEl('p', 'muted small', I18n.t('levelUp.sub')));
    if (!upgrades.length) {
      E.fbUpgrades.appendChild(paraEl('p', 'muted small', I18n.t('levelUp.empty')));
      return;
    }
    upgrades.forEach(function (up) {
      const card = paraEl('article', 'upgrade-card compact');
      const change = paraEl('div', 'upgrade-change');
      change.appendChild(paraEl('span', 'upgrade-from', up.from));
      change.appendChild(paraEl('span', 'upgrade-arrow', '→'));
      change.appendChild(paraEl('span', 'upgrade-to', up.to));
      change.appendChild(paraEl('span', 'pill pill-accent upgrade-level', up.level));
      const badge = paraEl('span', 'dict-wrap');
      badge.innerHTML = dictBadge(up);
      change.appendChild(badge);
      card.appendChild(change);
      if (up.why || up.meaning) {
        const why = paraEl('p', 'upgrade-why');
        if (up.why) why.appendChild(document.createTextNode(up.why));
        if (up.meaning) {
          if (up.why) why.appendChild(document.createTextNode(' · '));
          why.appendChild(paraEl('span', 'muted', I18n.t('levelUp.meaning') + ': ' + up.meaning));
        }
        card.appendChild(why);
      }
      E.fbUpgrades.appendChild(card);
    });
  }

  function loadQuizUpgrades(q, response) {
    if (!E.fbUpgrades) return;
    E.fbUpgrades.hidden = true;
    E.fbUpgrades.innerHTML = '';
    if (!q || q.type !== 'translate' || q.direction !== 'meaning2term') return;
    if (!response || !String(response).trim()) return;
    if (!aiReady()) {
      E.fbUpgrades.hidden = false;
      E.fbUpgrades.innerHTML = '<p class="muted small">' + U.esc(I18n.t('levelUp.aiNeeded')) + '</p>';
      return;
    }
    const key = quizUpgradeKey(q, response);
    const cached = readQuizUpgradeCache(key);
    if (cached) {
      renderQuizUpgrades(cached, true);
      return;
    }
    E.fbUpgrades.hidden = false;
    E.fbUpgrades.innerHTML = '<p class="muted small upgrade-loading">' + U.esc(I18n.t('levelUp.loading')) + '</p>';
    const wanted = q;
    Ai.suggestUpgrades({
      provider: activeProvider(), baseUrl: activeBase(), key: activeKey(), model: activeModel(),
      source: q.prompt, reference: q.answer, userText: response, direction: 'vi2fr',
      targetLang: settings.targetLang, uiLang: I18n.lang(),
      onWait: function (ms) {
        if (currentQuestion() !== wanted || !E.fbUpgrades) return;
        E.fbUpgrades.innerHTML = '<p class="muted small upgrade-loading">' +
          U.esc(I18n.t('levelUp.waiting', { s: Math.round(ms / 1000) })) + '</p>';
      }
    }).then(function (list) {
      if (currentQuestion() !== wanted) return;
      const clean = Array.isArray(list) ? list : [];
      renderQuizUpgrades(clean, false);
      if (!clean.length) { writeQuizUpgradeCache(key, clean); return; }
      if (!window.Dict) { writeQuizUpgradeCache(key, clean); return; }
      Dict.verifyUpgrades(clean, settings.targetLang).then(function (checked) {
        writeQuizUpgradeCache(key, checked);
        if (currentQuestion() === wanted) renderQuizUpgrades(checked, false);
      }).catch(function () {
        clean.forEach(function (up) { if (!up.dict) up.dict = { status: 'unavailable' }; });
        writeQuizUpgradeCache(key, clean);
        if (currentQuestion() === wanted) renderQuizUpgrades(clean, false);
      });
    }).catch(function () {
      if (currentQuestion() === wanted && E.fbUpgrades) {
        E.fbUpgrades.innerHTML = '<p class="muted small">' + U.esc(I18n.t('levelUp.error')) + '</p>';
      }
    });
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

  /* ---------- Paragraph translation ---------- */
  /** A paragraph card: source text + the sheet words that must appear, then a textarea. */
  function renderParagraph(q) {
    const fr2vi = q.direction !== 'vi2fr';
    E.qParagraph.hidden = false;
    E.qPrompt.hidden = true;
    E.qHintBox.hidden = true;
    E.btnDontKnow.hidden = true;

    const target = targetLangName();
    E.paraDir.textContent = fr2vi ? target + ' → Vietnamese' : 'Vietnamese → ' + target;
    E.paraText.textContent = q.prompt;
    E.paraText.lang = fr2vi ? targetLangRoot() : 'vi';
    E.btnParaSpeak.hidden = false;

    // The word the learner must produce is the main line: the Vietnamese
    // meaning when they write Vietnamese, the French term when they write French.
    E.paraKeywords.innerHTML = '';
    (q.keywords || []).forEach(function (k) {
      const li = document.createElement('li');
      li.className = 'pw';
      const main = document.createElement('span');
      main.className = 'pw-main';
      main.textContent = fr2vi ? k.meaning : k.term;
      const sub = document.createElement('span');
      sub.className = 'pw-sub';
      sub.textContent = fr2vi ? k.term : k.meaning;
      li.appendChild(main);
      li.appendChild(sub);
      if (k.note) {
        const note = document.createElement('span');
        note.className = 'pw-note';
        note.textContent = k.note;
        li.appendChild(note);
      }
      E.paraKeywords.appendChild(li);
    });

    E.paraInput.value = '';
    E.paraInput.lang = fr2vi ? 'vi' : targetLangRoot();
    E.paraInput.placeholder = fr2vi
      ? 'Write the Vietnamese translation…'
      : 'Write the ' + target + ' translation…';
    E.paraInput.disabled = false;
    E.paraCount.textContent = '0 words';
    E.btnParaSubmit.textContent = 'Check with AI';
    E.btnParaSubmit.disabled = false;
    E.btnParaSkip.disabled = false;
    q.paraAttempts = [];
    q.paraChecks = 0;
    q.paraComplete = false;
    q.paraLastCheck = null;
    q.paraFinalized = false;
    q.paraUpgrades = [];
    if (E.paraInspector) E.paraInspector.hidden = false;
    if (E.paraFeedback) { E.paraFeedback.hidden = true; E.paraFeedback.innerHTML = ''; }
    if (E.paraLevelUp) { E.paraLevelUp.hidden = true; E.paraLevelUp.innerHTML = ''; }
    if (E.corrCount) E.corrCount.textContent = '0';
    if (E.upgradeCount) E.upgradeCount.textContent = '0';
    setInspectorTab('corrections');
    syncParaHighlights();
    E.paraInput.focus();
  }

  function paraEl(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  /** “All good” is stricter than the old 70/100 pass mark: no notes, no missing words. */
  function paragraphIsGood(fb) {
    if (!fb) return false;
    const notes = fb.notes || [];
    const missing = (fb.used || []).filter(function (u) { return !u.used; });
    return Number(fb.score) >= 90 && notes.length === 0 && missing.length === 0;
  }

  /** Level-up is stricter: a perfect grammar score, no notes, all words used. */
  function paragraphIsPerfect(fb) {
    if (!fb) return false;
    const notes = fb.notes || [];
    const missing = (fb.used || []).filter(function (u) { return !u.used; });
    return Number(fb.score) === 100 && notes.length === 0 && missing.length === 0;
  }

  function setInspectorTab(tab) {
    const level = tab === 'level';
    if (E.tabCorrections) {
      E.tabCorrections.classList.toggle('is-active', !level);
      E.tabCorrections.setAttribute('aria-selected', level ? 'false' : 'true');
    }
    if (E.tabLevelUp) {
      E.tabLevelUp.classList.toggle('is-active', level);
      E.tabLevelUp.setAttribute('aria-selected', level ? 'true' : 'false');
    }
    if (E.paraFeedback) {
      E.paraFeedback.hidden = level || !String(E.paraFeedback.innerHTML || '').trim();
    }
    if (E.paraLevelUp) {
      E.paraLevelUp.hidden = !level || !String(E.paraLevelUp.innerHTML || '').trim();
    }
  }

  function syncParaHighlights() {
    if (!E.paraHighlights || !E.paraInput) return;
    const text = E.paraInput.value || '';
    const q = currentQuestion();
    if (!q || q.type !== 'paragraph' || !text) {
      E.paraHighlights.innerHTML = U.esc(text);
      return;
    }
    const fb = (q.paraLastCheck && q.paraLastCheck.fb) || null;
    const ranges = [];
    if (fb) {
      (fb.notes || []).forEach(function (n) {
        if (!n.text) return;
        const at = text.indexOf(n.text);
        if (at !== -1) ranges.push({ start: at, end: at + n.text.length, kind: 'correction' });
      });
      (fb.upgrades || []).forEach(function (up) {
        if (!up.from) return;
        const at = text.indexOf(up.from);
        if (at !== -1 && !ranges.some(function (r) {
          return at < r.end && at + up.from.length > r.start;
        })) ranges.push({ start: at, end: at + up.from.length, kind: 'upgrade' });
      });
    }
    if (!ranges.length) {
      E.paraHighlights.innerHTML = U.esc(text);
      return;
    }
    ranges.sort(function (a, b) { return a.start - b.start; });
    let html = '';
    let cursor = 0;
    ranges.forEach(function (r) {
      if (r.start < cursor) return;
      html += U.esc(text.slice(cursor, r.start));
      html += '<mark class="hl-' + r.kind + '">' + U.esc(text.slice(r.start, r.end)) + '</mark>';
      cursor = r.end;
    });
    html += U.esc(text.slice(cursor));
    E.paraHighlights.innerHTML = html;
  }

  function applyUpgrade(up) {
    if (!up || !E.paraInput || E.paraInput.disabled) return;
    const text = E.paraInput.value;
    const at = text.indexOf(up.from);
    if (at === -1) {
      U.toast('That phrase is no longer in your text.', 'warn');
      return;
    }
    E.paraInput.value = text.slice(0, at) + up.to + text.slice(at + up.from.length);
    E.paraInput.dispatchEvent(new Event('input', { bubbles: true }));
    E.paraInput.focus();
    E.paraInput.setSelectionRange(at, at + up.to.length);
    U.toast('Upgrade applied. Check again when you are ready.', 'ok', 4000);
  }

  async function submitParagraph() {
    const q = currentQuestion();
    if (!q || q.type !== 'paragraph' || state.answered || state.paraBusy) return;
    if ((q.paraChecks || 0) >= 3 && !q.paraComplete) {
      U.toast('That was the third AI check. Apply the fixes if you like, then press “Finish anyway”.', 'warn', 9000);
      return;
    }
    const text = E.paraInput.value.trim();
    if (!text) { U.toast('Write your translation first.', 'warn'); E.paraInput.focus(); return; }
    // The learner already reached a good score and may have applied optional
    // upgrades since: “Complete” records the text as it stands, no extra AI call.
    if (q.paraComplete && q.paraLastCheck) {
      finalizeParagraph(q, text, q.paraLastCheck.fb);
      return;
    }
    if (!aiReady()) {
      const msg = 'Paragraph translation needs AI — open Settings → AI and use the free model (no key), or paste your own key.';
      U.toast(msg, 'warn');
      showAiIssue(msg);
      return;
    }
    // Clicking “Check again” without touching the text should not spend another
    // AI request. The previous result still applies.
    if (q.paraLastCheck && q.paraLastCheck.text === text) {
      if (paragraphIsGood(q.paraLastCheck.fb)) {
        finalizeParagraph(q, text, q.paraLastCheck.fb);
      } else {
        U.toast('Change something first — the AI already checked this exact text.', 'warn', 7000);
        E.paraInput.focus();
      }
      return;
    }
    state.paraBusy = true;
    E.btnParaSubmit.disabled = true;
    E.btnParaSubmit.textContent = aiMode() === 'simple' ? 'Checking… (free AI)' : 'Checking…';
    E.paraInput.disabled = true;
    E.btnParaSkip.disabled = true;
    let fb = null;
    try {
      fb = await Ai.correctParagraph({
        provider: activeProvider(), baseUrl: activeBase(), key: activeKey(), model: activeModel(),
        source: q.prompt, reference: q.reference, userText: text, direction: q.direction,
        keywords: q.keywords, targetLang: settings.targetLang, meaningLang: 'Vietnamese',
        uiLang: I18n.lang(),
        onWait: function (ms) {
          const secs = Math.round(ms / 1000);
          E.btnParaSubmit.textContent = 'Waiting ' + secs + ' s…';
          U.toast('Free AI allows one request every 30 seconds — waiting ' + secs + ' s. ' +
            'Switch to Advanced for no waiting.', 'warn', 8000);
        }
      });
    } catch (e) {
      state.paraBusy = false;
      E.paraInput.disabled = false;
      E.btnParaSubmit.disabled = false;
      E.btnParaSubmit.textContent = 'Try again';
      E.btnParaSkip.disabled = false;
      const detail = (e && (e.detail || e.friendly)) || (e && e.message) || 'The AI could not check this translation.';
      const quota = e && (e.status === 429 || /429|quota|rate limit/i.test(String(detail)));
      showAiIssue(detail, quota ? 'quota' : '');
      U.toast(detail.split('\n')[0], 'bad', 12000);
      renderParaError(detail);
      return;
    }
    state.paraBusy = false;
    finishParagraph(q, text, fb);
  }

  /** A paragraph is one essay, not one word: it scores, but writes no word mastery. */
  function finishParagraph(q, text, fb) {
    if (state.answered) return;
    const s = state.session;
    q.paraChecks = (q.paraChecks || 0) + 1;
    q.paraAttempts = q.paraAttempts || [];
    q.paraAttempts.push({ text: text, score: Number(fb.score) || 0, verdict: fb.verdict, at: Date.now() });
    q.paraLastCheck = { text: text, fb: fb };
    const good = paragraphIsGood(fb);
    q.paraComplete = good;

    E.paraInput.disabled = false;
    E.btnParaSkip.disabled = false;
    E.btnParaSubmit.disabled = !good && q.paraChecks >= 3;
    E.btnParaSubmit.textContent = good ? 'Complete'
      : (q.paraChecks >= 3 ? '3 checks used' : 'Check again');
    // A good paragraph stays editable until the learner presses “Complete”, so
    // the optional B1/B2 upgrades can still be applied to the finished text.
    renderParaFeedback(text, fb, good);
    if (!good) {
      E.paraInput.focus();
      U.toast('Not complete yet — apply the fixes or edit the text, then check again. ' +
        (q.paraChecks >= 3 ? 'You can also finish anyway.' : ''), 'warn', 8000);
    }
  }

  function finalizeParagraph(q, text, fb) {
    if (q.paraFinalized || state.answered) return;
    q.paraFinalized = true;
    state.answered = true;
    const s = state.session;
    const correct = Number(fb.score) >= 70;
    s.answers.push({
      question: q, response: text, verdict: fb.verdict, correct: correct, score: fb.score,
      attempts: q.paraAttempts || [], at: Date.now()
    });
    if (correct) { s.score += 1; s.streak += 1; s.bestStreak = Math.max(s.bestStreak, s.streak); }
    else s.streak = 0;
    questEvent('paragraph1', 1);

    E.qScore.textContent = s.score + ' ✓';
    if (s.streak >= 2) { E.qStreak.hidden = false; E.qStreak.querySelector('span').textContent = String(s.streak); }
    E.progressBar.style.width = Math.round(((s.index + 1) / s.questions.length) * 100) + '%';
    E.btnParaSubmit.disabled = true;
    E.btnParaSubmit.textContent = 'Complete';
    E.paraInput.disabled = true;
    E.btnParaSkip.disabled = true;
    renderParaFeedback(text, fb, correct);
    updateStatsUI();
  }

  function renderParaError(detail) {
    if (E.paraInspector) E.paraInspector.hidden = false;
    if (E.paraLevelUp) { E.paraLevelUp.hidden = true; E.paraLevelUp.innerHTML = ''; }
    setInspectorTab('corrections');
    const box = E.paraFeedback;
    box.innerHTML = '';
    box.hidden = false;
    box.className = 'para-feedback bad';
    box.appendChild(paraEl('p', 'pf-title', 'The AI could not check this translation'));
    box.appendChild(paraEl('p', 'pf-text', detail));
    box.appendChild(paraEl('p', 'muted small',
      'Fix the AI connection in Settings → AI, then press “Try again”. Paragraph translation stays unavailable until it works.'));
  }

  function renderParaFeedback(text, fb, correct) {
    const box = E.paraFeedback;
    if (E.paraInspector) E.paraInspector.hidden = false;
    box.innerHTML = '';
    box.hidden = false;
    box.className = 'para-feedback ' + (correct ? 'ok' : (fb.score >= 45 ? 'close' : 'bad'));
    if (E.corrCount) E.corrCount.textContent = String((fb.notes || []).length);

    const head = paraEl('div', 'pf-head');
    const score = paraEl('div', 'pf-score', String(fb.score));
    score.appendChild(paraEl('small', '', '/100'));
    head.appendChild(score);
    const headText = paraEl('div', 'pf-headtext');
    headText.appendChild(paraEl('p', 'pf-title', fb.verdict === 'good'
      ? 'Well done — only small fixes'
      : fb.verdict === 'fair' ? 'Good try — a few fixes' : 'Needs work — see the comment and words'));
    headText.appendChild(paraEl('p', 'muted small', fb.comment || 'Corrected with the smallest changes possible.'));
    head.appendChild(headText);
    box.appendChild(head);

    // Show the learner's version only when it changed, so the panel stays short.
    if (fb.corrected && fb.corrected !== text) {
      box.appendChild(textBlock('Your text', text));
      box.appendChild(textBlock('With minimal fixes', fb.corrected, 'pf-fixed'));
    } else {
      box.appendChild(textBlock('Your text — no wording fixes', text, 'pf-fixed'));
    }

    if (fb.notes.length) {
      const block = paraEl('div', 'pf-block');
      block.appendChild(paraEl('h4', 'pf-h', 'Corrections'));
      const ol = paraEl('ol', 'pf-notes');
      fb.notes.forEach(function (n) {
        const li = paraEl('li', 'pf-note');
        if (n.text) li.appendChild(paraEl('q', 'pf-quote', n.text));
        if (n.fix) {
          if (n.text) li.appendChild(paraEl('span', 'pf-arrow', '→'));
          li.appendChild(paraEl('span', 'pf-fix', n.fix));
        }
        if (n.why) li.appendChild(paraEl('p', 'pf-why', n.why));
        ol.appendChild(li);
      });
      block.appendChild(ol);
      box.appendChild(block);
    }

    if (fb.used && fb.used.length) {
      const block = paraEl('div', 'pf-block');
      block.appendChild(paraEl('h4', 'pf-h', 'Words from your sheet'));
      const ul = paraEl('ul', 'pf-words');
      fb.used.forEach(function (w) {
        const li = paraEl('li', w.used ? 'ok' : 'miss');
        li.appendChild(paraEl('span', 'pf-tick', w.used ? '✓' : '✗'));
        li.appendChild(paraEl('span', 'pf-term', w.term));
        li.appendChild(paraEl('span', 'pf-meaning', w.meaning));
        ul.appendChild(li);
      });
      block.appendChild(ul);
      box.appendChild(block);
    }

    const q = currentQuestion();
    const attempts = (q && q.paraAttempts) || [];
    if (attempts.length > 1) {
      const history = paraEl('div', 'pf-block pf-attempts');
      history.appendChild(paraEl('h4', 'pf-h', 'Your attempts'));
      const ul = paraEl('ul', 'pf-history');
      attempts.forEach(function (a, i) {
        const li = paraEl('li', '');
        li.appendChild(paraEl('span', 'pf-attempt-n', 'Attempt ' + (i + 1)));
        li.appendChild(paraEl('span', 'pf-attempt-score', String(a.score) + '/100'));
        ul.appendChild(li);
      });
      history.appendChild(ul);
      box.appendChild(history);
    }

    const actions = paraEl('div', 'pf-actions');
    const good = state.answered || paragraphIsGood(fb);
    const last = state.session && state.session.index >= state.session.questions.length - 1;
    if (good) {
      const next = paraEl('button', 'btn btn-primary',
        last ? 'See results' : (state.session && state.session.paragraphOnly ? 'Next paragraph' : 'Next question'));
      next.type = 'button';
      next.addEventListener('click', function () {
        // The paragraph may still be open so upgrades can be applied: record it
        // with the current text before moving on.
        if (!state.answered) finalizeParagraph(q, E.paraInput.value.trim() || text, fb);
        nextQuestion();
      });
      actions.appendChild(next);
      next.focus();
    } else if ((q && q.paraChecks) >= 3) {
      actions.appendChild(paraEl('p', 'muted small',
        'Third check used. Apply the fixes above in your own words if you like, then finish this paragraph.'));
      const finish = paraEl('button', 'btn btn-primary', 'Finish anyway');
      finish.type = 'button';
      finish.addEventListener('click', function () {
        const textNow = E.paraInput.value.trim() || text;
        finalizeParagraph(q, textNow, fb);
      });
      actions.appendChild(finish);
      finish.focus();
    } else {
      if (fb.corrected && fb.corrected !== text) {
        const apply = paraEl('button', 'btn btn-primary', 'Apply fixes and edit');
        apply.type = 'button';
        apply.addEventListener('click', function () {
          if (E.paraInput.disabled) return;
          E.paraInput.value = fb.corrected;
          E.paraInput.dispatchEvent(new Event('input', { bubbles: true }));
          E.paraInput.focus();
          U.toast('Fixes applied. Edit anything you like, then check again.', 'ok', 5000);
        });
        actions.appendChild(apply);
      }
      const again = paraEl('button', 'btn btn-subtle', 'Check again');
      again.type = 'button';
      again.addEventListener('click', submitParagraph);
      actions.appendChild(again);
      again.focus();
    }
    box.appendChild(actions);
    renderLevelUp(fb, q);
    setInspectorTab(paragraphIsPerfect(fb) ? 'level' : 'corrections');
    syncParaHighlights();
  }

  function textBlock(title, body, cls) {
    const block = paraEl('div', 'pf-block' + (cls ? ' ' + cls : ''));
    block.appendChild(paraEl('h4', 'pf-h', title));
    block.appendChild(paraEl('p', 'pf-text', body));
    return block;
  }

  function dictBadge(up) {
    const status = up.dict && up.dict.status;
    if (!status || status === 'pending') {
      return '<span class="dict-badge pending" title="Checking the dictionary">…</span>';
    }
    if (status === 'verified') {
      const source = up.dict.source === 'wiktionary' ? 'Wiktionary' : 'FreeDictionaryAPI';
      return '<span class="dict-badge ok" title="' + U.esc(source) + '">✓</span>';
    }
    if (status === 'ai') {
      return '<span class="dict-badge ai" title="' + I18n.t('levelUp.aiOnly') + '">AI</span>';
    }
    if (status === 'not-found') {
      return '<span class="dict-badge warn" title="' + I18n.t('levelUp.notFound') + '">!</span>';
    }
    return '<span class="dict-badge warn" title="' + I18n.t('levelUp.unavailable') + '">!</span>';
  }

  function upgradeContext(from) {
    const text = E.paraInput ? E.paraInput.value : '';
    const at = text.indexOf(from);
    if (at === -1) return from;
    let start = Math.max(text.lastIndexOf('.', at) + 1, text.lastIndexOf('!', at) + 1,
      text.lastIndexOf('?', at) + 1, text.lastIndexOf('\n', at) + 1);
    let end = text.length;
    const stops = ['.', '!', '?', '\n'].map(function (ch) {
      const i = text.indexOf(ch, at + from.length);
      return i === -1 ? text.length : i + 1;
    });
    end = Math.min.apply(Math, stops);
    const sentence = text.slice(start, end).trim();
    return sentence || from;
  }

  function renderLevelUp(fb, q) {
    if (!E.paraLevelUp) return;
    E.paraLevelUp.innerHTML = '';
    const perfect = paragraphIsPerfect(fb);
    const list = perfect ? (fb.upgrades || []) : [];
    if (E.upgradeCount) E.upgradeCount.textContent = String(list.length);

    if (!perfect) {
      const locked = paraEl('div', 'levelup-locked');
      locked.appendChild(paraEl('span', 'levelup-lock-ico', '🔒'));
      locked.appendChild(paraEl('p', 'pf-title', I18n.t('levelUp.locked')));
      locked.appendChild(paraEl('p', 'muted small', I18n.t('corrections.allGood')));
      E.paraLevelUp.appendChild(locked);
      return;
    }

    const intro = paraEl('div', 'levelup-intro');
    intro.appendChild(paraEl('p', 'levelup-kicker', 'B1 → B2'));
    intro.appendChild(paraEl('p', 'muted small', I18n.t('levelUp.sub')));
    E.paraLevelUp.appendChild(intro);

    if (!list.length) {
      E.paraLevelUp.appendChild(paraEl('p', 'muted small', I18n.t('levelUp.empty')));
      return;
    }

    const applyAll = paraEl('button', 'btn btn-subtle btn-sm levelup-apply-all', I18n.t('levelUp.applyAll'));
    applyAll.type = 'button';
    applyAll.addEventListener('click', function () {
      // Apply non-overlapping word/phrase upgrades from left to right. Sentence
      // upgrades are applied only when they are the sole selected suggestion,
      // and a word the dictionary rejected is never applied automatically.
      let text = E.paraInput.value;
      let applied = 0;
      let skipped = 0;
      list.slice().sort(function (a, b) { return text.indexOf(b.from) - text.indexOf(a.from); })
        .forEach(function (up) {
          if (up.scope === 'sentence' || (up.dict && up.dict.status === 'not-found')) {
            skipped += 1;
            return;
          }
          const at = text.indexOf(up.from);
          if (at === -1) return;
          text = text.slice(0, at) + up.to + text.slice(at + up.from.length);
          applied += 1;
        });
      if (!applied) {
        U.toast('Nothing safe to apply yet — check the badges on each suggestion.', 'warn', 6000);
        return;
      }
      E.paraInput.value = text;
      E.paraInput.dispatchEvent(new Event('input', { bubbles: true }));
      U.toast(skipped
        ? 'Safe upgrades applied. ' + skipped + ' unverified suggestion' + (skipped === 1 ? '' : 's') + ' skipped.'
        : 'Safe upgrades applied. Check again when you are ready.', 'ok', 4000);
    });
    E.paraLevelUp.appendChild(applyAll);

    list.forEach(function (up) {
      const card = paraEl('article', 'upgrade-card');
      const context = upgradeContext(up.from);
      const snippet = paraEl('p', 'upgrade-context');
      const at = context.indexOf(up.from);
      if (at === -1) {
        snippet.textContent = context;
      } else {
        snippet.innerHTML = U.esc(context.slice(0, at)) + '<mark>' + U.esc(up.from) + '</mark>' +
          U.esc(context.slice(at + up.from.length));
      }
      card.appendChild(snippet);

      const change = paraEl('div', 'upgrade-change');
      const from = paraEl('span', 'upgrade-from', up.from);
      const arrow = paraEl('span', 'upgrade-arrow', '→');
      const to = paraEl('span', 'upgrade-to', up.to);
      const level = paraEl('span', 'pill pill-accent upgrade-level', up.level);
      const badge = paraEl('span', 'dict-wrap');
      badge.innerHTML = dictBadge(up);
      change.appendChild(from);
      change.appendChild(arrow);
      change.appendChild(to);
      change.appendChild(level);
      change.appendChild(badge);
      card.appendChild(change);

      if (up.why || up.meaning) {
        const why = paraEl('p', 'upgrade-why');
        if (up.why) why.appendChild(document.createTextNode(up.why));
        if (up.meaning) {
          if (up.why) why.appendChild(document.createTextNode(' · '));
          why.appendChild(paraEl('span', 'muted', I18n.t('levelUp.meaning') + ': ' + up.meaning));
        }
        card.appendChild(why);
      }
      if (up.example) card.appendChild(paraEl('p', 'upgrade-example', up.example));

      const apply = paraEl('button', 'btn btn-subtle btn-xs', I18n.t('levelUp.apply'));
      apply.type = 'button';
      apply.addEventListener('click', function () { applyUpgrade(up); });
      card.appendChild(apply);
      E.paraLevelUp.appendChild(card);
    });

    // Ask the dictionary in the background; the AI suggestion is still shown
    // immediately, with a ! when neither provider can answer.
    if (window.Dict && !q.paraDictChecked) {
      q.paraDictChecked = true;
      list.forEach(function (up) { up.dict = { status: 'pending' }; });
      Dict.verifyUpgrades(list, settings.targetLang).then(function (checked) {
        checked.forEach(function (up, i) { if (list[i]) list[i].dict = up.dict; });
        fb.upgrades = list;
        if (currentQuestion() === q) renderLevelUp(fb, q);
      }).catch(function () {
        list.forEach(function (up) {
          if (!up.dict || up.dict.status === 'pending') up.dict = { status: 'unavailable' };
        });
        if (currentQuestion() === q) renderLevelUp(fb, q);
      });
    }
  }

  /* ---------- Shadowing ---------- */
  const SHADOW_MAX_MS = 45000;
  let shadowPlayback = null;

  function stopShadowPlayback() {
    if (!shadowPlayback) return;
    const p = shadowPlayback;
    shadowPlayback = null;
    try { p.el.pause(); } catch (e) { /* ignore */ }
    p.el.onended = null;
    p.el.onerror = null;
    try { URL.revokeObjectURL(p.url); } catch (e) { /* ignore */ }
  }

  function playShadowBlob(blob, label) {
    stopShadowPlayback();
    let url;
    try { url = URL.createObjectURL(blob); } catch (e) { U.toast(label, 'bad'); return; }
    const el = new Audio(url);
    shadowPlayback = { el: el, url: url };
    el.onended = stopShadowPlayback;
    el.onerror = function () {
      stopShadowPlayback();
      U.toast(label, 'bad');
    };
    el.play().catch(function () {
      if (shadowPlayback && shadowPlayback.el === el) stopShadowPlayback();
      U.toast(label, 'warn');
    });
  }

  function shadowSeconds(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
  }

  function shadowStatus(text, kind) {
    E.shRecordStatus.textContent = text || '';
    const tone = kind === 'bad' ? ' bad-text' : kind === 'warn' ? ' warn-text' : '';
    E.shRecordStatus.className = 'muted small' + tone;
  }

  function shadowTranslationToggle(show) {
    const hidden = !show;
    E.shTranslation.hidden = hidden;
    E.btnShadowTranslate.textContent = hidden ? '👁 Show translation' : '🙈 Hide translation';
  }

  function shadowCurrent() {
    return state.shadowing && state.shadowing.current;
  }

  function stopShadowTracks(target) {
    const s = target || state.shadowing;
    if (!s) return;
    if (s.stream) {
      s.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* ignore */ } });
      s.stream = null;
    }
    if (s.timer) { clearInterval(s.timer); s.timer = null; }
  }

  function discardShadowRecording() {
    const s = state.shadowing;
    if (!s) return;
    stopShadowPlayback();
    const current = s.current;
    if (current && current.url) {
      try { URL.revokeObjectURL(current.url); } catch (e) { /* ignore */ }
    }
    s.current = null;
    s.recorder = null;
    E.btnShadowReplay.hidden = true;
    E.btnShadowSave.hidden = true;
    E.btnShadowDelete.hidden = true;
    E.shAudioMeta.hidden = true;
    E.btnShadowAssess.disabled = true;
    E.btnShadowRecord.hidden = false;
    E.btnShadowRecord.disabled = false;
    E.btnShadowStop.hidden = true;
    E.shTimer.textContent = '0:00';
  }

  function resetShadowResult() {
    E.shResult.hidden = true;
    E.shWords.innerHTML = '';
    E.shTips.innerHTML = '';
    E.shScoreBig.textContent = '0';
    if (E.shScoreBig.parentElement) E.shScoreBig.parentElement.className = 'sh-score';
    E.shVerdict.textContent = '';
    E.shRecognized.textContent = '';
    E.shAccuracy.textContent = '–';
    E.shFluency.textContent = '–';
    E.shCompleteness.textContent = '–';
  }

  async function startShadowingPractice() {
    if (!state.deck) { U.toast('Load a vocabulary deck first.', 'warn'); return; }
    setPracticeMode('shadowing');
    const setup = readSetup();
    if (!aiReady()) {
      const msg = 'Shadowing needs AI to write the paragraph — open Settings → AI and use the free model (no key), or paste your own key.';
      U.toast(msg, 'warn');
      showAiIssue(msg);
      return;
    }
    const available = selectedWords();
    if (!available.length) { U.toast('Select at least one topic.', 'warn'); return; }
    let paraWords = available;
    if (paraWords.length < 6) {
      const all = allWords();
      if (all.length >= 6) paraWords = all;
    }
    const items = Quiz.planParagraphs(paraWords, 1, 'fr2vi');
    if (!items.length) {
      U.toast('Add at least 6 words to the selected topic to write a shadowing paragraph.', 'warn');
      return;
    }
    const pool = paraWords.length >= 4 ? paraWords : allWords();
    state.controller = new AbortController();
    showOverlay('Writing a shadowing paragraph…',
      aiMode() === 'simple'
        ? 'Asking the free AI for a short ' + targetLangName() + ' text…'
        : 'Asking the AI for a short ' + targetLangName() + ' text…');
    try {
      const result = await Quiz.buildPool({
        items: items,
        pool: pool,
        source: 'ai',
        aiProvider: activeProvider(),
        aiBaseUrl: activeBase(),
        aiKey: activeKey(),
        aiKeyless: aiKeyless(),
        aiModel: activeModel(),
        difficulty: setup.difficulty,
        requirement: setup.requirement,
        targetLang: settings.targetLang,
        meaningLang: 'Vietnamese',
        onProgress: overlayProgress,
        signal: state.controller.signal
      });
      if (!result.questions.length) {
        const why = result.aiError;
        throw Object.assign(new Error('No paragraph'), {
          friendly: why
            ? 'Shadowing could not be generated — ' + (why.friendly || 'the AI reply was unusable.')
            : 'Could not generate a shadowing paragraph from these words.'
        });
      }
      const q = result.questions[0];
      const sentences = Speech.splitSentences(q.prompt);
      if (!sentences.length) throw new Error('The AI paragraph had no usable sentences.');
      if (state.shadowing) exitShadowing(true);
      state.shadowing = {
        paragraph: q.prompt,
        reference: q.reference || '',
        sentences: sentences,
        index: 0,
        results: [],
        startedAt: Date.now(),
        current: null,
        recorder: null,
        stream: null,
        chunks: [],
        timer: null,
        recordingStarted: 0,
        assessing: false,
        requestingMic: false
      };
      if (result.aiError) {
        const err = result.aiError;
        const detail = err.friendly || err.message || 'Some paragraph text could not be generated.';
        showAiIssue(err.detail || detail);
        U.toast(detail, 'warn', 12000);
      } else {
        showAiIssue('');
      }
      updateUsageUI();
      showScreen('shadowing');
      renderShadowSentence();
    } catch (e) {
      if (e && e.name === 'AbortError') U.toast('Generation cancelled.', 'warn');
      else {
        const msg = e.friendly || e.message || 'Could not write a shadowing paragraph.';
        showAiIssue(e.detail || msg);
        U.toast(msg, 'bad', 12000);
      }
    } finally {
      state.controller = null;
      hideOverlay();
    }
  }

  /** Keep the scoring hint, engine pill and button in step with the settings. */
  function syncShadowScoreUI() {
    const s = state.shadowing;
    const engine = scoreEngine();
    if (E.shEnginePill) {
      E.shEnginePill.textContent = engine === 'azure' ? 'Azure score' : engine === 'gemini' ? 'Gemini estimate' : 'Recording only';
      E.shEnginePill.className = 'pill ' + (engine === 'azure' ? 'pill-accent' : 'pill-muted');
    }
    if (E.shAssessHint) {
      E.shAssessHint.textContent = engine === 'azure'
        ? 'Azure returns real word-level scores for this sentence and uses your Azure speech-to-text allowance.'
        : engine === 'gemini'
          ? 'Gemini listens to the recording and estimates your pronunciation. This does not use Azure speech hours.'
          : 'Scoring needs a key. ' + scoreSetupHint() + ' You can still record and replay.';
      E.shAssessHint.classList.toggle('warn-text', engine === 'none');
    }
    if (E.btnShadowAssess && !(s && s.assessing)) {
      E.btnShadowAssess.disabled = !(shadowCurrent() && engine !== 'none');
    }
  }

  function renderShadowSentence() {
    const s = state.shadowing;
    if (!s) return;
    discardShadowRecording();
    resetShadowResult();
    E.shadowSummary.hidden = true;
    E.shadowCard.hidden = false;
    E.shadowSavedPanel.hidden = true;
    const text = s.sentences[s.index];
    E.shSentence.textContent = text;
    E.shTranslation.textContent = s.reference || 'No translation was returned for this paragraph.';
    shadowTranslationToggle(false);
    E.shProgressText.textContent = 'Sentence ' + (s.index + 1) + ' of ' + s.sentences.length;
    E.shProgressBar.style.width = Math.round((s.index / s.sentences.length) * 100) + '%';
    E.btnShadowListen.disabled = false;
    E.btnShadowAssess.textContent = 'Check pronunciation';
    E.btnShadowNext.textContent = s.index === s.sentences.length - 1 ? 'Finish shadowing' : 'Next sentence';
    shadowStatus('Ready to record. Listen first, then record the same sentence.');
    syncShadowScoreUI();
    updateShadowSavedCount();
  }

  async function startShadowRecording() {
    const s = state.shadowing;
    if (!s || s.recording || s.assessing || s.requestingMic) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      U.toast('This browser cannot record audio. A current Chrome, Firefox, Edge or Safari can.', 'bad', 12000);
      return;
    }
    discardShadowRecording();
    resetShadowResult();
    s.chunks = [];
    s.requestingMic = true;
    E.btnShadowRecord.disabled = true;
    shadowStatus('Requesting the microphone…');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (e) {
      s.requestingMic = false;
      if (state.shadowing !== s) return;
      E.btnShadowRecord.disabled = false;
      shadowStatus('Microphone permission was denied.', 'bad');
      U.toast('Microphone permission was denied. Allow it in the browser, then press Record again.', 'bad', 12000);
      return;
    }
    if (state.shadowing !== s) {
      stream.getTracks().forEach(function (t) { try { t.stop(); } catch (ignore) { /* ignore */ } });
      s.requestingMic = false;
      return;
    }
    s.requestingMic = false;
    const mime = Speech.pickMime();
    let recorder;
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) {
      stream.getTracks().forEach(function (t) { try { t.stop(); } catch (ignore) { /* ignore */ } });
      E.btnShadowRecord.disabled = false;
      shadowStatus('This browser could not start the recorder.', 'bad');
      U.toast('This browser could not start the recorder. Try Chrome, Firefox or Edge.', 'bad', 10000);
      return;
    }
    s.stream = stream;
    s.recorder = recorder;
    s.recording = true;
    s.recordingStarted = Date.now();
    recorder.ondataavailable = function (e) {
      if (state.shadowing === s && e.data && e.data.size) s.chunks.push(e.data);
    };
    recorder.onstop = function () {
      stopShadowTracks(s);
      finishShadowRecording(s);
    };
    recorder.onerror = function (e) {
      if (state.shadowing !== s) return;
      shadowStatus('Recording failed.', 'bad');
      U.toast('Recording failed: ' + ((e && e.error && e.error.message) || 'unknown error'), 'bad', 10000);
      stopShadowTracks(s);
      s.recording = false;
      E.btnShadowRecord.hidden = false;
      E.btnShadowRecord.disabled = false;
      E.btnShadowStop.hidden = true;
    };
    E.btnShadowRecord.hidden = true;
    E.btnShadowStop.hidden = false;
    E.btnShadowListen.disabled = true;
    shadowStatus('Recording… speak the sentence');
    s.timer = setInterval(function () {
      const elapsed = Date.now() - s.recordingStarted;
      E.shTimer.textContent = shadowSeconds(elapsed);
      if (elapsed >= SHADOW_MAX_MS && s.recorder && s.recorder.state === 'recording') {
        U.toast('Recording stopped at the 45-second limit.', 'warn', 6000);
        stopShadowRecording();
      }
    }, 200);
    try { recorder.start(250); }
    catch (e) {
      stopShadowTracks(s);
      s.recorder = null;
      s.recording = false;
      E.btnShadowRecord.hidden = false;
      E.btnShadowRecord.disabled = false;
      E.btnShadowStop.hidden = true;
      E.btnShadowListen.disabled = false;
      shadowStatus('Could not start recording.', 'bad');
    }
  }

  function stopShadowRecording() {
    const s = state.shadowing;
    if (!s || !s.recorder) return;
    if (s.recorder.state === 'recording') {
      try { s.recorder.stop(); } catch (e) { /* ignore */ }
    }
    stopShadowTracks();
    s.recording = false;
    E.btnShadowStop.hidden = true;
    E.btnShadowRecord.hidden = false;
    E.btnShadowRecord.disabled = true;
    shadowStatus('Preparing your recording…');
  }

  function finishShadowRecording(expected) {
    const s = state.shadowing;
    if (!s || (expected && s !== expected)) return;
    s.recording = false;
    E.btnShadowListen.disabled = false;
    const mime = (s.recorder && s.recorder.mimeType) || 'audio/webm';
    const blob = new Blob(s.chunks, { type: mime });
    s.chunks = [];
    s.recorder = null;
    if (!blob.size) {
      E.btnShadowRecord.hidden = false;
      E.btnShadowRecord.disabled = false;
      shadowStatus('Nothing was recorded. Try again.', 'warn');
      return;
    }
    const url = URL.createObjectURL(blob);
    s.current = { blob: blob, url: url, mime: mime, saved: false, id: null, score: null, assessed: null };
    E.btnShadowRecord.hidden = false;
    E.btnShadowRecord.disabled = false;
    E.btnShadowStop.hidden = true;
    E.btnShadowReplay.hidden = false;
    E.btnShadowSave.hidden = false;
    E.btnShadowSave.disabled = false;
    E.btnShadowSave.textContent = '💾 Save';
    E.btnShadowDelete.hidden = false;
    E.btnShadowAssess.disabled = !scoreReady();
    E.btnShadowAssess.textContent = 'Check pronunciation';
    E.shAudioMeta.hidden = false;
    E.shAudioMeta.textContent = 'Not saved — this recording is deleted when you leave, move on, or record again.';
    shadowStatus('Recorded. Replay it, save it, or check your pronunciation.');
  }

  function replayShadowRecording() {
    const current = shadowCurrent();
    if (!current) return;
    Speech.stop();
    playShadowBlob(current.blob, 'The browser could not play this recording.');
  }

  async function saveShadowRecording(quiet) {
    const s = state.shadowing;
    const current = shadowCurrent();
    if (!s || !current) return;
    try {
      current.id = current.id || U.uid();
      current.createdAt = current.createdAt || Date.now();
      await Speech.saveRecording({
        id: current.id,
        blob: current.blob,
        mime: current.mime,
        reference: s.sentences[s.index],
        translation: s.reference,
        lang: settings.targetCode,
        score: current.score,
        recognized: current.assessed ? current.assessed.recognized : '',
        createdAt: current.createdAt
      });
      if (current.deleted) {
        try { await Speech.deleteRecording(current.id); } catch (e) { /* ignore */ }
        return;
      }
      current.saved = true;
      E.shAudioMeta.textContent = 'Saved on this device. This recording stays until you delete it.';
      E.btnShadowSave.textContent = '💾 Saved';
      E.btnShadowSave.disabled = true;
      updateShadowSavedCount();
      if (!quiet) U.toast('Recording saved on this device.', 'ok');
    } catch (e) {
      U.toast(e.message || 'Could not save the recording.', 'bad', 10000);
    }
  }

  async function deleteShadowRecording() {
    const s = state.shadowing;
    const current = shadowCurrent();
    if (!s || !current) return;
    if (s.assessing) { U.toast('Wait for the score before deleting this recording.', 'warn'); return; }
    current.deleted = true;
    if (current.saved && current.id) {
      try { await Speech.deleteRecording(current.id); }
      catch (e) {
        U.toast('The recording was removed here but could not be deleted from browser storage.', 'bad', 10000);
      }
    }
    discardShadowRecording();
    shadowStatus('Recording deleted. Ready to record again.');
    updateShadowSavedCount();
  }

  function shadowLocalTips(res) {
    const words = (res.words || []).filter(function (w) {
      return (w.accuracy != null && w.accuracy < 75) || /Mispronunciation|Omission/i.test(w.errorType || '');
    }).map(function (w) { return w.word; }).filter(Boolean);
    const bits = [];
    if (words.length) bits.push('Focus on: ' + words.slice(0, 4).join(', ') + '.');
    if (res.completeness < 85) bits.push('Say the whole sentence without skipping words.');
    else if (res.fluency < 75) bits.push('Read in a steady rhythm and avoid long pauses.');
    else if (res.accuracy < 80) bits.push('Slow down on the highlighted words and repeat them.');
    else bits.push('Good clarity — try it once more at a natural speed.');
    return bits.join(' ');
  }

  /** Convert the recording and let Gemini listen to it. No Azure minutes used. */
  async function geminiAssessBlob(blob, reference) {
    let wav;
    try { wav = await Speech.blobToWav(blob); }
    catch (e) { throw new Error('Could not prepare the recording for scoring: ' + (e.message || e)); }
    const audio = await Speech.blobToBase64(wav);
    return Ai.assessSpeech({
      key: settings.geminiKey,
      model: settings.geminiModel || 'gemini-flash-latest',
      audio: audio,
      mimeType: 'audio/wav',
      reference: reference,
      lang: settings.targetCode
    });
  }

  async function assessShadowRecording() {
    const s = state.shadowing;
    const current = shadowCurrent();
    if (!s || !current || s.assessing) return;
    const engine = scoreEngine();
    if (engine === 'none') {
      U.toast('Scoring needs a free Gemini key in Settings → AI, or an Azure Speech key in Settings → Speech.', 'warn', 10000);
      openSettings('ai');
      return;
    }
    const assessedIndex = s.index;
    stopShadowPlayback();
    s.assessing = true;
    E.btnShadowAssess.disabled = true;
    E.btnShadowAssess.textContent = engine === 'azure' ? 'Checking with Azure…' : 'Asking Gemini…';
    shadowStatus(engine === 'azure'
      ? 'Sending the recording to Azure for scoring…'
      : 'Sending the recording to Gemini for an AI estimate…');
    let res;
    try {
      res = engine === 'azure'
        ? await Speech.assess(current.blob, s.sentences[assessedIndex], settings.targetCode)
        : await geminiAssessBlob(current.blob, s.sentences[assessedIndex]);
    } catch (e) {
      s.assessing = false;
      if (state.shadowing !== s) return;
      const msg = (e && (e.friendly || e.message)) || 'The recording could not be scored.';
      E.btnShadowAssess.disabled = false;
      E.btnShadowAssess.textContent = 'Try scoring again';
      shadowStatus(msg, 'bad');
      U.toast(msg.split('\n')[0], 'bad', 12000);
      return;
    }
    if (state.shadowing !== s) return;
    if (s.index !== assessedIndex || s.current !== current) {
      s.assessing = false;
      return;
    }
    const source = engine === 'azure' ? 'azure' : 'gemini';
    current.assessed = res;
    current.score = res.score;
    s.results[s.index] = {
      score: res.score, accuracy: res.accuracy, fluency: res.fluency,
      completeness: res.completeness, source: source, at: Date.now()
    };
    E.shScoreBig.textContent = String(res.score);
    if (E.shScoreBig.parentElement) {
      E.shScoreBig.parentElement.className = 'sh-score' +
        (res.score < 55 ? ' bad' : res.score < 75 ? ' warn' : '');
    }
    if (E.shScoreSource) {
      E.shScoreSource.textContent = source === 'azure' ? 'Azure score' : 'AI estimate — not a real test';
      E.shScoreSource.className = 'pill ' + (source === 'azure' ? 'pill-ok' : 'pill-muted');
      E.shScoreSource.title = source === 'azure'
        ? 'Word-level pronunciation assessment from Azure Speech.'
        : 'Gemini listened to the recording and estimated these scores. They are guidance, not a certified test.';
    }
    E.shVerdict.textContent = res.score >= 90 ? 'Excellent — very clear.'
      : res.score >= 75 ? 'Good — a few sounds to polish.'
        : res.score >= 55 ? 'Getting there — slow down and repeat the weak words.'
          : 'Keep practising — listen once more, then try again.';
    E.shRecognized.textContent = 'Heard: “' + res.recognized + '”';
    E.shAccuracy.textContent = String(res.accuracy);
    E.shFluency.textContent = String(res.fluency);
    E.shCompleteness.textContent = String(res.completeness);
    E.shWords.innerHTML = '';
    (res.words || []).forEach(function (w) {
      const chip = document.createElement('span');
      const bad = (w.accuracy != null && w.accuracy < 75) || /Mispronunciation|Omission/i.test(w.errorType || '');
      chip.className = 'sh-word' + (bad ? ' bad' : ' ok');
      chip.textContent = w.word + (w.accuracy == null ? '' : ' · ' + w.accuracy);
      chip.title = w.errorType || (w.accuracy != null ? 'Accuracy ' + w.accuracy : '');
      E.shWords.appendChild(chip);
    });
    E.shTips.textContent = res.tips || shadowLocalTips(res);
    E.shResult.hidden = false;
    s.assessing = false;
    E.btnShadowAssess.disabled = false;
    E.btnShadowAssess.textContent = 'Check pronunciation';
    shadowStatus('Scored by ' + (source === 'azure' ? 'Azure' : 'Gemini (AI estimate)') + '. Replay, record again, or continue.');
    E.btnShadowNext.focus();
    if (current.saved) saveShadowRecording(true);
    // Gemini already returned its own advice, so only Azure needs the extra
    // coaching call. Either way, the local tips above are the fallback.
    if (source === 'azure') {
      try {
        const worst = (res.words || []).filter(function (w) { return w.accuracy != null && w.accuracy < 85; })
          .slice(0, 5).map(function (w) { return w.word + ' (' + w.accuracy + ')'; }).join(', ');
        const ai = await askTutor(
          'The learner shadowed this ' + targetLangName() + ' sentence:\n“' + s.sentences[s.index] + '”\n\n' +
          'Azure Pronunciation Assessment returned:\n' +
          'Overall ' + res.score + '/100, accuracy ' + res.accuracy + ', fluency ' + res.fluency +
          ', completeness ' + res.completeness + '.\n' +
          'Heard as: “' + res.recognized + '”\n' +
          'Words needing work: ' + (worst || 'none clearly below 85') + '.\n\n' +
          'Give 2 short, concrete pieces of pronunciation advice in English. Mention at most three words. ' +
          'Do not rescore and do not use markdown.',
          { system: 'You are VocabLab’s concise ' + targetLangName() + ' pronunciation coach. You explain Azure Speech scores and give actionable practice tips. Be encouraging and specific.', maxTokens: 220 }
        );
        if (ai && ai.text && state.shadowing === s && s.index === assessedIndex && s.current === current) {
          E.shTips.textContent = ai.text.trim();
        }
      } catch (e) { /* local tips already shown */ }
    }
  }

  function shadowNextSentence() {
    const s = state.shadowing;
    if (!s) return;
    if (s.current) questEvent('shadow3', 1);
    if (s.index >= s.sentences.length - 1) {
      showShadowSummary();
      return;
    }
    discardShadowRecording();
    s.index += 1;
    renderShadowSentence();
  }

  function showShadowSummary() {
    const s = state.shadowing;
    if (!s) return;
    discardShadowRecording();
    E.shadowCard.hidden = true;
    E.shadowSavedPanel.hidden = true;
    E.shadowSummary.hidden = false;
    const scored = s.results.filter(function (r) { return r && r.score != null; });
    const avg = scored.length
      ? Math.round(scored.reduce(function (sum, r) { return sum + r.score; }, 0) / scored.length) : null;
    E.shSummaryAvg.textContent = avg == null ? '–' : avg + '/100';
    E.shSummaryCount.textContent = String(scored.length);
    E.shSummaryText.textContent = scored.length
      ? 'You scored ' + scored.length + ' sentence' + (scored.length === 1 ? '' : 's') + '. Saved recordings stay in this browser — open “Saved” to play them. Unsaved recordings are deleted when you record again or leave.'
      : 'No sentences were scored this time. ' + scoreSetupHint() + ' Scoring is optional — you can still record and replay.';
    E.shSummaryList.innerHTML = '';
    s.sentences.forEach(function (sentence, i) {
      const r = s.results[i];
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.className = 'saved-text';
      text.textContent = sentence;
      const score = document.createElement('span');
      score.className = 'pill ' + (r && r.score >= 80 ? 'pill-ok' : 'pill-muted');
      score.textContent = r && r.score != null ? r.score + '/100' : 'not scored';
      li.appendChild(text);
      li.appendChild(score);
      E.shSummaryList.appendChild(li);
    });
    updateShadowSavedCount();
  }

  async function updateShadowSavedCount() {
    if (!E.shSavedCount) return;
    try { E.shSavedCount.textContent = String(await Speech.countRecordings()); }
    catch (e) { E.shSavedCount.textContent = '0'; }
  }

  async function openShadowSaved() {
    if (!E.shadowSavedPanel.hidden) return;
    if (state.shadowing && (state.shadowing.recording || state.shadowing.assessing || state.shadowing.requestingMic)) {
      U.toast('Finish the recording or scoring first.', 'warn');
      return;
    }
    if (state.screen !== 'shadowing') showScreen('shadowing');
    if (state.shadowing) {
      state.shadowing.savedReturn = !E.shadowSummary.hidden ? 'summary' : 'card';
    }
    stopShadowPlayback();
    E.shadowSavedPanel.hidden = false;
    E.shadowCard.hidden = true;
    E.shadowSummary.hidden = true;
    E.shSavedList.innerHTML = '<li class="muted small">Loading…</li>';
    try {
      const list = await Speech.listRecordings();
      E.shSavedList.innerHTML = '';
      if (!list.length) {
        E.shSavedList.innerHTML = '<li class="muted small">No saved recordings yet. Press Save after a recording.</li>';
        return;
      }
      list.forEach(function (r) {
        const li = document.createElement('li');
        li.className = 'saved-item';
        const info = document.createElement('div');
        info.className = 'saved-info';
        const text = document.createElement('span');
        text.className = 'saved-text';
        text.textContent = r.reference || 'Recording';
        const meta = document.createElement('span');
        meta.className = 'muted tiny';
        meta.textContent = new Date(r.createdAt || Date.now()).toLocaleString() +
          (r.score != null ? ' · ' + r.score + '/100' : '') +
          (r.size ? ' · ' + Math.max(1, Math.round(r.size / 1024)) + ' KB' : '');
        info.appendChild(text);
        info.appendChild(meta);
        const play = document.createElement('button');
        play.type = 'button';
        play.className = 'btn btn-ghost btn-sm';
        play.textContent = '▶ Play';
        play.addEventListener('click', async function () {
          try {
            const full = await Speech.getRecording(r.id);
            if (!full || !full.blob) return;
            Speech.stop();
            playShadowBlob(full.blob, 'Could not play this saved recording.');
          } catch (e) { U.toast('Could not play this saved recording.', 'bad'); }
        });
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn btn-ghost btn-sm';
        del.textContent = 'Delete';
        del.addEventListener('click', async function () {
          try {
            await Speech.deleteRecording(r.id);
            li.remove();
            updateShadowSavedCount();
            if (!E.shSavedList.querySelector('.saved-item')) {
              E.shSavedList.innerHTML = '<li class="muted small">No saved recordings yet. Press Save after a recording.</li>';
            }
            U.toast('Recording deleted.', 'ok');
          } catch (e) { U.toast('Could not delete the recording.', 'bad'); }
        });
        li.appendChild(info);
        li.appendChild(play);
        li.appendChild(del);
        E.shSavedList.appendChild(li);
      });
    } catch (e) {
      E.shSavedList.innerHTML = '<li class="muted small">Saved recordings are unavailable in this browser.</li>';
    }
  }

  function exitShadowing(silent) {
    const s = state.shadowing;
    if (s && s.recorder && s.recorder.state !== 'inactive') {
      try { s.recorder.stop(); } catch (e) { /* ignore */ }
    }
    stopShadowTracks();
    if (s) discardShadowRecording();
    state.shadowing = null;
    if (!silent) showScreen('welcome');
  }

  /* ---------- Results ---------- */
  function showResults() {
    const s = state.session;
    if (!s) { showScreen('welcome'); return; }
    const total = s.answers.length;
    const correct = s.answers.filter(function (a) { return a.correct; }).length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const paraOnly = !!s.paragraphOnly;

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

    E.resTitle.textContent = paraOnly
      ? (pct >= 90 ? 'Excellent translation! 🎉' : pct >= 70 ? 'Translation complete!' : pct >= 50 ? 'Good effort' : 'Keep practising')
      : (pct >= 90 ? 'Outstanding! 🎉' : pct >= 70 ? 'Nice work!' : pct >= 50 ? 'Good effort' : 'Keep practising');
    const elapsed = Date.now() - s.startedAt;
    E.resMeta.textContent = correct + ' of ' + total +
      (paraOnly ? (total === 1 ? ' paragraph passed' : ' paragraphs passed') : ' correct') +
      ' · ' + U.formatDuration(elapsed) +
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
      if (a.question.type === 'paragraph') return; // one essay is not a word to review
      const key = Quiz.masteryKey(a.question.word);
      if (!byWord[key]) byWord[key] = { word: a.question.word, count: 0 };
      byWord[key].count += 1;
    });
    const mistakes = Object.keys(byWord).map(function (k) { return byWord[k]; });
    E.resMistakes.hidden = paraOnly || !mistakes.length;
    E.resMistakeList.innerHTML = mistakes.map(function (m) {
      return '<li class="mistake-row"><span class="mistake-term">' + U.esc(m.word.term) + '</span>' +
        '<span class="mistake-meaning">' + U.esc(m.word.meaning) + '</span>' +
        '<button class="icon-btn icon-btn-sm speak-btn" data-term="' + U.esc(m.word.term) + '" title="Listen">🔊</button>' +
        '<span class="mistake-count">×' + m.count + '</span></li>';
    }).join('');
    E.resMistakeList.querySelectorAll('.speak-btn').forEach(function (b) {
      b.addEventListener('click', function () { U.speak(b.getAttribute('data-term'), settings.targetCode); });
    });
    E.btnRetryMistakes.hidden = paraOnly || !mistakes.length;
    E.btnRetryMistakes.onclick = function () {
      startQuiz({ words: mistakes.map(function (m) { return m.word; }) });
    };
    E.btnNewQuiz.textContent = paraOnly ? 'New paragraph' : 'New quiz';
    E.btnResultsFlashcards.hidden = paraOnly;

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
    questEvent('cards20', 1);
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
    // A value saved before this became a list (or typed by hand) still shows.
    const targetLang = settings.targetLang || 'English';
    if (!Array.from(E.inpTargetLang.options).some(function (o) { return o.value === targetLang; })) {
      const custom = document.createElement('option');
      custom.value = targetLang;
      custom.textContent = targetLang;
      E.inpTargetLang.appendChild(custom);
    }
    E.inpTargetLang.value = targetLang;
    E.inpTargetCode.value = settings.targetCode || 'en-US';
    E.inpSheetUrl.value = settings.sheetUrl || '';
    E.inpSheetApiKey.value = settings.sheetApiKey || '';
    E.inpScriptUrl.value = settings.scriptUrl || '';
    E.inpLinks.value = settings.links || '';
    E.typeMc.checked = settings.quizTypes.indexOf('mc') !== -1;
    E.typeBlank.checked = settings.quizTypes.indexOf('blank') !== -1;
    E.typeTranslate.checked = settings.quizTypes.indexOf('translate') !== -1;
    E.selPractice.value = ['paragraph', 'shadowing'].indexOf(settings.practiceMode) !== -1
      ? settings.practiceMode : 'quiz';
    E.selDirection.value = settings.direction;
    E.selParaDir.value = settings.paragraphDirection || 'both';
    E.selParaCount.value = String(settings.paragraphCount || 1);
    E.selCount.value = String(settings.count);
    E.selSource.value = settings.source;
    E.selDifficulty.value = settings.difficulty === 'easy' || settings.difficulty === 'hard'
      ? settings.difficulty : 'standard';
    E.inpRequirement.value = settings.requirement || '';
    syncSegments();
    updateRequirementUI();
    const mode = settings.sheetMode || 'api';
    U.$$('input[name="sheetMode"]').forEach(function (r) { r.checked = r.value === mode; });
    syncModePanes(mode);
    syncAiUI();
    syncSpeechUI();
    updateUsageUI();
    updateDataInfo();
    updateControls();
  }

  function syncSpeechUI() {
    if (!E.inpAzureKey) return;
    E.inpAzureKey.value = settings.azureKey || '';
    E.inpAzureRegion.value = settings.azureRegion || 'southeastasia';
    E.selAzureVoice.value = settings.azureVoice || 'fr-FR-DeniseNeural';
    E.chkCloudVoice.checked = settings.cloudVoice !== false;
    const learnLang = targetLangName();
    if (E.browserVoiceLabel) E.browserVoiceLabel.textContent = I18n.t('voice.deviceLabel', { lang: learnLang });
    if (E.browserVoiceIntro) E.browserVoiceIntro.textContent = I18n.t('voice.deviceIntro', { lang: learnLang });
    if (E.azureVoiceIntro) E.azureVoiceIntro.innerHTML = I18n.t('voice.azureIntro', { lang: learnLang });
    if (E.speechLimitNote) E.speechLimitNote.textContent = I18n.t('voice.limitNote', { lang: learnLang });
    // The listed Azure voices are French; Azure picks a native voice for any
    // other language from the speech code, so hide the French picker there.
    const frenchTarget = targetLangRoot() === 'fr';
    if (E.azureVoiceField) E.azureVoiceField.hidden = !frenchTarget;
    if (E.azureVoiceNote) {
      E.azureVoiceNote.hidden = frenchTarget;
      E.azureVoiceNote.textContent = 'Azure picks a native ' + targetLangName() + ' voice automatically.';
    }
    populateBrowserVoices();
    E.speechStatus.textContent = speechReady()
      ? 'Azure is configured. Use “Test Azure voice” to verify the key and region.'
      : 'No Azure key yet — speaker icons use your browser voices.';
    if (E.selScoreEngine) E.selScoreEngine.value = settings.scoreEngine || 'auto';
    if (E.scoreStatus) {
      const engine = scoreEngine();
      const gemini = geminiScoreReady();
      E.scoreStatus.textContent = engine === 'gemini'
        ? (gemini
          ? 'Scoring uses Gemini (‘' + (settings.geminiModel || 'gemini-flash-latest') + '’). Azure speech hours are not used.'
          : 'Gemini scoring is selected, but there is no Gemini key yet. Add one in Settings → AI.')
        : engine === 'azure'
          ? (speechReady()
            ? 'Scoring uses Azure Pronunciation Assessment. Each check spends a few seconds of your 5 free audio hours.'
            : 'Azure scoring is selected, but there is no Azure key yet. Add one above, or switch to Gemini.')
          : 'Recording works now. Add a free Gemini key (Settings → AI) or an Azure key above to get scores.';
    }
  }

  function syncAiUI() {
    const mode = aiMode();
    const id = activeProviderId();
    const transport = activeProvider();
    renderProviderOptions();
    if (E.modeSimple) {
      E.modeSimple.classList.toggle('is-on', mode === 'simple');
      E.modeSimple.setAttribute('aria-pressed', mode === 'simple' ? 'true' : 'false');
    }
    if (E.modeAdvanced) {
      E.modeAdvanced.classList.toggle('is-on', mode === 'advanced');
      E.modeAdvanced.setAttribute('aria-pressed', mode === 'advanced' ? 'true' : 'false');
    }
    if (E.paneSimple) E.paneSimple.hidden = mode !== 'simple';
    if (E.aiAdvanced) E.aiAdvanced.hidden = mode !== 'advanced';
    E.selProvider.value = id;
    if (E.providerHint) E.providerHint.innerHTML = providerHint(id);
    E.paneGemini.hidden = transport !== 'gemini';
    E.paneOai.hidden = transport !== 'openai';
    E.inpGeminiKey.value = settings.geminiKey || '';
    E.inpOaiBase.value = settings.oaiBase || '';
    E.inpOaiKey.value = settings.oaiKey || '';
    if (mode === 'simple') renderSimpleModels();
    const model = activeModel();
    if (mode === 'advanced') {
      ensureModelOption(model);
      E.inpModel.value = model;
      E.btnTestKey.textContent = transport === 'openai' ? 'Test & load models' : 'Test key & load models';
    }
    // A key/provider change decides whether paragraph practice is available.
    updateControls();
  }

  /** Options for the keyless mode. Cached after a check so opening Settings is offline-safe. */
  function renderSimpleModels() {
    const sel = E.selSimpleModel;
    if (!sel) return;
    const model = simpleModel();
    const saved = Array.isArray(settings.simpleModels) ? settings.simpleModels : [];
    const list = saved.length ? saved.slice() : [{ id: model, label: model }];
    if (!list.some(function (m) { return m && m.id === model; })) list.unshift({ id: model, label: model });
    sel.innerHTML = '';
    list.forEach(function (m) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.id + (m.id === FREE_PROVIDER.model ? ' — free' : '');
      sel.appendChild(opt);
    });
    sel.value = model;
  }

  /** Simple (no key) ↔ Advanced (own key). The other mode's setup is kept. */
  function setAiMode(mode) {
    const next = mode === 'advanced' ? 'advanced' : 'simple';
    if (settings.aiMode === next) { syncAiUI(); return; }
    settings.aiMode = next;
    saveSettings();
    syncAiUI();
    showAiIssue('');
    keyShapeShown = '';
    if (next === 'advanced') {
      providerStatus(activeProviderId());
      U.toast('Advanced mode — pick a provider and paste your own key.', 'ok');
    } else {
      E.aiStatus.textContent = 'Free AI selected — no key needed. Press “Check the free AI” to test it.';
      U.toast('Simple mode — free AI, no key needed.', 'ok');
    }
    updateControls();
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
    if (id === 'pollinations') {
      return 'Free and keyless — a shared public service, no sign-up. If it is busy, wait a minute or switch to Advanced with your own key.';
    }
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
    if (aiMode() === 'advanced' && id === activeProviderId()) return;
    // Picking a real provider is an Advanced action (the Simple pane has no
    // provider picker), so it also leaves the keyless mode.
    const fromSimple = aiMode() === 'simple';
    if (fromSimple) settings.aiMode = 'advanced';
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

  async function testSimple() {
    E.aiStatus.textContent = 'Checking the free AI…';
    try {
      const models = await Ai.listModels({ provider: 'openai', key: '', baseUrl: FREE_PROVIDER.base, keyless: true });
      showAiIssue('');
      if (!models.length) {
        E.aiStatus.textContent = 'The free service answered, but listed no chat model. Try a quiz — or switch to Advanced with your own key.';
        return;
      }
      settings.simpleModels = models.map(function (m) { return { id: m.id, label: m.label || m.id }; });
      if (!models.some(function (m) { return m.id === simpleModel(); })) {
        settings.simpleModel = Ai.pickDefaultModel(models, 'openai') || models[0].id;
      }
      saveSettings();
      syncAiUI();
      E.aiStatus.textContent = '✓ Free AI works — ' + models.length + ' model' + (models.length === 1 ? '' : 's') +
        ' available. Using: ' + activeModel() + '. No key needed.';
      U.toast('Free AI works — no key needed. Model: ' + activeModel(), 'ok');
    } catch (e) {
      const detail = e.friendly || e.message;
      E.aiStatus.textContent = '✕ ' + detail;
      showAiIssue(detail);
      U.toast(detail, 'bad', 12000);
    }
  }

  async function testKey() {
    if (aiMode() === 'simple') return testSimple();
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
    parts.push('Browser storage used: ' + (U.lsBytes() / 1024).toFixed(1) + ' KB (localStorage)');
    E.dataInfo.innerHTML = parts.map(U.esc).join('<br>') +
      '<br>Saved shadowing recordings: <span id="dataRecordingCount">…</span>';
    if (window.Speech) {
      Speech.countRecordings().then(function (n) {
        const el = U.$('#dataRecordingCount');
        if (el) el.textContent = String(n);
      }).catch(function () {
        const el = U.$('#dataRecordingCount');
        if (el) el.textContent = 'unavailable';
      });
    }
  }

  function openSettings(tab) {
    syncSettingsUI();
    if (E.inpAzureKey) {
      E.inpAzureKey.type = 'password';
      E.btnToggleAzureKey.textContent = 'Show';
    }
    if (tab) {
      U.$$('.tab-btn', E.settingsDialog).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
      U.$$('.tab-pane', E.settingsDialog).forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pane') === tab); });
    }
    E.settingsDialog.showModal();
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    // Restore sidebar collapsed state
    try {
      if (localStorage.getItem('vocablab.sidebarCollapsed') === '1') {
        document.body.classList.add('sidebar-collapsed');
      }
    } catch (e) {}
    if (E.btnNavToggle) {
      const syncCollapseUi = function () {
        const collapsed = document.body.classList.contains('sidebar-collapsed');
        const title = collapsed ? 'Expand navigation' : 'Collapse navigation';
        [E.btnNavToggle, document.getElementById('btnSidebarToggle')].forEach(function (btn) {
          if (!btn) return;
          btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          btn.setAttribute('title', title);
          btn.setAttribute('aria-label', title);
        });
      };
      const toggleCollapse = function () {
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        try {
          localStorage.setItem('vocablab.sidebarCollapsed', collapsed ? '1' : '0');
        } catch (e) {}
        syncCollapseUi();
      };
      E.btnNavToggle.addEventListener('click', function () {
        const isDesktop = window.matchMedia('(min-width: 921px)').matches;
        if (isDesktop) {
          toggleCollapse();
        } else {
          const open = document.body.classList.toggle('nav-open');
          E.btnNavToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      });
      const btnSidebarToggle = document.getElementById('btnSidebarToggle');
      if (btnSidebarToggle) {
        btnSidebarToggle.addEventListener('click', toggleCollapse);
      }
      // Set initial aria-expanded based on state
      if (window.matchMedia('(min-width: 921px)').matches) syncCollapseUi();
    }
    U.$$('.nav-item').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        if (E.btnNavToggle) E.btnNavToggle.setAttribute('aria-expanded', 'false');
      });
    });
    U.$$('[data-go]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showScreen(btn.getAttribute('data-go') || 'practice');
      });
    });
    if (E.selUiLang) {
      E.selUiLang.addEventListener('change', function () {
        settings.uiLang = I18n.setLang(E.selUiLang.value);
        saveSettings();
        // The grammar screen follows the interface language.
        if (window.Grammar && Grammar.setLang) {
          Grammar.setLang(settings.uiLang === 'vi' ? 'vi' : 'en');
        }
        renderHome();
        updateStudyUI();
        updateStatsUI();
        updateSourceUI();
        updateSelected();
        if (E.settingsDialog && E.settingsDialog.open) syncSettingsUI();
        U.toast(I18n.t('ui.languageChanged'), 'ok');
      });
    }
    if (E.btnOpenHandbook) {
      E.btnOpenHandbook.addEventListener('click', function () { openGrammar(false, 'handbook'); });
    }
    window.addEventListener('hashchange', syncFromHash);
    E.btnHome.addEventListener('click', goHome);
    E.btnTheme.addEventListener('click', toggleTheme);
    E.btnTestVoice.addEventListener('click', testVoice);
    if (E.selBrowserVoice) {
      E.selBrowserVoice.addEventListener('change', function () {
        settings.browserVoice = E.selBrowserVoice.value || '';
        saveSettings();
        populateBrowserVoices();
      });
    }
    if (E.btnTestBrowserVoice) E.btnTestBrowserVoice.addEventListener('click', testBrowserVoice);
    if (E.btnRefreshBrowserVoices) {
      E.btnRefreshBrowserVoices.addEventListener('click', function () {
        if (window.speechSynthesis && window.speechSynthesis.getVoices) window.speechSynthesis.getVoices();
        populateBrowserVoices();
        updateVoiceHint();
        U.toast('Voice list refreshed.', 'ok');
      });
    }
    if (window.speechSynthesis && window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        populateBrowserVoices();
        updateVoiceHint();
      });
    }
    E.btnSettings.addEventListener('click', function () { openSettings('ai'); });
    E.btnChangeSource.addEventListener('click', function () { openSettings('sheet'); });
    E.btnHelp.addEventListener('click', function () { E.helpDialog.showModal(); });
    if (E.btnStudy) E.btnStudy.addEventListener('click', function () { openGrammar(false, 'tenses'); });
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
    ['typeMc', 'typeBlank', 'typeTranslate', 'selDirection', 'selCount', 'selSource',
      'selParaDir', 'selParaCount', 'selDifficulty'].forEach(function (id) {
      E[id].addEventListener('change', function () { readSetup(); updateControls(); });
    });
    if (E.selPractice) {
      E.selPractice.addEventListener('change', function () { setPracticeMode(E.selPractice.value); });
    }

    // Pills drive their hidden selects, so the rest of the app keeps reading .value.
    U.$$('.seg[data-select]').forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        const btn = e.target.closest ? e.target.closest('.seg-btn') : null;
        if (!btn || !seg.contains(btn)) return;
        const sel = U.$('#' + seg.getAttribute('data-select'));
        if (!sel) return;
        sel.value = btn.getAttribute('data-value');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        syncSegments();
      });
    });
    if (E.selDifficulty) E.selDifficulty.addEventListener('change', syncSegments);

    // Optional focus/topic note for AI questions and paragraphs.
    if (E.inpRequirement) {
      E.inpRequirement.addEventListener('input', function () {
        const value = E.inpRequirement.value.slice(0, 600);
        settings.requirement = value;
        saveSettings();
        updateRequirementUI();
      });
    }
    U.$$('#reqChips .req-chip[data-fill]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!E.inpRequirement || E.inpRequirement.disabled) return;
        const fill = btn.getAttribute('data-fill');
        const cur = E.inpRequirement.value.replace(/\s+/g, ' ').trim();
        const next = cur ? cur.replace(/[\s,;.]+$/, '') + ', ' + fill : fill;
        E.inpRequirement.value = next.slice(0, 600);
        settings.requirement = E.inpRequirement.value;
        saveSettings();
        updateRequirementUI();
        E.inpRequirement.focus();
      });
    });
    if (E.btnClearRequirement) {
      E.btnClearRequirement.addEventListener('click', function () {
        if (!E.inpRequirement) return;
        E.inpRequirement.value = '';
        settings.requirement = '';
        saveSettings();
        updateRequirementUI();
        E.inpRequirement.focus();
      });
    }
    E.btnStart.addEventListener('click', function () { startQuiz(); });
    E.btnStartParagraph.addEventListener('click', startParagraphPractice);
    E.btnStartShadowing.addEventListener('click', startShadowingPractice);
    E.btnFlashcards.addEventListener('click', startFlashcards);
    E.btnSubmit.addEventListener('click', function () { submitTyped(false); });
    E.btnDontKnow.addEventListener('click', function () { submitTyped(true); });
    E.btnNext.addEventListener('click', nextQuestion);
    E.btnParaSubmit.addEventListener('click', submitParagraph);
    E.btnParaSkip.addEventListener('click', function () { if (!state.paraBusy) nextQuestion(); });
    E.paraInput.addEventListener('input', function () {
      const n = E.paraInput.value.trim() ? E.paraInput.value.trim().split(/\s+/).length : 0;
      E.paraCount.textContent = n + (n === 1 ? ' word' : ' words');
      syncParaHighlights();
    });
    E.paraInput.addEventListener('scroll', function () {
      if (!E.paraHighlights) return;
      E.paraHighlights.scrollTop = E.paraInput.scrollTop;
    });
    E.paraInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitParagraph(); }
    });
    if (E.tabCorrections) E.tabCorrections.addEventListener('click', function () { setInspectorTab('corrections'); });
    if (E.tabLevelUp) E.tabLevelUp.addEventListener('click', function () { setInspectorTab('level'); });
    E.btnParaSpeak.addEventListener('click', function () {
      const q = currentQuestion();
      if (!q || q.type !== 'paragraph') return;
      U.speak(q.prompt, q.direction === 'fr2vi' ? settings.targetCode : 'vi-VN');
    });
    E.btnShadowListen.addEventListener('click', function () {
      const s = state.shadowing;
      if (!s) return;
      stopShadowPlayback();
      U.speak(s.sentences[s.index], settings.targetCode, parseFloat(E.selShadowSpeed.value) || 0.95);
    });
    E.btnShadowTranslate.addEventListener('click', function () {
      shadowTranslationToggle(E.shTranslation.hidden);
    });
    E.btnShadowRecord.addEventListener('click', startShadowRecording);
    E.btnShadowStop.addEventListener('click', stopShadowRecording);
    E.btnShadowReplay.addEventListener('click', replayShadowRecording);
    E.btnShadowSave.addEventListener('click', function () { saveShadowRecording(false); });
    E.btnShadowDelete.addEventListener('click', deleteShadowRecording);
    E.btnShadowAssess.addEventListener('click', assessShadowRecording);
    E.btnShadowRetry.addEventListener('click', startShadowRecording);
    E.btnShadowNext.addEventListener('click', shadowNextSentence);
    E.btnShadowExit.addEventListener('click', function () { exitShadowing(false); });
    E.btnShadowAgain.addEventListener('click', function () { exitShadowing(true); startShadowingPractice(); });
    E.btnShadowBackSetup.addEventListener('click', function () { exitShadowing(false); });
    E.btnShadowSaved.addEventListener('click', openShadowSaved);
    E.btnShadowSavedSetup.addEventListener('click', openShadowSaved);
    E.btnShadowCloseSaved.addEventListener('click', function () {
      stopShadowPlayback();
      E.shadowSavedPanel.hidden = true;
      if (state.shadowing) {
        if (state.shadowing.savedReturn === 'summary') E.shadowSummary.hidden = false;
        else E.shadowCard.hidden = false;
      } else {
        showScreen('welcome');
      }
    });
    E.btnExitQuiz.addEventListener('click', function () {
      if (state.session && state.session.answers.length) showResults();
      else { state.session = null; showScreen('welcome'); }
    });
    E.btnNewQuiz.addEventListener('click', function () {
      if (state.session && state.session.paragraphOnly) startParagraphPractice();
      else startQuiz();
    });
    E.btnBackSetup.addEventListener('click', function () {
      state.session = null;
      showScreen('welcome');
    });
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
      if (E.scoreStatus) syncSpeechUI();
      updateControls();
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
    if (E.modeSimple) E.modeSimple.addEventListener('click', function () { setAiMode('simple'); });
    if (E.modeAdvanced) E.modeAdvanced.addEventListener('click', function () { setAiMode('advanced'); });
    if (E.btnTestSimple) E.btnTestSimple.addEventListener('click', testKey);
    if (E.selSimpleModel) E.selSimpleModel.addEventListener('change', function () {
      settings.simpleModel = E.selSimpleModel.value;
      saveSettings();
      updateControls();
      U.toast('Free model: ' + settings.simpleModel, 'ok');
    });
    E.inpModel.addEventListener('change', function () { setActiveModel(E.inpModel.value.trim()); });
    E.inpModel.addEventListener('input', function () { setActiveModel(E.inpModel.value.trim()); });
    /** Speech code that belongs to a language in the list ('' when unknown). */
    function defaultCodeFor(name) {
      const option = Array.from(E.inpTargetLang.options).find(function (o) { return o.value === name; });
      return option ? (option.getAttribute('data-code') || '') : '';
    }
    E.inpTargetLang.addEventListener('change', function () {
      const next = E.inpTargetLang.value || 'English';
      const previousCode = defaultCodeFor(settings.targetLang);
      settings.targetLang = next;
      const code = defaultCodeFor(next);
      // Follow the language with its usual code unless the learner typed their
      // own variant (fr-CA, en-GB…), which must survive the switch.
      if (code && (!E.inpTargetCode.value.trim() || E.inpTargetCode.value.trim() === previousCode)) {
        settings.targetCode = code;
        E.inpTargetCode.value = code;
      }
      saveSettings();
      // Voices and the paragraph/label copy follow the chosen language.
      if (window.Speech) syncSpeechUI();
      updateVoiceHint();
      updateControls();
    });
    E.inpTargetCode.addEventListener('change', function () { settings.targetCode = E.inpTargetCode.value.trim() || 'en-US'; saveSettings(); });

    // Settings — Speech tab
    E.inpAzureKey.addEventListener('input', function () {
      settings.azureKey = Ai.normalizeKey(E.inpAzureKey.value);
      saveSettings();
      syncSpeechUI();
      updateControls();
    });
    E.inpAzureKey.addEventListener('change', function () {
      settings.azureKey = Ai.normalizeKey(E.inpAzureKey.value);
      saveSettings();
      syncSpeechUI();
      updateControls();
    });
    E.btnToggleAzureKey.addEventListener('click', function () {
      const show = E.inpAzureKey.type === 'password';
      E.inpAzureKey.type = show ? 'text' : 'password';
      E.btnToggleAzureKey.textContent = show ? 'Hide' : 'Show';
    });
    E.inpAzureRegion.addEventListener('change', function () {
      settings.azureRegion = E.inpAzureRegion.value.trim() || 'southeastasia';
      saveSettings(); syncSpeechUI(); updateControls();
    });
    E.selAzureVoice.addEventListener('change', function () {
      settings.azureVoice = E.selAzureVoice.value || 'fr-FR-DeniseNeural';
      saveSettings(); updateVoiceHint();
    });
    E.chkCloudVoice.addEventListener('change', function () {
      settings.cloudVoice = E.chkCloudVoice.checked;
      saveSettings(); updateVoiceHint(); updateControls();
    });
    if (E.selScoreEngine) {
      E.selScoreEngine.addEventListener('change', function () {
        settings.scoreEngine = E.selScoreEngine.value || 'auto';
        saveSettings();
        syncSpeechUI();
        updateControls();
        // Update the hint on the shadowing screen without dropping a recording.
        if (state.shadowing && !E.screenShadowing.hidden) syncShadowScoreUI();
      });
    }
    if (E.btnScoreAiSettings) {
      E.btnScoreAiSettings.addEventListener('click', function () {
        // The button lives inside the open dialog, so switch tabs instead of
        // calling openSettings() (showModal on an open dialog throws).
        const aiTab = U.$('.tab-btn[data-tab="ai"]', E.settingsDialog);
        if (aiTab) aiTab.click();
      });
    }
    E.btnTestAzure.addEventListener('click', function () {
      if (!Speech.isConfigured()) {
        U.toast('Paste an Azure Speech key and region first.', 'warn');
        return;
      }
      const old = settings.cloudVoice;
      settings.cloudVoice = true;
      Speech.configure(settings);
      E.btnTestAzure.disabled = true;
      E.speechStatus.textContent = 'Contacting Azure…';
      Speech.speak(targetTestPhrase(), settings.targetCode || 'fr-FR', 0.95, {
        noFallback: true,
        onStart: function () {
          E.btnTestAzure.disabled = false;
          settings.cloudVoice = old;
          Speech.configure(settings);
          E.chkCloudVoice.checked = old;
          E.speechStatus.textContent = 'Azure voice is working.';
          U.toast('Azure voice is working.', 'ok');
        },
        onError: function (err) {
          E.btnTestAzure.disabled = false;
          settings.cloudVoice = old;
          Speech.configure(settings);
          E.chkCloudVoice.checked = old;
          E.speechStatus.textContent = (err && err.message) || 'Azure voice failed.';
          U.toast((err && err.message) || 'Azure voice failed.', 'bad', 12000);
        }
      });
    });
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
    E.btnClearRecordings.addEventListener('click', async function () {
      if (!window.confirm('Delete every saved shadowing recording from this browser?')) return;
      try {
        await Speech.clearRecordings();
        updateShadowSavedCount();
        updateDataInfo();
        U.toast('Saved recordings deleted.', 'ok');
      } catch (e) { U.toast(e.message || 'Could not delete the saved recordings.', 'bad'); }
    });
    E.btnClearAll.addEventListener('click', async function () {
      if (!window.confirm('Delete the API keys, cached deck, progress, question cache and saved recordings from this browser?')) return;
      try { await Speech.clearRecordings(); } catch (e) { /* ignore */ }
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
        if (tab === 'speech') syncSpeechUI();
      });
    });
    E.settingsDialog.addEventListener('close', function () {
      updateDataInfo(); updateUsageUI(); updateControls(); updateVoiceHint();
      if (state.shadowing) {
        updateShadowSavedCount();
        syncShadowScoreUI();
      }
    });

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
        if (q.type === 'paragraph') {
          // Enter belongs to the textarea; Ctrl/⌘ + Enter checks, as the card says.
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !state.answered) {
            e.preventDefault();
            submitParagraph();
          }
          return;
        }
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

    // Text we build in JS is not covered by data-i18n, so refresh it on a language change.
    document.addEventListener('vocablab:language', function () {
      renderPracticeTopics();
      updateSelected();
      if (window.Speech) syncSpeechUI();
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    cacheEls();
    placeClassFile = buildRouteShell();
    if (window.I18n) {
      settings.uiLang = I18n.setLang(settings.uiLang || 'en');
      if (E.selUiLang) E.selUiLang.value = settings.uiLang;
    }
    applyTheme();
    U.setBrowserVoice(settings.browserVoice);
    if (window.Speech) Speech.configure(settings);
    U.initVoices();
    updateVoiceHint();
    if (window.Grammar) {
      Grammar.init({
        screen: E.screenGrammar,
        askTutor: askTutor,
        isAiReady: aiReady,
        openSettings: function () { openSettings('ai'); },
        onProgress: updateStudyUI,
        onChapterDone: function () { questEvent('grammar1', 1); },
        onExit: function () { showScreen('lessons'); }
      });
    }
    // Name a provider saved before the list existed, and remember its connection
    // so switching providers can bring it back later.
    migrateProvider();
    normalizeStoredKeys();
    rememberConn();
    syncSettingsUI();
    bindEvents();
    bindAuthEvents();
    if (E.fileWarn) E.fileWarn.hidden = window.location.protocol !== 'file:';
    updateDataInfo();
    updateStudyUI();
    initAuth();
  }

  /** The signed-in app. Runs once, after authentication succeeds. */
  function bootApp() {
    if (state.deck) {
      const validIds = state.deck.topics.map(function (t) { return t.id; });
      state.selected = validIds.slice();
      renderTopics();
      updateSourceUI();
      updateStatsUI();
      updateControls();
      renderSheetWarnings((state.deck.source && state.deck.source.warnings) || []);
    } else {
      updateControls();
    }
    updateDataInfo();
    updateStudyUI();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
