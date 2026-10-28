/* =========================================================
   VocabLab — community.js
   The member directory on #/community: every account's name and
   partly hidden email, with an initials avatar (no uploads yet).
   ========================================================= */
(function () {
  'use strict';

  const U = Util;
  let cache = null;
  let busy = false;
  let requestId = 0;

  function el() {
    return {
      grid: document.getElementById('communityGrid'),
      count: document.getElementById('communityCount')
    };
  }

  /** "Mai Nguyen" -> "MN"; a single word gives its first letter. */
  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  /** Stable colour per name, so the same learner keeps the same avatar. */
  function hue(name) {
    let h = 0;
    const value = String(name || '');
    for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) % 360;
    return h;
  }

  function avatar(user) {
    const node = document.createElement('span');
    node.className = 'community-avatar';
    node.style.setProperty('--avatar-hue', String(hue(user.name)));
    node.setAttribute('aria-hidden', 'true');
    node.textContent = initials(user.name);
    return node;
  }

  function card(user) {
    const node = document.createElement('article');
    node.className = 'card community-card';
    node.appendChild(avatar(user));

    const text = document.createElement('div');
    text.className = 'community-text';

    const name = document.createElement('h2');
    name.className = 'community-name';
    name.textContent = user.name || 'Learner';

    const email = document.createElement('p');
    email.className = 'community-email';
    email.textContent = user.email || '';

    text.appendChild(name);
    if (user.email) text.appendChild(email);
    node.appendChild(text);
    return node;
  }

  function empty(message, retry) {
    const node = document.createElement('div');
    node.className = 'community-empty';
    const text = document.createElement('p');
    text.className = 'muted';
    text.textContent = message;
    node.appendChild(text);
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-subtle btn-sm';
      button.textContent = I18n.t('community.retry');
      button.addEventListener('click', function () { load(); });
      node.appendChild(button);
    }
    return node;
  }

  /** Draw the grid from the last successful response. */
  function paint() {
    const E = el();
    if (!E.grid) return;
    const users = (cache && cache.users) || [];
    E.grid.textContent = '';

    if (E.count) {
      E.count.hidden = !users.length;
      E.count.textContent = users.length
        ? I18n.t(users.length === 1 ? 'community.countOne' : 'community.count', { n: users.length })
        : '';
    }
    if (!users.length) {
      E.grid.appendChild(empty(I18n.t('community.empty'), false));
      return;
    }
    users.forEach(function (user) { E.grid.appendChild(card(user)); });
  }

  function failed(err) {
    const E = el();
    if (!E.grid) return;
    if (E.count) E.count.hidden = true;
    E.grid.textContent = '';
    E.grid.appendChild(empty(I18n.t('community.error'), true));
    if (window.console && console.warn) console.warn('Community list failed:', err && err.message);
  }

  async function load() {
    const E = el();
    if (!E.grid) return;

    if (cache) {
      paint();
    } else {
      E.grid.textContent = '';
      const waiting = document.createElement('p');
      waiting.className = 'muted community-loading';
      waiting.textContent = I18n.t('community.loading');
      E.grid.appendChild(waiting);
    }
    if (busy) return;

    busy = true;
    const mine = ++requestId;
    try {
      const data = await Account.api('/community');
      if (mine !== requestId) return;
      cache = { users: (data && data.users) || [] };
      paint();
    } catch (err) {
      if (mine !== requestId) return;
      cache = null;
      failed(err);
    } finally {
      if (mine === requestId) busy = false;
    }
  }

  function render() {
    load();
  }

  document.addEventListener('vocablab:language', function () {
    if (cache) paint();
  });

  window.Community = {
    render: render,
    initials: initials,
    hue: hue
  };
})();
