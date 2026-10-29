/* =========================================================
   VocabLab — handlers/routes.js
   The whole API surface in one table.

   Vercel turns every file under api/ into a Serverless Function,
   and the Hobby plan allows 12 per deployment — so api/ holds a
   single catch-all function (api/[...path].js) that looks the
   request up here. Every handler is a *static* require so
   Vercel's bundler traces it into that one function; a dynamic
   require would be invisible to it and fail at runtime.

   Adding an endpoint: drop the file in handlers/, add one line.
   ========================================================= */
'use strict';

const ROUTES = {
  '/api/health': require('./health.js'),
  '/api/ai-free': require('./ai-free.js'),
  '/api/home': require('./home.js'),
  '/api/profile': require('./profile.js'),
  '/api/community': require('./community.js'),
  '/api/exam-script': require('./exam-script.js'),
  '/api/auth/signup': require('./auth/signup.js'),
  '/api/auth/login': require('./auth/login.js'),
  '/api/auth/logout': require('./auth/logout.js'),
  '/api/auth/me': require('./auth/me.js'),
  '/api/auth/reset': require('./auth/reset.js'),
  '/api/daily/progress': require('./daily/progress.js'),
  '/api/admin/users': require('./admin/users.js'),
  '/api/admin/user': require('./admin/user.js'),
  '/api/admin/settings': require('./admin/settings.js'),
  '/api/admin/script': require('./admin/script.js')
};

module.exports = { ROUTES };
