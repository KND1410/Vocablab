/* =========================================================
   VocabLab — grammar-handbook.js
   The 12-chapter A2 → B2 grammar handbook (Cam nang ngu phap
   tieng Phap A2-B2). It is the companion to the tenses atlas:
   the atlas covers verbs, this course covers everything else.
   Explanations are bilingual; examples stay in French with
   VI/EN meanings. Same schema as grammar-data.js.
   ========================================================= */
(function (global) {
  'use strict';

  var GD = global.GrammarHandbook = {
    id: 'handbook',
    title: { vi: 'Cẩm nang ngữ pháp A2–B2', en: 'Grammar Handbook A2–B2' },
    subtitle: { vi: 'Cẩm nang DELF B2 · 12 chương', en: 'DELF B2 handbook · 12 chapters' },
    intro: {
      vi: 'Danh từ, đại từ, giới từ, liên từ và văn phong: những phần còn lại của ngữ pháp, đi từ A2 lên B2 theo đúng thứ tự người học cần xây.',
      en: 'Nouns, pronouns, prepositions, connectives and register: the rest of the grammar, ordered A2 → B2 the way a learner needs to build it.'
    },
    parts: [
      { id: 'map', title: { vi: 'Bắt đầu', en: 'Getting started' } },
      { id: 'group', title: { vi: 'Danh từ và câu', en: 'Nouns and sentences' } },
      { id: 'pron', title: { vi: 'Đại từ', en: 'Pronouns' } },
      { id: 'link', title: { vi: 'Liên kết câu', en: 'Linking ideas' } },
      { id: 'write', title: { vi: 'Viết B2', en: 'B2 writing' } }
    ],
    chapters: []
  };

  function P(vi, en) { return { type: 'p', vi: vi, en: en }; }
  function H(vi, en) { return { type: 'h', vi: vi, en: en }; }
  function LIST(vi, en) { return { type: 'list', vi: vi, en: en }; }
  function C(vi, en) { return { vi: vi, en: en }; }
  function TABLE(head, rows, caption) {
    return { type: 'table', head: head, rows: rows, caption: caption || '' };
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

  GD.chapters = [

    /* -----------------------------------------------------
       1. The A2 → B2 map
       ----------------------------------------------------- */
    {
      id: 'hb-map', num: 1, part: 'map', minutes: 6,
      title: 'La carte de la grammaire',
      subtitle: { vi: 'Bản đồ ngữ pháp A2 → B2', en: 'The A2 → B2 grammar map' },
      summary: {
        vi: 'Ba tầng trình độ: A2 nói câu đúng, B1 nối câu, B2 viết mạch lạc và trang trọng. Biết mình đang ở tầng nào thì mới biết học gì trước.',
        en: 'Three levels: A2 writes correct sentences, B1 links them, B2 writes a coherent and formal text. Knowing your level tells you what to learn next.'
      },
      blocks: [
        P('Cẩm nang các thì lo phần động từ. Cẩm nang này lo mọi phần còn lại: danh từ, tính từ, đại từ, so sánh, giới từ, đại từ quan hệ, liên từ và văn phong trang trọng.',
          'The tenses atlas looks after verbs. This handbook looks after everything else: nouns, adjectives, pronouns, comparison, prepositions, relative pronouns, connectives and formal register.'),
        H('Ba tầng trình độ', 'The three levels'),
        TABLE([C('Trình độ', 'Level'), C('Bạn cần làm được', 'What you must be able to do'), C('Chương', 'Chapters')], [
          [C('A2', 'A2'), C('Câu đúng và rõ: mạo từ, tính từ, phủ định, câu hỏi', 'A correct, clear sentence: articles, adjectives, negation, questions'), C('2–4', '2–4')],
          [C('B1', 'B1'), C('Nối hai ý: đại từ, so sánh, giới từ, đại từ quan hệ', 'Link two ideas: pronouns, comparison, prepositions, relatives'), C('5–8', '5–8')],
          [C('B2', 'B2'), C('Một bài viết mạch lạc, trang trọng, không lặp', 'A coherent, formal text without repetition'), C('9–12', '9–12')]
        ]),
        H('Thứ tự nên học', 'The order to study'),
        LIST([
          'Tầng A2: mạo từ → tính từ → phủ định và câu hỏi. Sai mạo từ là lỗi người Việt gặp nhiều nhất.',
          'Tầng B1: đại từ COD/COI → giới từ → đại từ quan hệ. Đây là phần giúp câu không còn “trẻ con”.',
          'Tầng B2: liên từ lập luận → nominalisation → các cấu trúc “ăn điểm” của bài viết DELF.'
        ], [
          'Level A2: articles → adjectives → negation and questions. Missing articles are the most common Vietnamese-learner error.',
          'Level B1: object pronouns → prepositions → relative pronouns. This is what stops a sentence sounding childish.',
          'Level B2: argumentative connectives → nominalisation → the structures that earn marks in a DELF essay.'
        ]),
        CALLOUT('tip', 'Đừng học hết lý thuyết rồi mới viết. Sau mỗi chương, hãy viết năm câu về đời bạn bằng đúng cấu trúc vừa học.',
          'Do not learn all the theory before writing. After each chapter, write five sentences about your own life using exactly that structure.'),
        CALLOUT('english', 'Tiếng Anh dùng “the” rất nhiều; tiếng Pháp dùng mạo từ bắt buộc hơn nữa, kể cả trước danh từ trừu tượng: la liberté, le courage.',
          'English drops “the” often; French uses an article almost everywhere, including abstract nouns: la liberté, le courage.')
      ],
      exercises: [
        CHOICE('Ở tầng nào bạn bắt đầu nối hai ý bằng đại từ quan hệ?', 'At which level do you start linking two ideas with a relative pronoun?',
          ['B1', 'A2', 'B2'], 0,
          'Đại từ quan hệ thuộc tầng B1: nó biến hai câu ngắn thành một câu có cấu trúc.',
          'Relative pronouns belong to B1: they turn two short sentences into one structured sentence.'),
        CHOICE('Lỗi nào người Việt hay gặp nhất khi viết tiếng Pháp?', 'Which mistake do Vietnamese learners make most often in French?',
          ['Thiếu mạo từ', 'Thiếu động từ', 'Thiếu chủ ngữ'], 0,
          'Tiếng Việt không có mạo từ, nên người học dễ viết “Je vais marché” thay vì “Je vais au marché”.',
          'Vietnamese has no articles, so learners easily write “Je vais marché” instead of “Je vais au marché”.'),
        TRANSLATE('Tôi muốn viết một bài rõ ràng và trang trọng.', 'I want to write a clear and formal text.',
          ['Je veux écrire un texte clair et formel.', 'Je souhaite écrire un texte clair et formel.'],
          '“souhaiter” trang trọng hơn “vouloir”, phù hợp văn viết B2.',
          '“souhaiter” is more formal than “vouloir”, which suits B2 writing.')
      ]
    },

    /* -----------------------------------------------------
       2. Nouns and articles
       ----------------------------------------------------- */
    {
      id: 'hb-nouns', num: 2, part: 'group', minutes: 9,
      title: 'Noms et articles',
      subtitle: { vi: 'Danh từ và mạo từ', en: 'Nouns and articles' },
      summary: {
        vi: 'Giống của danh từ quyết định mạo từ, tính từ và đại từ. Học danh từ luôn kèm mạo từ: “la ville”, không phải “ville”.',
        en: 'A noun’s gender decides its article, its adjectives and its pronouns. Learn every noun with its article: “la ville”, never “ville”.'
      },
      blocks: [
        P('Tiếng Pháp không có mạo từ trung tính: mọi danh từ đều đực hoặc cái. Đuôi từ giúp đoán giống, nhưng luật chắc chắn duy nhất là học thuộc cùng mạo từ.',
          'French has no neutral article: every noun is masculine or feminine. Endings help you guess, but the only reliable rule is to memorise the article with the noun.'),
        H('Đoán giống theo đuôi từ', 'Guessing gender from the ending'),
        TABLE([C('Giống cái', 'Feminine'), C('Giống đực', 'Masculine')], [
          [C('-tion, -sion, -té, -ette, -ance, -ence', '-tion, -sion, -té, -ette, -ance, -ence'), C('-ment, -age, -eau, -isme, -oir, -er', '-ment, -age, -eau, -isme, -oir, -er')],
          [C('la nation, la beauté, la chance', 'la nation, la beauté, la chance'), C('le gouvernement, le voyage, le bonheur', 'le gouvernement, le voyage, le bonheur')]
        ], 'Ngoại lệ phải học riêng: le musée, la page, le problème, la plage.'),
        H('Ba loại mạo từ', 'The three articles'),
        TABLE([C('Loại', 'Type'), C('Dạng', 'Forms'), C('Dùng khi', 'When')], [
          [C('Xác định', 'Definite'), C('le, la, les', 'le, la, les'), C('Đã biết, duy nhất, khái quát', 'Known, unique, general')],
          [C('Không xác định', 'Indefinite'), C('un, une, des', 'un, une, des'), C('Chưa biết, không cụ thể', 'Unknown, not specific')],
          [C('Bộ phận', 'Partitive'), C('du, de la, de l’, des', 'du, de la, de l’, des'), C('Một phần, không đếm được', 'A part of something, uncountable')]
        ]),
        H('Rút gọn và phủ định', 'Contraction and negation'),
        FORMULA('à + le = au · à + les = aux · de + le = du · de + les = des', 'à + le = au · à + les = aux · de + le = du · de + les = des'),
        P('Sau phủ định, “un/une/du/de la/des” thường đổi thành “de”: Je bois du café → Je ne bois pas de café. Nhưng “être” giữ nguyên: Ce n’est pas un problème.',
          'After a negation, “un/une/du/de la/des” usually becomes “de”: Je bois du café → Je ne bois pas de café. But “être” keeps the article: Ce n’est pas un problème.'),
        CALLOUT('tip', 'Không dùng mạo từ: nghề nghiệp sau “être” (Elle est médecin), ngôn ngữ sau “parler” (Je parle français), tháng và ngày.',
          'No article: a profession after “être” (Elle est médecin), a language after “parler” (Je parle français), months and days.'),
        EXAMPLES([
          EX('Je vais au marché tous les samedis.', 'Tôi đi chợ mỗi thứ Bảy.', 'I go to the market every Saturday.'),
          EX('Elle n’a pas de voiture.', 'Cô ấy không có xe hơi.', 'She has no car.'),
          EX('Nous parlons français au bureau.', 'Chúng tôi nói tiếng Pháp ở văn phòng.', 'We speak French at the office.')
        ])
      ],
      exercises: [
        FILL('Je vais {{1}} marché. (à + le)', ['au'],
          'à + le rút gọn thành “au”.',
          'à + le contracts to “au”.'),
        FILL('Après le travail, je bois {{1}} eau. (mạo từ bộ phận)', [['de l\'', "de l’"]],
          'Nước không đếm được và bắt đầu bằng nguyên âm: de l’eau.',
          'Water is uncountable and starts with a vowel: de l’eau.'),
        CHOICE('Danh từ nào chắc chắn giống cái?', 'Which noun is certainly feminine?',
          ['la situation', 'le village', 'le musée'], 0,
          'Đuôi -tion luôn giống cái; -age và -ée có ngoại lệ, -tion thì không.',
          'The -tion ending is always feminine; -age has exceptions, -tion does not.'),
        FILL('Elle est {{1}}. (profession: médecin)', ['médecin'],
          'Sau “être”, nghề nghiệp không có mạo từ.',
          'After “être”, a profession takes no article.')
      ]
    },

    /* -----------------------------------------------------
       3. Adjectives, possessives, demonstratives
       ----------------------------------------------------- */
    {
      id: 'hb-adjectives', num: 3, part: 'group', minutes: 8,
      title: 'Adjectifs et déterminants',
      subtitle: { vi: 'Tính từ, sở hữu và chỉ định', en: 'Adjectives, possessives and demonstratives' },
      summary: {
        vi: 'Tính từ phải hợp giống và số với danh từ; vị trí trước hay sau danh từ đôi khi đổi nghĩa.',
        en: 'Adjectives must agree in gender and number; their place before or after the noun can change the meaning.'
      },
      blocks: [
        P('Tính từ hợp với danh từ nó bổ nghĩa, không hợp với chủ ngữ. Đây là điểm khác tiếng Anh và tiếng Việt.',
          'An adjective agrees with the noun it describes, not with the subject. This is where French differs from both English and Vietnamese.'),
        TABLE([C('Giống đực', 'Masculine'), C('Giống cái', 'Feminine'), C('Số nhiều', 'Plural')], [
          [C('grand', 'grand'), C('grande', 'grande'), C('grands / grandes', 'grands / grandes')],
          [C('beau, nouveau, vieux', 'beau, nouveau, vieux'), C('belle, nouvelle, vieille', 'belle, nouvelle, vieille'), C('beaux, nouveaux, vieux', 'beaux, nouveaux, vieux')],
          [C('heureux', 'heureux'), C('heureuse', 'heureuse'), C('heureux / heureuses', 'heureux / heureuses')]
        ]),
        H('Vị trí đổi nghĩa', 'Position changes meaning'),
        TABLE([C('Trước danh từ', 'Before the noun'), C('Sau danh từ', 'After the noun')], [
          [C('un grand homme', 'un grand homme'), C('un homme grand', 'un homme grand')],
          [C('một người đàn ông vĩ đại', 'a great man'), C('một người đàn ông cao', 'a tall man')],
          [C('mon ancienne maison', 'mon ancienne maison'), C('une maison ancienne', 'une maison ancienne')],
          [C('nhà cũ của tôi (trước đây)', 'my former house'), C('một ngôi nhà cổ', 'an old house')]
        ]),
        H('Sở hữu và chỉ định', 'Possessives and demonstratives'),
        TABLE([C('Người', 'Person'), C('Sở hữu', 'Possessive'), C('Chỉ định', 'Demonstrative')], [
          [C('je / tu', 'je / tu'), C('mon, ma, mes / ton, ta, tes', 'mon, ma, mes / ton, ta, tes'), C('ce, cet, cette, ces', 'ce, cet, cette, ces')],
          [C('il / elle', 'il / elle'), C('son, sa, ses', 'son, sa, ses'), C('ce livre-ci / ce livre-là', 'ce livre-ci / ce livre-là')],
          [C('nous / vous / ils', 'nous / vous / ils'), C('notre, nos / votre, vos / leur, leurs', 'notre, nos / votre, vos / leur, leurs'), C('cet homme, cette idée, ces livres', 'cet homme, cette idée, ces livres')]
        ]),
        CALLOUT('tip', 'Trước danh từ giống cái bắt đầu bằng nguyên âm, “ma/ta/sa” đổi thành “mon/ton/son”: mon amie, ton idée.',
          'Before a feminine noun starting with a vowel, “ma/ta/sa” become “mon/ton/son”: mon amie, ton idée.'),
        EXAMPLES([
          EX('C’est une belle journée.', 'Đó là một ngày đẹp.', 'It is a beautiful day.'),
          EX('Mon ancien professeur habite ici.', 'Giáo viên cũ của tôi sống ở đây.', 'My former teacher lives here.')
        ])
      ],
      exercises: [
        FILL('C’est une {{1}} maison. (beau)', ['belle'],
          '“beau” trước danh từ giống cái thành “belle”.',
          '“beau” becomes “belle” before a feminine noun.'),
        CHOICE('“un homme grand” nghĩa là gì?', 'What does “un homme grand” mean?',
          ['một người đàn ông cao', 'một người đàn ông vĩ đại', 'một người đàn ông già'], 0,
          'Tính từ đứng sau mang nghĩa thể chất: cao. Đứng trước (un grand homme) là “vĩ đại”.',
          'After the noun it is physical: tall. Before the noun (un grand homme) it means “great”.'),
        FILL('{{1}} homme est mon voisin. (ce + nguyên âm)', ['Cet'],
          'Trước danh từ đực bắt đầu bằng nguyên âm hoặc h câm, dùng “cet”。',
          'Before a masculine noun starting with a vowel or silent h, use “cet”.'),
        CHOICE('Chọn câu đúng.', 'Choose the correct sentence.',
          ['mes amies', 'mes amis', 'mes amie'], 0,
          '“amies” là số nhiều giống cái: mes amies. “mes amis” là giống đực hoặc hỗn hợp.',
          '“amies” is feminine plural: mes amies. “mes amis” is masculine or mixed.')
      ]
    },

    /* -----------------------------------------------------
       4. Negation and questions
       ----------------------------------------------------- */
    {
      id: 'hb-negation', num: 4, part: 'group', minutes: 8,
      title: 'Négation et interrogation',
      subtitle: { vi: 'Phủ định và câu hỏi', en: 'Negation and questions' },
      summary: {
        vi: '“ne … pas” là dạng cơ bản; các từ phủ định khác thay “pas”. Câu hỏi có ba cách, từ thân mật đến trang trọng.',
        en: '“ne … pas” is the basic form; other negative words replace “pas”. Questions have three registers, from casual to formal.'
      },
      blocks: [
        TABLE([C('Phủ định', 'Negative'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('ne … pas', 'ne … pas'), C('không', 'not'), C('Je ne fume pas.', 'Je ne fume pas.')],
          [C('ne … jamais', 'ne … jamais'), C('không bao giờ', 'never'), C('Il ne vient jamais.', 'Il ne vient jamais.')],
          [C('ne … rien', 'ne … rien'), C('không gì cả', 'nothing'), C('Elle ne dit rien.', 'Elle ne dit rien.')],
          [C('ne … personne', 'ne … personne'), C('không ai', 'nobody'), C('Je ne vois personne.', 'Je ne vois personne.')],
          [C('ne … plus', 'ne … plus'), C('không còn', 'no longer'), C('Nous ne travaillons plus ici.', 'Nous ne travaillons plus ici.')]
        ]),
        P('Trong văn nói, “ne” thường bị bỏ: Je fume pas. Trong bài viết DELF, luôn viết đủ “ne”. Sau “savoir, pouvoir, oser, cesser”, có thể chỉ dùng “ne”: Je ne peux venir.',
          'In speech, “ne” is often dropped: Je fume pas. In a DELF essay, always write “ne”. After “savoir, pouvoir, oser, cesser”, “ne” alone is possible: Je ne peux venir.'),
        H('Ba cách đặt câu hỏi', 'Three ways to ask'),
        TABLE([C('Cách', 'Form'), C('Ví dụ', 'Example'), C('Sắc thái', 'Register')], [
          [C('Ngữ điệu', 'Intonation'), C('Tu viens ?', 'Tu viens ?'), C('thân mật', 'casual')],
          [C('Est-ce que', 'Est-ce que'), C('Est-ce que tu viens ?', 'Est-ce que tu viens ?'), C('trung tính', 'neutral')],
          [C('Đảo ngữ', 'Inversion'), C('Viens-tu ?', 'Viens-tu ?'), C('trang trọng', 'formal')]
        ]),
        P('Từ hỏi: qui (ai), que / qu’est-ce que (cái gì), où (ở đâu), quand (khi nào), comment (thế nào), pourquoi (vì sao), combien (bao nhiêu), quel/quelle (nào).',
          'Question words: qui (who), que / qu’est-ce que (what), où (where), quand (when), comment (how), pourquoi (why), combien (how much/many), quel/quelle (which).'),
        CALLOUT('tip', 'Sau “parce que” không bao giờ dùng “ne … pas” hai lần trong cùng một mệnh đề: Je viens parce que je ne travaille pas.',
          'Never use “ne … pas” twice in the same clause after “parce que”: Je viens parce que je ne travaille pas.'),
        EXAMPLES([
          EX('Pourquoi est-ce que tu ne viens pas ?', 'Vì sao bạn không đến?', 'Why aren’t you coming?'),
          EX('Personne ne le sait.', 'Không ai biết điều đó.', 'Nobody knows it.')
        ])
      ],
      exercises: [
        FILL('Je ne vois {{1}}. (không ai)', ['personne'],
          '“ne … personne” = không ai. “personne” thay cho “pas”.',
          '“ne … personne” means nobody; “personne” replaces “pas”.'),
        CHOICE('Cách hỏi nào trang trọng nhất?', 'Which question is the most formal?',
          ['Viens-tu ?', 'Tu viens ?', 'Est-ce que tu viens ?'], 0,
          'Đảo ngữ là dạng trang trọng, phù hợp bài viết và thư từ.',
          'Inversion is the formal form, suited to writing and letters.'),
        FILL('Il ne travaille {{1}} ici. (không còn)', ['plus'],
          '“ne … plus” = không còn.',
          '“ne … plus” means no longer.'),
        TRANSLATE('Tôi không bao giờ uống cà phê vào buổi tối.', 'I never drink coffee in the evening.',
          ['Je ne bois jamais de café le soir.', 'Le soir, je ne bois jamais de café.'],
          'Sau phủ định, “du café” thành “de café”.',
          'After a negation, “du café” becomes “de café”.')
      ]
    },

    /* -----------------------------------------------------
       5. Object pronouns
       ----------------------------------------------------- */
    {
      id: 'hb-pronouns', num: 5, part: 'pron', minutes: 10,
      title: 'Pronoms compléments',
      subtitle: { vi: 'Đại từ COD, COI, en, y', en: 'Object pronouns: COD, COI, en, y' },
      summary: {
        vi: 'Đại từ thay cho danh từ đã nhắc để câu không lặp. Vị trí của chúng đứng trước động từ, và thứ tự khi có nhiều đại từ là cố định.',
        en: 'Pronouns replace a noun you already mentioned. They stand before the verb, and when several appear their order is fixed.'
      },
      blocks: [
        TABLE([C('Loại', 'Type'), C('Dạng', 'Forms'), C('Thay cho', 'Replaces')], [
          [C('COD', 'COD'), C('le, la, les', 'le, la, les'), C('danh từ không giới từ', 'a noun with no preposition')],
          [C('COI', 'COI'), C('lui, leur', 'lui, leur'), C('danh từ sau “à” (người)', 'a noun after “à” (people)')],
          [C('en', 'en'), C('en', 'en'), C('danh từ sau “de”, số lượng', 'a noun after “de”, a quantity')],
          [C('y', 'y'), C('y', 'y'), C('nơi chốn, danh từ sau “à” (vật)', 'a place, a thing after “à”')]
        ]),
        FORMULA('me · te · nous · vous → le · la · les → lui · leur → y → en',
          'me · te · nous · vous → le · la · les → lui · leur → y → en'),
        P('Đại từ đứng trước động từ chia: Je le connais. Với passé composé, phân từ hợp với COD đứng trước: Je les ai vus.',
          'The pronoun stands before the conjugated verb: Je le connais. With the passé composé the participle agrees with a preceding direct object: Je les ai vus.'),
        P('Với động từ nguyên mẫu, đại từ đứng trước nguyên mẫu: Je vais le faire. Trong câu phủ định, “ne” đứng trước đại từ: Je ne le fais pas.',
          'With an infinitive the pronoun goes before the infinitive: Je vais le faire. In a negative sentence “ne” comes before the pronoun: Je ne le fais pas.'),
        CALLOUT('tip', 'Động từ đi với “à” + người dùng lui/leur: téléphoner à, parler à, répondre à. Động từ đi với “à” + vật dùng y: penser à, s’intéresser à.',
          'Verbs with “à” + a person take lui/leur: téléphoner à, parler à, répondre à. Verbs with “à” + a thing take y: penser à, s’intéresser à.'),
        EXAMPLES([
          EX('Tu as parlé à Marie ? — Oui, je lui ai parlé.', 'Bạn đã nói với Marie chưa? — Rồi, tôi đã nói với cô ấy.', 'Did you speak to Marie? — Yes, I spoke to her.'),
          EX('Tu penses à ce projet ? — Oui, j’y pense.', 'Bạn có nghĩ về dự án đó không? — Có, tôi nghĩ về nó.', 'Are you thinking about that project? — Yes, I’m thinking about it.'),
          EX('Tu veux du gâteau ? — Oui, j’en veux.', 'Bạn có muốn bánh không? — Có, tôi muốn một ít.', 'Do you want cake? — Yes, I want some.')
        ])
      ],
      exercises: [
        FILL('Tu connais Paul ? — Oui, je {{1}} connais. (COD)', ['le'],
          'Paul là giống đực số ít, COD: “le”.',
          'Paul is masculine singular, a direct object: “le”.'),
        FILL('Elle pense à son examen ? — Oui, elle {{1}} pense.', ['y'],
          '“penser à” + vật → y.',
          '“penser à” + a thing → y.'),
        FILL('Il achète des fleurs ? — Oui, il {{1}} achète.', ['en'],
          '“des fleurs” là số lượng sau “de”: dùng “en”.',
          '“des fleurs” is a quantity after “de”: use “en”.'),
        CHOICE('Câu nào đúng?', 'Which sentence is correct?',
          ['Je ne le vois pas.', 'Je le ne vois pas.', 'Je ne vois le pas.'], 0,
          '“ne” đứng trước đại từ, “pas” sau động từ chia.',
          '“ne” comes before the pronoun, “pas” after the conjugated verb.')
      ]
    },

    /* -----------------------------------------------------
       6. Comparison and adverbs
       ----------------------------------------------------- */
    {
      id: 'hb-comparison', num: 6, part: 'link', minutes: 7,
      title: 'Comparaison et adverbes',
      subtitle: { vi: 'So sánh và trạng từ', en: 'Comparison and adverbs' },
      summary: {
        vi: 'So sánh hơn, kém, bằng; so sánh nhất; và ba dạng bất quy tắc phải nhớ: meilleur, mieux, pire.',
        en: 'More, less and equal comparison; the superlative; and three irregular forms to memorise: meilleur, mieux, pire.'
      },
      blocks: [
        TABLE([C('Loại', 'Type'), C('Cấu trúc', 'Structure'), C('Ví dụ', 'Example')], [
          [C('Hơn', 'More'), C('plus … que', 'plus … que'), C('Elle est plus grande que moi.', 'Elle est plus grande que moi.')],
          [C('Kém', 'Less'), C('moins … que', 'moins … que'), C('Il travaille moins vite que toi.', 'Il travaille moins vite que toi.')],
          [C('Bằng', 'Equal'), C('aussi … que', 'aussi … que'), C('Nous sommes aussi fatigués que vous.', 'Nous sommes aussi fatigués que vous.')],
          [C('Nhất', 'Superlative'), C('le plus / le moins', 'le plus / le moins'), C('C’est la ville la plus chère.', 'C’est la ville la plus chère.')]
        ]),
        P('Bất quy tắc: bon → meilleur (tính từ), bien → mieux (trạng từ), mauvais → pire. Đừng viết “plus bon” hay “plus bien”.',
          'Irregulars: bon → meilleur (adjective), bien → mieux (adverb), mauvais → pire. Never write “plus bon” or “plus bien”.'),
        H('Trạng từ', 'Adverbs'),
        P('Phần lớn trạng từ tạo từ tính từ giống cái + -ment: lent → lente → lentement. Tính từ đuôi -ant thành -amment (courant → couramment), đuôi -ent thành -emment (récent → récemment).',
          'Most adverbs are the feminine adjective + -ment: lent → lente → lentement. Adjectives in -ant become -amment (courant → couramment), those in -ent become -emment (récent → récemment).'),
        P('Diễn đạt sự tăng giảm: de plus en plus (ngày càng), de moins en moins (ngày càng ít), autant que (bằng), davantage (hơn nữa, trang trọng).',
          'Expressing increase and decrease: de plus en plus (more and more), de moins en moins (less and less), autant que (as much as), davantage (more, formal).'),
        CALLOUT('english', '“meilleur” bổ nghĩa danh từ (un meilleur salaire); “mieux” bổ nghĩa động từ (Il travaille mieux).',
          '“meilleur” describes a noun (un meilleur salaire); “mieux” describes a verb (Il travaille mieux).'),
        EXAMPLES([
          EX('Les loyers sont de plus en plus élevés.', 'Giá thuê ngày càng cao.', 'Rents are getting higher and higher.'),
          EX('Elle chante mieux que son frère.', 'Cô ấy hát hay hơn anh trai.', 'She sings better than her brother.')
        ])
      ],
      exercises: [
        FILL('Elle est {{1}} que sa sœur. (grand)', ['plus grande'],
          'So sánh hơn + tính từ hợp giống cái: plus grande que.',
          'Comparison + agreeing adjective: plus grande que.'),
        CHOICE('Chọn câu đúng.', 'Choose the correct sentence.',
          ['Il travaille mieux que moi.', 'Il travaille meilleur que moi.', 'Il travaille plus bien que moi.'], 0,
          '“mieux” là trạng từ so sánh của “bien”.',
          '“mieux” is the comparative adverb of “bien”.'),
        FILL('C’est la ville la {{1}} chère du pays. (so sánh nhất)', ['plus'],
          'So sánh nhất: le/la/les plus + tính từ.',
          'Superlative: le/la/les plus + adjective.'),
        TRANSLATE('Giá ngày càng tăng.', 'Prices are rising more and more.',
          ['Les prix augmentent de plus en plus.'],
          '“de plus en plus” = ngày càng.',
          '“de plus en plus” means more and more.')
      ]
    },

    /* -----------------------------------------------------
       7. Prepositions
       ----------------------------------------------------- */
    {
      id: 'hb-prepositions', num: 7, part: 'link', minutes: 9,
      title: 'Prépositions',
      subtitle: { vi: 'Giới từ: nơi chốn, thời gian, động từ', en: 'Prepositions: place, time, verbs' },
      summary: {
        vi: 'Giới từ là nơi người học mất điểm nhiều nhất vì tiếng Việt không có phạm trù này. Học giới từ theo cụm, không học riêng lẻ.',
        en: 'Prepositions cost learners the most marks because Vietnamese has no such category. Learn them inside phrases, never alone.'
      },
      blocks: [
        H('Nơi chốn và quốc gia', 'Place and countries'),
        TABLE([C('Loại', 'Type'), C('Giới từ', 'Preposition'), C('Ví dụ', 'Example')], [
          [C('Thành phố', 'City'), C('à', 'à'), C('à Paris, à Hanoï', 'à Paris, à Hanoï')],
          [C('Quốc gia giống cái', 'Feminine country'), C('en', 'en'), C('en France, en Italie', 'en France, en Italie')],
          [C('Quốc gia giống đực', 'Masculine country'), C('au', 'au'), C('au Canada, au Japon', 'au Canada, au Japon')],
          [C('Số nhiều', 'Plural'), C('aux', 'aux'), C('aux États-Unis', 'aux États-Unis')]
        ]),
        H('Thời gian', 'Time'),
        TABLE([C('Giới từ', 'Preposition'), C('Dùng cho', 'Used for'), C('Ví dụ', 'Example')], [
          [C('à', 'à'), C('giờ, thời điểm', 'clock time, a point'), C('à 8 heures', 'à 8 heures')],
          [C('en', 'en'), C('tháng, năm, mùa, thời gian làm xong', 'months, years, seasons, duration to complete'), C('en 2026, en hiver, en deux heures', 'en 2026, en hiver, en deux heures')],
          [C('depuis', 'depuis'), C('từ một mốc đến nay', 'since / for, still true'), C('depuis trois ans', 'depuis trois ans')],
          [C('pendant', 'pendant'), C('suốt một khoảng đã xong', 'for a finished period'), C('pendant deux ans', 'pendant deux ans')],
          [C('dans', 'dans'), C('sau một khoảng (tương lai)', 'in, future'), C('dans deux jours', 'dans deux jours')],
          [C('il y a', 'il y a'), C('cách đây', 'ago'), C('il y a deux jours', 'il y a deux jours')]
        ]),
        H('Động từ + giới từ', 'Verb + preposition'),
        LIST([
          'penser à, s’intéresser à, réussir à, arriver à',
          'dépendre de, s’occuper de, avoir besoin de, parler de',
          'compter sur, répondre à, téléphoner à, remercier de'
        ], [
          'penser à, s’intéresser à, réussir à, arriver à',
          'dépendre de, s’occuper de, avoir besoin de, parler de',
          'compter sur, répondre à, téléphoner à, remercier de'
        ]),
        P('Một số động từ đổi nghĩa theo giới từ: penser à (nghĩ về) / penser de (nghĩ rằng). Với hai động từ: commencer à, finir de, décider de, éviter de, essayer de.',
          'Some verbs change meaning with the preposition: penser à (think about) / penser de (think of). With two verbs: commencer à, finir de, décider de, éviter de, essayer de.'),
        CALLOUT('tip', 'Không dịch giới từ từ tiếng Việt. Học cả cụm: “dépendre de”, “réussir à”, “avoir besoin de” là một từ duy nhất trong đầu bạn.',
          'Never translate a preposition from Vietnamese. Learn the whole chunk: “dépendre de”, “réussir à”, “avoir besoin de” is one word in your head.'),
        EXAMPLES([
          EX('J’habite au Vietnam depuis cinq ans.', 'Tôi sống ở Việt Nam được năm năm.', 'I have lived in Vietnam for five years.'),
          EX('Elle a réussi à finir son rapport en deux jours.', 'Cô ấy đã xoay xở hoàn thành báo cáo trong hai ngày.', 'She managed to finish her report in two days.')
        ])
      ],
      exercises: [
        FILL('Je vais {{1}} Canada l’année prochaine. (quốc gia giống đực)', ['au'],
          'Canada giống đực: au Canada.',
          'Canada is masculine: au Canada.'),
        FILL('Elle travaille ici {{1}} 2020. (từ một mốc đến nay)', ['depuis'],
          '“depuis” + mốc thời gian, hành động còn tiếp diễn.',
          '“depuis” + a starting point, the action is still true.'),
        FILL('Il a réussi {{1}} convaincre le directeur. (động từ + giới từ)', ['à'],
          '“réussir à” + nguyên mẫu.',
          '“réussir à” + infinitive.'),
        CHOICE('Câu nào đúng?', 'Which sentence is correct?',
          ['J’ai besoin de ton aide.', 'J’ai besoin ton aide.', 'J’ai besoin à ton aide.'], 0,
          '“avoir besoin de” luôn đi với “de”.',
          '“avoir besoin de” always takes “de”.')
      ]
    },

    /* -----------------------------------------------------
       8. Relative pronouns
       ----------------------------------------------------- */
    {
      id: 'hb-relatives', num: 8, part: 'link', minutes: 9,
      title: 'Pronoms relatifs',
      subtitle: { vi: 'Đại từ quan hệ', en: 'Relative pronouns' },
      summary: {
        vi: 'Đại từ quan hệ nối hai câu thành một và tránh lặp danh từ. Chọn đại từ theo chức năng trong mệnh đề phụ, không theo nghĩa tiếng Việt.',
        en: 'Relative pronouns join two sentences and avoid repeating a noun. Choose one by its role in the subordinate clause, not by the Vietnamese meaning.'
      },
      blocks: [
        TABLE([C('Đại từ', 'Pronoun'), C('Thay cho', 'Replaces'), C('Ví dụ', 'Example')], [
          [C('qui', 'qui'), C('chủ ngữ', 'subject'), C('Le livre qui est sur la table.', 'Le livre qui est sur la table.')],
          [C('que', 'que'), C('tân ngữ trực tiếp', 'direct object'), C('Le livre que je lis.', 'Le livre que je lis.')],
          [C('où', 'où'), C('nơi chốn, thời gian', 'place, time'), C('La ville où j’habite.', 'La ville où j’habite.')],
          [C('dont', 'dont'), C('sau “de”', 'after “de”'), C('Le projet dont je parle.', 'Le projet dont je parle.')],
          [C('lequel', 'lequel'), C('sau giới từ', 'after a preposition'), C('La ville dans laquelle je vis.', 'La ville dans laquelle je vis.')]
        ]),
        P('“dont” thay cho “de + danh từ”: Je parle de ce projet → le projet dont je parle. Cũng dùng với số lượng: le livre dont j’ai besoin.',
          '“dont” replaces “de + noun”: Je parle de ce projet → le projet dont je parle. It also covers quantities: le livre dont j’ai besoin.'),
        P('Sau giới từ dùng “lequel” và biến thể: auquel, duquel, dans lequel, avec laquelle, pour lesquels. Với người vẫn dùng “qui”: la personne avec qui je travaille.',
          'After a preposition use “lequel” and its forms: auquel, duquel, dans lequel, avec laquelle, pour lesquels. For people “qui” remains: la personne avec qui je travaille.'),
        H('Ce qui, ce que, ce dont', 'Ce qui, ce que, ce dont'),
        LIST([
          'Ce qui me plaît, c’est la musique. (chủ ngữ)',
          'Ce que j’aime, c’est la musique. (tân ngữ)',
          'Ce dont j’ai besoin, c’est de temps. (sau “de”)'
        ], [
          'Ce qui me plaît, c’est la musique. (subject)',
          'Ce que j’aime, c’est la musique. (object)',
          'Ce dont j’ai besoin, c’est de temps. (after “de”)'
        ]),
        CALLOUT('tip', 'Câu “ce que … c’est” rất được điểm ở B2 vì nó nhấn mạnh thay vì nói phẳng: Ce que je veux dire, c’est que la situation change.',
          'The “ce que … c’est” structure earns marks at B2 because it emphasises instead of stating flatly: Ce que je veux dire, c’est que la situation change.'),
        EXAMPLES([
          EX('La ville dont je viens est très calme.', 'Thành phố tôi đến từ rất yên tĩnh.', 'The town I come from is very quiet.'),
          EX('L’outil avec lequel je travaille est ancien.', 'Công cụ tôi làm việc cùng rất cũ.', 'The tool I work with is old.')
        ])
      ],
      exercises: [
        FILL('Le livre {{1}} je lis est passionnant. (tân ngữ trực tiếp)', ['que'],
          '“lire” + tân ngữ trực tiếp không giới từ: que.',
          '“lire” takes a direct object with no preposition: que.'),
        FILL('La ville {{1}} je viens est petite. (venir de)', ['dont'],
          '“venir de” → dont.',
          '“venir de” → dont.'),
        CHOICE('Đại từ nào đúng sau giới từ với vật?', 'Which pronoun is correct after a preposition with a thing?',
          ['lequel', 'que', 'dont'], 0,
          'Sau giới từ + vật: lequel/laquelle/lesquels/lesquelles.',
          'After a preposition + a thing: lequel/laquelle/lesquels/lesquelles.'),
        TRANSLATE('Điều tôi cần là thời gian.', 'What I need is time.',
          ['Ce dont j’ai besoin, c’est du temps.', 'Ce dont j’ai besoin, c’est le temps.'],
          '“avoir besoin de” → “ce dont j’ai besoin”.',
          '“avoir besoin de” → “ce dont j’ai besoin”.')
      ]
    },

    /* -----------------------------------------------------
       9. Connectives and logic
       ----------------------------------------------------- */
    {
      id: 'hb-connectors', num: 9, part: 'write', minutes: 10,
      title: 'Connecteurs logiques',
      subtitle: { vi: 'Liên từ và quan hệ logic', en: 'Connectives and logical links' },
      summary: {
        vi: 'Liên từ là chìa khóa bài viết DELF B2: chúng cho giám khảo thấy bạn biết lập luận, không chỉ biết đặt câu.',
        en: 'Connectives are the key to the DELF B2 essay: they show the examiner you can argue, not only build sentences.'
      },
      blocks: [
        TABLE([C('Quan hệ', 'Relation'), C('Liên từ', 'Connectives'), C('Ví dụ', 'Example')], [
          [C('Thêm ý', 'Addition'), C('de plus, en outre, par ailleurs', 'de plus, en outre, par ailleurs'), C('De plus, ce projet crée des emplois.', 'De plus, ce projet crée des emplois.')],
          [C('Nguyên nhân', 'Cause'), C('car, parce que, puisque, en raison de', 'car, parce que, puisque, en raison de'), C('Il reste car il pleut.', 'Il reste car il pleut.')],
          [C('Hệ quả', 'Consequence'), C('donc, par conséquent, c’est pourquoi', 'donc, par conséquent, c’est pourquoi'), C('Il pleut, donc je reste.', 'Il pleut, donc je reste.')],
          [C('Đối lập', 'Opposition'), C('cependant, en revanche, bien que + subj.', 'cependant, en revanche, bien que + subj.'), C('Bien qu’il pleuve, je sors.', 'Bien qu’il pleuve, je sors.')],
          [C('Ví dụ', 'Example'), C('par exemple, notamment', 'par exemple, notamment'), C('Certains métiers, notamment la santé.', 'Certains métiers, notamment la santé.')],
          [C('Kết luận', 'Conclusion'), C('en conclusion, en somme, finalement', 'en conclusion, en somme, finalement'), C('En conclusion, je suis favorable.', 'En conclusion, je suis favorable.')]
        ]),
        P('Phân biệt “car” và “parce que”: “car” trang trọng, chỉ dùng trong văn viết. “puisque” dùng khi lý do đã được người đọc biết.',
          'Distinguish “car” and “parce que”: “car” is formal and belongs in writing. “puisque” is used when the reader already knows the reason.'),
        P('“bien que” và “quoique” luôn đi với subjonctif; “même si” đi với chỉ định. Đây là điểm ngữ pháp giám khảo B2 chú ý.',
          '“bien que” and “quoique” always take the subjunctive; “même si” takes the indicative. This is a B2 grammar point examiners notice.'),
        CALLOUT('tip', 'Đừng mở mọi câu bằng “et” hay “mais”. Một bài B2 dùng 6–8 liên từ khác nhau, mỗi đoạn một quan hệ logic rõ ràng.',
          'Do not open every sentence with “et” or “mais”. A B2 essay uses 6–8 different connectives, one clear logical relation per paragraph.'),
        EXAMPLES([
          EX('Non seulement ce dispositif est utile, mais il est aussi peu coûteux.', 'Thiết bị này không những hữu ích mà còn rẻ.', 'This scheme is not only useful but also cheap.'),
          EX('En revanche, les coûts augmentent rapidement.', 'Ngược lại, chi phí đang tăng nhanh.', 'On the other hand, costs are rising fast.')
        ])
      ],
      exercises: [
        CHOICE('Liên từ nào bắt buộc dùng subjonctif?', 'Which connective requires the subjunctive?',
          ['bien que', 'même si', 'parce que'], 0,
          '“bien que” + subjonctif; “même si” + chỉ định.',
          '“bien que” + subjunctive; “même si” + indicative.'),
        FILL('Il pleut, {{1}} je reste à la maison. (hệ quả)', ['donc', 'par conséquent'],
          'Quan hệ hệ quả: donc / par conséquent / c’est pourquoi.',
          'Consequence: donc / par conséquent / c’est pourquoi.'),
        FILL('{{1}} il soit fatigué, il continue. (đối lập + subjonctif)', ['Bien qu\'', "Bien qu’"],
          '“bien que” + subjonctif: bien qu’il soit.',
          '“bien que” + subjunctive: bien qu’il soit.'),
        TRANSLATE('Hơn nữa, dự án này tạo ra việc làm.', 'Moreover, this project creates jobs.',
          ['De plus, ce projet crée des emplois.', 'En outre, ce projet crée des emplois.'],
          '“de plus / en outre / par ailleurs” đều là thêm ý, trong đó “en outre” trang trọng nhất.',
          '“de plus / en outre / par ailleurs” all add an idea; “en outre” is the most formal.')
      ]
    },

    /* -----------------------------------------------------
       10. Nominalisation and emphasis
       ----------------------------------------------------- */
    {
      id: 'hb-nominalisation', num: 10, part: 'write', minutes: 10,
      title: 'Nominalisation et mise en relief',
      subtitle: { vi: 'Nominalisation và nhấn mạnh', en: 'Nominalisation and emphasis' },
      summary: {
        vi: 'Biến động từ thành danh từ làm câu ngắn, trang trọng và “đặc” hơn — đây là dấu hiệu rõ nhất của văn phong B2.',
        en: 'Turning a verb into a noun makes a sentence shorter, more formal and denser — the clearest marker of B2 style.'
      },
      blocks: [
        TABLE([C('Động từ', 'Verb'), C('Danh từ', 'Noun'), C('Ví dụ', 'Example')], [
          [C('augmenter', 'augmenter'), C('une augmentation', 'une augmentation'), C('une forte augmentation des prix', 'une forte augmentation des prix')],
          [C('se développer', 'se développer'), C('le développement', 'le développement'), C('le développement du numérique', 'le développement du numérique')],
          [C('mettre en place', 'mettre en place'), C('la mise en place', 'la mise en place'), C('la mise en place d’un système', 'la mise en place d’un système')],
          [C('réduire', 'réduire'), C('une réduction', 'une réduction'), C('la réduction des déchets', 'la réduction des déchets')]
        ]),
        P('So sánh: “Les prix augmentent rapidement.” (B1) → “On constate une augmentation rapide des prix.” (B2). Cùng một ý, nhưng câu thứ hai trang trọng và khách quan hơn.',
          'Compare: “Les prix augmentent rapidement.” (B1) → “On constate une augmentation rapide des prix.” (B2). Same idea, but the second is more formal and objective.'),
        H('Cấu trúc nhấn mạnh', 'Emphatic structures'),
        LIST([
          'C’est … qui / c’est … que: C’est ce projet qui me préoccupe.',
          'Ce qui … c’est / ce que … c’est: Ce qui compte, c’est la santé.',
          'Non seulement …, mais encore …: Non seulement il travaille, mais il étudie aussi.'
        ], [
          'C’est … qui / c’est … que: C’est ce projet qui me préoccupe.',
          'Ce qui … c’est / ce que … c’est: Ce qui compte, c’est la santé.',
          'Non seulement …, mais encore …: Non seulement il travaille, mais il étudie aussi.'
        ]),
        CALLOUT('tip', 'Đừng nominalise quá nhiều: một câu hai danh từ trừu tượng là đủ. Quá nhiều sẽ thành văn hành chính khó đọc và mất điểm tự nhiên.',
          'Do not over-nominalise: two abstract nouns per sentence is enough. Too many reads like bureaucracy and loses naturalness marks.'),
        EXAMPLES([
          EX('La mise en place de cette mesure a permis une réduction des coûts.', 'Việc áp dụng biện pháp này đã giúp giảm chi phí.', 'Introducing this measure allowed a reduction in costs.'),
          EX('Ce que je souhaite souligner, c’est l’urgence de la situation.', 'Điều tôi muốn nhấn mạnh là tính cấp bách của tình hình.', 'What I want to stress is how urgent the situation is.')
        ])
      ],
      exercises: [
        FILL('Les prix augmentent → on constate une {{1}} des prix. (danh từ)', ['augmentation'],
          '“augmenter” → “une augmentation”.',
          '“augmenter” → “une augmentation”.'),
        FILL('Ce {{1}} compte, c’est la santé. (nhấn mạnh chủ ngữ)', ['qui'],
          '“ce qui” làm chủ ngữ của mệnh đề quan hệ.',
          '“ce qui” is the subject of the relative clause.'),
        CHOICE('Câu nào là văn phong B2?', 'Which sentence is B2 style?',
          ['On observe une hausse du chômage.', 'Le chômage augmente beaucoup.', 'Le chômage va plus haut.'], 0,
          'Nominalisation + động từ trang trọng “observer” = văn phong B2.',
          'Nominalisation + the formal verb “observer” = B2 register.'),
        TRANSLATE('Điều quan trọng là chất lượng.', 'What matters is quality.',
          ['Ce qui compte, c’est la qualité.', 'L’important, c’est la qualité.'],
          'Cấu trúc nhấn mạnh “ce qui … c’est”.',
          'The emphatic structure “ce qui … c’est”.')
      ]
    },

    /* -----------------------------------------------------
       11. DELF B2 scoring grammar
       ----------------------------------------------------- */
    {
      id: 'hb-b2-writing', num: 11, part: 'write', minutes: 9,
      title: 'La grammaire qui rapporte',
      subtitle: { vi: 'Ngữ pháp “ăn điểm” trong bài viết DELF B2', en: 'The grammar that earns marks in DELF B2' },
      summary: {
        vi: 'Sáu cấu trúc giám khảo mong thấy ở B2, và danh sách lỗi người Việt hay mắc phải khi viết.',
        en: 'Six structures examiners expect at B2, and the mistakes Vietnamese learners most often make in writing.'
      },
      blocks: [
        H('Sáu cấu trúc nên có', 'Six structures to include'),
        LIST([
          'Subjonctif sau “bien que”, “il faut que”, “avant que”.',
          'Conditionnel để nêu giả thuyết và đề xuất lịch sự.',
          'Gérondif “en + -ant” để nói cách thức hoặc đồng thời.',
          'Câu bị động để giữ tính khách quan: “Cette mesure a été adoptée”.',
          'Đại từ quan hệ để tránh hai câu ngắn liên tiếp.',
          'Mise en relief “ce qui … c’est” cho câu chủ đề của đoạn.'
        ], [
          'Subjunctive after “bien que”, “il faut que”, “avant que”.',
          'Conditional for hypotheses and polite proposals.',
          'Gérondif “en + -ant” for manner or simultaneous action.',
          'Passive voice for objectivity: “Cette mesure a été adoptée”.',
          'Relative pronouns to avoid two short sentences in a row.',
          'Mise en relief “ce qui … c’est” for a paragraph’s topic sentence.'
        ]),
        H('Lỗi người Việt hay mắc', 'Mistakes Vietnamese learners make'),
        TABLE([C('Lỗi', 'Mistake'), C('Sai', 'Wrong'), C('Đúng', 'Right')], [
          [C('Thiếu mạo từ', 'Missing article'), C('Je vais marché', 'Je vais marché'), C('Je vais au marché', 'Je vais au marché')],
          [C('Giới từ sai', 'Wrong preposition'), C('dépendre à', 'dépendre à'), C('dépendre de', 'dépendre de')],
          [C('Không hợp phân từ', 'No participle agreement'), C('Elle est allé', 'Elle est allé'), C('Elle est allée', 'Elle est allée')],
          [C('Dịch “rất”', 'Translating “rất”'), C('Je très aime', 'Je très aime'), C('J’aime beaucoup', 'J’aime beaucoup')],
          [C('Lặp chủ ngữ', 'Repeating the subject'), C('Moi, je pense', 'Moi, je pense'), C('Je pense', 'Je pense')]
        ]),
        CALLOUT('tip', 'Trước khi nộp: đọc lại và kiểm tra bốn thứ theo thứ tự — hợp giống/số, thì của động từ, giới từ, và liên từ giữa các đoạn.',
          'Before submitting: re-read and check four things in order — agreement, verb tenses, prepositions, and the connective between paragraphs.'),
        EXAMPLES([
          EX('Bien qu’il soit difficile de généraliser, on peut observer une tendance claire.', 'Dù khó khái quát, ta có thể thấy một xu hướng rõ ràng.', 'Although it is hard to generalise, a clear trend can be observed.'),
          EX('En travaillant ensemble, nous obtiendrons de meilleurs résultats.', 'Làm việc cùng nhau, chúng ta sẽ đạt kết quả tốt hơn.', 'By working together, we will get better results.')
        ])
      ],
      exercises: [
        FILL('{{1}} il pleuve, nous sortons. (bien que + subjonctif)', ['Bien qu\'', "Bien qu’"],
          '“bien que” + subjonctif “pleuve”.',
          '“bien que” + the subjunctive “pleuve”.'),
        FILL('Elle est {{1}} à Paris. (aller, passé composé, hợp giống cái)', ['allée'],
          'Với “être”, phân từ hợp với chủ ngữ giống cái: allée.',
          'With “être”, the participle agrees with a feminine subject: allée.'),
        CHOICE('Câu nào đúng?', 'Which sentence is correct?',
          ['Je vais au marché.', 'Je vais marché.', 'Je vais le marché.'], 0,
          'Cần giới từ rút gọn “au” (à + le).',
          'It needs the contracted preposition “au” (à + le).'),
        FILL('{{1}} révisant chaque jour, vous progresserez. (gérondif)', ['En'],
          'Gérondif: “en + phân từ hiện tại” để nói cách thức.',
          'Gérondif: “en + present participle” to express manner.')
      ]
    },

    /* -----------------------------------------------------
       12. Review and mock test
       ----------------------------------------------------- */
    {
      id: 'hb-review', num: 12, part: 'write', minutes: 12,
      title: 'Révision et test blanc',
      subtitle: { vi: 'Ôn tập và thi thử', en: 'Review and mock test' },
      summary: {
        vi: 'Mười quy tắc quan trọng nhất trong một bảng, rồi năm câu thi thử có giải thích — dạng bài giống phần thi viết DELF B2.',
        en: 'The ten most important rules in one table, then five mock questions with explanations — the shape of the DELF B2 writing paper.'
      },
      blocks: [
        H('Mười quy tắc cốt lõi', 'The ten core rules'),
        TABLE([C('Chủ đề', 'Topic'), C('Quy tắc', 'Rule')], [
          [C('Mạo từ', 'Articles'), C('Luôn có mạo từ trước danh từ, trừ nghề nghiệp, ngôn ngữ, tháng, ngày.', 'Always use an article before a noun, except professions, languages, months, days.')],
          [C('Giống danh từ', 'Gender'), C('Học danh từ cùng mạo từ; đuôi -tion, -té luôn giống cái.', 'Learn nouns with their article; -tion and -té are always feminine.')],
          [C('Tính từ', 'Adjectives'), C('Hợp giống và số với danh từ, không hợp với chủ ngữ.', 'Agree with the noun, not with the subject.')],
          [C('Phủ định', 'Negation'), C('“ne” + động từ + “pas/jamais/rien/personne”; sau phủ định “du” thành “de”.', '“ne” + verb + “pas/jamais/rien/personne”; after a negation “du” becomes “de”.')],
          [C('Đại từ', 'Pronouns'), C('Đứng trước động từ chia; thứ tự me → le → lui → y → en.', 'Before the conjugated verb; order me → le → lui → y → en.')],
          [C('So sánh', 'Comparison'), C('plus/moins/aussi … que; bất quy tắc meilleur, mieux, pire.', 'plus/moins/aussi … que; irregular meilleur, mieux, pire.')],
          [C('Giới từ', 'Prepositions'), C('en + quốc gia giống cái, au + giống đực; depuis (còn tiếp), pendant (đã xong).', 'en + feminine country, au + masculine; depuis (still true), pendant (finished).')],
          [C('Quan hệ', 'Relatives'), C('qui = chủ ngữ, que = tân ngữ, dont = de, lequel sau giới từ.', 'qui = subject, que = object, dont = de, lequel after a preposition.')],
          [C('Liên từ', 'Connectives'), C('Mỗi đoạn một quan hệ logic; “bien que” + subjonctif.', 'One logical relation per paragraph; “bien que” + subjunctive.')],
          [C('Văn phong', 'Register'), C('Nominalise vừa phải; dùng “ce qui … c’est” cho câu chủ đề.', 'Nominalise in moderation; use “ce qui … c’est” for topic sentences.')]
        ]),
        CALLOUT('tip', 'Làm bài thi thử dưới đây mà không xem bảng trên. Câu nào sai thì quay lại đúng chương đó, không học lại cả cẩm nang.',
          'Do the mock test below without looking at the table. For each wrong answer, return to that chapter instead of re-reading the whole handbook.')
      ],
      exercises: [
        FILL('Elle a besoin {{1}} aide. (động từ + giới từ)', ['d\'', "d’"],
          '“avoir besoin de” → “de l’aide” rút gọn “d’aide”? Không: “de l’aide” là đúng khi có mạo từ xác định — ở đây chấp nhận “d’aide” trong cụm “besoin d’aide”.',
          '“avoir besoin de” → “besoin d’aide” is the common chunk; “de l’aide” also works when the help is defined.'),
        FILL('Le film {{1}} nous avons parlé était excellent. (parler de)', ['dont'],
          '“parler de” → dont.',
          '“parler de” → dont.'),
        CHOICE('Câu nào đúng?', 'Which sentence is correct?',
          ['Je lui ai téléphoné.', 'Je l’ai téléphoné.', 'Je ai téléphoné lui.'], 0,
          '“téléphoner à quelqu’un” → COI “lui”.',
          '“téléphoner à quelqu’un” → the indirect pronoun “lui”.'),
        FILL('Les prix sont de plus {{1}} élevés. (ngày càng)', ['en plus'],
          '“de plus en plus” = ngày càng.',
          '“de plus en plus” means more and more.'),
        TRANSLATE('Dù trời mưa, chúng tôi vẫn đi bộ.', 'Although it is raining, we are still walking.',
          ['Bien qu’il pleuve, nous marchons.', 'Même s’il pleut, nous marchons.'],
          '“bien que” + subjonctif; “même si” + chỉ định. Cả hai đều đúng, “bien que” trang trọng hơn.',
          '“bien que” + subjunctive; “même si” + indicative. Both are correct, “bien que” is more formal.')
      ]
    }
  ];

  GD.chapterCount = GD.chapters.length;
})(typeof window !== 'undefined' ? window : globalThis);
