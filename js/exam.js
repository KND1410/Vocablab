/* =========================================================
   VocabLab — js/exam.js
   DELF B2 exam paper: 24h session, tick boxes, audio, essay.
   ========================================================= */
(function (global) {
  'use strict';

  const U = global.Util;
  const KEY_PREFIX = 'exam.';
  const LANG_NAMES = { en: 'English', vi: 'Vietnamese', fr: 'French' };

  let api = null;
  let exam = null;
  let state = null;
  let view = 'list'; // list → detail → paper / review
  let root = null;
  let ticker = null;
  let feedbackBusy = false;
  let mounted = false;

  function t(key, vars) {
    return global.I18n ? global.I18n.t(key, vars) : key;
  }

  function esc(value) {
    return U && U.esc ? U.esc(value) : String(value == null ? '' : value);
  }

  function storageKey(id) { return KEY_PREFIX + id; }

  function now() { return Date.now(); }

  function newSession(item) {
    const startedAt = now();
    return {
      examId: item.id,
      startedAt: startedAt,
      expiresAt: startedAt + (item.hours || 24) * 3600 * 1000,
      answers: {},
      essay: '',
      feedback: '',
      savedAt: startedAt
    };
  }

  function save() {
    if (!state || !U) return;
    state.savedAt = now();
    U.lsSet(storageKey(state.examId), state);
  }

  /** Read a saved attempt without creating one. */
  function peekSession(item) {
    const raw = U ? U.lsGet(storageKey(item.id), null) : null;
    if (!raw || raw.examId !== item.id || !raw.expiresAt) return { state: null, expired: false };
    if (now() >= raw.expiresAt) {
      // A lapsed attempt keeps its marker (so the list can say “expired”) but
      // never keeps the answers or the essay.
      raw.answers = {};
      raw.essay = '';
      raw.feedback = '';
      U.lsSet(storageKey(item.id), raw);
      return { state: null, expired: true };
    }
    if (!raw.answers || typeof raw.answers !== 'object') raw.answers = {};
    if (typeof raw.essay !== 'string') raw.essay = '';
    return { state: raw, expired: false };
  }

  /** Begin a fresh 24-hour attempt, or resume one that is still running. */
  function openDetail(item) {
    if (!item) return;
    exam = item;
    state = null;
    view = 'detail';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function beginExam(item) {
    const found = peekSession(item);
    exam = item;
    feedbackBusy = false;
    if (found.state) {
      state = found.state;
    } else {
      state = newSession(item);
      save();
      if (found.expired && api && api.toast) api.toast(t('exam.expiredToast'), 'warn', 8000);
    }
    view = 'paper';
    render();
    if (root) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function questionsOf(item) {
    const out = [];
    (item.parts || []).forEach(function (part) {
      (part.exercises || []).forEach(function (ex) {
        (ex.questions || []).forEach(function (q) { out.push({ part: part, ex: ex, q: q }); });
      });
    });
    return out;
  }

  function answeredCount() {
    if (!state) return 0;
    return questionsOf(exam).filter(function (row) {
      return state.answers[row.q.id] != null;
    }).length;
  }

  function selectedLabel(q) {
    const id = state.answers[q.id];
    if (id == null) return '';
    const found = (q.options || []).filter(function (o) { return o.id === id; })[0];
    return found ? found.label : '';
  }

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function fmtPoints(n) {
    const text = String(n).replace('.', ',');
    return text + ' ' + (n === 1 ? 'point' : 'points');
  }

  function fmtClock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- HTML ---------- */

  function audioBlock(ex) {
    const piste = ex.piste ? 'Piste ' + ex.piste : '';
    return '<div class="exam-audio">' +
      '<div class="exam-audio-head"><span class="exam-audio-ico" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>' +
      '</span><span class="exam-audio-label">' + esc(piste) + '</span>' +
      '<span class="muted tiny">' + esc(t('exam.listenFree')) + '</span></div>' +
      '<audio class="exam-player" controls preload="none" src="' + esc(ex.src) + '"></audio>' +
      '<p class="exam-audio-missing" hidden></p>' +
      '</div>';
  }

  function questionBlock(q, index) {
    const chosen = state.answers[q.id];
    const opts = (q.options || []).map(function (o) {
      const checked = chosen === o.id ? ' checked' : '';
      return '<label class="exam-opt' + (checked ? ' is-chosen' : '') + '">' +
        '<input type="radio" name="' + esc(q.id) + '" value="' + esc(o.id) + '"' + checked + '>' +
        '<span class="exam-tick" aria-hidden="true"></span>' +
        '<span class="exam-opt-label">' + esc(o.label) + '</span>' +
        '</label>';
    }).join('');
    return '<div class="exam-q" data-q="' + esc(q.id) + '" role="radiogroup" id="' + esc(q.id) + '-group" aria-labelledby="' + esc(q.id) + '-label">' +
      '<div class="exam-legend" id="' + esc(q.id) + '-label">' +
      '<span class="exam-q-num">' + (index + 1) + '</span>' +
      '<span class="exam-q-text">' + esc(q.text) + '</span>' +
      '<span class="exam-q-pts" title="' + esc(fmtPoints(q.points)) + '">' + String(q.points).replace('.', ',') + ' pt</span>' +
      '</div>' +
      '<div class="exam-options">' + opts + '</div>' +
      '</div>';
  }

  function exerciseBlock(ex, partId) {
    let body = '';
    if (ex.documents && ex.documents.length) {
      let currentDoc = null;
      ex.questions.forEach(function (q, i) {
        if (q.doc !== currentDoc) {
          currentDoc = q.doc;
          const doc = (ex.documents || []).filter(function (d) { return d.number === q.doc; })[0];
          body += '<div class="exam-doc-head">' + esc(doc ? doc.label : 'Document ' + q.doc) + '</div>';
        }
        body += questionBlock(q, i);
      });
    } else {
      body = ex.questions.map(function (q, i) { return questionBlock(q, i); }).join('');
    }

    let reading = '';
    if (ex.text) {
      const text = ex.text;
      const blocks = (text.blocks || []).map(function (b) {
        if (b.h) return '<h4 class="exam-article-h">' + esc(b.h) + '</h4>';
        return '<p>' + esc(b.p) + '</p>';
      }).join('');
      const people = (text.people || []).map(function (p) {
        return '<div class="exam-person"><h4>' + esc(p.name) + '</h4><p>' + esc(p.text) + '</p></div>';
      }).join('');
      const meta = [text.author, text.date].filter(Boolean).join(' · ');
      reading = '<details class="exam-read" open>' +
        '<summary><span>' + esc(t('exam.readText')) + '</span><span class="exam-read-title">' + esc(text.title || '') + '</span></summary>' +
        '<div class="exam-article">' +
        '<h3>' + esc(text.title || '') + '</h3>' +
        (meta ? '<p class="exam-article-meta">' + esc(meta) + (text.source ? ' — ' + esc(text.source) : '') + '</p>' : '') +
        (text.intro ? '<p class="exam-article-intro">' + esc(text.intro) + '</p>' : '') +
        blocks + people +
        (text.source ? '<p class="exam-source">Source : ' + esc(text.source) + '</p>' : '') +
        '</div></details>';
    }

    return '<article class="exam-ex" data-ex="' + esc(ex.id) + '">' +
      '<div class="exam-ex-head">' +
      '<div class="exam-ex-title"><span class="exam-badge">Exercice ' + ex.number + '</span>' +
      (ex.title ? '<h3>' + esc(ex.title) + '</h3>' : '') +
      '<span class="exam-pill exam-pill-pts">' + esc(fmtPoints(ex.total)) + '</span></div>' +
      (ex.plays ? '<p class="muted small exam-instruction">' + esc(ex.plays) + '</p>' : '') +
      (ex.instruction ? '<p class="muted small exam-instruction">' + esc(ex.instruction) + '</p>' : '') +
      (ex.intro ? '<p class="muted small exam-instruction">' + esc(ex.intro) + '</p>' : '') +
      '</div>' +
      (ex.audio ? audioBlock(ex) : '') +
      reading +
      '<div class="exam-questions">' + body + '</div>' +
      '</article>';
  }

  function partBlock(part, index) {
    if (part.essay) return essayBlock(part, index);
    const exercises = (part.exercises || []).map(function (ex) {
      return exerciseBlock(ex, part.id);
    }).join('');
    return '<section class="exam-part" id="examPart-' + esc(part.id) + '">' +
      '<div class="exam-part-head">' +
      '<span class="exam-part-num">' + (index + 1) + '</span>' +
      '<div class="exam-part-title"><h2>' + esc(part.title) + '</h2>' +
      '<p class="muted small">' + esc(t('exam.partMeta', { n: part.exercises.length, p: part.points })) + '</p></div>' +
      '</div>' + exercises + '</section>';
  }

  function essayBlock(part, index) {
    const essay = part.essay;
    const words = wordCount(state.essay);
    const cls = words >= essay.minWords ? ' is-target' : '';
    return '<section class="exam-part" id="examPart-production">' +
      '<div class="exam-part-head">' +
      '<span class="exam-part-num">' + (index + 1) + '</span>' +
      '<div class="exam-part-title"><h2>' + esc(part.title) + '</h2>' +
      '<p class="muted small">' + esc(t('exam.essayMeta', { p: part.points, n: essay.minWords })) + '</p></div>' +
      '</div>' +
      '<article class="exam-ex exam-ex-essay">' +
      '<div class="exam-ex-head"><div class="exam-ex-title"><span class="exam-badge">Exercice 1</span>' +
      '<h3>' + esc(t('exam.essayTitle')) + '</h3></div></div>' +
      '<p class="exam-prompt">' + esc(essay.prompt) + '</p>' +
      '<p class="muted tiny">' + esc(essay.note) + '</p>' +
      '<p class="muted tiny exam-method">' + esc(t('exam.methodNote')) + '</p>' +
      '<div class="exam-essay">' +
      '<label class="field-label" for="examEssay">' + esc(t('exam.essayLabel')) + '</label>' +
      '<textarea id="examEssay" class="input exam-textarea" rows="14" spellcheck="true" ' +
      'placeholder="' + esc(t('exam.essayPlaceholder')) + '">' + esc(state.essay) + '</textarea>' +
      '<div class="exam-essay-bar">' +
      '<span class="pill' + cls + '" id="examWordCount">' + esc(t('exam.wordCount', { n: words, target: essay.minWords })) + '</span>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-subtle btn-sm" data-act="feedback"' + (feedbackBusy ? ' disabled' : '') + '>' +
      esc(feedbackBusy ? t('exam.feedbackBusy') : t('exam.feedback')) + '</button>' +
      '</div></div>' +
      '<div id="examFeedback" class="exam-feedback"' + (state.feedback ? '' : ' hidden') + '></div>' +
      '</div></article></section>';
  }

  function reviewBlock() {
    const rows = questionsOf(exam).map(function (row) {
      const label = selectedLabel(row.q);
      return '<li class="exam-review-row' + (label ? '' : ' is-empty') + '">' +
        '<span class="exam-review-q"><span class="exam-review-num">' + row.q.n + '</span>' + esc(row.q.text) + '</span>' +
        '<span class="exam-review-a">' + (label ? esc(label) : '<em>' + esc(t('exam.notAnswered')) + '</em>') + '</span></li>';
    }).join('');
    const words = wordCount(state.essay);
    const essay = exam.parts.filter(function (p) { return p.essay; })[0];
    const essayPart = essay ? '<div class="exam-review-essay">' +
      '<h3>' + esc(essay.essay.title) + '</h3>' +
      '<p class="muted small">' + esc(t('exam.wordCount', { n: words, target: essay.essay.minWords })) + '</p>' +
      (state.essay.trim() ? '<details class="exam-review-text"><summary>' + esc(t('exam.reviewEssay')) + '</summary><p>' + esc(state.essay) + '</p></details>'
        : '<p class="muted small">' + esc(t('exam.essayEmpty')) + '</p>') +
      '<div id="examFeedback" class="exam-feedback"' + (state.feedback ? '' : ' hidden') + '></div>' +
      '</div>' : '';
    return '<div class="exam-review" data-i18n-skip>' +
      '<div class="exam-review-head"><div><h2>' + esc(t('exam.reviewTitle')) + '</h2>' +
      '<p class="muted small">' + esc(t('exam.reviewSub', { n: answeredCount(), total: questionsOf(exam).length })) + '</p></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-subtle btn-sm" data-act="paper">' + esc(t('exam.backToPaper')) + '</button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="feedback">' + esc(t('exam.feedback')) + '</button></div></div>' +
      '<p class="exam-review-note">' + esc(t('exam.reviewNote')) + '</p>' +
      '<ul class="exam-review-list">' + rows + '</ul>' + essayPart +
      '</div>';
  }

  /* ---------- Exam catalogue and overview ---------- */

  function statusPill(item) {
    const peek = peekSession(item);
    if (peek.state) {
      return '<span class="exam-status is-active">' + esc(t('exam.statusActive', { time: fmtClock(peek.state.expiresAt - now()).slice(0, 5) })) + '</span>';
    }
    if (peek.expired) return '<span class="exam-status is-expired">' + esc(t('exam.statusExpired')) + '</span>';
    return '<span class="exam-status">' + esc(t('exam.statusReady')) + '</span>';
  }

  function audioCount(item) {
    let n = 0;
    (item.parts || []).forEach(function (part) {
      (part.exercises || []).forEach(function (ex) { if (ex.audio) n += 1; });
    });
    return n;
  }

  function catalogueCard(item) {
    const peek = peekSession(item);
    const audio = audioCount(item);
    return '<article class="exam-choice" data-exam-card="' + esc(item.id) + '">' +
      '<div class="exam-choice-head">' +
      '<span class="exam-choice-num">' + item.number + '</span>' +
      '<div class="exam-choice-title" data-i18n-skip>' +
      '<p class="exam-choice-level">' + esc(item.level) + '</p>' +
      '<h2>' + esc(item.title) + '</h2>' +
      '<p class="muted small">' + esc(item.subtitle) + '</p>' +
      '</div>' + statusPill(item) + '</div>' +
      '<div class="exam-choice-meta">' +
      '<span class="pill">' + esc(t('exam.questionPill', { n: item.questionCount })) + '</span>' +
      '<span class="pill">' + esc(t('exam.pointPill', { n: item.points })) + '</span>' +
      (audio ? '<span class="pill">' + esc(t('exam.audioPill', { n: audio })) + '</span>' : '') +
      '<span class="pill">' + esc(t('exam.hoursPill', { n: item.hours })) + '</span>' +
      '</div>' +
      '<div class="exam-choice-foot">' +
      '<span class="muted tiny">' + esc(t('exam.startNoteShort')) + '</span>' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="open" data-exam="' + esc(item.id) + '">' +
      esc(peek.state ? t('exam.continue') : t('exam.open')) + '</button>' +
      '</div></article>';
  }

  function listBlock() {
    const exams = (global.ExamData && global.ExamData.list) || [];
    const cards = exams.map(catalogueCard).join('');
    return '<div class="exam-page exam-catalogue">' +
      '<header class="exam-hero">' +
      '<div class="exam-hero-main">' +
      '<p class="page-kicker">' + esc(t('exam.catalogueKicker')) + '</p>' +
      '<h1>' + esc(t('exam.catalogueTitle')) + '</h1>' +
      '<p class="muted exam-hero-sub">' + esc(t('exam.catalogueSub')) + '</p>' +
      '<div class="exam-meta-row"><span class="pill">' + esc(t('exam.paperCount', { n: exams.length })) + '</span>' +
      '<span class="pill">' + esc(t('exam.hoursPill', { n: 24 })) + '</span></div>' +
      '</div></header>' +
      (cards ? '<div class="exam-choice-list">' + cards + '</div>' : '<p class="muted">' + esc(t('exam.noPapers')) + '</p>') +
      '</div>';
  }

  function detailBlock() {
    const peek = peekSession(exam);
    const audio = audioCount(exam);
    const parts = exam.parts.map(function (part, i) {
      const meta = part.essay
        ? t('exam.essayMeta', { p: part.points, n: part.essay.minWords })
        : t('exam.partMeta', { n: (part.exercises || []).length, p: part.points });
      return '<li class="exam-detail-part">' +
        '<span class="exam-part-num">' + (i + 1) + '</span>' +
        '<div class="exam-detail-part-body" data-i18n-skip><h3>' + esc(part.title) + '</h3>' +
        '<p class="muted small">' + esc(meta) + '</p></div>' +
        '<span class="pill">' + esc(t('exam.pointPill', { n: part.points })) + '</span></li>';
    }).join('');
    return '<div class="exam-page exam-detail">' +
      '<div class="exam-back-row"><button type="button" class="btn btn-ghost btn-sm" data-act="list">← ' + esc(t('exam.allExams')) + '</button></div>' +
      '<header class="exam-hero">' +
      '<div class="exam-hero-main">' +
      '<p class="page-kicker">' + esc(t('exam.detailsKicker', { level: exam.level })) + '</p>' +
      '<h1 data-i18n-skip>' + esc(exam.title) + '</h1>' +
      '<p class="muted exam-hero-sub" data-i18n-skip>' + esc(exam.subtitle) + '</p>' +
      '<div class="exam-meta-row">' +
      '<span class="pill">' + esc(t('exam.questionPill', { n: exam.questionCount })) + '</span>' +
      '<span class="pill">' + esc(t('exam.pointPill', { n: exam.points })) + '</span>' +
      (audio ? '<span class="pill">' + esc(t('exam.audioPill', { n: audio })) + '</span>' : '') +
      '<span class="pill">' + esc(t('exam.hoursPill', { n: exam.hours })) + '</span>' +
      '</div></div>' +
      '<div class="exam-hero-actions">' + statusPill(exam) +
      '<button type="button" class="btn btn-primary" data-act="start">' + esc(peek.state ? t('exam.continue') : t('exam.start')) + '</button>' +
      '</div></header>' +
      '<section class="exam-detail-parts"><h2>' + esc(t('exam.partsTitle')) + '</h2>' +
      '<ol class="exam-detail-list">' + parts + '</ol></section>' +
      '<div class="exam-detail-note">' +
      '<p>' + esc(t('exam.startNote')) + '</p>' +
      '<p class="muted tiny exam-method">' + esc(t('exam.methodNote')) + '</p>' +
      '<p class="muted small">' + esc(t('exam.noKeyNote')) + '</p>' +
      '</div></div>';
  }

  function shell() {
    const answered = answeredCount();
    const total = questionsOf(exam).length;
    const parts = exam.parts.map(function (part, i) { return partBlock(part, i); }).join('');
    return '<div class="exam-page">' +
      '<header class="exam-hero">' +
      '<div class="exam-hero-main">' +
      '<p class="page-kicker">' + esc(t('exam.kicker', { level: exam.level })) + '</p>' +
      '<h1 data-i18n-skip>' + esc(exam.title) + '</h1>' +
      '<p class="muted exam-hero-sub" data-i18n-skip>' + esc(exam.subtitle) + '</p>' +
      '<div class="exam-meta-row">' +
      '<span class="pill">' + esc(t('exam.questionPill', { n: total })) + '</span>' +
      '<span class="pill">' + esc(t('exam.pointPill', { n: exam.points })) + '</span>' +
      '<span class="pill pill-ok" id="examTimer" title="' + esc(t('exam.timerTitle')) + '">' + fmtClock(state.expiresAt - now()) + '</span>' +
      '</div></div>' +
      '<div class="exam-hero-actions">' +
      '<span class="pill exam-answered-pill" id="examAnswered">' + esc(t('exam.answeredPill', { n: answered, total: total })) + '</span>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="list">' + esc(t('exam.allExams')) + '</button>' +
      '<button type="button" class="btn btn-subtle btn-sm" data-act="review">' + esc(t('exam.review')) + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="reset">' + esc(t('exam.startOver')) + '</button>' +
      '</div></div></header>' +
      '<div class="exam-body">' +
      '<nav class="exam-jump" aria-label="' + esc(t('exam.jump')) + '" data-i18n-skip>' +
      exam.parts.map(function (part, i) {
        return '<button type="button" class="exam-jump-link" data-jump="examPart-' + esc(part.id) + '">' +
          '<span class="exam-jump-num">' + (i + 1) + '</span>' + esc(part.title) + '</button>';
      }).join('') +
      '</nav>' +
      '<div class="exam-paper" data-i18n-skip>' + parts +
      '<div class="exam-foot">' +
      '<div class="muted small">' + esc(t('exam.footSession')) + '</div>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-subtle btn-sm" data-act="review">' + esc(t('exam.review')) + '</button>' +
      '</div></div></div></div></div>';
  }

  /* ---------- Rendering ---------- */

  function hydrateFeedback() {
    if (!state || !state.feedback) return;
    const box = document.getElementById('examFeedback');
    if (!box) return;
    box.textContent = state.feedback;
    box.hidden = false;
  }

  function updateCounts() {
    const pill = document.getElementById('examAnswered');
    if (pill) pill.textContent = t('exam.answeredPill', { n: answeredCount(), total: questionsOf(exam).length });
    const words = document.getElementById('examWordCount');
    if (words) {
      const essay = exam.parts.filter(function (p) { return p.essay; })[0];
      if (essay) {
        const n = wordCount(state.essay);
        words.textContent = t('exam.wordCount', { n: n, target: essay.essay.minWords });
        words.classList.toggle('is-target', n >= essay.essay.minWords);
      }
    }
  }

  function updateTimer() {
    const el = document.getElementById('examTimer');
    if (!el || !state || view !== 'paper') return;
    const left = state.expiresAt - now();
    if (left <= 0) {
      // The attempt is void after 24 hours: drop the answers and return to the
      // overview so the learner explicitly starts a fresh attempt.
      state = null;
      view = 'detail';
      render();
      if (api && api.toast) api.toast(t('exam.expiredToast'), 'warn', 8000);
      return;
    }
    el.textContent = fmtClock(left);
  }

  /**
   * A player whose file is missing (404, no network, another device that
   * cannot reach this server) fails silently: the button just does nothing.
   * Say so instead, and clear the warning if a later attempt plays.
   */
  function bindAudio() {
    const players = root.querySelectorAll('.exam-player');
    for (let i = 0; i < players.length; i++) {
      const a = players[i];
      if (a.dataset.audioBound) continue;
      a.dataset.audioBound = '1';
      const note = a.parentNode && a.parentNode.querySelector('.exam-audio-missing');
      a.addEventListener('error', function () {
        if (!note) return;
        note.hidden = false;
        note.textContent = t('exam.audioMissing');
      });
      a.addEventListener('playing', function () {
        if (note) { note.hidden = true; note.textContent = ''; }
      });
      a.addEventListener('loadedmetadata', function () {
        if (note && !note.hidden && isFinite(a.duration) && a.duration > 0) {
          note.hidden = true;
          note.textContent = '';
        }
      });
    }
  }

  function render() {
    if (!root) return;
    if (!exam || view === 'list') {
      root.innerHTML = listBlock();
      return;
    }
    if (view === 'detail' || !state) {
      view = 'detail';
      root.innerHTML = detailBlock();
      return;
    }
    root.innerHTML = view === 'review' ? reviewBlock() : shell();
    hydrateFeedback();
    if (view === 'paper') { updateTimer(); bindAudio(); }
  }

  function mount() {
    root = document.getElementById('examRoot');
    if (!root) return;
    if (!mounted) {
      mounted = true;
      root.addEventListener('change', function (ev) {
        const input = ev.target;
        if (!input || input.type !== 'radio' || !input.name || !state) return;
        state.answers[input.name] = input.value;
        save();
        const field = input.closest ? input.closest('.exam-q') : null;
        if (field) {
          U.$$('.exam-opt', field).forEach(function (label) { label.classList.toggle('is-chosen', !!label.querySelector('input:checked')); });
        }
        updateCounts();
      });
      root.addEventListener('input', function (ev) {
        if (!state || !ev.target || ev.target.id !== 'examEssay') return;
        state.essay = ev.target.value;
        save();
        updateCounts();
      });
      root.addEventListener('click', function (ev) {
        const jump = ev.target.closest ? ev.target.closest('[data-jump]') : null;
        if (jump && root.contains(jump)) {
          const target = document.getElementById(jump.getAttribute('data-jump'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        const btn = ev.target.closest ? ev.target.closest('[data-act]') : null;
        const card = !btn && ev.target.closest ? ev.target.closest('[data-exam-card]') : null;
        if (card && root.contains(card)) {
          openDetail(global.ExamData && global.ExamData.byId[card.getAttribute('data-exam-card')]);
          return;
        }
        if (!btn || !root.contains(btn)) return;
        const act = btn.getAttribute('data-act');
        if (act === 'open') {
          const id = btn.getAttribute('data-exam');
          openDetail(global.ExamData && global.ExamData.byId[id]);
        } else if (act === 'start') {
          if (exam) beginExam(exam);
        } else if (act === 'list') {
          view = 'list';
          exam = null;
          state = null;
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (act === 'review' && state) {
          view = 'review';
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (act === 'paper' && state) {
          view = 'paper';
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (act === 'reset') {
          resetSession(true);
        } else if (act === 'feedback') {
          runFeedback();
        }
      });
      document.addEventListener('vocablab:language', function () {
        if (root && !root.hidden) render();
      });
      if (ticker) clearInterval(ticker);
      ticker = setInterval(updateTimer, 1000);
    }
    render();
  }

  function resetSession(ask) {
    if (!exam) return false;
    if (ask) {
      const ok = global.confirm(t('exam.resetConfirm'));
      if (!ok) return false;
    }
    state = newSession(exam);
    U.lsSet(storageKey(exam.id), state);
    view = 'paper';
    feedbackBusy = false;
    render();
    if (ask) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (api && api.toast) api.toast(t('exam.resetDone'), 'ok');
    }
    return true;
  }

  /* ---------- AI feedback ---------- */

  function feedbackPrompt() {
    const essay = exam.parts.filter(function (p) { return p.essay; })[0].essay;
    const words = wordCount(state.essay);
    const lang = global.I18n ? global.I18n.lang() : 'en';
    if (global.ExamGuide && global.ExamGuide.buildFeedbackPrompt) {
      return global.ExamGuide.buildFeedbackPrompt({
        task: essay.prompt,
        essay: state.essay,
        words: words,
        language: lang,
        type: essay.type
      });
    }
    // Fallback if the guide did not load: still score content and form.
    return {
      system: 'Tu es un examinateur du DELF B2. Réponds uniquement en ' + (LANG_NAMES[lang] || 'English') + '.',
      prompt: 'CONSIGNE :\n' + essay.prompt + '\n\nPRODUCTION DU CANDIDAT (' + words + ' mots) :\n"""\n' + state.essay + '\n"""\n\n' +
        'Évalue le contenu (14 points) et la forme (11 points), donne une estimation sur 25, trois corrections précises et deux priorités.'
    };
  }

  async function runFeedback() {
    if (!state || feedbackBusy) return;
    if (!state.essay.trim()) {
      if (api && api.toast) api.toast(t('exam.feedbackEmpty'), 'warn');
      return;
    }
    if (!api || !api.askTutor || !api.aiReady || !api.aiReady()) {
      if (api && api.toast) api.toast(t('exam.feedbackNoAi'), 'bad', 9000);
      return;
    }
    feedbackBusy = true;
    render();
    try {
      const built = feedbackPrompt();
      const res = await api.askTutor(built.prompt, { system: built.system, maxTokens: 1400, temperature: 0.35 });
      state.feedback = String((res && res.text) || '').trim();
      save();
      feedbackBusy = false;
      render();
      const box = document.getElementById('examFeedback');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      feedbackBusy = false;
      render();
      const message = (err && (err.friendly || err.message)) || t('exam.feedbackError');
      if (api && api.toast) api.toast(message, 'bad', 9000);
    }
  }

  /* ---------- Public ---------- */

  function init(hooks) {
    api = hooks || {};
    // No session is created here: the clock starts only when the learner
    // chooses a paper and presses Start.
  }

  function renderRoute() {
    mount();
  }

  global.Exam = {
    init: init,
    render: renderRoute,
    reset: function () { return resetSession(true); },
    storageKey: storageKey,
    questions: function () { return questionsOf(exam); },
    wordCount: wordCount,
    state: function () { return state; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
