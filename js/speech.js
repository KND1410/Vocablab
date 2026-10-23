/* =========================================================
   VocabLab — speech.js
   Azure Speech: French neural TTS, pronunciation assessment,
   recording conversion, and local audio storage.

   The Azure SDK is loaded lazily from a pinned CDN build only
   when a cloud voice or assessment is actually requested, so
   the rest of the app stays dependency-free and offline-safe.
   ========================================================= */
(function (global) {
  'use strict';

  const U = global.Util;
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@1.53.0/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js';
  const DEFAULT_REGION = 'southeastasia';
  const VOICE_FR = 'fr-FR-DeniseNeural';
  const VOICE_VI = 'vi-VN-HoaiMyNeural';
  const VOICE_EN = 'en-US-JennyNeural';

  let cfg = null;
  let sdkPromise = null;
  let audioEl = null;
  let audioUrl = null;
  let cache = new Map();
  let speakSeq = 0;
  let warned = false;
  const CACHE_MAX = 40;

  function configure(settings) {
    cfg = settings || null;
  }

  function key() { return String((cfg && cfg.azureKey) || '').trim(); }
  function region() { return String((cfg && cfg.azureRegion) || DEFAULT_REGION).trim().toLowerCase(); }

  function isConfigured() {
    return !!(key() && region());
  }

  function enabled() {
    return !!(cfg && cfg.cloudVoice !== false && isConfigured());
  }

  function voiceFor(lang) {
    const l = String(lang || '').toLowerCase();
    if (l.indexOf('fr') === 0) return (cfg && cfg.azureVoice) || VOICE_FR;
    if (l.indexOf('vi') === 0) return VOICE_VI;
    if (l.indexOf('en') === 0) return VOICE_EN;
    // Other target languages: leave the voice unset so Azure picks a native
    // default for speechSynthesisLanguage instead of reading German in English.
    return '';
  }

  function loadSdk() {
    if (global.SpeechSDK) return Promise.resolve(global.SpeechSDK);
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') {
        reject(new Error('Azure Speech needs a browser.'));
        return;
      }
      const script = document.createElement('script');
      let settled = false;
      const timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        sdkPromise = null;
        reject(new Error('The Azure Speech library took too long to load. Check the network and try again.'));
      }, 20000);
      script.src = SDK_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.integrity = 'sha384-YG0CfpDhvvBF6YvDNHgeAPtRBdnkEnbLtXyPhAfT+dB7uCoCZgcIruOnhmQhJQqv';
      script.onload = function () {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (global.SpeechSDK) resolve(global.SpeechSDK);
        else { sdkPromise = null; reject(new Error('Azure Speech loaded but did not expose its API.')); }
      };
      script.onerror = function () {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        sdkPromise = null;
        reject(new Error('Could not load the Azure Speech library. Check the network and try again.'));
      };
      document.head.appendChild(script);
    });
    return sdkPromise;
  }

  /* ---------- Audio playback ---------- */
  function stop() {
    speakSeq += 1;
    if (audioEl) {
      try { audioEl.pause(); } catch (e) { /* ignore */ }
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl = null;
    }
    if (audioUrl) {
      try { URL.revokeObjectURL(audioUrl); } catch (e) { /* ignore */ }
      audioUrl = null;
    }
    if (global.speechSynthesis) {
      try { global.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
  }

  function browserFallback(text, lang, rate) {
    if (!warned && U && U.toast) {
      warned = true;
      U.toast('Azure voice is unavailable — using the browser voice. Check Settings → Speech.', 'warn', 9000);
    }
    U.browserSpeak(text, lang, rate);
  }

  function playBlob(blob, rate, opts) {
    stop();
    audioUrl = URL.createObjectURL(blob);
    const el = new Audio(audioUrl);
    audioEl = el;
    el.playbackRate = U.clamp(Number(rate) || 1, 0.5, 1.5);
    el.onended = function () {
      if (audioEl === el) {
        audioEl = null;
        if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
      }
    };
    el.onerror = function () {
      if (opts && opts.onError) opts.onError(new Error('The browser could not play the Azure audio.'));
      if (opts && opts.noFallback) return;
      browserFallback(opts && opts.text, opts && opts.lang, rate);
    };
    return el.play().then(function () {
      if (opts && opts.onStart) opts.onStart();
      return true;
    }, function (err) {
      if (audioEl === el) { audioEl = null; }
      if (opts && opts.onError) opts.onError(err);
      if (!(opts && opts.noFallback)) browserFallback(opts && opts.text, opts && opts.lang, rate);
      return false;
    });
  }

  function cacheKey(text, lang) {
    return voiceFor(lang) + '|' + String(lang || '') + '|' + String(text);
  }

  function synthesize(text, lang) {
    return loadSdk().then(function (SDK) {
      return new Promise(function (resolve, reject) {
        if (!isConfigured()) { reject(new Error('Azure Speech is not configured.')); return; }
        let synth;
        let settled = false;
        let timer = null;
        function finish(fn, value) {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          try { if (synth) synth.close(); } catch (e) { /* ignore */ }
          fn(value);
        }
        try {
          const speechConfig = SDK.SpeechConfig.fromSubscription(key(), region());
          speechConfig.speechSynthesisLanguage = lang || 'fr-FR';
          const voice = voiceFor(lang);
          if (voice) speechConfig.speechSynthesisVoiceName = voice;
          speechConfig.speechSynthesisOutputFormat = SDK.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
          synth = new SDK.SpeechSynthesizer(speechConfig, null);
        } catch (e) { finish(reject, e); return; }
        timer = setTimeout(function () {
          finish(reject, new Error('Azure voice timed out. Check the network and try again.'));
        }, 20000);
        synth.speakTextAsync(String(text), function (result) {
          try {
            const ok = result && result.reason === SDK.ResultReason.SynthesizingAudioCompleted;
            const data = result && result.audioData;
            if (!ok || !data) {
              finish(reject, new Error((result && result.errorDetails) || 'Azure returned no audio.'));
              return;
            }
            finish(resolve, new Blob([data], { type: 'audio/mpeg' }));
          } catch (e) { finish(reject, e); }
        }, function (err) {
          finish(reject, new Error(String(err || 'Azure speech synthesis failed.')));
        });
      });
    });
  }

  /**
   * Speak with the Azure voice when enabled, otherwise browser speech.
   * Returns true when cloud synthesis was started. Failures fall back to the
   * browser voice unless opts.noFallback is set (used by the test button).
   */
  function speak(text, lang, rate, opts) {
    opts = opts || {};
    if (!text) return false;
    if (!enabled()) {
      if (!opts.noFallback) U.browserSpeak(text, lang, rate);
      if (opts.onError) opts.onError(new Error('Azure Speech is not configured.'));
      return false;
    }
    stop();
    const token = speakSeq;
    const ck = cacheKey(text, lang);
    if (cache.has(ck)) {
      playBlob(cache.get(ck), rate, { text: text, lang: lang, noFallback: opts.noFallback, onStart: opts.onStart, onError: opts.onError });
      return true;
    }
    synthesize(text, lang).then(function (blob) {
      if (token !== speakSeq) return;
      if (cache.size >= CACHE_MAX) {
        const first = cache.keys().next().value;
        cache.delete(first);
      }
      cache.set(ck, blob);
      playBlob(blob, rate, { text: text, lang: lang, noFallback: opts.noFallback, onStart: opts.onStart, onError: opts.onError });
    }, function (err) {
      if (token !== speakSeq) return;
      const friendly = new Error(friendlyAzure(err));
      if (opts.onError) opts.onError(friendly);
      if (!opts.noFallback) browserFallback(text, lang, rate);
    });
    return true;
  }

  /* ---------- Audio conversion ---------- */
  function encodeWav(samples, sampleRate) {
    const n = samples.length;
    const buffer = new ArrayBuffer(44 + n * 2);
    const view = new DataView(buffer);
    function writeString(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + n * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, n * 2, true);
    let offset = 44;
    for (let i = 0; i < n; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  function decodeAudio(ctx, data) {
    return new Promise(function (resolve, reject) {
      const p = ctx.decodeAudioData(data, resolve, reject);
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    });
  }

  async function blobToWav(blob) {
    const AC = global.AudioContext || global.webkitAudioContext;
    const OAC = global.OfflineAudioContext || global.webkitOfflineAudioContext;
    if (!AC || !OAC) throw new Error('This browser cannot convert the recording.');
    const ctx = new AC();
    let decoded;
    try {
      const input = await blob.arrayBuffer();
      decoded = await decodeAudio(ctx, input.slice(0));
    } finally {
      if (ctx.close) { try { ctx.close(); } catch (e) { /* ignore */ } }
    }
    const rate = 16000;
    const frames = Math.max(1, Math.ceil(decoded.duration * rate));
    const offline = new OAC(1, frames, rate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0), rate);
  }

  /** Base64 (no data: prefix) for a recording, used by Gemini audio scoring. */
  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      if (!global.FileReader) {
        reject(new Error('This browser cannot read the recording.'));
        return;
      }
      const reader = new global.FileReader();
      reader.onload = function () {
        const text = String(reader.result || '');
        const comma = text.indexOf(',');
        if (comma === -1) { reject(new Error('Could not read the recording.')); return; }
        resolve(text.slice(comma + 1));
      };
      reader.onerror = function () { reject(new Error('Could not read the recording.')); };
      reader.readAsDataURL(blob);
    });
  }

  function friendlyAzure(err) {
    const msg = String((err && (err.message || err.errorDetails)) || err || 'Azure Speech failed.');
    if (/401|403|unauthorized|authentication|invalid subscription/i.test(msg)) {
      return 'Azure rejected the key or region. Check Settings → Speech: the key and region must belong to the same Azure Speech resource.';
    }
    if (/quota|429|too many/i.test(msg)) {
      return 'Azure’s free monthly allowance is used up or the request was throttled. Wait a little, or check your Azure Speech quota.';
    }
    if (/network|fetch|websocket|cors|failed to fetch|unable to contact|1006|connection/i.test(msg)) {
      return 'Azure Speech could not be reached from this browser. Check the network, VPN or firewall, then try again.';
    }
    return msg;
  }

  /**
   * Assess one recorded sentence against a French reference.
   * Returns { score, accuracy, fluency, completeness, recognized, words[], raw }.
   */
  async function assess(blob, reference, lang) {
    if (!isConfigured()) throw new Error('Add an Azure Speech key in Settings → Speech to score pronunciation.');
    const SDK = await loadSdk();
    let wav;
    try { wav = await blobToWav(blob); }
    catch (e) { throw new Error('Could not prepare the recording for Azure: ' + (e.message || e)); }

    const speechConfig = SDK.SpeechConfig.fromSubscription(key(), region());
    speechConfig.speechRecognitionLanguage = lang || 'fr-FR';
    let file;
    try { file = new File([wav], 'shadowing.wav', { type: 'audio/wav' }); }
    catch (e) { file = wav; }
    const audioConfig = SDK.AudioConfig.fromWavFileInput(file);
    const recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);
    const pa = new SDK.PronunciationAssessmentConfig(
      String(reference || ''),
      SDK.PronunciationAssessmentGradingSystem.HundredMark,
      SDK.PronunciationAssessmentGranularity.Word,
      true
    );
    if (/^en/i.test(lang || '')) {
      try { pa.enableProsodyAssessment = true; } catch (e) { /* older SDK */ }
    }
    pa.applyTo(recognizer);

    return new Promise(function (resolve, reject) {
      let settled = false;
      let timer = null;
      function finish(fn, value) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        try { recognizer.close(); } catch (e) { /* ignore */ }
        fn(value);
      }
      timer = setTimeout(function () {
        finish(reject, new Error('Azure pronunciation scoring timed out. Check the network and try again.'));
      }, 30000);
      recognizer.recognizeOnceAsync(function (result) {
        try {
          if (!result || result.reason !== SDK.ResultReason.RecognizedSpeech || !result.text) {
            const details = (result && result.errorDetails) || 'No speech was recognized. Record a little longer and try again.';
            finish(reject, new Error(friendlyAzure(details)));
            return;
          }
          const pron = SDK.PronunciationAssessmentResult.fromResult(result);
          const detail = pron.detailResult || {};
          const words = ((detail.Words) || []).map(function (w) {
            return {
              word: w.Word,
              accuracy: w.PronunciationAssessment ? w.PronunciationAssessment.AccuracyScore : null,
              errorType: w.PronunciationAssessment ? w.PronunciationAssessment.ErrorType : ''
            };
          }).filter(function (w) { return w.word; });
          finish(resolve, {
            source: 'azure',
            score: Math.round(pron.pronunciationScore || 0),
            accuracy: Math.round(pron.accuracyScore || 0),
            fluency: Math.round(pron.fluencyScore || 0),
            completeness: Math.round(pron.completenessScore || 0),
            prosody: pron.prosodyScore == null ? null : Math.round(pron.prosodyScore),
            recognized: result.text,
            words: words,
            raw: detail
          });
        } catch (e) {
          finish(reject, new Error(friendlyAzure(e)));
        }
      }, function (err) {
        finish(reject, new Error(friendlyAzure(err)));
      });
    });
  }

  /* ---------- Recording helpers ---------- */
  function pickMime() {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (let i = 0; i < types.length; i++) {
      try { if (MediaRecorder.isTypeSupported(types[i])) return types[i]; } catch (e) { /* ignore */ }
    }
    return '';
  }

  /** Split a French paragraph into speakable sentences without changing its words. */
  function splitSentences(text) {
    const src = String(text || '').replace(/\s+/g, ' ').trim();
    if (!src) return [];
    const parts = src.match(/[^.!?…]+[.!?…]+(?:[»”"]+)?|[^.!?…]+$/g) || [src];
    return parts.map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; });
  }

  /* ---------- IndexedDB: saved recordings ---------- */
  const DB_NAME = 'vocablab-speech';
  const STORE = 'recordings';

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) { reject(new Error('This browser cannot store recordings locally.')); return; }
      const req = global.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('Could not open local recording storage.')); };
    });
  }

  async function saveRecording(record) {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = function () { db.close(); resolve(record); };
      tx.onerror = function () { db.close(); reject(tx.error || new Error('Could not save the recording.')); };
      tx.onabort = function () { db.close(); reject(tx.error || new Error('Could not save the recording.')); };
    });
  }

  async function listRecordings() {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, 'readonly');
      const out = [];
      const req = tx.objectStore(STORE).openCursor();
      req.onsuccess = function () {
        const cursor = req.result;
        if (cursor) {
          const r = cursor.value;
          out.push({
            id: r.id, reference: r.reference, createdAt: r.createdAt, score: r.score,
            size: r.blob ? r.blob.size : 0, mime: r.mime || (r.blob && r.blob.type)
          });
          cursor.continue();
        }
      };
      tx.oncomplete = function () {
        db.close();
        out.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        resolve(out);
      };
      tx.onerror = function () { db.close(); reject(tx.error || new Error('Could not read saved recordings.')); };
    });
  }

  async function getRecording(id) {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = function () { db.close(); resolve(req.result || null); };
      req.onerror = function () { db.close(); reject(req.error || new Error('Could not read the recording.')); };
    });
  }

  async function deleteRecording(id) {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = function () { db.close(); resolve(); };
      tx.onerror = function () { db.close(); reject(tx.error || new Error('Could not delete the recording.')); };
    });
  }

  async function clearRecordings() {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = function () { db.close(); resolve(); };
      tx.onerror = function () { db.close(); reject(tx.error || new Error('Could not clear recordings.')); };
    });
  }

  async function countRecordings() {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = function () { db.close(); resolve(req.result || 0); };
      req.onerror = function () { db.close(); reject(req.error || new Error('Could not count saved recordings.')); };
    });
  }

  global.Speech = {
    configure: configure,
    isConfigured: isConfigured,
    enabled: enabled,
    voiceFor: voiceFor,
    speak: speak,
    stop: stop,
    synthesize: synthesize,
    assess: assess,
    splitSentences: splitSentences,
    encodeWav: encodeWav,
    blobToWav: blobToWav,
    blobToBase64: blobToBase64,
    pickMime: pickMime,
    saveRecording: saveRecording,
    listRecordings: listRecordings,
    getRecording: getRecording,
    deleteRecording: deleteRecording,
    clearRecordings: clearRecordings,
    countRecordings: countRecordings,
    DEFAULT_REGION: DEFAULT_REGION
  };
})(typeof window !== 'undefined' ? window : globalThis);
