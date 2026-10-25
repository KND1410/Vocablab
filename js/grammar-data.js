/* =========================================================
   VocabLab — grammar-data.js
   The 18-chapter French tenses course. Explanations are
   bilingual; examples stay in French with VI/EN meanings.
   ========================================================= */
(function (global) {
  'use strict';

  var GD = global.GrammarData = {
    title: { vi: 'Bản đồ các thì', en: 'Tense Atlas' },
    subtitle: { vi: 'Cẩm nang DELF B2 · 18 chương', en: 'DELF B2 handbook · 18 chapters' },
    intro: {
      vi: 'Học từ bản đồ tổng thể đến từng thì, rồi luyện bằng bài tập ngắn và hỏi gia sư AI khi cần.',
      en: 'Start with the whole tense map, work through each tense, then practise with short exercises and ask the AI tutor when you need help.'
    },
    parts: [
      { id: 'start', title: { vi: 'Bắt đầu', en: 'Getting started' } },
      { id: 'present', title: { vi: 'Hiện tại', en: 'The present' } },
      { id: 'past', title: { vi: 'Các thì quá khứ', en: 'The past' } },
      { id: 'future', title: { vi: 'Tương lai', en: 'The future' } },
      { id: 'moods', title: { vi: 'Thức và câu điều kiện', en: 'Moods & conditions' } },
      { id: 'tools', title: { vi: 'Cấu trúc bổ trợ', en: 'Advanced tools' } },
      { id: 'review', title: { vi: 'So sánh & ôn tập', en: 'Compare & review' } }
    ],
    chapters: []
  };

  function P(vi, en) { return { type: 'p', vi: vi, en: en }; }
  function H(vi, en) { return { type: 'h', vi: vi, en: en }; }
  function LIST(vi, en) { return { type: 'list', vi: vi, en: en }; }
  function TABLE(head, rows, caption) {
    return {
      type: 'table',
      head: head.map(cell),
      rows: rows.map(function (row) { return row.map(cell); }),
      caption: caption || ''
    };
  }
  function FORMULA(vi, en) { return { type: 'formula', vi: vi, en: en }; }
  function CALLOUT(kind, vi, en) { return { type: 'callout', kind: kind, vi: vi, en: en }; }
  function EXAMPLES(items) { return { type: 'examples', items: items }; }
  function EX(fr, vi, en) { return { fr: fr, vi: vi, en: en }; }
  function FILL(text, answers, explainVi, explainEn) {
    if (!Array.isArray(answers[0])) answers = [answers];
    return {
      type: 'fill', text: text,
      answers: answers.map(function (a) { return Array.isArray(a) ? a : [a]; }),
      explain: { vi: explainVi, en: explainEn }
    };
  }
  function CHOICE(questionVi, questionEn, options, answer, explainVi, explainEn) {
    return {
      type: 'choice', question: { vi: questionVi, en: questionEn },
      options: options, answer: answer, explain: { vi: explainVi, en: explainEn }
    };
  }
  function TRANSLATE(sourceVi, sourceEn, answers, explainVi, explainEn) {
    return {
      type: 'translate', source: { vi: sourceVi, en: sourceEn },
      answers: answers, explain: { vi: explainVi, en: explainEn }
    };
  }

  /* Table cells are shared by all 38 tables. French examples and conjugation
     forms have no entry here, so they stay unchanged in English mode. */
  var EN_CELLS = {
    "Thì": "Tense",
    "Dùng để": "Used for",
    "Ví dụ": "Example",
    "Thức": "Mood",
    "Tiếng Pháp": "French",
    "Tiếng Anh": "English",
    "Nghĩa": "Meaning",
    "Ghi chú": "Note",
    "Nhóm": "Group",
    "Đuôi": "Ending",
    "Động từ": "Verb",
    "Cặp": "Pair",
    "Participe passé": "Past participle",
    "Trợ động từ": "Auxiliary",
    "Quy tắc": "Rule",
    "Cách dùng": "Use",
    "Cách thức": "Manner",
    "Ý nghĩa": "Meaning",
    "Loại": "Type",
    "Nửa SI": "If-clause",
    "Nửa kết quả": "Result clause",
    "Cấu trúc": "Structure",
    "Đi với": "Takes",
    "Liên từ": "Conjunction",
    "Cụm từ đi trước": "Trigger phrase",
    "Lời nói trực tiếp": "Direct speech",
    "Lời nói gián tiếp (động từ ở quá khứ)": "Indirect speech (past reporting verb)",
    "Trực tiếp": "Direct",
    "Gián tiếp": "Indirect",
    "Thường đi với imparfait": "Often used with the imparfait",
    "Thường đi với passé composé": "Often used with the passé composé",
    "gốc": "stem",
    "Gốc": "Stem",
    "Mô tả bối cảnh": "Describing the background",
    "Thói quen trong quá khứ": "Past habits",
    "Việc đang diễn ra thì bị cắt ngang": "An ongoing action interrupted",
    "Hai việc song song": "Two simultaneous actions",
    "Lý do, trạng thái": "Reason, state",
    "Sau si (giả sử)": "After si (hypothesis)",
    "Gợi ý, lịch sự": "Suggestions, politeness",
    "Phông nền, đạo cụ": "Background, setting",
    "Diễn biến, hành động": "Plot, actions",
    "Mô tả: trời, người, cảm xúc": "Description: weather, people, feelings",
    "Việc xảy ra, kể từng bước": "Events, told step by step",
    "Thói quen, lặp đi lặp lại": "Habits, repeated actions",
    "Xảy ra một lần, hoàn tất": "Happened once, completed",
    "Việc bị cắt ngang": "Interrupted action",
    "Việc cắt ngang": "Interrupting action",
    "Có thể kéo dài, không rõ kết thúc": "Can last, no clear end",
    "Có điểm kết thúc rõ": "Clear end point",
    "Việc xảy ra trước một việc quá khứ khác": "An event before another past event",
    "Việc đã xong, có kết quả hoặc điểm kết thúc": "A completed event, with a result or clear end",
    "Bối cảnh, thói quen, trạng thái trong quá khứ": "Background, habits or states in the past",
    "Bây giờ, thói quen, sự thật": "Now, habits, facts",
    "Vừa mới làm": "Something just done",
    "Sắp làm": "Something about to happen",
    "Sẽ làm": "Something that will happen",
    "Sẽ xong trước một mốc tương lai": "Will be finished before a future point",
    "Lịch sự, ước muốn, lời khuyên, giả định": "Politeness, wishes, advice, hypotheses",
    "Điều muốn, cần, sợ, nghi ngờ, chưa chắc": "Wishes, needs, fear, doubt, uncertainty",
    "Ra lệnh, khuyên, mời": "Orders, advice, invitations",
    "tôi": "I",
    "bạn (thân mật)": "you (informal)",
    "anh ấy / cô ấy / người ta": "he / she / one",
    "chúng tôi": "we",
    "các bạn / ngài": "you (plural/formal)",
    "họ": "they",
    "j’ trước nguyên âm hoặc h câm: j’aime, j’habite": "j’ before a vowel or silent h: j’aime, j’habite",
    "dùng với bạn bè, người nhà, trẻ em": "used with friends, family, children",
    "on chia như il và rất phổ biến trong văn nói": "on is conjugated like il and is very common in speech",
    "dùng cho một người lạ hoặc nhiều người": "used for one stranger or several people",
    "ils cho nhóm nam hoặc nhóm hỗn hợp": "ils for an all-male or mixed group",
    "khoảng 90% động từ, đều nhất": "about 90% of verbs, the most regular group",
    "có -iss- ở số nhiều": "adds -iss- in the plural",
    "nhiều động từ bất quy tắc": "many irregular verbs",
    "đổi thành -é": "changes to -é",
    "đổi thành -i": "changes to -i",
    "thường đổi thành -u": "usually changes to -u",
    "đi / đến": "go / come",
    "đến / rời đi": "arrive / leave",
    "vào / ra": "enter / go out",
    "lên / xuống": "go up / go down",
    "sinh / mất": "be born / die",
    "ở lại / ngã": "stay / fall",
    "thêm": "also",
    "hòa hợp với chủ ngữ: thêm -e nếu nữ, -s nếu số nhiều": "agrees with the subject: add -e for feminine, -s for plural",
    "hòa hợp với COD đứng trước; COD đứng sau thì không hòa hợp": "agrees with a preceding direct object; no agreement when the object follows",
    "hòa hợp với COD nếu COD đứng trước (thường là se)": "agrees with a preceding direct object (usually se)",
    "phản thân": "reflexive",
    "Je savais = tôi đã biết": "Je savais = I knew",
    "J’ai su = tôi vừa biết ra": "J’ai su = I found out",
    "Il voulait = anh ấy muốn": "Il voulait = he wanted",
    "Il a voulu = anh ấy đã quyết muốn và làm": "Il a voulu = he decided to and did",
    "Je pouvais = tôi có thể": "Je pouvais = I could",
    "J’ai pu = tôi đã làm được": "J’ai pu = I managed to",
    "Je la connaissais = tôi biết cô ấy": "Je la connaissais = I knew her",
    "Je l’ai connue = tôi đã quen cô ấy lần đầu": "Je l’ai connue = I met her for the first time",
    "Lịch sự": "Politeness",
    "Lời khuyên": "Advice",
    "Ước muốn": "Wish",
    "Tin chưa kiểm chứng (báo chí)": "Unconfirmed report (news)",
    "Câu điều kiện loại 2": "Second conditional",
    "Tương lai trong quá khứ": "Future in the past",
    "Sau au cas où": "After au cas où",
    "Có khả năng thật": "A real possibility",
    "Giả sử, mơ ước ở hiện tại": "Hypothesis or present wish",
    "Không thật, hối tiếc ở quá khứ": "Unreal, past regret",
    "Quá khứ → hậu quả hiện tại": "Past → present consequence",
    "Hỗn hợp": "Mixed",
    "MUỐN, YÊU CẦU": "WISH, REQUEST",
    "CẦN, BẮT BUỘC": "NEED, OBLIGATION",
    "CẢM XÚC": "EMOTION",
    "NGHI NGỜ, KHẢ NĂNG": "DOUBT, POSSIBILITY",
    "Mục đích": "Purpose",
    "Nhượng bộ": "Concession",
    "Điều kiện": "Condition",
    "Thời gian": "Time",
    "Phủ định": "Negation",
    "Đồng thời": "Simultaneity",
    "Nguyên nhân": "Cause",
    "Đối lập (có tout)": "Contrast (with tout)",
    "Khác": "Other",
    "giữ nguyên": "unchanged",
    "de + nguyên mẫu": "de + infinitive",
    "futur (hoặc présent, impératif)": "futur (or présent, impératif)",
    "Kỹ năng": "Skill",
    "Dùng gì từ cẩm nang?": "What to use from the handbook?",
    "Viết (essai argumenté, thư trang trọng)": "Writing (argumentative essay, formal letter)",
    "2–3 câu subjonctif (ch. 11), 1 câu hypothèse (ch. 10), 1 gérondif/participe présent, 1 infinitif passé (ch. 13), liên từ nhượng bộ: bien que, même si, certes… mais…": "2–3 subjunctive sentences (ch. 11), 1 hypothesis sentence (ch. 10), 1 gérondif/participe présent, 1 infinitif passé (ch. 13), concession links: bien que, même si, certes… mais…",
    "Nói (bảo vệ quan điểm)": "Speaking (defending a view)",
    "Conditionnel để nuance: Je dirais que…, On pourrait penser que… (ch. 9)": "Conditionnel for nuance: Je dirais que…, On pourrait penser que… (ch. 9)",
    "Đọc": "Reading",
    "Nhận ra passé simple (ch. 16), conditionnel “tin chưa kiểm chứng” của báo chí, bị động (ch. 15)": "Recognise passé simple (ch. 16), the news conditional for unconfirmed reports, the passive (ch. 15)",
    "Nghe": "Listening",
    "Phân biệt passé composé / imparfait / plus-que-parfait để hiểu trình tự câu chuyện (ch. 6)": "Tell passé composé / imparfait / plus-que-parfait apart to follow the story (ch. 6)",
    "Past simple (sự kiện đã xong)": "Past simple (completed events)",
    "Past simple (thói quen/trạng thái), past continuous, used to": "Past simple (habits/states), past continuous, used to",
    "(gần như không có)": "(almost nonexistent)",
    "-re, -oir, -ir còn lại": "-re, -oir, remaining -ir",
    "-ir (nhóm 2)": "-ir (group 2)"
  };

  function cell(value) {
    if (typeof value !== 'string') return value;
    return { vi: value, en: EN_CELLS[value] || value };
  }

  GD.chapters = [

    /* -----------------------------------------------------
       1. The tense map
       ----------------------------------------------------- */
    {
      id: 'map', num: 1, part: 'start', minutes: 6,
      title: 'La carte des temps',
      subtitle: { vi: 'Bản đồ các thì', en: 'The tense map' },
      summary: {
        vi: 'Nhìn toàn bộ hệ thống trước khi học từng thì: mỗi thì trả lời câu hỏi “việc này xảy ra khi nào?” và “người nói chắc chắn đến đâu?”.',
        en: 'See the whole system before studying individual tenses: each tense answers “when did it happen?” and “how certain is the speaker?”.'
      },
      blocks: [
        P('Hãy tưởng tượng bạn xem bản đồ trước khi đi du lịch. Bạn chưa cần biết từng con phố, nhưng biết mình đang ở đâu và sẽ đi đâu. Các thì tiếng Pháp cũng vậy: chúng là công cụ để nói thời điểm và thái độ của người nói.',
          'Imagine looking at a map before a trip. You do not need every street yet, but you need to know where you are and where you are going. French tenses work the same way: they are tools for time and for the speaker’s attitude.'),
        H('Trục thời gian', 'The timeline'),
        TABLE(['Thì', 'Dùng để', 'Ví dụ'], [
          ['Plus-que-parfait', 'Việc xảy ra trước một việc quá khứ khác', 'J’avais fini.'],
          ['Passé composé', 'Việc đã xong, có kết quả hoặc điểm kết thúc', 'J’ai mangé.'],
          ['Imparfait', 'Bối cảnh, thói quen, trạng thái trong quá khứ', 'Je mangeais.'],
          ['Présent', 'Bây giờ, thói quen, sự thật', 'Je mange.'],
          ['Passé récent', 'Vừa mới làm', 'Je viens de manger.'],
          ['Futur proche', 'Sắp làm', 'Je vais manger.'],
          ['Futur simple', 'Sẽ làm', 'Je mangerai.'],
          ['Futur antérieur', 'Sẽ xong trước một mốc tương lai', 'J’aurai mangé.']
        ]),
        H('Ba thức nằm ngoài trục thời gian', 'Three moods outside the timeline'),
        TABLE(['Thức', 'Dùng để', 'Ví dụ'], [
          ['Conditionnel', 'Lịch sự, ước muốn, lời khuyên, giả định', 'Je voudrais un café.'],
          ['Subjonctif', 'Điều muốn, cần, sợ, nghi ngờ, chưa chắc', 'Il faut que tu viennes.'],
          ['Impératif', 'Ra lệnh, khuyên, mời', 'Viens ici !']
        ]),
        H('Ba bước chọn đúng thì', 'Three steps to choose the right tense'),
        LIST([
          'Bước 1: việc này xảy ra khi nào — quá khứ, hiện tại hay tương lai?',
          'Bước 2: người nói chắc chắn hay chỉ giả sử, mong muốn, nghi ngờ?',
          'Bước 3: chia theo công thức, rồi kiểm tra trợ động từ (avoir/être) và hòa hợp phân từ.'
        ], [
          'Step 1: when does it happen — past, present, or future?',
          'Step 2: is the speaker certain, or only supposing, wishing, doubting?',
          'Step 3: apply the form, then check the auxiliary (avoir/être) and participle agreement.'
        ]),
        CALLOUT('tip', 'Học đúng thứ tự: mỗi thì mới được xây từ thì trước. Futur dùng để làm conditionnel; imparfait dùng để làm plus-que-parfait.',
          'Learn in order: each new tense is built from an earlier one. The future stem builds the conditional; the imperfect builds the pluperfect.'),
        CALLOUT('english', 'Tiếng Anh có I work và I am working; tiếng Pháp thường chỉ dùng một dạng présent. Đừng dịch máy móc từng từ.',
          'English has I work and I am working; French usually uses one present form. Do not translate word for word.')
      ],
      exercises: [
        CHOICE('Thì nào thường mô tả bối cảnh hoặc thói quen trong quá khứ?', 'Which tense usually describes a past background or habit?',
          ['Imparfait', 'Passé composé', 'Futur simple'], 0,
          'Imparfait là “phông nền” của câu chuyện: trời mưa, nhà cửa, thói quen cũ.',
          'The imparfait is the background of a story: the weather, the setting, old habits.'),
        FILL('Je {{1}} (manger) maintenant.', ['mange'],
          'Présent: Je mange. “Maintenant” chỉ việc đang diễn ra.',
          'Présent: Je mange. “Maintenant” signals something happening now.'),
        CHOICE('Đâu là một thức, không phải một thì?', 'Which one is a mood, not a tense?',
          ['Subjonctif', 'Imparfait', 'Futur antérieur'], 0,
          'Subjonctif diễn tả thái độ (mong muốn, nghi ngờ, cảm xúc), không chỉ thời điểm.',
          'The subjunctive expresses attitude (wish, doubt, emotion), not just time.'),
        FILL('Demain, je {{1}} (partir) à Paris.', ['partirai'],
          'Futur simple cho việc sẽ xảy ra: je partirai.',
          'Futur simple for a future event: je partirai.')
      ]
    },

    /* -----------------------------------------------------
       2. The basics
       ----------------------------------------------------- */
    {
      id: 'basics', num: 2, part: 'start', minutes: 8,
      title: 'Les bases',
      subtitle: { vi: 'Đồ nghề cơ bản', en: 'The basics' },
      summary: {
        vi: 'Đại từ chủ ngữ, ba nhóm động từ, hai động từ vua être/avoir và participe passé — học chắc trước khi chia thì.',
        en: 'Subject pronouns, the three verb groups, the two “king” verbs être/avoir, and the past participle — master these before conjugating tenses.'
      },
      blocks: [
        H('Đại từ chủ ngữ', 'Subject pronouns'),
        TABLE(['Tiếng Pháp', 'Nghĩa', 'Ghi chú'], [
          ['je (j’)', 'tôi', 'j’ trước nguyên âm hoặc h câm: j’aime, j’habite'],
          ['tu', 'bạn (thân mật)', 'dùng với bạn bè, người nhà, trẻ em'],
          ['il / elle / on', 'anh ấy / cô ấy / người ta', 'on chia như il và rất phổ biến trong văn nói'],
          ['nous', 'chúng tôi', ''],
          ['vous', 'các bạn / ngài', 'dùng cho một người lạ hoặc nhiều người'],
          ['ils / elles', 'họ', 'ils cho nhóm nam hoặc nhóm hỗn hợp']
        ]),
        H('Ba nhóm động từ', 'The three verb groups'),
        TABLE(['Nhóm', 'Đuôi', 'Ví dụ', 'Ghi chú'], [
          ['1', '-er', 'parler, aimer, manger', 'khoảng 90% động từ, đều nhất'],
          ['2', '-ir (finissons)', 'finir, choisir, réussir', 'có -iss- ở số nhiều'],
          ['3', '-re, -oir, -ir còn lại', 'vendre, prendre, pouvoir, partir', 'nhiều động từ bất quy tắc']
        ]),
        H('Hai động từ vua: être và avoir', 'The two king verbs: être and avoir'),
        TABLE(['', 'je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles'], [
          ['être', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
          ['avoir', 'ai', 'as', 'a', 'avons', 'avez', 'ont']
        ]),
        H('Participe passé', 'The past participle'),
        TABLE(['Nhóm', 'Quy tắc', 'Ví dụ'], [
          ['-er', 'đổi thành -é', 'parler → parlé'],
          ['-ir (nhóm 2)', 'đổi thành -i', 'finir → fini'],
          ['-re', 'thường đổi thành -u', 'vendre → vendu']
        ]),
        TABLE(['Động từ', 'pp', 'Động từ', 'pp', 'Động từ', 'pp'], [
          ['avoir', 'eu', 'écrire', 'écrit', 'ouvrir', 'ouvert'],
          ['être', 'été', 'lire', 'lu', 'offrir', 'offert'],
          ['faire', 'fait', 'boire', 'bu', 'naître', 'né'],
          ['dire', 'dit', 'connaître', 'connu', 'mourir', 'mort'],
          ['mettre', 'mis', 'croire', 'cru', 'recevoir', 'reçu'],
          ['prendre', 'pris', 'pouvoir', 'pu', 'apprendre', 'appris'],
          ['voir', 'vu', 'vouloir', 'voulu', 'comprendre', 'compris'],
          ['venir', 'venu', 'savoir', 'su', 'devoir', 'dû']
        ]),
        CALLOUT('tip', 'Mỗi ngày đọc to 5 cặp phân từ, ví dụ prendre → pris. Tai ghi nhớ tốt hơn mắt.',
          'Read five participle pairs aloud every day, for example prendre → pris. Your ear remembers better than your eyes.'),
        CALLOUT('warn', 'Participe passé không luôn đứng yên: với être nó hòa hợp với chủ ngữ; với avoir nó có thể hòa hợp với COD đứng trước. Chương 4 sẽ nói rõ.',
          'The past participle does not always stay unchanged: with être it agrees with the subject; with avoir it may agree with a preceding direct object. Chapter 4 explains this.')
      ],
      exercises: [
        FILL('Elle {{1}} (être) à la maison.', ['est'],
          'être, ngôi il/elle: est.',
          'être, third-person singular: est.'),
        FILL('Nous {{1}} (avoir) un problème.', ['avons'],
          'avoir, ngôi nous: avons.',
          'avoir, nous form: avons.'),
        FILL('parler → participe passé : {{1}}', ['parlé'],
          'Nhóm -er: parler → parlé.',
          '-er group: parler → parlé.'),
        FILL('prendre → participe passé : {{1}}', ['pris'],
          'prendre là động từ bất quy tắc: pris.',
          'prendre is irregular: pris.'),
        CHOICE('Động từ nào dùng être làm trợ động từ trong passé composé?', 'Which verb uses être as its auxiliary in the passé composé?',
          ['aller', 'manger', 'finir'], 0,
          'aller là động từ chuyển động: je suis allé(e). Manger và finir dùng avoir.',
          'aller is a movement verb: je suis allé(e). Manger and finir use avoir.'),
        FILL('Nous {{1}} (finir) le travail.', ['finissons'],
          'Présent, nhóm -ir: nous finissons.',
          'Present, -ir group: nous finissons.')
      ]
    },

    /* -----------------------------------------------------
       3. Présent
       ----------------------------------------------------- */
    {
      id: 'present', num: 3, part: 'present', minutes: 9,
      title: 'Présent',
      subtitle: { vi: 'Thì hiện tại', en: 'The present' },
      summary: {
        vi: 'Thì quan trọng nhất: việc đang diễn ra, thói quen, sự thật, tương lai gần và kinh nghiệm kéo dài với “depuis”.',
        en: 'The most important tense: actions happening now, habits, facts, near future, and ongoing experience with “depuis”.'
      },
      blocks: [
        H('Cách chia ba nhóm đều đặn', 'Regular forms in the three groups'),
        TABLE(['', 'parler (-er)', 'finir (-ir)', 'vendre (-re)'], [
          ['je', 'parle', 'finis', 'vends'],
          ['tu', 'parles', 'finis', 'vends'],
          ['il/elle/on', 'parle', 'finit', 'vend'],
          ['nous', 'parlons', 'finissons', 'vendons'],
          ['vous', 'parlez', 'finissez', 'vendez'],
          ['ils/elles', 'parlent', 'finissent', 'vendent']
        ]),
        H('Bất quy tắc phải thuộc', 'Irregular verbs to know'),
        TABLE(['', 'je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles'], [
          ['aller', 'vais', 'vas', 'va', 'allons', 'allez', 'vont'],
          ['faire', 'fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
          ['pouvoir', 'peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
          ['vouloir', 'veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
          ['venir', 'viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
          ['prendre', 'prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
          ['savoir', 'sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
          ['devoir', 'dois', 'dois', 'doit', 'devons', 'devez', 'doivent'],
          ['dire', 'dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
          ['voir', 'vois', 'vois', 'voit', 'voyons', 'voyez', 'voient']
        ]),
        H('Khi nào dùng présent?', 'When to use the present'),
        LIST([
          'Việc đang diễn ra: Il travaille en ce moment.',
          'Thói quen: Je me lève à 6 h.',
          'Sự thật, chân lý: La Terre tourne autour du Soleil.',
          'Tương lai gần có mốc giờ: Demain, je pars à Paris.',
          'Quá khứ sinh động trong báo chí: En 1989, le mur de Berlin tombe.',
          'Còn tiếp diễn từ quá khứ + depuis: J’habite ici depuis 3 ans.'
        ], [
          'Something happening now: Il travaille en ce moment.',
          'A habit: Je me lève à 6 h.',
          'A fact or truth: La Terre tourne autour du Soleil.',
          'Near future with a time marker: Demain, je pars à Paris.',
          'Vivid past in journalism: En 1989, le mur de Berlin tombe.',
          'Ongoing since a past point + depuis: J’habite ici depuis 3 ans.'
        ]),
        CALLOUT('warn', 'Với nhóm -er, je, tu, il, ils viết khác nhau nhưng đọc giống nhau (parle, parles, parle, parlent). Khi viết, đừng quên đuôi.',
          'In the -er group, je, tu, il and ils are written differently but sound the same (parle, parles, parle, parlent). Do not drop the endings in writing.'),
        CALLOUT('english', 'Tiếng Anh có I work / I am working; tiếng Pháp dùng Je travaille cho cả hai. “I have lived here for 3 years” → J’habite ici depuis 3 ans, không dùng passé composé.',
          'English has I work / I am working; French uses Je travaille for both. “I have lived here for 3 years” → J’habite ici depuis 3 ans, not the passé composé.'),
        EXAMPLES([
          EX('Il travaille en ce moment.', 'Anh ấy đang làm việc lúc này.', 'He is working right now.'),
          EX('Je me lève à 6 h.', 'Tôi dậy lúc 6 giờ.', 'I get up at 6.'),
          EX('Nous ne pouvons pas venir.', 'Chúng tôi không thể đến.', 'We cannot come.'),
          EX('J’habite ici depuis trois ans.', 'Tôi sống ở đây được ba năm rồi.', 'I have lived here for three years.')
        ])
      ],
      exercises: [
        FILL('Nous {{1}} (prendre) le bus tous les jours.', ['prenons'],
          'prendre, ngôi nous: prenons. “Tous les jours” là thói quen.',
          'prendre, nous form: prenons. “Tous les jours” signals a habit.'),
        FILL('Ils {{1}} (pouvoir) venir demain.', ['peuvent'],
          'pouvoir, ngôi ils: peuvent.',
          'pouvoir, ils form: peuvent.'),
        FILL('Je {{1}} (aller) au travail à vélo.', ['vais'],
          'aller, ngôi je: vais.',
          'aller, je form: vais.'),
        FILL('La Terre {{1}} (tourner) autour du Soleil.', ['tourne'],
          'Sự thật hiển nhiên dùng présent: tourne.',
          'A general fact uses the present: tourne.'),
        CHOICE('“J’habite ici depuis 3 ans” dịch đúng là gì?', 'What does “J’habite ici depuis 3 ans” mean?',
          ['I have lived here for 3 years.', 'I lived here for 3 years.', 'I will live here for 3 years.'], 0,
          'Depuis + présent diễn tả việc bắt đầu trong quá khứ và còn tiếp diễn.',
          'Depuis + present describes something that started in the past and continues now.'),
        FILL('Elle {{1}} (faire) ses devoirs le soir.', ['fait'],
          'faire, ngôi elle: fait.',
          'faire, elle form: fait.')
      ]
    },

    /* -----------------------------------------------------
       4. Passé composé
       ----------------------------------------------------- */
    {
      id: 'passe-compose', num: 4, part: 'past', minutes: 12,
      title: 'Passé composé',
      subtitle: { vi: 'Việc đã xảy ra và xong', en: 'Completed past events' },
      summary: {
        vi: 'Thì quá khứ thông dụng nhất: avoir/être ở présent + participe passé. Dùng cho sự kiện đã hoàn thành, chuỗi hành động và kết quả còn liên quan.',
        en: 'The most common past tense: avoir/être in the present + past participle. Use it for completed events, sequences of actions, and results that still matter.'
      },
      blocks: [
        FORMULA('Passé composé = avoir / être (présent) + participe passé',
          'Passé composé = avoir / être (present) + past participle'),
        H('Với avoir — đa số động từ', 'With avoir — most verbs'),
        TABLE(['', 'manger'], [
          ['j’', 'ai mangé'],
          ['tu', 'as mangé'],
          ['il/elle/on', 'a mangé'],
          ['nous', 'avons mangé'],
          ['vous', 'avez mangé'],
          ['ils/elles', 'ont mangé']
        ]),
        H('Với être — chuyển động, thay đổi trạng thái và phản thân', 'With être — movement, change of state, and reflexive verbs'),
        TABLE(['Cặp', 'Động từ', 'Participe passé'], [
          ['đi / đến', 'aller / venir', 'allé / venu'],
          ['đến / rời đi', 'arriver / partir', 'arrivé / parti'],
          ['vào / ra', 'entrer / sortir', 'entré / sorti'],
          ['lên / xuống', 'monter / descendre', 'monté / descendu'],
          ['sinh / mất', 'naître / mourir', 'né / mort'],
          ['ở lại / ngã', 'rester / tomber', 'resté / tombé'],
          ['thêm', 'devenir, revenir, retourner, rentrer', 'devenu, revenu, retourné, rentré']
        ]),
        P('Tất cả động từ phản thân (se lever, se coucher, se laver…) cũng dùng être: Je me suis levé tôt. / Ils se sont couchés tard.',
          'All reflexive verbs (se lever, se coucher, se laver…) also use être: Je me suis levé tôt. / Ils se sont couchés tard.'),
        H('Hòa hợp participe passé', 'Past participle agreement'),
        TABLE(['Trợ động từ', 'Quy tắc', 'Ví dụ'], [
          ['être', 'hòa hợp với chủ ngữ: thêm -e nếu nữ, -s nếu số nhiều', 'Elle est partie. Ils sont arrivés.'],
          ['avoir', 'hòa hợp với COD đứng trước; COD đứng sau thì không hòa hợp', 'La lettre que j’ai écrite. J’ai écrit la lettre.'],
          ['phản thân', 'hòa hợp với COD nếu COD đứng trước (thường là se)', 'Elle s’est lavée. Elle s’est lavé les mains.']
        ]),
        CALLOUT('warn', 'Một số động từ đổi trợ động từ khi có tân ngữ trực tiếp: Il est sorti. nhưng Il a sorti la voiture. / Elle est descendue. nhưng Elle a descendu la valise. / Je suis passé chez toi. nhưng J’ai passé un examen.',
          'Some verbs switch auxiliary when they take a direct object: Il est sorti. but Il a sorti la voiture. / Elle est descendue. but Elle a descendu la valise. / Je suis passé chez toi. but J’ai passé un examen.'),
        H('Phủ định', 'Negation'),
        P('ne + trợ động từ + pas + participe passé: Je n’ai pas mangé. / Elle n’est pas venue.',
          'ne + auxiliary + pas + past participle: Je n’ai pas mangé. / Elle n’est pas venue.'),
        H('Khi nào dùng?', 'When to use it'),
        LIST([
          'Sự kiện đã hoàn thành, có điểm bắt đầu và kết thúc: Hier, j’ai fini mon travail.',
          'Chuỗi sự kiện nối tiếp: Je suis allé au marché, j’ai acheté des fruits et je suis rentré.',
          'Việc xảy ra một lần hoặc số lần xác định: J’ai visité Paris trois fois.',
          'Kết quả còn liên quan hiện tại: J’ai perdu mes clés.'
        ], [
          'A completed event with a beginning and an end: Hier, j’ai fini mon travail.',
          'A sequence of events: Je suis allé au marché, j’ai acheté des fruits et je suis rentré.',
          'An event that happened once or a specific number of times: J’ai visité Paris trois fois.',
          'A result that still matters now: J’ai perdu mes clés.'
        ]),
        CALLOUT('english', 'Passé composé làm việc của cả past simple (I ate) và present perfect (I have eaten). “Yesterday I ate” = Hier, j’ai mangé.',
          'The passé composé covers both the past simple (I ate) and the present perfect (I have eaten). “Yesterday I ate” = Hier, j’ai mangé.'),
        EXAMPLES([
          EX('J’ai fini mes devoirs.', 'Tôi đã làm xong bài tập.', 'I have finished my homework.'),
          EX('Elle est partie à 8 h.', 'Cô ấy đã đi lúc 8 giờ.', 'She left at 8.'),
          EX('Nous sommes arrivés hier.', 'Chúng tôi đến hôm qua.', 'We arrived yesterday.'),
          EX('Je me suis levé tôt.', 'Tôi đã dậy sớm.', 'I got up early.'),
          EX('Il a sorti la voiture.', 'Anh ấy đã đưa xe ra.', 'He took the car out.')
        ])
      ],
      exercises: [
        FILL('Hier, elle {{1}} (aller) au cinéma.', ['est allée'],
          'aller dùng être; chủ ngữ elle nên participe passé thêm -e: est allée.',
          'aller uses être; with elle the participle adds -e: est allée.'),
        FILL('Hier, nous {{1}} (finir) le travail.', ['avons fini'],
          'finir dùng avoir: nous avons fini.',
          'finir uses avoir: nous avons fini.'),
        FILL('Elle {{1}} (se lever) à 7 h ce matin.', ['s’est levée', "s'est levée"],
          'Động từ phản thân dùng être; se là COD đứng trước nên hòa hợp: s’est levée.',
          'Reflexive verbs use être; se is a preceding direct object, so the participle agrees: s’est levée.'),
        FILL('Je {{1}} (ne pas manger).', ['n’ai pas mangé', "n'ai pas mangé"],
          'Phủ định: ne + trợ động từ + pas + participe passé → je n’ai pas mangé.',
          'Negation: ne + auxiliary + pas + past participle → je n’ai pas mangé.'),
        CHOICE('La lettre que j’ai {{1}} hier.', 'The letter that I ___ yesterday.',
          ['écrite', 'écrit', 'écrits'], 0,
          'COD “la lettre” đứng trước avoir nên participe passé hòa hợp: écrite.',
          'The direct object “la lettre” comes before avoir, so the participle agrees: écrite.'),
        FILL('Ils {{1}} (partir) à 8 h.', ['sont partis'],
          'partir dùng être; ils nam/nữ hỗn hợp → sont partis.',
          'partir uses être; ils takes the masculine plural: sont partis.')
      ]
    },

    /* -----------------------------------------------------
       5. Imparfait
       ----------------------------------------------------- */
    {
      id: 'imparfait', num: 5, part: 'past', minutes: 10,
      title: 'Imparfait',
      subtitle: { vi: 'Bối cảnh và thói quen trong quá khứ', en: 'Past background and habits' },
      summary: {
        vi: '“Phông nền” của câu chuyện: thời tiết, tâm trạng, thói quen cũ, việc đang diễn ra thì bị cắt ngang.',
        en: 'The background of a story: weather, mood, old habits, and ongoing actions interrupted by an event.'
      },
      blocks: [
        FORMULA('Lấy ngôi nous ở présent → bỏ -ons → thêm -ais, -ais, -ait, -ions, -iez, -aient',
          'Take the nous form in the present → drop -ons → add -ais, -ais, -ait, -ions, -iez, -aient'),
        TABLE(['Động từ', 'nous (présent)', 'gốc', 'je', 'tu', 'il', 'nous', 'vous', 'ils'], [
          ['parler', 'parlons', 'parl-', 'parlais', 'parlais', 'parlait', 'parlions', 'parliez', 'parlaient'],
          ['finir', 'finissons', 'finiss-', 'finissais', 'finissais', 'finissait', 'finissions', 'finissiez', 'finissaient'],
          ['prendre', 'prenons', 'pren-', 'prenais', 'prenais', 'prenait', 'prenions', 'preniez', 'prenaient'],
          ['faire', 'faisons', 'fais-', 'faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'],
          ['avoir', 'avons', 'av-', 'avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
          ['aller', 'allons', 'all-', 'allais', 'allais', 'allait', 'allions', 'alliez', 'allaient'],
          ['être', 'sommes', 'ét-', 'étais', 'étais', 'était', 'étions', 'étiez', 'étaient']
        ]),
        CALLOUT('warn', 'être là ngoại lệ duy nhất: gốc ét-. Chính tả: manger → je mangeais, nous mangions; commencer → je commençais, nous commencions.',
          'être is the only irregular stem: ét-. Spelling: manger → je mangeais, nous mangions; commencer → je commençais, nous commencions.'),
        H('Khi nào dùng?', 'When to use it'),
        TABLE(['Cách dùng', 'Ví dụ'], [
          ['Mô tả bối cảnh', 'Il faisait beau et les enfants jouaient.'],
          ['Thói quen trong quá khứ', 'Quand j’étais petit, j’allais chez ma grand-mère chaque été.'],
          ['Việc đang diễn ra thì bị cắt ngang', 'Je lisais quand le téléphone a sonné.'],
          ['Hai việc song song', 'Il cuisinait pendant que je rangeais.'],
          ['Lý do, trạng thái', 'Il n’est pas venu, il était malade.'],
          ['Sau si (giả sử)', 'Si j’avais le temps…'],
          ['Gợi ý, lịch sự', 'Si on allait au cinéma ?']
        ]),
        CALLOUT('english', 'Imparfait gộp ba cách nói tiếng Anh: was/were doing, used to do, và trạng thái trong quá khứ.',
          'The imparfait combines three English patterns: was/were doing, used to do, and a past state.'),
        EXAMPLES([
          EX('Il faisait beau et les enfants jouaient.', 'Trời đẹp và bọn trẻ đang chơi.', 'The weather was nice and the children were playing.'),
          EX('Quand j’étais petit, j’allais chez ma grand-mère chaque été.', 'Hồi nhỏ, hè nào tôi cũng về nhà bà.', 'When I was little, I used to go to my grandmother’s every summer.'),
          EX('Je lisais quand le téléphone a sonné.', 'Tôi đang đọc sách thì điện thoại reo.', 'I was reading when the phone rang.'),
          EX('Il n’est pas venu, il était malade.', 'Anh ấy không đến vì anh ấy bị ốm.', 'He did not come because he was ill.')
        ])
      ],
      exercises: [
        FILL('Quand j’{{1}} (être) petit, je jouais dehors.', ['étais'],
          'être, ngôi je ở imparfait: j’étais.',
          'être, je form in the imparfait: j’étais.'),
        FILL('Nous {{1}} (manger) à 8 h.', ['mangions'],
          'manger: nous mangions (giữ -e- để âm /ʒ/ mềm).',
          'manger: nous mangions (keep the -e- to preserve the soft /ʒ/ sound).'),
        FILL('Il {{1}} (pleuvoir) quand je suis sorti.', ['pleuvait'],
          'Bối cảnh đang diễn ra: il pleuvait. Hành động cắt ngang dùng passé composé.',
          'Background action: il pleuvait. The interrupting event uses the passé composé.'),
        CHOICE('“Chaque été, nous allions à la mer” diễn tả điều gì?', 'What does “Chaque été, nous allions à la mer” describe?',
          ['Một thói quen trong quá khứ', 'Một việc xảy ra một lần', 'Một dự định tương lai'], 0,
          '“Chaque été” là dấu hiệu của thói quen lặp lại → imparfait.',
          '“Chaque été” signals a repeated habit → imparfait.'),
        FILL('Je {{1}} (commencer) à travailler à 9 h.', ['commençais'],
          'commencer: je commençais (c → ç trước a để giữ âm /s/).',
          'commencer: je commençais (c → ç before a to keep the /s/ sound).'),
        FILL('Ils {{1}} (avoir) peur du noir.', ['avaient'],
          'avoir, ngôi ils ở imparfait: avaient.',
          'avoir, ils form in the imparfait: avaient.')
      ]
    },

    /* -----------------------------------------------------
       6. Passé composé vs imparfait
       ----------------------------------------------------- */
    {
      id: 'passe-compose-vs-imparfait', num: 6, part: 'past', minutes: 12,
      title: 'Passé composé ou imparfait ?',
      subtitle: { vi: 'Phân biệt cho chắc', en: 'Choosing between them' },
      summary: {
        vi: 'Hãy nghĩ như làm phim: imparfait là phông nền và thói quen; passé composé là diễn biến, hành động và sự kiện hoàn tất.',
        en: 'Think like a film director: the imparfait is the set and the habits; the passé composé is the action and the completed event.'
      },
      blocks: [
        TABLE(['Imparfait', 'Passé composé'], [
          ['Phông nền, đạo cụ', 'Diễn biến, hành động'],
          ['Mô tả: trời, người, cảm xúc', 'Việc xảy ra, kể từng bước'],
          ['Thói quen, lặp đi lặp lại', 'Xảy ra một lần, hoàn tất'],
          ['Việc bị cắt ngang', 'Việc cắt ngang'],
          ['Có thể kéo dài, không rõ kết thúc', 'Có điểm kết thúc rõ']
        ]),
        H('Ví dụ kinh điển', 'Classic examples'),
        EXAMPLES([
          EX('Il pleuvait quand je suis sorti.', 'Trời đang mưa thì tôi ra ngoài.', 'It was raining when I went out.'),
          EX('Je dormais quand tu as appelé.', 'Tôi đang ngủ thì bạn gọi.', 'I was sleeping when you called.'),
          EX('Quand j’étais petit, je jouais au foot. Un jour, je suis tombé.', 'Hồi nhỏ tôi hay chơi bóng. Một hôm, tôi bị ngã.', 'When I was little, I used to play football. One day, I fell.'),
          EX('Hier soir, il neigeait. Soudain, j’ai vu un chat.', 'Tối qua trời đang mưa tuyết. Bỗng nhiên tôi thấy một con mèo.', 'Last night it was snowing. Suddenly I saw a cat.')
        ]),
        H('Từ khóa nhận biết', 'Clue words'),
        TABLE(['Thường đi với imparfait', 'Thường đi với passé composé'], [
          ['souvent, toujours, d’habitude', 'soudain, tout à coup, brusquement'],
          ['chaque jour / chaque été', 'hier, ce matin, la semaine dernière'],
          ['autrefois, à cette époque', 'un jour, une fois, ce jour-là'],
          ['pendant que, tandis que', 'd’abord, ensuite, puis, enfin'],
          ['quand j’étais petit…', 'pendant 3 ans, deux fois']
        ]),
        H('Một đoạn văn mẫu', 'A model paragraph'),
        P('Hier soir, il faisait froid et il neigeait. Je rentrais chez moi quand j’ai vu un petit chat sous un arbre. Il avait l’air perdu. Je l’ai pris dans mes bras, je l’ai ramené à la maison et je lui ai donné du lait.',
          'Last night it was cold and snowing. I was walking home when I saw a little cat under a tree. It looked lost. I picked it up, took it home, and gave it some milk.'),
        P('faisait, neigeait, rentrais, avait = phông nền (imparfait). ai vu, ai pris, ai ramené, ai donné = hành động nối tiếp (passé composé).',
          'faisait, neigeait, rentrais, avait = background (imparfait). ai vu, ai pris, ai ramené, ai donné = successive actions (passé composé).'),
        H('Động từ đổi nghĩa', 'Verbs that change meaning'),
        TABLE(['Động từ', 'Imparfait', 'Passé composé'], [
          ['savoir', 'Je savais = tôi đã biết', 'J’ai su = tôi vừa biết ra'],
          ['vouloir', 'Il voulait = anh ấy muốn', 'Il a voulu = anh ấy đã quyết muốn và làm'],
          ['pouvoir', 'Je pouvais = tôi có thể', 'J’ai pu = tôi đã làm được'],
          ['connaître', 'Je la connaissais = tôi biết cô ấy', 'Je l’ai connue = tôi đã quen cô ấy lần đầu']
        ]),
        CALLOUT('tip', 'Không chắc? Thử “đặt vào khung ảnh”: nếu là bức tranh đứng yên → imparfait; nếu là đoạn phim chuyển động → passé composé.',
          'Unsure? Try the “picture frame” test: a still picture → imparfait; a moving film → passé composé.'),
        CALLOUT('english', 'Tiếng Anh dùng past continuous cho nền và past simple cho hành động. Tiếng Pháp phân biệt bằng imparfait / passé composé.',
          'English uses the past continuous for the background and the past simple for the event. French uses imparfait / passé composé.')
      ],
      exercises: [
        FILL('Il {{1}} (pleuvoir) quand je {{2}} (sortir).', [['pleuvait'], ['suis sorti']],
          'pleuvoir là nền → pleuvait; sortir là hành động cắt ngang → suis sorti.',
          'pleuvoir is the background → pleuvait; sortir is the interrupting event → suis sorti.'),
        FILL('Quand j’{{1}} (être) petit, je {{2}} (jouer) au foot.', [['étais'], ['jouais']],
          'Cả hai đều là bối cảnh/thói quen cũ → imparfait: étais, jouais.',
          'Both describe a past background/habit → imparfait: étais, jouais.'),
        FILL('Hier, je {{1}} (voir) un film.', ['ai vu'],
          '“Hier” + sự kiện xong → passé composé: ai vu.',
          '“Hier” + a completed event → passé composé: ai vu.'),
        CHOICE('“Un jour, je suis tombé” thuộc loại nào?', 'What kind of action is “Un jour, je suis tombé”?',
          ['Một sự kiện xảy ra một lần', 'Một thói quen lặp lại', 'Một mô tả bối cảnh'], 0,
          '“Un jour” đánh dấu một sự kiện cụ thể → passé composé.',
          '“Un jour” marks one specific event → passé composé.'),
        FILL('Elle {{1}} (lire) quand le téléphone {{2}} (sonner).', [['lisait'], ['a sonné']],
          'lire là nền → lisait; sonner cắt ngang → a sonné.',
          'lire is the background → lisait; sonner interrupts → a sonné.'),
        FILL('Nous {{1}} (aller) à la plage chaque été.', ['allions'],
          '“Chaque été” là thói quen lặp lại → imparfait: allions.',
          '“Chaque été” is a repeated habit → imparfait: allions.')
      ]
    }

    ,

    /* -----------------------------------------------------
       7. Plus-que-parfait
       ----------------------------------------------------- */
    {
      id: 'plus-que-parfait', num: 7, part: 'past', minutes: 8,
      title: 'Plus-que-parfait',
      subtitle: { vi: 'Quá khứ của quá khứ', en: 'The past of the past' },
      summary: {
        vi: 'Dùng khi một việc đã xảy ra trước một việc khác trong quá khứ. Công thức giống passé composé nhưng trợ động từ chia ở imparfait.',
        en: 'Use it for an action that happened before another past action. The form mirrors the passé composé, but the auxiliary is in the imparfait.'
      },
      blocks: [
        FORMULA('Plus-que-parfait = avoir / être (imparfait) + participe passé',
          'Plus-que-parfait = avoir / être (imparfait) + past participle'),
        TABLE(['', 'avoir', 'être'], [
          ['je', 'avais mangé', 'étais parti(e)'],
          ['tu', 'avais mangé', 'étais parti(e)'],
          ['il/elle/on', 'avait mangé', 'était parti(e)'],
          ['nous', 'avions mangé', 'étions parti(e)s'],
          ['vous', 'aviez mangé', 'étiez parti(e)(s)'],
          ['ils/elles', 'avaient mangé', 'étaient parti(e)s']
        ]),
        P('Quy tắc chọn avoir/être và hòa hợp participe passé giống hệt passé composé (chương 4).',
          'The choice of avoir/être and participle agreement is exactly the same as in the passé composé (chapter 4).'),
        H('Khi nào dùng?', 'When to use it'),
        LIST([
          'Việc xảy ra trước một việc hoặc mốc khác trong quá khứ.',
          'Giải thích nguyên nhân của một việc quá khứ.',
          'Sau si trong câu điều kiện loại 3 (chương 10).',
          'Trong lời nói gián tiếp (chương 14).'
        ], [
          'An action that happened before another past action or marker.',
          'Explaining the cause of a past event.',
          'After si in a third conditional (chapter 10).',
          'In reported speech (chapter 14).'
        ]),
        EXAMPLES([
          EX('Quand je suis arrivé, le film avait déjà commencé.', 'Khi tôi đến, phim đã bắt đầu rồi.', 'When I arrived, the film had already started.'),
          EX('Il était fatigué parce qu’il n’avait pas dormi.', 'Anh ấy mệt vì chưa ngủ.', 'He was tired because he had not slept.'),
          EX('Elle m’a dit qu’elle était déjà allée à Paris.', 'Cô ấy nói đã từng đi Paris rồi.', 'She told me she had already been to Paris.'),
          EX('Si seulement j’avais su !', 'Giá mà tôi biết!', 'If only I had known!')
        ]),
        CALLOUT('tip', 'Vẽ hai dấu mốc: plus-que-parfait → passé composé → hiện tại. Việc nào đứng trước dấu mốc kia thì dùng plus-que-parfait.',
          'Draw two markers: plus-que-parfait → passé composé → now. Whichever action comes first uses the pluperfect.'),
        CALLOUT('english', 'Plus-que-parfait = past perfect (had + V3). J’avais fini = I had finished.',
          'The plus-que-parfait is the past perfect (had + V3). J’avais fini = I had finished.')
      ],
      exercises: [
        FILL('Quand je suis arrivé, le film {{1}} (commencer).', ['avait commencé'],
          'Phim bắt đầu trước khi tôi đến → plus-que-parfait: avait commencé.',
          'The film started before I arrived → plus-que-parfait: avait commencé.'),
        FILL('Il était fatigué parce qu’il {{1}} (ne pas dormir).', ['n’avait pas dormi', "n'avait pas dormi"],
          'Chưa ngủ trước khi mệt → n’avait pas dormi.',
          'He had not slept before being tired → n’avait pas dormi.'),
        FILL('Elle m’a dit qu’elle {{1}} (déjà aller) à Paris.', ['était déjà allée', "était déjà allée"],
          'aller dùng être, chủ ngữ elle → était allée; “déjà” đứng trước participe.',
          'aller uses être, with elle → était allée; “déjà” comes before the participle.'),
        CHOICE('“J’avais fini” dịch là gì?', 'What does “J’avais fini” mean?',
          ['I had finished.', 'I have finished.', 'I will have finished.'], 0,
          'Plus-que-parfait tương ứng past perfect: had finished.',
          'The plus-que-parfait corresponds to the past perfect: had finished.'),
        FILL('Si seulement j’{{1}} (savoir) !', ['avais su'],
          'Câu ước về quá khứ: si seulement + plus-que-parfait → j’avais su.',
          'A past wish: si seulement + plus-que-parfait → j’avais su.')
      ]
    },

    /* -----------------------------------------------------
       8. Future tenses
       ----------------------------------------------------- */
    {
      id: 'futur', num: 8, part: 'future', minutes: 13,
      title: 'Les temps du futur',
      subtitle: { vi: 'Các thì tương lai và “vừa mới”', en: 'Future tenses and the recent past' },
      summary: {
        vi: 'Bốn công cụ: futur simple (sẽ làm), futur proche (sắp làm), passé récent (vừa mới làm) và futur antérieur (sẽ xong trước một mốc).',
        en: 'Four tools: futur simple (will do), futur proche (going to do), passé récent (have just done), and futur antérieur (will have done).'
      },
      blocks: [
        H('Futur simple', 'Futur simple'),
        FORMULA('Futur simple = nguyên mẫu (bỏ -e nếu là -re) + ai, as, a, ons, ez, ont',
          'Futur simple = infinitive (drop -e for -re) + ai, as, a, ons, ez, ont'),
        TABLE(['', 'parler', 'finir', 'vendre'], [
          ['je', 'parlerai', 'finirai', 'vendrai'],
          ['tu', 'parleras', 'finiras', 'vendras'],
          ['il/elle/on', 'parlera', 'finira', 'vendra'],
          ['nous', 'parlerons', 'finirons', 'vendrons'],
          ['vous', 'parlerez', 'finirez', 'vendrez'],
          ['ils/elles', 'parleront', 'finiront', 'vendront']
        ]),
        TABLE(['Động từ', 'Gốc', 'Ví dụ'], [
          ['être', 'ser-', 'je serai'],
          ['avoir', 'aur-', 'j’aurai'],
          ['aller', 'ir-', 'j’irai'],
          ['faire', 'fer-', 'je ferai'],
          ['voir', 'verr-', 'je verrai'],
          ['pouvoir', 'pourr-', 'je pourrai'],
          ['vouloir', 'voudr-', 'je voudrai'],
          ['savoir', 'saur-', 'je saurai'],
          ['venir', 'viendr-', 'je viendrai'],
          ['devoir', 'devr-', 'je devrai'],
          ['envoyer', 'enverr-', 'j’enverrai'],
          ['falloir', 'faudr-', 'il faudra']
        ]),
        CALLOUT('warn', 'Sau quand, lorsque, dès que, aussitôt que, nếu việc ở tương lai thì tiếng Pháp dùng futur, không dùng présent như tiếng Anh: Quand tu arriveras, appelle-moi.',
          'After quand, lorsque, dès que, aussitôt que, French uses the future for a future event, unlike English: Quand tu arriveras, appelle-moi.'),
        H('Futur proche', 'Futur proche'),
        FORMULA('Futur proche = aller (présent) + nguyên mẫu', 'Futur proche = aller (present) + infinitive'),
        EXAMPLES([
          EX('Je vais partir.', 'Tôi sắp đi.', 'I am going to leave.'),
          EX('Il va pleuvoir.', 'Trời sắp mưa.', 'It is going to rain.'),
          EX('Nous allons manger.', 'Chúng tôi sắp ăn.', 'We are going to eat.')
        ]),
        H('Passé récent', 'Passé récent'),
        FORMULA('Passé récent = venir de (présent) + nguyên mẫu', 'Passé récent = venir de (present) + infinitive'),
        EXAMPLES([
          EX('Je viens de manger.', 'Tôi vừa ăn xong.', 'I have just eaten.'),
          EX('Elle vient d’arriver.', 'Cô ấy vừa mới đến.', 'She has just arrived.'),
          EX('Ils viennent de partir.', 'Họ vừa mới đi.', 'They have just left.')
        ]),
        H('Futur antérieur', 'Futur antérieur'),
        FORMULA('Futur antérieur = avoir / être (futur simple) + participe passé',
          'Futur antérieur = avoir / être (futur simple) + past participle'),
        EXAMPLES([
          EX('Quand tu arriveras, j’aurai fini de cuisiner.', 'Khi bạn đến, tôi sẽ nấu xong rồi.', 'When you arrive, I will have finished cooking.'),
          EX('Dès que j’aurai fini, je sortirai.', 'Ngay khi xong, tôi sẽ ra ngoài.', 'As soon as I have finished, I will go out.'),
          EX('Il n’est pas là, il aura oublié.', 'Anh ấy không có đây, chắc đã quên.', 'He is not here; he will have forgotten.')
        ]),
        CALLOUT('tip', 'Aller nhìn về phía trước → tương lai. Venir de nhìn về phía sau → quá khứ gần. Hai cấu trúc này cũng chia được ở imparfait: Il allait partir quand…',
          'Aller looks forward → future. Venir de looks back → recent past. Both can also be used in the imparfait: Il allait partir quand…'),
        CALLOUT('english', 'Futur simple = will + V; futur proche = be going to; passé récent = have just + V3; futur antérieur = will have + V3.',
          'Futur simple = will + V; futur proche = be going to; passé récent = have just + V3; futur antérieur = will have + V3.')
      ],
      exercises: [
        FILL('Demain, je {{1}} (faire) mes devoirs.', ['ferai'],
          'faire ở futur simple: je ferai.',
          'faire in the futur simple: je ferai.'),
        FILL('Quand tu {{1}} (arriver), appelle-moi.', ['arriveras'],
          'Sau quand + tương lai → futur simple: tu arriveras.',
          'After quand + future → futur simple: tu arriveras.'),
        FILL('Dès que j’{{1}} (finir), je sortirai.', ['aurai fini'],
          'Việc xong trước khi ra ngoài → futur antérieur: j’aurai fini.',
          'The finishing happens before going out → futur antérieur: j’aurai fini.'),
        FILL('Je {{1}} (aller) partir.', ['vais'],
          'Futur proche: aller au présent + infinitif → je vais partir.',
          'Futur proche: aller in the present + infinitive → je vais partir.'),
        FILL('Elle {{1}} (venir) d’arriver.', ['vient'],
          'Passé récent: venir de + infinitif → elle vient d’arriver.',
          'Passé récent: venir de + infinitive → elle vient d’arriver.'),
        CHOICE('“Je vais manger” nghĩa là gì?', 'What does “Je vais manger” mean?',
          ['I am going to eat.', 'I will have eaten.', 'I have just eaten.'], 0,
          'Aller + infinitif là futur proche: sắp làm.',
          'Aller + infinitive is the futur proche: going to do.'),
        FILL('L’année prochaine, j’{{1}} (habiter) à Lyon.', ['habiterai'],
          'Futur simple: j’habiterai.',
          'Futur simple: j’habiterai.')
      ]
    },

    /* -----------------------------------------------------
       9. Conditionnel
       ----------------------------------------------------- */
    {
      id: 'conditionnel', num: 9, part: 'moods', minutes: 11,
      title: 'Conditionnel',
      subtitle: { vi: 'Lịch sự và giả định', en: 'Politeness and hypothesis' },
      summary: {
        vi: 'Dùng để nói lịch sự, đưa lời khuyên, bày tỏ ước muốn, đưa tin chưa kiểm chứng, giả định và diễn tả tương lai trong quá khứ.',
        en: 'Use it for politeness, advice, wishes, unverified news, hypotheses, and future-in-the-past.'
      },
      blocks: [
        FORMULA('Conditionnel présent = gốc của futur + đuôi của imparfait',
          'Conditionnel présent = future stem + imperfect endings'),
        TABLE(['', 'parler', 'finir', 'être', 'avoir', 'aller'], [
          ['je', 'parlerais', 'finirais', 'serais', 'aurais', 'irais'],
          ['tu', 'parlerais', 'finirais', 'serais', 'aurais', 'irais'],
          ['il/elle/on', 'parlerait', 'finirait', 'serait', 'aurait', 'irait'],
          ['nous', 'parlerions', 'finirions', 'serions', 'aurions', 'irions'],
          ['vous', 'parleriez', 'finiriez', 'seriez', 'auriez', 'iriez'],
          ['ils/elles', 'parleraient', 'finiraient', 'seraient', 'auraient', 'iraient']
        ]),
        H('Khi nào dùng conditionnel présent?', 'When to use the conditional present'),
        TABLE(['Cách dùng', 'Ví dụ'], [
          ['Lịch sự', 'Pourriez-vous m’aider ? / Je voudrais un renseignement.'],
          ['Lời khuyên', 'Tu devrais te reposer.'],
          ['Ước muốn', 'Je partirais bien en vacances.'],
          ['Tin chưa kiểm chứng (báo chí)', 'Le ministre démissionnerait demain.'],
          ['Câu điều kiện loại 2', 'Si j’avais de l’argent, je voyagerais.'],
          ['Tương lai trong quá khứ', 'Il a dit qu’il viendrait.'],
          ['Sau au cas où', 'Au cas où il pleuvrait, prends un parapluie.']
        ]),
        H('Conditionnel passé', 'Conditionnel passé'),
        FORMULA('Conditionnel passé = avoir / être (conditionnel présent) + participe passé',
          'Conditionnel passé = avoir / être (conditional present) + past participle'),
        EXAMPLES([
          EX('Tu aurais dû me prévenir.', 'Lẽ ra bạn phải báo cho tôi.', 'You should have warned me.'),
          EX('J’aurais aimé t’aider.', 'Giá mà tôi đã giúp được bạn.', 'I would have liked to help you.'),
          EX('Il y aurait eu trois blessés.', 'Nghe nói có ba người bị thương.', 'There are said to have been three injured.'),
          EX('Si j’avais su, je serais venu.', 'Nếu biết trước, tôi đã đến rồi.', 'If I had known, I would have come.')
        ]),
        CALLOUT('tip', 'Futur + imparfait = conditionnel. Gốc lấy từ futur (ser-, aur-, ir-, fer-, pourr-…), đuôi lấy từ imparfait (-ais, -ait, -ions, -iez, -aient).',
          'Future + imperfect = conditional. Use the future stem (ser-, aur-, ir-, fer-, pourr-…) and imperfect endings (-ais, -ait, -ions, -iez, -aient).'),
        CALLOUT('english', 'Conditionnel présent = would + V. Conditionnel passé = would have + V3. Tu devrais = you should; tu pourrais = you could; je voudrais = I would like.',
          'Conditionnel présent = would + V. Conditionnel passé = would have + V3. Tu devrais = you should; tu pourrais = you could; je voudrais = I would like.')
      ],
      exercises: [
        FILL('Tu {{1}} (devoir) te reposer.', ['devrais'],
          'Lời khuyên dùng conditionnel: tu devrais.',
          'Advice uses the conditional: tu devrais.'),
        FILL('Si j’avais de l’argent, je {{1}} (voyager).', ['voyagerais'],
          'Câu điều kiện loại 2: si + imparfait, kết quả dùng conditionnel présent → voyagerais.',
          'Second conditional: si + imparfait, result in the conditional present → voyagerais.'),
        FILL('Si j’avais su, je {{1}} (venir).', ['serais venu'],
          'Câu điều kiện loại 3: kết quả dùng conditionnel passé → serais venu.',
          'Third conditional: the result uses the conditional past → serais venu.'),
        FILL('Il a dit qu’il {{1}} (venir).', ['viendrait'],
          'Tương lai trong quá khứ: il a dit qu’il viendrait.',
          'Future in the past: il a dit qu’il viendrait.'),
        CHOICE('“Pourriez-vous m’aider ?” là cách nói gì?', 'What kind of request is “Pourriez-vous m’aider ?”',
          ['Lịch sự', 'Quá khứ', 'Mệnh lệnh trực tiếp'], 0,
          'Conditionnel làm câu lịch sự hơn: Bạn có thể giúp tôi không?',
          'The conditional makes the request polite: Could you help me?')
      ]
    },

    /* -----------------------------------------------------
       10. Si clauses
       ----------------------------------------------------- */
    {
      id: 'si', num: 10, part: 'moods', minutes: 10,
      title: 'Les phrases avec SI',
      subtitle: { vi: 'Câu điều kiện', en: 'If-clauses' },
      summary: {
        vi: 'Mỗi loại điều kiện ghép một cặp thì cố định. Quy tắc vàng: sau “si” mang nghĩa “nếu” không bao giờ dùng futur hoặc conditionnel.',
        en: 'Each conditional type uses a fixed tense pair. Golden rule: after “si” meaning “if”, never use the future or conditional.'
      },
      blocks: [
        TABLE(['Loại', 'Nửa SI', 'Nửa kết quả', 'Ý nghĩa'], [
          ['1', 'si + présent', 'futur (hoặc présent, impératif)', 'Có khả năng thật'],
          ['2', 'si + imparfait', 'conditionnel présent', 'Giả sử, mơ ước ở hiện tại'],
          ['3', 'si + plus-que-parfait', 'conditionnel passé', 'Không thật, hối tiếc ở quá khứ'],
          ['Hỗn hợp', 'si + plus-que-parfait', 'conditionnel présent', 'Quá khứ → hậu quả hiện tại']
        ]),
        EXAMPLES([
          EX('Si tu viens, on ira au cinéma.', 'Nếu bạn đến, ta sẽ đi xem phim.', 'If you come, we will go to the cinema.'),
          EX('Si j’étais riche, j’achèterais une maison.', 'Nếu tôi giàu, tôi sẽ mua nhà.', 'If I were rich, I would buy a house.'),
          EX('Si j’avais su, je serais venu.', 'Nếu tôi biết, tôi đã đến rồi.', 'If I had known, I would have come.'),
          EX('Si j’avais étudié, je serais médecin aujourd’hui.', 'Nếu hồi đó học hành, giờ tôi đã là bác sĩ.', 'If I had studied, I would be a doctor today.')
        ]),
        CALLOUT('warn', 'Sai: Si tu viendras… / Si j’aurais su… Đúng: Si tu viens… / Si j’avais su… Ngoại lệ: “si” nghĩa “liệu rằng” trong câu hỏi gián tiếp — Je me demande s’il viendra.',
          'Wrong: Si tu viendras… / Si j’aurais su… Correct: Si tu viens… / Si j’avais su… Exception: “si” meaning “whether” in an indirect question — Je me demande s’il viendra.'),
        H('Cách diễn đạt điều kiện khác', 'Other ways to express conditions'),
        TABLE(['Cấu trúc', 'Đi với', 'Ví dụ'], [
          ['à condition que, pourvu que, à moins que', 'subjonctif', 'Je viendrai à condition que tu m’invites.'],
          ['au cas où, quand bien même', 'conditionnel', 'Au cas où tu aurais un problème, appelle-moi.'],
          ['sauf si, même si', 'indicatif', 'Même si tu es fatigué, viens.'],
          ['à supposer que, en admettant que', 'subjonctif', 'À supposer qu’il vienne, que ferons-nous ?']
        ]),
        CALLOUT('english', 'Loại 1: if + present → will. Loại 2: if + past → would. Loại 3: if + past perfect → would have + V3. Không dùng will/would ngay sau if.',
          'Type 1: if + present → will. Type 2: if + past → would. Type 3: if + past perfect → would have + V3. Do not use will/would immediately after if.')
      ],
      exercises: [
        FILL('Si tu {{1}} (venir), on ira au cinéma.', ['viens'],
          'Loại 1: si + présent, kết quả futur → viens.',
          'Type 1: si + present, future result → viens.'),
        FILL('Si j’{{1}} (être) riche, j’achèterais une maison.', ['étais'],
          'Loại 2: si + imparfait → étais.',
          'Type 2: si + imparfait → étais.'),
        FILL('Si j’avais su, je {{1}} (venir).', ['serais venu'],
          'Loại 3: kết quả conditionnel passé → serais venu.',
          'Type 3: result in the conditional past → serais venu.'),
        CHOICE('Câu nào đúng?', 'Which sentence is correct?',
          ['Si tu viens, on ira au cinéma.', 'Si tu viendras, on ira au cinéma.', 'Si tu viendrais, on ira au cinéma.'], 0,
          'Sau si (nếu) không dùng futur/conditionnel.',
          'After si (if), do not use the future or conditional.'),
        FILL('Je viendrai à condition que tu m’{{1}} (inviter).', ['invites'],
          'à condition que + subjonctif → tu m’invites.',
          'à condition que + subjunctive → tu m’invites.'),
        FILL('Au cas où tu {{1}} (avoir) un problème, appelle-moi.', ['aurais'],
          'au cas où + conditionnel → tu aurais.',
          'au cas où + conditional → tu aurais.')
      ]
    },

    /* -----------------------------------------------------
       11. Subjonctif
       ----------------------------------------------------- */
    {
      id: 'subjonctif', num: 11, part: 'moods', minutes: 16,
      title: 'Subjonctif',
      subtitle: { vi: 'Thức của cảm xúc và điều chưa chắc', en: 'The mood of emotion and uncertainty' },
      summary: {
        vi: 'Dùng cho điều chưa xảy ra, chưa chắc chắn, hoặc có cảm xúc, mong muốn. Gần như luôn đứng sau “que” trong mệnh đề phụ.',
        en: 'Used for things that have not happened, are uncertain, or carry emotion or desire. It almost always follows “que” in a subordinate clause.'
      },
      blocks: [
        FORMULA('Lấy ngôi ils ở présent → bỏ -ent → thêm -e, -es, -e, -ions, -iez, -ent',
          'Take the ils form in the present → drop -ent → add -e, -es, -e, -ions, -iez, -ent'),
        TABLE(['Động từ', 'ils (présent)', 'que je', 'que tu', 'qu’il', 'que nous', 'que vous', 'qu’ils'], [
          ['parler', 'parlent', 'parle', 'parles', 'parle', 'parlions', 'parliez', 'parlent'],
          ['finir', 'finissent', 'finisse', 'finisses', 'finisse', 'finissions', 'finissiez', 'finissent'],
          ['partir', 'partent', 'parte', 'partes', 'parte', 'partions', 'partiez', 'partent'],
          ['prendre', 'prennent', 'prenne', 'prennes', 'prenne', 'prenions', 'preniez', 'prennent'],
          ['venir', 'viennent', 'vienne', 'viennes', 'vienne', 'venions', 'veniez', 'viennent']
        ]),
        TABLE(['', 'que je', 'que tu', 'qu’il', 'que nous', 'que vous', 'qu’ils'], [
          ['être', 'sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'],
          ['avoir', 'aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'],
          ['aller', 'aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'],
          ['faire', 'fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'],
          ['pouvoir', 'puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'],
          ['savoir', 'sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'],
          ['vouloir', 'veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent']
        ]),
        H('Bốn nhóm kích hoạt', 'Four trigger groups'),
        TABLE(['Nhóm', 'Cụm từ đi trước', 'Ví dụ'], [
          ['MUỐN, YÊU CẦU', 'vouloir que, souhaiter que, exiger que, demander que, préférer que', 'Je veux que tu viennes.'],
          ['CẦN, BẮT BUỘC', 'il faut que, il est nécessaire que, il vaut mieux que', 'Il faut que tu partes.'],
          ['CẢM XÚC', 'être content/triste/surpris que, regretter que, avoir peur que', 'Je suis ravi que tu sois là.'],
          ['NGHI NGỜ, KHẢ NĂNG', 'douter que, il est possible/impossible que, il se peut que', 'Je doute qu’il vienne.']
        ]),
        P('Ý kiến phủ định hoặc nghi vấn cũng dùng subjonctif: Je ne pense pas qu’il soit prêt. / Penses-tu qu’il soit prêt ?',
          'Negative or interrogative opinions also use the subjunctive: Je ne pense pas qu’il soit prêt. / Penses-tu qu’il soit prêt ?'),
        H('Liên từ luôn đi với subjonctif', 'Conjunctions that always take the subjunctive'),
        TABLE(['Ý nghĩa', 'Liên từ', 'Ví dụ'], [
          ['Mục đích', 'pour que, afin que, de peur que', 'Je t’explique pour que tu comprennes.'],
          ['Nhượng bộ', 'bien que, quoique, quoi que', 'Bien qu’il soit fatigué, il travaille.'],
          ['Điều kiện', 'à condition que, pourvu que, à moins que', 'Je viendrai à moins qu’il pleuve.'],
          ['Thời gian', 'avant que, jusqu’à ce que, en attendant que', 'Appelle-moi avant que je parte.'],
          ['Phủ định', 'sans que', 'Il est parti sans que je le voie.']
        ]),
        H('Hai quy tắc quan trọng', 'Two important rules'),
        LIST([
          'Cùng chủ ngữ → dùng nguyên mẫu, không dùng subjonctif: Je veux partir. (không phải Je veux que je parte.)',
          'Chắc chắn → indicatif; không chắc, phủ định, mong muốn → subjonctif: Je pense qu’il vient. / Je ne pense pas qu’il vienne.'
        ], [
          'Same subject → use the infinitive, not the subjunctive: Je veux partir. (not Je veux que je parte.)',
          'Certain → indicative; uncertain, negative, or desired → subjunctive: Je pense qu’il vient. / Je ne pense pas qu’il vienne.'
        ]),
        H('Subjonctif passé', 'Subjonctif passé'),
        FORMULA('Subjonctif passé = avoir / être (subjonctif présent) + participe passé',
          'Subjonctif passé = avoir / être (present subjunctive) + past participle'),
        EXAMPLES([
          EX('Je suis content que tu viennes.', 'Tôi vui vì bạn đang đến / sẽ đến.', 'I am glad you are coming.'),
          EX('Je suis content que tu sois venu.', 'Tôi vui vì bạn đã đến.', 'I am glad you came.'),
          EX('Il faut que tu aies fini demain.', 'Bạn phải làm xong trước ngày mai.', 'You must have finished by tomorrow.'),
          EX('Bien qu’il ait plu, nous sommes sortis.', 'Dù trời đã mưa, chúng tôi vẫn ra ngoài.', 'Although it had rained, we went out.')
        ]),
        CALLOUT('english', 'Tiếng Anh gần như không còn subjonctif. Khi tiếng Anh dùng want/need/wish + người + to + V, tiếng Pháp thường dùng que + subjonctif: I want him to come = Je veux qu’il vienne.',
          'English barely uses the subjunctive. When English uses want/need/wish + person + to + V, French often uses que + subjunctive: I want him to come = Je veux qu’il vienne.')
      ],
      exercises: [
        FILL('Il faut que tu {{1}} (partir).', ['partes'],
          'il faut que + subjonctif: tu partes.',
          'il faut que + subjunctive: tu partes.'),
        FILL('Bien qu’il {{1}} (être) fatigué, il travaille.', ['soit'],
          'bien que + subjonctif; être, ngôi il: soit.',
          'bien que + subjunctive; être, il form: soit.'),
        FILL('Je veux que vous {{1}} (faire) attention.', ['fassiez'],
          'faire, ngôi vous ở subjonctif: fassiez.',
          'faire, vous form in the subjunctive: fassiez.'),
        FILL('Je pense qu’il {{1}} (venir).', ['vient'],
          'penser khẳng định → indicatif: il vient.',
          'Affirmative penser → indicative: il vient.'),
        FILL('Je ne pense pas qu’il {{1}} (venir).', ['vienne'],
          'penser phủ định → subjonctif: il vienne.',
          'Negative penser → subjunctive: il vienne.'),
        FILL('Je suis content que tu {{1}} (venir) hier.', ['sois venu'],
          'Việc đã xảy ra trước → subjonctif passé: sois venu.',
          'The action happened before → subjonctif passé: sois venu.'),
        CHOICE('Câu nào đúng khi cùng chủ ngữ?', 'Which sentence is correct when the subject is the same?',
          ['Je veux partir.', 'Je veux que je parte.', 'Je veux que je pars.'], 0,
          'Cùng chủ ngữ “je” → dùng nguyên mẫu: Je veux partir.',
          'The same subject “je” → use the infinitive: Je veux partir.'),
        FILL('Je cherche quelqu’un qui {{1}} (savoir) parler chinois.', ['sache'],
          'Tìm một người chưa chắc tồn tại → subjonctif: sache.',
          'Looking for someone who may not exist → subjunctive: sache.')
      ]
    },

    /* -----------------------------------------------------
       12. Impératif
       ----------------------------------------------------- */
    {
      id: 'imperatif', num: 12, part: 'moods', minutes: 7,
      title: 'Impératif',
      subtitle: { vi: 'Mệnh lệnh', en: 'Commands and advice' },
      summary: {
        vi: 'Chỉ có ba ngôi tu, nous, vous. Chia như présent nhưng bỏ đại từ chủ ngữ; chú ý vị trí đại từ và dạng phủ định.',
        en: 'Only three forms: tu, nous, vous. It looks like the present without the subject pronoun; watch pronoun position and negation.'
      },
      blocks: [
        TABLE(['', 'parler', 'finir', 'prendre', 'être', 'avoir'], [
          ['tu', 'Parle !', 'Finis !', 'Prends !', 'Sois !', 'Aie !'],
          ['nous', 'Parlons !', 'Finissons !', 'Prenons !', 'Soyons !', 'Ayons !'],
          ['vous', 'Parlez !', 'Finissez !', 'Prenez !', 'Soyez !', 'Ayez !']
        ]),
        LIST([
          'Động từ -er và aller bỏ -s ở ngôi tu: Parle !, Va ! Nhưng giữ -s trước en/y: Vas-y !, Parles-en !',
          'Savoir: sache, sachons, sachez. Vouloir: veuillez (trang trọng).',
          'Phủ định: đại từ đứng trước động từ — Ne me dis pas ça.',
          'Khẳng định: đại từ đứng sau động từ, nối bằng gạch ngang — Dis-le-moi.'
        ], [
          '-er verbs and aller drop -s in the tu form: Parle !, Va ! But keep -s before en/y: Vas-y !, Parles-en !',
          'Savoir: sache, sachons, sachez. Vouloir: veuillez (formal).',
          'Negative: the pronoun comes before the verb — Ne me dis pas ça.',
          'Affirmative: the pronoun comes after the verb with a hyphen — Dis-le-moi.'
        ]),
        EXAMPLES([
          EX('Parle plus lentement, s’il te plaît.', 'Hãy nói chậm hơn.', 'Please speak more slowly.'),
          EX('Vas-y !', 'Đi đi!', 'Go on!'),
          EX('Ne me dis pas ça.', 'Đừng nói với tôi như vậy.', 'Do not say that to me.'),
          EX('Dis-le-moi.', 'Nói với tôi đi.', 'Tell me.'),
          EX('Veuillez patienter.', 'Xin vui lòng chờ.', 'Please wait.')
        ]),
        CALLOUT('warn', 'Đừng quên -s của “tu” ở các nhóm khác: Prends ! / Finis ! Chỉ nhóm -er và aller bỏ -s.',
          'Do not forget the -s in the tu form of other groups: Prends ! / Finis ! Only -er verbs and aller drop it.')
      ],
      exercises: [
        FILL('{{1}} ! (parler, tu)', ['Parle'],
          'parler, ngôi tu ở impératif: Parle ! (bỏ -s).',
          'parler, tu imperative: Parle ! (drop the -s).'),
        FILL('{{1}}-y ! (aller, tu)', ['Vas'],
          'aller giữ -s trước y: Vas-y !',
          'aller keeps -s before y: Vas-y !'),
        FILL('Ne {{1}} pas ça ! (dire, tu)', ['dis'],
          'dire, ngôi tu: dis; phủ định ne … pas.',
          'dire, tu form: dis; negative ne … pas.'),
        FILL('{{1}}-le-moi. (dire, tu)', ['Dis'],
          'Khẳng định, đại từ sau động từ: Dis-le-moi.',
          'Affirmative, pronoun after the verb: Dis-le-moi.'),
        FILL('{{1}} ! (être, vous)', ['Soyez'],
          'être, ngôi vous ở impératif: Soyez !',
          'être, vous imperative: Soyez !')
      ]
    }

    ,

    /* -----------------------------------------------------
       13. Gérondif, participe présent, infinitif passé
       ----------------------------------------------------- */
    {
      id: 'gerondif', num: 13, part: 'tools', minutes: 10,
      title: 'Gérondif & infinitif passé',
      subtitle: { vi: 'Gérondif, participe présent, infinitif passé', en: 'Gerund, present participle, past infinitive' },
      summary: {
        vi: 'Ba cấu trúc giúp câu văn gọn và tự nhiên: “en + -ant” (đồng thời, cách thức, nguyên nhân), participe présent (văn trang trọng) và infinitif passé (sau khi đã làm).',
        en: 'Three structures that make writing concise and natural: “en + -ant” (simultaneous action, manner, cause), the present participle (formal writing), and the past infinitive (after having done).'
      },
      blocks: [
        H('Gérondif: en + -ant', 'Gérondif: en + -ant'),
        FORMULA('Gérondif = en + (ngôi nous của présent, bỏ -ons, thêm -ant)',
          'Gérondif = en + (nous form of the present, drop -ons, add -ant)'),
        P('parler → nous parlons → en parlant. finir → nous finissons → en finissant. Ngoại lệ: être → en étant; avoir → en ayant; savoir → en sachant. Chủ ngữ của gérondif phải cùng người với động từ chính.',
          'parler → nous parlons → en parlant. finir → nous finissons → en finissant. Irregular: être → en étant; avoir → en ayant; savoir → en sachant. The gerund’s subject must be the same as the main verb’s subject.'),
        TABLE(['Ý nghĩa', 'Ví dụ'], [
          ['Đồng thời', 'Il chante en travaillant.'],
          ['Cách thức', 'Elle est entrée en courant.'],
          ['Nguyên nhân', 'En voyant ce film, j’ai compris.'],
          ['Điều kiện', 'En travaillant plus, tu réussirais.'],
          ['Đối lập (có tout)', 'Tout en étant fatigué, il a continué.']
        ]),
        H('Participe présent', 'Present participle'),
        P('Dùng trong văn trang trọng, mang nghĩa nguyên nhân hoặc thay cho mệnh đề quan hệ. Không hòa hợp giống, số.',
          'Used in formal writing for cause or to replace a relative clause. It does not agree in gender or number.'),
        EXAMPLES([
          EX('Ne sachant pas quoi faire, il a attendu.', 'Vì không biết làm gì, anh ấy chờ.', 'Not knowing what to do, he waited.'),
          EX('Un homme portant un chapeau…', 'Một người đàn ông đội mũ…', 'A man wearing a hat…'),
          EX('Les enfants fatiguant leurs parents…', 'Những đứa trẻ làm bố mẹ mệt…', 'Children tiring their parents…')
        ]),
        CALLOUT('warn', 'Adjectif verbal hòa hợp như tính từ: une histoire passionnante, des enfants fatigants. Participe présent thì không: des enfants fatiguant leurs parents.',
          'The verbal adjective agrees like an adjective: une histoire passionnante, des enfants fatigants. The present participle does not: des enfants fatiguant leurs parents.'),
        H('Infinitif passé', 'Past infinitive'),
        FORMULA('Infinitif passé = avoir / être (nguyên mẫu) + participe passé',
          'Infinitif passé = avoir / être (infinitive) + past participle'),
        EXAMPLES([
          EX('Après avoir mangé, il est sorti.', 'Sau khi ăn xong, anh ấy ra ngoài.', 'After having eaten, he went out.'),
          EX('Je regrette d’avoir menti.', 'Tôi hối hận vì đã nói dối.', 'I regret having lied.'),
          EX('Merci d’être venu.', 'Cảm ơn bạn đã đến.', 'Thank you for coming.'),
          EX('Après s’être levé, il a pris son café.', 'Sau khi dậy, anh ấy uống cà phê.', 'After getting up, he had his coffee.')
        ]),
        CALLOUT('warn', 'Sau après luôn dùng infinitif passé nếu hai việc cùng chủ ngữ. Khác chủ ngữ thì dùng après que + indicatif: Après que tu es parti, j’ai pleuré.',
          'After après, use the past infinitive when both actions share the same subject. With different subjects, use après que + indicative: Après que tu es parti, j’ai pleuré.'),
        CALLOUT('english', 'Gérondif ≈ by / while + V-ing. Infinitif passé ≈ after having + V3.',
          'Gérondif ≈ by / while + V-ing. Infinitif passé ≈ after having + V3.')
      ],
      exercises: [
        FILL('Il chante en {{1}} (travailler).', ['travaillant'],
          'Gérondif: en + travaillant.',
          'Gérondif: en + travaillant.'),
        FILL('Après {{1}} (manger), il est sorti.', ['avoir mangé'],
          'Infinitif passé: après avoir mangé.',
          'Past infinitive: après avoir mangé.'),
        FILL('{{1}} (être) malade, il est resté chez lui.', ['Étant', 'Etant'],
          'Participe présent của être: étant.',
          'Present participle of être: étant.'),
        CHOICE('“En travaillant” gần nghĩa nhất với gì?', 'Which is closest in meaning to “En travaillant”?',
          ['While working', 'Worked', 'To work'], 0,
          'Gérondif diễn tả đồng thời, cách thức hoặc nguyên nhân.',
          'The gerund expresses simultaneous action, manner, or cause.'),
        FILL('Merci d’{{1}} (venir).', ['être venu'],
          'Infinitif passé: être venu.',
          'Past infinitive: être venu.')
      ]
    },

    /* -----------------------------------------------------
       14. Reported speech
       ----------------------------------------------------- */
    {
      id: 'discours-indirect', num: 14, part: 'tools', minutes: 10,
      title: 'Le discours indirect',
      subtitle: { vi: 'Lời nói gián tiếp và phối hợp thì', en: 'Reported speech and tense agreement' },
      summary: {
        vi: 'Khi kể lại lời ai đó và động từ tường thuật ở quá khứ, các thì trong câu thường “lùi một bậc”; từ chỉ thời gian và nơi chốn cũng đổi.',
        en: 'When reporting someone’s words with a past reporting verb, tenses usually shift back one step; time and place words change too.'
      },
      blocks: [
        TABLE(['Lời nói trực tiếp', 'Lời nói gián tiếp (động từ ở quá khứ)'], [
          ['présent', 'imparfait'],
          ['passé composé', 'plus-que-parfait'],
          ['futur simple', 'conditionnel présent'],
          ['futur antérieur', 'conditionnel passé'],
          ['imparfait, plus-que-parfait, conditionnel', 'giữ nguyên'],
          ['impératif', 'de + nguyên mẫu']
        ]),
        EXAMPLES([
          EX('« Je suis fatigué. » → Il a dit qu’il était fatigué.', 'Anh ấy nói là anh ấy mệt.', '“I am tired.” → He said he was tired.'),
          EX('« J’ai fini. » → Elle a dit qu’elle avait fini.', 'Cô ấy nói là cô ấy đã xong.', '“I have finished.” → She said she had finished.'),
          EX('« Je viendrai. » → Il a promis qu’il viendrait.', 'Anh ấy hứa sẽ đến.', '“I will come.” → He promised he would come.'),
          EX('« Viens ! » → Elle m’a demandé de venir.', 'Cô ấy bảo tôi đến.', '“Come!” → She asked me to come.')
        ]),
        H('Đổi từ chỉ thời gian và nơi chốn', 'Time and place changes'),
        TABLE(['Trực tiếp', 'Gián tiếp', 'Trực tiếp', 'Gián tiếp'], [
          ['aujourd’hui', 'ce jour-là', 'ici', 'là'],
          ['hier', 'la veille', 'ce soir', 'ce soir-là'],
          ['demain', 'le lendemain', 'la semaine prochaine', 'la semaine suivante'],
          ['maintenant', 'alors, à ce moment-là', 'il y a deux jours', 'deux jours avant']
        ]),
        H('Câu hỏi gián tiếp', 'Indirect questions'),
        LIST([
          'Câu hỏi có/không → dùng si: Il demande si tu viens.',
          'Qu’est-ce que / Que → ce que; Qu’est-ce qui → ce qui; Qui est-ce qui → qui.'
        ], [
          'Yes/no question → use si: Il demande si tu viens.',
          'Qu’est-ce que / Que → ce que; Qu’est-ce qui → ce qui; Qui est-ce qui → qui.'
        ]),
        CALLOUT('tip', 'Nếu động từ tường thuật ở présent (Il dit que…), giữ nguyên thì, không cần lùi.',
          'If the reporting verb is in the present (Il dit que…), keep the original tense; no backshift is needed.'),
        CALLOUT('english', 'Quy tắc lùi thì giống tiếng Anh: He said he was tired = Il a dit qu’il était fatigué.',
          'The backshift rule is similar to English: He said he was tired = Il a dit qu’il était fatigué.')
      ],
      exercises: [
        FILL('« Je suis fatigué », a-t-il dit. → Il a dit qu’il {{1}}.', ['était fatigué', "était fatigué."],
          'présent → imparfait: il était fatigué.',
          'Present → imparfait: il était fatigué.'),
        FILL('« J’ai fini », a-t-elle dit. → Elle a dit qu’elle {{1}}.', ['avait fini'],
          'passé composé → plus-que-parfait: elle avait fini.',
          'Passé composé → plus-que-parfait: elle avait fini.'),
        FILL('« Je viendrai. » → Il a promis qu’il {{1}}.', ['viendrait'],
          'futur simple → conditionnel présent: il viendrait.',
          'Futur simple → conditional present: il viendrait.'),
        FILL('« Viens ! » → Elle m’a demandé de {{1}}.', ['venir'],
          'impératif → de + nguyên mẫu: de venir.',
          'Imperative → de + infinitive: de venir.'),
        CHOICE('“Il demande si tu viens” là loại câu gì?', 'What kind of sentence is “Il demande si tu viens”?',
          ['Câu hỏi gián tiếp có/không', 'Mệnh lệnh', 'Câu cảm thán'], 0,
          '“si” dùng cho câu hỏi gián tiếp có/không.',
          '“si” introduces an indirect yes/no question.'),
        FILL('« Demain » trong lời nói gián tiếp trở thành {{1}}.', ['le lendemain'],
          'demain → le lendemain.',
          'demain → le lendemain.')
      ]
    },

    /* -----------------------------------------------------
       15. Passive voice
       ----------------------------------------------------- */
    {
      id: 'passif', num: 15, part: 'tools', minutes: 9,
      title: 'La voix passive',
      subtitle: { vi: 'Thể bị động', en: 'The passive voice' },
      summary: {
        vi: 'Bị động = être (chia theo thì) + participe passé + par/de + tác nhân. Chủ ngữ bị động chính là tân ngữ của câu chủ động.',
        en: 'Passive = être (in the needed tense) + past participle + par/de + agent. The passive subject is the object of the active sentence.'
      },
      blocks: [
        FORMULA('Bị động = être (chia theo thì) + participe passé + par / de + tác nhân',
          'Passive = être (in the needed tense) + past participle + par / de + agent'),
        P('Participe passé hòa hợp với chủ ngữ. Ví dụ: La loi est votée par le Parlement. → La loi (chủ ngữ nữ) + est votée.',
          'The past participle agrees with the subject. Example: La loi est votée par le Parlement. → La loi (feminine subject) + est votée.'),
        TABLE(['Thì', 'Ví dụ'], [
          ['présent', 'La loi est votée par le Parlement.'],
          ['passé composé', 'La loi a été votée.'],
          ['imparfait', 'La loi était votée.'],
          ['futur', 'La loi sera votée.'],
          ['conditionnel', 'La loi serait votée.'],
          ['subjonctif', 'Il faut que la loi soit votée.']
        ]),
        LIST([
          'par: hành động cụ thể — La loi est votée par le Parlement.',
          'de: trạng thái, cảm xúc — Il est aimé de tous.',
          'Cách tránh bị động: dùng on (On a voté la loi) hoặc phản thân (Ça se vend bien).'
        ], [
          'par: a specific action — La loi est votée par le Parlement.',
          'de: a state or emotion — Il est aimé de tous.',
          'Ways to avoid the passive: use on (On a voté la loi) or a reflexive verb (Ça se vend bien).'
        ]),
        EXAMPLES([
          EX('Le Parlement vote la loi. → La loi est votée par le Parlement.', 'Quốc hội thông qua luật. → Luật được thông qua bởi Quốc hội.', 'Parliament passes the law. → The law is passed by Parliament.'),
          EX('On a construit cette école en 1990.', 'Người ta xây trường này năm 1990.', 'This school was built in 1990.'),
          EX('Ça se vend bien.', 'Món này bán chạy.', 'It sells well.')
        ]),
        CALLOUT('english', 'Bị động = be + V3. Il est aimé = He is loved. Chọn thì của “être” theo thì của câu chủ động.',
          'Passive = be + V3. Il est aimé = He is loved. Choose the tense of “être” to match the active sentence.')
      ],
      exercises: [
        FILL('Le Parlement vote la loi. → La loi {{1}} par le Parlement.', ['est votée'],
          'Présent bị động: est + votée (hòa hợp với la loi).',
          'Present passive: est + votée (agreeing with la loi).'),
        FILL('On a voté la loi. → La loi {{1}}.', ['a été votée'],
          'Passé composé bị động: a été + votée.',
          'Passé composé passive: a été + votée.'),
        FILL('La loi {{1}} (futur) par le Parlement.', ['sera votée'],
          'Futur bị động: sera + votée.',
          'Future passive: sera + votée.'),
        CHOICE('“Il est aimé de tous” dùng “de” vì lý do gì?', 'Why does “Il est aimé de tous” use “de”?',
          ['Diễn tả trạng thái/cảm xúc', 'Diễn tả hành động cụ thể', 'Đó là câu phủ định'], 0,
          '“de” thường dùng cho trạng thái, cảm xúc; “par” cho hành động cụ thể.',
          '“de” is common for states and emotions; “par” for a specific action.'),
        FILL('Il faut que la loi {{1}} (être, subjonctif) votée.', ['soit'],
          'Subjonctif bị động: que la loi soit votée.',
          'Passive subjunctive: que la loi soit votée.')
      ]
    },

    /* -----------------------------------------------------
       16. Passé simple
       ----------------------------------------------------- */
    {
      id: 'passe-simple', num: 16, part: 'tools', minutes: 8,
      title: 'Le passé simple',
      subtitle: { vi: 'Chỉ cần nhận biết khi đọc', en: 'Reading recognition only' },
      summary: {
        vi: 'Thì quá khứ văn học, dùng trong tiểu thuyết, truyện và sách lịch sử. Ở B2 bạn chủ yếu cần nhận ra nó khi đọc.',
        en: 'A literary past tense used in novels, stories, and history books. At B2 you mainly need to recognise it when reading.'
      },
      blocks: [
        P('Passé simple kể sự kiện đã xong, vai trò giống passé composé nhưng chỉ dùng trong văn viết trang trọng. Chủ yếu gặp ở ngôi il/elle và ils/elles.',
          'The passé simple narrates completed events. It plays the same role as the passé composé but belongs to formal writing. It is mostly found in the il/elle and ils/elles forms.'),
        TABLE(['Nhóm', 'il / elle', 'ils / elles', 'Ví dụ'], [
          ['-er', 'parla', 'parlèrent', 'Il parla.'],
          ['-ir, -re', 'finit, vendit', 'finirent, vendirent', 'Elle finit.'],
          ['être / avoir', 'fut / eut', 'furent / eurent', 'Il fut surpris.'],
          ['Khác', 'fit, dit, vint, put, voulut', 'firent, dirent, vinrent, purent', 'Ils firent.']
        ]),
        EXAMPLES([
          EX('Il ouvrit la porte et vit un inconnu.', 'Anh ấy mở cửa và thấy một người lạ.', 'He opened the door and saw a stranger.'),
          EX('Les soldats arrivèrent à l’aube.', 'Những người lính đến lúc bình minh.', 'The soldiers arrived at dawn.'),
          EX('Elle fut surprise par la nouvelle.', 'Cô ấy bị tin tức làm cho bất ngờ.', 'She was surprised by the news.')
        ]),
        CALLOUT('tip', 'Thấy đuôi -a, -èrent, -it, -irent, -ut, -urent trong truyện thì đó là passé simple; hãy dịch như passé composé.',
          'If you see endings -a, -èrent, -it, -irent, -ut, -urent in a story, it is the passé simple; translate it like the passé composé.'),
        CALLOUT('english', 'Passé simple ≈ literary past simple. Il parla = he spoke / he has spoken in a narrative.',
          'Passé simple ≈ the literary past simple. Il parla = he spoke in a narrative.')
      ],
      exercises: [
        FILL('Il {{1}} (parler) au passé simple.', ['parla'],
          'parler, ngôi il ở passé simple: parla.',
          'parler, il form in the passé simple: parla.'),
        FILL('Ils {{1}} (finir) au passé simple.', ['finirent'],
          'finir, ngôi ils ở passé simple: finirent.',
          'finir, ils form in the passé simple: finirent.'),
        FILL('Elle {{1}} (être) surprise.', ['fut'],
          'être, ngôi elle ở passé simple: fut.',
          'être, elle form in the passé simple: fut.'),
        FILL('Ils {{1}} (avoir) peur.', ['eurent'],
          'avoir, ngôi ils ở passé simple: eurent.',
          'avoir, ils form in the passé simple: eurent.'),
        CHOICE('“Il ouvrit la porte” dùng thì nào?', 'Which tense is “Il ouvrit la porte”?',
          ['Passé simple', 'Imparfait', 'Futur simple'], 0,
          'ouvrit là passé simple của ouvrir.',
          'ouvrit is the passé simple of ouvrir.')
      ]
    },

    /* -----------------------------------------------------
       17. English comparison
       ----------------------------------------------------- */
    {
      id: 'anglais', num: 17, part: 'review', minutes: 8,
      title: 'Français – anglais',
      subtitle: { vi: 'Bảng tra nhanh', en: 'Quick comparison' },
      summary: {
        vi: 'Nếu đã biết tiếng Anh, bảng này giúp ánh xạ nhanh — nhưng nhớ rằng tiếng Pháp thường “gộp” nhiều dạng tiếng Anh vào một thì.',
        en: 'If you know English, this table gives a quick mapping — but remember that French often merges several English forms into one tense.'
      },
      blocks: [
        H('Gần như 1-1', 'Almost one-to-one'),
        TABLE(['Tiếng Pháp', 'Tiếng Anh', 'Ví dụ'], [
          ['Plus-que-parfait', 'Past perfect (had + V3)', 'J’avais fini = I had finished'],
          ['Futur antérieur', 'Future perfect (will have + V3)', 'J’aurai fini = I will have finished'],
          ['Futur simple', 'will + V', 'Je viendrai = I will come'],
          ['Futur proche', 'be going to', 'Je vais partir = I’m going to leave'],
          ['Passé récent', 'have just + V3', 'Je viens de manger = I’ve just eaten'],
          ['Conditionnel présent', 'would + V', 'Je viendrais = I would come'],
          ['Conditionnel passé', 'would have + V3', 'Je serais venu = I would have come'],
          ['Voix passive', 'be + V3', 'Il est aimé = He is loved'],
          ['Infinitif passé', 'having + V3', 'Après avoir mangé = After having eaten'],
          ['Gérondif', 'by / while + V-ing', 'En travaillant = While working']
        ]),
        H('Gộp hoặc tách', 'Merged or split'),
        TABLE(['Tiếng Anh', 'Tiếng Pháp'], [
          ['Present simple / Present continuous', 'Présent'],
          ['Past simple (sự kiện đã xong)', 'Passé composé'],
          ['Past simple (thói quen/trạng thái), past continuous, used to', 'Imparfait'],
          ['Present perfect', 'Passé composé'],
          ['Have been doing + for / since', 'Présent + depuis'],
          ['(gần như không có)', 'Subjonctif']
        ]),
        H('Năm “bẫy” kinh điển', 'Five classic traps'),
        LIST([
          'Passé composé vừa là past simple vừa là present perfect.',
          'Imparfait = was doing + used to + was (gộp ba thứ làm một).',
          'Depuis + présent, không dùng passé composé: J’habite ici depuis 3 ans.',
          'Quand / dès que + futur, trong khi tiếng Anh dùng present.',
          'Want / need + người + to + V → vouloir / falloir + que + subjonctif.'
        ], [
          'The passé composé is both the past simple and the present perfect.',
          'The imparfait = was doing + used to + was (three English patterns in one).',
          'Depuis + present, not the passé composé: J’habite ici depuis 3 ans.',
          'Quand / dès que + future, while English uses the present.',
          'Want / need + person + to + V → vouloir / falloir + que + subjunctive.'
        ]),
        CALLOUT('tip', 'Đừng dịch từng thì. Hỏi trước: đây là nền, hành động, kết quả hay giả định? Rồi mới chọn thì Pháp.',
          'Do not translate tense by tense. Ask first: is this background, action, result, or hypothesis? Then choose the French tense.')
      ],
      exercises: [
        CHOICE('“I have lived here for 3 years” dịch đúng là gì?', 'Which is the correct French for “I have lived here for 3 years”?',
          ['J’habite ici depuis trois ans.', 'J’ai habité ici depuis trois ans.', 'Je vivais ici depuis trois ans.'], 0,
          'Tiếng Pháp dùng présent + depuis cho việc còn tiếp diễn.',
          'French uses the present + depuis for an ongoing situation.'),
        FILL('When I arrive, I will call you. → Quand j’{{1}}, je t’appellerai.', ['arriverai'],
          'Sau quand + tương lai, tiếng Pháp dùng futur: j’arriverai.',
          'After quand + future, French uses the future: j’arriverai.'),
        CHOICE('“I was reading when he called” dịch đúng là gì?', 'Which is the correct French for “I was reading when he called”?',
          ['Je lisais quand il a appelé.', 'J’ai lu quand il appelait.', 'Je lis quand il a appelé.'], 0,
          'Nền “đang đọc” → imparfait; hành động cắt ngang → passé composé.',
          'Background “was reading” → imparfait; interrupting event → passé composé.'),
        FILL('I want him to come. → Je veux qu’il {{1}}.', ['vienne'],
          'want + người + to + V → vouloir que + subjonctif: qu’il vienne.',
          'want + person + to + V → vouloir que + subjunctive: qu’il vienne.'),
        CHOICE('“I have eaten” dịch đúng là gì?', 'Which is the correct French for “I have eaten”?',
          ['J’ai mangé.', 'Je mangeais.', 'Je mange.'], 0,
          'Present perfect thường dùng passé composé trong tiếng Pháp.',
          'The present perfect usually maps to the passé composé in French.')
      ]
    },

    /* -----------------------------------------------------
       18. Review and mock exam
       ----------------------------------------------------- */
    {
      id: 'revision', num: 18, part: 'review', minutes: 25,
      title: 'Révision & examen',
      subtitle: { vi: 'Ôn tập, thi thử và đáp án', en: 'Review, mock exam, and answers' },
      summary: {
        vi: 'Checklist DELF B2 và 27 câu tự kiểm tra. Làm hết trước khi xem đáp án; câu nào sai thì quay lại chương tương ứng.',
        en: 'A DELF B2 checklist and 27 self-check questions. Do them all before looking at the answers; for each mistake, return to the matching chapter.'
      },
      blocks: [
        H('Checklist DELF B2', 'DELF B2 checklist'),
        TABLE(['Kỹ năng', 'Dùng gì từ cẩm nang?'], [
          ['Viết (essai argumenté, thư trang trọng)', '2–3 câu subjonctif (ch. 11), 1 câu hypothèse (ch. 10), 1 gérondif/participe présent, 1 infinitif passé (ch. 13), liên từ nhượng bộ: bien que, même si, certes… mais…'],
          ['Nói (bảo vệ quan điểm)', 'Conditionnel để nuance: Je dirais que…, On pourrait penser que… (ch. 9)'],
          ['Đọc', 'Nhận ra passé simple (ch. 16), conditionnel “tin chưa kiểm chứng” của báo chí, bị động (ch. 15)'],
          ['Nghe', 'Phân biệt passé composé / imparfait / plus-que-parfait để hiểu trình tự câu chuyện (ch. 6)']
        ]),
        P('Bài tập tự kiểm tra: chia động từ trong ngoặc. Có 27 câu, đi từ présent đến lời nói gián tiếp, bị động và dịch. Hãy làm hết trước khi xem đáp án.',
          'Self-check: conjugate the verbs in brackets. There are 27 questions, from the present to reported speech, the passive, and translation. Do them all before checking the answers.'),
        CALLOUT('tip', 'Mỗi ngày 15 phút, mỗi tuần một thì. Hai tuần cuối trước thi, làm đề thật DELF B2 đúng thời gian.',
          'Study 15 minutes a day, one tense a week. In the last two weeks before the exam, do real DELF B2 papers under timed conditions.')
      ],
      exercises: [
        /* 1 */ FILL('Nous {{1}} (prendre) le bus tous les jours.', ['prenons'],
          'Présent, thói quen: nous prenons.',
          'Present habit: nous prenons.'),
        /* 2 */ FILL('Ils {{1}} (pouvoir) venir demain.', ['peuvent'],
          'Présent: ils peuvent.',
          'Present: ils peuvent.'),
        /* 3 */ FILL('Hier, elle {{1}} (aller) au cinéma.', ['est allée'],
          'Passé composé với être; elle → est allée.',
          'Passé composé with être; elle → est allée.'),
        /* 4 */ FILL('Hier, nous {{1}} (finir) le travail.', ['avons fini'],
          'Passé composé với avoir: nous avons fini.',
          'Passé composé with avoir: nous avons fini.'),
        /* 5 */ FILL('Elle {{1}} (se lever) à 7 h ce matin.', ['s’est levée', "s'est levée"],
          'Phản thân dùng être; se là COD đứng trước → s’est levée.',
          'Reflexive with être; se is a preceding direct object → s’est levée.'),
        /* 6 */ FILL('Quand j’{{1}} (être) petit, je {{2}} (jouer) dehors.', [['étais'], ['jouais']],
          'Bối cảnh và thói quen quá khứ → imparfait: étais, jouais.',
          'Past background and habit → imparfait: étais, jouais.'),
        /* 7 */ FILL('Il {{1}} (pleuvoir) quand je {{2}} (sortir).', [['pleuvait'], ['suis sorti']],
          'Nền → pleuvait; hành động cắt ngang → suis sorti.',
          'Background → pleuvait; interrupting event → suis sorti.'),
        /* 8 */ FILL('Quand je suis arrivé, le film {{1}} (commencer).', ['avait commencé'],
          'Việc xảy ra trước → plus-que-parfait: avait commencé.',
          'An earlier past action → plus-que-parfait: avait commencé.'),
        /* 9 */ FILL('Demain, je {{1}} (faire) mes devoirs.', ['ferai'],
          'Futur simple: je ferai.',
          'Futur simple: je ferai.'),
        /* 10 */ FILL('Quand tu {{1}} (arriver), appelle-moi.', ['arriveras'],
          'Sau quand + futur: tu arriveras.',
          'After quand + future: tu arriveras.'),
        /* 11 */ FILL('Dès que j’{{1}} (finir), je sortirai.', ['aurai fini'],
          'Việc xong trước → futur antérieur: j’aurai fini.',
          'The action is completed first → futur antérieur: j’aurai fini.'),
        /* 12 */ FILL('Tu {{1}} (devoir) te reposer.', ['devrais'],
          'Lời khuyên: tu devrais.',
          'Advice: tu devrais.'),
        /* 13 */ FILL('Si j’avais de l’argent, je {{1}} (voyager).', ['voyagerais'],
          'Loại 2: conditionnel présent → voyagerais.',
          'Type 2: conditional present → voyagerais.'),
        /* 14 */ FILL('Si j’avais su, je {{1}} (venir).', ['serais venu'],
          'Loại 3: conditionnel passé → serais venu.',
          'Type 3: conditional past → serais venu.'),
        /* 15 */ FILL('Si tu {{1}} (venir), on ira au cinéma.', ['viens'],
          'Loại 1: si + présent → viens.',
          'Type 1: si + present → viens.'),
        /* 16 */ FILL('Il faut que tu {{1}} (partir).', ['partes'],
          'il faut que + subjonctif → partes.',
          'il faut que + subjunctive → partes.'),
        /* 17 */ FILL('Bien qu’il {{1}} (être) fatigué, il travaille.', ['soit'],
          'bien que + subjonctif → soit.',
          'bien que + subjunctive → soit.'),
        /* 18 */ FILL('Je veux que vous {{1}} (faire) attention.', ['fassiez'],
          'faire, ngôi vous ở subjonctif → fassiez.',
          'faire, vous subjunctive → fassiez.'),
        /* 19 */ FILL('Je pense qu’il {{1}} (venir). / Je ne pense pas qu’il {{2}} (venir).', [['vient'], ['vienne']],
          'Khẳng định → indicatif (vient); phủ định → subjonctif (vienne).',
          'Affirmative → indicative (vient); negative → subjunctive (vienne).'),
        /* 20 */ FILL('Je suis content que tu {{1}} (venir) hier.', ['sois venu'],
          'Việc đã xảy ra trước → subjonctif passé: sois venu.',
          'A prior action → subjonctif passé: sois venu.'),
        /* 21 */ FILL('Après {{1}} (manger), il est sorti.', ['avoir mangé'],
          'Sau après, cùng chủ ngữ → infinitif passé: avoir mangé.',
          'After après, same subject → past infinitive: avoir mangé.'),
        /* 22 */ FILL('Il chante {{1}} (travailler).', ['en travaillant'],
          'Gérondif: en travaillant.',
          'Gérondif: en travaillant.'),
        /* 23 */ FILL('« Je suis fatigué », a-t-il dit. → Il a dit qu’il {{1}}.', ['était fatigué', "était fatigué."],
          'présent → imparfait: était fatigué.',
          'Present → imparfait: était fatigué.'),
        /* 24 */ FILL('« J’ai fini », a-t-elle dit. → Elle a dit qu’elle {{1}}.', ['avait fini'],
          'passé composé → plus-que-parfait: avait fini.',
          'Passé composé → plus-que-parfait: avait fini.'),
        /* 25 */ FILL('« Je viendrai ». → Il a promis qu’il {{1}}.', ['viendrait'],
          'futur simple → conditionnel présent: viendrait.',
          'Futur simple → conditional present: viendrait.'),
        /* 26 */ FILL('Le Parlement vote la loi. → La loi {{1}} par le Parlement.', ['est votée'],
          'Bị động présent: est votée.',
          'Present passive: est votée.'),
        /* 27 */ TRANSLATE('Tôi sống ở đây được ba năm rồi.', 'I have lived here for three years.',
          ['J’habite ici depuis trois ans.', 'J’habite ici depuis 3 ans.', "J'habite ici depuis trois ans.", "J'habite ici depuis 3 ans."],
          'présent + depuis: J’habite ici depuis trois ans.',
          'present + depuis: J’habite ici depuis trois ans.')
      ]
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
