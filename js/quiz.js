/* =========================================================
   VocabLab — quiz.js
   Word selection, question planning, AI batching + caching,
   built-in fallback and answer grading.
   ========================================================= */
(function (global) {
  'use strict';

  const AI_BATCH = 10;          // words per Gemini request
  const CACHE_MAX = 2200;       // cached questions before pruning

  /* ---------- Mastery & stats ---------- */
  function masteryKey(word) {
    return Util.normalize(word.term) + '|' + Util.normalize(word.meaning);
  }

  function masteryAll() { return Util.lsGet('mastery', {}); }

  function statsWith(mastery, word) {
    const m = mastery[masteryKey(word)] || { r: 0, w: 0, t: 0 };
    return { right: m.r || 0, wrong: m.w || 0, last: m.t || 0 };
  }

  function wordStats(word) { return statsWith(masteryAll(), word); }

  function isMasteredWith(mastery, word) {
    const s = statsWith(mastery, word);
    const attempts = s.right + s.wrong;
    return attempts >= 3 && s.right / attempts >= 0.8;
  }

  function isMastered(word) { return isMasteredWith(masteryAll(), word); }

  function masteredCount(words) {
    const mastery = masteryAll();
    let n = 0;
    for (const w of words) n += isMasteredWith(mastery, w) ? 1 : 0;
    return n;
  }

  function recordAnswer(question, correct) {
    const key = masteryKey(question.word);
    const all = masteryAll();
    const entry = all[key] || { r: 0, w: 0, t: 0 };
    if (correct) entry.r += 1; else entry.w += 1;
    entry.t = Date.now();
    all[key] = entry;
    Util.lsSet('mastery', all);

    const stats = Util.lsGet('stats', { answers: 0, correct: 0 });
    stats.answers += 1;
    if (correct) stats.correct += 1;
    Util.lsSet('stats', stats);
    return entry;
  }

  function getStats() {
    const s = Util.lsGet('stats', { answers: 0, correct: 0 });
    const accuracy = s.answers ? Math.round((s.correct / s.answers) * 100) : null;
    return { answers: s.answers || 0, correct: s.correct || 0, accuracy: accuracy };
  }

  /* ---------- Word selection ---------- */
  function flattenDeck(deck, topicIds) {
    if (!deck) return [];
    const wanted = topicIds && topicIds.length ? topicIds : null;
    const out = [];
    for (const topic of deck.topics) {
      if (wanted && wanted.indexOf(topic.id) === -1) continue;
      for (const word of topic.words) {
        out.push({
          term: word.term, meaning: word.meaning, pron: word.pron || '',
          example: word.example || '', pos: word.pos || '',
          topicId: topic.id, topicName: topic.name
        });
      }
    }
    return out;
  }

  function weightWith(mastery, word) {
    const s = statsWith(mastery, word);
    if (!s.right && !s.wrong) return 1.8;                 // unseen first
    return Util.clamp(1 + s.wrong * 2.5 - Math.min(s.right, 4) * 0.4, 0.25, 12);
  }

  function wordWeight(word) { return weightWith(masteryAll(), word); }

  function selectWords(words, count) {
    if (!words.length) return [];
    const mastery = masteryAll();
    const weights = words.map(function (w) { return weightWith(mastery, w); });
    if (!count || count >= words.length) {
      return Util.weightedSample(words, weights, words.length);
    }
    const picked = Util.weightedSample(words, weights, count);
    return Util.shuffle(picked);
  }

  /* ---------- Question planning ---------- */
  function planItems(words, types, directionSetting, rotation) {
    const typesWanted = (types && types.length) ? types : ['mc'];
    const rot = (rotation || 0) % 1000;
    return words.map(function (word, i) {
      const n = rot + i;
      const type = typesWanted[n % typesWanted.length];
      let direction = 'term2meaning';
      if (type !== 'blank') {
        if (directionSetting === 'm2t') direction = 'meaning2term';
        else if (directionSetting === 't2m') direction = 'term2meaning';
        else direction = (n % 2 === 0) ? 'term2meaning' : 'meaning2term';
      } else {
        direction = 'blank';
      }
      return {
        term: word.term, meaning: word.meaning, pron: word.pron, example: word.example,
        pos: word.pos, topicId: word.topicId, topicName: word.topicName,
        type: type, direction: direction
      };
    });
  }

  /* ---------- Question cache ---------- */
  function cacheGet(key) {
    const cache = Util.lsGet('qcache', {});
    const entry = cache[key];
    return entry && entry.q ? entry.q : null;
  }

  function cachePutMany(pairs, cacheRef) {
    if (!pairs.length) return;
    const cache = cacheRef || Util.lsGet('qcache', {});
    const now = Date.now();
    for (const p of pairs) cache[p.key] = { q: p.q, t: now };
    const keys = Object.keys(cache);
    if (keys.length > CACHE_MAX) {
      keys.sort(function (a, b) { return (cache[a].t || 0) - (cache[b].t || 0); });
      for (const k of keys.slice(0, keys.length - CACHE_MAX + 400)) delete cache[k];
    }
    Util.lsSet('qcache', cache);
  }

  function cacheCount() {
    return Object.keys(Util.lsGet('qcache', {})).length;
  }

  function clearCache() { Util.lsRemove('qcache'); }

  function cacheKeyFor(item, aiId) {
    return Util.hash([aiId || 'builtin', item.type, item.direction, Util.normalize(item.term), Util.normalize(item.meaning)].join('|'));
  }

  function wordFromItem(item) {
    return {
      term: item.term, meaning: item.meaning, pron: item.pron || '',
      example: item.example || '', pos: item.pos || '',
      topicId: item.topicId, topicName: item.topicName
    };
  }

  function builtinFor(item, pool, preferTypes) {
    const order = (preferTypes || []).concat(['translate', 'mc', 'blank']);
    const tried = Object.create(null);
    for (const type of order) {
      if (tried[type]) continue;
      tried[type] = true;
      let direction = item.direction;
      if (type === 'blank') direction = 'blank';
      if (type === 'mc' && (direction === 'term2meaning' || direction === 'meaning2term')) {
        // fine
      } else if (type === 'mc') {
        direction = 'term2meaning';
      }
      const q = Gen.build(item, type, direction === 'blank' ? 'term2meaning' : direction, pool);
      if (q) return q;
    }
    // Absolute last resort: plain translation of the term (should never fail).
    return {
      type: 'translate', direction: 'term2meaning', term: item.term,
      prompt: item.term, hint: 'Write the Vietnamese meaning.',
      options: [], answer: item.meaning, explanation: '', source: 'builtin'
    };
  }

  /**
   * Build one question per item.
   * opts: { items, pool, source: 'auto'|'ai'|'builtin', aiProvider, aiBaseUrl, aiKey, aiModel,
   *         targetLang, meaningLang, onProgress, signal }
   */
  async function buildPool(opts) {
    const { items, pool, source, aiProvider, aiBaseUrl, aiKey, aiModel, targetLang, meaningLang, onProgress, signal } = opts;
    const progress = onProgress || function () {};
    // Ready when a key exists, or for local servers (Ollama/LM Studio) with a localhost base URL.
    const wantAi = (source === 'ai' || source === 'auto') &&
      (!!aiKey || (!!aiBaseUrl && Ai.isLocalBaseUrl(aiBaseUrl)));
    const allowFallback = source !== 'ai' || opts.strictAi !== true;
    // Cache questions per provider + endpoint + model so switching providers
    // doesn't replay questions made by a different one.
    const aiId = [aiProvider || 'gemini', Ai.normalizeBaseUrl(aiBaseUrl || ''), aiModel || ''].join('|');

    const out = [];
    const pending = [];
    const cacheSnapshot = wantAi ? Util.lsGet('qcache', {}) : {};

    for (const item of items) {
      let cached = null;
      const key = cacheKeyFor(item, aiId);
      if (wantAi && cacheSnapshot[key] && cacheSnapshot[key].q) cached = cacheSnapshot[key].q;
      if (cached) {
        out.push({ question: cached, item: item });
      } else {
        pending.push(item);
      }
    }

    let aiError = null;
    let aiUsed = 0;

    if (pending.length && wantAi) {
      const batches = Util.chunk(pending, AI_BATCH);
      progress(0, batches.length, 'Generating with AI…');
      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
        try {
          const questions = await Ai.generateQuestions({
            provider: aiProvider || 'gemini', baseUrl: aiBaseUrl || '',
            key: aiKey, model: aiModel, items: batch,
            targetLang: targetLang, meaningLang: meaningLang, signal: signal
          });
          const pairs = [];
          for (const q of questions) {
            const item = batch.find(function (i) { return Util.normalize(i.term) === Util.normalize(q.term); });
            if (!item) continue;
            const record = Object.assign({}, q, { source: 'ai' });
            pairs.push({ key: cacheKeyFor(item, aiId), q: record });
            out.push({ question: record, item: item });
          }
          cachePutMany(pairs, cacheSnapshot);
          aiUsed += questions.length;
        } catch (e) {
          if (e && e.name === 'AbortError') throw e;
          if (!allowFallback) throw e;
          aiError = e;
          for (const item of batch) {
            const q = Object.assign({}, builtinFor(item, pool, ['translate', 'mc', 'blank']), { source: 'builtin' });
            out.push({ question: q, item: item });
          }
        }
        progress(b + 1, batches.length, 'Generating with AI…');
      }
    } else if (pending.length) {
      for (const item of pending) {
        out.push({ question: Object.assign({}, builtinFor(item, pool, [item.type]), { source: 'builtin' }), item: item });
      }
    }

    // Fill any item that ended up without a question (AI skipped it, invalid output…).
    const covered = Object.create(null);
    for (const o of out) covered[Util.normalize(o.item.term) + '|' + Util.normalize(o.item.meaning)] = true;
    for (const item of items) {
      const k = Util.normalize(item.term) + '|' + Util.normalize(item.meaning);
      if (!covered[k]) {
        out.push({ question: Object.assign({}, builtinFor(item, pool, [item.type]), { source: 'builtin' }), item: item });
        covered[k] = true;
      }
    }

    const questions = out.map(function (o, i) {
      return Object.assign({}, o.question, {
        id: Util.uid() + '-' + i,
        word: wordFromItem(o.item)
      });
    });

    return { questions: questions, aiUsed: aiUsed, aiError: aiError, aiWanted: wantAi };
  }

  /* ---------- Session ordering ---------- */
  function makeSession(questions, count) {
    let list = Util.shuffle(questions);
    // Avoid two questions about the same word back-to-back.
    for (let i = 1; i < list.length; i++) {
      if (Util.normalize(list[i].word.term) === Util.normalize(list[i - 1].word.term)) {
        for (let j = i + 1; j < list.length; j++) {
          if (Util.normalize(list[j].word.term) !== Util.normalize(list[i - 1].word.term)) {
            const t = list[i]; list[i] = list[j]; list[j] = t;
            break;
          }
        }
      }
    }
    if (count && count > 0 && count < list.length) list = list.slice(0, count);
    return list;
  }

  /* ---------- Grading ---------- */
  /** Split “văn phòng / bàn làm việc” or “làm tổn hại, đe dọa” into alternatives. */
  function splitAlternatives(text) {
    return String(text == null ? '' : text)
      .split(/[\/;|,]|\s[–—]\s/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s !== ''; });
  }

  /**
   * Accepted answers for one sheet cell. Meanings are often lists —
   * “làm tổn hại, đe dọa (kết quả, sự công bằng)” — where any single item is
   * correct and text in brackets is a clarification, not an alternative.
   */
  function answerCandidates(answer) {
    const out = [];
    const push = function (s) {
      const v = Util.normalizeForCompare(s);
      if (v && out.indexOf(v) === -1) out.push(v);
    };
    const text = String(answer == null ? '' : answer);
    const main = text.replace(/[\(\[][^)\]]*[\)\]]/g, ' '); // drop “(…)” / “[…]”
    push(text);
    push(main);
    for (const part of splitAlternatives(main)) push(part);
    return out;
  }

  /** Do two answers mean the same thing (any alternative, accents ignored)? */
  function sameAnswer(a, b) {
    const A = answerCandidates(a);
    const B = answerCandidates(b);
    for (const x of A) if (B.indexOf(x) !== -1) return true;
    return Util.normalizeForCompare(Util.stripDiacritics(a)) ===
      Util.normalizeForCompare(Util.stripDiacritics(b));
  }

  function grade(question, response) {
    const raw = String(response == null ? '' : response).trim();
    if (!raw) return { verdict: 'wrong', correctAnswer: question.answer, note: '' };

    if (question.type === 'mc') {
      return { verdict: sameAnswer(raw, question.answer) ? 'correct' : 'wrong', correctAnswer: question.answer, note: '' };
    }

    const input = Util.normalizeForCompare(raw);
    const inputNoAccent = Util.normalizeForCompare(Util.stripDiacritics(raw));
    const candidates = answerCandidates(question.answer);

    if (candidates.indexOf(input) !== -1) {
      return { verdict: 'correct', correctAnswer: question.answer, note: '' };
    }
    // The learner listed synonyms: fine as long as every one of them is accepted.
    const inputParts = splitAlternatives(raw);
    if (inputParts.length > 1 && inputParts.every(function (p) {
      return candidates.indexOf(Util.normalizeForCompare(p)) !== -1;
    })) {
      return { verdict: 'correct', correctAnswer: question.answer, note: '' };
    }
    const hasDiacritics = /[^\u0000-\u007f]/.test(question.answer);
    for (const c of candidates) {
      if (Util.normalizeForCompare(Util.stripDiacritics(c)) === inputNoAccent) {
        return {
          verdict: hasDiacritics ? 'accent' : 'correct',
          correctAnswer: question.answer,
          note: hasDiacritics ? 'Accepted, but mind the accents/tone marks.' : ''
        };
      }
    }
    // Near miss (typo) detection.
    let best = Infinity;
    for (const c of candidates) {
      const d = Util.levenshtein(Util.stripDiacritics(c), inputNoAccent);
      if (d < best) best = d;
    }
    const longest = candidates.reduce(function (m, c) { return Math.max(m, c.length); }, 0);
    const tolerance = longest <= 5 ? 1 : 2;
    if (best <= tolerance && best > 0) {
      return { verdict: 'close', correctAnswer: question.answer, note: '' };
    }
    return { verdict: 'wrong', correctAnswer: question.answer, note: '' };
  }

  function typeLabel(type) {
    if (type === 'mc') return 'Multiple choice';
    if (type === 'blank') return 'Fill in the blank';
    return 'Translate';
  }

  global.Quiz = {
    AI_BATCH: AI_BATCH,
    masteryKey: masteryKey, masteryAll: masteryAll, wordStats: wordStats,
    isMastered: isMastered, masteredCount: masteredCount,
    recordAnswer: recordAnswer, getStats: getStats,
    flattenDeck: flattenDeck, selectWords: selectWords, planItems: planItems,
    buildPool: buildPool, makeSession: makeSession,
    grade: grade, answerCandidates: answerCandidates, sameAnswer: sameAnswer,
    cacheCount: cacheCount, clearCache: clearCache,
    typeLabel: typeLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
