/* =========================================================
   VocabLab — quests.js
   Daily quest definitions, deterministic daily selection,
   HP-style progress and the daily streak rules.

   Shared by the browser and the API (UMD): the server and
   the client must generate the same three quests for a user
   and a local date, even when one of them is offline.
   ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Quests = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Definitions ---------- */
  /* group: one quest per group is picked every day.
     quiz       — answer questions
     production — write or speak
     review     — light review / course work */
  var TYPES = [
    {
      id: 'mc30', group: 'quiz', mode: 'quiz', icon: '🎯', target: 30,
      title: 'Multiple choice ×30',
      desc: 'Answer 30 multiple-choice questions.'
    },
    {
      id: 'mixed20', group: 'quiz', mode: 'quiz', icon: '🧩', target: 20,
      title: 'Mixed quiz ×20',
      desc: 'Answer 20 questions in any format.'
    },
    {
      id: 'correct10', group: 'quiz', mode: 'quiz', icon: '✅', target: 10,
      title: '10 correct answers',
      desc: 'Get 10 answers right in any quiz.'
    },
    {
      id: 'paragraph1', group: 'production', mode: 'paragraph', icon: '✍️', target: 1,
      title: 'Paragraph translation',
      desc: 'Translate one AI-written paragraph.'
    },
    {
      id: 'shadow3', group: 'production', mode: 'shadowing', icon: '🎙️', target: 3,
      title: 'Shadowing ×3',
      desc: 'Record three sentences out loud.'
    },
    {
      id: 'cards20', group: 'review', mode: 'flashcards', icon: '🃏', target: 20,
      title: 'Flashcards ×20',
      desc: 'Review 20 cards with Again or Got it.'
    },
    {
      id: 'grammar1', group: 'review', mode: 'grammar', icon: '📖', target: 1,
      title: 'Grammar lesson',
      desc: 'Finish one French tenses lesson.'
    }
  ];

  var BY_ID = {};
  TYPES.forEach(function (t) { BY_ID[t.id] = t; });

  /* ---------- Dates ---------- */
  /* Local date keys, never UTC: the day changes at the user's midnight. */
  var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function isDateKey(value) {
    var m = DATE_RE.exec(String(value || ''));
    if (!m) return false;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
    var probe = new Date(Date.UTC(y, mo - 1, d));
    return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
  }

  function dateKey(date) {
    var d = date || new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function utcOf(key) {
    var m = DATE_RE.exec(String(key || ''));
    if (!m) return NaN;
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }

  /** Calendar days from `a` to `b` (positive when b is later). */
  function daysBetween(a, b) {
    var ua = utcOf(a), ub = utcOf(b);
    if (isNaN(ua) || isNaN(ub)) return NaN;
    return Math.round((ub - ua) / 86400000);
  }

  function addDays(key, n) {
    var t = utcOf(key);
    if (isNaN(t)) return '';
    var d = new Date(t + (n || 0) * 86400000);
    var pad = function (x) { return x < 10 ? '0' + x : String(x); };
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /* ---------- Deterministic selection ---------- */
  function hashString(str) {
    var h = 2166136261;
    var s = String(str || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWith(list, rnd) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  var GROUPS = ['quiz', 'production', 'review'];

  /** The ids picked for a profile + local date. Same inputs = same quests. */
  function pick(seed, day) {
    var out = [];
    GROUPS.forEach(function (group) {
      var ids = TYPES.filter(function (t) { return t.group === group; })
        .map(function (t) { return t.id; });
      var rnd = mulberry32(hashString(String(seed) + '|' + day + '|' + group));
      out.push(shuffleWith(ids, rnd)[0]);
    });
    return out;
  }

  function defaultStreak() {
    return { current: 0, best: 0, lastCompletedDate: '' };
  }

  function newDaily(seed, day) {
    var quests = pick(seed, day).map(function (id) {
      var def = BY_ID[id];
      return { id: id, target: def.target, progress: 0, done: false };
    });
    return { date: day, quests: quests, allDone: false, completedAt: null };
  }

  /* ---------- Progress ---------- */
  function findQuest(daily, id) {
    if (!daily || !Array.isArray(daily.quests)) return null;
    for (var i = 0; i < daily.quests.length; i++) {
      if (daily.quests[i].id === id) return daily.quests[i];
    }
    return null;
  }

  function isAllDone(daily) {
    if (!daily || !Array.isArray(daily.quests) || !daily.quests.length) return false;
    return daily.quests.every(function (q) { return !!q.done || q.progress >= q.target; });
  }

  /**
   * Set one quest's absolute progress. Progress never goes down inside a day,
   * and never past the target. Returns the quest (mutated) or null.
   */
  function setProgress(daily, id, value) {
    var q = findQuest(daily, id);
    if (!q) return null;
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    n = Math.max(0, Math.min(q.target, Math.round(n)));
    if (n > q.progress) q.progress = n;
    q.done = q.progress >= q.target;
    daily.allDone = isAllDone(daily);
    return q;
  }

  function addProgress(daily, id, delta) {
    var q = findQuest(daily, id);
    if (!q) return null;
    return setProgress(daily, id, q.progress + (Number(delta) || 0));
  }

  /**
   * Merge local and synced state for one day, keeping the larger progress.
   * `b` is the authoritative side (the server response); its quest list wins
   * when the two sides disagree, so a stale offline pick cannot create a
   * four-quest day.
   */
  function mergeDaily(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (a.date !== b.date) return daysBetween(a.date, b.date) > 0 ? b : a;
    var merged = {
      date: a.date,
      quests: [],
      allDone: false,
      completedAt: a.completedAt || b.completedAt || null
    };
    var progress = {};
    (a.quests || []).concat(b.quests || []).forEach(function (q) {
      if (!q || !q.id) return;
      progress[q.id] = Math.max(progress[q.id] || 0, q.progress || 0);
    });
    var source = b.quests && b.quests.length ? b.quests : (a.quests || []);
    merged.quests = source.map(function (q) {
      var target = q.target || (BY_ID[q.id] && BY_ID[q.id].target) || 1;
      var value = Math.min(target, progress[q.id] || 0);
      return { id: q.id, target: target, progress: value, done: value >= target };
    });
    merged.allDone = isAllDone(merged);
    return merged;
  }

  /* ---------- Streak ---------- */
  function normalizeStreak(streak) {
    var s = streak && typeof streak === 'object' ? streak : {};
    return {
      current: Math.max(0, parseInt(s.current, 10) || 0),
      best: Math.max(0, parseInt(s.best, 10) || 0),
      lastCompletedDate: isDateKey(s.lastCompletedDate) ? s.lastCompletedDate : ''
    };
  }

  /**
   * Called when every quest on `day` is done.
   * - yesterday completed → +1
   * - one missed day        → +1 (grace day, shown as “!” before completing)
   * - two missed days       → restart at 1
   */
  function nextStreak(streak, day) {
    var s = normalizeStreak(streak);
    if (!isDateKey(day)) return s;
    if (s.lastCompletedDate === day) return s;
    var gap = s.lastCompletedDate ? daysBetween(s.lastCompletedDate, day) : null;
    if (gap != null && gap < 0) return s; // a completion from the future is ignored
    if (gap != null && gap >= 3) s.current = 1;
    else s.current = s.current + 1;
    s.lastCompletedDate = day;
    s.best = Math.max(s.best, s.current);
    return s;
  }

  /**
   * What the home page should show for `today`.
   * atRisk: one day was missed and today is not complete yet.
   * current: 0 when two days were missed.
   */
  function streakView(streak, today, completedToday) {
    var s = normalizeStreak(streak);
    var current = s.current;
    var atRisk = false;
    var gap = s.lastCompletedDate ? daysBetween(s.lastCompletedDate, today) : null;
    if (gap != null) {
      if (gap >= 3) current = 0;
      else if (gap === 2) atRisk = !completedToday;
    }
    if (completedToday) {
      current = Math.max(current, s.current);
      atRisk = false;
    }
    return {
      current: current,
      best: s.best,
      atRisk: atRisk,
      lastCompletedDate: s.lastCompletedDate
    };
  }

  /* ---------- Display helpers ---------- */
  function def(id) { return BY_ID[id] || null; }

  function label(id) {
    var d = BY_ID[id];
    return d ? d.title : id;
  }

  function targetText(id) {
    var d = BY_ID[id];
    if (!d) return '';
    return d.target === 1 ? (d.mode === 'paragraph' ? '1 paragraph' : '1 lesson') : d.target + ' ' +
      (d.mode === 'flashcards' ? 'cards' : d.mode === 'shadowing' ? 'sentences' : 'questions');
  }

  return {
    TYPES: TYPES,
    GROUPS: GROUPS,
    def: def,
    label: label,
    targetText: targetText,
    isDateKey: isDateKey,
    dateKey: dateKey,
    addDays: addDays,
    daysBetween: daysBetween,
    pick: pick,
    newDaily: newDaily,
    findQuest: findQuest,
    isAllDone: isAllDone,
    setProgress: setProgress,
    addProgress: addProgress,
    mergeDaily: mergeDaily,
    defaultStreak: defaultStreak,
    normalizeStreak: normalizeStreak,
    nextStreak: nextStreak,
    streakView: streakView,
    hashString: hashString
  };
});
