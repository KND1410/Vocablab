/* =========================================================
   VocabLab — js/exam-guide.js
   The DELF B2 writing method used by the exam essay feedback.
   Criteria distilled from Stéphane Wattier, « Production écrite
   DELF B2 » (2017), used as a reference by the AI examiner.
   The book itself stays local and is never bundled.
   ========================================================= */
(function (global) {
  'use strict';

  const GUIDE = {
    title: 'Production écrite DELF B2',
    author: 'Stéphane Wattier',
    year: 2017,
    isbn: '9781549947193',
    method: 'Grille de révision et critères d’évaluation du guide',
    targetWords: 250,
    minWords: 225,
    maxWords: 275,
    contentPoints: 14,
    formPoints: 11,
    totalPoints: 25,
    article: 'Un article de presse comporte un titre, un chapeau (qui joue le rôle d’introduction) et une signature. Chaque paragraphe développe une idée principale, avec des arguments secondaires et des exemples précis ; on laisse un espace entre les parties.',
    letter: 'Une lettre ou une réclamation respecte les usages de la correspondance : formule d’appel (Madame, Monsieur,), présentation claire des faits (quand, où, quoi) avec les détails donnés dans la consigne, demande explicite et formulée avec courtoisie, formule de politesse finale et signature. Le ton reste poli et ferme, jamais familier ni agressif.',
    steps: [
      'Analyser la situation de communication et la consigne : qui écrit, à qui, pourquoi, quel type de texte et quels éléments sont exigés.',
      'Planifier 2 ou 3 parties, avec une idée principale par paragraphe et des exemples précis.',
      'Rédiger : introduction ou chapeau, développement argumenté avec connecteurs, conclusion qui résume sans ajouter d’argument.',
      'Réviser d’abord le contenu (consigne, plan, cohérence), puis la langue (phrases, grammaire, vocabulaire, orthographe).'
    ],
    criteria: [
      {
        id: 'consigne', group: 'content', label: 'Respect de la consigne', points: 2,
        checks: 'situation de communication comprise ; tout le contenu reste lié au sujet ; le type de texte demandé est respecté ; la longueur minimale est atteinte.'
      },
      {
        id: 'registre', group: 'content', label: 'Correction sociolinguistique', points: 2,
        checks: 'aucun mot familier ; aucune construction orale ; les formules d’usage sont présentes quand le texte le demande.'
      },
      {
        id: 'faits', group: 'content', label: 'Capacité à présenter des faits', points: 3,
        checks: 'les faits sont clairs et précis ; les arguments sont illustrés par des exemples bien choisis.'
      },
      {
        id: 'argumenter', group: 'content', label: 'Capacité à argumenter', points: 3,
        checks: 'l’opinion générale est clairement exprimée ; les arguments sont développés de manière détaillée.'
      },
      {
        id: 'coherence', group: 'content', label: 'Cohérence et cohésion', points: 4,
        checks: 'les règles de mise en page sont respectées ; le plan est bien structuré ; les arguments s’enchaînent avec logique et sont reliés par des connecteurs ; la ponctuation est correcte.'
      },
      {
        id: 'vocabulaire-etendue', group: 'form', label: 'Étendue du vocabulaire', points: 2,
        checks: 'le vocabulaire lié au sujet est assez riche ; des manques ou des erreurs sont tolérés.'
      },
      {
        id: 'vocabulaire-maitrise', group: 'form', label: 'Maîtrise du vocabulaire', points: 2,
        checks: 'les mots sont bien choisis en général ; les erreurs sont tolérées si elles ne gênent pas la compréhension.'
      },
      {
        id: 'orthographe', group: 'form', label: 'Maîtrise de l’orthographe', points: 1,
        checks: 'les mots courants sont correctement orthographiés ; des erreurs sont tolérées pour les mots difficiles.'
      },
      {
        id: 'formes', group: 'form', label: 'Choix des formes', points: 4,
        checks: 'les règles de grammaire courantes sont généralement respectées ; les erreurs qui gênent la compréhension comptent.'
      },
      {
        id: 'phrases', group: 'form', label: 'Degré d’élaboration des phrases', points: 2,
        checks: 'les constructions de phrases sont variées ; le texte comprend quelques phrases complexes.'
      }
    ]
  };

  const LANG_NAMES = { en: 'English', vi: 'Vietnamese', fr: 'French' };

  function languageName(code) {
    return LANG_NAMES[code] || 'English';
  }

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function criteriaLines(group) {
    return GUIDE.criteria.filter(function (c) { return c.group === group; }).map(function (c) {
      return '— ' + c.label + ' (' + c.points + ' pts) : ' + c.checks;
    }).join('\n');
  }

  /**
   * Build the examiner prompt. `opts`: { task, essay, words, language, type }.
   * `type` is 'article' or 'letter'; an unknown or missing type falls back to
   * whatever the task text itself suggests, so a réclamation is never graded
   * against press-article rules.
   * The marker PRODUCTION DU CANDIDAT is also used by the test fixtures.
   */
  function requirements(type, task) {
    const kind = type === 'letter' || type === 'article'
      ? type
      : /\blettre\b|\bréclam/i.test(task) ? 'letter' : 'article';
    if (kind === 'letter') {
      return { heading: 'EXIGENCES DE LA LETTRE', text: GUIDE.letter };
    }
    return { heading: 'EXIGENCES DE L’ARTICLE', text: GUIDE.article };
  }

  function buildFeedbackPrompt(opts) {
    opts = opts || {};
    const task = String(opts.task || '').trim();
    const essay = String(opts && opts.essay || '').trim();
    const words = opts && opts.words != null ? opts.words : wordCount(essay);
    const language = languageName(opts && opts.language);
    const below = words < GUIDE.minWords;
    const band = below
      ? 'Le texte est trop court : ' + words + ' mots pour un minimum de ' + GUIDE.minWords + ' (cible ' + GUIDE.targetWords + ').'
      : 'Longueur : ' + words + ' mots (minimum ' + GUIDE.minWords + ', cible ' + GUIDE.targetWords + ' ; un dépassement modéré de ' + GUIDE.maxWords + ' est toléré).';

    const system = 'Tu es un examinateur habilité du DELF B2, spécialiste de la production écrite. ' +
      'Tu appliques la grille du guide « ' + GUIDE.title + ' » de ' + GUIDE.author + ' (' + GUIDE.year + ') : ' +
      'le contenu compte pour ' + GUIDE.contentPoints + ' points et la forme pour ' + GUIDE.formPoints + ' points. ' +
      'Tu corriges avec bienveillance et exigence, sans réécrire le texte à la place du candidat et sans inventer d’erreur. ' +
      'Tu réponds uniquement en ' + language + '.';

    const prompt = [
      'MÉTHODE DE RÉFÉRENCE',
      '« ' + GUIDE.title + ' », ' + GUIDE.author + ', ' + GUIDE.year + ' — ' + GUIDE.method + '.',
      'Barème : ' + GUIDE.contentPoints + ' points sur ' + GUIDE.totalPoints + ' pour le contenu, ' + GUIDE.formPoints + ' sur ' + GUIDE.totalPoints + ' pour la forme.',
      '',
      'CONSIGNE DE L’ÉPREUVE',
      task,
      '',
      'PRODUCTION DU CANDIDAT (' + words + ' mots)',
      '"""',
      essay,
      '"""',
      '',
      band,
      '',
      'GRILLE D’ÉVALUATION — CONTENU (' + GUIDE.contentPoints + ' points)',
      criteriaLines('content'),
      '',
      'GRILLE D’ÉVALUATION — FORME (' + GUIDE.formPoints + ' points)',
      criteriaLines('form'),
      '',
      'MÉTHODE',
      GUIDE.steps.map(function (step, i) { return (i + 1) + '. ' + step; }).join('\n'),
      '',
      requirements(opts.type, task).heading,
      requirements(opts.type, task).text,
      'Vérifie aussi que le texte répond à toutes les parties de la consigne (par exemple : expliquer la raison d’être de l’association, demander un espace, donner des arguments et des exemples précis).',
      '',
      'FORME DE TA RÉPONSE',
      '1. Bilan en 2 ou 3 phrases.',
      '2. Grille notée critère par critère, avec un total sur 25, en séparant clairement le contenu (14 points) et la forme (11 points).',
      '3. Deux points forts précis.',
      '4. Trois corrections ciblées, au format « extrait fautif → correction → règle », sans réécrire le texte.',
      '5. Deux priorités de travail, classées par impact sur la note.',
      '6. Rappelle la longueur et, si nécessaire, ce qui manque dans la consigne.',
      'Sois concret et limite-toi à environ 300 mots.'
    ].join('\n');

    return { system: system, prompt: prompt };
  }

  global.ExamGuide = {
    guide: GUIDE,
    languageName: languageName,
    wordCount: wordCount,
    buildFeedbackPrompt: buildFeedbackPrompt
  };
})(typeof window !== 'undefined' ? window : globalThis);
