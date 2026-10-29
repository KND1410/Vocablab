/* =========================================================
   VocabLab — account.js
   Sign in / sign up / recovery, the local home cache and the
   offline queue for daily-quest progress.
   ========================================================= */
(function () {
  'use strict';
  const U = Util;

  const ACCOUNT_KEY = 'account';
  const HOME_KEY = 'homeCache';
  const QUEUE_KEY = 'questQueue';
  const TIMEOUT = 10000;

  function ApiError(message, status, data) {
    const err = new Error(message || 'Request failed');
    err.status = status || 0;
    err.data = data || null;
    return err;
  }

  async function api(path, opts) {
    const o = opts || {};
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT) : null;
    try {
      const res = await fetch('/api' + path, {
        method: o.method || 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: o.body ? { 'Content-Type': 'application/json' } : {},
        body: o.body ? JSON.stringify(o.body) : undefined,
        signal: controller ? controller.signal : undefined
      });
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok) throw ApiError((data && data.error) || ('Request failed (' + res.status + ')'), res.status, data);
      return data;
    } catch (err) {
      if (err && err.status) throw err;
      if (err && err.name === 'AbortError') throw ApiError('The server took too long to answer.', 0);
      throw ApiError('The server is not reachable.', 0);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /* ---------- Session cache ---------- */
  function cachedUser() {
    const c = U.lsGet(ACCOUNT_KEY, null);
    return c && c.user && c.user.id ? c : null;
  }

  function remember(user, streak) {
    if (!user || !user.id) return;
    const prev = cachedUser();
    U.lsSet(ACCOUNT_KEY, {
      user: user,
      streak: streak || (prev && prev.streak) || null,
      savedAt: Date.now()
    });
  }

  function forget() {
    U.lsRemove(ACCOUNT_KEY);
  }

  /* ---------- Home cache (today's quests + streak) ---------- */
  function saveHome(data) {
    if (!data || !data.user || !data.daily) return;
    U.lsSet(HOME_KEY, {
      userId: data.user.id,
      user: data.user,
      streak: data.streak || null,
      daily: data.daily,
      serverToday: data.serverToday || '',
      savedAt: Date.now()
    });
    remember(data.user, data.streak);
  }

  function cachedHome(userId, date) {
    const h = U.lsGet(HOME_KEY, null);
    if (!h || !h.daily || h.userId !== userId) return null;
    if (date && h.daily.date !== date) return null;
    return h;
  }

  function updateCachedDaily(daily) {
    if (!daily) return;
    const h = U.lsGet(HOME_KEY, null);
    if (!h || !h.userId || h.daily.date !== daily.date) return;
    h.daily = daily;
    U.lsSet(HOME_KEY, h);
  }

  function updateCachedStreak(userId, streak) {
    if (!streak) return;
    const h = U.lsGet(HOME_KEY, null);
    if (h && h.userId === userId) {
      h.streak = streak;
      U.lsSet(HOME_KEY, h);
    }
    const c = cachedUser();
    if (c && c.user.id === userId) remember(c.user, streak);
  }

  function clearHome() {
    U.lsRemove(HOME_KEY);
  }

  /* ---------- API ---------- */
  async function signup(name, email, password) {
    const data = await api('/auth/signup', { method: 'POST', body: { name: name, email: email, password: password } });
    // A pending account has no session yet: caching it would make the next
    // page load think it is signed in and fail every request.
    if (!data.pending) remember(data.user);
    return data;
  }

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email: email, password: password } });
    remember(data.user);
    return data;
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (err) {
      // A stale/expired session (401) or a missing API (404) cannot be used
      // again, so clearing this browser is safe. A network/5xx failure means
      // the HttpOnly cookie may still be valid: keep the user signed in.
      if (!(err && (err.status === 401 || err.status === 404))) throw err;
    }
    forget();
    clearHome();
    U.lsRemove(QUEUE_KEY);
  }

  async function resetPassword(email, code, password) {
    const data = await api('/auth/reset', { method: 'POST', body: { email: email, code: code, password: password } });
    remember(data.user);
    return data;
  }

  async function me() {
    const data = await api('/auth/me');
    remember(data.user);
    return data.user;
  }

  async function updateName(name) {
    const data = await api('/profile', { method: 'PATCH', body: { name: name } });
    remember(data.user);
    const h = U.lsGet(HOME_KEY, null);
    if (h && h.user) {
      h.user.name = data.user.name;
      U.lsSet(HOME_KEY, h);
    }
    return data.user;
  }

  async function loadHome(date) {
    const data = await api('/home?date=' + encodeURIComponent(date));
    saveHome(data);
    return data;
  }

  /* ---------- Offline progress queue ---------- */
  function readQueue() {
    const q = U.lsGet(QUEUE_KEY, []);
    return Array.isArray(q) ? q : [];
  }

  function writeQueue(q) {
    if (!q || !q.length) U.lsRemove(QUEUE_KEY);
    else U.lsSet(QUEUE_KEY, q);
  }

  function queueProgress(userId, date, questId, progress) {
    const q = readQueue();
    let hit = null;
    for (let i = 0; i < q.length; i++) {
      if (q[i].userId === userId && q[i].date === date && q[i].questId === questId) { hit = q[i]; break; }
    }
    if (hit) {
      hit.progress = Math.max(hit.progress, progress);
      hit.at = Date.now();
    } else {
      q.push({ userId: userId, date: date, questId: questId, progress: progress, at: Date.now() });
    }
    writeQueue(q);
  }

  function queueCount(userId) {
    return readQueue().filter(function (e) { return !userId || e.userId === userId; }).length;
  }

  /**
   * Send queued updates in order. Stops on network failure; drops entries the
   * server rejects (for example a date that is now too old).
   * Returns { results, unauthorized, offline }.
   */
  async function flush(userId) {
    const all = readQueue();
    if (!all.length) return { results: [], unauthorized: false, offline: false };
    const mine = all.filter(function (e) { return e.userId === userId; });
    const results = [];
    const dropped = [];
    // Absolute progress that reached the server (or was permanently rejected).
    // Anything newer or higher that was queued while this request was in
    // flight is kept by saveQueue().
    const applied = Object.create(null);
    let offline = false;
    let unauthorized = false;

    function entryKey(e) {
      return e.userId + '\u0000' + e.date + '\u0000' + e.questId;
    }
    function markApplied(e) {
      const key = entryKey(e);
      applied[key] = Math.max(applied[key] || 0, Number(e.progress) || 0);
    }
    function saveQueue() {
      const latest = readQueue();
      const keep = latest.filter(function (e) {
        const sent = applied[entryKey(e)];
        return sent == null || (Number(e.progress) || 0) > sent;
      });
      writeQueue(keep);
    }

    for (let i = 0; i < mine.length; i++) {
      const entry = mine[i];
      try {
        const res = await api('/daily/progress', {
          method: 'POST',
          body: { date: entry.date, questId: entry.questId, progress: entry.progress }
        });
        results.push(res);
        markApplied(entry);
      } catch (err) {
        if (err.status === 401) {
          unauthorized = true;
          break;
        }
        if (err.status === 0 || err.status >= 500) {
          offline = true;
          break;
        }
        // 400/404: the entry can never be applied (old date, unknown quest).
        dropped.push(entry);
        markApplied(entry);
      }
    }
    saveQueue();
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      try {
        window.dispatchEvent(new CustomEvent('vocablab:quests-synced', {
          detail: { results: results, unauthorized: unauthorized, offline: offline }
        }));
        if (dropped.length) {
          window.dispatchEvent(new CustomEvent('vocablab:quests-dropped', {
            detail: { dropped: dropped }
          }));
        }
      } catch (e) { /* older browsers */ }
    }
    return { results: results, unauthorized: unauthorized, offline: offline };
  }

  function authMessage(err) {
    if (!err) return 'Something went wrong.';
    if (err.status === 0) return 'The server is not reachable. Check your connection — or use the hosted version.';
    if (err.status === 404) return 'The account API is not available here. Use the hosted version or run "vercel dev".';
    return err.message || 'Something went wrong.';
  }

  window.Account = {
    api: api,
    cachedUser: cachedUser,
    remember: remember,
    forget: forget,
    saveHome: saveHome,
    cachedHome: cachedHome,
    updateCachedDaily: updateCachedDaily,
    updateCachedStreak: updateCachedStreak,
    clearHome: clearHome,
    signup: signup,
    login: login,
    logout: logout,
    resetPassword: resetPassword,
    me: me,
    updateName: updateName,
    loadHome: loadHome,
    queueProgress: queueProgress,
    queueCount: queueCount,
    flush: flush,
    authMessage: authMessage
  };
})();
