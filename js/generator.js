/* =========================================================
   VocabLab — generator.js
   Built-in (offline) question generator. Used when there is
   no Gemini key, quota is exhausted, or the user prefers it.
   Produces the same question shape as ai.js.
   ========================================================= */
(function (global) {
  'use strict';

  function poolByTopic(pool, topicId) {
    const same = pool.filter(function (p) { return p.topicId === topicId; });
    return same.length >= 4 ? same : pool;
  }

  function pickDistractors(pool, target, field, count) {
    const targetNorm = Util.normalize(target[field]);
    const seen = Object.create(null);
    seen[targetNorm] = true;
    const candidates = Util.shuffle(pool.filter(function (p) {
      if (Util.normalize(p.term) === Util.normalize(target.term)) return false;
      const v = Util.normalize(p[field]);
      if (!v || seen[v]) return false;
      // Never offer a near-synonym of the answer: two options the learner can
      // read as “the same meaning” make the question unfair (a sheet often has
      // several words sharing almost the same meaning, or a meaning that is one
      // comma-item of the answer). Quiz.sanitizeQuestion has the last word.
      if (Util.tooSimilarMeaning(p.meaning, target.meaning)) return false;
      if (Util.tooSimilarMeaning(p.term, target.term)) return false;
      return true;
    }));
    // Prefer same part of speech first, then the rest.
    candidates.sort(function (a, b) {
      const aw = a.pos && target.pos && a.pos === target.pos ? 0 : 1;
      const bw = b.pos && target.pos && b.pos === target.pos ? 0 : 1;
      return aw - bw;
    });
    const out = [];
    for (const c of candidates) {
      const v = c[field];
      if (seen[Util.normalize(v)]) continue;
      seen[Util.normalize(v)] = true;
      out.push(v);
      if (out.length >= count) break;
    }
    return out;
  }

  function maskTerm(term) {
    const s = String(term);
    return s.split(' ').map(function (word) {
      const chars = word.split('');
      const letterPositions = [];
      chars.forEach(function (c, i) { if (/\p{L}/u.test(c)) letterPositions.push(i); });
      if (!letterPositions.length) return word;
      const keep = Object.create(null);
      keep[letterPositions[0]] = true;
      if (letterPositions.length > 8) {
        keep[letterPositions[letterPositions.length - 1]] = true;
        keep[letterPositions[Math.floor(letterPositions.length / 2)]] = true;
      }
      return chars.map(function (c, i) {
        if (letterPositions.indexOf(i) === -1) return c;
        return keep[i] ? c : '_';
      }).join(' ');
    }).join('   ');
  }

  function exampleCloze(word) {
    const example = String(word.example || '').trim();
    const term = String(word.term || '').trim();
    if (!example || !term) return null;
    const rx = Util.termRegex(term, 'i');
    if (!rx.test(example)) return null;
    return example.replace(rx, '___');
  }

  /**
   * Build one built-in question.
   * @param word  { term, meaning, pron, example, pos }
   * @param type  'mc' | 'blank' | 'translate'
   * @param direction 'term2meaning' | 'meaning2term'
   * @param pool  [{ term, meaning, pos, topicId }] — all words for distractors
   * @returns question object or null when impossible
   */
  function build(word, type, direction, pool) {
    if (!word || !word.term || !word.meaning) return null;
    const base = {
      term: word.term,
      direction: type === 'blank' ? 'blank' : direction,
      options: [],
      hint: '',
      explanation: '',
      source: 'builtin'
    };

    if (type === 'mc') {
      const field = direction === 'meaning2term' ? 'term' : 'meaning';
      const distractors = pickDistractors(poolByTopic(pool, word.topicId), word, field, 3);
      if (distractors.length < 3) return null;
      return Object.assign(base, {
        type: 'mc',
        prompt: direction === 'meaning2term' ? word.meaning : word.term,
        options: Util.shuffle([word[field]].concat(distractors)),
        answer: word[field]
      });
    }

    if (type === 'blank') {
      const cloze = exampleCloze(word);
      if (cloze) {
        return Object.assign(base, {
          type: 'blank',
          prompt: cloze,
          hint: 'Meaning: ' + word.meaning,
          answer: word.term
        });
      }
      return Object.assign(base, {
        type: 'blank',
        prompt: maskTerm(word.term),
        hint: 'Meaning: ' + word.meaning,
        answer: word.term
      });
    }

    if (type === 'translate') {
      if (direction === 'meaning2term') {
        return Object.assign(base, {
          type: 'translate',
          prompt: word.meaning,
          answer: word.term,
          hint: 'Write it in the language you are learning.'
        });
      }
      return Object.assign(base, {
        type: 'translate',
        prompt: word.term,
        answer: word.meaning,
        hint: 'Write the Vietnamese meaning.'
      });
    }

    return null;
  }

  global.Gen = { build: build, maskTerm: maskTerm };
})(typeof window !== 'undefined' ? window : globalThis);
