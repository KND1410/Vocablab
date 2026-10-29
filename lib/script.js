/* =========================================================
   VocabLab — lib/script.js
   The examiner's reference brief for an exam paper: the
   transcript / model answer an admin pastes in (for example a
   script generated from the booklet). The AI reads it as the
   source of truth when correcting, so it is stored once per
   paper instead of being retyped into every prompt.
   ========================================================= */
'use strict';

/** A brief longer than this is almost certainly a mistake (or a whole book). */
const MAX_CHARS = 20000;

/** Exam ids come from js/exam-data.js: "blanc-1", "blanc-2", … */
function cleanExamId(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
}

/**
 * Text as it will be stored and sent to the model: normalised line endings,
 * no control characters, no trailing spaces, bounded length. Nothing else is
 * rewritten — the examiner's wording is the examiner's.
 */
function normalize(text) {
  return String(text == null ? '' : text)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, MAX_CHARS);
}

function docId(examId) {
  return 'script:' + cleanExamId(examId);
}

function isEmpty(text) {
  return normalize(text) === '';
}

/** One row for the admin panel: the text plus what it costs to send. */
function publicScript(doc) {
  if (!doc) return null;
  const text = String(doc.text || '');
  return {
    examId: cleanExamId(doc.examId || String(doc._id || '').replace(/^script:/, '')),
    text: text,
    chars: text.length,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null
  };
}

module.exports = {
  MAX_CHARS: MAX_CHARS,
  cleanExamId: cleanExamId,
  normalize: normalize,
  docId: docId,
  isEmpty: isEmpty,
  publicScript: publicScript
};
