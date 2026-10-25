/* =========================================================
   VocabLab — UI language catalogue
   English is the source language; Vietnamese and French are
   complete catalogues. Dynamic app strings use I18n.t(key).
   ========================================================= */
(function () {
  'use strict';

  const EN = {
    'brand.tagline': 'DELF B2 studio',
    'nav.home': 'Home',
    'nav.lessons': 'Lessons',
    'nav.practice': 'Practice',
    'nav.exam': 'Exam room',
    'nav.community': 'Community',
    'nav.progress': 'My progress',
    'nav.deck': 'Current deck',
    'nav.learner': 'Learner',
    'files.kicker': 'Your material',
    'files.title': 'Class files',
    'files.sub': 'Choose the vocabulary deck and the topics you want to practise.',
    'files.start': 'Go to practice',
    'files.wordOne': '{n} word',
    'files.wordMany': '{n} words',
    'files.topicOne': '{n} topic',
    'files.topicMany': '{n} topics',
    'files.selectedOne': '{n} topic selected · {w} words',
    'files.selectedMany': '{n} topics selected · {w} words',
    'files.noTopics': 'No topics selected',
    'files.loadedAt': 'loaded {when}',
    'files.loaded': 'loaded',
    'lessons.kicker': 'Grammar',
    'lessons.title': 'Lessons',
    'lessons.sub': 'Build the grammar you need for clear, confident B1/B2 writing.',
    'lessons.atlasTitle': 'Tense Atlas',
    'lessons.atlasSub': 'French tenses · DELF B2',
    'lessons.openAtlas': '📖 Open the atlas',
    'lessons.continueAtlas': '📖 Continue the atlas',
    'lessons.handbookTitle': 'Grammar Handbook A2–B2',
    'lessons.handbookBody': 'Twelve chapters on nouns, pronouns, prepositions, connectives and B2 writing, with examples, exercises and the AI tutor.',
    'lessons.openHandbook': '📖 Open the handbook',
    'lessons.continueHandbook': '📖 Continue the handbook',
    'practice.kicker': 'Daily practice',
    'practice.title': 'Practice',
    'practice.sub': 'Quiz, translate a paragraph, or shadow a sentence. Pick what you need today.',
    'practice.tipTitle': 'A small daily win',
    'practice.tipBody': 'Fifteen focused minutes beat an hour of scrolling. Finish one quiz and one production task, then stop while it still feels easy.',
    'practice.b2Title': 'Built for DELF B2',
    'practice.b2Body': 'After a perfect VI → target paragraph, you get optional B1/B2 vocabulary and sentence upgrades — always optional, never a rewrite of your ideas.',
    'practice.leaveConfirm': 'Leave this practice? Your current attempt will be lost.',
    'exam.title': 'Exam room',
    'exam.body': 'A focused DELF B2 exam space is next. For now, use Practice for timed paragraphs and quizzes.',
    'exam.cta': 'Go to practice',
    'community.title': 'Community',
    'community.body': 'Share progress and practise with other learners. This space is coming next.',
    'progress.kicker': 'Your journey',
    'progress.title': 'My progress',
    'progress.sub': 'A clear view of your vocabulary, grammar and streak.',
    'progress.grammar': 'Grammar course',
    'progress.streak': 'Current streak',
    'progress.best': 'Best streak: {n} days',
    'progress.accuracy': 'Accuracy',
    'progress.accuracyHint': 'Across all answered questions.',
    'home.goodMorning': 'Good morning',
    'home.goodAfternoon': 'Good afternoon',
    'home.goodEvening': 'Good evening',
    'home.streakAtRisk': "You missed a day — finish today's quests to keep your {n}-day streak.",
    'home.streakBest': 'Best streak: {n} days',
    'home.streakStart': 'Finish every daily quest to start a streak.',
    'voice.automatic': 'Automatic',
    'voice.autoBest': 'Automatic — best available French voice',
    'voice.browser': 'Browser voice · {name}',
    'voice.none': 'No French browser voice — use Azure or install one',
    'levelUp.title': 'Level up',
    'levelUp.locked': 'Make the grammar perfect to unlock B1/B2 upgrades.',
    'levelUp.empty': 'Your grammar is perfect. No safe B1/B2 upgrade found for this text.',
    'levelUp.sub': 'Optional upgrades — your ideas stay yours.',
    'levelUp.apply': 'Apply',
    'levelUp.applyAll': 'Apply all safe',
    'levelUp.verified': 'Dictionary verified',
    'levelUp.aiOnly': 'AI suggestion',
    'levelUp.unavailable': 'Dictionary check unavailable',
    'levelUp.notFound': 'Not found in dictionary — check before using',
    'levelUp.why': 'Why',
    'levelUp.meaning': 'Meaning',
    'levelUp.source': 'Dictionary',
    'levelUp.loading': 'Looking for safe B1/B2 upgrades…',
    'levelUp.waiting': 'Still working — {s}s…',
    'levelUp.error': 'Could not load upgrade suggestions.',
    'levelUp.aiNeeded': 'Add an AI key in Settings → AI to get upgrade suggestions.',
    'corrections.title': 'Corrections',
    'corrections.allGood': 'Grammar is perfect.',
    'corrections.apply': 'Apply',
    'corrections.applyAll': 'Apply all fixes',
    'corrections.corrected': 'Corrected version',
    'corrections.words': 'Required words',
    'ui.english': 'English',
    'ui.vietnamese': 'Vietnamese',
    'ui.french': 'French',
    'ui.languageChanged': 'Interface language updated.'
  };

  const VI = {
    'brand.tagline': 'Xưởng luyện DELF B2',
    'nav.home': 'Trang chủ',
    'nav.lessons': 'Bài giảng',
    'nav.practice': 'Luyện tập',
    'nav.exam': 'Phòng thi',
    'nav.community': 'Cộng đồng',
    'nav.progress': 'Tiến bộ của tôi',
    'nav.deck': 'Bộ từ hiện tại',
    'nav.learner': 'Học viên',
    'files.kicker': 'Học liệu của bạn',
    'files.title': 'Tệp của lớp',
    'files.sub': 'Chọn bộ từ vựng và các chủ đề bạn muốn luyện.',
    'files.start': 'Đi đến luyện tập',
    'files.wordOne': '{n} từ',
    'files.wordMany': '{n} từ',
    'files.topicOne': '{n} chủ đề',
    'files.topicMany': '{n} chủ đề',
    'files.selectedOne': 'Đã chọn {n} chủ đề · {w} từ',
    'files.selectedMany': 'Đã chọn {n} chủ đề · {w} từ',
    'files.noTopics': 'Chưa chọn chủ đề nào',
    'files.loadedAt': 'đã tải {when}',
    'files.loaded': 'đã tải',
    'lessons.kicker': 'Ngữ pháp',
    'lessons.title': 'Bài giảng',
    'lessons.sub': 'Xây nền ngữ pháp đủ chắc để viết B1/B2 rõ ràng và tự tin.',
    'lessons.atlasTitle': 'Bản đồ các thì',
    'lessons.atlasSub': 'Các thì tiếng Pháp · DELF B2',
    'lessons.openAtlas': '📖 Mở bản đồ các thì',
    'lessons.continueAtlas': '📖 Học tiếp bản đồ các thì',
    'lessons.handbookTitle': 'Cẩm nang ngữ pháp A2–B2',
    'lessons.handbookBody': 'Mười hai chương về danh từ, đại từ, giới từ, liên từ và văn phong B2, kèm ví dụ, bài tập và gia sư AI.',
    'lessons.openHandbook': '📖 Mở cẩm nang',
    'lessons.continueHandbook': '📖 Học tiếp cẩm nang',
    'practice.kicker': 'Luyện mỗi ngày',
    'practice.title': 'Luyện tập',
    'practice.sub': 'Trắc nghiệm, dịch một đoạn văn hoặc shadowing một câu. Chọn việc bạn cần hôm nay.',
    'practice.tipTitle': 'Một thắng lợi nhỏ mỗi ngày',
    'practice.tipBody': 'Mười lăm phút tập trung tốt hơn một giờ lướt qua. Hoàn thành một bài trắc nghiệm và một bài sản xuất, rồi dừng khi vẫn còn thấy nhẹ nhàng.',
    'practice.b2Title': 'Dành cho DELF B2',
    'practice.b2Body': 'Sau khi đoạn dịch VI → ngôn ngữ đích đạt điểm tuyệt đối, bạn nhận các gợi ý nâng cấp từ vựng và câu B1/B2 — luôn tùy chọn, không viết lại ý của bạn.',
    'practice.leaveConfirm': 'Rời bài luyện này? Lần làm hiện tại sẽ bị mất.',
    'exam.title': 'Phòng thi',
    'exam.body': 'Không gian luyện thi DELF B2 sẽ có ở bước tiếp theo. Trong lúc này, hãy dùng Luyện tập cho đoạn văn và trắc nghiệm.',
    'exam.cta': 'Đi đến luyện tập',
    'community.title': 'Cộng đồng',
    'community.body': 'Chia sẻ tiến bộ và luyện tập cùng người học khác. Không gian này sẽ sớm mở.',
    'progress.kicker': 'Hành trình của bạn',
    'progress.title': 'Tiến bộ của tôi',
    'progress.sub': 'Nhìn rõ từ vựng, ngữ pháp và chuỗi ngày học của bạn.',
    'progress.grammar': 'Khóa ngữ pháp',
    'progress.streak': 'Chuỗi hiện tại',
    'progress.best': 'Chuỗi tốt nhất: {n} ngày',
    'progress.accuracy': 'Độ chính xác',
    'progress.accuracyHint': 'Trên tất cả câu đã trả lời.',
    'home.goodMorning': 'Chào buổi sáng',
    'home.goodAfternoon': 'Chào buổi chiều',
    'home.goodEvening': 'Chào buổi tối',
    'home.streakAtRisk': 'Bạn đã bỏ một ngày — hoàn thành nhiệm vụ hôm nay để giữ chuỗi {n} ngày.',
    'home.streakBest': 'Chuỗi tốt nhất: {n} ngày',
    'home.streakStart': 'Hoàn thành mọi nhiệm vụ hằng ngày để bắt đầu chuỗi.',
    'voice.automatic': 'Tự động',
    'voice.autoBest': 'Tự động — giọng tiếng Pháp tốt nhất hiện có',
    'voice.browser': 'Giọng trình duyệt · {name}',
    'voice.none': 'Không có giọng tiếng Pháp trong trình duyệt — dùng Azure hoặc cài thêm',
    'levelUp.title': 'Nâng cấp',
    'levelUp.locked': 'Sửa hết ngữ pháp để mở khóa gợi ý B1/B2.',
    'levelUp.empty': 'Ngữ pháp đã hoàn hảo. Không tìm thấy gợi ý B1/B2 an toàn cho văn bản này.',
    'levelUp.sub': 'Gợi ý tùy chọn — ý của bạn vẫn là của bạn.',
    'levelUp.apply': 'Áp dụng',
    'levelUp.applyAll': 'Áp dụng tất cả an toàn',
    'levelUp.verified': 'Đã kiểm tra từ điển',
    'levelUp.aiOnly': 'Gợi ý từ AI',
    'levelUp.unavailable': 'Không kiểm tra được từ điển',
    'levelUp.notFound': 'Không thấy trong từ điển — hãy kiểm tra trước khi dùng',
    'levelUp.why': 'Vì sao',
    'levelUp.meaning': 'Nghĩa',
    'levelUp.source': 'Từ điển',
    'levelUp.loading': 'Đang tìm gợi ý nâng cấp B1/B2 an toàn…',
    'levelUp.waiting': 'Vẫn đang xử lý — {s} giây…',
    'levelUp.error': 'Không tải được gợi ý nâng cấp.',
    'levelUp.aiNeeded': 'Thêm khóa AI trong Cài đặt → AI để nhận gợi ý nâng cấp.',
    'corrections.title': 'Sửa lỗi',
    'corrections.allGood': 'Ngữ pháp đã hoàn hảo.',
    'corrections.apply': 'Áp dụng',
    'corrections.applyAll': 'Áp dụng tất cả',
    'corrections.corrected': 'Bản đã sửa',
    'corrections.words': 'Từ bắt buộc',
    'ui.english': 'Tiếng Anh',
    'ui.vietnamese': 'Tiếng Việt',
    'ui.french': 'Tiếng Pháp',
    'ui.languageChanged': 'Đã đổi ngôn ngữ giao diện.'
  };

  const FR = {
    'brand.tagline': 'Atelier DELF B2',
    'nav.home': 'Accueil',
    'nav.lessons': 'Leçons',
    'nav.practice': 'Pratique',
    'nav.exam': "Salle d'examen",
    'nav.community': 'Communauté',
    'nav.progress': 'Mes progrès',
    'nav.deck': 'Paquet actuel',
    'nav.learner': 'Apprenant',
    'files.kicker': 'Votre matériel',
    'files.title': 'Fichiers de la classe',
    'files.sub': 'Choisissez le paquet de vocabulaire et les thèmes à travailler.',
    'files.start': 'Aller à la pratique',
    'files.wordOne': '{n} mot',
    'files.wordMany': '{n} mots',
    'files.topicOne': '{n} thème',
    'files.topicMany': '{n} thèmes',
    'files.selectedOne': '{n} thème sélectionné · {w} mots',
    'files.selectedMany': '{n} thèmes sélectionnés · {w} mots',
    'files.noTopics': 'Aucun thème sélectionné',
    'files.loadedAt': 'chargé {when}',
    'files.loaded': 'chargé',
    'lessons.kicker': 'Grammaire',
    'lessons.title': 'Leçons',
    'lessons.sub': 'Construisez la grammaire nécessaire pour écrire clairement en B1/B2.',
    'lessons.atlasTitle': "L'atlas des temps",
    'lessons.atlasSub': 'Temps français · DELF B2',
    'lessons.openAtlas': "📖 Ouvrir l'atlas",
    'lessons.continueAtlas': "📖 Continuer l'atlas",
    'lessons.handbookTitle': 'Mémo de grammaire A2–B2',
    'lessons.handbookBody': 'Douze chapitres sur les noms, les pronoms, les prépositions, les connecteurs et l’écrit B2, avec exemples, exercices et tuteur IA.',
    'lessons.openHandbook': '📖 Ouvrir le mémo',
    'lessons.continueHandbook': '📖 Continuer le mémo',
    'practice.kicker': 'Pratique quotidienne',
    'practice.title': 'Pratique',
    'practice.sub': 'Quiz, traduction d’un paragraphe ou shadowing d’une phrase. Choisissez ce dont vous avez besoin aujourd’hui.',
    'practice.tipTitle': 'Une petite victoire quotidienne',
    'practice.tipBody': 'Quinze minutes concentrées valent mieux qu’une heure de défilement. Terminez un quiz et une production, puis arrêtez-vous tant que cela reste facile.',
    'practice.b2Title': 'Conçu pour le DELF B2',
    'practice.b2Body': 'Après un paragraphe VI → langue cible parfait, vous recevez des améliorations B1/B2 facultatives — toujours optionnelles, jamais une réécriture de vos idées.',
    'practice.leaveConfirm': 'Quitter cet exercice ? Votre tentative en cours sera perdue.',
    'exam.title': "Salle d'examen",
    'exam.body': 'Un espace d’examen DELF B2 arrive bientôt. En attendant, utilisez Pratique pour les paragraphes et les quiz.',
    'exam.cta': 'Aller à la pratique',
    'community.title': 'Communauté',
    'community.body': 'Partagez vos progrès et pratiquez avec d’autres apprenants. Cet espace arrive bientôt.',
    'progress.kicker': 'Votre parcours',
    'progress.title': 'Mes progrès',
    'progress.sub': 'Une vue claire de votre vocabulaire, de votre grammaire et de votre série.',
    'progress.grammar': 'Cours de grammaire',
    'progress.streak': 'Série actuelle',
    'progress.best': 'Meilleure série : {n} jours',
    'progress.accuracy': 'Précision',
    'progress.accuracyHint': 'Sur toutes les questions répondues.',
    'home.goodMorning': 'Bonjour',
    'home.goodAfternoon': 'Bon après-midi',
    'home.goodEvening': 'Bonsoir',
    'home.streakAtRisk': 'Vous avez manqué un jour — terminez les quêtes du jour pour garder votre série de {n} jours.',
    'home.streakBest': 'Meilleure série : {n} jours',
    'home.streakStart': 'Terminez toutes les quêtes du jour pour commencer une série.',
    'voice.automatic': 'Automatique',
    'voice.autoBest': 'Automatique — meilleure voix française disponible',
    'voice.browser': 'Voix du navigateur · {name}',
    'voice.none': 'Aucune voix française dans le navigateur — utilisez Azure ou en installez une',
    'levelUp.title': 'Niveau supérieur',
    'levelUp.locked': 'Rendez la grammaire parfaite pour débloquer les améliorations B1/B2.',
    'levelUp.empty': 'La grammaire est parfaite. Aucune amélioration B1/B2 sûre trouvée pour ce texte.',
    'levelUp.sub': 'Améliorations facultatives — vos idées restent les vôtres.',
    'levelUp.apply': 'Appliquer',
    'levelUp.applyAll': 'Tout appliquer',
    'levelUp.verified': 'Vérifié dans le dictionnaire',
    'levelUp.aiOnly': 'Suggestion IA',
    'levelUp.unavailable': 'Vérification du dictionnaire indisponible',
    'levelUp.notFound': 'Introuvable dans le dictionnaire — à vérifier',
    'levelUp.why': 'Pourquoi',
    'levelUp.meaning': 'Sens',
    'levelUp.source': 'Dictionnaire',
    'levelUp.loading': 'Recherche d’améliorations B1/B2 sûres…',
    'levelUp.waiting': 'Toujours en cours — {s} s…',
    'levelUp.error': 'Impossible de charger les suggestions.',
    'levelUp.aiNeeded': 'Ajoutez une clé IA dans Paramètres → IA pour recevoir des suggestions.',
    'corrections.title': 'Corrections',
    'corrections.allGood': 'La grammaire est parfaite.',
    'corrections.apply': 'Appliquer',
    'corrections.applyAll': 'Tout corriger',
    'corrections.corrected': 'Version corrigée',
    'corrections.words': 'Mots obligatoires',
    'ui.english': 'Anglais',
    'ui.vietnamese': 'Vietnamien',
    'ui.french': 'Français',
    'ui.languageChanged': 'Langue de l’interface mise à jour.'
  };

  const CATALOGUES = { en: EN, vi: VI, fr: FR };
  // Exact English text/attribute → translated text. This lets the existing
  // markup and older dynamic strings translate without adding a key to every
  // button, label, option and Help paragraph.
  const STATIC = { en: {}, vi: {}, fr: {} };
  const ATTR_SRC = new WeakMap();
  let current = 'en';
  let observer = null;

  function lang() { return current; }

  function addStatic(code, map) {
    if (!STATIC[code] || !map) return;
    Object.keys(map).forEach(function (key) {
      if (key && map[key] != null) STATIC[code][key] = String(map[key]);
    });
  }

  function shouldSkip(node) {
    let el = node && node.nodeType === 1 ? node : (node && node.parentElement);
    if (!el) return true;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') return true;
    if (el.closest && el.closest('#selUiLang, [data-i18n-skip]')) return true;
    if (el.closest && el.closest('[data-i18n], [data-i18n-html]')) return true;
    return false;
  }

  function translateNode(node) {
    if (!node || node.nodeType !== 3 || shouldSkip(node)) return;
    const raw = node.nodeValue || '';
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (!trimmed || /^[\s\d.,:;!?()\-–—·%\/]+$/.test(trimmed)) return;
    if (!node.__i18nSrc) node.__i18nSrc = trimmed;
    const source = node.__i18nSrc;
    const map = STATIC[current] || {};
    const value = current === 'en' ? source : (map[source] || source);
    if (value === trimmed) return;
    const lead = raw.match(/^\s*/)[0];
    const tail = raw.match(/\s*$/)[0];
    node.nodeValue = lead + value + tail;
  }

  function translateAttrs(root) {
    const scope = root || document;
    const els = scope.querySelectorAll ? scope.querySelectorAll('[placeholder], [title], [aria-label], [alt]') : [];
    els.forEach(function (el) {
      ['placeholder', 'title', 'aria-label', 'alt'].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        if (el.closest && el.closest('[data-i18n-' + attr + ']')) return;
        const raw = el.getAttribute(attr);
        const trimmed = raw.replace(/\s+/g, ' ').trim();
        if (!trimmed) return;
        let src = ATTR_SRC.get(el);
        if (!src) { src = {}; ATTR_SRC.set(el, src); }
        if (!src[attr]) src[attr] = trimmed;
        const source = src[attr];
        const map = STATIC[current] || {};
        const value = current === 'en' ? source : (map[source] || source);
        if (value !== raw) el.setAttribute(attr, value);
      });
    });
  }

  function translateStatic(root) {
    const scope = root || document.body;
    if (!scope) return;
    if (scope.nodeType === 3) { translateNode(scope); return; }
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateNode(node);
    translateAttrs(scope);
  }

  function startObserver() {
    if (observer || typeof MutationObserver === 'undefined' || !document.body) return;
    observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 3) translateNode(node);
            else if (node.nodeType === 1) translateStatic(node);
          });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function t(key, vars) {
    const catalogue = CATALOGUES[current] || EN;
    let text = catalogue[key];
    if (text == null) text = EN[key];
    if (text == null) text = key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), String(vars[name]));
      });
    }
    return text;
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });
    ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
      scope.querySelectorAll('[data-i18n-' + attr + ']').forEach(function (el) {
        const key = el.getAttribute('data-i18n-' + attr);
        if (key) el.setAttribute(attr, t(key));
      });
    });
    translateStatic(scope);
  }

  function setLang(value) {
    const next = CATALOGUES[value] ? value : 'en';
    current = next;
    document.documentElement.lang = next;
    apply(document);
    startObserver();
    document.dispatchEvent(new CustomEvent('vocablab:language', { detail: { lang: next } }));
    return next;
  }

  globalThis.I18n = {
    t: t,
    lang: lang,
    setLang: setLang,
    apply: apply,
    addStatic: addStatic,
    translateStatic: translateStatic,
    catalogues: CATALOGUES,
    static: STATIC
  };
})();
