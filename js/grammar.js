/* =========================================================
   VocabLab — grammar.js
   Renders the French tenses course, lesson exercises, progress
   and the AI tutor. Data lives in grammar-data.js.
   ========================================================= */
(function (global) {
  'use strict';

  /* Two courses ship with the app: the tenses atlas and the A2–B2 grammar
     handbook. Only the active one is rendered; progress is kept per course so
     finishing a chapter in one course never marks anything in the other. */
  var COURSES = {};
  if (global.GrammarData) COURSES.tenses = global.GrammarData;
  if (global.GrammarHandbook) COURSES.handbook = global.GrammarHandbook;
  var courseId = COURSES.tenses ? 'tenses' : Object.keys(COURSES)[0];
  var DATA = COURSES[courseId];
  if (!DATA) return;
  var U = global.Util || {};

  /* The tenses course keeps the original storage keys so progress saved before
     the handbook existed is not lost. */
  function progressKeyFor(id) {
    return id === 'tenses' ? 'grammarProgress' : 'grammarProgress:' + id;
  }
  function lastKeyFor(id) {
    return id === 'tenses' ? 'grammarLast' : 'grammarLast:' + id;
  }
  function progressKey() { return progressKeyFor(courseId); }
  function lastKey() { return lastKeyFor(courseId); }

  var state = {
    root: null,
    opts: {},
    view: 'course',
    chapterId: null,
    lang: 'vi',
    tutor: { busy: false, messages: [], generation: 0 }
  };

  var T = {
    vi: {
      backVocab: '← Bài học',
      backCourse: '← Course',
      courseKicker: 'HỌC · DELF B2',
      courseTitle: 'Các thì tiếng Pháp',
      continue: 'Tiếp tục học',
      review: 'Ôn thi',
      lessonsDone: '{done} / {total} bài đã xong',
      progress: 'Tiến độ của bạn',
      lessonCount: '{n} bài học',
      exerciseCount: '{n} bài tập',
      chapter: 'Chương {n}',
      minutes: '{n} phút',
      exercises: '{n} bài tập',
      done: 'Đã xong',
      inProgress: 'Đang học',
      notStarted: 'Chưa bắt đầu',
      practice: 'Luyện tập',
      practiceIntro: 'Điền vào chỗ trống. Dấu accent rất quan trọng, nhưng nếu chỉ thiếu accent, VocabLab vẫn chấp nhận và nhắc bạn.',
      check: 'Kiểm tra',
      showAnswer: 'Xem đáp án',
      correct: 'Chính xác!',
      notQuite: 'Chưa đúng.',
      answerIs: 'Đáp án: {answer}',
      accentHint: 'Đúng, nhưng chú ý dấu: {answer}',
      tryAgain: 'Hãy thử lại.',
      markComplete: 'Đánh dấu đã học xong',
      completed: 'Đã học xong ✓',
      prev: '‹ Bài trước',
      next: 'Bài sau ›',
      tutor: 'Gia sư AI',
      tutorIntro: 'Hỏi về bài này — giải thích, ví dụ, sửa câu hoặc luyện tập.',
      tutorPlaceholder: 'Hỏi gia sư về bài này…',
      send: 'Hỏi',
      clear: 'Xóa',
      thinking: 'Đang suy nghĩ…',
      waiting: 'Đang chờ lượt AI miễn phí {n} giây…',
      notReady: 'AI chưa được thiết lập. Mở Settings → AI để dùng model miễn phí hoặc nhập key của bạn.',
      openSettings: 'Mở cài đặt AI',
      you: 'Bạn',
      tutorError: 'Gia sư AI chưa trả lời được.',
      explain: 'Giải thích đơn giản',
      example: 'Thêm ví dụ',
      quiz: 'Đố tôi',
      fix: 'Sửa câu của tôi',
      fixEmpty: 'Hãy gõ một câu tiếng Pháp vào ô bên dưới trước.',
      lessonDone: 'Đã hoàn thành bài học',
      allExercises: 'Tất cả bài tập đã đúng — bài học được đánh dấu hoàn thành.',
      listen: 'Nghe',
      emptyTutor: 'Chưa có tin nhắn. Chọn một gợi ý hoặc đặt câu hỏi.',
      typeAnswer: 'Nhập câu trả lời…'
    },
    en: {
      backVocab: '← Lessons',
      backCourse: '← Course',
      courseKicker: 'STUDY · DELF B2',
      courseTitle: 'French Tenses',
      continue: 'Continue learning',
      review: 'Review',
      lessonsDone: '{done} / {total} lessons complete',
      progress: 'Your progress',
      lessonCount: '{n} lessons',
      exerciseCount: '{n} exercises',
      chapter: 'Chapter {n}',
      minutes: '{n} min',
      exercises: '{n} exercises',
      done: 'Done',
      inProgress: 'In progress',
      notStarted: 'Not started',
      practice: 'Practice',
      practiceIntro: 'Complete each sentence. Accents matter, but a missing accent is accepted with a reminder.',
      check: 'Check',
      showAnswer: 'Show answer',
      correct: 'Correct!',
      notQuite: 'Not quite.',
      answerIs: 'Answer: {answer}',
      accentHint: 'Correct, but mind the accent: {answer}',
      tryAgain: 'Try again.',
      markComplete: 'Mark lesson complete',
      completed: 'Completed ✓',
      prev: '‹ Previous',
      next: 'Next ›',
      tutor: 'AI tutor',
      tutorIntro: 'Ask about this lesson — explanations, examples, corrections, or practice.',
      tutorPlaceholder: 'Ask the tutor about this lesson…',
      send: 'Ask',
      clear: 'Clear',
      thinking: 'Thinking…',
      waiting: 'Waiting {n}s for the free AI…',
      notReady: 'AI is not set up yet. Open Settings → AI to use the free model or add your own key.',
      openSettings: 'Open AI settings',
      you: 'You',
      tutorError: 'The AI tutor could not answer.',
      explain: 'Explain simply',
      example: 'More examples',
      quiz: 'Quiz me',
      fix: 'Fix my sentence',
      fixEmpty: 'Type a French sentence in the box first.',
      lessonDone: 'Lesson complete',
      allExercises: 'All exercises correct — lesson marked complete.',
      listen: 'Listen',
      emptyTutor: 'No messages yet. Pick a suggestion or ask a question.',
      typeAnswer: 'Type your answer…'
    }
  };

  function tr(key, vars) {
    var table = T[state.lang] || T.en;
    var text = table[key] || T.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return text;
  }

  function langText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[state.lang] || value.en || value.vi || '';
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, action, cls, data) {
    var b = el('button', cls || 'btn btn-subtle', label);
    b.type = 'button';
    if (action) b.setAttribute('data-action', action);
    if (data) Object.keys(data).forEach(function (k) { b.setAttribute('data-' + k, data[k]); });
    return b;
  }

  function chapterById(id) {
    for (var i = 0; i < DATA.chapters.length; i++) {
      if (DATA.chapters[i].id === id) return DATA.chapters[i];
    }
    return null;
  }

  function chapterIndex(id) {
    for (var i = 0; i < DATA.chapters.length; i++) {
      if (DATA.chapters[i].id === id) return i;
    }
    return -1;
  }

  function readProgress() {
    var value = U.lsGet ? U.lsGet(progressKey(), {}) : {};
    return value && typeof value === 'object' ? value : {};
  }

  function writeProgress(value) {
    if (U.lsSet) U.lsSet(progressKey(), value);
  }

  /* Read-only: never switches the active course, so opening a course or
     checking an exercise cannot collide with a summary lookup. */
  function summaryFor(data, id) {
    var progress = U.lsGet ? U.lsGet(progressKeyFor(id), {}) : {};
    if (!progress || typeof progress !== 'object') progress = {};
    var done = 0;
    var next = null;
    for (var i = 0; i < data.chapters.length; i++) {
      var rec = progress[data.chapters[i].id];
      if (rec && rec.done) done++;
      else if (!next) next = data.chapters[i];
    }
    // If every chapter is done, "continue" points at the review chapter.
    if (!next) next = data.chapters[data.chapters.length - 1];
    return {
      done: done,
      total: data.chapters.length,
      pct: Math.round((done / data.chapters.length) * 100),
      next: next,
      last: U.lsGet ? U.lsGet(lastKeyFor(id), '') : ''
    };
  }

  function progressSummary() {
    return summaryFor(DATA, courseId);
  }

  function chapterRecord(chapterId) {
    var progress = readProgress();
    return progress[chapterId] || null;
  }

  function chapterDone(chapterId) {
    var rec = chapterRecord(chapterId);
    return !!(rec && rec.done);
  }

  function exerciseStatus(chapterId, index) {
    var rec = chapterRecord(chapterId);
    return rec && rec.exercises ? rec.exercises[index] : null;
  }

  function notifyProgress() {
    var summary = progressSummary();
    if (typeof state.opts.onProgress === 'function') state.opts.onProgress(summary);
    if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('grammar:progress', { detail: summary }));
    }
  }

  function markChapter(chapterId, done) {
    var progress = readProgress();
    var rec = progress[chapterId] || {};
    var wasDone = !!rec.done;
    if (!rec.exercises) rec.exercises = {};
    rec.done = !!done;
    rec.at = done ? Date.now() : null;
    if (!done && !Object.keys(rec.exercises).length) delete progress[chapterId];
    else progress[chapterId] = rec;
    writeProgress(progress);
    notifyProgress();
    refreshCompletionUI();
    if (done && !wasDone) notifyChapterDone(chapterId);
    if (done && U.toast) U.toast(tr('lessonDone'), 'ok');
  }

  function notifyChapterDone(chapterId) {
    if (state.opts && typeof state.opts.onChapterDone === 'function') {
      try { state.opts.onChapterDone(chapterId); } catch (e) { /* a quest must never break the lesson */ }
    }
  }

  function recordExercise(chapterId, index, status) {
    var progress = readProgress();
    var rec = progress[chapterId] || {};
    if (!rec.exercises) rec.exercises = {};
    rec.exercises[index] = status;
    progress[chapterId] = rec;
    writeProgress(progress);

    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.exercises) return;
    var allCorrect = true;
    for (var i = 0; i < chapter.exercises.length; i++) {
      if (rec.exercises[i] !== 'correct') { allCorrect = false; break; }
    }
    if (allCorrect && !rec.done) {
      rec.done = true;
      rec.at = Date.now();
      writeProgress(progress);
      if (U.toast) U.toast(tr('allExercises'), 'ok');
      notifyChapterDone(chapterId);
    }
    notifyProgress();
    refreshCompletionUI();
  }

  function refreshCompletionUI() {
    if (!state.root) return;
    var chapter = state.chapterId ? chapterById(state.chapterId) : null;
    if (!chapter) return;
    var done = chapterDone(chapter.id);
    Array.prototype.forEach.call(state.root.querySelectorAll('[data-action="toggle-complete"]'), function (b) {
      b.textContent = done ? tr('completed') : tr('markComplete');
      b.className = done ? 'btn btn-primary lesson-complete-btn is-done' : 'btn btn-primary lesson-complete-btn';
    });
    var rec = chapterRecord(chapter.id);
    var hasPractice = rec && rec.exercises && Object.keys(rec.exercises).length > 0;
    Array.prototype.forEach.call(state.root.querySelectorAll('[data-status-badge]'), function (b) {
      b.textContent = done ? tr('done') : (hasPractice ? tr('inProgress') : tr('notStarted'));
      b.className = 'pill ' + (done ? 'pill-ok' : 'pill-muted');
    });
  }

  function langToggle() {
    var seg = el('div', 'seg grammar-lang');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Explanation language');
    ['vi', 'en'].forEach(function (code) {
      var b = el('button', 'seg-btn' + (state.lang === code ? ' is-on' : ''), code.toUpperCase());
      b.type = 'button';
      b.setAttribute('data-action', 'set-lang');
      b.setAttribute('data-lang', code);
      b.setAttribute('aria-pressed', state.lang === code ? 'true' : 'false');
      seg.appendChild(b);
    });
    return seg;
  }

  function scrollTop() {
    try { global.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* ignore */ }
  }

  /* ----------------------------- Course map ----------------------------- */
  function renderCourse() {
    if (!state.root) return;
    state.view = 'course';
    state.chapterId = null;
    state.root.innerHTML = '';
    var wrap = el('div', 'grammar-view');
    var summary = progressSummary();

    var courseTop = el('div', 'lesson-toolbar');
    courseTop.appendChild(button(tr('backVocab'), 'exit', 'btn btn-ghost btn-sm'));
    var courseTopRight = el('div', 'lesson-toolbar-right');
    courseTopRight.appendChild(el('span', 'pill pill-muted', tr('lessonCount', { n: DATA.chapters.length })));
    courseTop.appendChild(courseTopRight);
    wrap.appendChild(courseTop);

    var hero = el('section', 'card grammar-hero');
    var heroMain = el('div', 'grammar-hero-main');
    heroMain.appendChild(el('span', 'grammar-kicker', tr('courseKicker')));
    heroMain.appendChild(el('h1', 'grammar-title', langText(DATA.title)));
    heroMain.appendChild(el('p', 'grammar-lead', langText(DATA.intro)));
    var statRow = el('div', 'grammar-stats');
    statRow.appendChild(statBlock(String(DATA.chapters.length), tr('lessonCount', { n: DATA.chapters.length }).replace(/^\d+\s*/, '')));
    statRow.appendChild(statBlock(String(totalExercises()), tr('exerciseCount', { n: totalExercises() }).replace(/^\d+\s*/, '')));
    statRow.appendChild(statBlock(summary.done + '/' + summary.total, tr('done')));
    heroMain.appendChild(statRow);
    hero.appendChild(heroMain);

    var heroSide = el('div', 'grammar-hero-side');
    heroSide.appendChild(langToggle());
    var progressBox = el('div', 'grammar-progress-box');
    var progressHead = el('div', 'grammar-progress-head');
    progressHead.appendChild(el('span', 'small', tr('progress')));
    progressHead.appendChild(el('strong', '', tr('lessonsDone', { done: summary.done, total: summary.total })));
    progressBox.appendChild(progressHead);
    var track = el('div', 'progress');
    var fill = el('div', 'progress-fill');
    fill.style.width = summary.pct + '%';
    track.appendChild(fill);
    progressBox.appendChild(track);
    heroSide.appendChild(progressBox);
    var actions = el('div', 'grammar-hero-actions');
    actions.appendChild(button(tr('continue') + ' →', 'open-lesson', 'btn btn-primary', { id: summary.next.id }));
    actions.appendChild(button(tr('review'), 'open-lesson', 'btn btn-subtle', { id: 'revision' }));
    heroSide.appendChild(actions);
    hero.appendChild(heroSide);
    wrap.appendChild(hero);

    var resume = el('section', 'card grammar-resume');
    var resumeText = el('div', '');
    resumeText.appendChild(el('span', 'grammar-kicker', tr('progress')));
    resumeText.appendChild(el('h2', '', tr('continue')));
    resumeText.appendChild(el('p', 'muted small', summary.next.title + ' · ' + langText(summary.next.subtitle)));
    resume.appendChild(resumeText);
    resume.appendChild(button(tr('continue') + ' →', 'open-lesson', 'btn btn-subtle btn-sm', { id: summary.next.id }));
    wrap.appendChild(resume);

    DATA.parts.forEach(function (part) {
      var chapters = DATA.chapters.filter(function (c) { return c.part === part.id; });
      if (!chapters.length) return;
      var section = el('section', 'grammar-part');
      var head = el('div', 'grammar-part-head');
      head.appendChild(el('h2', '', langText(part.title)));
      head.appendChild(el('span', 'muted small', tr('lessonCount', { n: chapters.length })));
      section.appendChild(head);
      var grid = el('div', 'grammar-grid');
      chapters.forEach(function (c) { grid.appendChild(lessonCard(c)); });
      section.appendChild(grid);
      wrap.appendChild(section);
    });

    state.root.appendChild(wrap);
  }

  function totalExercises() {
    return DATA.chapters.reduce(function (sum, c) { return sum + (c.exercises ? c.exercises.length : 0); }, 0);
  }

  function statBlock(value, label) {
    var box = el('div', 'grammar-stat');
    box.appendChild(el('strong', '', String(value)));
    box.appendChild(el('span', '', label));
    return box;
  }

  function lessonCard(c) {
    var done = chapterDone(c.id);
    var rec = chapterRecord(c.id);
    var hasPractice = rec && rec.exercises && Object.keys(rec.exercises).length > 0;
    var card = el('button', 'grammar-lesson-card' + (done ? ' is-done' : ''));
    card.type = 'button';
    card.setAttribute('data-action', 'open-lesson');
    card.setAttribute('data-id', c.id);
    var top = el('div', 'grammar-card-top');
    top.appendChild(el('span', 'grammar-card-num', String(c.num).padStart(2, '0')));
    var badges = el('span', 'grammar-card-badges');
    if (done) badges.appendChild(el('span', 'pill pill-ok', '✓ ' + tr('done')));
    else if (hasPractice) badges.appendChild(el('span', 'pill pill-accent', tr('inProgress')));
    top.appendChild(badges);
    card.appendChild(top);
    card.appendChild(el('h3', '', c.title));
    card.appendChild(el('p', 'grammar-card-sub', langText(c.subtitle)));
    card.appendChild(el('p', 'grammar-card-summary', langText(c.summary)));
    var meta = el('div', 'grammar-card-meta');
    meta.appendChild(el('span', '', tr('minutes', { n: c.minutes })));
    meta.appendChild(el('span', '', tr('exercises', { n: c.exercises.length })));
    meta.appendChild(el('span', 'grammar-card-arrow', '→'));
    card.appendChild(meta);
    return card;
  }

  /* ----------------------------- Lesson ----------------------------- */
  function renderLesson() {
    var c = state.chapterId ? chapterById(state.chapterId) : null;
    if (!c) { renderCourse(); return; }
    if (!state.root) return;
    state.view = 'lesson';
    state.root.innerHTML = '';
    var done = chapterDone(c.id);
    var summary = progressSummary();

    var wrap = el('div', 'grammar-view lesson-view');
    var toolbar = el('div', 'lesson-toolbar');
    var toolbarLeft = el('div', 'lesson-toolbar-left');
    toolbarLeft.appendChild(button(tr('backCourse'), 'course', 'btn btn-ghost btn-sm'));
    toolbarLeft.appendChild(button(tr('backVocab'), 'exit', 'btn btn-ghost btn-sm'));
    toolbar.appendChild(toolbarLeft);
    var toolbarRight = el('div', 'lesson-toolbar-right');
    toolbarRight.appendChild(el('span', 'pill pill-muted', tr('chapter', { n: c.num })));
    toolbarRight.appendChild(langToggle());
    toolbar.appendChild(toolbarRight);
    wrap.appendChild(toolbar);

    var layout = el('div', 'lesson-layout');
    var article = el('article', 'card lesson-article');
    var head = el('header', 'lesson-head');
    head.appendChild(el('p', 'grammar-kicker', tr('chapter', { n: c.num }) + ' · ' + tr('minutes', { n: c.minutes })));
    head.appendChild(el('h1', 'lesson-title', c.title));
    head.appendChild(el('p', 'lesson-subtitle', langText(c.subtitle)));
    head.appendChild(el('p', 'lesson-summary', langText(c.summary)));
    var meta = el('div', 'lesson-meta');
    meta.appendChild(el('span', 'pill pill-accent', tr('exercises', { n: c.exercises.length })));
    var rec = chapterRecord(c.id);
    var hasPractice = rec && rec.exercises && Object.keys(rec.exercises).length > 0;
    var statusBadge = el('span', 'pill ' + (done ? 'pill-ok' : 'pill-muted'),
      done ? tr('done') : (hasPractice ? tr('inProgress') : tr('notStarted')));
    statusBadge.setAttribute('data-status-badge', '');
    meta.appendChild(statusBadge);
    meta.appendChild(el('span', 'muted small', tr('lessonsDone', { done: summary.done, total: summary.total })));
    head.appendChild(meta);
    article.appendChild(head);

    var blocks = el('div', 'lesson-blocks');
    c.blocks.forEach(function (block) { blocks.appendChild(renderBlock(block)); });
    article.appendChild(blocks);

    var practice = el('section', 'lesson-practice');
    practice.appendChild(el('h2', '', tr('practice')));
    practice.appendChild(el('p', 'muted small', tr('practiceIntro')));
    var exercises = el('div', 'lesson-exercises');
    c.exercises.forEach(function (exercise, index) { exercises.appendChild(renderExercise(c, exercise, index)); });
    practice.appendChild(exercises);
    article.appendChild(practice);

    var footer = el('footer', 'lesson-footer');
    footer.appendChild(button(done ? tr('completed') : tr('markComplete'), 'toggle-complete',
      done ? 'btn btn-primary lesson-complete-btn is-done' : 'btn btn-primary lesson-complete-btn'));
    var nav = el('div', 'lesson-nav');
    var index = chapterIndex(c.id);
    if (index > 0) nav.appendChild(button(tr('prev'), 'open-lesson', 'btn btn-ghost btn-sm', { id: DATA.chapters[index - 1].id }));
    if (index < DATA.chapters.length - 1) nav.appendChild(button(tr('next'), 'open-lesson', 'btn btn-subtle btn-sm', { id: DATA.chapters[index + 1].id }));
    footer.appendChild(nav);
    article.appendChild(footer);

    layout.appendChild(article);
    layout.appendChild(renderTutor(c));
    wrap.appendChild(layout);
    state.root.appendChild(wrap);
    renderTutorLog();
    setTutorBusy(state.tutor.busy);
  }

  function renderBlock(block) {
    if (!block) return el('span');
    if (block.type === 'p') return el('p', 'lesson-p', langText(block));
    if (block.type === 'h') return el('h3', 'lesson-h', langText(block));
    if (block.type === 'list') {
      var ul = el('ul', 'lesson-list');
      var items = block[state.lang] || block.en || block.vi || [];
      items.forEach(function (item) { ul.appendChild(el('li', '', item)); });
      return ul;
    }
    if (block.type === 'table') {
      var wrap = el('div', 'lesson-table-wrap');
      var table = el('table', 'lesson-table');
      if (block.head && block.head.length) {
        var thead = el('thead');
        var trh = el('tr');
        block.head.forEach(function (h) { trh.appendChild(el('th', '', langText(h))); });
        thead.appendChild(trh);
        table.appendChild(thead);
      }
      var tbody = el('tbody');
      (block.rows || []).forEach(function (row) {
        var tr = el('tr');
        row.forEach(function (cell) { tr.appendChild(el('td', '', langText(cell))); });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      if (block.caption) wrap.appendChild(el('p', 'muted tiny', langText(block.caption)));
      return wrap;
    }
    if (block.type === 'formula') {
      return el('div', 'lesson-formula', langText(block));
    }
    if (block.type === 'callout') {
      var kinds = { tip: '💡', warn: '⚠️', note: '📝', english: '🇬🇧' };
      var labels = {
        tip: { vi: 'Mẹo nhớ', en: 'Memory tip' },
        warn: { vi: 'Chú ý, dễ sai', en: 'Common trap' },
        note: { vi: 'Ghi chú', en: 'Note' },
        english: { vi: 'So với tiếng Anh', en: 'Compared with English' }
      };
      var box = el('div', 'lesson-callout lesson-callout-' + block.kind);
      var title = el('div', 'lesson-callout-title');
      title.appendChild(el('span', '', kinds[block.kind] || '•'));
      title.appendChild(el('strong', '', langText(labels[block.kind] || labels.note)));
      box.appendChild(title);
      box.appendChild(el('p', '', langText(block)));
      return box;
    }
    if (block.type === 'examples') {
      var list = el('div', 'lesson-examples');
      (block.items || []).forEach(function (item) {
        var row = el('div', 'lesson-example');
        var main = el('div', 'lesson-example-main');
        main.appendChild(el('p', 'ex-fr', item.fr));
        var meaning = item[state.lang] || item.en || item.vi || '';
        main.appendChild(el('p', 'ex-tr muted', meaning));
        row.appendChild(main);
        var speak = el('button', 'icon-btn icon-btn-sm ex-speak', '🔊');
        speak.type = 'button';
        speak.title = tr('listen');
        speak.setAttribute('data-action', 'speak');
        speak.setAttribute('data-say', item.fr);
        row.appendChild(speak);
        list.appendChild(row);
      });
      return list;
    }
    return el('span');
  }

  function renderExercise(chapter, ex, index) {
    var box = el('div', 'exercise');
    box.setAttribute('data-ex', String(index));
    var status = exerciseStatus(chapter.id, index);
    if (status === 'correct') box.classList.add('is-correct');
    if (status === 'wrong') box.classList.add('is-wrong');

    var head = el('div', 'exercise-head');
    head.appendChild(el('span', 'exercise-num', String(index + 1)));
    head.appendChild(el('span', 'exercise-kind', exerciseKind(ex)));
    box.appendChild(head);

    if (ex.type === 'choice') {
      var q = el('p', 'exercise-question', langText(ex.question));
      box.appendChild(q);
      var options = el('div', 'choice-options');
      (ex.options || []).forEach(function (option, optIndex) {
        var b = el('button', 'choice-option', option);
        b.type = 'button';
        b.setAttribute('data-action', 'choice');
        b.setAttribute('data-ex', String(index));
        b.setAttribute('data-choice', String(optIndex));
        if (status === 'correct' && optIndex === ex.answer) b.classList.add('is-correct');
        if (status === 'correct') b.disabled = true;
        options.appendChild(b);
      });
      box.appendChild(options);
    } else if (ex.type === 'translate') {
      box.appendChild(el('p', 'exercise-source', langText(ex.source)));
      var tinput = el('input', 'input translate-input');
      tinput.type = 'text';
      tinput.autocomplete = 'off';
      tinput.spellcheck = false;
      tinput.placeholder = tr('typeAnswer');
      tinput.setAttribute('aria-label', tr('typeAnswer'));
      tinput.setAttribute('data-blank', '0');
      if (status === 'correct') {
        tinput.value = (ex.answers && ex.answers[0]) || '';
        tinput.disabled = true;
      }
      box.appendChild(tinput);
    } else {
      var sentence = el('p', 'exercise-sentence');
      var parts = String(ex.text || '').split(/(\{\{\d+\}\}|_{2,})/g);
      var blankIndex = 0;
      parts.forEach(function (part) {
        if (/^\{\{\d+\}\}$/.test(part) || /^_{2,}$/.test(part)) {
          var input = el('input', 'blank-input');
          input.type = 'text';
          input.autocomplete = 'off';
          input.spellcheck = false;
          input.setAttribute('data-blank', String(blankIndex));
          input.setAttribute('aria-label', (state.lang === 'vi' ? 'Chỗ trống ' : 'Blank ') + (blankIndex + 1));
          input.placeholder = '…';
          var accepted = (ex.answers && ex.answers[blankIndex]) || [];
          var width = accepted[0] ? Math.max(4, Math.min(20, String(accepted[0]).length + 2)) : 6;
          input.style.width = width + 'ch';
          if (status === 'correct') {
            input.value = accepted[0] || '';
            input.disabled = true;
          }
          sentence.appendChild(input);
          blankIndex++;
        } else if (part) {
          sentence.appendChild(document.createTextNode(part));
        }
      });
      box.appendChild(sentence);
    }

    var actions = el('div', 'exercise-actions');
    actions.appendChild(button(tr('check'), 'check', 'btn btn-subtle btn-sm', { ex: String(index) }));
    actions.appendChild(button(tr('showAnswer'), 'show-answer', 'btn btn-ghost btn-sm', { ex: String(index) }));
    box.appendChild(actions);

    var feedback = el('div', 'exercise-feedback');
    feedback.setAttribute('data-feedback', String(index));
    feedback.setAttribute('aria-live', 'polite');
    if (status === 'correct') {
      feedback.classList.add('is-ok');
      feedback.textContent = tr('correct') + ' ' + langText(ex.explain);
    } else if (status === 'wrong') {
      feedback.classList.add('is-bad');
      feedback.textContent = tr('notQuite') + ' ' + tr('tryAgain');
    } else {
      feedback.hidden = true;
    }
    box.appendChild(feedback);
    return box;
  }

  function exerciseKind(ex) {
    if (ex.type === 'choice') return state.lang === 'vi' ? 'Chọn đáp án' : 'Choose';
    if (ex.type === 'translate') return state.lang === 'vi' ? 'Dịch' : 'Translate';
    return state.lang === 'vi' ? 'Điền vào chỗ trống' : 'Fill in';
  }

  function normalizeAnswer(value) {
    var text = String(value == null ? '' : value);
    if (U.normalize) text = U.normalize(text);
    else text = text.toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').trim();
    return text.replace(/[.!?,;:«»"…]+$/g, '').replace(/^[«"]+/, '').replace(/[»"]+$/, '').trim();
  }

  function compareAnswer(value, accepted) {
    var typed = normalizeAnswer(value);
    if (!typed) return { ok: false, accent: false };
    var list = Array.isArray(accepted) ? accepted : [accepted];
    for (var i = 0; i < list.length; i++) {
      if (typed === normalizeAnswer(list[i])) return { ok: true, accent: false, answer: list[i] };
    }
    var flatTyped = U.stripDiacritics ? U.stripDiacritics(typed) : typed;
    for (var j = 0; j < list.length; j++) {
      var flat = U.stripDiacritics ? U.stripDiacritics(normalizeAnswer(list[j])) : normalizeAnswer(list[j]);
      if (flatTyped === flat) return { ok: true, accent: true, answer: list[j] };
    }
    return { ok: false, accent: false };
  }

  function checkExercise(index) {
    var chapter = state.chapterId ? chapterById(state.chapterId) : null;
    if (!chapter) return;
    var ex = chapter.exercises[index];
    if (!ex) return;
    var box = state.root.querySelector('.exercise[data-ex="' + index + '"]');
    if (!box || box.classList.contains('is-correct')) return;
    var feedback = box.querySelector('[data-feedback]');

    if (ex.type === 'choice') {
      var selected = box.querySelector('.choice-option.is-selected');
      if (!selected) {
        if (U.toast) U.toast(state.lang === 'vi' ? 'Chọn một đáp án trước.' : 'Choose an option first.', 'warn');
        return;
      }
      var choiceIndex = parseInt(selected.getAttribute('data-choice'), 10);
      if (choiceIndex === ex.answer) {
        box.classList.add('is-correct');
        box.classList.remove('is-wrong');
        selected.classList.add('is-correct');
        Array.prototype.forEach.call(box.querySelectorAll('.choice-option'), function (b) { b.disabled = true; });
        feedback.hidden = false;
        feedback.className = 'exercise-feedback is-ok';
        feedback.textContent = tr('correct') + ' ' + langText(ex.explain);
        recordExercise(chapter.id, index, 'correct');
      } else {
        selected.classList.add('is-wrong');
        box.classList.add('is-wrong');
        feedback.hidden = false;
        feedback.className = 'exercise-feedback is-bad';
        feedback.textContent = tr('notQuite') + ' ' + tr('tryAgain');
        recordExercise(chapter.id, index, 'wrong');
      }
      return;
    }

    var inputs = box.querySelectorAll('.blank-input, .translate-input');
    if (!inputs.length) return;
    if (ex.type === 'translate') {
      var result = compareAnswer(inputs[0].value, ex.answers);
      if (result.ok) {
        inputs[0].disabled = true;
        inputs[0].classList.remove('is-wrong');
        box.classList.add('is-correct');
        box.classList.remove('is-wrong');
        feedback.hidden = false;
        feedback.className = 'exercise-feedback is-ok';
        feedback.textContent = tr('correct') + ' ' + langText(ex.explain) +
          (result.accent ? ' ' + tr('accentHint', { answer: result.answer }) : '');
        recordExercise(chapter.id, index, 'correct');
      } else {
        inputs[0].classList.add('is-wrong');
        box.classList.add('is-wrong');
        feedback.hidden = false;
        feedback.className = 'exercise-feedback is-bad';
        feedback.textContent = tr('notQuite') + ' ' + tr('tryAgain');
        recordExercise(chapter.id, index, 'wrong');
      }
      return;
    }

    var allCorrect = true;
    var accent = false;
    var expected = [];
    Array.prototype.forEach.call(inputs, function (input, i) {
      var accepted = (ex.answers && ex.answers[i]) || [];
      var one = compareAnswer(input.value, accepted);
      input.classList.remove('is-wrong');
      if (!one.ok) {
        allCorrect = false;
        input.classList.add('is-wrong');
      }
      if (one.ok && one.accent) accent = true;
      expected.push(accepted[0] || '');
    });
    if (allCorrect) {
      Array.prototype.forEach.call(inputs, function (input) { input.disabled = true; });
      box.classList.add('is-correct');
      box.classList.remove('is-wrong');
      feedback.hidden = false;
      feedback.className = 'exercise-feedback is-ok';
      feedback.textContent = tr('correct') + ' ' + langText(ex.explain) +
        (accent ? ' ' + tr('accentHint', { answer: expected.join(' / ') }) : '');
      recordExercise(chapter.id, index, 'correct');
    } else {
      box.classList.add('is-wrong');
      feedback.hidden = false;
      feedback.className = 'exercise-feedback is-bad';
      feedback.textContent = tr('notQuite') + ' ' + tr('tryAgain');
      recordExercise(chapter.id, index, 'wrong');
    }
  }

  function showAnswer(index) {
    var chapter = state.chapterId ? chapterById(state.chapterId) : null;
    if (!chapter) return;
    var ex = chapter.exercises[index];
    if (!ex) return;
    var box = state.root.querySelector('.exercise[data-ex="' + index + '"]');
    if (!box) return;
    var feedback = box.querySelector('[data-feedback]');
    box.classList.remove('is-wrong');
    if (ex.type === 'choice') {
      Array.prototype.forEach.call(box.querySelectorAll('.choice-option'), function (b) {
        b.disabled = true;
        b.classList.remove('is-wrong', 'is-selected');
        if (parseInt(b.getAttribute('data-choice'), 10) === ex.answer) b.classList.add('is-correct');
      });
      box.classList.add('is-correct');
    } else {
      var inputs = box.querySelectorAll('.blank-input, .translate-input');
      if (ex.type === 'translate') {
        if (inputs[0]) {
          inputs[0].value = ex.answers[0] || '';
          inputs[0].disabled = true;
          inputs[0].classList.remove('is-wrong');
        }
      } else {
        Array.prototype.forEach.call(inputs, function (input, i) {
          input.value = (ex.answers && ex.answers[i] && ex.answers[i][0]) || '';
          input.disabled = true;
          input.classList.remove('is-wrong');
        });
      }
      box.classList.add('is-correct');
    }
    var answerText;
    if (ex.type === 'choice') answerText = ex.options[ex.answer];
    else if (ex.type === 'translate') answerText = (ex.answers || []).join(' / ');
    else {
      answerText = (ex.answers || []).map(function (a) {
        return Array.isArray(a) ? a[0] : a;
      }).join(' / ');
    }
    feedback.hidden = false;
    feedback.className = 'exercise-feedback is-revealed';
    feedback.textContent = tr('answerIs', { answer: answerText }) + ' ' + langText(ex.explain);
  }

  /* ----------------------------- Tutor ----------------------------- */
  function renderTutor(chapter) {
    var aside = el('aside', 'card lesson-tutor');
    var head = el('div', 'tutor-head');
    var title = el('div', '');

    title.appendChild(el('h2', '', tr('tutor')));
    head.appendChild(title);
    var dot = el('span', 'tutor-dot');
    dot.setAttribute('data-tutor-dot', '');
    head.appendChild(dot);
    aside.appendChild(head);
    aside.appendChild(el('p', 'muted small tutor-intro', tr('tutorIntro')));

    var presets = el('div', 'tutor-presets');
    [
      ['explain', tr('explain')],
      ['example', tr('example')],
      ['quiz', tr('quiz')],
      ['fix', tr('fix')]
    ].forEach(function (pair) {
      presets.appendChild(button(pair[1], 'tutor-preset', 'btn btn-subtle btn-sm', { preset: pair[0] }));
    });
    aside.appendChild(presets);

    var log = el('div', 'tutor-log');
    log.setAttribute('data-tutor-log', '');
    log.setAttribute('aria-live', 'polite');
    aside.appendChild(log);

    var status = el('p', 'tutor-status muted small');
    status.setAttribute('data-tutor-status', '');
    status.setAttribute('aria-live', 'polite');
    aside.appendChild(status);

    var notReady = el('div', 'tutor-not-ready');
    notReady.setAttribute('data-tutor-not-ready', '');
    notReady.hidden = true;
    notReady.appendChild(el('p', 'muted small', tr('notReady')));
    notReady.appendChild(button(tr('openSettings'), 'open-ai', 'btn btn-subtle btn-sm'));
    aside.appendChild(notReady);

    var composer = el('div', 'tutor-composer');
    var input = el('textarea', 'input tutor-input');
    input.id = 'grammarTutorInput';
    input.rows = 2;
    input.placeholder = tr('tutorPlaceholder');
    input.setAttribute('aria-label', tr('tutorPlaceholder'));
    input.maxLength = 1200;
    composer.appendChild(input);
    var composerActions = el('div', 'tutor-composer-actions');
    composerActions.appendChild(button(tr('send') + ' ↵', 'tutor-send', 'btn btn-primary btn-sm'));
    composerActions.appendChild(button(tr('clear'), 'tutor-clear', 'btn btn-ghost btn-sm'));
    composer.appendChild(composerActions);
    aside.appendChild(composer);
    return aside;
  }

  function renderTutorLog() {
    if (!state.root) return;
    var log = state.root.querySelector('[data-tutor-log]');
    if (!log) return;
    log.innerHTML = '';
    if (!state.tutor.messages.length) {
      log.appendChild(el('p', 'muted small tutor-empty', tr('emptyTutor')));
    } else {
      state.tutor.messages.forEach(function (msg) {
        var row = el('div', 'tutor-msg tutor-msg-' + msg.role);
        var label = el('span', 'tutor-msg-label', msg.role === 'user' ? tr('you') : tr('tutor'));
        row.appendChild(label);
        row.appendChild(el('p', 'tutor-msg-text', msg.text));
        log.appendChild(row);
      });
    }
    log.scrollTop = log.scrollHeight;
  }

  function setTutorStatus(text) {
    if (!state.root) return;
    var status = state.root.querySelector('[data-tutor-status]');
    if (status) status.textContent = text || '';
    var dot = state.root.querySelector('[data-tutor-dot]');
    if (dot) dot.classList.toggle('is-busy', !!text);
  }

  function setTutorBusy(busy) {
    if (!state.root) return;
    Array.prototype.forEach.call(state.root.querySelectorAll('[data-action="tutor-send"], [data-action="tutor-preset"]'), function (b) {
      b.disabled = busy;
    });
    var input = state.root.querySelector('#grammarTutorInput');
    if (input) input.disabled = busy;
    var notReady = state.root.querySelector('[data-tutor-not-ready]');
    if (notReady) notReady.hidden = !(state.opts.isAiReady && !state.opts.isAiReady());
  }

  function tutorSystem(chapter) {
    var language = state.lang === 'vi' ? 'Vietnamese' : 'English';
    var examples = [];
    (chapter.blocks || []).forEach(function (block) {
      if (block.type === 'examples' && block.items) {
        block.items.slice(0, 2).forEach(function (item) {
          examples.push(item.fr + ' — ' + (item.en || item.vi || ''));
        });
      }
    });
    return 'You are a patient French grammar tutor inside VocabLab. ' +
      'The learner is studying chapter ' + chapter.num + ' of a DELF B2 French tenses handbook: "' + chapter.title + '" (' + langText(chapter.subtitle) + '). ' +
      'Lesson summary: ' + langText(chapter.summary) + ' ' +
      (examples.length ? 'Useful examples: ' + examples.join(' | ') + '. ' : '') +
      'Answer in ' + language + '. Use plain text, not Markdown or headings. ' +
      'Use clear French examples with translations. ' +
      'Keep the answer under 180 words unless the learner asks for a full exercise set. ' +
      'If the learner asks for a quiz, give 3 short questions and do not reveal the answers yet. ' +
      'Do not change the subject; stay on this lesson.';
  }

  function sendTutor(prompt) {
    var chapter = state.chapterId ? chapterById(state.chapterId) : null;
    if (!chapter || !prompt || state.tutor.busy) return;
    if (state.opts.isAiReady && !state.opts.isAiReady()) {
      state.tutor.messages.push({ role: 'error', text: tr('notReady') });
      renderTutorLog();
      setTutorBusy(false);
      return;
    }
    if (typeof state.opts.askTutor !== 'function') {
      state.tutor.messages.push({ role: 'error', text: tr('tutorError') });
      renderTutorLog();
      return;
    }
    var generation = ++state.tutor.generation;
    state.tutor.messages.push({ role: 'user', text: prompt });
    state.tutor.busy = true;
    renderTutorLog();
    setTutorBusy(true);
    setTutorStatus(tr('thinking'));
    Promise.resolve(state.opts.askTutor(prompt, {
      system: tutorSystem(chapter),
      onWait: function (ms) {
        if (generation === state.tutor.generation) {
          setTutorStatus(tr('waiting', { n: Math.max(1, Math.round(ms / 1000)) }));
        }
      }
    })).then(function (res) {
      // Ignore a reply that arrives after the learner changed lesson or cleared it.
      if (generation !== state.tutor.generation) return;
      var text = typeof res === 'string' ? res : (res && res.text) || '';
      state.tutor.messages.push({ role: 'assistant', text: String(text || '').trim() || tr('tutorError') });
      state.tutor.busy = false;
      setTutorBusy(false);
      setTutorStatus('');
      renderTutorLog();
    }).catch(function (err) {
      if (generation !== state.tutor.generation) return;
      var message = (err && (err.friendly || err.message)) || tr('tutorError');
      state.tutor.messages.push({ role: 'error', text: String(message) });
      state.tutor.busy = false;
      setTutorBusy(false);
      setTutorStatus('');
      renderTutorLog();
    });
  }

  function sendTutorFromInput() {
    var input = state.root && state.root.querySelector('#grammarTutorInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    input.value = '';
    sendTutor(text);
  }

  function sendTutorPreset(kind) {
    var input = state.root && state.root.querySelector('#grammarTutorInput');
    if (kind === 'fix') {
      var sentence = input ? input.value.trim() : '';
      if (!sentence) {
        if (input) input.focus();
        setTutorStatus(tr('fixEmpty'));
        return;
      }
      if (input) input.value = '';
      sendTutor('Correct this French sentence and explain the tense. Keep the correction short:\n' + sentence);
      return;
    }
    var prompts = {
      explain: 'Explain the key point of this lesson simply, with one French example.',
      example: 'Give me two more French examples with translations that show this lesson.',
      quiz: 'Give me 3 short exercises about this lesson. Do not reveal the answers yet.'
    };
    sendTutor(prompts[kind] || prompts.explain);
  }

  function clearTutor() {
    state.tutor.generation++;
    state.tutor.messages = [];
    state.tutor.busy = false;
    renderTutorLog();
    setTutorBusy(false);
    setTutorStatus('');
  }

  /* ----------------------------- Navigation ----------------------------- */
  function openCourse() {
    if (!state.root) state.root = document.getElementById('screenGrammar');
    state.tutor.generation++;
    state.tutor.messages = [];
    state.tutor.busy = false;
    renderCourse();
    scrollTop();
    notifyProgress();
  }

  /** Jump straight to the first unfinished chapter (used by the grammar quest). */
  function openNextLesson() {
    for (var i = 0; i < DATA.chapters.length; i++) {
      if (!chapterDone(DATA.chapters[i].id)) {
        openLesson(DATA.chapters[i].id);
        return;
      }
    }
    openCourse();
  }

  function openLesson(id) {
    if (!chapterById(id)) return;
    if (!state.root) state.root = document.getElementById('screenGrammar');
    state.chapterId = id;
    state.view = 'lesson';
    state.tutor.generation++;
    state.tutor.messages = [];
    state.tutor.busy = false;
    if (U.lsSet) U.lsSet(lastKey(), id);
    renderLesson();
    scrollTop();
    notifyProgress();
  }

  function setLang(lang) {
    if (lang !== 'vi' && lang !== 'en') return;
    if (state.lang === lang) return;
    state.lang = lang;
    if (U.lsSet) U.lsSet('grammarLang', lang);
    var y = global.scrollY || 0;
    if (state.view === 'lesson' && state.chapterId) renderLesson();
    else renderCourse();
    try { global.scrollTo(0, y); } catch (e) { /* ignore */ }
  }

  function onClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
    if (!target || !state.root.contains(target)) return;
    var action = target.getAttribute('data-action');
    if (action === 'open-lesson') {
      openLesson(target.getAttribute('data-id'));
    } else if (action === 'course') {
      openCourse();
    } else if (action === 'exit') {
      if (typeof state.opts.onExit === 'function') state.opts.onExit();
    } else if (action === 'set-lang') {
      setLang(target.getAttribute('data-lang'));
    } else if (action === 'check') {
      checkExercise(parseInt(target.getAttribute('data-ex'), 10));
    } else if (action === 'show-answer') {
      showAnswer(parseInt(target.getAttribute('data-ex'), 10));
    } else if (action === 'choice') {
      var exIndex = parseInt(target.getAttribute('data-ex'), 10);
      var box = target.closest('.exercise');
      if (box) {
        Array.prototype.forEach.call(box.querySelectorAll('.choice-option'), function (b) {
          b.classList.remove('is-selected', 'is-wrong');
        });
        target.classList.add('is-selected');
        checkExercise(exIndex);
      }
    } else if (action === 'toggle-complete') {
      if (state.chapterId) markChapter(state.chapterId, !chapterDone(state.chapterId));
    } else if (action === 'tutor-send') {
      sendTutorFromInput();
    } else if (action === 'tutor-preset') {
      sendTutorPreset(target.getAttribute('data-preset'));
    } else if (action === 'tutor-clear') {
      clearTutor();
    } else if (action === 'open-ai') {
      if (typeof state.opts.openSettings === 'function') state.opts.openSettings();
    } else if (action === 'speak') {
      var say = target.getAttribute('data-say');
      if (say && U.speak) U.speak(say, 'fr-FR');
    }
  }

  function onKeyDown(event) {
    var target = event.target;
    if (!target) return;
    if (target.classList && (target.classList.contains('blank-input') || target.classList.contains('translate-input')) && event.key === 'Enter') {
      var box = target.closest('.exercise');
      if (box) {
        event.preventDefault();
        checkExercise(parseInt(box.getAttribute('data-ex'), 10));
      }
    }
    if (target.id === 'grammarTutorInput' && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      sendTutorFromInput();
    }
  }

  function useCourse(id) {
    if (!id || !COURSES[id]) return false;
    if (id !== courseId) {
      courseId = id;
      DATA = COURSES[id];
      state.chapterId = null;
      state.view = 'course';
    }
    return true;
  }

  /** Another course's progress, without touching the course on screen. */
  function courseSummary(id) {
    return COURSES[id] ? summaryFor(COURSES[id], id) : null;
  }

  function openCourseById(id) {
    if (!useCourse(id)) return false;
    openCourse();
    return true;
  }

  function init(opts) {
    state.opts = opts || {};
    state.root = state.opts.screen || document.getElementById('screenGrammar');
    var saved = U.lsGet ? U.lsGet('grammarLang', 'vi') : 'vi';
    state.lang = saved === 'en' ? 'en' : 'vi';
    if (state.root) {
      state.root.addEventListener('click', onClick);
      state.root.addEventListener('keydown', onKeyDown);
    }
  }

  global.Grammar = {
    data: DATA,
    chapters: DATA.chapters,
    courses: COURSES,
    courseId: function () { return courseId; },
    useCourse: useCourse,
    courseSummary: courseSummary,
    openCourseById: openCourseById,
    init: init,
    openCourse: openCourse,
    openLesson: openLesson,
    openNextLesson: openNextLesson,
    progressSummary: progressSummary
  };
})(typeof window !== 'undefined' ? window : globalThis);
