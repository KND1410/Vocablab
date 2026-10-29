/* =========================================================
   VocabLab — js/admin.js
   The owner's panel on #/admin. Server-enforced: the page only
   draws what /api/admin/users returns, and every action is a
   POST the API re-checks. No password or hash ever reaches the
   browser.
   ========================================================= */
(function () {
  'use strict';

  const U = Util;
  let data = null;
  let busy = false;
  let requestId = 0;
  let notice = '';
  let noticeKind = '';
  let query = '';

  function root() { return document.getElementById('adminRoot'); }

  /** Show the nav entry only for an admin. Safe to call on every home render. */
  function syncNav(user) {
    const link = document.getElementById('navAdmin');
    if (!link) return;
    const me = user || (window.Account && Account.cachedUser && Account.cachedUser());
    const who = me && me.user ? me.user : me;
    link.hidden = !(who && who.role === 'admin');
  }

  /* ---------- Small pieces ---------- */

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function timeAgo(iso) {
    if (!iso) return I18n.t('admin.never');
    const then = new Date(iso).getTime();
    if (!isFinite(then)) return I18n.t('admin.never');
    const diff = Date.now() - then;
    const minute = 60000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const locale = I18n.lang();
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      if (diff < minute) return rtf.format(0, 'second');
      if (diff < hour) return rtf.format(-Math.round(diff / minute), 'minute');
      if (diff < day) return rtf.format(-Math.round(diff / hour), 'hour');
      if (diff < 30 * day) return rtf.format(-Math.round(diff / day), 'day');
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(then));
    } catch (e) {
      return new Intl.DateTimeFormat(locale).format(new Date(then));
    }
  }

  function statusLabel(status) {
    if (status === 'pending') return I18n.t('admin.statusPending');
    if (status === 'banned') return I18n.t('admin.statusBanned');
    return I18n.t('admin.statusActive');
  }

  function setNotice(text, kind) {
    notice = text || '';
    noticeKind = kind || '';
  }

  function toast(text, kind) {
    if (window.Util && U.toast) U.toast(text, kind || 'ok');
  }

  /* ---------- Painting ---------- */

  function statCard(label, value, hint) {
    const card = node('section', 'card metric-card admin-stat');
    card.appendChild(node('span', 'metric-label', label));
    card.appendChild(node('strong', 'metric-value', String(value)));
    if (hint) card.appendChild(node('p', 'muted tiny', hint));
    return card;
  }

  function paintStats(host) {
    const stats = (data && data.stats) || {};
    const grid = node('div', 'admin-stats');
    grid.appendChild(statCard(I18n.t('admin.learners'), stats.learners || 0,
      I18n.t('admin.joinedWeek', { n: stats.joinedThisWeek || 0 })));
    grid.appendChild(statCard(I18n.t('admin.activeWeek'), stats.activeThisWeek || 0,
      I18n.t('admin.activeWeekHint')));
    grid.appendChild(statCard(I18n.t('admin.pending'), stats.pending || 0,
      I18n.t('admin.pendingHint')));
    grid.appendChild(statCard(I18n.t('admin.banned'), stats.banned || 0,
      I18n.t('admin.bannedHint')));
    host.appendChild(grid);
  }

  function actionButton(row, action, label, cls) {
    const button = node('button', 'btn btn-sm ' + (cls || 'btn-subtle'), label);
    button.type = 'button';
    button.disabled = busy;
    button.addEventListener('click', function () {
      if (action === 'ban' && button.dataset.armed !== '1') {
        button.dataset.armed = '1';
        button.textContent = I18n.t('admin.confirm');
        button.classList.add('is-armed');
        setTimeout(function () {
          if (!button.isConnected) return;
          button.dataset.armed = '';
          button.textContent = label;
          button.classList.remove('is-armed');
        }, 5000);
        return;
      }
      act(row.id, action, label);
    });
    return button;
  }

  function userRow(user) {
    const me = String((data && data.adminId) || '');
    const tr = node('tr', 'admin-row');
    if (user.status === 'banned') tr.classList.add('is-banned');
    if (user.status === 'pending') tr.classList.add('is-pending');

    const who = node('td', 'admin-cell-user');
    const name = node('div', 'admin-user-name');
    name.appendChild(node('strong', '', user.name || 'Learner'));
    if (user.role === 'admin') name.appendChild(node('span', 'pill pill-accent', I18n.t('admin.you')));
    who.appendChild(name);
    who.appendChild(node('span', 'admin-user-email', user.email || ''));
    tr.appendChild(who);

    const status = node('td');
    status.appendChild(node('span', 'pill admin-pill-' + user.status, statusLabel(user.status)));
    tr.appendChild(status);

    tr.appendChild(node('td', 'admin-num', user.streak && user.streak.current
      ? I18n.t('admin.streakDays', { n: user.streak.current })
      : '—'));
    tr.appendChild(node('td', 'admin-num', user.daysCompleted
      ? I18n.t('admin.days', { n: user.daysCompleted })
      : '—'));
    tr.appendChild(node('td', 'admin-when', timeAgo(user.lastLoginAt)));

    const actions = node('td', 'admin-actions');
    if (String(user.id) === me) {
      actions.appendChild(node('span', 'muted tiny', I18n.t('admin.thisIsYou')));
    } else if (user.status === 'pending') {
      actions.appendChild(actionButton(user, 'approve', I18n.t('admin.approve'), 'btn-primary'));
      actions.appendChild(actionButton(user, 'ban', I18n.t('admin.ban'), 'btn-danger-ghost'));
    } else if (user.status === 'banned') {
      actions.appendChild(actionButton(user, 'unban', I18n.t('admin.unban'), 'btn-primary'));
    } else if (user.role !== 'admin') {
      actions.appendChild(actionButton(user, 'ban', I18n.t('admin.ban'), 'btn-danger-ghost'));
    }
    tr.appendChild(actions);
    return tr;
  }

  function filteredUsers() {
    const users = (data && data.users) || [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(function (u) {
      return String(u.name || '').toLowerCase().indexOf(q) !== -1 ||
        String(u.email || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  function paintUsers(host) {
    const card = node('section', 'card admin-users');

    const head = node('div', 'admin-toolbar');
    head.appendChild(node('h2', 'admin-h2', I18n.t('admin.accounts')));
    const search = node('input', 'input admin-search');
    search.type = 'search';
    search.value = query;
    search.placeholder = I18n.t('admin.search');
    search.setAttribute('aria-label', I18n.t('admin.search'));
    search.addEventListener('input', function () {
      query = search.value;
      const body = card.querySelector('.admin-table-body');
      if (body) paintRows(body);
    });
    head.appendChild(search);
    const refresh = node('button', 'btn btn-subtle btn-sm', I18n.t('admin.refresh'));
    refresh.type = 'button';
    refresh.disabled = busy;
    refresh.addEventListener('click', function () { load({ force: true }); });
    head.appendChild(refresh);
    card.appendChild(head);

    const wrap = node('div', 'admin-table-wrap');
    const table = node('table', 'admin-table');
    const thead = node('thead');
    const hr = node('tr');
    ['admin.colUser', 'admin.colStatus', 'admin.colStreak', 'admin.colDays', 'admin.colSeen', 'admin.colActions']
      .forEach(function (key) {
        hr.appendChild(node('th', '', I18n.t(key)));
      });
    thead.appendChild(hr);
    table.appendChild(thead);
    const body = node('tbody', 'admin-table-body');
    table.appendChild(body);
    wrap.appendChild(table);
    card.appendChild(wrap);
    paintRows(body);
    host.appendChild(card);
  }

  function paintRows(body) {
    body.textContent = '';
    const users = filteredUsers();
    if (!users.length) {
      const tr = node('tr');
      const td = node('td', 'admin-empty', data && data.users && data.users.length
        ? I18n.t('admin.noMatch') : I18n.t('admin.noAccounts'));
      td.colSpan = 6;
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    users.forEach(function (user) { body.appendChild(userRow(user)); });
  }

  function paintSettings(host) {
    const card = node('section', 'card admin-settings');
    card.appendChild(node('h2', 'admin-h2', I18n.t('admin.settings')));
    card.appendChild(node('p', 'muted small', I18n.t('admin.settingsBody')));

    const label = node('label', 'admin-switch');
    const box = node('input');
    box.type = 'checkbox';
    box.checked = !!(data && data.settings && data.settings.signupApproval);
    box.disabled = busy;
    box.addEventListener('change', function () {
      saveSettings(!!box.checked);
    });
    label.appendChild(box);
    label.appendChild(node('span', '', I18n.t('admin.requireApproval')));
    card.appendChild(label);
    host.appendChild(card);
  }

  function paintAudit(host) {
    const card = node('section', 'card admin-audit');
    card.appendChild(node('h2', 'admin-h2', I18n.t('admin.audit')));
    const rows = (data && data.audit) || [];
    if (!rows.length) {
      card.appendChild(node('p', 'muted small', I18n.t('admin.auditEmpty')));
      host.appendChild(card);
      return;
    }
    const list = node('ul', 'admin-audit-list');
    rows.forEach(function (row) {
      const item = node('li', 'admin-audit-row');
      item.appendChild(node('span', 'admin-audit-what',
        I18n.t('admin.auditLine', {
          action: I18n.t('admin.act.' + row.action, {}) || row.action,
          name: row.targetName || row.targetEmail || row.detail || '—'
        })));
      item.appendChild(node('span', 'admin-audit-when', timeAgo(row.at)));
      list.appendChild(item);
    });
    card.appendChild(list);
    host.appendChild(card);
  }

  function paintNotice(host) {
    if (!notice) return;
    host.appendChild(node('p', 'admin-notice ' + noticeKind, notice));
  }

  function forbidden(host) {
    const card = node('section', 'card admin-forbidden');
    card.appendChild(node('h2', 'admin-h2', I18n.t('admin.forbiddenTitle')));
    card.appendChild(node('p', 'muted', I18n.t('admin.forbiddenBody')));
    host.appendChild(card);
  }

  function errorCard(host, message) {
    const card = node('section', 'card admin-forbidden');
    card.appendChild(node('h2', 'admin-h2', I18n.t('admin.errorTitle')));
    card.appendChild(node('p', 'muted', message || I18n.t('admin.errorBody')));
    const retry = node('button', 'btn btn-subtle btn-sm', I18n.t('admin.retry'));
    retry.type = 'button';
    retry.addEventListener('click', function () { load({ force: true }); });
    card.appendChild(retry);
    host.appendChild(card);
  }

  function paint() {
    const host = root();
    if (!host) return;
    host.textContent = '';
    if (!data) {
      host.appendChild(node('p', 'muted admin-loading', I18n.t('admin.loading')));
      return;
    }
    paintNotice(host);
    paintStats(host);
    paintUsers(host);
    const split = node('div', 'admin-split');
    paintSettings(split);
    paintAudit(split);
    host.appendChild(split);
  }

  /* ---------- Data ---------- */

  async function load(opts) {
    const o = opts || {};
    const host = root();
    if (!host) return;
    if (busy) return;
    if (!data || o.force) {
      if (!data) {
        host.textContent = '';
        host.appendChild(node('p', 'muted admin-loading', I18n.t('admin.loading')));
      }
    }
    busy = true;
    const mine = ++requestId;
    try {
      const fresh = await Account.api('/admin/users');
      if (mine !== requestId) return;
      data = fresh;
      // Clear the flag before painting: every control is disabled while busy,
      // so a paint that runs first would leave the panel inert.
      busy = false;
      paint();
    } catch (err) {
      if (mine !== requestId) return;
      busy = false;
      host.textContent = '';
      if (err && err.status === 403) {
        data = null;
        forbidden(host);
        return;
      }
      errorCard(host, err && err.message);
    }
  }

  async function act(id, action, label) {
    if (busy) return;
    busy = true;
    paint();
    try {
      await Account.api('/admin/user', { method: 'POST', body: { id: id, action: action } });
      toast(I18n.t('admin.done', { action: label }), 'ok');
      setNotice('', '');
      busy = false;
      await load({ force: true });
    } catch (err) {
      busy = false;
      setNotice((err && err.message) || I18n.t('admin.actionFailed'), 'is-bad');
      paint();
    }
  }

  async function saveSettings(value) {
    if (busy) return;
    busy = true;
    paint();
    try {
      const fresh = await Account.api('/admin/settings', {
        method: 'PATCH',
        body: { signupApproval: !!value }
      });
      if (data) data.settings = fresh;
      toast(I18n.t('admin.settingsSaved'), 'ok');
      setNotice('', '');
    } catch (err) {
      busy = false;
      setNotice((err && err.message) || I18n.t('admin.actionFailed'), 'is-bad');
      paint();
      return;
    }
    // Reload so the new setting's log entry appears immediately.
    busy = false;
    await load({ force: true });
  }

  function render() {
    syncNav();
    if (!data) {
      const host = root();
      if (host) {
        host.textContent = '';
        host.appendChild(node('p', 'muted admin-loading', I18n.t('admin.loading')));
      }
    }
    load();
  }

  document.addEventListener('vocablab:language', function () {
    if (data) paint();
  });

  /** Forget cached panel data (sign-out, account switch). */
  function reset() {
    data = null;
    query = '';
    notice = '';
    const host = root();
    if (host) host.textContent = '';
  }

  window.Admin = {
    render: render,
    load: load,
    reset: reset,
    syncNav: syncNav
  };
})();
