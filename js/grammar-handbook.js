/* =========================================================
   VocabLab — grammar-handbook.js
   Grammaire progressive du français — Niveau intermédiaire,
   3e édition (CLE International). The teaching pages only:
   52 chapters condensed from the book's left-page lessons
   (exercises come from our own short checks, the book's
   exercise pages are a later pass). Replaces the former
   12-chapter A2–B2 handbook under the same course id so
   progress keys and the UI keep working.
   Explanations are bilingual; examples stay in French with
   VI/EN meanings. Same schema as grammar-data.js.
   ========================================================= */
(function (global) {
  'use strict';

  var GD = global.GrammarHandbook = {
    id: 'handbook',
    title: { vi: 'Ngữ pháp tiếng Pháp từng bước', en: 'Grammaire progressive du français' },
    subtitle: {
      vi: 'Grammaire progressive du français · 52 chương',
      en: 'Grammaire progressive du français · 52 chapters'
    },
    intro: {
      vi: 'Theo đúng tiến trình của cuốn sách: mỗi chương là một điểm ngữ pháp, giải thích từng bước với ví dụ, rồi kiểm tra nhanh. Học từ chương 1 đến chương 52.',
      en: 'Follows the book step by step: every chapter is one grammar point, explained step by step with examples, then a quick check. Study from chapter 1 to 52.'
    },
    parts: [
      { id: 'start', title: { vi: 'Những bước đầu', en: 'First steps' } },
      { id: 'world', title: { vi: 'Thế giới quanh bạn', en: 'The world around you' } },
      { id: 'degree', title: { vi: 'Mức độ, không gian và động từ', en: 'Degree, space and verbs' } },
      { id: 'sentence', title: { vi: 'Đại từ và cấu trúc câu', en: 'Pronouns and sentence structure' } },
      { id: 'verbs', title: { vi: 'Động từ và thời gian', en: 'Verbs through time' } },
      { id: 'b2', title: { vi: 'Tương lai, suy đoán và văn viết', en: 'Future, hypothesis and formal French' } }
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
       1. Le verbe « être » — p. 8–11
       ----------------------------------------------------- */
    {
      id: 'gp-etre', num: 1, part: 'start', minutes: 7,
      title: 'Le verbe « être »',
      subtitle: { vi: 'Động từ être và câu hội thoại cơ bản', en: 'The verb être and the basic dialogue' },
      summary: {
        vi: '« Être » là động từ đầu tiên của mọi cuộc hội thoại: nối chủ ngữ với quốc tịch, nơi ở và cách xưng hô. Nắm chắc je/tu/il… là nền của toàn bộ câu.',
        en: 'Être is the first verb of any dialogue: it links the subject to nationality, place and register. Mastering je/tu/il… is the foundation of every sentence.'
      },
      blocks: [
        P('Trong tiếng Pháp, động từ đứng sau chủ ngữ (tên hoặc đại từ). Động từ « être » nối chủ ngữ với quốc tịch, nơi ở và tính cách: Je suis français. Vous êtes italien ?',
          'In French the verb comes after the subject (a noun or a pronoun). The verb « être » links the subject to nationality, place and character: Je suis français. Vous êtes italien ?'),
        H('Các đại từ chủ ngữ', 'The subject pronouns'),
        TABLE([C('Đại từ', 'Pronoun'), C('Thì hiện tại của être', 'Present of être'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('suis', 'suis'), C('Je suis anglais.', 'I am English.')],
          [C('tu', 'tu'), C('es', 'es'), C('Tu es espagnol.', 'You are Spanish.')],
          [C('il / elle / on', 'il / elle / on'), C('est', 'est'), C('Elle est à Paris.', 'She is in Paris.')],
          [C('nous', 'nous'), C('sommes', 'sommes'), C('Nous sommes en vacances.', 'We are on holiday.')],
          [C('vous', 'vous'), C('êtes', 'êtes'), C('Vous êtes de Madrid ?', 'Are you from Madrid ?')],
          [C('ils / elles', 'ils / elles'), C('sont', 'sont'), C('Ils sont de Londres.', 'They are from London.')]
        ]),
        H('« À », « de », « chez »', '« À », « de », « chez »'),
        LIST([
          '« À » chỉ thành phố nơi mình đang ở : Je suis à Berlin.',
          '« De » chỉ nơi xuất thân : Je suis de Rome. Trước nguyên âm viết thành d\' : — Vous êtes d\'où ? — Je suis d\'Athènes.',
          '« Chez » dùng với người : Je suis chez Pierre, chez moi, chez des amis.'
        ], [
          '« À » gives the city where you are: Je suis à Berlin.',
          '« De » gives your origin: Je suis de Rome. Before a vowel it becomes d\': — Vous êtes d\'où ? — Je suis d\'Athènes.',
          '« Chez » is used with people: Je suis chez Pierre, chez moi, chez des amis.'
        ]),
        H('« Tu » ou « vous » ?', '« Tu » or « vous »?'),
        LIST([
          '« Vous » : phép lịch sự hoặc số nhiều — Vous êtes prêt, monsieur ? / Vous êtes prêts, les enfants ?',
          '« Tu » : bạn bè, gia đình — Tu es prêt, papa ?',
          '« On » = « nous » (động từ số ít) : Paul et moi, on est français. ; « on » cũng nghĩa là « mọi người » : En France, on est gourmand.'
        ], [
          '« Vous »: politeness or plural — Vous êtes prêt, monsieur ? / Vous êtes prêts, les enfants ?',
          '« Tu »: friends and family — Tu es prêt, papa ?',
          '« On » = « nous » (singular verb): Paul et moi, on est français. ; « on » also means “people”: En France, on est gourmand.'
        ]),
        CALLOUT('tip', 'Liên âm bắt buộc giữa đại từ và động từ : vous êtes (vou-z-êtes), on est (on-n-est). Nói thiếu là nghe “tây ngơ”.',
          'The liaison between pronoun and verb is obligatory: vous êtes (vou-z-êtes), on est (on-n-est). Skipping it sounds unnatural.'),
        EXAMPLES([
          EX('Je suis de Marseille.', 'Tôi là người Marseille.', 'I am from Marseille.'),
          EX('Je suis chez moi.', 'Tôi ở nhà mình.', 'I am at home.'),
          EX('— Vous êtes d\'où ? — Je suis d\'Athènes.', '— Bạn quê đâu? — Tôi ở Athèn.', '— Where are you from? — I am from Athens.')
        ])
      ],
      exercises: [
        FILL('Je {{1}} (être) français.', ['suis'],
          'Động từ être với chủ ngữ « je » là « suis ».',
          'The verb être with the subject « je » is « suis ».'),
        CHOICE('Đúng: « Nous ___ en vacances. »', 'Correct: « Nous ___ en vacances. »',
          ['sommes', 'êtes', 'est'], 0,
          'Chủ ngữ số nhiều « nous » nối với « sommes ».',
          'The plural subject « nous » takes « sommes ».'),
        TRANSLATE('Tôi ở Paris.', 'I am in Paris.',
          ['Je suis à Paris.'],
          'Ở một thành phố dùng « à » : Je suis à Paris.',
          'For being in a city use « à »: Je suis à Paris.')
      ]
    },

    /* -----------------------------------------------------
       2. L'adjectif (1) — p. 12–17
       ----------------------------------------------------- */
    {
      id: 'gp-adj1', num: 2, part: 'start', minutes: 9,
      title: "L'adjectif (1)",
      subtitle: { vi: 'Tính từ (1): giống, số và sự hòa hợp', en: 'Adjectives (1): gender, number and agreement' },
      summary: {
        vi: 'Tính từ đổi theo giống và số của danh từ hoặc đại từ. Từ đã học phải học cả bốn dạng: beau, belle, beaux, belles.',
        en: "An adjective agrees with the gender and number of its noun or pronoun. Learn every adjective in all four forms: beau, belle, beaux, belles."
      },
      blocks: [
        P('Tính từ đứng sau động từ « être » và đồng ý với chủ ngữ: Paul est grand → Anne est grande. Giống cái hầu như luôn thêm « -e », số nhiều thêm « -s ».',
          'Adjectives come after the verb « être » and agree with the subject: Paul est grand → Anne est grande. The feminine usually adds « -e », the plural adds « -s ».'),
        H('Đổi dạng — giống cái và số nhiều', 'Forming feminine and plural'),
        TABLE([C('Quy tắc', 'Rule'), C('Ví dụ', 'Example')], [
          [C('Giống đực + -e = giống cái', 'Masc + -e = fem'), C('grand → grande, original → originale', 'grand → grande, original → originale')],
          [C('Từ đã tận cùng bằng -e: giữ nguyên', 'Ending in -e: unchanged'), C('sympathique → sympathique', 'sympathique → sympathique')],
          [C('-s, -d, -t câm ở giống đực, phát âm ở giống cái', '-s, -d, -t silent in masc, sounded in fem'), C('blond → blonde, intelligent → intelligente', 'blond → blonde, intelligent → intelligente')],
          [C('Nhân đôi phụ âm cuối', 'Double the final consonant'), C('mignon → mignonne, ponctuel → ponctuelle', 'mignon → mignonne, ponctuel → ponctuelle')],
          [C('Đổi cả đuôi', 'The whole ending changes'), C('sportif → sportive, sérieux → sérieuse, professeur → professeure', 'sportif → sportive, sérieux → sérieuse, professeur → professeure')],
          [C('Số nhiều: + -s (âm « s » câm)', 'Plural: + -s (silent « s »)'), C('grand → grands, blonde → blondes', 'grand → grands, blonde → blondes')],
          [C('Đuôi -al → -aux (-eau → -eaux)', 'Ending -al → -aux (-eau → -eaux)'), C('original → originaux, beau → beaux (nhưng banal → banals)', 'original → originaux, beau → beaux (but banal → banals)')]
        ]),
        H('Trường hợp đặc biệt và màu sắc', 'Special cases and colours'),
        LIST([
          'beau/belle, nouveau/nouvelle, vieux/vieille, faux/fausse, doux/douce, roux/rousse, gros/grosse.',
          'Màu vốn là danh từ (orange, marron, cerise…) không đổi: une robe orange, des pulls marron. Còn rose, mauve, violet vẫn hợp với danh từ: des robes roses.',
          'Nhóm trộn nam nữ dùng dạng masculine: Paul, Anne et Marie sont beaux.'
        ], [
          'beau/belle, nouveau/nouvelle, vieux/vieille, faux/fausse, doux/douce, roux/rousse, gros/grosse.',
          'Orange, brown, navy… stay invariable: une robe orange, des pulls marron. But rose, mauve, violet and chestnut take a plural: des robes roses.',
          'Mixed groups take the masculine form: Paul, Anne et Marie sont beaux.'
        ]),
        H('Đồng ý với đại từ chủ ngữ', 'Agreement with subject pronouns'),
        TABLE([C('Chủ ngữ', 'Subject'), C('Đồng ý', 'Agreement'), C('Ví dụ', 'Example')], [
          [C('je / tu', 'je / tu'), C('số ít, m hoặc f', 'singular, m or f'), C('Je suis étudiant / étudiante', 'Je suis étudiant / étudiante')],
          [C('vous (lịch sự)', 'vous (politeness)'), C('số ít', 'singular'), C('Vous êtes prêt / prête', 'Vous êtes prêt / prête')],
          [C('vous (số nhiều)', 'vous (plural)'), C('số nhiều', 'plural'), C('Vous êtes prêts / prêtes', 'Vous êtes prêts / prêtes')],
          [C('on = nous', 'on = nous'), C('động từ số ít + tính từ số nhiều', 'singular verb + plural adj'), C('Ugo et moi, on est grands', 'Ugo et moi, on est grands')],
          [C('on = mọi người', 'on = people'), C('masculin số ít', 'masculine singular'), C('En France, on est gourmand', 'En France, on est gourmand')]
        ]),
        EXAMPLES([
          EX('François est grand, blond et intelligent.', 'François cao, tóc vàng và thông minh.', 'François is tall, blond and clever.'),
          EX('Cathy est sportive et sérieuse.', 'Cathy thích thể thao và nghiêm túc.', 'Cathy is sporty and serious.'),
          EX('Anna et moi, on est fatiguées.', 'Anna và tôi thì mệt.', 'Anna and I are tired.')
        ])
      ],
      exercises: [
        FILL('Anne est {{1}} (grand) et {{2}} (blond).', [['grande'], ['blonde']],
          'Chủ ngữ « Anne » là cái nên cả hai tính từ thêm « -e ».',
          'The subject « Anne » is feminine, so both adjectives take « -e ».'),
        CHOICE('Số nhiều của « un journal » là gì?', 'What is the plural of « un journal »?',
          ['des journaux', 'des journals', 'des journales'], 0,
          'Đuôi -al đổi thành -aux: journal → journaux.',
          'The ending -al becomes -aux: journal → journaux.'),
        TRANSLATE('Cô ấy thân thiện.', 'She is nice.',
          ['Elle est sympathique.', 'Elle est gentille.'],
          'Tính từ đứng sau « être » và đồng ý với chủ ngữ.',
          'The adjective follows « être » and agrees with the subject.')
      ]
    },

    /* -----------------------------------------------------
       3. La négation et l'interrogation (1) — p. 18
       ----------------------------------------------------- */
    {
      id: 'gp-neg1', num: 3, part: 'start', minutes: 6,
      title: "La négation et l'interrogation (1)",
      subtitle: { vi: 'Phủ định và hỏi (1)', en: 'Negation and questions (1)' },
      summary: {
        vi: 'Phủ định gói động từ giữa « ne…pas »; hỏi thì có bốn cách, từ thân mật (intonation) đến trang trọng (inversion). Câu trả lời có « si » thay « oui » sau câu phủ định.',
        en: 'Negation wraps the verb in « ne…pas »; there are four ways to ask, from casual (intonation) to formal (inversion). « Si » answers a negative question instead of « oui ».'
      },
      blocks: [
        P('Phủ định đơn giản gồm hai phần bao quanh động từ. Trước nguyên âm hoặc « h » câm, « ne » viết thành « n’ ».',
          'Simple negation has two parts around the verb. Before a vowel or silent « h », « ne » becomes « n’ ».'),
        FORMULA('ne + verbe + pas  →  je ne suis pas / vous n’êtes pas', 'ne + verb + pas  →  je ne suis pas / you are not (vous n’êtes pas)'),
        H('Bốn cách đặt câu hỏi', 'Four ways to ask a question'),
        TABLE([C('Cách', 'Way'), C('Ví dụ', 'Example'), C('Xử dụng', 'Use')], [
          [C('Ngữ điệu lên', 'Rising intonation'), C('Vous êtes irlandais ?', 'Vous êtes irlandais ?'), C('Thường gặp nhất', 'The most common')],
          [C('« Est-ce que »', '« Est-ce que »'), C('Est-ce que vous êtes irlandais ?', 'Est-ce que vous êtes irlandais ?'), C('Rõ ràng, hay dùng điện thoại', 'Clear; useful on the phone')],
          [C('Đảo (inversion)', 'Inversion'), C('Êtes-vous irlandais ?', 'Êtes-vous irlandais ?'), C('Trang trọng, phổ biến với « vous »', 'Formal; common with « vous »')],
          [C('Chủ ngữ thay bằng đại từ', 'Noun replaced by a pronoun'), C('Patrick est-il irlandais ?', 'Patrick est-il irlandais ?'), C('Văn phong trang trọng', 'Formal register')]
        ]),
        H('Câu trả lời', 'Answers'),
        LIST([
          '« Oui » xác nhận; « Non » phủ định cả câu.',
          '« Moi aussi » đồng ý với câu khẳng định (Je suis marié. — Moi aussi.).',
          '« Si » = oui sau câu phủ định (Vous n’êtes pas marié ? — Si, je suis marié.).',
          '« Moi non plus » đồng ý với câu phủ định (Je ne suis pas marié. — Moi non plus.). « Pas » phủ định một phần: Tu travailles le samedi ? — Pas le matin.'
        ], [
          '« Oui » confirms; « Non » denies the whole question.',
          '« Moi aussi » agrees with an affirmative statement (Je suis marié. — Moi aussi.).',
          '« Si » = yes after a negative question (Vous n’êtes pas marié ? — Si, je suis marié.).',
          '« Moi non plus » agrees with a negative statement (Je ne suis pas marié. — Moi non plus.). « Pas » denies part of it: Tu travailles le samedi ? — Pas le matin.'
        ]),
        CALLOUT('tip', 'Người học hay mắc: sau câu hỏi phủ định phải trả lời « Si », không phải « Oui ». Đây là điểm DELF hay kiểm.',
          'A classic learner mistake: a negative question is answered with « Si », not « Oui ». A favourite DELF check point.')
      ],
      exercises: [
        FILL('Je ne {{1}} (être) pas de Paris.', ['suis'],
          'Phủ định bao động từ: ne + suis + pas.',
          'Negation wraps the verb: ne + suis + pas.'),
        FILL('Vous ne {{1}} (parler) pas au téléphone.', ['parlez'],
          '« Ne » + động từ ở ngôi vous + « pas ».',
          '« Ne » + the verb conjugated for vous + « pas ».'),
        CHOICE('— Vous n’êtes pas marié ? — ___', '— You are not married? — ___',
          ['Si, je suis marié.', 'Oui, je suis marié.', 'Non, je suis marié.'], 0,
          'Sau câu hỏi phủ định, « si » dùng để phản bác: thực ra tôi đã kết hôn rồi.',
          'After a negative question, « si » contradicts it: I actually am married.')
      ]
    },

    /* -----------------------------------------------------
       4. Le nom et l'article — p. 22–31
       ----------------------------------------------------- */
    {
      id: 'gp-nom', num: 4, part: 'start', minutes: 11,
      title: 'Le nom et l’article',
      subtitle: { vi: 'Danh từ và mạo từ', en: 'Nouns and articles' },
      summary: {
        vi: 'Mọi danh từ đều đực hoặc cái và thường đi trước một mạo từ. Đoán giống theo đuôi từ, nhớ các dạng số nhiều bất quy tắc, và hợp nhất « de/à + le/les » thành du/au/des/aux.',
        en: 'Every noun is masculine or feminine and usually takes an article. Guess gender from endings, remember the irregular plurals, and contract de/à + le/les into du/au/des/aux.'
      },
      blocks: [
        P('Danh từ tiếng Pháp luôn có giống (đực/cái) và số (ít/nhiều), thường đi trước mạo từ xác định hoặc không xác định. Với người, giống theo giới tính; với vật, giống thường không theo quy luật — chỉ có thể đoán theo đuôi và học thuộc.',
          'A French noun always has a gender (m/f) and a number (singular/plural) and usually takes a definite or indefinite article. For people, gender follows sex; for things it is arbitrary — you can only guess from the ending and memorise.'),
        H('Danh từ chỉ người và đuôi từ', 'Nouns for people and the endings'),
        TABLE([C('Đuôi giống đực', 'Masc ending'), C('Đuôi giống cái', 'Feminine ending'), C('Ví dụ', 'Example')], [
          [C('(không đổi, chỉ đổi mạo từ)', '(unchanged, only the article)'), C('+ -e', '+ -e'), C('un concierge → une concierge', 'un concierge → une concierge')],
          [C('-en', '-en'), C('-enne', '-enne'), C('un étudiant → une étudiante', 'un étudiant → une étudiante')],
          [C('-on', '-on'), C('-onne', '-onne'), C('un musicien → une musicienne', 'un musicien → une musicienne')],
          [C('-eur / -teur', '-eur / -teur'), C('-euse / -trice', '-euse / -trice'), C('un serveur → une serveuse, un acteur → une actrice', 'un serveur → une serveuse, un acteur → une actrice')],
          [C('bất quy tắc', 'irregular'), C('đổi hẳn đuôi', 'whole ending changes'), C('un fils → une fille, un roi → une reine', 'un fils → une fille, un roi → une reine')]
        ]),
        H('Đoán giống danh từ chỉ vật', 'Guessing the gender of things'),
        TABLE([C('Giống đực hay gặp', 'Often masculine'), C('Giống cái hay gặp', 'Often feminine')], [
          [C('-age, -ment, -eau, -isme, -phone', '-age, -ment, -eau, -isme, -phone'), C('-tion, -sion, -té, -ette, -ance, -ence, -ure', '-tion, -sion, -té, -ette, -ance, -ence, -ure')],
          [C('le garage, le gouvernement, le bureau, le réalisme', 'le garage, le gouvernement, le bureau, le réalisme'), C('la situation, la société, la bicyclette, la culture', 'la situation, la société, la bicyclette, la culture')],
          [C('Nhiều từ tận cùng -e vẫn là đực: le problème, le système, le groupe', 'Many -e words are still masc: le problème, le système, le groupe'), C('Một số từ -eur là cái: la couleur, la fleur, la peur', 'Some -eur words are fem: la couleur, la fleur, la peur')]
        ], 'Không có ngoại lệ thì học thuộc cùng mạo từ: « la plage » chứ không phải « le plage ». / When in doubt, memorise the noun with its article: « la plage », not « le plage ».') ,
        H('Số nhiều', 'The plural'),
        LIST([
          'Quy tắc: + -s (un livre → des livres). « s », « x », « z » cuối đã có thì giữ nguyên (des cas, des choix, des gaz).',
          '-al/-au → -aux (des journaux, des tableaux) nhưng festival, carnaval → -s. -eau → -eaux (des tableaux). -eu → -eux (des jeux) nhưng des bleus, des pneus.',
          'Một số từ -ou thêm -x : des bijoux, des cailloux, des genoux, des poux. Không đều: un œil → des yeux, un ciel → des cieux, monsieur → messieurs, un œuf → des œufs.'
        ], [
          'Rule: + -s (un livre → des livres). Words already ending in « s », « x », « z » are unchanged (des cas, des choix, des gaz).',
          '-al/-au → -aux (des journaux, des tableaux) but festival, carnaval take -s. -eau → -eaux (des tableaux). -eu → -eux (des jeux) but des bleus, des pneus.',
          'Some -ou nouns add -x: des bijoux, des cailloux, des genoux, des poux. Irregular: un œil → des yeux, un ciel → des cieux, monsieur → messieurs, un œuf → des œufs.'
        ]),
        H('Mạo từ và mạo từ hợp nhất', 'Articles and contracted articles'),
        TABLE([C('Không xác định', 'Indefinite'), C('Xác định', 'Definite'), C('Hợp nhất', 'Contracted')], [
          [C('un / une / des', 'un / une / des'), C('le / la / les', 'le / la / les'), C('de + le → du, de + les → des', 'de + le → du, de + les → des')],
          [C('một (thể loại, đơn vị)', 'a/an (category, unit)'), C('cái đã nhắc, chung chung', 'the (specific, general)'), C('à + le → au, à + les → aux', 'à + le → au, à + les → aux')]
        ]),
        CALLOUT('tip', '« Des » hợp nhất (de + les: Je parle des Français = tất cả) khác « des » không xác định (un + s: Je connais des Français = một số). Và verb thích, ghét luôn dùng mạo từ xác định: J’aime la laine.',
          'Contracted « des » (de + les: Je parle des Français = all the French) differs from indefinite « des » (plural of un: Je connais des Français = some French people). Verbs of taste always take the definite article: J’aime la laine.'),
        CALLOUT('english', 'Tiếng Anh nói « I like wool » không có mạo từ; tiếng Pháp bắt buộc: « J’aime la laine ». « À la » và « de la » KHÔNG hợp nhất: à la gare, de la gare.',
          'English says “I like wool” with no article; French requires it: “J’aime la laine”. « À la » and « de la » never contract: à la gare, de la gare.')
      ],
      exercises: [
        FILL('C’est la voiture {{1}} (de + le) directeur.', ['du'],
          '« De » + « le » hợp nhất thành « du ».',
          '« De » + « le » contracts to « du ».'),
        CHOICE('Điền mạo từ: « La liberté, ___ bonheur, l’amour ».', 'Fill in the article: “La liberté, ___ bonheur, l’amour”.',
          ['le', 'du', 'un'], 0,
          'Khi nói chung về một ý niệm, dùng mạo từ xác định.',
          'For a general idea, use the definite article.'),
        TRANSLATE('Tôi thích phô mai.', 'I like cheese.',
          ['J’aime le fromage.'],
          'Động từ chỉ sở thích (aimer, détester, adorer) luôn đi với mạo từ xác định.',
          'Verbs of taste (aimer, détester, adorer) always take the definite article.')
      ]
    },

    /* -----------------------------------------------------
       5. « C'est » et « il est » — p. 32–34
       ----------------------------------------------------- */
    {
      id: 'gp-cest', num: 5, part: 'start', minutes: 7,
      title: '« C’est » et « il est »',
      subtitle: { vi: 'C’est và il est: nhận diện và miêu tả', en: '« C’est » and « il est »: identifying and describing' },
      summary: {
        vi: '« C’est » + danh từ để nhận diện, « il/elle est » + tính từ để miêu tả. Nghề nghiệp đứng sau « je suis » không có mạo từ, nhưng « c’est » luôn cần danh từ xác định.',
        en: '« C’est » + noun identifies, « il/elle est » + adjective describes. Professions after « je suis » take no article, but « c’est » always takes a determined noun.'
      },
      blocks: [
        P('Hai cấu trúc dễ lẫn: « C’est » nhận diện một người/vật; « Il/elle est » miêu tả người/vật đã xác định. Nhận xét chung thì dùng « c’est » + tính từ.',
          'Two easy-to-confuse structures: « C’est » identifies a person or thing; « il/elle est » describes a known one. A general comment uses « c’est » + adjective.'),
        H('Nhận diện và miêu tả', 'Identifying and describing'),
        TABLE([C('Mục đích', 'Purpose'), C('Cấu trúc', 'Structure'), C('Ví dụ', 'Example')], [
          [C('Nhận diện', 'Identify'), C('c’est + danh từ ít / ce sont + danh từ nhiều', 'c’est + singular noun / ce sont + plural noun'), C('C’est un fruit. Ce sont des fruits.', 'C’est un fruit. Ce sont des fruits.')],
          [C('Miêu tả', 'Describe'), C('il/elle est + tính từ', 'il/elle est + adjective'), C('C’est mon livre. Il est bleu.', 'C’est mon livre. Il est bleu.')],
          [C('Nhận xét chung', 'General comment'), C('c’est + tính từ', 'c’est + adjective'), C('La mer, c’est beau !', 'La mer, c’est beau !')]
        ]),
        EXAMPLES([
          EX('— Qui est-ce ? — C’est mon cousin.', '— Đó là ai? — Đó là anh họ tôi.', '— Who is it? — It’s my cousin.'),
          EX('— Qu’est-ce que c’est ? — Ce sont des dessins de ma fille.', '— Đó là gì? — Đó là tranh con gái tôi vẽ.', '— What is it? — They are my daughter’s drawings.'),
          EX('C’est Peter. Il est blond.', 'Đó là Peter. Cậu ấy tóc vàng.', 'It’s Peter. He is blond.')
        ]),
        H('Nghề nghiệp', 'Professions'),
        LIST([
          'Sau « je/tu/il… + être », nghề, quốc tịch, tôn giáo KHÔNG có mạo từ: Je suis secrétaire. Il est anglais. Il est professeur.',
          'Thêm nhận xét thì có mạo từ: Paul est un bon professeur. / C’est un jeune professeur d’anglais.',
          '« C’est » + danh từ xác định, « il est » + tính từ hoặc nghề: — C’est mon voisin. — Il est sympathique ?'
        ], [
          'After « je/tu/il… + être », professions, nationalities and religions take NO article: Je suis secrétaire. Il est anglais. Il est professeur.',
          'With an added comment the article returns: Paul est un bon professeur. / C’est un jeune professeur d’anglais.',
          '« C’est » + a determined noun, « il est » + adjective or profession: — C’est mon voisin. — Il est sympathique ?'
        ]),
        CALLOUT('tip', 'Câu hỏi về danh tính LUÔN ở số ít: « Qui est-ce ? » (không phải « Qui est ? »). Ra mắt qua intercom cũng dùng « C’est nous ! ».',
          'Identification questions are ALWAYS singular: “Qui est-ce ?” (never “Qui est ?”). Announcing yourself on an intercom is also “C’est nous !”.')
      ],
      exercises: [
        FILL('{{1}} est Peter Kirov.', ['C', 'C’', "C'"],
          'Trước danh từ để nhận diện dùng « c’est » (viết tắt « C’ » trước nguyên âm).',
          'To identify a noun use « c’est » (written C’ before a vowel).'),
        CHOICE('Trong « Je suis professeur », trước « professeur » có mạo từ không?', 'In “Je suis professeur”, does “professeur” take an article?',
          ['Không có mạo từ', 'Mạo từ xác định', 'Mạo từ không xác định'], 0,
          'Nghề nghiệp đứng sau « être » trong câu giới thiệu không có mạo từ.',
          'A profession after « être » in a statement takes no article.'),
        TRANSLATE('Đó là quyển sách của tôi. Nó màu xanh.', 'That is my book. It is blue.',
          ["C'est mon livre. Il est bleu."],
          'Nhận diện bằng « c’est », miêu tả bằng « il est ».',
          'Identify with « c’est », describe with « il est ».')
      ]
    },

    /* -----------------------------------------------------
       6. Les possessifs — p. 36
       ----------------------------------------------------- */
    {
      id: 'gp-poss', num: 6, part: 'start', minutes: 7,
      title: 'Les possessifs',
      subtitle: { vi: 'Tính từ và đại từ sở hữu', en: 'Possessive adjectives and pronouns' },
      summary: {
        vi: 'Từ sở hữu đổi theo NGƯỜI SỞ HỮU nhưng đồng ý với DANH TỪ được sở hữu: mon père, ma mère, mes parents. Trước nguyên âm, ma/ta/sa đổi thành mon/ton/son.',
        en: 'A possessive changes with the OWNER but agrees with the OWNED noun: mon père, ma mère, mes parents. Before a vowel, ma/ta/sa become mon/ton/son.'
      },
      blocks: [
        P('Tính từ sở hữu đứng trước danh từ và bám theo danh từ (giống, số); người sở ngữ thể hiện qua từ (je → mon…). Đại từ sở hữu thay thế cả cụm danh từ.',
          'A possessive adjective comes before the noun and agrees with it (gender, number); the owner shows in the word itself (je → mon…). A possessive pronoun replaces the whole noun phrase.'),
        H('Tính từ sở hữu', 'Possessive adjectives'),
        TABLE([C('Chủ ngữ', 'Owner'), C('+ danh từ đực', '+ masc noun'), C('+ danh từ cái', '+ fem noun'), C('+ số nhiều', '+ plural')], [
          [C('je', 'je'), C('mon', 'mon'), C('ma', 'ma'), C('mes', 'mes')],
          [C('tu', 'tu'), C('ton', 'ton'), C('ta', 'ta'), C('tes', 'tes')],
          [C('il / elle', 'il / elle'), C('son', 'son'), C('sa', 'sa'), C('ses', 'ses')],
          [C('nous', 'nous'), C('notre', 'notre'), C('notre', 'notre'), C('nos', 'nos')],
          [C('vous', 'vous'), C('votre', 'votre'), C('votre', 'votre'), C('vos', 'vos')],
          [C('ils / elles', 'ils / elles'), C('leur', 'leur'), C('leur', 'leur'), C('leurs', 'leurs')]
        ]),
        H('Đại từ sở hữu', 'Possessive pronouns'),
        TABLE([C('Đực ít', 'Masc. sg.'), C('Cái ít', 'Fem. sg.'), C('Số nhiều', 'Plural')], [
          [C('le mien', 'le mien'), C('la mienne', 'la mienne'), C('les miens / les miennes', 'les miens / les miennes')],
          [C('le tien', 'le tien'), C('la tienne', 'la tienne'), C('les tiens / les tiennes', 'les tiens / les tiennes')],
          [C('le sien', 'le sien'), C('la sienne', 'la sienne'), C('les siens / les siennes', 'les siens / les siennes')],
          [C('le nôtre', 'le nôtre'), C('la nôtre', 'la nôtre'), C('les nôtres', 'les nôtres')],
          [C('le vôtre', 'le vôtre'), C('la vôtre', 'la vôtre'), C('les vôtres', 'les vôtres')],
          [C('le leur', 'le leur'), C('la leur', 'la leur'), C('les leurs', 'les leurs')]
        ]),
        H('Những điểm hay gặp', 'What usually trips learners'),
        LIST([
          'Trước nguyên âm hoặc « h » câm: ma → mon amie, ta → ton erreur, sa → son hésitation.',
          'Bộ phận cơ thể khi chủ ngữ = người sở hữu: dùng article défini thay possessif — J’ai mal à la tête (không phải « J’ai mal à ma tête »). Nhưng « Ma tête est brûlante » vẫn đúng khi nhấn mạnh.',
          '« On » = nous: On est chez notre grand-mère. « On » = mọi người: on parle de son passé.',
          '« Notre » là tính từ (notre père); « le nôtre » là đại từ (C’est le nôtre).'
        ], [
          'Before a vowel or silent « h »: ma → mon amie, ta → ton erreur, sa → son hésitation.',
          'Body parts when the subject is the owner: use the definite article instead of the possessive — J’ai mal à la tête (not « J’ai mal à ma tête »). But « Ma tête est brûlante » is fine for emphasis.',
          '« On » = nous: On est chez notre grand-mère. « On » = people: on parle de son passé.',
          '« Notre » is an adjective (notre père); « le nôtre » is a pronoun (C’est le nôtre).'
        ]),
        CALLOUT('tip', 'Liên âm bắt buộc: mon ami (mo-n-ami), mes idées (me-z-idées), nhưng « h » aspiré chặn: mes héros.',
          'The liaison is obligatory: mon ami (mo-n-ami), mes idées (me-z-idées) — but a silent h blocks it: mes héros.')
      ],
      exercises: [
        FILL('C’est {{1}} sac. (je)', ['mon'],
          '« Sac » là danh từ đực → dùng « mon ».',
          '« Sac » is masculine, so use « mon ».'),
        FILL('C’est {{1}} amie. (mon, possessif)', ['mon'],
          'Trước nguyên âm, « ma » đổi thành « mon »: mon amie.',
          'Before a vowel, « ma » becomes « mon »: mon amie.'),
        TRANSLATE('Đó là quyển sách của tôi (quyển sách tôi).', 'That is my book.',
          ["C'est mon livre.", 'C’est le mien.'],
          'Nhận diện bằng « c’est » + sở hữu: mon livre (tính từ) hoặc le mien (đại từ).',
          'Identify with « c’est » + possession: mon livre (adjective) or le mien (pronoun).')
      ]
    },

    /* -----------------------------------------------------
       7. Les noms de parenté et de groupe — p. 38
       ----------------------------------------------------- */
    {
      id: 'gp-parente', num: 7, part: 'start', minutes: 6,
      title: 'Les noms de parenté et de groupe',
      subtitle: { vi: 'Từ vựng họ hàng và nhóm người', en: 'Kinship and group nouns' },
      summary: {
        vi: 'Họ hàng chia huyết thống (grand-, petit-) và hôn nhân (beau-, belle-). Nhóm người thì « des gens » (số nhiều), « tout le monde » (số ít) và « des personnes » (đếm được).',
        en: 'Kinship splits into blood (grand-, petit-) and marriage (beau-, belle-). For groups: « des gens » (plural verb), « tout le monde » (singular) and « des personnes » (countable).'
      },
      blocks: [
        P('Từ chỉ họ hàng thường ghép tiền tố; chú ý « les parents » (bố mẹ) khác « des parents » (họ hàng), và « mon ami(e) » trong ngữ cảnh tình cảm khác « un ami »',
          'Kinship nouns usually take a prefix; note « les parents » (mother and father) versus « des parents » (relatives), and « mon ami(e) » meaning partner rather than « un ami ».'),
        H('Họ hàng huyết thống và hôn nhân', 'Blood and marriage relations'),
        TABLE([C('Huyết thống', 'Blood'), C('Hôn nhân (bên kia)', 'By marriage')], [
          [C('le père / la mère, le fils / la fille', 'father / mother, son / daughter'), C('le mari / la femme', 'husband / wife')],
          [C('les grands-parents, les petits-enfants', 'grandparents, grandchildren'), C('le beau-père / la belle-mère', 'father-in-law / mother-in-law')],
          [C('l’oncle / la tante, le neveu / la nièce', 'uncle / aunt, nephew / niece'), C('le beau-frère / la belle-sœur, le gendre', 'brother-in-law / sister-in-law, son-in-law')]
        ]),
        H('Nhóm người', 'Group nouns'),
        TABLE([C('Từ', 'Word'), C('Nghĩa', 'Meaning'), C('Động từ', 'Verb')], [
          [C('des gens', 'des gens'), C('vô số người (collectif)', 'an undetermined crowd'), C('số nhiều', 'plural')],
          [C('tout le monde', 'tout le monde'), C('= des gens, đại từ', 'same, as a pronoun'), C('số ít', 'singular')],
          [C('des personnes', 'des personnes'), C('số đếm được (1, 2, 3…)', 'a countable number (1, 2, 3…)'), C('số nhiều', 'plural')],
          [C('le monde entier', 'le monde entier'), C('tất cả các nước', 'every country'), C('—', '—')]
        ]),
        EXAMPLES([
          EX('Il y a des gens dans la rue.', 'Có người trên đường.', 'There are people in the street.'),
          EX('Tout le monde aime les vacances.', 'Mọi người đều thích nghỉ mát.', 'Everyone loves holidays.'),
          EX('Il y a dix personnes dans la rue.', 'Có mười người trên đường.', 'There are ten people in the street.')
        ]),
        CALLOUT('english', '« Parents » là “parents”; « des parents » là “relatives”. Đừng dịch sát “parent” cho cả hai.',
          '« Parents » means mother and father; « des parents » means relatives. Do not translate both with the English “parents”.')
      ],
      exercises: [
        FILL('Tout le monde {{1}} les vacances. (aimer)', ['aime'],
          '« Tout le monde » là chủ ngữ số ít → động từ số ít.',
          '« Tout le monde » is a singular subject → singular verb.'),
        CHOICE('Bố vợ/chồng gọi là?', 'What do you call a father-in-law?',
          ['le beau-père', 'le grand-père', 'le gendre'], 0,
          '« Beau-père » = bố chồng hoặc bố vợ (hoặc cha dượng khi tái hôn).',
          '« Beau-père » = father-in-law (also stepfather after a remarriage).'),
        TRANSLATE('Có năm người trong phòng.', 'There are five people in the room.',
          ['Il y a cinq personnes dans la chambre.'],
          'Số đếm được dùng « personnes », giữ « il y a » ở số ít.',
          'A countable number uses « personnes », while « il y a » stays singular.')
      ]
    },

    /* -----------------------------------------------------
       8. Les démonstratifs — p. 40
       ----------------------------------------------------- */
    {
      id: 'gp-dem', num: 8, part: 'start', minutes: 6,
      title: 'Les démonstratifs',
      subtitle: { vi: 'Mạo từ và đại từ chỉ định', en: 'Demonstrative adjectives and pronouns' },
      summary: {
        vi: '« Ce / cette / cet / ces » trỏ người vật đang nói tới; thêm « -ci » (gần, mới) hoặc « -là » (xa, đã nhắc) để phân biệt. Đại từ celui/celle/ceux/celles tránh lặp lại.',
        en: '« Ce / cette / cet / ces » points at what is being discussed; add « -ci » (near, now) or « -là » (far, before) to tell two things apart. The pronouns celui/celle/ceux/celles avoid repetition.'
      },
      blocks: [
        P('Chỉ định dùng cho người/vật có mặt hoặc thời gian đang nói. Trước nguyên âm « ce » viết thành « cet »; thêm « là-bas » để nói khoảng cách.',
          'Demonstratives point at present people or things, or at the time being discussed. Before a vowel « ce » becomes « cet »; add « là-bas » for physical distance.'),
        H('Mạo từ chỉ định', 'Demonstrative adjectives'),
        TABLE([C('Giống / số', 'Gender / number'), C('Dạng', 'Form'), C('Ví dụ', 'Example')], [
          [C('đực ít', 'masculine sg.'), C('ce (cet trước nguyên âm/h câm)', 'ce (cet before vowel/silent h)'), C('ce gâteau, cet ami, cet homme', 'ce gâteau, cet ami, cet homme')],
          [C('cái ít', 'feminine sg.'), C('cette', 'cette'), C('cette brioche, cette église', 'cette brioche, cette église')],
          [C('số nhiều', 'plural'), C('ces', 'ces'), C('ces croissants, ces amis', 'ces croissants, ces amis')]
        ]),
        H('« -ci » hay « -là » ?', '« -ci » or « -là »?'),
        LIST([
          'Thời gian gần/không đếm được: ce matin, cette semaine, cet été.',
          'Ngày/tháng đếm được thêm « -ci » (gần) hoặc « -là » (xa, đã nhắc): ce mois-ci / ce mois-là.',
          'Hai vật đối lập: ce vélo-ci / ce vélo-là. Khoảng cách thêm « là-bas »: Ce monument, là-bas, c’est l’Opéra.',
          'Liên âm: ces amis (se-z-amis) nhưng ces héros (h aspiré).'
        ], [
          'Near or uncountable time: ce matin, cette semaine, cet été.',
          'Countable days/months take « -ci » (near) or « -là » (far, already mentioned): ce mois-ci / ce mois-là.',
          'Two contrasting things: ce vélo-ci / ce vélo-là. Physical distance adds « là-bas »: Ce monument, là-bas, c’est l’Opéra.',
          'Liaison: ces amis (se-z-amis) but ces héros (aspirated h).'
        ]),
        H('Đại từ chỉ định', 'Demonstrative pronouns'),
        TABLE([C('Đực ít', 'Masc. sg.'), C('Cái ít', 'Fem. sg.'), C('Số nhiều', 'Plural')], [
          [C('celui-ci / celui-là', 'celui-ci / celui-là'), C('celle-ci / celle-là', 'celle-ci / celle-là'), C('ceux-ci / ceux-là, celles-ci / celles-là', 'ceux-ci / ceux-là, celles-ci / celles-là')]
        ], '« Celui de + người » chỉ sự sở hữu : À qui est ce vélo ? — C’est celui de Léa. / That’s whose bike? — It’s Léa’s.')
      ],
      exercises: [
        FILL('Je voudrais {{1}} gâteau et {{2}} croissants.', [['ce'], ['ces']],
          '« Gâteau » đực ít → « ce »; « croissants » số nhiều → « ces ».',
          '« Gâteau » is masculine singular → « ce »; « croissants » is plural → « ces ».'),
        CHOICE('Trước « homme » (h câm), dùng từ chỉ định nào?', 'Before « homme » (silent h), which demonstrative?',
          ['cet', 'ce', 'cette'], 0,
          'Trước nguyên âm hoặc « h » câm, « ce » viết thành « cet »: cet homme.',
          'Before a vowel or silent « h », « ce » becomes « cet »: cet homme.'),
        TRANSLATE('Tôi muốn cái này, không phải cái kia.', 'I want this one, not that one.',
          ['Je veux celui-ci, pas celui-là.', 'Je veux celle-ci, pas celle-là.'],
          'Đại từ chỉ định thêm « -ci / -là » để phân biệt hai lựa chọn.',
          'Demonstrative pronouns take « -ci / -là » to contrast two options.')
      ]
    },

    /* -----------------------------------------------------
       9. « Il y a » et « c'est » — p. 42
       ----------------------------------------------------- */
    {
      id: 'gp-ilya', num: 9, part: 'start', minutes: 6,
      title: '« Il y a » et « c’est »',
      subtitle: { vi: 'Sự tồn tại (il y a) và nhận diện (c’est)', en: 'Existence (il y a) and identification (c’est)' },
      summary: {
        vi: 'Sự tồn tại trong tiếng Pháp dùng cấu trúc bất định « il y a » (LUÔN số ít), không dùng « être » như tiếng Anh. « C’est / ce sont » chỉ nhận diện cái đã có mặt.',
        en: 'French states existence with the impersonal « il y a » (ALWAYS singular), not « être » as in English. « C’est / ce sont » identifies what is already present.'
      },
      blocks: [
        P('Nhiều tiếng nói (Anh, Ý…) dùng « être » để nói một vật tồn tại; tiếng Pháp dùng « il y a ». Đây là lỗi dịch quen thuộc của người học.',
          'Many languages (English, Italian…) use “être” to say something exists; French uses « il y a ». It is a classic translation trap.'),
        TABLE([C('Mục đích', 'Purpose'), C('Cấu trúc', 'Structure'), C('Ví dụ', 'Example')], [
          [C('Tồn tại', 'Existence'), C('il y a + danh từ (số ít của động từ)', 'il y a + noun (singular verb)'), C('Dans la rue, il y a un homme. / il y a dix hommes.', 'In the street there is a man / there are ten men.')],
          [C('Nhận diện', 'Identification'), C('c’est / ce sont + danh từ', 'c’est / ce sont + noun'), C('C’est une Jaguar. / Ce sont des cerisiers.', 'It’s a Jaguar. / They are cherry trees.')]
        ]),
        EXAMPLES([
          EX('Dans la rue, il y a une voiture verte. C’est une Jaguar.', 'Trên đường có một chiếc xe xanh. Đó là Jaguar.', 'In the street there is a green car. It’s a Jaguar.'),
          EX('À Budapest, il y a un fleuve : c’est le Danube.', 'Ở Budapest có một dòng sông: đó là sông Danube.', 'In Budapest there is a river: the Danube.'),
          EX('À huit heures, il y a un match de football.', 'Tám giờ có một trận bóng.', 'At eight o’clock there is a football match.')
        ]),
        LIST([
          '« Il y a » + danh từ là cấu trúc bất định, luôn ở số ít: il y a dix hommes (không đổi theo số danh từ).',
          'Nơi chốn không bắt buộc phải nói ra: À huit heures, il y a un match.',
          'Phủ định: il n’y a pas. — Trước nguyên âm: il n’y a pas d’arbres.'
        ], [
          '« Il y a » + noun is impersonal and always singular: il y a dix hommes (it never follows the noun’s number).',
          'The place need not be stated: À huit heures, il y a un match.',
          'Negation: il n’y a pas. Before a vowel: il n’y a pas d’arbres.'
        ]),
        CALLOUT('english', 'Tiếng Anh chia “there is / there are”, tiếng Pháp chỉ có « il y a » (luôn số ít), dù theo sau là số nhiều: il y a des gens.',
          'English “there is / there are” are both « il y a » (singular). Never make the verb agree with the noun.')
      ],
      exercises: [
        FILL('Dans la rue, il {{1}} des arbres en fleurs.', ['y a', "y'a"],
          'Cấu trúc bất định « il y a », luôn giữ nguyên.',
          'The impersonal « il y a » never changes.'),
        CHOICE('Đúng: « À Budapest, ___ un fleuve. »', 'Correct: “À Budapest, ___ un fleuve.”',
          ['il y a', 'c’est', 'il est'], 0,
          'Nói về sự tồn tại của một vật mới thấy → « il y a ».',
          'Stating that something exists → « il y a ».'),
        TRANSLATE('Trong vườn có một cái bàn.', 'There is a table in the garden.',
          ['Il y a une table dans le jardin.'],
          'Sự tồn tại: « il y a » + danh từ, nơi chốn ở cuối.',
          'Existence: « il y a » + noun, with the place at the end.')
      ]
    },

    /* -----------------------------------------------------
       10. La situation dans l'espace (1) — p. 44–46
       ----------------------------------------------------- */
    {
      id: 'gp-espace1', num: 10, part: 'world', minutes: 8,
      title: "La situation dans l'espace (1)",
      subtitle: { vi: 'Không gian (1): thành phố, quốc gia và chỗ ở', en: 'Space (1): cities, countries and location' },
      summary: {
        vi: 'Thành phố không có mạo từ (Paris), quốc gia thường có (la France). Chọn « à / en / au / aux » theo giống và số quốc gia, và nhớ các giới từ không gian: dans, sur, sous, au-dessus.',
        en: 'Cities take no article (Paris), countries usually do (la France). Pick « à / en / au / aux » from the country’s gender and number, and learn the space prepositions: dans, sur, sous, au-dessus.'
      },
      blocks: [
        P('Nói về nơi chốn trước hết là chọn đúng mạo từ và giới từ: Je suis à Madrid, en Espagne. Vous êtes au Japon.',
          'Talking about place starts with the right article and preposition: Je suis à Madrid, en Espagne. Vous êtes au Japon.'),
        H('Thành phố và quốc gia', 'Cities and countries'),
        LIST([
          'Thành phố: KHÔNG mạo từ — Paris, Vienne, Tokyo. Ngoại lệ có sẵn « Le/La »: Le Havre, Le Caire, La Haye.',
          'Quốc gia và lục địa: thường CÓ mạo từ — la France, le Japon, l’Afrique, les États-Unis. Ngoại lệ: Chypre, Haïti, Israël, Cuba…',
          'Đuôi -e thường là cái: la Suisse, la Russie, la Hollande. Ngoại lệ đực: le Mexique, le Cambodge, le Mozambique.'
        ], [
          'Cities: NO article — Paris, Vienne, Tokyo. Exceptions with a built-in article: Le Havre, Le Caire, La Haye.',
          'Countries and continents: usually WITH an article — la France, le Japon, l’Afrique, les États-Unis. Exceptions: Chypre, Haïti, Israël, Cuba…',
          'Ending in -e is usually feminine: la Suisse, la Russie, la Hollande. Masculine exceptions: le Mexique, le Cambodge, le Mozambique.'
        ]),
        H('« À », « en », « au », « aux »', '« À », « en », « au », « aux »'),
        TABLE([C('Giới từ', 'Preposition'), C('Dùng với', 'Used with'), C('Ví dụ', 'Example')], [
          [C('à', 'à'), C('thành phố hoặc quốc gia không article', 'city or article-less country'), C('à Paris, à Madrid, à Cuba', 'à Paris, à Madrid, à Cuba')],
          [C('en', 'en'), C('quốc gia cái số ít', 'feminine singular country'), C('en France, en Russie', 'en France, en Russie')],
          [C('au', 'au'), C('quốc gia đực số ít', 'masculine singular country'), C('au Brésil, au Canada', 'au Brésil, au Canada')],
          [C('aux', 'aux'), C('quốc gia số nhiều', 'plural country'), C('aux États-Unis, aux Pays-Bas', 'aux États-Unis, aux Pays-Bas')],
          [C('en', 'en'), C('bất kỳ quốc gia đơn nào bắt đầu bằng nguyên âm', 'any singular country starting with a vowel'), C('en Iran, en Angola', 'en Iran, en Angola')]
        ]),
        H('Biểu đạt không gian', 'Location expressions'),
        TABLE([C('Giới từ', 'Preposition'), C('Ý nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('dans', 'dans'), C('bên trong (không gian khép kín)', 'inside (closed space)'), C('dans la maison, dans le train', 'dans la maison, dans le train')],
          [C('sur / sous', 'sur / sous'), C('trên bề mặt / dưới', 'on a surface / under'), C('sur le toit, sous le parapluie', 'sur le toit, sous le parapluie')],
          [C('au-dessus de / au-dessous de', 'au-dessus de / au-dessous de'), C('phía trên / phía dưới (một mức)', 'higher / lower (a level)'), C('Nous volons au-dessus de l’Atlantique.', 'We fly above the Atlantic.')],
          [C('à côté de / près de / loin de', 'à côté de / près de / loin de'), C('bên cạnh / gần / xa', 'next to / near / far'), C('Versailles est près de Paris.', 'Versailles is near Paris.')]
        ]),
        CALLOUT('tip', 'Trong các hãng thông tin: DITES « dans le train », « à la télévision », « sur la place », « sur Internet ». KHÔNG nói « sur le train », « sur la télévision ».',
          'For transport and media: say « dans le train », « à la télévision », « sur la place », « sur Internet » — never « sur le train », « sur la télévision ».')
      ],
      exercises: [
        FILL('Je vais {{1}} États-Unis.', ['aux'],
          '« États-Unis » là quốc gia số nhiều → « aux ».',
          '« États-Unis » is a plural country → « aux ».'),
        FILL('Il y a Lady Gaga {{1}} la télévision.', ['à'],
          'Chỉ kênh/nơi trên bản sóng dùng « à la télévision ».',
          'For the channel or place on air use « à la télévision ».'),
        TRANSLATE('Tôi đi du lịch ở Brazil.', 'I am travelling in Brazil.',
          ['Je voyage au Brésil.', 'Je vais au Brésil.'],
          '« Brésil » là quốc gia đực → « au ».',
          '« Brésil » is a masculine country → « au ».')
      ]
    },

    /* -----------------------------------------------------
       11. Le verbe « avoir » — p. 48–50
       ----------------------------------------------------- */
    {
      id: 'gp-avoir', num: 11, part: 'world', minutes: 8,
      title: 'Le verbe « avoir »',
      subtitle: { vi: 'Động từ avoir: tuổi tác, cảm giác và đặc điểm', en: 'The verb avoir: age, sensations and features' },
      summary: {
        vi: 'Tiếng Pháp dùng « avoir » cho tuổi (J’ai trente ans), cảm giác không article (j’ai faim, j’ai froid) và đặc điểm (elle a les yeux bleus) — khác hẳn « être » của tiếng Anh.',
        en: 'French uses « avoir » for age (J’ai trente ans), article-less sensations (j’ai faim, j’ai froid) and features (elle a les yeux bleus) — very different from English “to be”.'
      },
      blocks: [
        P('Sau « avoir » thường đến một danh từ. Động từ này chia không đều và là đối trọng của « être » trong rất nhiều cấu trúc.',
          'After « avoir » usually comes a noun. The verb is irregular and is the counterpart of « être » in many structures.'),
        TABLE([C('Chủ ngữ', 'Subject'), C('Hiện tại', 'Present'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('ai', 'ai'), C('J’ai un passeport.', 'I have a passport.')],
          [C('tu', 'tu'), C('as', 'as'), C('Tu as vingt ans.', 'You are twenty.')],
          [C('il / elle', 'il / elle'), C('a', 'a'), C('Elle a une carte d’identité.', 'She has an ID card.')],
          [C('nous', 'nous'), C('avons', 'avons'), C('Nous avons des enfants.', 'We have children.')],
          [C('vous', 'vous'), C('avez', 'avez'), C('Vous avez froid ?', 'Are you cold?')],
          [C('ils / elles', 'ils / elles'), C('ont', 'ont'), C('Ils ont un garçon.', 'They have a son.')]
        ]),
        H('Tuổi và cảm giác', 'Age and sensations'),
        LIST([
          'Tuổi: « avoir » + số — J’ai trente ans. (KHÔNG: « Je suis trente ans ».)',
          'Cảm giác thiếu/đau KHÔNG article: j’ai faim, froid, soif, sommeil, peur, j’ai mal à la tête / au dos / aux dents.',
          '« Avoir besoin de », « avoir envie de » + danh từ; dùng « très » để cường điệu: J’ai très faim (không: « beaucoup faim »).'
        ], [
          'Age: « avoir » + number — J’ai trente ans. (Never “Je suis trente ans”.)',
          'Sensations of lack or pain take NO article: j’ai faim, froid, soif, sommeil, peur, j’ai mal à la tête / au dos / aux dents.',
          '« Avoir besoin de », « avoir envie de » + noun; use « très » for intensity: J’ai très faim (never “beaucoup faim”).'
        ]),
        H('Đặc điểm và disposition', 'Features and dispositions'),
        LIST([
          'Đặc điểm thân thể: avoir + article xác định — Lola a les yeux bleus, la peau douce. Đặt tính từ TRƯỚC danh từ → article không xác định: un petit nez, une jolie bouche.',
          'Disposition: avoir + article — avoir le temps de, avoir l’habitude de, avoir l’occasion de, avoir du mal à.',
          'Khác: avoir raison/tort, avoir de la chance, avoir l’air fatigué, avoir lieu (diễn ra).'
        ], [
          'Physical features: avoir + definite article — Lola a les yeux bleus, la peau douce. Adjective BEFORE the noun → indefinite article: un petit nez, une jolie bouche.',
          'Dispositions: avoir + article — avoir le temps de, avoir l’habitude de, avoir l’occasion de, avoir du mal à.',
          'Also: avoir raison/tort, avoir de la chance, avoir l’air fatigué, avoir lieu (to take place).'
        ]),
        CALLOUT('tip', 'Phủ định article không xác định → « de »: Je n’ai pas de chien / pas d’enfants. Nhưng khi đính chính thì giữ article: Pas une moto, un scooter.',
          'Negating the indefinite article gives « de »: Je n’ai pas de chien / pas d’enfants. But a correction keeps it: Pas une moto, un scooter.')
      ],
      exercises: [
        FILL('Mon fils a {{1}} mois. (trois)', ['trois'],
          'Tuổi/thời gian dùng « avoir »: trois mois, vingt ans.',
          'Age and time use « avoir »: trois mois, vingt ans.'),
        FILL('— Vous avez un chien ? — Non, je n’ai {{1}} chien.', ['de', "d'"],
          'Phủ định article không xác định đổi thành « de ».',
          'Negating the indefinite article gives « de ».'),
        TRANSLATE('Tôi đói và tôi lạnh.', 'I am hungry and I am cold.',
          ['J’ai faim et j’ai froid.', 'J’ai froid et j’ai faim.'],
          'Cảm giác thân thể dùng « avoir », không có article.',
          'Bodily sensations use « avoir » with no article.')
      ]
    },

    /* -----------------------------------------------------
       12. L'adjectif (2) — p. 54–56
       ----------------------------------------------------- */
    {
      id: 'gp-adj2', num: 12, part: 'world', minutes: 8,
      title: "L'adjectif (2)",
      subtitle: { vi: 'Tính từ (2): vị trí và ý nghĩa', en: 'Adjectives (2): position and meaning' },
      summary: {
        vi: 'Tính từ thường đứng SAU danh từ, nhưng vài từ ngắn quen thuộc đứng TRƯỚC. Vị trí thay đổi nghĩa: un homme pauvre (nghèo) khác un pauvre homme (đáng thương).',
        en: 'Adjectives usually come AFTER the noun, but a few short common ones come BEFORE. Position changes meaning: un homme pauvre (poor man) differs from un pauvre homme (wretched man).'
      },
      blocks: [
        P('Vị trí tính từ là phần “trông Tây” nhất của câu Pháp. Quy tắc chung: sau danh từ; các từ ngắn và thân thuộc thì trước.',
          'Adjective position is what makes a French sentence look native. General rule: after the noun; short, familiar ones go before.'),
        H('Đặt sau hay trước?', 'After or before?'),
        TABLE([C('Vị trí', 'Position'), C('Danh sách', 'List'), C('Ví dụ', 'Example')], [
          [C('SAU danh từ (mặc định)', 'AFTER the noun (default)'), C('hầu hết mọi tính từ', 'most adjectives'), C('une chemise blanche, un livre intéressant', 'une chemise blanche, un livre intéressant')],
          [C('TRƯỚC danh từ', 'BEFORE the noun'), C('beau, joli, bon, mauvais, petit, grand, gros, nouveau, jeune, vieux, double, demi, autre, même', 'beau, joli, bon, mauvais, petit, grand, gros, nouveau, jeune, vieux, double, demi, autre, même'), C('une petite maison, un joli chat, un gros livre', 'une petite maison, un joli chat, un gros livre')],
          [C('TRƯỚC (luôn)', 'BEFORE (always)'), C('số đếm, premier, dernier, prochain (khi đánh số)', 'numbers, premier, dernier, prochain (in a series)'), C('les trois cochons, le premier candidat', 'les trois cochons, le premier candidat')]
        ]),
        H('Nghĩa đổi theo vị trí', 'Meaning changes with position'),
        TABLE([C('SAU (khách quan)', 'AFTER (objective)'), C('TRƯỚC (chủ quan)', 'BEFORE (subjective)')], [
          [C('un homme très grand (cao)', 'un homme très grand (tall)'), C('un grand homme (vĩ đại)', 'un grand homme (great)')],
          [C('un homme pauvre (nghèo)', 'un homme pauvre (poor)'), C('un pauvre homme (đáng thương)', 'un pauvre homme (wretched)')],
          [C('une chambre propre (sạch)', 'une chambre propre (clean)'), C('ma propre chambre (của riêng tôi)', 'ma propre chambre (my own)')],
          [C('un immeuble ancien (cũ)', 'un immeuble ancien (old)'), C('mon ancien immeuble (trước kia)', 'mon ancien immeuble (former)')]
        ]),
        H('Ba điểm dễ nhớ', 'Three things to remember'),
        LIST([
          'Trước nguyên âm: bel acteur, vieil homme, nouvel ordinateur (thay cho beau/vieux/nouveau).',
          'Trước tính từ, « des » → « de » : de bons amis, de beaux livres.',
          '« Neuf » = mới nguyên bản, đặt SAU (une voiture neuve). « Nouveau » = thay cái khác, đặt TRƯỚC (une nouvelle voiture).'
        ], [
          'Before a vowel: bel acteur, vieil homme, nouvel ordinateur (instead of beau/vieux/nouveau).',
          'Before an adjective, « des » becomes « de »: de bons amis, de beaux livres.',
          '« Neuf » = brand new, AFTER the noun (une voiture neuve). « Nouveau » = replacing another, BEFORE (une nouvelle voiture).'
        ]),
        CALLOUT('tip', 'Tính từ đặt trước danh từ có xu hướng KHÁCH QUAN: un ancien professeur (cựu giáo viên) ≠ un professeur ancien (già).',
          'An adjective before the noun tends to be SUBJECTIVE: un ancien professeur (former teacher) ≠ un professeur ancien (an old teacher).')
      ],
      exercises: [
        FILL('Ce sont {{1}} amis. (bon)', ['de'],
          '« Des » đổi thành « de » khi đứng trước tính từ: de bons amis.',
          '« Des » becomes « de » before an adjective: de bons amis.'),
        CHOICE('Tính từ nào ĐẶT TRƯỚC danh từ?', 'Which adjective goes BEFORE the noun?',
          ['joli', 'blanc', 'intéressant'], 0,
          '« Joli » là một trong các từ ngắn quen thuộc đặt trước; hai kia đặt sau.',
          '« Joli » is one of the short familiar ones placed before; the other two follow the noun.'),
        TRANSLATE('Một cuốn sách hay.', 'A good/interesting book.',
          ['Un livre intéressant.', 'Un bon livre.'],
          '« Intéressant » đặt sau; « bon » đặt trước — cả hai đều đúng, khác sắc thái.',
          '« Intéressant » follows the noun; « bon » precedes it — both are correct, with different nuance.')
      ]
    },

    /* -----------------------------------------------------
       13. Les nombres — p. 58–62
       ----------------------------------------------------- */
    {
      id: 'gp-nombres', num: 13, part: 'world', minutes: 9,
      title: 'Les nombres',
      subtitle: { vi: 'Số đếm: viết, đọc và dùng', en: 'Numbers: writing, reading and using them' },
      summary: {
        vi: 'Đặc trưng của tiếng Pháp: 70 = soixante-dix, 80 = quatre-vingts, 90 = quatre-vingt-dix. Khi viết, chỉ « vingt » và « cent » thêm « -s » khi bị nhân.',
        en: 'French signatures: 70 = soixante-dix, 80 = quatre-vingts, 90 = quatre-vingt-dix. In writing, only « vingt » and « cent » take an « -s » when multiplied.'
      },
      blocks: [
        P('Số đếm Pháp ghép bằng dấu gạch nối đến 100; các chục đặc biệt dùng cấu trúc 60+x, 4×20+x. Số thứ tự thêm « -ième ».',
          'French numerals are hyphenated up to 100, with the special tens built as 60+x and 4×20+x. Ordinals add « -ième ».'),
        H('Các số chính', 'The key numbers'),
        TABLE([C('Số', 'Number'), C('Cách viết', 'Written'), C('Số', 'Number'), C('Cách viết', 'Written')], [
          [C('11–19', '11–19'), C('onze, douze, treize… dix-neuf', 'onze, douze, treize… dix-neuf'), C('60–69', '60–69'), C('soixante, soixante et un… soixante-dix (70)', 'soixante, soixante et un… soixante-dix (70)')],
          [C('21, 31, 41, 51, 61', '21, 31, 41, 51, 61'), C('… et un (soixante et un)', '… et un (soixante et un)'), C('80, 90', '80, 90'), C('quatre-vingts, quatre-vingt-dix', 'quatre-vingts, quatre-vingt-dix')],
          [C('71–79, 91–99', '71–79, 91–99'), C('soixante et onze, quatre-vingt-onze…', 'soixante et onze, quatre-vingt-onze…'), C('100 / 1000', '100 / 1000'), C('cent / mille', 'cent / mille')]
        ], 'Thụy Sĩ và Bỉ nói septante (70) và nonante (90). / In Switzerland and Belgium people say septante (70) and nonante (90).'),
        H('Khi viết', 'In writing'),
        LIST([
          'Số đếm không đổi dạng theo danh từ: deux livres, deux cents livres.',
          '« Vingt » và « cent » thêm « -s » CHỈ KHI bị nhân và đứng cuối: quatre-vingts, trois cents. Theo sau số khác thì không: quatre-vingt-trois, trois cent cinquante.',
          '« Mille » luôn không đổi; « million », « milliard » thì có số nhiều: trois millions, dix milliards. Sau chúng cần « de » : un milliard d’euros.',
          'Đến 100, số ghép nối bằng gạch: dix-sept, soixante-douze. 21/31/41/51/61/71 nối bằng « et »: soixante et un, soixante et onze.'
        ], [
          'Cardinals are generally invariable: Les Cent Familles.',
          '« Vingt » and « cent » add « -s » ONLY when multiplied and final: quatre-vingts, trois cents. Before another number they stay bare: quatre-vingt-trois, trois cent cinquante.',
          '« Mille » is always invariable; « million », « milliard » pluralise: trois millions, dix milliards. They need « de » after them: un milliard d’euros.',
          'Up to 100, compounds take hyphens: dix-sept, soixante-douze. 21/31/41/51/61/71 link with « et »: soixante et un, soixante et onze.'
        ]),
        H('Số thứ tự và đơn vị', 'Ordinals and units'),
        LIST([
          'Thứ tự: premier, deuxième/second, troisième… vingtième, centième. Nhấn mạnh vị trí đầu: « en premier ».',
          'Đơn vị: une dizaine (~10), une douzaine (12), une centaine (~100); 1/2 = un demi, 1/3 = un tiers, 1/4 = un quart; 10% = dix pour cent.',
          '« Nombre » = số lượng đếm được (le nombre d’abonnés); « numéro » = số thứ tự (votre numéro de téléphone).',
          '« An » + số đếm (il a vingt ans, deux fois par an); « année » + thứ tự/tính từ (en deuxième année, toute l’année).'
        ], [
          'Ordinals: premier, deuxième/second, troisième… vingtième, centième. For first place: « en premier ».',
          'Units: une dizaine (~10), une douzaine (12), une centaine (~100); 1/2 = un demi, 1/3 = un tiers, 1/4 = un quart; 10% = dix pour cent.',
          '« Nombre » = countable quantity (le nombre d’abonnés); « numéro » = position in a series (votre numéro de téléphone).',
          '« An » + cardinals (il a vingt ans, deux fois par an); « année » + ordinals/adjectives (en deuxième année, toute l’année).'
        ]),
        EXAMPLES([
          EX('J’ai vingt-cinq ans et je pars deux fois par an.', 'Tôi hai mươi lăm tuổi và đi hai lần mỗi năm.', 'I am twenty-five and I leave twice a year.'),
          EX('La réunion a lieu à la salle 3, deuxième étage.', 'Cuộc họp ở phòng 3, tầng hai.', 'The meeting is in room 3, second floor.')
        ])
      ],
      exercises: [
        FILL('J’ai {{1}} ans. (21)', ['vingt et un', 'vingt-et-un'],
          '21 viết là « vingt et un », nối bằng « et ».',
          '21 is written « vingt et un », linked by « et ».'),
        CHOICE('Cách viết nào đúng?', 'Which spelling is correct?',
          ['trois cent cinquante', 'trois cents cinquante', 'trois cents et cinquante'], 0,
          'Theo sau số khác thì « cent » không thêm « s ».',
          'Followed by another number, « cent » takes no « s ».'),
        TRANSLATE('Tôi có hai mươi mốt thẻ.', 'I have twenty-one cards.',
          ['J’ai vingt et un cartes.'],
          '21 = « vingt et un », sau « avoir » + danh từ số nhiều.',
          '21 = « vingt et un », after « avoir » + a plural noun.')
      ]
    },

    /* -----------------------------------------------------
       14. Le temps (1) — p. 64–66
       ----------------------------------------------------- */
    {
      id: 'gp-temps1', num: 14, part: 'world', minutes: 8,
      title: 'Le temps (1) : jour, date, heure',
      subtitle: { vi: 'Thời gian (1): ngày, tháng, giờ, thời tiết', en: 'Time (1): days, dates, hours, weather' },
      summary: {
        vi: 'Ngày tháng luôn đi với mạo từ « le » (nous sommes le 3 février); mùa dùng au/en; giờ nói bằng « il est » và thời tiết bằng « il fait ».',
        en: 'Dates always take the article « le » (nous sommes le 3 février); seasons take au/en; time is told with « il est » and weather with « il fait ».'
      },
      blocks: [
        P('Nói ngày giờ trong tiếng Pháp là thuộc lòng vài cấu trúc bất định: nous sommes + date, il est + heure, il fait + thời tiết.',
          'Talking about time means owning a few impersonal structures: nous sommes + date, il est + time, il fait + weather.'),
        H('Ngày, thứ, tháng, mùa', 'Days, dates, months, seasons'),
        LIST([
          'Ngày tháng: nous sommes / on est + le + ngày — Nous sommes le 21 juin. Kèm thứ: le mercredi 18 août.',
          'Số tháng: « le premier » nhưng « le deux, le trois… ».',
          'Thứ: lundi… dimanche. « Lundi » = thứ Hai này; « le lundi » = MÔI thứ Hai. « Le matin » = mỗi sáng (Je dors le matin).',
          'Tháng: en mars / au mois de mars / début mars, mi-mars, fin mars (không article).',
          'Mùa: au printemps, en été, en automne, en hiver. Năm: en 2013. Thế kỷ: au XXe siècle.'
        ], [
          'Dates: nous sommes / on est + le + day — Nous sommes le 21 juin. With the weekday: le mercredi 18 août.',
          'Day of month: « le premier » but « le deux, le three… ».',
          'Weekdays: lundi… dimanche. « Lundi » = this Monday; « le lundi » = every Monday. « Le matin » = in the mornings (Je dors le matin).',
          'Months: en mars / au mois de mars / début mars, mi-mars, fin mars (no article).',
          'Seasons: au printemps, en été, en automne, en hiver. Years: en 2013. Centuries: au XXe siècle.'
        ]),
        H('Giờ và hẹn hò', 'Time and appointments'),
        TABLE([C('Giờ', 'Time'), C('Cách nói', 'Said as')], [
          [C('8:05', '8:05'), C('huit heures cinq', 'huit heures cinq')],
          [C('8:15', '8:15'), C('huit heures et quart', 'huit heures et quart')],
          [C('8:30', '8:30'), C('huit heures et demie', 'huit heures et demie')],
          [C('8:55', '8:55'), C('neuf heures moins cinq', 'neuf heures moins cinq')],
          [C('8:45', '8:45'), C('neuf heures moins le quart', 'neuf heures moins le quart')]
        ], '12 h = midi, 24 h = minuit. « Une demi-heure » nhưng « une heure et demie ». Giờ chính thức: vingt heures vingt-cinq. / 12 h = midi, 24 h = minuit. “Une demi-heure” but “une heure et demie”. Official time: vingt heures vingt-cinq.'),
        H('Thời tiết', 'The weather'),
        TABLE([C('Cấu trúc', 'Structure'), C('Ví dụ', 'Example')], [
          [C('il fait + tính từ', 'il fait + adjective'), C('il fait chaud / froid / beau / mauvais', 'il fait chaud / froid / beau / mauvais')],
          [C('il y a + partitif', 'il y a + partitive'), C('il y a du soleil / du vent / des nuages', 'il y a du soleil / du vent / des nuages')],
          [C('il + động từ bất định', 'il + impersonal verb'), C('il pleut / il neige / il fait 10°', 'il pleut / il neige / il fait 10°')]
        ]),
        CALLOUT('tip', 'Đúng: « Aujourd’hui, il fait froid. » Sai: « il est froid ». Và trễ/gặp đúng giờ: en retard / à l’heure / en avance.',
          'Correct: “Aujourd’hui, il fait froid.” Never “il est froid”. And: en retard / à l’heure / en avance for late/on time/early.')
      ],
      exercises: [
        FILL('Nous sommes {{1}} 2013.', ['en'],
          'Năm dùng « en » : en 2013.',
          'Years take « en »: en 2013.'),
        CHOICE('Cách đọc 8h15?', 'How do you say 8:15?',
          ['huit heures et quart', 'huit heures quart', 'huit heures et demie'], 0,
          '15 phút sau giờ là « et quart »; 30 phút là « et demie ».',
          'Fifteen past is « et quart »; thirty past is « et demie ».'),
        TRANSLATE('Hôm nay trời lạnh.', 'Today the weather is cold.',
          ["Aujourd'hui, il fait froid."],
          'Thời tiết dùng « il fait » + tính từ, không dùng « être ».',
          'Weather uses « il fait » + adjective, never « être ».')
      ]
    },

    /* -----------------------------------------------------
       15. Les indéfinis — p. 68–70
       ----------------------------------------------------- */
    {
      id: 'gp-indef', num: 15, part: 'world', minutes: 8,
      title: 'Les indéfinis',
      subtitle: { vi: 'Từ bất định chỉ số lượng', en: 'Indefinite words of quantity' },
      summary: {
        vi: 'Quelques / plusieurs / chaque / tous / certains / aucun chỉ số lượng và bao quát. « Aucun » tự phủ định nên không dùng chung với « pas »; « d’autres » không bao giờ là « des autres ».',
        en: 'Quelques / plusieurs / chaque / tous / certains / aucun express quantity and generality. « Aucun » negates by itself, so never with « pas »; « d’autres » is never « des autres ».'
      },
      blocks: [
        P('Từ bất định đứng trước danh từ (hoặc thay nó) và quyết định câu nói về “mấy cái” hay “tất cả”.',
          'Indefinite words stand before the noun (or replace it) and decide whether a sentence is about some or all.'),
        H('Adjectif bất định', 'Indefinite adjectives'),
        TABLE([C('Từ', 'Word'), C('Nghĩa', 'Meaning')], [
          [C('quelques', 'quelques'), C('một số ít', 'a small number')],
          [C('plusieurs', 'plusieurs'), C('vài (nhiều hơn một)', 'several (more than one)')],
          [C('chaque', 'chaque'), C('từng cái (số ít)', 'each one (singular)')],
          [C('tous / toutes', 'tous / toutes'), C('tất cả', 'all')],
          [C('certains / d’autres', 'certains / d’autres'), C('một số / số khác', 'some / others')],
          [C('aucun(e)', 'aucun(e)'), C('không cái nào (= pas un seul)', 'not a single one')]
        ]),
        H('Những luật hay mắc', 'The usual traps'),
        LIST([
          '« Chaque » LUÔN số ít: Chaque étudiant a un livre. Với thời gian: tous les jours (= chaque jour), không nói « chaque deux jours ».',
          '« Aucun » đã phủ định: Je ne connais aucun étudiant. / Aucun étudiant n’est venu. — KHÔNG: « pas aucun ».',
          '« Quelques » luôn số nhiều. « D’autres » = pluriel của « un(e) autre »: J’attends d’autres étudiants (không « des autres »).',
          '« Tout » đồng ý: tout le groupe, toute la classe, tous les étudiants, toutes les étudiantes.'
        ], [
          '« Chaque » is ALWAYS singular: Chaque étudiant a un livre. With time: tous les jours (= chaque jour), never « chaque deux jours ».',
          '« Aucun » is already negative: Je ne connais aucun étudiant. / Aucun étudiant n’est venu. — NEVER « pas aucun ».',
          '« Quelques » is always plural. « D’autres » is the plural of « un(e) autre »: J’attends d’autres étudiants (not « des autres »).',
          '« Tout » agrees: tout le groupe, toute la classe, tous les étudiants, toutes les étudiantes.'
        ]),
        H('Đại từ bất định', 'Indefinite pronouns'),
        LIST([
          'Dạng đại từ giống adjectif, thêm quelques-un(e)s và chacun(e). « Tous » đứng sau động từ: Ils sont tous sympathiques.',
          'Đọc khác nhau: adjectif /tu/ (tous les étudiants) nhưng pronom /tus/ (ils sont tous là).',
          '« Quelqu’un / quelque chose / quelque part » đối lập với personne / rien / nulle part; thêm « de » trước tính từ: quelqu’un d’intelligent. Các từ này không đổi.',
          '« Tout » trung tính chỉ việc: Tout va bien. / Je comprends tout. Cảm ơn: Merci à tous (người) / Merci pour tout (việc).'
        ], [
          'Pronouns mirror the adjectives, plus quelques-un(e)s and chacun(e). « Tous » comes after the verb: Ils sont tous sympathiques.',
          'Different pronunciation: adjective /tu/ (tous les étudiants) but pronoun /tus/ (ils sont tous là).',
          '« Quelqu’un / quelque chose / quelque part » oppose personne / rien / nulle part; add « de » before an adjective: quelqu’un d’intelligent. These words never change.',
          'Neuter « Tout » refers to things: Tout va bien. / Je comprends tout. Thanks: Merci à tous (people) / Merci pour tout (things).'
        ]),
        EXAMPLES([
          EX('J’ai lu plusieurs romans de Duras et aucun roman de Zola.', 'Tôi đã đọc vài cuốn của Duras và không cuốn nào của Zola.', 'I have read several novels by Duras and none by Zola.'),
          EX('Chaque étudiant a un livre.', 'Mỗi sinh viên có một quyển sách.', 'Each student has a book.')
        ])
      ],
      exercises: [
        FILL('Je ne connais {{1}} étudiant de cette classe.', ['aucun'],
          '« Aucun » đứng sau « ne » để phủ định toàn bộ: aucun… ne.',
          '« Aucun » sits after « ne » to negate the whole sentence: aucun… ne.'),
        CHOICE('Đúng: « J’attends ___ étudiants. »', 'Correct: “J’attends ___ étudiants.”',
          ['d’autres', 'des autres', 'autres'], 0,
          '« D’autres » là đại từ/số nhiều của « un autre » đã có mạo từ.',
          '« D’autres » is the pronoun/plural of « un autre », already carrying the article.'),
        TRANSLATE('Mỗi sinh viên đều có một quyển sách.', 'Each student has a book.',
          ['Chaque étudiant a un livre.'],
          '« Chaque » luôn đi với danh từ số ít và không có article.',
          '« Chaque » always takes a singular noun with no article.')
      ]
    },

    /* -----------------------------------------------------
       16. Les verbes en « -er » au présent — p. 74–76
       ----------------------------------------------------- */
    {
      id: 'gp-er', num: 16, part: 'world', minutes: 8,
      title: 'Les verbes en « -er » au présent',
      subtitle: { vi: 'Động từ -er ở hiện tại', en: 'First-conjugation verbs in the present' },
      summary: {
        vi: 'Nhóm -er đông nhất tiếng Pháp và gần như đều quy: bỏ « -er », thêm e/es/e/ons/ez/ent. Chỉ vài biến thể ghi -ge, -ç và các radical đổi âm (acheter → j’achète).',
        en: 'The largest French group, almost perfectly regular: drop « -er », add e/es/e/ons/ez/ez/ent. Only a few written variants (-ge, -ç) and stem-changing verbs (acheter → j’achète).'
      },
      blocks: [
        P('Hầu hết động từ mới đều thuộc nhóm này (télécharger, photocopier…). Radical = infinitif bỏ « -er ».',
          'Almost every new verb belongs here (télécharger, photocopier…). Stem = the infinitive minus « -er ».'),
        H('Chia động từ', 'Conjugation'),
        TABLE([C('Ngôi', 'Person'), C('Radical +', 'Stem +'), C('Ví dụ parler / dîner', 'Example: parler / dîner')], [
          [C('je', 'je'), C('-e', '-e'), C('je parle, je dîne', 'je parle, je dîne')],
          [C('tu', 'tu'), C('-es', '-es'), C('tu parles, tu dînes', 'tu parles, tu dînes')],
          [C('il / elle / on', 'il / elle / on'), C('-e', '-e'), C('il parle, elle dîne', 'il parle, elle dîne')],
          [C('nous', 'nous'), C('-ons', '-ons'), C('nous parlons, nous dînons', 'nous parlons, nous dînons')],
          [C('vous', 'vous'), C('-ez', '-ez'), C('vous parlez, vous dînez', 'you speak, you dine')],
          [C('ils / elles', 'ils / elles'), C('-ent', '-ent'), C('ils parlent, elles dînent', 'ils parlent, elles dînent')]
        ]),
        H('Viết và đọc', 'Spelling and pronunciation'),
        LIST([
          'Phát âm: finales câm ở je/tu/il/ils (chỉ nghe radical), nhưng nous/vous phát âm -ons/-ez.',
          'Verbes -ier giữ « i » : j’étudie, j’apprécie. « Je » → « j’ » trước nguyên âm: j’arrive, j’habite.',
          'Radical ends -g hoặc -c thì thêm ge/ç trước o: nous voyageons, nous commençons.',
          'Verbes đổi radical khi câm: acheter → j’achète / nous achetons; appeler → j’appelle; jeter → je jette; préférer → il préfère; envoyer → j’envoie. Verbes -ayer: je paie ou je paye (cả hai đúng).'
        ], [
          'Pronunciation: silent endings on je/tu/il/ils (only the stem is heard), but nous/vous sound out -ons/-ez.',
          'Verbes -ier keep the « i »: j’étudie, j’apprécie. « Je » → « j’ » before a vowel: j’arrive, j’habite.',
          'A stem ending in -g or -c adds ge/ç before o: nous voyageons, nous commençons.',
          'Stem-changing verbs when mute: acheter → j’achète / nous achetons; appeler → j’appelle; jeter → je jette; préférer → il préfère; envoyer → j’envoie. Verbes -ayer: je paie or je paye (both correct).'
        ]),
        CALLOUT('tip', 'Phủ định đặt quanh động từ đã chung: Je ne parle pas. / Vous ne parlez pas — không đổi radical khi phủ định.',
          'Negation wraps the conjugated verb as usual: Je ne parle pas. / Vous ne parlez pas — the stem never changes.')
      ],
      exercises: [
        FILL('Nous {{1}} (voyager) en train.', ['voyageons'],
          'Radical « voyage- » tận cùng bằng -g, nên thêm -ge- trước « ons »: voyageons.',
          'The stem « voyage- » ends in -g, so add -ge- before « ons »: voyageons.'),
        FILL('Tu {{1}} (étudier) le français.', ['étudies'],
          'Verbes -ier: bỏ -er, thêm -es → tu étudies (giữ i).',
          'Verbes -ier: drop -er, add -es → tu étudies (keep the i).'),
        CHOICE('Chọn đúng: « Nous ___ (commencer) à neuf heures. »', 'Choose correctly: “Nous ___ (commencer) à neuf heures.”',
          ['commençons', 'commencons', 'commençons-t'], 0,
          'Radical -c trước « ons » viết thành « -çons ».',
          'A -c stem before « ons » is written « -çons ».')
      ]
    },

    /* -----------------------------------------------------
       17. Le temps (2) : la durée — p. 80
       ----------------------------------------------------- */
    {
      id: 'gp-temps2', num: 17, part: 'world', minutes: 6,
      title: 'Le temps (2) : la durée au présent',
      subtitle: { vi: 'Thời gian (2): thời lượng với depuis, pour, pendant, en', en: 'Time (2): duration with depuis, pour, pendant, en' },
      summary: {
        vi: 'Bốn từ chỉ thời lượng và nghĩa khác nhau: depuis (từ lúc đó đến giờ), pour (dự kiến), pendant (trong lúc làm), en (cần bấy nhiêu thời gian).',
        en: 'Four words for duration, four meanings: depuis (from then until now), pour (planned for), pendant (throughout an action), en (the time it takes).'
      },
      blocks: [
        P('Nói “một việc kéo dài bao lâu” phải chọn đúng một trong bốn từ — đây là điểm DELF phân biệt người học cẩn thận.',
          'Saying “how long something lasts” means picking the right one of four words — a classic DELF discriminator.'),
        TABLE([C('Từ', 'Word'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('depuis', 'depuis'), C('từ (mốc) đến giờ — việc vẫn tiếp', 'from a point until now — still true'), C('Je suis professeur depuis 1981. / depuis 15 ans.', 'I have been a teacher since 1981 / for 15 years.')],
          [C('pour', 'pour'), C('dự kiến trong bấy nhiêu thời gian', 'planned for that long'), C('Je suis en stage pour trois jours.', 'I am on placement for three days.')],
          [C('pendant', 'pendant'), C('trong suốt lúc làm việc (không bắt buộc)', 'throughout the action (often dropped)'), C('Je me brosse les dents pendant cinq minutes.', 'I brush my teeth for five minutes.')],
          [C('en', 'en'), C('cần bấy nhiêu thời gian để làm xong', 'the time needed to finish'), C('Je fais 3 km en une heure.', 'I do 3 km in an hour.')]
        ]),
        H('Đầu câu và trước động từ', 'At the start and before a verb'),
        LIST([
          'Đầu câu với depuis: Il y a 15 ans que je suis professeur. / Ça fait 15 ans que…',
          'Trước động từ: depuis que — Depuis que je fais du sport, je dors mieux.',
          '« Pendant » thường bị bỏ khi ở giữa câu (Je dors huit heures), giữ lại khi nhấn đầu câu: Pendant deux heures, je ne pense à rien.',
          'Phân biệt: Tous les jours, je nage pendant 1 h (nước rút…); Je fais 3 km en 1 h (cần 1 giờ).'
        ], [
          'Opening with depuis: Il y a 15 ans que je suis professeur. / Ça fait 15 ans que…',
          'Before a verb: depuis que — Depuis que je fais du sport, je dors mieux.',
          '« Pendant » is often dropped mid-sentence (Je dors huit heures) but kept for emphasis at the start: Pendant deux heures, je ne pense à rien.',
          'Contrast: Tous les jours, je nage pendant 1 h (you keep swimming); Je fais 3 km en 1 h (it takes an hour).'
        ]),
        CALLOUT('english', 'Tiếng Anh nói “for 15 years” với cả depuis lẫn pour. Tiếng Pháp phân biệt: vẫn còn → depuis; kết thúc/dự kiến → pour.',
          'English says “for 15 years” for both. French distinguishes: still true → depuis; finished/planned → pour.')
      ],
      exercises: [
        FILL('Je suis professeur {{1}} 1981.', ['depuis'],
          'Mốc thời gian bắt đầu mà việc còn tiếp → « depuis ».',
          'A starting point that still holds → « depuis ».'),
        CHOICE('Tôi làm 3 km ___ một giờ. (cần thời gian)', 'I do 3 km ___ an hour. (time needed)',
          ['en', 'depuis', 'pendant'], 0,
          '« En » chỉ thời gian CẦN để hoàn thành; « pendant » chỉ lúc việc diễn ra.',
          '« En » gives the time NEEDED to finish; « pendant » the time it runs.'),
        TRANSLATE('Tôi ở đây từ ba tháng nay.', 'I have been here for three months.',
          ['Je suis ici depuis trois mois.'],
          'Vẫn còn ở đây → « depuis » + thời lượng.',
          'Still here → « depuis » + duration.')
      ]
    },

    /* -----------------------------------------------------
       18. L'adverbe — p. 82–84
       ----------------------------------------------------- */
    {
      id: 'gp-adverbe', num: 18, part: 'degree', minutes: 8,
      title: 'L’adverbe',
      subtitle: { vi: 'Trạng từ: bon/bien, vite, très/beaucoup', en: 'Adverbs: bon/bien, vite, très/beaucoup' },
      summary: {
        vi: 'Tính từ bổ nghĩa danh từ, trạng từ bổ nghĩa động từ, tính từ hay trạng từ khác. Ba cặp hay lẫn: bon/bien, rapide/vite, très/beaucoup.',
        en: 'Adjectives describe nouns; adverbs describe verbs, adjectives or other adverbs. Three pairs trip learners up: bon/bien, rapide/vite, très/beaucoup.'
      },
      blocks: [
        P('Câu « Il a un bon accent » nói về danh từ accent; « Il parle bien » nói về hành động parle. Cùng nghĩa “tốt” nhưng khác loại từ.',
          '“Il a un bon accent” describes the noun accent; “Il parle bien” describes the action parle. Same idea of “good”, different word class.'),
        H('Bon / bien', 'Bon / bien'),
        TABLE([C('Từ', 'Word'), C('Loại', 'Type'), C('Ví dụ', 'Example')], [
          [C('bon / bonne', 'bon / bonne'), C('tính từ', 'adjective'), C('Alain est un bon acteur. / Lili est une mauvaise actrice.', 'Alain is a good actor. / Lili is a bad actress.')],
          [C('bien / mal', 'bien / mal'), C('trạng từ', 'adverb'), C('Il joue bien. / Elle joue mal.', 'He acts well. / She acts badly.')]
        ]),
        LIST([
          '« C’est bon » = vị giác, cảm giác (C’est bon, le chocolat). « C’est bien » = mọi thứ khác (C’est bien, le cinéma).',
          '« C’est mal » = phán xét đạo đức: Mentir, c’est mal.',
          'Nghĩa khác: — C’est bon ? (= ok, ổn rồi) / — Ça fait bien cinquante-cinq euros ? — Oui, c’est bien ça. (= đúng là thế).'
        ], [
          '« C’est bon » = taste, physical sensation (C’est bon, le chocolat). « C’est bien » = everything else (C’est bien, le cinéma).',
          '« C’est mal » = moral judgement: Mentir, c’est mal.',
          'Other meanings: — C’est bon ? (= that’s fine, OK) / — Ça fait bien cinquante-cinq euros ? — Oui, c’est bien ça. (= that’s right).'
        ]),
        H('Rapide / vite, très / beaucoup', 'Rapide / vite, très / beaucoup'),
        TABLE([C('Tính từ', 'Adjective'), C('Trạng từ', 'Adverb')], [
          [C('Ce train est rapide. / Ces trains sont lents.', 'This train is fast. / These trains are slow.'), C('Il roule vite. / Ils roulent lentement.', 'He drives fast. / They drive slowly.')]
        ]),
        LIST([
          '« Très » + tính từ / trạng từ: Il est très bavard. Il parle très bien.',
          '« Beaucoup » + động từ: Il parle beaucoup. Không nói « il dort très beaucoup ».',
          'Với avoir froid/peur/mal… dùng « très »: J’ai très froid (không « beaucoup froid »).',
          'Sắc thái của « aimer »: J’aime bien Marie (quý) < J’aime beaucoup Marie (bạn thân) < J’aime Marie (yêu).'
        ], [
          '« Très » + adjective / adverb: Il est très bavard. Il parle très bien.',
          '« Beaucoup » + verb: Il parle beaucoup. Never « il dort très beaucoup ».',
          'With avoir froid/peur/mal… use « très »: J’ai très froid (not « beaucoup froid »).',
          'Degrees of « aimer »: J’aime bien Marie (like) < J’aime beaucoup Marie (good friend) < J’aime Marie (love).'
        ]),
        H('Trạng từ đuôi -ment', 'Adverbs in -ment'),
        LIST([
          'Ghép vào giống cái của tính từ: lent → lente → lentement; doux → douce → doucement; heureux → heureuse → heureusement; sec → sèche → sèchement.',
          'Tính từ tận cùng bằng nguyên âm thì ghép vào giống đực: poli → poliment; vrai → vraiment; absolu → absolument.',
          'Tính từ -ent / -ant → -emment / -amment, đọc [a-ment]: récent → récemment; fréquent → fréquemment; suffisant → suffisamment.',
          'Ngoại lệ: gentil → gentiment; gai → gaiement; énorme → énormément; profond → profondément; précis → précisément.'
        ], [
          'Add -ment to the feminine: lent → lente → lentement; doux → douce → doucement; heureux → heureuse → heureusement; sec → sèche → sèchement.',
          'Adjectives ending in a vowel take -ment on the masculine: poli → poliment; vrai → vraiment; absolu → absolument.',
          'Adjectives in -ent / -ant become -emment / -amment, pronounced [a-ment]: récent → récemment; fréquent → fréquemment; suffisant → suffisamment.',
          'Irregular: gentil → gentiment; gai → gaiement; énorme → énormément; profond → profondément; précis → précisément.'
        ]),
        H('Trạng từ thời gian và nơi chốn', 'Time and place adverbs'),
        TABLE([C('Nhóm', 'Group'), C('Thang độ', 'Scale')], [
          [C('thời gian', 'time'), C('toujours – souvent – quelquefois – de temps en temps – rarement – jamais', 'toujours – souvent – quelquefois – de temps en temps – rarement – jamais')],
          [C('thời điểm', 'moment'), C('tôt – assez tôt – assez tard – tard – très tard', 'tôt – assez tôt – assez tard – tard – très tard')],
          [C('nơi chốn', 'place'), C('ici / là (cùng nghĩa); dedans ≠ dehors', 'ici / là (same meaning); dedans ≠ dehors')]
        ]),
        EXAMPLES([
          EX('Il comprend vite et il a un bon accent.', 'Anh ấy hiểu nhanh và có giọng tốt.', 'He understands quickly and has a good accent.'),
          EX('Je dîne souvent dehors, je mange rarement chez moi.', 'Tôi thường ăn tối ngoài, hiếm khi ăn ở nhà.', 'I often eat out, I rarely eat at home.')
        ])
      ],
      exercises: [
        FILL('Il parle {{1}} français. (trạng từ)', ['bien'],
          'Bổ nghĩa cho động từ « parle » phải dùng trạng từ « bien ».',
          'Modifying the verb « parle » needs the adverb « bien ».'),
        CHOICE('Chọn đúng: « J’ai ___ froid. »', 'Choose correctly: “J’ai ___ froid.”',
          ['très', 'beaucoup', 'très beaucoup'], 0,
          'Với « avoir froid » dùng « très », không dùng « beaucoup ».',
          'With « avoir froid » use « très », not « beaucoup ».'),
        TRANSLATE('Cô ấy hát rất hay.', 'She sings very well.',
          ['Elle chante très bien.'],
          'Tính từ « bon » → trạng từ « bien »; « très » đứng trước trạng từ.',
          'Adjective « bon » → adverb « bien »; « très » precedes the adverb.')
      ]
    },

    /* -----------------------------------------------------
       19. L'expression de la quantité — p. 86–88
       ----------------------------------------------------- */
    {
      id: 'gp-quantite', num: 19, part: 'degree', minutes: 9,
      title: 'L’expression de la quantité',
      subtitle: { vi: 'Lượng: partitif, lượng xác định và phủ định', en: 'Quantity: partitives, defined and negative amounts' },
      summary: {
        vi: 'Lượng không xác định dùng partitif (du, de la, de l’, des); khi có lượng cụ thể (un kilo, beaucoup) hoặc phủ định (pas, jamais) thì thay bằng « de ».',
        en: 'An unspecified amount uses the partitive (du, de la, de l’, des); with a stated amount (un kilo, beaucoup) or a negation (pas, jamais), it becomes « de ».'
      },
      blocks: [
        P('Tiếng Pháp không nói “tôi uống trà” trống không: phải có partitif — Je bois du thé. Đây là chỗ người Việt hay bỏ mất.',
          'French never says “I drink tea” bare: the partitive is required — Je bois du thé. This is where Vietnamese speakers drop it.'),
        H('Partitif: lượng không xác định', 'The partitive: an unspecified amount'),
        TABLE([C('Dạng', 'Form'), C('Dùng với', 'Used with')], [
          [C('du', 'du'), C('danh từ đực: du poisson', 'masculine noun: du poisson')],
          [C('de la', 'de la'), C('danh từ cái: de la viande', 'feminine noun: de la viande')],
          [C('de l’', 'de l’'), C('trước nguyên âm / h câm: de l’huile', 'before a vowel / mute h: de l’huile')],
          [C('des', 'des'), C('danh từ số nhiều: des fruits', 'plural noun: des fruits')]
        ]),
        LIST([
          'Article xác định = toàn bộ, partitif = một phần: Le lait est bon pour la santé (sữa nói chung) / Buvez du lait (uống một ít sữa).',
          '« Des » vừa là article indéfini số nhiều của « un », vừa là partitif. Câu chia theo nghĩa.',
          'Không dùng partitif sau « sans »: Je mange de la salade sans huile.',
          'Các câu tổng quát đều dùng partitif: il y a du soleil et du vent; il y a des gens, du bruit et de la musique.'
        ], [
          'The definite article = the whole, the partitive = a part: Le lait est bon pour la santé (milk in general) / Buvez du lait (drink some milk).',
          '« Des » is both the plural indefinite article of « un » and a partitive. Context decides the reading.',
          'No partitive after « sans »: Je mange de la salade sans huile.',
          'General statements take the partitive: il y a du soleil et du vent; il y a des gens, du bruit et de la musique.'
        ]),
        H('Khi lượng đã được nói ra: « de »', 'When the amount is stated: « de »'),
        TABLE([C('Kiểu lượng', 'Kind of amount'), C('Ví dụ', 'Example')], [
          [C('chính xác', 'precise'), C('un kilo de sucre, cent grammes de beurre, un demi-kilo de viande', 'a kilo of sugar, a hundred grams of butter, half a kilo of meat')],
          [C('tổng quát', 'general'), C('beaucoup de sucre, un peu de sucre, assez de sucre', 'a lot of sugar, a little sugar, enough sugar')],
          [C('hình thức', 'unit'), C('un morceau de sucre, une cuillerée de sucre, un paquet de sucre', 'a sugar lump, a spoonful of sugar, a packet of sugar')]
        ]),
        H('Phủ định và ngoại lệ', 'Negation and exceptions'),
        LIST([
          'Phủ định: « de » thay partitif — Je n’achète pas de viande. Je ne bois jamais de café. Je n’ai plus de fruits.',
          'Nhưng giữ partitif khi đối lập: — C’est du miel ? — Non, ce n’est pas du miel, c’est de la confiture.',
          '« Avoir besoin de / envie de » không bao giờ có partitif: J’ai besoin de vacances. J’ai envie de soleil.',
          'Không nói « beaucoup des amis »: beaucoup d’amis.'
        ], [
          'Negation: « de » replaces the partitive — Je n’achète pas de viande. Je ne bois jamais de café. Je n’ai plus de fruits.',
          'But keep the partitive in a contrast: — C’est du miel ? — Non, ce n’est pas du miel, c’est de la confiture.',
          '« Avoir besoin de / envie de » never take a partitive: J’ai besoin de vacances. J’ai envie de soleil.',
          'Never « beaucoup des amis »: beaucoup d’amis.'
        ]),
        EXAMPLES([
          EX('Le matin, je bois du thé et je mange des tartines.', 'Buổi sáng tôi uống trà và ăn bánh mì.', 'In the morning I drink tea and eat bread and butter.'),
          EX('Il y a beaucoup de monde et un peu de bruit.', 'Có nhiều người và hơi ồn.', 'There are a lot of people and a little noise.')
        ])
      ],
      exercises: [
        FILL('Le matin, je bois {{1}} thé.', ['du'],
          'Danh từ đực « thé », lượng không xác định → « du ».',
          'Masculine noun « thé », unspecified amount → « du ».'),
        FILL('Je n’achète pas {{1}} viande.', ['de'],
          'Câu phủ định thay partitif bằng « de ».',
          'A negative sentence replaces the partitive with « de ».'),
        CHOICE('Chọn đúng: « Il y a ___ étudiants dans la salle. »', 'Choose correctly: “Il y a ___ étudiants dans la salle.”',
          ['beaucoup d’', 'beaucoup des', 'beaucoup de'], 0,
          'Sau « beaucoup » dùng « de », co vào « d’ » trước nguyên âm.',
          'After « beaucoup » use « de », elided to « d’ » before a vowel.')
      ]
    },

    /* -----------------------------------------------------
       20. Le pronom « en » — p. 90–92
       ----------------------------------------------------- */
    {
      id: 'gp-en', num: 20, part: 'degree', minutes: 8,
      title: 'Le pronom « en »',
      subtitle: { vi: 'Đại từ « en»: thay partitif và « de » + danh từ', en: 'The pronoun « en »: replaces partitives and « de » + noun' },
      summary: {
        vi: '« En » thay danh từ đi sau « de » — dù đó là partitif, con số hay động từ cấu trúc với « de ». Câu trả lời thiếu « en » là câu sai ngữ pháp.',
        en: '« En » replaces a noun introduced by « de » — partitive, number or a verb built with « de ». An answer without « en » is ungrammatical.'
      },
      blocks: [
        P('Người Pháp hỏi « Vous mangez de la viande ? » thì trả lời gọn là « Oui, j’en mange », chứ không lặp lại danh từ.',
          'Asked “Vous mangez de la viande ?”, French answers briefly with “Oui, j’en mange”, never repeating the noun.'),
        H('En thay partitif', 'En for partitives'),
        LIST([
          '— Vous buvez du vin ? — Oui, j’en bois. / — Vous achetez des surgelés ? — Oui, j’en achète.',
          'Phải có « en » kể cả khi nêu số lượng: — Vous avez des enfants ? — Oui, j’en ai deux. / — Il y a vingt étudiants ? — Non, il y en a trente.',
          '« Un(e) » được coi là số lượng: — Vous avez une voiture ? — Oui, j’en ai une.',
          'Không có « en » thì câu sai: không nói « Oui, il y a. » mà « Oui, il y en a. »'
        ], [
          '— Vous buvez du vin ? — Oui, j’en bois. / — Vous achetez des surgelés ? — Oui, j’en achète.',
          '« En » is required even with a stated number: — Vous avez des enfants ? — Oui, j’en ai deux. / — Il y a vingt étudiants ? — Non, il y en a trente.',
          '« Un(e) » counts as a number: — Vous avez une voiture ? — Oui, j’en ai une.',
          'Without « en » the sentence is wrong: not “Oui, il y a.” but “Oui, il y en a.”'
        ]),
        H('Phủ định với « en »', 'Negation with « en »'),
        LIST([
          '« Ne » đứng trước khối đại từ + động từ, « pas » đứng sau: — Vous avez des brioches ? — Non, je n’en ai pas.',
          '« Plus », « jamais », « rien » cũng đứng sau « en »: — Il y a du pain ? — Non, il n’y en a plus.',
          '« Un(e) » biến mất khi phủ định: — Vous avez un stylo ? — Non, je n’en ai pas.'
        ], [
          '« Ne » goes before the pronoun + verb block, « pas » after it: — Vous avez des brioches ? — Non, je n’en ai pas.',
          '« Plus », « jamais », « rien » also follow « en »: — Il y a du pain ? — Non, il n’y en a plus.',
          '« Un(e) » disappears in the negative: — Vous avez un stylo ? — Non, je n’en ai pas.'
        ]),
        H('En với động từ cấu trúc « de » + danh từ', 'En with verbs built on « de » + noun'),
        TABLE([C('Động từ', 'Verb'), C('Trả lời', 'Answer')], [
          [C('parler de son travail', 'parler de son travail'), C('il en parle souvent', 'il en parle souvent')],
          [C('rêver de son travail', 'rêver de son travail'), C('il en rêve la nuit', 'il en rêve la nuit')],
          [C('s’occuper de la gestion', 's’occuper de la gestion'), C('il s’en occupe', 'il s’en occupe')],
          [C('être content / fier de', 'être content / fier de'), C('il en est content / fier', 'il en est content / fier')],
          [C('avoir besoin / envie de', 'avoir besoin / envie de'), C('il en a besoin / envie', 'il en a besoin / envie')]
        ]),
        CALLOUT('trap', 'Với NGƯỜI không dùng « en » mà dùng « de » + đại từ nhấn: Je parle souvent de lui. Je me souviens d’eux. — « En » chỉ thay vật/việc, hoặc nơi chốn (J’en viens = tôi vừa từ đó về).',
          'For PEOPLE, use « de » + stressed pronoun, not « en »: Je parle souvent de lui. Je me souviens d’eux. — « En » replaces things/ideas, or places (J’en viens = I have just come from there).'),
        EXAMPLES([
          EX('— Vous avez des disques de jazz ? — Oui, j’en ai beaucoup.', '— Bạn có đĩa jazz không? — Có, tôi có nhiều.', '— Do you have any jazz records? — Yes, I have a lot.'),
          EX('J’aime beaucoup le chocolat et j’en mange souvent.', 'Tôi rất thích sô-cô-la và ăn thường xuyên.', 'I love chocolate and I eat it often.')
        ])
      ],
      exercises: [
        FILL('— Vous mangez de la viande ? — Oui, j’{{1}} mange.', ['en'],
          '« En » thay « de la viande » và đứng trước động từ.',
          '« En » replaces « de la viande » and stands before the verb.'),
        FILL('— Il y a du pain ? — Non, il n’y {{1}} a plus.', ['en'],
          '« En » đứng trước « a », « plus » đứng sau.',
          '« En » comes before « a », « plus » after.'),
        CHOICE('Chọn đúng: « — Vous parlez de votre père ? — Oui, je parle souvent ___ . »', 'Choose correctly: “— Vous parlez de votre père ? — Oui, je parle souvent ___ .”',
          ['de lui', 'en', 'de y'], 0,
          'Với NGƯỜI dùng « de » + đại từ nhấn « lui », không dùng « en ».',
          'For PEOPLE use « de » + stressed pronoun « lui », not « en ».')
      ]
    },

    /* -----------------------------------------------------
       21. La situation dans l'espace (2) — p. 94
       ----------------------------------------------------- */
    {
      id: 'gp-espace2', num: 21, part: 'degree', minutes: 6,
      title: 'La situation dans l’espace (2)',
      subtitle: { vi: 'Vùng, tỉnh, bang: en / dans le / dans les và nguồn gốc', en: 'Regions, provinces, states: en / dans le / dans les and origin' },
      summary: {
        vi: 'Vùng, tỉnh, bang cũng theo giống: en + tên cái, dans le + tên đực, dans les + tên số nhiều. Nguồn gốc: de / d’ + tên cái, du + tên đực, des + số nhiều.',
        en: 'Regions, provinces and states follow gender too: en + feminine, dans le + masculine, dans les + plural. Origin: de / d’ + feminine, du + masculine, des + plural.'
      },
      blocks: [
        P('Chương 10 dạy thành phố và quốc gia; chương này mở rộng sang vùng và bang — nơi các bài đọc DELF hay nhắc tới.',
          'Chapter 10 covered cities and countries; this one extends it to regions and states — the places DELF readings love.'),
        H('Ở đâu: en / dans le / dans les', 'Where: en / dans le / dans les'),
        TABLE([C('Giống', 'Gender'), C('Giới từ', 'Preposition'), C('Ví dụ', 'Example')], [
          [C('cái', 'feminine'), C('en', 'en'), C('en Bretagne, en Bavière, en Californie', 'en Bretagne, en Bavière, en Californie')],
          [C('đực', 'masculine'), C('dans le', 'dans le'), C('dans le Cantal, dans le Wisconsin, dans le Devonshire', 'dans le Cantal, dans le Wisconsin, dans le Devonshire')],
          [C('số nhiều', 'plural'), C('dans les', 'dans les'), C('dans les Alpes, dans les Andes, dans les Abruzzes', 'dans les Alpes, dans les Andes, dans les Abruzzes')]
        ]),
        H('Từ đâu: de / du / des', 'Where from: de / du / des'),
        TABLE([C('Giống', 'Gender'), C('Dạng', 'Form'), C('Ví dụ', 'Example')], [
          [C('cái', 'feminine'), C('de / d’', 'de / d’'), C('Je viens de Normandie. Je viens d’Espagne.', 'I come from Normandy. I come from Spain.')],
          [C('đực', 'masculine'), C('du', 'du'), C('Je viens du Poitou. Je viens du Texas.', 'I come from Poitou. I come from Texas.')],
          [C('số nhiều', 'plural'), C('des', 'des'), C('Je viens des États-Unis.', 'I come from the United States.')]
        ]),
        LIST([
          'Không dùng article với tên nước đã có giới từ: Je viens de Chine (không « de la Chine »); Je viens d’Israël.',
          'Dùng dạng rút gọn trong tên sản phẩm: le café du Brésil, le foie gras du Périgord, les fruits de Provence, les tulipes de Hollande.',
          'Không rút gọn trước « h » bật hơi: de Hollande.',
          '« Dans le » dùng cho bang Mỹ đực (le Wisconsin), « en » cho bang cái (la Californie).'
        ], [
          'No article after the preposition with country names: Je viens de Chine (not « de la Chine »); Je viens d’Israël.',
          'Use the contracted form in product names: le café du Brésil, le foie gras du Périgord, les fruits de Provence, les tulipes de Hollande.',
          'No elision before aspirated h: de Hollande.',
          '« Dans le » for masculine US states (le Wisconsin), « en » for feminine ones (la Californie).'
        ]),
        EXAMPLES([
          EX('Je passe mes vacances en Angleterre ou en Provence.', 'Tôi nghỉ hè ở Anh hoặc ở Provence.', 'I spend my holidays in England or in Provence.'),
          EX('Mon mari vient du Devonshire, moi je viens de Marseille.', 'Chồng tôi từ Devonshire, còn tôi từ Marseille.', 'My husband is from Devonshire, I am from Marseille.')
        ])
      ],
      exercises: [
        FILL('Je passe mes vacances {{1}} Bretagne.', ['en'],
          'Bretagne là tên cái → « en ».',
          'Bretagne is feminine → « en ».'),
        FILL('Je viens {{1}} Poitou.', ['du'],
          'Poitou là tên đực, nguồn gốc → « du ».',
          'Poitou is masculine, origin → « du ».'),
        CHOICE('Chọn đúng: « Je viens ___ Chine. »', 'Choose correctly: “Je viens ___ Chine.”',
          ['de', 'de la', 'du'], 0,
          'Tên nước sau giới từ không dùng article: de Chine.',
          'Country names after the preposition take no article: de Chine.')
      ]
    },

    /* -----------------------------------------------------
       22. Le comparatif et le superlatif — p. 96–100
       ----------------------------------------------------- */
    {
      id: 'gp-comparatif', num: 22, part: 'degree', minutes: 9,
      title: 'Le comparatif et le superlatif',
      subtitle: { vi: 'So sánh hơn/kém/bằng và so sánh nhất, mieux/meilleur', en: 'Comparatives and superlatives, mieux/meilleur' },
      summary: {
        vi: 'So sánh tính từ/trạng từ bằng plus / aussi / moins … que; so sánh động từ và danh từ cần « que » hoặc « de » đúng dạng. Bất quy tắc: bon → meilleur, bien → mieux.',
        en: 'Compare adjectives/adverbs with plus / aussi / moins … que; verbs and nouns need the right « que » or « de » form. Irregular: bon → meilleur, bien → mieux.'
      },
      blocks: [
        P('Câu so sánh tiếng Pháp có hai nửa bắt buộc: từ so sánh + « que » (hoặc « de » với số lượng). Thiếu nửa sau là câu cụt.',
          'A French comparison has two obligatory halves: the comparative word plus « que » (or « de » with quantities). Without it the sentence is incomplete.'),
        H('So sánh tính từ và trạng từ', 'Comparing adjectives and adverbs'),
        TABLE([C('Loại', 'Type'), C('Cấu trúc', 'Pattern'), C('Ví dụ', 'Example')], [
          [C('tính từ', 'adjective'), C('plus / aussi / moins + adj + que', 'plus / aussi / moins + adj + que'), C('Jean est plus rapide que Max.', 'Jean is faster than Max.')],
          [C('trạng từ', 'adverb'), C('plus / aussi / moins + adv + que', 'plus / aussi / moins + adv + que'), C('Jean travaille moins vite que Max.', 'Jean works less fast than Max.')]
        ]),
        H('So sánh động từ và danh từ', 'Comparing verbs and nouns'),
        TABLE([C('Loại', 'Type'), C('Cấu trúc', 'Pattern'), C('Ví dụ', 'Example')], [
          [C('động từ', 'verb'), C('plus / autant / moins + verbe + que', 'plus / autant / moins + verb + que'), C('Max travaille autant que Jean.', 'Max works as much as Jean.')],
          [C('danh từ', 'noun'), C('plus de / autant de / moins de + nom + que', 'plus de / autant de / moins de + noun + que'), C('Max a moins de travail que Jean.', 'Max has less work than Jean.')]
        ]),
        LIST([
          'Luôn « que » khi so sánh, không dùng « comme »: Jean est plus rapide QUE Max (không « comme Max »).',
          '« Comme » chỉ sự giống nhau, không có ý hơn/kém: Zoé est blonde comme sa mère.',
          'Phát âm « plus »: [pluss] khi đứng cuối mệnh đề hoặc trước nguyên âm (plus que, plus de, il gagne plus); [plu] trước phụ âm (plus grand).'
        ], [
          'Always « que » in comparisons, never « comme »: Jean est plus rapide QUE Max (not « comme Max »).',
          '« Comme » only marks resemblance, with no more/less idea: Zoé est blonde comme sa mère.',
          'Pronounce « plus »: [pluss] at the end of a clause or before a vowel (plus que, plus de, il gagne plus); [plu] before a consonant (plus grand).'
        ]),
        H('So sánh nhất', 'Superlatives'),
        LIST([
          'Công thức: le / la / les + plus / moins + tính từ (+ de + nhóm): Zoé est la plus grande de la classe.',
          'Nhấn mạnh bằng « c’est … qui »: C’est Paul qui est le plus grand. C’est Annie qui écrit le mieux.',
          'Với trạng từ, so sánh nhất dùng « le » bất biến: C’est elle qui chante le mieux.',
          'Kết hợp với « de » + nhóm so sánh là tuỳ chọn: Marc est le moins grand (de la classe).'
        ], [
          'Pattern: le / la / les + plus / moins + adjective (+ de + group): Zoé est la plus grande de la classe.',
          'For emphasis use « c’est … qui »: C’est Paul qui est le plus grand. C’est Annie qui écrit le mieux.',
          'For adverbs the superlative uses invariable « le »: C’est elle qui chante le mieux.',
          'The « de » + comparison group is optional: Marc est le moins grand (de la classe).'
        ]),
        H('Meilleur / mieux', 'Meilleur / mieux'),
        TABLE([C('Tính từ bon', 'Adjective bon'), C('Trạng từ bien', 'Adverb bien')], [
          [C('bon → meilleur → le meilleur: Ce vin est bon, l’autre est meilleur. C’est le meilleur.', 'bon → meilleur → le meilleur: This wine is good, the other is better. It is the best.'), C('bien → mieux → le mieux: Paul danse bien, John danse mieux. C’est John qui danse le mieux.', 'bien → mieux → le mieux: Paul dances well, John dances better. John dances best.')]
        ]),
        CALLOUT('trap', '« Meilleur » đi với danh từ (une meilleure note); « mieux » đi với động từ (il travaille mieux). Đầu câu nên dùng « il vaut mieux » thay vì « c’est mieux ».',
          '« Meilleur » attaches to nouns (une meilleure note); « mieux » to verbs (il travaille mieux). At the start of a sentence prefer « il vaut mieux » to « c’est mieux ».'),
        EXAMPLES([
          EX('Le diesel est moins cher que l’essence, mais il pollue plus.', 'Dầu diesel rẻ hơn xăng nhưng ô nhiễm hơn.', 'Diesel is cheaper than petrol but pollutes more.'),
          EX('Julie cuisine mieux que Paula.', 'Julie nấu ăn giỏi hơn Paula.', 'Julie cooks better than Paula.')
        ])
      ],
      exercises: [
        FILL('Jean est plus rapide {{1}} Max.', ['que'],
          'So sánh dùng « que », không dùng « comme ».',
          'Comparisons use « que », never « comme ».'),
        CHOICE('Chọn đúng: « Le bordeaux rouge est ___ que le blanc. »', 'Choose correctly: “Le bordeaux rouge est ___ que le blanc.”',
          ['meilleur', 'mieux', 'plus bien'], 0,
          'So sánh « bon » là « meilleur » (tính từ).',
          'The comparative of « bon » is « meilleur » (adjective).'),
        TRANSLATE('Cô ấy hát hay hơn tôi.', 'She sings better than I do.',
          ['Elle chante mieux que moi.', 'Elle chante mieux que je ne chante.'],
          '« Bien » → « mieux » khi so sánh trạng từ.',
          '« Bien » becomes « mieux » when comparing the adverb.')
      ]
    },

    /* -----------------------------------------------------
       23. Le verbe « aller » — p. 102
       ----------------------------------------------------- */
    {
      id: 'gp-aller', num: 23, part: 'degree', minutes: 6,
      title: 'Le verbe « aller »',
      subtitle: { vi: 'Động từ aller và giới từ chỉ nơi đến', en: 'The verb aller and place prepositions' },
      summary: {
        vi: '« Aller » bất quy tắc (vais, vas, va, allons, allez, vont) và luôn đi với « à » + nơi, « chez » + người, « en » + phương tiện.',
        en: '« Aller » is irregular (vais, vas, va, allons, allez, vont) and always pairs with « à » + place, « chez » + person, « en » + transport.'
      },
      blocks: [
        P('Đây là động từ chuyển động cơ bản nhất, và là nền của thì tương lai gần ở chương 39.',
          'This is the basic movement verb, and the base of the near future in chapter 39.'),
        H('Chia động từ', 'Conjugation'),
        TABLE([C('Ngôi', 'Person'), C('Aller', 'Aller'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('vais', 'vais'), C('Je vais à Rome.', 'I am going to Rome.')],
          [C('tu', 'tu'), C('vas', 'vas'), C('Tu vas à la piscine ?', 'Are you going to the pool?')],
          [C('il / elle / on', 'il / elle / on'), C('va', 'va'), C('Elle va en Suisse.', 'She is going to Switzerland.')],
          [C('nous', 'nous'), C('allons', 'allons'), C('Nous allons au cinéma.', 'We are going to the cinema.')],
          [C('vous', 'vous'), C('allez', 'allez'), C('Vous allez à Madrid ?', 'Are you going to Madrid?')],
          [C('ils / elles', 'ils / elles'), C('vont', 'vont'), C('Ils vont à Berlin.', 'They are going to Berlin.')]
        ]),
        H('Aller + nơi chốn', 'Aller + place'),
        LIST([
          'Thành phố / nơi: à + thành phố, au / à la / à l’ + danh từ: Je vais à Berlin, au Maroc, à la piscine, à l’hôtel.',
          'Người: « chez » — Je vais chez des amis, chez le boucher. (Nhưng Je vais à la boucherie: nói địa điểm.)',
          'Nơi không rõ trong câu: dùng « y » — On y va ? Allons-y !',
          'Trả lời gọn: — Tu vas à la piscine ? — Oui, j’y vais.'
        ], [
          'City / place: à + city, au / à la / à l’ + noun: Je vais à Berlin, au Maroc, à la piscine, à l’hôtel.',
          'People: « chez » — Je vais chez des amis, chez le boucher. (But Je vais à la boucherie: the shop as a place.)',
          'When the place is unnamed use « y »: On y va ? Allons-y !',
          'Short answer: — Tu vas à la piscine ? — Oui, j’y vais.'
        ]),
        H('Phương tiện', 'Transport'),
        TABLE([C('Cách đi', 'Means'), C('Giới từ', 'Preposition')], [
          [C('voiture, train, avion, bus, métro', 'voiture, train, avion, bus, métro'), C('en voiture, en train, en avion', 'en voiture, en train, en avion')],
          [C('pied, bicyclette, cheval, moto', 'pied, bicyclette, cheval, moto'), C('à pied, à bicyclette, à cheval, à moto', 'à pied, à bicyclette, à cheval, à moto')]
        ]),
        EXAMPLES([
          EX('Je vais à Berlin en train.', 'Tôi đi Berlin bằng tàu.', 'I am going to Berlin by train.'),
          EX('— On y va ? — Allons-y !', '— Mình đi chứ? — Đi thôi!', '— Shall we go? — Let’s go!')
        ])
      ],
      exercises: [
        FILL('Nous {{1}} au cinéma ce soir.', ['allons'],
          '« Nous » + aller = « allons ».',
          '« Nous » + aller = « allons ».'),
        FILL('Ils {{1}} à Berlin en train.', ['vont'],
          '« Ils » + aller = « vont ».',
          '« Ils » + aller = « vont ».'),
        CHOICE('Chọn đúng: « Je vais ___ mes amis. »', 'Choose correctly: “Je vais ___ mes amis.”',
          ['chez', 'à', 'au'], 0,
          'Đi đến người dùng « chez ».',
          'Going to a person uses « chez ».')
      ]
    },

    /* -----------------------------------------------------
       24. Le pronom « y » — p. 104
       ----------------------------------------------------- */
    {
      id: 'gp-y', num: 24, part: 'degree', minutes: 7,
      title: 'Le pronom « y »',
      subtitle: { vi: 'Đại từ « y»: thay nơi chốn và « à » + vật', en: 'The pronoun « y »: replaces places and « à » + thing' },
      summary: {
        vi: '« Y » thay « à » + nơi chốn hoặc « à » + vật/việc. Với người: dùng đại từ nhấn (à lui) hoặc đại từ bổ ngữ (lui), không dùng « y ».',
        en: '« Y » replaces « à » + place or « à » + thing/idea. For people: use a stressed pronoun (à lui) or object pronoun (lui), never « y ».'
      },
      blocks: [
        P('Hỏi « Vous allez à Rome en train ? » người Pháp đáp « Non, j’y vais en avion » — không lặp lại « à Rome ».',
          'Asked “Vous allez à Rome en train ?”, French answers “Non, j’y vais en avion” — never repeating “à Rome”.'),
        H('Y thay nơi chốn', 'Y for places'),
        TABLE([C('Câu gốc', 'Original'), C('Với « y »', 'With « y »')], [
          [C('Paul va à Lyon.', 'Paul va à Lyon.'), C('Il y va en voiture.', 'Il y va en voiture.')],
          [C('Anne habite à Athènes.', 'Anne habite à Athènes.'), C('Elle y habite depuis un an.', 'Elle y habite depuis un an.')],
          [C('Je suis chez moi.', 'Je suis chez moi.'), C('J’y suis jusqu’à six heures.', 'J’y suis jusqu’à six heures.')]
        ]),
        H('Y thay « à » + vật / việc', 'Y for « à » + thing or idea'),
        TABLE([C('Câu gốc', 'Original'), C('Với « y »', 'With « y »')], [
          [C('Je pense à mon pays.', 'Je pense à mon pays.'), C('J’y pense moi aussi.', 'J’y pense moi aussi.')],
          [C('Je participe à ce projet.', 'Je participe à ce projet.'), C('J’y participe aussi.', 'J’y participe aussi.')],
          [C('Je m’intéresse à la politique.', 'Je m’intéresse à la politique.'), C('Je m’y intéresse aussi.', 'Je m’y intéresse aussi.')]
        ]),
        CALLOUT('trap', 'Người không đi với « y »: Je pense à Paul → Je pense à lui; Je parle à Paul → Je lui parle. Chỉ vật/việc mới dùng « y ».',
          'People never take « y »: Je pense à Paul → Je pense à lui; Je parle à Paul → Je lui parle. Only things/ideas take « y ».'),
        H('Phủ định và thành ngữ', 'Negation and idioms'),
        LIST([
          'Phủ định bao quanh cả khối đại từ + động từ: Il n’y va pas. Je ne m’y intéresse pas.',
          'il s’y connaît = anh ấy rành về việc đó; je n’y suis pour rien = tôi không có lỗi; je n’y manquerai pas = tôi sẽ làm không quên; ça y est = xong rồi.',
          '« Y » đứng trước động từ, sau « ne »: Il n’y en a plus.'
        ], [
          'Negation wraps the whole pronoun + verb block: Il n’y va pas. Je ne m’y intéresse pas.',
          'il s’y connaît = he knows about it; je n’y suis pour rien = it’s not my fault; je n’y manquerai pas = I won’t forget; ça y est = that’s done.',
          '« Y » comes before the verb, after « ne »: Il n’y en a plus.'
        ]),
        EXAMPLES([
          EX('— Vous allez à Rome en train ? — Non, j’y vais en avion.', '— Bạn đi Rome bằng tàu hả? — Không, tôi đi máy bay.', '— Are you going to Rome by train? — No, I’m flying there.'),
          EX('Je pense souvent à ce voyage, j’y pense encore.', 'Tôi hay nghĩ về chuyến đi đó, vẫn còn nghĩ tới.', 'I often think about that trip, I still think about it.')
        ])
      ],
      exercises: [
        FILL('Paul va à Lyon. Il {{1}} va en voiture.', ['y'],
          '« y » thay « à Lyon » và đứng trước động từ.',
          '« y » replaces « à Lyon » and stands before the verb.'),
        FILL('Je participe à ce projet, j’{{1}} participe aussi.', ['y'],
          '« y » thay « à ce projet ».',
          '« y » replaces « à ce projet ».'),
        CHOICE('Chọn đúng: « Tu penses à Marie ? »', 'Choose correctly: “Tu penses à Marie ?”',
          ['Oui, je pense à elle.', 'Oui, j’y pense.', 'Oui, je la pense.'], 0,
          'Với người dùng « à » + đại từ nhấn « elle ».',
          'For people use « à » + the stressed pronoun « elle ».')
      ]
    },

    /* -----------------------------------------------------
       25. La situation dans l'espace et le temps (3) — p. 106
       ----------------------------------------------------- */
    {
      id: 'gp-espace3', num: 25, part: 'degree', minutes: 7,
      title: 'La situation dans l’espace et le temps (3)',
      subtitle: { vi: 'Mốc, khoảng, giới hạn: à, de… à, jusqu’à, vers, entre / parmi', en: 'Points, ranges, limits: à, de… à, jusqu’à, vers, entre / parmi' },
      summary: {
        vi: 'Các giới từ này dùng cho cả không gian lẫn thời gian: « à » điểm, « de… à » khoảng, « jusqu’à » giới hạn, « à partir de » khởi điểm, « vers / environ » xấp xỉ, « entre » hai, « parmi » nhiều.',
        en: 'These prepositions work for both space and time: « à » a point, « de… à » a range, « jusqu’à » a limit, « à partir de » a starting point, « vers / environ » approximation, « entre » two, « parmi » many.'
      },
      blocks: [
        P('Một bộ giới từ nhỏ nhưng quyết định câu đúng/sai trong bài viết DELF: nó cho biết mốc, khoảng hay giới hạn.',
          'A small set of prepositions that decides right or wrong in DELF writing: point, range or limit.'),
        TABLE([C('Giới từ', 'Preposition'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('à', 'à'), C('điểm (không gian/thời gian)', 'a point (space or time)'), C('Je termine à dix-huit heures. Nous sommes à Paris, au deuxième étage.', 'I finish at six p.m. We are in Paris, on the second floor.')],
          [C('de… à', 'de… à'), C('khoảng từ điểm này đến điểm kia', 'a range from one point to another'), C('Je travaille de 8 heures à midi, du lundi au vendredi.', 'I work from 8 to noon, Monday to Friday.')],
          [C('jusqu’à', 'jusqu’à'), C('giới hạn cuối', 'the far limit'), C('On travaille jusqu’à soixante-deux ans. Le TGV va jusqu’au Croisic.', 'People work until sixty-two. The TGV goes as far as Le Croisic.')],
          [C('à partir de', 'à partir de'), C('khởi điểm về sau', 'starting point onwards'), C('L’horaire d’hiver commence à partir du 22 septembre.', 'The winter timetable starts from 22 September.')],
          [C('vers / environ', 'vers / environ'), C('xấp xỉ', 'approximate'), C('Nous arriverons vers midi. Il gagne environ 2 000 euros.', 'We will arrive around noon. He earns about 2,000 euros.')]
        ]),
        H('Entre và parmi', 'Entre and parmi'),
        LIST([
          '« Entre » hai phần tử: « B » est entre « A » et « C ». J’hésite entre deux métiers.',
          '« Parmi » nhiều phần tử: « B » est une lettre parmi les lettres de l’alphabet.',
          '« Entre nous / entre eux » = chỉ trong nhóm đó: Entre nous, je vais vous confier un secret.',
          '« Environ » + số lượng; « vers » + giờ, nhưng với « il est » thì dùng « environ »: Il est environ sept heures.'
        ], [
          '« Entre » for two elements: « B » est entre « A » et « C ». J’hésite entre deux métiers.',
          '« Parmi » for several: « B » est une lettre parmi les lettres de l’alphabet.',
          '« Entre nous / entre eux » = within that group only: Entre nous, je vais vous confier un secret.',
          '« Environ » + quantity; « vers » + clock time, but with « il est » use « environ »: Il est environ sept heures.'
        ]),
        EXAMPLES([
          EX('Je travaille environ dix heures : de huit heures à dix-huit heures.', 'Tôi làm khoảng mười tiếng: từ 8 giờ đến 18 giờ.', 'I work about ten hours: from eight to six.'),
          EX('Il y a huit cents kilomètres de Paris à Avignon.', 'Từ Paris đến Avignon là 800 km.', 'It is eight hundred kilometres from Paris to Avignon.')
        ])
      ],
      exercises: [
        FILL('Je travaille {{1}} huit heures à midi.', ['de'],
          'Khoảng thời gian: de… à.',
          'A time range: de… à.'),
        FILL('On travaille {{1}} soixante-deux ans en France.', ['jusqu’à'],
          'Giới hạn cuối dùng « jusqu’à ».',
          'The far limit uses « jusqu’à ».'),
        CHOICE('Chọn đúng: « Il hésite ___ deux métiers. »', 'Choose correctly: “Il hésite ___ deux métiers.”',
          ['entre', 'parmi', 'vers'], 0,
          'Hai lựa chọn dùng « entre ».',
          'Two options take « entre ».')
      ]
    },

    /* -----------------------------------------------------
       26. Les verbes en -ir, -re, -oir au présent — p. 108–120
       ----------------------------------------------------- */
    {
      id: 'gp-ir-re-oir', num: 26, part: 'sentence', minutes: 14,
      title: 'Les verbes en « -ir », « -re » et « -oir »',
      subtitle: { vi: 'Nhóm -ir, -re, -oir ở hiện tại + bất quy tắc chính', en: 'The -ir, -re and -oir groups in the present + main irregulars' },
      summary: {
        vi: 'Ba nhóm này chia từ hai hoặc ba radical: finir → finis / finissons; prendre → prends / prenons / prennent. Học theo mẫu radical là nhanh hơn học từng động từ.',
        en: 'These three groups build on two or three stems: finir → finis / finissons; prendre → prends / prenons / prennent. Learn the stem patterns instead of each verb.'
      },
      blocks: [
        P('Chương dài nhất của sách gom các động từ “không đều” còn lại. Quy tắc chung: tìm radical cho je/tu/il, rồi radical thứ hai cho nous/vous, và đôi khi radical thứ ba cho ils.',
          'The book’s longest chapter gathers the remaining “irregular” verbs. Rule of thumb: one stem for je/tu/il, a second for nous/vous, sometimes a third for ils.'),
        H('Nhóm -ir: hai mẫu', 'The -ir group: two patterns'),
        TABLE([C('Mẫu', 'Pattern'), C('Chia', 'Conjugation'), C('Cùng nhóm', 'Also')], [
          [C('finir (i → iss)', 'finir (i → iss)'), C('je finis, tu finis, il finit / nous finissons, vous finissez, ils finissent', 'je finis, tu finis, il finit / nous finissons, vous finissez, ils finissent'), C('choisir, guérir, grandir, grossir, rougir, vieillir, applaudir', 'choisir, guérir, grandir, grossir, rougir, vieillir, applaudir')],
          [C('dormir (bỏ phụ âm cuối)', 'dormir (drop final consonant)'), C('je dors, tu dors, il dort / nous dormons, vous dormez, ils dorment', 'je dors, tu dors, il dort / nous dormons, vous dormez, ils dorment'), C('partir, sortir, sentir, mentir, servir', 'partir, sortir, sentir, mentir, servir')]
        ]),
        LIST([
          'Nhóm « finir » diễn tả quá trình/biến đổi, nhiều từ ghép với tính từ: grand → grandir, rouge → rougir.',
          'naître / connaître / paraître theo cùng mẫu: je connais, vous connaissez, il naît, ils naissent.',
          'vivre và suivre giống mẫu dormir/partir: je vis, je suis (không “je vik”).',
          'ouvrir, offrir, cueillir, souffrir chỉ một radical và chia như nhóm -er: j’ouvre, vous ouvrez.'
        ], [
          'The « finir » group describes a process or change, often built on adjectives: grand → grandir, rouge → rougir.',
          'naître / connaître / paraître follow the same pattern: je connais, vous connaissez, il naît, ils naissent.',
          'vivre and suivre follow the dormir/partir pattern: je vis, je suis (never “je vik”).',
          'ouvrir, offrir, cueillir, souffrir have one stem and conjugate like -er verbs: j’ouvre, vous ouvrez.'
        ]),
        H('Nhóm -re / -oir: hai radical', 'The -re / -oir group: two stems'),
        TABLE([C('Mẫu', 'Pattern'), C('Chia', 'Conjugation'), C('Cùng nhóm', 'Also')], [
          [C('mettre', 'mettre'), C('je mets, tu mets, il met / nous mettons, vous mettez, ils mettent', 'je mets, tu mets, il met / nous mettons, vous mettez, ils mettent'), C('battre, promettre, permettre', 'battre, promettre, permettre')],
          [C('entendre', 'entendre'), C('j’entends, tu entends, il entend / nous entendons, vous entendez, ils entendent', 'j’entends, tu entends, il entend / nous entendons, vous entendez, ils entendent'), C('attendre, vendre, perdre, descendre, répondre', 'attendre, vendre, perdre, descendre, répondre')],
          [C('écrire', 'écrire'), C('j’écris, tu écris, il écrit / nous écrivons, vous écrivez, ils écrivent', 'j’écris, tu écris, il écrit / nous écrivons, vous écrivez, ils écrivent'), C('décrire, inscrire, lire, conduire, peindre, éteindre', 'décrire, inscrire, lire, conduire, peindre, éteindre')]
        ]),
        H('Ba radical: prendre, boire, venir, recevoir', 'Three stems: prendre, boire, venir, recevoir'),
        TABLE([C('Động từ', 'Verb'), C('je / tu', 'je / tu'), C('nous / vous', 'nous / vous'), C('ils', 'ils')], [
          [C('prendre', 'prendre'), C('prends / prends', 'prends / prends'), C('prenons / prenez', 'prenons / prenez'), C('prennent', 'prennent')],
          [C('boire', 'boire'), C('bois / bois', 'bois / bois'), C('buvons / buvez', 'buvons / buvez'), C('boivent', 'boivent')],
          [C('venir', 'venir'), C('viens / viens', 'viens / viens'), C('venons / venez', 'venons / venez'), C('viennent', 'viennent')],
          [C('recevoir', 'recevoir'), C('reçois / reçois', 'reçois / reçois'), C('recevons / recevez', 'recevons / recevez'), C('reçoivent', 'reçoivent')],
          [C('devoir', 'devoir'), C('dois / dois', 'dois / dois'), C('devons / devez', 'devons / devez'), C('doivent', 'doivent')],
          [C('vouloir', 'vouloir'), C('veux / veux', 'veux / veux'), C('voulons / voulez', 'voulons / voulez'), C('veulent', 'veulent')],
          [C('pouvoir', 'pouvoir'), C('peux / peux', 'peux / peux'), C('pouvons / pouvez', 'pouvons / pouvez'), C('peuvent', 'peuvent')]
        ]),
        H('Bất quy tắc toàn phần', 'Fully irregular'),
        TABLE([C('Động từ', 'Verb'), C('je', 'je'), C('tu', 'tu'), C('il', 'il'), C('nous', 'nous'), C('vous', 'vous'), C('ils', 'ils')], [
          [C('être', 'être'), C('suis', 'suis'), C('es', 'es'), C('est', 'est'), C('sommes', 'sommes'), C('êtes', 'êtes'), C('sont', 'sont')],
          [C('avoir', 'avoir'), C('ai', 'ai'), C('as', 'as'), C('a', 'a'), C('avons', 'avons'), C('avez', 'avez'), C('ont', 'ont')],
          [C('aller', 'aller'), C('vais', 'vais'), C('vas', 'vas'), C('va', 'va'), C('allons', 'allons'), C('allez', 'allez'), C('vont', 'vont')],
          [C('faire', 'faire'), C('fais', 'fais'), C('fais', 'fais'), C('fait', 'fait'), C('faisons', 'faisons'), C('faites', 'faites'), C('font', 'font')],
          [C('dire', 'dire'), C('dis', 'dis'), C('dis', 'dis'), C('dit', 'dit'), C('disons', 'disons'), C('dites', 'dites'), C('disent', 'disent')],
          [C('savoir', 'savoir'), C('sais', 'sais'), C('sais', 'sais'), C('sait', 'sait'), C('savons', 'savons'), C('savez', 'savez'), C('savent', 'savent')],
          [C('voir', 'voir'), C('vois', 'vois'), C('vois', 'vois'), C('voit', 'voit'), C('voyons', 'voyons'), C('voyez', 'voyez'), C('voient', 'voient')],
          [C('croire', 'croire'), C('crois', 'crois'), C('crois', 'crois'), C('croit', 'croit'), C('croyons', 'croyons'), C('croyez', 'croyez'), C('croient', 'croient')]
        ], 'Đuôi viết cũng có luật: -x, -x, -t với veux/peux; -ts, -ts, -t với mettre; -ds, -ds, -d với prendre. / Endings have rules too: -x, -x, -t with veux/peux; -ts, -ts, -t with mettre; -ds, -ds, -d with prendre.'),
        H('Prendre / mettre / faire: nghĩa thường dùng', 'Prendre / mettre / faire: everyday senses'),
        LIST([
          'Prendre + vật / phương tiện / món: Je prends mon parapluie, le métro, un steak, un bain, une décision.',
          'Mettre + quần áo / thời gian: Je mets une cravate, je mets une heure pour aller au bureau.',
          'Thời gian với « ça »: Les transports, ça prend du temps (không “je prends une heure”).',
          'Faire du + thể thao (faire du tennis, de la gymnastique); jouer au + môn đồng đội / trò chơi; jouer du + nhạc cụ. Faire la cuisine, les courses, la vaisselle, le ménage.',
          'Faire + infinitif khi người khác làm thay: Je fais réparer ma voiture. Je me fais couper les cheveux.'
        ], [
          'Prendre + object / transport / food: Je prends mon parapluie, le métro, un steak, un bain, une décision.',
          'Mettre + clothes / time: Je mets une cravate, je mets une heure pour aller au bureau.',
          'Time with impersonal « ça »: Les transports, ça prend du temps (not “je prends une heure”).',
          'Faire du + sport (faire du tennis, de la gymnastique); jouer au + team sport / game; jouer du + instrument. Faire la cuisine, les courses, la vaisselle, le ménage.',
          'Faire + infinitive when someone else does it: Je fais réparer ma voiture. Je me fais couper les cheveux.'
        ]),
        H('Pouvoir / devoir / falloir', 'Pouvoir / devoir / falloir'),
        TABLE([C('Động từ', 'Verb'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('pouvoir + inf.', 'pouvoir + inf.'), C('khả năng, cho phép', 'ability, permission'), C('Paul peut soulever cent kilos. On ne peut pas fumer ici.', 'Paul can lift a hundred kilos. You cannot smoke here.')],
          [C('devoir + inf.', 'devoir + inf.'), C('bắt buộc, cần, hoặc suy đoán', 'obligation, need, or probability'), C('Je dois payer mes impôts. Il doit être cinq heures à Rio.', 'I must pay my taxes. It must be five o’clock in Rio.')],
          [C('il faut + inf.', 'il faut + inf.'), C('cần thiết chung (chỉ ngôi thứ 3 số ít)', 'general necessity (impersonal only)'), C('Il faut manger pour vivre.', 'One must eat to live.')]
        ]),
        CALLOUT('trap', 'Không dịch từ tiếng Anh: “It is possible for me to rest” → Je peux me reposer. “It is necessary for me to leave” → Je dois partir. Yêu cầu lịch sự dùng conditionnel: Pourriez-vous… ? Je voudrais…',
          'Do not translate English literally: “It is possible for me to rest” → Je peux me reposer. “It is necessary for me to leave” → Je dois partir. Polite requests use the conditional: Pourriez-vous… ? Je voudrais…'),
        H('Savoir / connaître / vouloir', 'Savoir / connaître / vouloir'),
        LIST([
          'Savoir + động từ / mệnh đề: Je sais conduire. Je sais où il habite. (Học thuộc: il sait sa leçon.)',
          'Connaître + danh từ: Je connais le code de la route, son adresse, ses opinions. Không nói « je connais que ».',
          'Savoir = khả năng đã học; pouvoir = khả năng thể chất/tình huống: Je sais nager / Je peux nager pendant des heures.',
          'Vouloir + danh từ hoặc + infinitif, KHÔNG có giới từ: Je veux réussir (không “de réussir”). “Je veux bien” = vâng, sẵn lòng.'
        ], [
          'Savoir + verb / clause: Je sais conduire. Je sais où il habite. (By heart: il sait sa leçon.)',
          'Connaître + noun: Je connais le code de la route, son adresse, ses opinions. Never “je connais que”.',
          'Savoir = a learned skill; pouvoir = physical or situational possibility: Je sais nager / Je peux nager pendant des heures.',
          'Vouloir + noun or + infinitive, with NO preposition: Je veux réussir (not “de réussir”). “Je veux bien” = yes, gladly.'
        ]),
        EXAMPLES([
          EX('— Vous prenez une salade ? — Non, mes filles prennent une salade, moi je prends un steak.', '— Anh ăn salad không? — Không, các con tôi ăn salad, tôi ăn bít-tết.', '— Are you having a salad? — No, my daughters are, I’m having a steak.'),
          EX('Il faut toujours taper son code.', 'Lúc nào cũng phải bấm mã.', 'You always have to type your PIN.')
        ])
      ],
      exercises: [
        FILL('Nous {{1}} (finir) à midi.', ['finissons'],
          'Nhóm « finir »: số nhiều dùng radical « finiss- » → finissons.',
          'The « finir » group uses the « finiss- » stem in the plural → finissons.'),
        FILL('Ils {{1}} (prendre) le train.', ['prennent'],
          '« Prendre » ở « ils » dùng radical thứ ba « prenn- » → prennent.',
          '« Prendre » with « ils » uses the third stem « prenn- » → prennent.'),
        FILL('Je {{1}} (savoir) nager.', ['sais'],
          '« Savoir » với « je » là « sais ».',
          '« Savoir » with « je » is « sais ».'),
        CHOICE('Chọn đúng: « Je ne ___ pas fumer ici. » (không được phép)', 'Choose correctly: “Je ne ___ pas fumer ici.” (not allowed)',
          ['peux', 'sais', 'connais'], 0,
          'Sự cho phép/khả năng tình huống dùng « pouvoir ».',
          'Permission or situational possibility uses « pouvoir ».')
      ]
    },

    /* -----------------------------------------------------
       27. Les verbes pronominaux — p. 122
       ----------------------------------------------------- */
    {
      id: 'gp-pronominaux', num: 27, part: 'sentence', minutes: 7,
      title: 'Les verbes pronominaux',
      subtitle: { vi: 'Động từ phản thân và tương hỗ', en: 'Reflexive and reciprocal verbs' },
      summary: {
        vi: 'Động từ pronominal luôn có thêm một đại từ đi theo ngôi (me, te, se, nous, vous, se). Có loại phản thân, loại tương hỗ và loại “ăn sẵn” không có nghĩa phản thân.',
        en: 'Pronominal verbs always carry a pronoun matching the person (me, te, se, nous, vous, se). Some are reflexive, some reciprocal, and many just come that way.'
      },
      blocks: [
        P('Đây là nhóm động từ quen thuộc nhất trong nhịp sống hằng ngày: se lever, se coucher, s’appeler, se promener.',
          'These are the verbs of everyday routine: se lever, se coucher, s’appeler, se promener.'),
        H('Chia động từ', 'Conjugation'),
        TABLE([C('Ngôi', 'Person'), C('Đại từ', 'Pronoun'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('me / m’', 'me / m’'), C('Je me lève tôt.', 'I get up early.')],
          [C('tu', 'tu'), C('te / t’', 'te / t’'), C('Tu te couches tard.', 'You go to bed late.')],
          [C('il / elle / on', 'il / elle / on'), C('se / s’', 'se / s’'), C('Il se couche à dix heures.', 'He goes to bed at ten.')],
          [C('nous', 'nous'), C('nous', 'nous'), C('Nous nous couchons à minuit.', 'We go to bed at midnight.')],
          [C('vous', 'vous'), C('vous', 'vous'), C('Vous vous couchez à onze heures.', 'You go to bed at eleven.')],
          [C('ils / elles', 'ils / elles'), C('se / s’', 'se / s’'), C('Ils se couchent à huit heures.', 'They go to bed at eight.')]
        ]),
        H('Ba loại nghĩa', 'Three kinds of meaning'),
        TABLE([C('Loại', 'Type'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('phản thân', 'reflexive'), C('chủ và tân ngữ là một người', 'subject and object are the same person'), C('Je couche ma fille et je me couche.', 'I put my daughter to bed and I go to bed myself.')],
          [C('tương hỗ', 'reciprocal'), C('lẫn nhau', 'each other'), C('Nous nous connaissons bien. Les enfants se battent.', 'We know each other well. The children fight each other.')],
          [C('không có giá trị lô-gích', 'no logical value'), C('động từ chỉ đi với dạng này', 'the verb simply works this way'), C('se promener, s’arrêter, s’amuser, s’ennuyer, se tromper', 'se promener, s’arrêter, s’amuser, s’ennuyer, se tromper')]
        ]),
        LIST([
          'Động từ + « de / à » cũng giữ giới từ: s’intéresser à, s’occuper de, se moquer de, se souvenir de.',
          'Phủ định bao quanh khối đại từ + động từ: Je ne me lève pas tôt. Nous ne nous connaissons pas.',
          'Đảo trật tự câu hỏi: — Tu te lèves à quelle heure ? — Vous vous appelez comment ?'
        ], [
          'Verbs with « de / à » keep the preposition: s’intéresser à, s’occuper de, se moquer de, se souvenir de.',
          'Negation wraps the pronoun + verb block: Je ne me lève pas tôt. Nous ne nous connaissons pas.',
          'Question order: — Tu te lèves à quelle heure ? — Vous vous appelez comment ?'
        ]),
        EXAMPLES([
          EX('Je me promène dans la rue et je m’arrête devant les vitrines.', 'Tôi đi dạo trên phố và dừng lại trước cửa hiệu.', 'I walk along the street and stop in front of the shop windows.'),
          EX('Nous nous couchons à minuit.', 'Chúng tôi đi ngủ lúc nửa đêm.', 'We go to bed at midnight.')
        ])
      ],
      exercises: [
        FILL('Je {{1}} lève à sept heures.', ['me'],
          '« Je » + động từ pronominal dùng đại từ « me ».',
          '« Je » with a pronominal verb takes the pronoun « me ».'),
        FILL('Nous {{1}} couchons à minuit.', ['nous'],
          '« Nous » + pronominal dùng « nous ».',
          '« Nous » with a pronominal verb takes « nous ».'),
        CHOICE('Chọn đúng: « Nous ___ bien. » (biết nhau)', 'Choose correctly: “Nous ___ bien.” (we know each other)',
          ['nous connaissons', 'se connaissons', 'connaissons-nous'], 0,
          'Đại từ phải hợp với chủ ngữ « nous ».',
          'The pronoun must agree with the subject « nous ».')
      ]
    },

    /* -----------------------------------------------------
       28. Les pronoms compléments — p. 124–128
       ----------------------------------------------------- */
    {
      id: 'gp-pronoms-comp', num: 28, part: 'sentence', minutes: 11,
      title: 'Les pronoms compléments',
      subtitle: { vi: 'Đại từ tân ngữ trực tiếp, gián tiếp và trật tự khi có hai', en: 'Direct and indirect object pronouns, and their order' },
      summary: {
        vi: 'Đại từ bổ ngữ tránh lặp danh từ: le/la/les thay « qui/quoi », lui/leur thay « à qui ». Khi có hai đại từ, người đứng trước vật; riêng ngôi thứ ba thì đảo lại (le lui).',
        en: 'Object pronouns avoid repeating a noun: le/la/les for « qui/quoi », lui/leur for « à qui ». With two pronouns, people come before things — except in the third person, where the order flips (le lui).'
      },
      blocks: [
        P('Đây là chương quan trọng nhất cho độ tự nhiên khi nói: bỏ được đại từ thì câu nghe Tây, không bỏ thì câu dài và lặp.',
          'This is the chapter that makes you sound natural: pronouns shorten the sentence, and leaving them out sounds repetitive.'),
        H('Đại từ trực tiếp', 'Direct object pronouns'),
        TABLE([C('Người', 'Person'), C('Trực tiếp', 'Direct'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('me / m’', 'me / m’'), C('Il m’écoute.', 'He listens to me.')],
          [C('tu', 'tu'), C('te / t’', 'te / t’'), C('Ils t’invitent.', 'They invite you.')],
          [C('il / elle', 'il / elle'), C('le / la / l’', 'le / la / l’'), C('Je le regarde. Je la regarde.', 'I look at him. I look at her.')],
          [C('nous / vous', 'nous / vous'), C('nous / vous', 'nous / vous'), C('Elle nous regarde.', 'She looks at us.')],
          [C('ils / elles', 'ils / elles'), C('les', 'les'), C('Je les regarde.', 'I look at them.')]
        ]),
        H('Đại từ gián tiếp', 'Indirect object pronouns'),
        TABLE([C('Người', 'Person'), C('Gián tiếp', 'Indirect'), C('Ví dụ', 'Example')], [
          [C('je / tu / nous / vous', 'je / tu / nous / vous'), C('me, te, nous, vous', 'me, te, nous, vous'), C('Il me parle. Je vous téléphone.', 'He talks to me. I call you.')],
          [C('il / elle (nam & nữ)', 'il / elle (both genders)'), C('lui', 'lui'), C('Je lui parle. Je lui téléphone.', 'I talk to him/her. I call him/her.')],
          [C('ils / elles', 'ils / elles'), C('leur', 'leur'), C('Je leur parle.', 'I talk to them.')]
        ]),
        LIST([
          'Đại từ gián tiếp dùng với động từ giao tiếp + « à »: parler à, téléphoner à, écrire à, répondre à, dire à, offrir à, sourire à, souhaiter à.',
          'Các động từ khác cùng kiểu: ressembler à (Sa fille lui ressemble), plaire à (Paris lui plaît), aller à (Le rouge lui va bien).',
          '« Penser à » và « s’intéresser à » KHÔNG dùng lui/leur mà dùng đại từ nhấn: Je pense à lui.',
          'Phủ định: Je ne lui téléphone pas. Je ne leur parle plus.'
        ], [
          'Indirect pronouns go with communication verbs + « à »: parler à, téléphoner à, écrire à, répondre à, dire à, offrir à, sourire à, souhaiter à.',
          'Other verbs of the same type: ressembler à (Sa fille lui ressemble), plaire à (Paris lui plaît), aller à (Le rouge lui va bien).',
          '« Penser à » and « s’intéresser à » do NOT take lui/leur but a stressed pronoun: Je pense à lui.',
          'Negation: Je ne lui téléphone pas. Je ne leur parle plus.'
        ]),
        H('Trật tự hai đại từ', 'Order of two pronouns'),
        TABLE([C('Trật tự', 'Order'), C('Ví dụ', 'Example')], [
          [C('me / te / se / nous / vous + le / la / les', 'me / te / se / nous / vous + le / la / les'), C('Elle me le donne. Tu me le prêtes ?', 'She gives it to me. Will you lend it to me?')],
          [C('le / la / les + lui / leur', 'le / la / les + lui / leur'), C('Je le lui prête. Elle le lui explique. Nous les leur apportons.', 'I lend it to him. She explains it to him. We bring them to them.')],
          [C('… + lui / leur + en', '… + lui / leur + en'), C('Vous lui en offrez. Elle lui en achète.', 'You give him some. She buys him some.')],
          [C('… + en / y (một mình)', '… + en / y (alone)'), C('Il m’en donne. Je m’y intéresse. Elle s’y promène.', 'He gives me some. I am interested in it. She walks there.')]
        ]),
        CALLOUT('trap', '« Y » và « en » không bao giờ đứng cạnh nhau — ngoại lệ duy nhất là « il y en a ». Ngoài ra: người trước vật, nhưng ngôi thứ ba đảo lại (le lui, les leur).',
          '« Y » and « en » never appear together — the only exception is « il y en a ». Otherwise: people before things, but flipped in the third person (le lui, les leur).'),
        EXAMPLES([
          EX('Tu aimes Julie ? — Oui, je l’aime.', 'Bạn có thích Julie không? — Có, tôi thích cô ấy.', 'Do you love Julie? — Yes, I love her.'),
          EX('Tu connais le fromage ? — Oui, j’aime ça.', 'Bạn biết phô-mai chứ? — Có, tôi thích món đó.', 'Do you know cheese? — Yes, I like it.')
        ])
      ],
      exercises: [
        FILL('Je regarde le garçon → Je {{1}} regarde.', ['le'],
          'Danh từ đực số ít trực tiếp → « le ».',
          'A masculine singular direct object → « le ».'),
        FILL('Je téléphone à mes parents → Je {{1}} téléphone.', ['leur'],
          '« à + số nhiều người » → « leur ».',
          '« à + plural people » → « leur ».'),
        CHOICE('Chọn đúng: « Je prête le livre à Paul. » → ?', 'Choose correctly: “Je prête le livre à Paul.” → ?',
          ['Je le lui prête.', 'Je lui le prête.', 'Je le prête lui.'], 0,
          'Ngôi thứ ba: le/la/les đứng TRƯỚC lui/leur.',
          'Third person: le/la/les comes BEFORE lui/leur.'),
        TRANSLATE('Tôi gọi cho cô ấy mỗi tối.', 'I call her every evening.',
          ['Je lui téléphone tous les soirs.', 'Je l’appelle tous les soirs.'],
          '« Téléphoner à » dùng đại từ gián tiếp « lui ».',
          '« Téléphoner à » takes the indirect pronoun « lui ».')
      ]
    },

    /* -----------------------------------------------------
       29. Les pronoms toniques — p. 132
       ----------------------------------------------------- */
    {
      id: 'gp-toniques', num: 29, part: 'sentence', minutes: 6,
      title: 'Les pronoms toniques',
      subtitle: { vi: 'Đại từ nhấn: moi, toi, lui, elle, nous, vous, eux, elles', en: 'Stressed pronouns: moi, toi, lui, elle, nous, vous, eux, elles' },
      summary: {
        vi: 'Đại từ nhấn dùng sau giới từ, sau « c’est », khi đứng một mình hoặc khi muốn nhấn mạnh/đối lập chủ ngữ.',
        en: 'Stressed pronouns appear after prepositions, after « c’est », on their own, and to emphasise or contrast a subject.'
      },
      blocks: [
        P('So sánh: « Elle part » (đại từ chủ ngữ + động từ) với « — Qui part ? — Elle ! » (đại từ nhấn, đứng một mình).',
          'Compare: “Elle part” (subject pronoun + verb) with “— Qui part ? — Elle !” (stressed pronoun, standing alone).'),
        TABLE([C('Chủ ngữ', 'Subject'), C('Nhấn', 'Stressed'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('moi', 'moi'), C('— Qui ? — Moi !', '— Who? — Me!')],
          [C('tu', 'tu'), C('toi', 'toi'), C('— C’est toi ? — Oui, c’est moi.', '— Is that you? — Yes, it’s me.')],
          [C('il / elle', 'il / elle'), C('lui / elle', 'lui / elle'), C('Max travaille avec moi, je pars avec elle.', 'Max works with me, I am leaving with her.')],
          [C('nous / vous', 'nous / vous'), C('nous / vous', 'nous / vous'), C('On va chez toi ou chez nous ?', 'Are we going to your place or ours?')],
          [C('ils / elles', 'ils / elles'), C('eux / elles', 'eux / elles'), C('Partons sans eux.', 'Let’s leave without them.')],
          [C('on', 'on'), C('soi', 'soi'), C('On est bien, chez soi.', 'It’s good to be at home.')]
        ]),
        LIST([
          'Sau giới từ luôn dùng đại từ nhấn: avec moi, chez lui, sans eux, pour toi.',
          'Sau « c’est »: C’est moi. C’est eux.',
          'Với « aussi », « non plus », « pas », « et », « ni »: — Moi aussi. — Lui non plus. — Pas moi.',
          'Đứng đầu câu để nhấn/đối lập: Moi, je suis fatiguée. — Nhưng đừng mở đầu cuộc nói chuyện bằng « Moi, je… » — nghe ích kỷ.'
        ], [
          'After a preposition always use the stressed form: avec moi, chez lui, sans eux, pour toi.',
          'After « c’est »: C’est moi. C’est eux.',
          'With « aussi », « non plus », « pas », « et », « ni »: — Moi aussi. — Lui non plus. — Pas moi.',
          'At the start of a sentence to emphasise or contrast: Moi, je suis fatiguée. — But never open a conversation with “Moi, je…” — it sounds self-centred.'
        ]),
        EXAMPLES([
          EX('— Je suis en forme, et toi ? — Moi, je suis fatiguée.', '— Tôi khoẻ, còn bạn? — Còn tôi thì mệt.', '— I’m full of energy, and you? — Me, I’m tired.'),
          EX('Il faut prendre soin de soi.', 'Phải biết chăm sóc bản thân.', 'One has to look after oneself.')
        ])
      ],
      exercises: [
        FILL('— Qui part avec toi ? — {{1}}, je pars seul. (tôi)', ['Moi'],
          'Đứng một mình ở vị trí chủ ngữ nhấn → « Moi ».',
          'Standing alone for emphasis → « Moi ».'),
        FILL('Max travaille avec {{1}}. (tôi)', ['moi'],
          'Sau giới từ « avec » dùng đại từ nhấn « moi ».',
          'After the preposition « avec » use the stressed pronoun « moi ».'),
        CHOICE('Chọn đúng: « — Je n’aime pas le café. — ___ non plus. » (anh ấy cũng không)', 'Choose correctly: “— Je n’aime pas le café. — ___ non plus.” (he neither)',
          ['Lui', 'Il', 'Le'], 0,
          'Với « non plus » dùng đại từ nhấn « lui ».',
          'With « non plus » use the stressed pronoun « lui ».')
      ]
    },

    /* -----------------------------------------------------
       30. L'impératif — p. 134
       ----------------------------------------------------- */
    {
      id: 'gp-imperatif', num: 30, part: 'sentence', minutes: 7,
      title: 'L’impératif',
      subtitle: { vi: 'Mệnh lệnh: ra lệnh, khuyên, hướng dẫn', en: 'The imperative: orders, advice, instructions' },
      summary: {
        vi: 'Impératif là hiện tại bỏ chủ ngữ, chỉ có tu / nous / vous. Động từ -er và aller mất « s » ở ngôi tu, nhưng lấy lại trước « en » và « y ».',
        en: 'The imperative is the present without a subject, only tu / nous / vous. -er verbs and aller drop the « s » with tu, but keep it before « en » and « y ».'
      },
      blocks: [
        P('Bạn gặp impératif khắp nơi: trên biển báo, công thức nấu ăn, lời khuyên của bác sĩ — và trong bài viết DELF khi đưa lời khuyên.',
          'The imperative is everywhere: signs, recipes, doctor’s advice — and in DELF writing when you give recommendations.'),
        H('Hình thành', 'Formation'),
        TABLE([C('Ngôi', 'Person'), C('Câu bình thường', 'Statement'), C('Impératif', 'Imperative')], [
          [C('tu', 'tu'), C('Tu pars.', 'Tu pars.'), C('Pars !', 'Pars !')],
          [C('nous', 'nous'), C('Nous partons.', 'Nous partons.'), C('Partons !', 'Partons !')],
          [C('vous', 'vous'), C('Vous partez.', 'Vous partez.'), C('Partez !', 'Partez !')]
        ]),
        LIST([
          'Nhóm -er và « aller » không có « s » ở ngôi tu: Regarde ! Écoute ! Va vite à l’école !',
          'Nhưng trước « en » và « y » phải giữ « s » để dễ nối âm: Parles-en à Paul ! Penses-y ! Vas-y !',
          'Bất quy tắc: Sois / Soyons / Soyez (être); Aie / Ayons / Ayez (avoir); Sache / Sachons / Sachez (savoir); Veuillez (vouloir, lịch sự: Veuillez patienter).',
          'Phủ định đặt quanh động từ: Ne bougez pas ! N’oublie pas !'
        ], [
          '-er verbs and « aller » have no « s » with tu: Regarde ! Écoute ! Va vite à l’école !',
          'But before « en » and « y » the « s » returns for the liaison: Parles-en à Paul ! Penses-y ! Vas-y !',
          'Irregular: Sois / Soyons / Soyez (être); Aie / Ayons / Ayez (avoir); Sache / Sachons / Sachez (savoir); Veuillez (vouloir, polite: Veuillez patienter).',
          'Negation wraps the verb: Ne bougez pas ! N’oublie pas !'
        ]),
        H('Vị trí đại từ', 'Pronoun position'),
        TABLE([C('Thể', 'Form'), C('Vị trí', 'Position'), C('Ví dụ', 'Example')], [
          [C('khẳng định', 'affirmative'), C('đại từ đứng SAU động từ, nối bằng gạch nối', 'pronoun AFTER the verb, with a hyphen'), C('Écoute-le ! Téléphone-lui ! Allons-y ! Prends-en !', 'Listen to him! Call him! Let’s go! Have some!')],
          [C('khẳng định với me/te', 'affirmative with me/te'), C('me → moi, te → toi', 'me → moi, te → toi'), C('Téléphone-moi ! Lève-toi ! Dépêche-toi !', 'Call me! Get up! Hurry up!')],
          [C('phủ định', 'negative'), C('đại từ đứng TRƯỚC động từ, giữ nguyên dạng', 'pronoun BEFORE the verb, unchanged form'), C('Ne me téléphone pas ! Ne te lève pas ! Ne t’inquiète pas !', 'Don’t call me! Don’t get up! Don’t worry!')]
        ]),
        CALLOUT('trap', 'Dấu gạch nối chỉ có ở thể khẳng định: Téléphone-lui ! nhưng Ne lui téléphone pas !',
          'Hyphens only appear in the affirmative: Téléphone-lui ! but Ne lui téléphone pas !'),
        EXAMPLES([
          EX('Prends ton manteau, il fait froid !', 'Mặc áo khoác vào, trời lạnh!', 'Take your coat, it’s cold!'),
          EX('Attachez vos ceintures !', 'Hãy thắt dây an toàn!', 'Fasten your seat belts!')
        ])
      ],
      exercises: [
        FILL('{{1}} ! (regarder, tu)', ['Regarde'],
          'Nhóm -er ngôi tu không có « s » → Regarde !',
          '-er verb with tu has no « s » → Regarde !'),
        FILL('{{1}} -y ! (penser, tu)', ['Penses'],
          'Trước « y » giữ « s » → Penses-y !',
          'Before « y » the « s » stays → Penses-y !'),
        CHOICE('Chọn đúng: « ___ ! (se lever, tu) »', 'Choose correctly: “___ ! (se lever, tu)”',
          ['Lève-toi', 'Te lève', 'Lève-te'], 0,
          'Khẳng định: đại từ sau động từ, « te » → « toi ».',
          'Affirmative: pronoun after the verb, « te » → « toi ».')
      ]
    },

    /* -----------------------------------------------------
       31. Le conditionnel (1) — p. 136
       ----------------------------------------------------- */
    {
      id: 'gp-conditionnel1', num: 31, part: 'sentence', minutes: 7,
      title: 'Le conditionnel (1)',
      subtitle: { vi: 'Điều kiện (1): lịch sự, khuyên, mong muốn', en: 'Conditional (1): politeness, advice, wishes' },
      summary: {
        vi: 'Conditionnel dùng để xin lịch sự (je voudrais), khuyên nhẹ (vous devriez) và nói mong muốn (j’aimerais). Đuôi: -rais, -rais, -rait, -rions, -riez, -raient.',
        en: 'The conditional is for polite requests (je voudrais), gentle advice (vous devriez) and wishes (j’aimerais). Endings: -rais, -rais, -rait, -rions, -riez, -raient.'
      },
      blocks: [
        P('Gọi điện tới văn phòng mà nói « Je veux parler à monsieur Durand » là nghe cộc; « Je voudrais… » mới lịch sự.',
          'Calling an office with “Je veux parler à monsieur Durand” sounds blunt; “Je voudrais…” is polite.'),
        H('Ba chức năng', 'Three functions'),
        TABLE([C('Chức năng', 'Function'), C('Động từ', 'Verb'), C('Ví dụ', 'Example')], [
          [C('xin lịch sự', 'polite request'), C('vouloir, pouvoir', 'vouloir, pouvoir'), C('Je voudrais un renseignement. Est-ce que je pourrais parler à monsieur Bruni ?', 'I would like some information. Could I speak to Mr Bruni?')],
          [C('khuyên nhẹ', 'gentle advice'), C('devoir', 'devoir'), C('Vous devriez moderniser votre entreprise.', 'You should modernise your company.')],
          [C('mong muốn', 'wish'), C('aimer, vouloir', 'aimer, vouloir'), C('J’aimerais savoir dessiner. Je voudrais être en vacances.', 'I would like to be able to draw. I would like to be on holiday.')]
        ]),
        H('Hình thức thường gặp', 'Common forms'),
        TABLE([C('Nguyên thể', 'Infinitive'), C('je', 'je'), C('vous', 'vous')], [
          [C('vouloir', 'vouloir'), C('voudrais', 'voudrais'), C('voudriez', 'voudriez')],
          [C('aimer', 'aimer'), C('aimerais', 'aimerais'), C('aimeriez', 'aimeriez')],
          [C('devoir', 'devoir'), C('devrais', 'devrais'), C('devriez', 'devriez')],
          [C('pouvoir', 'pouvoir'), C('pourrais', 'pourrais'), C('pourriez', 'pourriez')],
          [C('faire', 'faire'), C('ferais', 'ferais'), C('feriez', 'feriez')],
          [C('aller', 'aller'), C('irais', 'irais'), C('iriez', 'iriez')]
        ]),
        LIST([
          'Đuôi chung: -rais, -rais, -rait, -rions, -riez, -raient.',
          '« Bien » (= sẵn lòng) đi với mong muốn: Je boirais bien un café. J’irais bien au cinéma.',
          'Câu hỏi lịch sự: Pourriez-vous me dire où se trouve la poste ?',
          'Phủ định giữ nguyên dạng: Je ne pourrais pas venir demain.'
        ], [
          'Shared endings: -rais, -rais, -rait, -rions, -riez, -raient.',
          '« Bien » (= gladly) accompanies wishes: Je boirais bien un café. J’irais bien au cinéma.',
          'Polite questions: Pourriez-vous me dire où se trouve la poste ?',
          'Negation keeps the same form: Je ne pourrais pas venir demain.'
        ]),
        EXAMPLES([
          EX('— Je voudrais parler à monsieur Durand. — Il n’est pas là. Vous devriez rappeler dans un quart d’heure.', '— Tôi muốn gặp ông Durand. — Ông ấy không có ở đây. Anh nên gọi lại sau mười lăm phút.', '— I’d like to speak to Mr Durand. — He’s out. You should call back in fifteen minutes.')
        ])
      ],
      exercises: [
        FILL('Je {{1}} un café, s’il vous plaît. (vouloir, lịch sự)', ['voudrais'],
          'Xin lịch sự dùng conditionnel « je voudrais ».',
          'Polite requests use the conditional « je voudrais ».'),
        FILL('Vous {{1}} rappeler demain. (devoir, khuyên)', ['devriez'],
          'Khuyên nhẹ dùng « vous devriez ».',
          'Gentle advice uses « vous devriez ».'),
        CHOICE('Đuôi nào KHÔNG thuộc conditionnel?', 'Which ending does NOT belong to the conditional?',
          ['-ons', '-rais', '-raient'], 0,
          'Conditionnel dùng -rais, -rait, -rions, -riez, -raient; « -ons » là hiện tại.',
          'The conditional uses -rais, -rait, -rions, -riez, -raient; « -ons » is present tense.')
      ]
    },

    /* -----------------------------------------------------
       32. Les relatifs — p. 140–144
       ----------------------------------------------------- */
    {
      id: 'gp-relatifs', num: 32, part: 'sentence', minutes: 12,
      title: 'Les relatifs',
      subtitle: { vi: 'Mệnh đề quan hệ: qui, que, où, dont, ce qui, lequel', en: 'Relative clauses: qui, que, où, dont, ce qui, lequel' },
      summary: {
        vi: 'Đại từ quan hệ nối hai câu mà không lặp danh từ: qui = chủ ngữ, que = tân ngữ trực tiếp, où = nơi/thời điểm, dont = « de », lequel = sau giới từ.',
        en: 'Relative pronouns join two sentences without repeating the noun: qui = subject, que = direct object, où = place/time, dont = « de », lequel = after a preposition.'
      },
      blocks: [
        P('Thay vì « Une femme passe. Cette femme est brune », nói « La femme qui passe est brune ». Đây là cấu trúc giúp câu viết dài mà vẫn gọn.',
          'Instead of “Une femme passe. Cette femme est brune”, say “La femme qui passe est brune”. This structure lengthens a sentence without padding it.'),
        H('Qui, que, où', 'Qui, que, où'),
        TABLE([C('Đại từ', 'Pronoun'), C('Thay cho', 'Replaces'), C('Ví dụ', 'Example')], [
          [C('qui', 'qui'), C('chủ ngữ của động từ theo sau (người hoặc vật)', 'the subject of the following verb (person or thing)'), C('La femme qui passe est brune. C’est un livre qui est intéressant.', 'The woman who is passing is dark-haired. It is a book that is interesting.')],
          [C('que', 'que'), C('tân ngữ trực tiếp của động từ theo sau', 'the direct object of the following verb'), C('La femme que je regarde porte une robe que j’adore.', 'The woman I am looking at wears a dress I love.')],
          [C('où', 'où'), C('bổ ngữ nơi chốn hoặc thời gian', 'a place or time complement'), C('La ville où je suis né est petite. Le jour où je suis né était un jeudi.', 'The town where I was born is small. The day I was born was a Thursday.')]
        ]),
        LIST([
          '« Que » rút gọn trước nguyên âm, « qui » thì không: La femme qu’il aime / La femme qui arrive.',
          'Không dùng « que » khi thiếu chủ ngữ: nói « un livre qui est intéressant », không nói « un livre que c’est intéressant ».',
          'Thời gian dùng « où », không dùng « quand »: le jour où je suis né.',
        ], [
          '« Que » elides before a vowel, « qui » does not: La femme qu’il aime / La femme qui arrive.',
          'Never use « que » when the subject is missing: say “un livre qui est intéressant”, not “un livre que c’est intéressant”.',
          'Time uses « où », never « quand »: le jour où je suis né.'
        ]),
        H('Dont', 'Dont'),
        LIST([
          '« Dont » thay « de + danh từ » — với động từ: parler de, rêver de, avoir besoin de, s’occuper de.',
          'Cũng thay bổ ngữ của danh từ hoặc tính từ: C’est la société dont je suis le directeur. C’est un travail dont je suis content.',
          'Không dùng « que » thay « dont »: nói « un appareil dont j’ai besoin », không nói « que j’ai besoin ».',
          '« Dont » đứng ngay sau danh từ được thay, không đặt sau giới từ khác.'
        ], [
          '« Dont » replaces « de + noun » — with verbs: parler de, rêver de, avoir besoin de, s’occuper de.',
          'It also replaces the complement of a noun or adjective: C’est la société dont je suis le directeur. C’est un travail dont je suis content.',
          'Never use « que » for « dont »: say “un appareil dont j’ai besoin”, not “que j’ai besoin”.',
          '« Dont » sits right after the noun it replaces, never after another preposition.'
        ]),
        H('Ce qui / ce que / ce dont', 'Ce qui / ce que / ce dont'),
        TABLE([C('Dạng', 'Form'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('ce qui', 'ce qui'), C('cái mà (làm chủ ngữ)', 'what (as subject)'), C('J’aime ce qui brille.', 'I like what shines.')],
          [C('ce que', 'ce que'), C('cái mà (làm tân ngữ)', 'what (as object)'), C('Tu sais ce que j’aime. Prends tout ce que tu veux.', 'You know what I like. Take everything you want.')],
          [C('ce dont', 'ce dont'), C('cái mà (đi với « de »)', 'what (with « de »)'), C('Devine ce dont j’ai envie.', 'Guess what I want.')]
        ]),
        H('Nhấn mạnh: c’est … qui / que', 'Emphasis: c’est … qui / que'),
        LIST([
          '« C’est … qui » nhấn chủ ngữ, « c’est … que » nhấn tân ngữ: C’est Paul qui est le directeur. C’est Julie que je vois ce soir.',
          'Động từ theo « c’est moi qui » hợp với « moi » (ngôi 1): C’est moi qui suis responsable. C’est moi qui ai les clés.',
          '« Ce qui/que …, c’est » nhấn cả ý: Ce qui me choque, c’est la misère. Ce que je déteste, c’est l’hypocrisie.'
        ], [
          '« C’est … qui » highlights the subject, « c’est … que » the object: C’est Paul qui est le directeur. C’est Julie que je vois ce soir.',
          'The verb after « c’est moi qui » agrees with « moi» (first person): C’est moi qui suis responsable. C’est moi qui ai les clés.',
          '« Ce qui/que …, c’est » highlights a whole idea: Ce qui me choque, c’est la misère. Ce que je déteste, c’est l’hypocrisie.'
        ]),
        H('Đại từ quan hệ ghép', 'Compound relative pronouns'),
        TABLE([C('Giống / số', 'Gender / number'), C('Sau giới từ', 'After a preposition'), C('Với « à »', 'With « à »'), C('Với « de »', 'With « de »')], [
          [C('đực số ít', 'masculine singular'), C('lequel', 'lequel'), C('auquel', 'auquel'), C('duquel', 'duquel')],
          [C('cái số ít', 'feminine singular'), C('laquelle', 'laquelle'), C('à laquelle', 'à laquelle'), C('de laquelle', 'de laquelle')],
          [C('đực số nhiều', 'masculine plural'), C('lesquels', 'lesquels'), C('auxquels', 'auxquels'), C('desquels', 'desquels')],
          [C('cái số nhiều', 'feminine plural'), C('lesquelles', 'lesquelles'), C('auxquelles', 'auxquelles'), C('desquelles', 'desquelles')]
        ]),
        CALLOUT('trap', 'Duquel/desquels luôn đi kèm một giới từ khác: le musée près duquel j’habite. Nếu chỉ có « de » trần thì dùng « dont »: le musée dont je parle. Với người, « avec qui / pour qui » tự nhiên hơn « avec lequel ».',
          'Duquel/desquels always follow another preposition: le musée près duquel j’habite. With a bare « de », use « dont »: le musée dont je parle. For people, « avec qui / pour qui » sounds more natural than « avec lequel ».'),
        EXAMPLES([
          EX('La femme qui arrive est la femme que j’aime.', 'Người phụ nữ đang tới là người tôi yêu.', 'The woman coming in is the woman I love.'),
          EX('Voilà le projet sur lequel je travaille.', 'Đây là dự án tôi đang làm.', 'Here is the project I am working on.')
        ])
      ],
      exercises: [
        FILL('C’est un livre {{1}} est intéressant.', ['qui'],
          'Sau « qui » là động từ « est », thiếu chủ ngữ → « qui ».',
          'The verb « est » needs a subject → « qui ».'),
        FILL('C’est un appareil {{1}} j’ai besoin.', ['dont'],
          '« Avoir besoin de » → « dont ».',
          '« Avoir besoin de » → « dont ».'),
        CHOICE('Chọn đúng: « La ville ___ je suis né est petite. »', 'Choose correctly: “La ville ___ je suis né est petite.”',
          ['où', 'que', 'qui'], 0,
          'Nơi chốn dùng « où ».',
          'A place uses « où ».'),
        TRANSLATE('Cái tôi thích là âm nhạc.', 'What I like is music.',
          ['Ce que j’aime, c’est la musique.'],
          '« Ce que » đứng đầu câu nhấn mạnh, theo sau là « c’est ».',
          '« Ce que » heads the emphatic structure, followed by « c’est ».')
      ]
    },

    /* -----------------------------------------------------
       33. L'interrogation (2) — p. 148–150
       ----------------------------------------------------- */
    {
      id: 'gp-interrogation2', num: 33, part: 'sentence', minutes: 8,
      title: 'L’interrogation (2)',
      subtitle: { vi: 'Câu hỏi: où, quand, comment, combien, pourquoi, quel, lequel', en: 'Questions: où, quand, comment, combien, pourquoi, quel, lequel' },
      summary: {
        vi: 'Ba cách hỏi: đảo ngữ trang trọng (Où allez-vous ?), « est-ce que » trung tính, và hỏi cuối câu kiểu thân mật (Vous allez où ?).',
        en: 'Three ways to ask: formal inversion (Où allez-vous ?), neutral « est-ce que », and casual end-of-sentence question (Vous allez où ?).'
      },
      blocks: [
        P('Chương 3 dạy câu hỏi cơ bản; chương này thêm các từ hỏi và cách hỏi theo văn phong.',
          'Chapter 3 covered the basic question; this one adds the question words and the three registers.'),
        H('Ba cách hỏi', 'Three registers'),
        TABLE([C('Văn phong', 'Register'), C('Cấu trúc', 'Pattern'), C('Ví dụ', 'Example')], [
          [C('trang trọng (đảo ngữ)', 'formal (inversion)'), C('từ hỏi + động từ-từ + đại từ', 'question word + verb-hyphen-pronoun'), C('Où allez-vous ? Quand partez-vous ? Comment allez-vous ?', 'Where are you going? When are you leaving? How are you?')],
          [C('trung tính', 'neutral'), C('từ hỏi + est-ce que + câu', 'question word + est-ce que + clause'), C('Où est-ce que vous allez ? Quand est-ce que vous partez ?', 'Where are you going? When are you leaving?')],
          [C('thân mật', 'casual'), C('câu bình thường + từ hỏi cuối câu', 'normal clause + question word at the end'), C('Vous allez où ? Vous partez quand ?', 'Where are you going? When are you leaving?')]
        ]),
        H('Từ hỏi', 'Question words'),
        TABLE([C('Từ hỏi', 'Word'), C('Hỏi về', 'Asks about'), C('Trả lời mẫu', 'Sample answer')], [
          [C('où', 'où'), C('nơi chốn', 'place'), C('À Rome.', 'To Rome.')],
          [C('quand', 'quand'), C('thời gian', 'time'), C('Demain.', 'Tomorrow.')],
          [C('comment', 'comment'), C('cách thức', 'manner'), C('En train.', 'By train.')],
          [C('combien', 'combien'), C('số lượng / giá', 'quantity / price'), C('1 000 euros.', '1,000 euros.')],
          [C('pourquoi', 'pourquoi'), C('nguyên nhân', 'cause'), C('Parce que j’ai peur de l’avion.', 'Because I’m afraid of flying.')]
        ]),
        LIST([
          'Với danh từ chủ ngữ phải có đại từ nhắc lại: Où Paul va-t-il ? Quand vos amis arrivent-ils ?',
          'Giữa hai nguyên âm thêm « -t- »: Va-t-il ? Arrive-t-elle ?',
          '« Combien » + danh từ cần « de »: Combien de livres ? Combien payez-vous ?',
          '« Pourquoi » trả lời bằng « parce que » (nguyên nhân) hoặc « pour » + danh từ (mục đích).'
        ], [
          'With a noun subject, add a matching pronoun: Où Paul va-t-il ? Quand vos amis arrivent-ils ?',
          'Add « -t- » between two vowels: Va-t-il ? Arrive-t-elle ?',
          '« Combien » + noun needs « de »: Combien de livres ? Combien payez-vous ?',
          'Answer « pourquoi » with « parce que » (cause) or « pour » + noun (purpose).'
        ]),
        H('Qui / que / quoi', 'Qui / que / quoi'),
        TABLE([C('Dạng', 'Form'), C('Hỏi về', 'Asks about'), C('Ví dụ', 'Example')], [
          [C('qui (tân ngữ)', 'qui (object)'), C('người', 'person'), C('Qui cherchez-vous ? Vous cherchez qui ?', 'Who are you looking for?')],
          [C('qui est-ce qui (chủ ngữ)', 'qui est-ce qui (subject)'), C('người', 'person'), C('Qui est-ce qui sonne ? — C’est le facteur.', 'Who is ringing? — The postman.')],
          [C('que / quoi (tân ngữ)', 'que / quoi (object)'), C('vật', 'thing'), C('Que cherchez-vous ? Vous cherchez quoi ?', 'What are you looking for?')],
          [C('qu’est-ce qui (chủ ngữ)', 'qu’est-ce qui (subject)'), C('vật', 'thing'), C('Qu’est-ce qui sonne ? — C’est le téléphone.', 'What is ringing? — The phone.')]
        ]),
        H('Quel / lequel', 'Quel / lequel'),
        TABLE([C('Từ', 'Word'), C('Dùng khi', 'Use'), C('Ví dụ', 'Example')], [
          [C('quel / quelle / quels / quelles', 'quel / quelle / quels / quelles'), C('hỏi trực tiếp về danh từ (hợp giống, số)', 'asks directly about a noun (agrees)'), C('Quel âge avez-vous ? Quelle est votre nationalité ?', 'How old are you? What is your nationality?')],
          [C('lequel / laquelle / lesquels / lesquelles', 'lequel / laquelle / lesquels / lesquelles'), C('chọn trong một tập đã biết', 'choosing within a known set'), C('— Passe-moi le stylo. — Lequel ? Le bleu ou le rouge ?', '— Pass me the pen. — Which one? The blue or the red?')]
        ]),
        CALLOUT('tip', 'Hỏi nghề dùng « Quelle est votre profession ? », không dùng « Qu’est-ce que votre profession ». Trước danh từ luôn là « quel », không phải « que ».',
          'Asking a job uses « Quelle est votre profession ? », never « Qu’est-ce que votre profession ». Before a noun it is always « quel », not « que ».')
      ],
      exercises: [
        FILL('{{1}} est-ce que vous partez ? (hỏi thời gian)', ['Quand'],
          'Hỏi thời gian dùng « quand ».',
          'Asking about time uses « quand ».'),
        FILL('{{1}} âge avez-vous ?', ['Quel'],
          '« Âge » là danh từ đực số ít → « quel ».',
          '« Âge » is a masculine singular noun → « quel ».'),
        CHOICE('Chọn đúng: « — Passe-moi le stylo. — ___ ? Le bleu ou le rouge ? »', 'Choose correctly: “— Passe-moi le stylo. — ___ ? Le bleu ou le rouge ?”',
          ['Lequel', 'Quel', 'Que'], 0,
          'Chọn trong tập đã biết dùng « lequel ».',
          'Choosing within a known set uses « lequel ».')
      ]
    },

    /* -----------------------------------------------------
       34. La négation (2) — p. 152–154
       ----------------------------------------------------- */
    {
      id: 'gp-negation2', num: 34, part: 'sentence', minutes: 9,
      title: 'La négation (2)',
      subtitle: { vi: 'Phủ định (2): jamais, plus, rien, personne, aucun, ni… ni, ne… que', en: 'Negation (2): jamais, plus, rien, personne, aucun, ni… ni, ne… que' },
      summary: {
        vi: 'Mỗi cặp phủ định ứng với một từ khẳng định: toujours → jamais / plus; quelque chose → rien; quelqu’un → personne; un seul → aucun; et → ni. « Ne… que » không phải phủ định mà là giới hạn.',
        en: 'Each negative pairs with an affirmative: toujours → jamais / plus; quelque chose → rien; quelqu’un → personne; a single one → aucun; and → ni. « Ne… que » is not a negation but a restriction.'
      },
      blocks: [
        P('Phủ định tiếng Pháp là hệ thống có đối ứng: học theo cặp thì nhớ nhanh hơn học từng từ.',
          'French negation is a system of pairs: learn them as opposites and they stick.'),
        H('Các cặp đối ứng', 'The pairs'),
        TABLE([C('Khẳng định', 'Affirmative'), C('Phủ định', 'Negative'), C('Ví dụ', 'Example')], [
          [C('toujours', 'toujours'), C('ne… jamais', 'ne… jamais'), C('Je bois toujours du thé. / Je ne bois jamais de café.', 'I always drink tea. / I never drink coffee.')],
          [C('encore', 'encore'), C('ne… plus', 'ne… plus'), C('Max fume encore. / Moi, je ne fume plus.', 'Max still smokes. / Me, I no longer smoke.')],
          [C('quelque chose', 'quelque chose'), C('ne… rien', 'ne… rien'), C('Tu vois quelque chose ? / Je ne vois rien.', 'Do you see something? / I see nothing.')],
          [C('quelqu’un', 'quelqu’un'), C('ne… personne', 'ne… personne'), C('Tu attends quelqu’un ? / Je n’attends personne.', 'Are you waiting for someone? / I am waiting for no one.')],
          [C('un(e) seul(e)', 'one single'), C('ne… aucun(e)', 'ne… aucun(e)'), C('Je ne connais aucun Français. Je n’ai aucun ami ici.', 'I know no French person at all. I have no friend here.')]
        ]),
        LIST([
          '« Toujours » nghĩa “vẫn còn” thì phủ định là « ne… plus »: — Tu fumes toujours ? — Non, je ne fume plus.',
          'Phủ định của « déjà »: « jamais » khi kết luận (Je ne suis jamais allé à Paris) hoặc « pas encore » khi chưa xảy ra (Je ne suis pas encore allé).',
          '« Plus » phủ định không đọc « s »: [ply].',
          'Ở vị trí chủ ngữ: Rien ne marche. Personne ne parle. Không dùng « pas » thêm: không nói « ne connais pas personne ».',
          'Nhiều phủ định có thể đi liền: Tu ne comprends jamais rien. Il n’y a plus personne.'
        ], [
          'When « toujours » means “still”, the negative is « ne… plus »: — Tu fumes toujours ? — Non, je ne fume plus.',
          'The negative of « déjà »: « jamais » for a conclusion (Je ne suis jamais allé à Paris) or « pas encore » for not yet (Je ne suis pas encore allé).',
          'Negative « plus » is pronounced without the s: [ply].',
          'In subject position: Rien ne marche. Personne ne parle. Never add « pas »: not “ne connais pas personne”.',
          'Negatives can pile up: Tu ne comprends jamais rien. Il n’y a plus personne.'
        ]),
        H('Ni… ni  và sans', 'Ni… ni and sans'),
        LIST([
          '« Ni… ni » phủ định hai hay nhiều yếu tố nối bằng « et »: Paul n’est ni jeune, ni beau, ni intelligent.',
          'Sau « ni » và « sans », article không xác định/partitif biến mất: Je n’ai ni stylo ni cahier. Je ne veux ni thé ni café. Il sort sans imperméable.',
          'Dùng « sans… ni » thay vì « sans… sans »: sans imperméable ni parapluie; sans huile ni vinaigre.',
          '« Sans » là phủ định của « avec », không cần « ne ».'
        ], [
          '« Ni… ni » negates two or more items joined by « et »: Paul n’est ni jeune, ni beau, ni intelligent.',
          'After « ni » and « sans » the indefinite/partitive article disappears: Je n’ai ni stylo ni cahier. Je ne veux ni thé ni café. Il sort sans imperméable.',
          'Prefer « sans… ni » to « sans… sans »: sans imperméable ni parapluie; sans huile ni vinaigre.',
          '« Sans » is the negative of « avec » and needs no « ne ».'
        ]),
        H('Ne… que = chỉ', 'Ne… que = only'),
        LIST([
          '« Ne… que » là giới hạn, không phải phủ định: Julien n’a que cinq ans (= seulement cinq ans).',
          '« Ne » đứng trước động từ, « que » đi theo yếu tố bị giới hạn: Ça ne coûte que dix euros. / Ça ne coûte, en ce moment, que dix euros.',
          'Trong quảng cáo có thể bỏ « ne »: Que 10 € ! (= seulement 10 euros).',
          'Đừng nhầm « ne… que » với phủ định: câu vẫn khẳng định điều được nêu, chỉ thu hẹp phạm vi.'
        ], [
          '« Ne… que » restricts, it does not negate: Julien n’a que cinq ans (= only five).',
          '« Ne » precedes the verb, « que » travels with the restricted element: Ça ne coûte que dix euros. / Ça ne coûte, en ce moment, que dix euros.',
          'Adverts may drop « ne »: Que 10 € ! (= only 10 euros).',
          'Do not confuse « ne… que » with negation: the statement stays affirmative, only narrowed.'
        ]),
        EXAMPLES([
          EX('Je ne travaille ni le lundi ni le mardi.', 'Tôi không làm việc thứ Hai cũng không thứ Ba.', 'I work neither Monday nor Tuesday.'),
          EX('Il n’y a plus personne.', 'Không còn ai nữa.', 'There is no one left.')
        ])
      ],
      exercises: [
        FILL('Je bois toujours du thé, mais je ne bois {{1}} de café.', ['jamais'],
          'Đối ứng của « toujours » (thói quen) là « ne… jamais ».',
          'The negative of habitual « toujours » is « ne… jamais ».'),
        FILL('Je n’ai {{1}} stylo ni cahier.', ['ni'],
          'Hai yếu tố bị phủ định → « ni… ni ».',
          'Two negated items → « ni… ni ».'),
        CHOICE('Chọn đúng: « Julien ___ cinq ans. » (chỉ mới)', 'Choose correctly: “Julien ___ cinq ans.” (only)',
          ['n’a que', 'n’a pas', 'n’a aucun'], 0,
          '« Ne… que » diễn tả giới hạn “chỉ”.',
          '« Ne… que » expresses the restriction “only”.'),
        TRANSLATE('Tôi không thấy gì cả.', 'I see nothing.',
          ['Je ne vois rien.'],
          '« Ne… rien » là phủ định của « quelque chose ».',
          '« Ne… rien » negates « quelque chose ».')
      ]
    },

    /* -----------------------------------------------------
       35. Le discours indirect au présent — p. 156
       ----------------------------------------------------- */
    {
      id: 'gp-discours-present', num: 35, part: 'sentence', minutes: 7,
      title: 'Le discours indirect au présent',
      subtitle: { vi: 'Tường thuật ở hiện tại: que, si, ce que', en: 'Reported speech in the present: que, si, ce que' },
      summary: {
        vi: 'Khi động từ tường thuật ở hiện tại, thì của lời nói không đổi: chỉ cần đổi dấu hai chấm thành « que » (câu kể), « si » (câu hỏi có/không) hoặc giữ từ hỏi (câu hỏi có từ hỏi).',
        en: 'When the reporting verb is in the present, tenses stay the same: just replace the colon with « que » (statement), « si » (yes/no question) or keep the question word.'
      },
      blocks: [
        P('Đây là kỹ năng của bài nghe DELF: nghe một người nói rồi kể lại cho người khác.',
          'This is the DELF listening skill: hear one person and report it to another.'),
        TABLE([C('Lời nói trực tiếp', 'Direct speech'), C('Tường thuật', 'Reported'), C('Cấu trúc', 'Structure')], [
          [C('Paul dit : « Il pleut. »', 'Paul says: “It is raining.”'), C('Paul dit qu’il pleut.', 'Paul says that it is raining.'), C('+ que', '+ que')],
          [C('« Est-ce que vous sortez ? »', '“Are you going out?”'), C('Il demande si vous sortez.', 'He asks whether you are going out.'), C('+ si', '+ si')],
          [C('« Où allez-vous ? »', '“Where are you going?”'), C('Il demande où vous allez.', 'He asks where you are going.'), C('+ từ hỏi, KHÔNG đảo ngữ', '+ question word, NO inversion')],
          [C('« Qu’est-ce que vous faites ? »', '“What are you doing?”'), C('Il demande ce que vous faites.', 'He asks what you are doing.'), C('+ ce que', '+ ce que')],
          [C('« Qu’est-ce qui se passe ? »', '“What is happening?”'), C('Il demande ce qui se passe.', 'He asks what is happening.'), C('+ ce qui', '+ ce qui')],
          [C('« Partez ! »', '“Leave!”'), C('Il lui dit de partir.', 'He tells him to leave.'), C('+ de + infinitif', '+ de + infinitive')]
        ]),
        LIST([
          'Câu hỏi có từ hỏi giữ nguyên từ hỏi nhưng bỏ đảo ngữ: Où allez-vous ? → Il demande où vous allez.',
          'Đại từ sở hữu và nhân xưng đổi theo người nói: « Je pars avec ma fille » → Il dit qu’il part avec sa fille.',
          'Khi có nhiều mệnh đề, lặp lại « que / si »: Il dit qu’il part et qu’il emmène sa fille. Il demande si tu es prêt et si on y va.',
          'Không nói « je sais qu’est-ce qu’il veut »: đúng là « je sais ce qu’il veut ».'
        ], [
          'A question with a question word keeps the word but drops inversion: Où allez-vous ? → Il demande où vous allez.',
          'Possessives and pronouns shift to the speaker: « Je pars avec ma fille » → Il dit qu’il part avec sa fille.',
          'With several clauses, repeat « que / si »: Il dit qu’il part et qu’il emmène sa fille. Il demande si tu es prêt et si on y va.',
          'Never say “je sais qu’est-ce qu’il veut”: the correct form is “je sais ce qu’il veut”.'
        ]),
        CALLOUT('tip', 'Động từ tường thuật hữu dụng: dire, demander, répondre, affirmer, déclarer, expliquer, ajouter. Chúng đều + que / si / từ hỏi, không cần đảo ngữ.',
          'Useful reporting verbs: dire, demander, répondre, affirmer, déclarer, expliquer, ajouter. They all take que / si / a question word, with no inversion.'),
        EXAMPLES([
          EX('Il affirme qu’il est innocent.', 'Anh ta khẳng định mình vô tội.', 'He claims he is innocent.'),
          EX('Je lui demande où il va et ce qu’il va faire.', 'Tôi hỏi anh ấy đi đâu và sẽ làm gì.', 'I ask him where he is going and what he will do.')
        ])
      ],
      exercises: [
        FILL('« Il fait froid ? » → Il demande {{1}} il fait froid.', ['si'],
          'Câu hỏi có/không dùng « si ».',
          'A yes/no question uses « si ».'),
        FILL('« Où allez-vous ? » → Il demande où vous {{1}}.', ['allez'],
          'Tường thuật bỏ đảo ngữ, giữ trật tự chủ ngữ + động từ.',
          'Reported speech drops inversion and keeps subject + verb order.'),
        CHOICE('Chọn đúng: « Qu’est-ce que tu veux ? » →', 'Choose correctly: “Qu’est-ce que tu veux ?” →',
          ['Il demande ce que je veux.', 'Il demande qu’est-ce que je veux.', 'Il demande que je veux.'], 0,
          '« Qu’est-ce que » chuyển thành « ce que ».',
          '« Qu’est-ce que » becomes « ce que ».')
      ]
    },

    /* -----------------------------------------------------
       36. Le gérondif — p. 158
       ----------------------------------------------------- */
    {
      id: 'gp-gerondif', num: 36, part: 'sentence', minutes: 6,
      title: 'Le gérondif',
      subtitle: { vi: 'Gérondif: en + V-ant (đồng thời, cách thức, điều kiện)', en: 'The gerund: en + verb-ant (simultaneity, manner, condition)' },
      summary: {
        vi: 'Gérondif = « en » + động từ + « -ant », lấy từ radical của « nous » ở hiện tại. Nó chỉ cùng chủ ngữ với động từ chính.',
        en: 'The gerund is « en » + verb + « -ant », built on the present-tense « nous » stem. It shares the subject of the main verb.'
      },
      blocks: [
        H('Hình thành', 'Formation'),
        TABLE([C('Hiện tại « nous »', 'Present « nous »'), C('Gérondif', 'Gerund')], [
          [C('nous lisons', 'nous lisons'), C('en lisant', 'en lisant')],
          [C('nous mangeons', 'nous mangeons'), C('en mangeant', 'en mangeant')],
          [C('nous buvons', 'nous buvons'), C('en buvant', 'en buvant')],
          [C('nous faisons', 'nous faisons'), C('en faisant', 'en faisant')],
          [C('nous sommes / nous avons / nous savons', 'nous sommes / nous avons / nous savons'), C('en étant / en ayant / en sachant', 'en étant / en ayant / en sachant')]
        ]),
        H('Công dụng', 'Uses'),
        TABLE([C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('đồng thời', 'simultaneity'), C('Il travaille en chantant. Il lit en marchant.', 'He works while singing. He reads while walking.')],
          [C('nguyên nhân / cách thức', 'cause / manner'), C('Il a fait fortune en jouant. Je suis tombé en skiant.', 'He made his fortune by gambling. I fell while skiing.')],
          [C('điều kiện (= si)', 'condition (= si)'), C('En cherchant, on trouve. En signant, vous acceptez.', 'By searching, you find. By signing, you agree.')]
        ]),
        LIST([
          '« Tout en » nhấn đồng thời hoặc đối lập: Il travaille tout en écoutant la radio. Il est malheureux, tout en étant très riche.',
          'Chủ ngữ của gérondif phải là chủ ngữ của động từ chính: En dansant le tango, je pense à Max (tôi nhảy).',
          'Participe présent = gérondif bỏ « en », dùng nhiều trong văn viết thay « qui + động từ »: les personnes ayant plus de 18 ans (= qui ont).',
          'Trong câu « Je pense à Max dansant le tango », người nhảy là Max — không phải tôi.'
        ], [
          '« Tout en » emphasises simultaneity or contrast: Il travaille tout en écoutant la radio. Il est malheureux, tout en étant très riche.',
          'The gerund’s subject must be the main verb’s subject: En dansant le tango, je pense à Max (I am dancing).',
          'The present participle is the gerund without « en », common in writing for “qui + verb”: les personnes ayant plus de 18 ans (= qui ont).',
          'In “Je pense à Max dansant le tango”, the dancer is Max — not me.'
        ]),
        EXAMPLES([
          EX('J’apprends le français en lisant et en écoutant la radio.', 'Tôi học tiếng Pháp bằng cách đọc và nghe radio.', 'I learn French by reading and listening to the radio.'),
          EX('En signant, vous acceptez les conditions.', 'Ký vào là bạn chấp nhận điều kiện.', 'By signing, you accept the terms.')
        ])
      ],
      exercises: [
        FILL('Il lit le journal {{1}} buvant du café.', ['en'],
          'Gérondif luôn bắt đầu bằng « en ».',
          'The gerund always starts with « en ».'),
        FILL('Nous mangeons → {{1}} mangeant.', ['en'],
          'Radical của « nous mangeons » + -ant, thêm « en ».',
          'Stem of « nous mangeons » + -ant, preceded by « en ».'),
        CHOICE('Chọn đúng: « ___ , on trouve. » (điều kiện)', 'Choose correctly: “___ , on trouve.” (condition)',
          ['En cherchant', 'Cherchant', 'En cherché'], 0,
          'Điều kiện diễn tả bằng « en » + V-ant.',
          'A condition is expressed with « en » + verb-ant.')
      ]
    },

    /* -----------------------------------------------------
       37. Les prépositions et les verbes — p. 160
       ----------------------------------------------------- */
    {
      id: 'gp-prep-verbes', num: 37, part: 'sentence', minutes: 7,
      title: 'Les prépositions et les verbes',
      subtitle: { vi: 'Động từ + à / de + nguyên thể, và động từ không cần giới từ', en: 'Verbs + à / de + infinitive, and verbs with no preposition' },
      summary: {
        vi: 'Sau giới từ luôn là nguyên thể. Có ba nhóm: động từ + de (essayer de, refuser de), động từ + à (commencer à, réussir à), và động từ không giới từ (espérer, penser, adorer).',
        en: 'After a preposition comes the infinitive. Three groups: verb + de (essayer de, refuser de), verb + à (commencer à, réussir à), and no preposition (espérer, penser, adorer).'
      },
      blocks: [
        P('Phải học thuộc nhóm nào đi vói « à », nhóm nào với « de » và nhóm nào không có giới từ — đây là lỗi phổ biến nhất ở trình độ B1.',
          'You must learn which group takes « à », which « de » and which none — the most common B1 error.'),
        H('Động từ + « de »', 'Verbs + « de »'),
        TABLE([C('Động từ', 'Verb'), C('Ví dụ', 'Example')], [
          [C('accepter de, décider de, refuser de', 'accepter de, décider de, refuser de'), C('Je refuse de continuer. Il décide de partir.', 'I refuse to continue. He decides to leave.')],
          [C('essayer de, finir de, arrêter de, oublier de', 'essayer de, finir de, arrêter de, oublier de'), C('On essaie de faire le maximum. Elle oublie de téléphoner.', 'We try to do our best. She forgets to call.')],
          [C('regretter de, rêver de, s’arrêter de, se dépêcher de', 'regretter de, rêver de, s’arrêter de, se dépêcher de'), C('Il regrette de partir. Dépêche-toi de finir !', 'He regrets leaving. Hurry up and finish!')]
        ]),
        H('Động từ + « à »', 'Verbs + « à »'),
        TABLE([C('Động từ', 'Verb'), C('Ví dụ', 'Example')], [
          [C('apprendre à, commencer à, continuer à, se mettre à', 'apprendre à, commencer à, continuer à, se mettre à'), C('J’apprends à conduire. Il commence à pleuvoir.', 'I am learning to drive. It is starting to rain.')],
          [C('réussir à, arriver à, chercher à, hésiter à', 'réussir à, arriver à, chercher à, hésiter à'), C('Elle réussit à tout faire. Il hésite à répondre.', 'She manages to do everything. He hesitates to answer.')],
          [C('aider qqn à, inviter qqn à', 'aider qqn à, inviter qqn à'), C('Il m’aide à déménager. Elle m’invite à dîner.', 'He helps me move. She invites me to dinner.')]
        ]),
        H('Danh từ / tính từ + « de » (hay « à »)', 'Noun / adjective + « de » (or « à »)'),
        LIST([
          '+ « de »: être content de, heureux de, pressé de; avoir envie de, peur de, l’habitude de — Je suis content de venir.',
          '+ « à »: être prêt à, être habitué à; avoir du mal à, avoir tendance à — Je suis prêt à partir. J’ai du mal à comprendre.',
          'Giới từ phải theo đúng động từ/tính từ, không theo tiếng Việt: « sẵn sàng làm » → être prêt À faire, không phải de faire.',
          'Động từ chỉ sở thích và dự định KHÔNG có giới từ: J’adore voyager. J’espère partir. Je déteste attendre. Je pense revenir.',
          'Nguyên thể làm chủ ngữ không có giới từ: Marcher, courir, bouger est bon pour la santé.'
        ], [
          '+ « de »: être content de, heureux de, pressé de; avoir envie de, peur de, l’habitude de — Je suis content de venir.',
          '+ « à »: être prêt à, être habitué à; avoir du mal à, avoir tendance à — Je suis prêt à partir. J’ai du mal à comprendre.',
          'The preposition belongs to the verb/adjective, not to Vietnamese or English: “ready to do” → être prêt À faire, not de faire.',
          'Verbs of taste and intention take NO preposition: J’adore voyager. J’espère partir. Je déteste attendre. Je pense revenir.',
          'An infinitive as subject takes no preposition: Marcher, courir, bouger est bon pour la santé.'
        ]),
        EXAMPLES([
          EX('On commence à travailler à 8 h et on finit de travailler à 19 h.', 'Chúng tôi bắt đầu làm lúc 8 giờ và xong việc lúc 19 giờ.', 'We start work at 8 and finish at 7 p.m.'),
          EX('J’espère partir demain.', 'Tôi hy vọng đi ngày mai.', 'I hope to leave tomorrow.')
        ])
      ],
      exercises: [
        FILL('J’espère {{1}} partir demain. (giới từ hay không?)', ['Ø', ''],
          '« Espérer » không có giới từ → J’espère partir.',
          '« Espérer » takes no preposition → J’espère partir.'),
        FILL('Je refuse {{1}} continuer.', ['de'],
          '« Refuser » + de + nguyên thể.',
          '« Refuser » + de + infinitive.'),
        CHOICE('Chọn đúng: « Elle réussit ___ tout faire. »', 'Choose correctly: “Elle réussit ___ tout faire.”',
          ['à', 'de', 'Ø'], 0,
          '« Réussir à » + nguyên thể.',
          '« Réussir à » + infinitive.')
      ]
    },

    /* -----------------------------------------------------
       38. Les verbes de déplacement — p. 164
       ----------------------------------------------------- */
    {
      id: 'gp-deplacement', num: 38, part: 'sentence', minutes: 6,
      title: 'Les verbes de déplacement',
      subtitle: { vi: 'Động từ chuyển động: aller, venir, retourner, revenir, rentrer', en: 'Movement verbs: aller, venir, retourner, revenir, rentrer' },
      summary: {
        vi: 'Phân biệt theo hướng: aller (đi tới nơi khác), venir (tới nơi người nói), retourner (đi lần nữa), revenir (quay lại lần nữa), rentrer (về nhà/quê).',
        en: 'Distinguish by direction: aller (away to another place), venir (towards the speaker), retourner (go again), revenir (come again), rentrer (go home).'
      },
      blocks: [
        TABLE([C('Động từ', 'Verb'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('aller', 'aller'), C('đi tới nơi không phải đây', 'go to a place other than here'), C('Je vais à Paris.', 'I am going to Paris.')],
          [C('venir', 'venir'), C('tới nơi người nói đang ở', 'come towards where the speaker is'), C('Venez me voir à Paris !', 'Come and see me in Paris!')],
          [C('retourner', 'retourner'), C('aller lần nữa', 'go a second time'), C('Je retourne à Paris.', 'I am going back to Paris.')],
          [C('revenir', 'revenir'), C('quay lại lần nữa', 'come back again'), C('Attendez-moi, je reviens.', 'Wait for me, I’ll be back.')],
          [C('rentrer', 'rentrer'), C('về nhà / về nước', 'go home / back to one’s country'), C('Je rentre chez moi à 8 heures.', 'I go home at eight.')]
        ]),
        LIST([
          '« Avec moi / avec nous » đi với « venir », không với « aller »: On va en Afrique et Joan vient avec nous.',
          'Động từ chuyển động + nguyên thể KHÔNG giới từ: Je viens chercher Pierre. Je descends acheter le journal.',
          '« Aller voir » + NGƯỜI: Je vais voir mes parents. Không nói « je visite ma grand-mère ».',
          '« Visiter » + nơi có thể tham quan: Je visite Notre-Dame, l’église. Nhà vệ sinh thì hỏi « Où sont les toilettes ? »'
        ], [
          '« Avec moi / avec nous » goes with « venir », not « aller »: On va en Afrique et Joan vient avec nous.',
          'Movement verbs + infinitive with NO preposition: Je viens chercher Pierre. Je descends acheter le journal.',
          '« Aller voir » + a PERSON: Je vais voir mes parents. Never “je visite ma grand-mère”.',
          '« Visiter » + a place worth visiting: Je visite Notre-Dame, l’église. For a toilet, ask “Où sont les toilettes ?”'
        ]),
        CALLOUT('trap', 'Nhóm « monter / descendre / sortir / entrer / passer » chia ở passé composé với être hoặc avoir tuỳ có tân ngữ — sẽ gặp lại ở chương 40.',
          'The “monter / descendre / sortir / entrer / passer” group takes être or avoir in the passé composé depending on whether they have an object — revisited in chapter 40.'),
        EXAMPLES([
          EX('Je vais en Italie pour voir des amis et visiter la Toscane.', 'Tôi đi Ý để thăm bạn và tham quan Toscane.', 'I am going to Italy to see friends and visit Tuscany.'),
          EX('Les touristes rentrent dans leur pays à la fin des vacances.', 'Du khách về nước khi hết kỳ nghỉ.', 'Tourists go back to their country at the end of the holidays.')
        ])
      ],
      exercises: [
        FILL('Je {{1}} chez moi à huit heures. (về nhà)', ['rentre'],
          'Về nhà dùng « rentrer ».',
          'Going home uses « rentrer ».'),
        FILL('Je vais {{1}} mes parents dimanche. (thăm người)', ['voir'],
          'Thăm NGƯỜI dùng « aller voir », không dùng « visiter ».',
          'Visiting a PERSON uses « aller voir », not « visiter ».'),
        CHOICE('Chọn đúng: « Attends-moi, je ___ dans cinq minutes. » (quay lại)', 'Choose correctly: “Attends-moi, je ___ dans cinq minutes.” (back again)',
          ['reviens', 'retourne', 'rentre'], 0,
          '« Revenir » = tới lại nơi người nói đang ở.',
          '« Revenir » = come back to where the speaker is.')
      ]
    },

    /* -----------------------------------------------------
       39. Le futur proche — p. 166–172
       ----------------------------------------------------- */
    {
      id: 'gp-futur-proche', num: 39, part: 'verbs', minutes: 9,
      title: 'Le futur proche',
      subtitle: { vi: 'Tương lai gần: aller + nguyên thể, và vị trí đại từ/trạng từ', en: 'Near future: aller + infinitive, with pronoun and adverb placement' },
      summary: {
        vi: 'Futur proche = « aller » chia ở hiện tại + nguyên thể. Không có mốc thời gian thì nghĩa là sắp xảy ra; đại từ đứng trước nguyên thể, trạng từ lượng/cách đứng giữa hai động từ.',
        en: 'Near future = « aller » in the present + infinitive. With no time marker it means “about to”; object pronouns go before the infinitive and quantity/manner adverbs between the two verbs.'
      },
      blocks: [
        H('Hình thành và dùng', 'Formation and use'),
        TABLE([C('Ngôi', 'Person'), C('Aller', 'Aller'), C('Ví dụ', 'Example')], [
          [C('je', 'je'), C('vais', 'vais'), C('Je vais dîner au restaurant.', 'I am going to have dinner out.')],
          [C('tu', 'tu'), C('vas', 'vas'), C('Tu vas rester chez toi ?', 'Are you going to stay home?')],
          [C('il / elle / on', 'il / elle / on'), C('va', 'va'), C('Il va pleuvoir.', 'It is going to rain.')],
          [C('nous', 'nous'), C('allons', 'allons'), C('Nous allons déménager.', 'We are going to move.')],
          [C('vous', 'vous'), C('allez', 'allez'), C('Vous allez visiter une expo ?', 'Are you going to visit an exhibition?')],
          [C('ils / elles', 'ils / elles'), C('vont', 'vont'), C('Ils vont finir leur travail.', 'They are going to finish their work.')]
        ]),
        LIST([
          'Không có mốc thời gian → sắp xảy ra ngay: Vite, le train va partir ! Attention, tu vas tomber !',
          'Có mốc thời gian → tương lai gần hay xa đều được: Je vais partir en septembre. Je vais rester six ans en France.',
          'Futur proche của « aller » dùng « aller » hai lần: Je vais aller en Grèce.',
          'Futur proche của « il y a » là « il va y avoir »: Il va y avoir du brouillard demain.'
        ], [
          'No time marker → about to happen: Vite, le train va partir ! Attention, tu vas tomber !',
          'With a time marker → near or far future: Je vais partir en septembre. Je vais rester six years in France.',
          'The near future of « aller » uses « aller » twice: Je vais aller en Grèce.',
          'The near future of « il y a » is « il va y avoir »: Il va y avoir du brouillard demain.'
        ]),
        H('Vị trí đại từ và trạng từ', 'Pronoun and adverb placement'),
        TABLE([C('Thành phần', 'Element'), C('Vị trí', 'Position'), C('Ví dụ', 'Example')], [
          [C('đại từ bổ ngữ', 'object pronoun'), C('TRƯỚC nguyên thể', 'BEFORE the infinitive'), C('Je vais les inviter. Je vais leur téléphoner. Je vais me préparer.', 'I am going to invite them. I am going to call them. I am going to get ready.')],
          [C('trạng từ lượng/cách', 'quantity / manner adverb'), C('GIỮA hai động từ', 'BETWEEN the two verbs'), C('Je vais beaucoup travailler. Je vais bien dormir.', 'I am going to work a lot. I am going to sleep well.')],
          [C('trạng từ nơi/thời gian, phần lớn -ment', 'place / time and most -ment adverbs'), C('SAU nguyên thể', 'AFTER the infinitive'), C('Tu vas dîner dehors ? Vous allez rentrer tard ? Il va conduire prudemment.', 'Are you eating out? Will you be back late? He is going to drive carefully.')]
        ]),
        H('Phủ định và câu hỏi', 'Negation and questions'),
        LIST([
          'Phủ định bao quanh động từ CHIA (aller): Je ne vais pas sortir. Il ne va plus le voir. Je ne vais rien lui dire.',
          '« Personne » và « aucun » đứng SAU nguyên thể: Je ne vais inviter personne. Je ne vais accepter aucune invitation.',
          'Đại từ vẫn đứng trước nguyên thể: Je ne vais pas les inviter.',
          'Câu hỏi: ngữ điệu, « est-ce que », hoặc đảo ngữ (Allez-vous partir ?). Với danh từ cần đại từ nhắc: Vos parents vont-ils partir ?'
        ], [
          'Negation wraps the CONJUGATED verb (aller): Je ne vais pas sortir. Il ne va plus le voir. Je ne vais rien lui dire.',
          '« Personne » and « aucun » go AFTER the infinitive: Je ne vais inviter personne. Je ne vais accepter aucune invitation.',
          'Pronouns still go before the infinitive: Je ne vais pas les inviter.',
          'Questions: intonation, « est-ce que », or inversion (Allez-vous partir ?). With a noun, add the echo pronoun: Vos parents vont-ils partir ?'
        ]),
        EXAMPLES([
          EX('Demain, je vais dîner au restaurant avec des amis.', 'Mai tôi sẽ ăn tối ở nhà hàng với bạn.', 'Tomorrow I am having dinner out with friends.'),
          EX('Ce soir, je vais me coucher tôt.', 'Tối nay tôi sẽ đi ngủ sớm.', 'Tonight I am going to bed early.')
        ])
      ],
      exercises: [
        FILL('Je vais {{1}} inviter. (đại từ “họ”)', ['les'],
          'Đại từ bổ ngữ đứng trước nguyên thể.',
          'Object pronouns go before the infinitive.'),
        FILL('Je ne vais {{1}} sortir. (phủ định)', ['pas'],
          '« Pas » đứng sau động từ chia « vais ».',
          '« Pas » follows the conjugated verb « vais ».'),
        CHOICE('Chọn đúng: « Je vais ___ travailler. » (nhiều)', 'Choose correctly: “Je vais ___ travailler.” (a lot)',
          ['beaucoup', 'très', 'bien beaucoup'], 0,
          'Trạng từ lượng đứng giữa hai động từ: vais beaucoup travailler.',
          'Quantity adverbs sit between the two verbs: vais beaucoup travailler.'),
        TRANSLATE('Tôi sắp đi Paris.', 'I am about to go to Paris.',
          ['Je vais aller à Paris.'],
          'Futur proche của « aller » dùng « aller » hai lần.',
          'The near future of « aller » uses « aller » twice.')
      ]
    },

    /* -----------------------------------------------------
       40. Le passé composé — p. 174–194
       ----------------------------------------------------- */
    {
      id: 'gp-passe-compose', num: 40, part: 'verbs', minutes: 16,
      title: 'Le passé composé',
      subtitle: { vi: 'Quá khứ kép: avoir/être + participe passé, hợp giống số', en: 'The passé composé: avoir/être + past participle, agreements' },
      summary: {
        vi: 'Passé composé = trợ động từ avoir hoặc être ở hiện tại + participe passé. Đa số dùng avoir; 14 động từ chuyển động dùng être và hợp với chủ ngữ.',
        en: 'The passé composé is avoir or être in the present + past participle. Most verbs take avoir; fourteen movement verbs take être and agree with the subject.'
      },
      blocks: [
        P('Đây là thì kể chuyện chính của tiếng Pháp nói. Chọn đúng trợ động từ và hợp đúng participe là 80% số lỗi của người học.',
          'This is the main storytelling tense of spoken French. The right auxiliary and the right agreement are 80% of learners’ mistakes.'),
        H('Với « avoir »', 'With « avoir »'),
        TABLE([C('Ngôi', 'Person'), C('Avoir', 'Avoir'), C('Ví dụ', 'Example')], [
          [C('j’', 'j’'), C('ai', 'ai'), C('J’ai mangé au restaurant.', 'I ate out.')],
          [C('tu', 'tu'), C('as', 'as'), C('Tu as mangé chez toi ?', 'Did you eat at home?')],
          [C('il / elle / on', 'il / elle / on'), C('a', 'a'), C('Il a mangé à midi et demi.', 'He ate at half past twelve.')],
          [C('nous', 'nous'), C('avons', 'avons'), C('Nous avons mangé ensemble.', 'We ate together.')],
          [C('vous', 'vous'), C('avez', 'avez'), C('Vous avez mangé tard.', 'You ate late.')],
          [C('ils / elles', 'ils / elles'), C('ont', 'ont'), C('Ils ont mangé avec des amis.', 'They ate with friends.')]
        ]),
        LIST([
          'Động từ -er: participe = radical + é (mangé, regardé).',
          'Participe KHÔNG hợp với chủ ngữ khi dùng avoir: Il a mangé un gâteau. / Ils ont mangé un gâteau.',
          'Đa số động từ dùng avoir, kể cả être và avoir: J’ai été malade. J’ai eu mal à la gorge.',
          'Mốc thời gian: hier, la semaine dernière, le mois dernier, l’année dernière.'
        ], [
          '-er verbs: participle = stem + é (mangé, regardé).',
          'The participle does NOT agree with the subject with avoir: Il a mangé un gâteau. / Ils ont mangé un gâteau.',
          'Most verbs take avoir, including être and avoir themselves: J’ai été malade. J’ai eu mal à la gorge.',
          'Time markers: hier, la semaine dernière, le mois dernier, l’année dernière.'
        ]),
        H('Participe passé theo vần', 'Past participles by sound'),
        TABLE([C('Nhóm', 'Group'), C('Ví dụ', 'Examples')], [
          [C('-é (mọi động từ -er)', '-é (all -er verbs)'), C('mangé, regardé, parlé', 'mangé, regardé, parlé')],
          [C('-u', '-u'), C('lu, vu, bu, entendu, attendu, répondu, perdu, voulu, dû, pu, su, cru, connu, reçu, venu, vécu', 'lu, vu, bu, entendu, attendu, répondu, perdu, voulu, dû, pu, su, cru, connu, reçu, venu, vécu')],
          [C('-i', '-i'), C('fini, grandi, choisi, pris, appris, compris, mis, dit, écrit, conduit', 'fini, grandi, choisi, pris, appris, compris, mis, dit, écrit, conduit')],
          [C('bất quy tắc', 'irregular'), C('fait, été, eu, ouvert, découvert, offert, souffert, peint, craint', 'fait, été, eu, ouvert, découvert, offert, souffert, peint, craint')]
        ]),
        H('Với « être »: 14 động từ chuyển động', 'With « être »: the 14 movement verbs'),
        TABLE([C('Động từ', 'Verbs'), C('Participe', 'Participle')], [
          [C('aller, venir', 'aller, venir'), C('allé, venu', 'allé, venu')],
          [C('arriver, partir', 'arriver, partir'), C('arrivé, parti', 'arrivé, parti')],
          [C('entrer, sortir', 'entrer, sortir'), C('entré, sorti', 'entré, sorti')],
          [C('monter, descendre', 'monter, descendre'), C('monté, descendu', 'monté, descendu')],
          [C('naître, mourir', 'naître, mourir'), C('né, mort', 'né, mort')],
          [C('rester, tomber', 'rester, tomber'), C('resté, tombé', 'resté, tombé')],
          [C('passer, retourner', 'passer, retourner'), C('passé, retourné', 'passé, retourné')],
          [C('+ các dạng ghép', '+ compounds'), C('revenu, devenu, reparti, rentré', 'revenu, devenu, reparti, rentré')]
        ]),
        LIST([
          '14 động từ này đối xứng (vào/ra, lên/xuống) và chỉ sự đổi chỗ: L’homme est entré, puis il est sorti.',
          'Participe hợp với chủ ngữ như tính từ: Elle est restée chez elle. Ils sont allés au restaurant.',
          '« Rester » dùng « être » (« di chuyển bằng không»): Je suis resté à l’hôtel = je ne suis pas sorti.',
          'Động từ chỉ CÁCH di chuyển dùng « avoir »: J’ai marché, j’ai couru, j’ai sauté, j’ai dansé.'
        ], [
          'These 14 verbs are symmetrical (in/out, up/down) and express a change of place: L’homme est entré, puis il est sorti.',
          'The participle agrees with the subject like an adjective: Elle est restée chez elle. Ils sont allés au restaurant.',
          '« Rester » takes « être » (“zero movement”): Je suis resté à l’hôtel = je ne suis pas sorti.',
          'Verbs describing HOW you move take « avoir »: J’ai marché, j’ai couru, j’ai sauté, j’ai dansé.'
        ]),
        H('Động từ pronominal', 'Pronominal verbs'),
        LIST([
          'Động từ phản thân/tương hỗ dùng « être » và hợp với chủ ngữ: Elle s’est levée tôt. Ils se sont rencontrés dans l’ascenseur.',
          'Không hợp khi động từ đi với « à »: Ils se sont parlé. Ils se sont téléphoné.',
          'Không hợp khi có tân ngữ trực tiếp theo sau: Elle s’est lavé les mains. Elle s’est coupé le doigt.',
          'Không hợp trong cấu trúc « faire »: Elle s’est fait mal. Elle s’est fait opérer.'
        ], [
          'Reflexive and reciprocal verbs take « être » and agree with the subject: Elle s’est levée tôt. Ils se sont rencontrés dans l’ascenseur.',
          'No agreement when the verb takes « à »: Ils se sont parlé. Ils se sont téléphoné.',
          'No agreement when a direct object follows: Elle s’est lavé les mains. Elle s’est coupé le doigt.',
          'No agreement in « faire » constructions: Elle s’est fait mal. Elle s’est fait opérer.'
        ]),
        H('Être hay avoir? Khi có tân ngữ trực tiếp', 'Être or avoir? With a direct object'),
        TABLE([C('Không tân ngữ → être', 'No object → être'), C('Có tân ngữ trực tiếp → avoir', 'Direct object → avoir')], [
          [C('Il est sorti dans la rue.', 'He went out into the street.'), C('Il a sorti le chien.', 'He took the dog out.')],
          [C('Nous sommes rentrés tôt.', 'We came home early.'), C('Nous avons rentré la voiture.', 'We put the car away.')],
          [C('Ils sont passés devant la banque.', 'They went past the bank.'), C('Ils ont passé de bonnes vacances.', 'They had a good holiday.')],
          [C('Elle est descendue à la cave.', 'She went down to the cellar.'), C('Elle a descendu la poubelle.', 'She took the bin down.')],
          [C('Je suis monté à pied.', 'I walked up.'), C('J’ai monté l’escalier.', 'I climbed the stairs.')]
        ]),
        H('Hợp participe với avoir', 'Agreement with avoir'),
        LIST([
          'Với « avoir », participe không hợp chủ ngữ — nhưng hợp với TÂN NGỮ TRỰC TIẾP đứng TRƯỚC: Regarde les fleurs que j’ai achetées. Je les ai invités hier.',
          'Không hợp khi tân ngữ đứng sau: J’ai acheté des fleurs. J’ai invité les voisins.',
          'Không bao giờ hợp với « en »: J’en ai acheté quatre.',
          'Nghe được hợp giống cái với participe -t/-s: J’ai ouvert la porte / Je l’ai ouverte. La robe que j’ai mise est froissée.'
        ], [
          'With « avoir » the participle does not agree with the subject — but it agrees with a DIRECT OBJECT placed BEFORE it: Regarde les fleurs que j’ai achetées. Je les ai invités hier.',
          'No agreement when the object follows: J’ai acheté des fleurs. J’ai invité les voisins.',
          'Never agreement with « en »: J’en ai acheté quatre.',
          'Feminine agreement is audible with -t/-s participles: J’ai ouvert la porte / Je l’ai ouverte. La robe que j’ai mise est froissée.'
        ]),
        H('Đại từ, trạng từ, phủ định, câu hỏi', 'Pronouns, adverbs, negation, questions'),
        LIST([
          'Đại từ bổ ngữ đứng TRƯỚC trợ động từ: Elle les a invités. Je lui ai rendu ses lettres. Elle s’est préparée. J’en ai acheté.',
          'Trong cấu trúc nguyên thể, đại từ đứng trước nguyên thể: J’ai voulu les inviter (không « je les ai voulu inviter »).',
          'Trạng từ lượng/cách nằm giữa trợ động từ và participe: J’ai beaucoup pleuré. Elle a très peu dormi. J’ai mal dormi.',
          'Trạng từ nơi/thời gian đứng sau: Vous avez dîné dehors ? Ils sont rentrés tard ?',
          'Phủ định bao quanh trợ động từ: Je n’ai pas travaillé. Elle ne lui a pas téléphoné. « Personne » đứng cuối: Je n’ai parlé à personne.',
          'Câu hỏi đảo trợ động từ: Avez-vous aimé le film ? Với danh từ cần đại từ nhắc: Marie est-elle arrivée ? Les enfants ont-ils bien dormi ?'
        ], [
          'Object pronouns go BEFORE the auxiliary: Elle les a invités. Je lui ai rendu ses lettres. Elle s’est préparée. J’en ai acheté.',
          'In infinitive constructions the pronoun goes before the infinitive: J’ai voulu les inviter (not “je les ai voulu inviter”).',
          'Quantity/manner adverbs sit between auxiliary and participle: J’ai beaucoup pleuré. Elle a très peu dormi. J’ai mal dormi.',
          'Place/time adverbs go after: Vous avez dîné dehors ? Ils sont rentrés tard ?',
          'Negation wraps the auxiliary: Je n’ai pas travaillé. Elle ne lui a pas téléphoné. « Personne » goes last: Je n’ai parlé à personne.',
          'Questions invert the auxiliary: Avez-vous aimé le film ? With a noun, add the echo pronoun: Marie est-elle arrivée ? Les enfants ont-ils bien dormi ?'
        ]),
        EXAMPLES([
          EX('Hier, j’ai dîné à huit heures et je suis allé au cinéma.', 'Hôm qua tôi ăn tối lúc tám giờ và đi xem phim.', 'Yesterday I had dinner at eight and went to the cinema.'),
          EX('Elle a acheté des fleurs et elle les a mises dans un vase bleu.', 'Cô ấy mua hoa và cắm vào lọ xanh.', 'She bought flowers and put them in a blue vase.')
        ]),
      ],
      exercises: [
        FILL('Hier, j’{{1}} dîné à huit heures.', ['ai'],
          'Đa số động từ dùng « avoir »: j’ai dîné.',
          'Most verbs take « avoir »: j’ai dîné.'),
        FILL('Elle {{1}} allée au cinéma. (être)', ['est'],
          '« Aller » dùng « être » và hợp giống: elle est allée.',
          '« Aller » takes « être » and agrees: elle est allée.'),
        FILL('Je {{1}} vu personne. (phủ định)', ['n’ai'],
          'Phủ định bao quanh trợ động từ: je n’ai vu personne.',
          'Negation wraps the auxiliary: je n’ai vu personne.'),
        CHOICE('Chọn đúng: « Elle a acheté des fleurs. Elle ___ a mises dans un vase. »', 'Choose correctly: “Elle a acheté des fleurs. Elle ___ a mises dans un vase.”',
          ['les', 'leur', 'en'], 0,
          'Tân ngữ trực tiếp số nhiều “những bông hoa” → « les », participe hợp: mises.',
          'Plural direct object “the flowers” → « les », with agreement: mises.'),
        TRANSLATE('Tôi đã đến lúc năm giờ.', 'I arrived at five.',
          ['Je suis arrivé à cinq heures.', 'Je suis arrivée à cinq heures.'],
          '« Arriver » dùng « être », participe hợp với chủ ngữ.',
          '« Arriver » takes « être » and the participle agrees with the subject.')
      ]
    },

    /* -----------------------------------------------------
       41. Le temps (3) — p. 198–202
       ----------------------------------------------------- */
    {
      id: 'gp-temps3', num: 41, part: 'verbs', minutes: 10,
      title: 'Le temps (3) : origine, durée, chronologie',
      subtitle: { vi: 'Thời gian (3): il y a, dans, depuis, pour, avant/après + nguyên thể', en: 'Time (3): il y a, dans, depuis, pour, avant/après + infinitive' },
      summary: {
        vi: '« Il y a » lùi về quá khứ, « dans » tiến về tương lai, « depuis » kéo từ quá khứ tới hiện tại, « pendant » một khoảng đã kết thúc, « en » thời gian cần để xong.',
        en: '« Il y a » points back, « dans » points forward, « depuis » runs from the past to now, « pendant » is a closed period, « en » is the time needed to finish.'
      },
      blocks: [
        P('Đây là chương “chốt” của trục thời gian: bốn giới từ nhìn về bốn hướng khác nhau từ hiện tại.',
          'This is the timeline chapter: four prepositions pointing four ways from the present.'),
        H('Mốc và khoảng', 'Points and spans'),
        TABLE([C('Từ', 'Word'), C('Hướng', 'Direction'), C('Ví dụ', 'Example')], [
          [C('il y a', 'il y a'), C('mốc trong quá khứ', 'a point in the past'), C('Je suis arrivé il y a six mois. Le film a commencé il y a une heure.', 'I arrived six months ago. The film started an hour ago.')],
          [C('dans', 'dans'), C('mốc trong tương lai', 'a point in the future'), C('Je partirai dans deux ans. Le film finira dans une heure.', 'I will leave in two years. The film will end in an hour.')],
          [C('depuis', 'depuis'), C('từ mốc quá khứ đến hiện tại', 'from a past point until now'), C('J’étudie le français depuis trois ans.', 'I have been studying French for three years.')],
          [C('pour', 'pour'), C('thời lượng dự kiến', 'a planned duration'), C('Je suis à Paris pour deux ans.', 'I am in Paris for two years.')],
          [C('pendant', 'pendant'), C('khoảng đã kết thúc, có đầu có cuối', 'a finished span with start and end'), C('Il a plu pendant huit jours. J’ai dormi pendant dix heures.', 'It rained for eight days. I slept for ten hours.')],
          [C('en', 'en'), C('thời gian cần để hoàn thành', 'time needed to finish'), C('Je fais le ménage en dix minutes.', 'I do the housework in ten minutes.')]
        ]),
        LIST([
          'Đầu câu với « depuis » dùng « il y a … que » hoặc « ça fait … que »: Ça fait deux ans que j’habite à Rome. Il y a deux ans que j’ai déménagé.',
          'Phân biệt: On doit finir EN trois jours (thời gian cần) / DANS trois jours (mốc tương lai).',
          '« En avoir pour » ước lượng thời lượng: — Tu as bientôt fini ? — Oui, j’en ai pour 5 minutes.',
          '« Pendant » đứng giữa câu thường bị lược: J’ai dormi dix heures.'
        ], [
          'Opening with « depuis » takes « il y a … que » or « ça fait … que »: Ça fait deux ans que j’habite à Rome. Il y a deux ans que j’ai déménagé.',
          'Compare: On doit finir EN trois jours (time needed) / DANS trois jours (future point).',
          '« En avoir pour » estimates a duration: — Tu as bientôt fini ? — Oui, j’en ai pour 5 minutes.',
          '« Pendant » is often dropped mid-sentence: J’ai dormi dix heures.'
        ]),
        H('Chuỗi ngày tháng', 'The timeline vocabulary'),
        TABLE([C('Quá khứ', 'Past'), C('Hiện tại', 'Present'), C('Tương lai', 'Future')], [
          [C('avant-hier, hier, la semaine dernière, le mois dernier, l’année dernière', 'avant-hier, hier, la semaine dernière, le mois dernier, l’année dernière'), C('aujourd’hui, ce matin, cet après-midi, ce soir, cette semaine, ce mois-ci, cette année', 'aujourd’hui, ce matin, cet après-midi, ce soir, cette semaine, ce mois-ci, cette année'), C('demain, après-demain, la semaine prochaine, le mois prochain, l’année prochaine', 'demain, après-demain, la semaine prochaine, le mois prochain, l’année prochaine')]
        ]),
        LIST([
          'Khi kể lại từ một mốc quá khứ: la veille (hôm trước), ce jour-là (ngày hôm đó), le lendemain (hôm sau), la semaine d’avant / d’après.',
          'Văn viết trang trọng dùng « précédent(e) / suivant(e) » thay « d’avant / d’après »; « plus tôt / plus tard » thay « avant / après ».',
          '« Après » + infinitif passé khi hai động từ cùng chủ ngữ: Après avoir dîné, je suis sorti.',
          '« Avant de » + infinitif: Avant de sortir, j’ai dîné. Đại từ đứng trước nguyên thể: Après m’être douché, je suis sorti.'
        ], [
          'Reporting from a past point: la veille, ce jour-là, le lendemain, la semaine d’avant / d’après.',
          'Formal writing prefers « précédent(e) / suivant(e) » to « d’avant / d’après », and « plus tôt / plus tard » to « avant / après ».',
          '« Après » + past infinitive when both verbs share the subject: Après avoir dîné, je suis sorti.',
          '« Avant de » + infinitive: Avant de sortir, j’ai dîné. Pronouns go before the infinitive: Après m’être douché, je suis sorti.'
        ]),
        CALLOUT('tip', 'Infinitif passé = être/avoir ở nguyên thể + participe passé: après avoir dîné, après être allé. Participe vẫn theo luật hợp: Après s’être disputés, les voisins se sont réconciliés.',
          'Past infinitive = être/avoir in the infinitive + past participle: après avoir dîné, après être allé. Agreement still applies: Après s’être disputés, les voisins se sont réconciliés.'),
        EXAMPLES([
          EX('Je suis arrivé en France il y a deux ans et je partirai dans six mois.', 'Tôi đến Pháp hai năm trước và sẽ đi trong sáu tháng nữa.', 'I arrived in France two years ago and will leave in six months.'),
          EX('Après avoir passé ma licence, j’ai vécu un an en Californie.', 'Sau khi tốt nghiệp đại học, tôi sống một năm ở California.', 'After finishing my degree, I lived in California for a year.')
        ])
      ],
      exercises: [
        FILL('Je suis arrivé il y a six {{1}}. (tháng)', ['mois'],
          '« Il y a » + thời lượng: il y a six mois.',
          '« Il y a » + duration: il y a six mois.'),
        FILL('Je partirai {{1}} deux ans.', ['dans'],
          'Mốc tương lai dùng « dans ».',
          'A future point uses « dans ».'),
        CHOICE('Chọn đúng: « J’étudie le français ___ trois ans. » (vẫn còn học)', 'Choose correctly: “J’étudie le français ___ trois ans.” (still studying)',
          ['depuis', 'il y a', 'pendant'], 0,
          'Từ mốc quá khứ đến hiện tại → « depuis ».',
          'From a past point until now → « depuis ».'),
        TRANSLATE('Sau khi ăn tối, tôi đi xem phim.', 'After having dinner, I went to the cinema.',
          ['Après avoir dîné, je suis allé au cinéma.', 'Après avoir dîné, je suis allée au cinéma.'],
          'Cùng chủ ngữ → « après » + infinitif passé: après avoir dîné.',
          'Same subject → « après » + past infinitive: après avoir dîné.')
      ]
    },

    /* -----------------------------------------------------
       42. Le passif — p. 204
       ----------------------------------------------------- */
    {
      id: 'gp-passif', num: 42, part: 'verbs', minutes: 7,
      title: 'Le passif',
      subtitle: { vi: 'Bị động: être + participe passé + par', en: 'The passive: être + past participle + par' },
      summary: {
        vi: 'Bị động đưa tân ngữ lên làm chủ ngữ: être + participe passé (+ par + tác nhân). Participe luôn hợp với chủ ngữ. Thường dùng cho phát minh, luật, sự kiện bị động.',
        en: 'The passive promotes the object to subject: être + past participle (+ par + agent). The participle always agrees with the subject. Typical for inventions, laws and events people undergo.'
      },
      blocks: [
        TABLE([C('Chủ động', 'Active'), C('Bị động', 'Passive')], [
          [C('John Baird a inventé la télévision.', 'John Baird invented television.'), C('La télévision a été inventée par John Baird.', 'Television was invented by John Baird.')],
          [C('Le directeur a convoqué les employés.', 'The manager summoned the employees.'), C('Les employés ont été convoqués par le directeur.', 'The employees were summoned by the manager.')]
        ]),
        H('Cách dùng', 'When to use it'),
        LIST([
          'Khi muốn nhấn vào đối tượng chứ không phải người làm: La télévision a été inventée par John Baird.',
          'Khi không cần nêu tác nhân: Le président Kennedy a été assassiné.',
          'Thường gặp với phát minh, luật, sự kiện bị động: Un vaccin a été découvert. Une loi a été votée. J’ai été opéré.',
          'Các trường hợp khác nên dùng « on »: On m’a envoyé en mission (= J’ai été envoyé en mission).'
        ], [
          'To highlight the object rather than the doer: La télévision a été inventée par John Baird.',
          'When the agent does not matter: Le président Kennedy a été assassiné.',
          'Frequent with inventions, laws, events undergone: Un vaccin a été découvert. Une loi a été votée. J’ai été opéré.',
          'Elsewhere prefer « on »: On m’a envoyé en mission (= J’ai été envoyé en mission).'
        ]),
        H('Hình thành và hợp', 'Formation and agreement'),
        TABLE([C('Thì', 'Tense'), C('Ví dụ', 'Example')], [
          [C('hiện tại', 'present'), C('Les enfants sont vaccinés à l’école (par un médecin scolaire).', 'Children are vaccinated at school (by a school doctor).')],
          [C('passé composé', 'passé composé'), C('Les enfants ont été vaccinés à l’école.', 'The children were vaccinated at school.')],
          [C('tương lai', 'future'), C('Les enfants seront vaccinés à l’école.', 'The children will be vaccinated at school.')]
        ]),
        LIST([
          'Participe hợp với chủ ngữ: Les salles ont été repeintes. Les moquettes ont été changées.',
          'Tránh bị động khi tác nhân là đại từ: nói « J’ai fait ce dessin », không nói « Ce dessin a été fait par moi ».',
          'Với aimer, connaître, respecter dùng « de » thay « par »: Cette personne est aimée de tous, connue de tous, respectée de tous.',
          'Không dùng bị động với động từ pronominal: dùng « on » hoặc dạng chủ động.'
        ], [
          'The participle agrees with the subject: Les salles ont été repeintes. Les moquettes ont été changées.',
          'Avoid the passive when the agent is a pronoun: say “J’ai fait ce dessin”, not “Ce dessin a été fait par moi”.',
          'With aimer, connaître, respecter use « de » instead of « par »: Cette personne est aimée de tous, connue de tous, respectée de tous.',
          'No passive with pronominal verbs: use « on » or an active form.'
        ]),
        EXAMPLES([
          EX('Une loi a été votée hier.', 'Một luật đã được thông qua hôm qua.', 'A law was passed yesterday.'),
          EX('Les moquettes ont été changées.', 'Thảm đã được thay.', 'The carpets have been changed.')
        ])
      ],
      exercises: [
        FILL('La télévision a été {{1}} par John Baird. (inventer)', ['inventée'],
          'Participe hợp với « la télévision » (giống cái) → inventée.',
          'The participle agrees with feminine « la télévision » → inventée.'),
        FILL('Les employés ont été {{1}} par le directeur. (convoquer)', ['convoqués'],
          'Chủ ngữ số nhiều đực → convoqués.',
          'Masculine plural subject → convoqués.'),
        CHOICE('Chọn đúng: « Les salles ont été ___. » (repeindre)', 'Choose correctly: “Les salles ont été ___.” (repeindre)',
          ['repeintes', 'repeint', 'repeinds'], 0,
          'Participe bị động hợp với « les salles » (giống cái số nhiều) → repeintes.',
          'The passive participle agrees with feminine plural « les salles » → repeintes.')
      ]
    },

    /* -----------------------------------------------------
       43. L'imparfait — p. 206–210
       ----------------------------------------------------- */
    {
      id: 'gp-imparfait', num: 43, part: 'verbs', minutes: 9,
      title: 'L’imparfait',
      subtitle: { vi: 'Quá khứ chưa hoàn thành: thói quen, mô tả', en: 'The imperfect: habits and descriptions' },
      summary: {
        vi: 'Imparfait tả thói quen và bối cảnh trong quá khứ (như bức ảnh); passé composé kể sự kiện nối tiếp (như cuốn phim).',
        en: 'The imparfait paints past habits and background (a photo); the passé composé narrates successive events (a film).'
      },
      blocks: [
        H('Hình thành', 'Formation'),
        TABLE([C('Hiện tại « nous »', 'Present « nous »'), C('Imparfait (je)', 'Imparfait (je)')], [
          [C('nous parlons', 'nous parlons'), C('je parlais', 'je parlais')],
          [C('nous prenons', 'nous prenons'), C('je prenais', 'je prenais')],
          [C('nous finissons', 'nous finissons'), C('je finissais', 'je finissais')],
          [C('nous mangeons', 'nous mangeons'), C('je mangeais', 'je mangeais')],
          [C('nous commençons', 'nous commençons'), C('je commençais', 'je commençais')],
          [C('être', 'être'), C('j’étais', 'j’étais')]
        ], 'Đuôi: -ais, -ais, -ait, -ions, -iez, -aient. Chỉ « nous/vous » có « i » trong đuôi. / Endings: -ais, -ais, -ait, -ions, -iez, -aient. Only « nous/vous » carry the i.'),
        H('Cách dùng', 'Uses'),
        LIST([
          'Thói quen quá khứ: Avant, j’habitais à Marseille, je travaillais chez BMI.',
          'Mô tả bối cảnh, thời tiết, tuổi, cảm xúc: Quand j’ai déménagé, j’avais seize ans. C’était l’hiver. Il faisait chaud.',
          'Hành động đang diễn ra làm nền: Pendant que je jouais, tout le monde bavardait.',
          'Sau các cụm: à cette époque-là, avant, quand j’étais jeune, de 1980 à 1990 (khoảng có giới hạn vẫn có thể dùng imparfait khi nói thói quen).'
        ], [
          'Past habits: Avant, j’habitais à Marseille, je travaillais chez BMI.',
          'Describing setting, weather, age, feelings: Quand j’ai déménagé, j’avais seize ans. C’était l’hiver. Il faisait chaud.',
          'A background action in progress: Pendant que je jouais, tout le monde bavardait.',
          'After expressions like à cette époque-là, avant, quand j’étais jeune, de 1980 à 1990 (habits still use the imparfait).'
        ]),
        H('Imparfait hay passé composé?', 'Imparfait or passé composé?'),
        TABLE([C('Imparfait (bức ảnh)', 'Imparfait (the photo)'), C('Passé composé (cuốn phim)', 'Passé composé (the film)')], [
          [C('thói quen, mô tả, trạng thái', 'habit, description, state'), C('sự kiện xảy ra một lần, nối tiếp', 'a single event, in sequence')],
          [C('Avant, j’habitais à Lyon. Il faisait beau.', 'Before, I lived in Lyon. The weather was nice.'), C('Un jour, j’ai déménagé. Tout à coup, le temps a changé.', 'One day I moved. Suddenly the weather changed.')],
          [C('Quand j’étais jeune, je jouais du piano.', 'When I was young I played the piano.'), C('Un jour, j’ai joué devant la reine d’Angleterre.', 'One day I played in front of the Queen of England.')]
        ]),
        CALLOUT('tip', '« Tout à coup », « soudain », « brusquement » mở đường cho passé composé; « pendant que » mở đường cho imparfait. Đây là dấu hiệu chọn thì khi viết bài kể chuyện.',
          '« Tout à coup », « soudain », « brusquement » introduce the passé composé; « pendant que » introduces the imparfait. These are your tense cues when writing a narrative.'),
        EXAMPLES([
          EX('Le jour où j’ai joué devant la reine, j’avais douze ans.', 'Ngày tôi chơi trước mặt nữ hoàng, tôi mười hai tuổi.', 'The day I played before the Queen, I was twelve.'),
          EX('Elle est entrée pendant que je jouais.', 'Cô ấy bước vào khi tôi đang chơi.', 'She came in while I was playing.')
        ])
      ],
      exercises: [
        FILL('Quand j’étais jeune, je {{1}} du piano. (jouer, thói quen)', ['jouais'],
          'Thói quen quá khứ → imparfait « je jouais ».',
          'A past habit → imparfait « je jouais ».'),
        FILL('Un jour, j’{{1}} devant la reine. (jouer, sự kiện)', ['ai joué'],
          'Sự kiện xảy ra một lần → passé composé.',
          'A single event → passé composé.'),
        CHOICE('Chọn đúng: « Tout à coup, la reine ___. »', 'Choose correctly: “Tout à coup, la reine ___.”',
          ['est arrivée', 'arrivait', 'arrive'], 0,
          '« Tout à coup » báo sự kiện → passé composé.',
          '« Tout à coup » signals an event → passé composé.'),
        TRANSLATE('Hồi đó tôi sống ở Lyon.', 'Back then I lived in Lyon.',
          ['À cette époque-là, j’habitais à Lyon.'],
          'Thói quen quá khứ → imparfait « j’habitais ».',
          'A past habit → the imparfait « j’habitais ».')
      ]
    },

    /* -----------------------------------------------------
       44. Le plus-que-parfait — p. 214
       ----------------------------------------------------- */
    {
      id: 'gp-plus-que-parfait', num: 44, part: 'verbs', minutes: 7,
      title: 'Le plus-que-parfait',
      subtitle: { vi: 'Quá khứ hoàn thành: việc xảy ra trước một việc quá khứ khác', en: 'The pluperfect: an event before another past event' },
      summary: {
        vi: 'Plus-que-parfait = avoir/être ở imparfait + participe passé. Nó đánh dấu việc đã xảy ra TRƯỚC một mốc quá khứ khác.',
        en: 'The plus-que-parfait is avoir/être in the imparfait + past participle. It marks an event that happened BEFORE another past moment.'
      },
      blocks: [
        TABLE([C('Hai việc theo thứ tự', 'Two events in order'), C('Gộp lại với plus-que-parfait', 'Merged with the pluperfect')], [
          [C('La maison a brûlé. Les pompiers sont arrivés.', 'The house burned. The fire brigade arrived.'), C('Quand les pompiers sont arrivés, la maison avait déjà brûlé.', 'When the fire brigade arrived, the house had already burned.')],
          [C('Le train est parti. Nous sommes arrivés à la gare.', 'The train left. We arrived at the station.'), C('Quand nous sommes arrivés à la gare, le train était déjà parti.', 'When we got to the station, the train had already left.')]
        ]),
        H('Hình thành', 'Formation'),
        TABLE([C('Trợ động từ (imparfait)', 'Auxiliary (imparfait)'), C('Ví dụ', 'Example')], [
          [C('avoir: j’avais, tu avais, il avait…', 'avoir: j’avais, tu avais, il avait…'), C('J’avais dîné. Nous avions fini.', 'I had dined. We had finished.')],
          [C('être: j’étais, il était, ils étaient…', 'être: j’étais, il était, ils étaient…'), C('Il était parti. Je m’étais couché.', 'He had left. I had gone to bed.')]
        ]),
        H('Ba thì quá khứ phối hợp', 'The three past tenses together'),
        TABLE([C('Thời điểm', 'Moment'), C('Thì', 'Tense'), C('Ví dụ', 'Example')], [
          [C('trước', 'before'), C('plus-que-parfait', 'plus-que-parfait'), C('ma mère avait préparé le café', 'my mother had made the coffee')],
          [C('cùng lúc', 'during'), C('imparfait', 'imparfait'), C('ma mère préparait le café', 'my mother was making the coffee')],
          [C('sau', 'after'), C('passé composé', 'passé composé'), C('ma mère a préparé le café', 'my mother made the coffee')]
        ], 'Ví dụ đầy đủ: Quand je me suis levé, ma mère avait préparé le café. / When I got up, my mother had made the coffee.'),
        CALLOUT('tip', 'Dấu hiệu quen thuộc: « déjà » (đã rồi) đi với plus-que-parfait trong câu có mốc quá khứ: Quand nous sommes arrivés, le train était déjà parti.',
          'A familiar cue: « déjà » (already) pairs with the pluperfect when a past moment follows: Quand nous sommes arrivés, le train était déjà parti.'),
        EXAMPLES([
          EX('J’ai vendu en 1998 l’appartement que j’avais acheté en 1992.', 'Năm 1998 tôi bán căn hộ mua năm 1992.', 'In 1998 I sold the flat I had bought in 1992.'),
          EX('Je suis retourné dans le quartier où j’avais vécu avec toi.', 'Tôi trở lại khu phố nơi tôi từng sống với bạn.', 'I went back to the area where I had lived with you.')
        ])
      ],
      exercises: [
        FILL('Quand nous sommes arrivés, le train était déjà {{1}}. (partir)', ['parti'],
          'Participe của « partir » là « parti ».',
          'The participle of « partir » is « parti ».'),
        FILL('J’{{1}} dîné avant de sortir. (avoir, imparfait)', ['avais'],
          'Trợ động từ avoir ở imparfait: j’avais.',
          'The auxiliary avoir in the imparfait: j’avais.'),
        CHOICE('Chọn đúng: « Quand les pompiers sont arrivés, la maison ___ déjà brûlé. »', 'Choose correctly: “Quand les pompiers sont arrivés, la maison ___ déjà brûlé.”',
          ['avait', 'a', 'était'], 0,
          'Việc xảy ra trước mốc quá khứ → plus-que-parfait « avait brûlé ».',
          'An event before a past point → plus-que-parfait « avait brûlé ».')
      ]
    },

    /* -----------------------------------------------------
       45. Le discours indirect au passé — p. 216
       ----------------------------------------------------- */
    {
      id: 'gp-discours-passe', num: 45, part: 'verbs', minutes: 8,
      title: 'Le discours indirect au passé',
      subtitle: { vi: 'Tường thuật ở quá khứ: lùi thì (concordance)', en: 'Reported speech in the past: tense backshift' },
      summary: {
        vi: 'Khi động từ tường thuật ở quá khứ, lời nói lùi một bậc: présent → imparfait, passé composé → plus-que-parfait, futur → conditionnel.',
        en: 'When the reporting verb is past, the reported clause shifts back one step: présent → imparfait, passé composé → plus-que-parfait, future → conditional.'
      },
      blocks: [
        H('Bảng lùi thì', 'The backshift table'),
        TABLE([C('Lời nói trực tiếp', 'Direct'), C('Tường thuật quá khứ', 'Reported in the past')], [
          [C('« Il pleut. » (présent)', '“It is raining.” (present)'), C('Il a dit qu’il pleuvait.', 'He said it was raining.')],
          [C('« Il a plu. » (passé composé)', '“It rained.” (passé composé)'), C('Il a dit qu’il avait plu.', 'He said it had rained.')],
          [C('« Il va pleuvoir. » (futur proche)', '“It is going to rain.” (near future)'), C('Il a dit qu’il allait pleuvoir.', 'He said it was going to rain.')],
          [C('« Il pleuvra. » (futur simple)', '“It will rain.” (future)'), C('Il a dit qu’il pleuvrait.', 'He said it would rain.')]
        ]),
        LIST([
          'Imparfait ở đây chỉ là dấu hiệu ngữ pháp, không phải quá khứ thật: « Il m’a dit qu’il était allemand » = anh ấy LÀ người Đức.',
          'Câu « Il m’a dit qu’il viendrait en mars » = anh ấy SẼ đến vào tháng Ba.',
          'Động từ tường thuật: « dire » thường ở passé composé (on m’a dit que…), « croire / penser » thường ở imparfait (je croyais que…).',
          'Đôi khi không lùi thì khi công bố kết quả hay nhận định mới: On a constaté que le mont Blanc fait 4 810 m.'
        ], [
          'The imparfait here is a grammatical marker, not real past time: “Il m’a dit qu’il était allemand” = he IS German.',
          '“Il m’a dit qu’il viendrait en mars” = he WILL come in March.',
          'Reporting verbs: « dire » usually in the passé composé (on m’a dit que…), « croire / penser » in the imparfait (je croyais que…).',
          'Backshift is sometimes skipped for announced results or new findings: On a constaté que le mont Blanc fait 4 810 m.'
        ]),
        H('Đổi đại từ và từ chỉ thời gian', 'Shifting pronouns and time words'),
        TABLE([C('Trực tiếp', 'Direct'), C('Gián tiếp quá khứ', 'Reported past')], [
          [C('aujourd’hui', 'aujourd’hui'), C('ce jour-là', 'ce jour-là')],
          [C('hier', 'hier'), C('la veille', 'la veille')],
          [C('demain', 'demain'), C('le lendemain', 'le lendemain')],
          [C('maintenant', 'maintenant'), C('à ce moment-là', 'à ce moment-là')],
          [C('je / mon', 'je / mon'), C('il / son', 'il / son')]
        ]),
        EXAMPLES([
          EX('Il m’a dit qu’il était écrivain et qu’il avait écrit plusieurs romans.', 'Anh ấy nói mình là nhà văn và đã viết vài tiểu thuyết.', 'He told me he was a writer and had written several novels.'),
          EX('Il m’a dit qu’il me donnerait ses livres.', 'Anh ấy nói sẽ cho tôi sách của mình.', 'He told me he would give me his books.')
        ])
      ],
      exercises: [
        FILL('« Il pleut » → Il a dit qu’il {{1}}. (lùi thì)', ['pleuvait'],
          'Présent → imparfait khi tường thuật quá khứ.',
          'Present → imparfait in past reported speech.'),
        FILL('« Il pleuvra » → Il a dit qu’il {{1}}.', ['pleuvrait'],
          'Futur simple → conditionnel.',
          'Future → conditional.'),
        CHOICE('« Je partirai demain » → Il a dit qu’il partirait ___ .', '“Je partirai demain” → Il a dit qu’il partirait ___ .',
          ['le lendemain', 'demain', 'hier'], 0,
          '« Demain » thành « le lendemain » khi tường thuật quá khứ.',
          '« Demain » becomes « le lendemain » in past reported speech.')
      ]
    },

    /* -----------------------------------------------------
       46. Venir de, être en train de, être sur le point de — p. 222
       ----------------------------------------------------- */
    {
      id: 'gp-aspects', num: 46, part: 'verbs', minutes: 6,
      title: 'Venir de, être en train de, être sur le point de',
      subtitle: { vi: 'Ba cấu trúc chỉ thời điểm: vừa mới, đang, sắp', en: 'Three time frames: just done, doing, about to do' },
      summary: {
        vi: 'Ba cụm + nguyên thể chia trục thời gian quanh hiện tại: « venir de » (vừa mới xong), « être en train de » (đang làm), « être sur le point de » (sắp làm).',
        en: 'Three phrases + infinitive place an action around now: « venir de » (just did), « être en train de » (doing), « être sur le point de » (about to do).'
      },
      blocks: [
        TABLE([C('Cấu trúc', 'Structure'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('venir de + inf.', 'venir de + inf.'), C('vừa mới làm xong', 'to have just done'), C('Paul vient de sortir.', 'Paul has just gone out.')],
          [C('être en train de + inf.', 'être en train de + inf.'), C('đang làm (ngay lúc này)', 'to be in the middle of doing'), C('Je suis en train de dîner.', 'I am having dinner right now.')],
          [C('être sur le point de + inf.', 'être sur le point de + inf.'), C('sắp làm', 'to be about to do'), C('Nous sommes sur le point d’arriver.', 'We are about to arrive.')]
        ]),
        LIST([
          '« Venir de » không đi với mốc thời gian: Jean vient de sortir (không “il y a 5 minutes”).',
          'Nhấn mạnh “vừa mới”: Jean vient juste de partir.',
          '« Être en train de » dùng được ở quá khứ: J’étais en train de dîner quand le téléphone a sonné.',
          'Ba cụm này tương đương futur proche / passé récent / présent progressif — chọn theo sắc thái, không theo thì.'
        ], [
          '« Venir de » takes no time marker: Jean vient de sortir (not “il y a 5 minutes”).',
          'To stress “just now”: Jean vient juste de partir.',
          '« Être en train de » works in the past: J’étais en train de dîner quand le téléphone a sonné.',
          'These phrases cover recent past / progressive present / imminent future — pick by nuance, not by tense.'
        ]),
        EXAMPLES([
          EX('Nous venons de quitter l’Angleterre.', 'Chúng tôi vừa rời Anh.', 'We have just left England.'),
          EX('Nous sommes sur le point d’arriver en France.', 'Chúng tôi sắp tới Pháp.', 'We are about to arrive in France.')
        ])
      ],
      exercises: [
        FILL('Paul n’est pas là, il {{1}} de sortir.', ['vient'],
          '« Venir de » + nguyên thể = vừa mới.',
          '« Venir de » + infinitive = to have just.'),
        FILL('Je suis en {{1}} de dîner.', ['train'],
          'Cấu trúc cố định « être en train de ».',
          'The fixed phrase is « être en train de ».'),
        CHOICE('Chọn đúng: « Nous sommes ___ d’atterrir. » (sắp)', 'Choose correctly: “Nous sommes ___ d’atterrir.” (about to)',
          ['sur le point', 'en train', 'venus'], 0,
          'Sắp xảy ra → « être sur le point de ».',
          'About to happen → « être sur le point de ».')
      ]
    },

    /* -----------------------------------------------------
       47. Le futur simple — p. 224–226
       ----------------------------------------------------- */
    {
      id: 'gp-futur-simple', num: 47, part: 'verbs', minutes: 10,
      title: 'Le futur simple',
      subtitle: { vi: 'Tương lai đơn: dự báo, kế hoạch xa, hệ quả', en: 'The future simple: predictions, plans, consequences' },
      summary: {
        vi: 'Futur simple = nguyên thể + -ai/-as/-a/-ons/-ez/-ont; nhiều động từ bất quy tắc (serai, aurai, irai, ferai, viendrai). Dùng cho dự báo và hệ quả, khác futur proche chỉ sự thay đổi sắp tới.',
        en: 'Future simple = infinitive + -ai/-as/-a/-ons/-ez/-ont, with many irregular stems (serai, aurai, irai, ferai, viendrai). It handles predictions and consequences, unlike the near future’s upcoming change.'
      },
      blocks: [
        H('Hình thành', 'Formation'),
        TABLE([C('Ngôi', 'Person'), C('parler', 'parler'), C('habiter', 'habiter')], [
          [C('je', 'je'), C('parlerai', 'parlerai'), C('habiterai', 'habiterai')],
          [C('tu', 'tu'), C('parleras', 'parleras'), C('habiteras', 'habiteras')],
          [C('il / elle / on', 'il / elle / on'), C('parlera', 'parlera'), C('habitera', 'habitera')],
          [C('nous', 'nous'), C('parlerons', 'parlerons'), C('habiterons', 'habiterons')],
          [C('vous', 'vous'), C('parlerez', 'parlerez'), C('habiterez', 'habiterez')],
          [C('ils / elles', 'ils / elles'), C('parleront', 'parleront'), C('habiteront', 'habiteront')]
        ]),
        LIST([
          'Nguyên thể tận cùng bằng -e thì bỏ -e: boire → je boirai; dire → je dirai; mettre → je mettrai.',
          'Âm « r » là dấu hiệu của futur simple — nghe được ở mọi ngôi.',
          'Bất quy tắc: être → serai; avoir → aurai; aller → irai; faire → ferai; voir → verrai; pouvoir → pourrai; devoir → devrai; savoir → saurai; venir → viendrai; recevoir → recevrai; courir → courrai; envoyer → enverrai.',
          'Bất quy tắc bất định: il y aura, il faudra, il pleuvra.'
        ], [
          'Infinitives ending in -e drop the e: boire → je boirai; dire → je dirai; mettre → je mettrai.',
          'The « r » sound runs through every person — that is the future signature.',
          'Irregular: être → serai; avoir → aurai; aller → irai; faire → ferai; voir → verrai; pouvoir → pourrai; devoir → devrai; savoir → saurai; venir → viendrai; recevoir → recevrai; courir → courrai; envoyer → enverrai.',
          'Impersonal irregulars: il y aura, il faudra, il pleuvra.'
        ]),
        H('Futur simple hay futur proche?', 'Future simple or near future?'),
        TABLE([C('Futur proche (thay đổi)', 'Near future (change)'), C('Futur simple (kết quả, dự báo)', 'Future simple (result, forecast)')], [
          [C('Je vais avoir un bébé.', 'I am going to have a baby.'), C('J’aurai des enfants.', 'I will have children.')],
          [C('On va recevoir de nouveaux ordinateurs.', 'We are getting new computers.'), C('On pourra traiter plus de dossiers, on gagnera du temps.', 'We will be able to handle more files, we will save time.')]
        ]),
        LIST([
          'Khẩu ngữ ưa futur proche (sinh động), văn viết ưa futur simple (gọn).',
          'Sau « quand », « pendant que », « j’espère que » và khi nối nhiều câu, dùng futur simple: Quand je partirai, tu rentreras. J’espère que tout se passera bien.',
          'Với giả thuyết về tương lai: S’il fait beau, nous irons à la plage.',
          'Trong mệnh đề « si » KHÔNG dùng futur: nói « s’il fait beau », không nói « s’il fera beau ».',
          'Dự báo thời tiết dùng futur simple: Demain, il pleuvra sur toute la France.'
        ], [
          'Speech prefers the near future (lively); writing prefers the future simple (compact).',
          'After « quand », « pendant que », « j’espère que » and when chaining clauses, use the future simple: Quand je partirai, tu rentreras. J’espère que tout se passera bien.',
          'For hypotheses about the future: S’il fait beau, nous irons à la plage.',
          'Never use the future in the « si » clause: say “s’il fait beau”, not “s’il fera beau”.',
          'Weather forecasts take the future simple: Demain, il pleuvra sur toute la France.'
        ]),
        EXAMPLES([
          EX('Dans cinq ans, je prendrai ma retraite.', 'Năm năm nữa tôi sẽ nghỉ hưu.', 'In five years I will retire.'),
          EX('Quand vous viendrez me voir, on ira pêcher la truite !', 'Khi bạn đến thăm tôi, mình sẽ đi câu cá hồi!', 'When you come to see me, we will go trout fishing!')
        ])
      ],
      exercises: [
        FILL('Je {{1}} (être) en France en septembre.', ['serai'],
          '« Être » ở futur simple là « serai ».',
          '« Être » in the future is « serai ».'),
        FILL('Il {{1}} (pleuvoir) demain.', ['pleuvra'],
          'Bất quy tắc: il pleuvra.',
          'Irregular: il pleuvra.'),
        CHOICE('Chọn đúng: « S’il ___ beau, nous irons à la plage. »', 'Choose correctly: “S’il ___ beau, nous irons à la plage.”',
          ['fait', 'fera', 'ferait'], 0,
          'Mệnh đề « si » không dùng futur.',
          'The « si » clause never takes a future tense.')
      ]
    },

    /* -----------------------------------------------------
       48. Le futur antérieur — p. 228
       ----------------------------------------------------- */
    {
      id: 'gp-futur-anterieur', num: 48, part: 'verbs', minutes: 7,
      title: 'Le futur antérieur',
      subtitle: { vi: 'Tương lai hoàn thành: xong trước một mốc tương lai', en: 'The future perfect: done before a future moment' },
      summary: {
        vi: 'Futur antérieur = avoir/être ở futur simple + participe passé. Nó nói một việc sẽ hoàn tất TRƯỚC một việc khác trong tương lai.',
        en: 'The future perfect is avoir/être in the future + past participle. It marks what will be finished BEFORE another future event.'
      },
      blocks: [
        TABLE([C('Hai bước', 'Two steps'), C('Gộp lại', 'Merged')], [
          [C('Je vais dîner et je vais sortir.', 'I am going to dine and then go out.'), C('Quand j’aurai dîné, je sortirai.', 'When I have dined, I will go out.')],
          [C('Je me marierai. J’aurai terminé mes études.', 'I will get married. I will have finished my studies.'), C('Je me marierai quand j’aurai terminé mes études.', 'I will get married when I have finished my studies.')]
        ]),
        H('Hình thành', 'Formation'),
        TABLE([C('Trợ động từ (futur)', 'Auxiliary (future)'), C('Ví dụ', 'Example')], [
          [C('avoir: j’aurai…', 'avoir: j’aurai…'), C('J’aurai dîné. Nous aurons fini.', 'I will have dined. We will have finished.')],
          [C('être: il sera…, je me serai…', 'être: il sera…, je me serai…'), C('Il sera parti. Je me serai couché.', 'He will have left. I will have gone to bed.')]
        ]),
        H('Toàn cảnh các thì', 'The whole tense system'),
        TABLE([C('Thời điểm', 'Time'), C('Thì đơn', 'Simple tense'), C('Thì hoàn thành', 'Perfect tense')], [
          [C('quá khứ', 'past'), C('imparfait — j’habitais à Rome', 'imparfait — j’habitais à Rome'), C('plus-que-parfait — j’avais fini', 'plus-que-parfait — j’avais fini')],
          [C('hiện tại', 'present'), C('présent — j’habite à Paris', 'présent — j’habite à Paris'), C('passé composé — j’ai déménagé', 'passé composé — j’ai déménagé')],
          [C('tương lai', 'future'), C('futur — j’habiterai à Tokyo', 'futur — j’habiterai à Tokyo'), C('futur antérieur — j’aurai déménagé', 'futur antérieur — j’aurai déménagé')]
        ], 'Thì đơn tả thói quen, tình trạng (tĩnh); thì hoàn thành tả thay đổi, bước ngoặt (động). / Simple tenses describe habits and states (static); perfect tenses describe changes and turning points (dynamic).'),
        EXAMPLES([
          EX('Tu me rejoindras quand j’aurai déménagé.', 'Bạn sẽ gặp tôi khi tôi đã chuyển nhà xong.', 'You will join me when I have moved.'),
          EX('Je me marierai quand j’aurai terminé mes études.', 'Tôi sẽ kết hôn khi học xong.', 'I will get married when I have finished my studies.')
        ])
      ],
      exercises: [
        FILL('Quand j’{{1}} dîné, je sortirai. (avoir, futur)', ['aurai'],
          'Trợ động từ avoir ở futur simple: j’aurai.',
          'The auxiliary avoir in the future: j’aurai.'),
        FILL('Il {{1}} parti avant midi. (être, futur)', ['sera'],
          'Trợ động từ être ở futur simple: il sera.',
          'The auxiliary être in the future: il sera.'),
        CHOICE('Chọn đúng: « Tu me rejoindras quand j’ ___ déménagé. »', 'Choose correctly: “Tu me rejoindras quand j’ ___ déménagé.”',
          ['aurai', 'avais', 'ai'], 0,
          'Việc xong trước mốc tương lai → futur antérieur.',
          'Something finished before a future point → futur antérieur.')
      ]
    },

    /* -----------------------------------------------------
       49. Le conditionnel (2) — p. 230
       ----------------------------------------------------- */
    {
      id: 'gp-conditionnel2', num: 49, part: 'b2', minutes: 8,
      title: 'Le conditionnel (2)',
      subtitle: { vi: 'Điều kiện (2): tưởng tượng, tin chưa xác nhận, hối tiếc', en: 'Conditional (2): imagination, unconfirmed news, regrets' },
      summary: {
        vi: 'Conditionnel présent = radical futur + đuôi imparfait. Conditionnel passé = conditionnel của être/avoir + participe. Dùng để tưởng tượng, đưa tin chưa xác nhận và diễn tả hối tiếc.',
        en: 'Conditional present = future stem + imparfait endings. Conditional past = conditional of être/avoir + participle. It covers imagination, unconfirmed reports and regrets.'
      },
      blocks: [
        H('Hình thành', 'Formation'),
        TABLE([C('Thì', 'Tense'), C('Công thức', 'Formula'), C('Ví dụ', 'Example')], [
          [C('conditionnel présent', 'conditional present'), C('radical của futur + -ais, -ais, -ait, -ions, -iez, -aient', 'future stem + -ais, -ais, -ait, -ions, -iez, -aient'), C('je voudrais, je devrais, je serais', 'je voudrais, je devrais, je serais')],
          [C('conditionnel passé', 'conditional past'), C('conditionnel của être/avoir + participe passé', 'conditional of être/avoir + past participle'), C('j’aurais voulu, j’aurais dû, je serais venu', 'j’aurais voulu, j’aurais dû, je serais venu')]
        ]),
        H('Bốn cách dùng', 'Four uses'),
        TABLE([C('Cách dùng', 'Use'), C('Ví dụ', 'Example')], [
          [C('tưởng tượng thực tại khác', 'imagining another reality'), C('Sans toi, je serais perdu. Je ferais n’importe quoi.', 'Without you I would be lost. I would do anything.')],
          [C('giả định với « au cas où »', 'supposition with « au cas où »'), C('Au cas où vous auriez des problèmes, téléphonez-moi.', 'In case you have problems, call me.')],
          [C('tin chưa xác nhận', 'unconfirmed news'), C('Le président devrait se rendre à Tokyo. L’accident aurait fait deux cents victimes.', 'The president is reportedly going to Tokyo. The crash is said to have killed two hundred.')],
          [C('hối tiếc', 'regret'), C('J’aurais aimé faire du piano. J’aurais dû travailler plus.', 'I would have liked to play the piano. I should have worked more.')]
        ]),
        LIST([
          'Đây là thì của báo chí khi chưa kiểm chứng: « aurait fait », « devrait » — không khẳng định điều gì.',
          'Hối tiếc dùng conditionnel passé: j’aurais aimé, j’aurais dû, j’aurais pu.',
          'Trong câu « si », conditionnel đứng ở mệnh đề chính, không đứng sau « si ».',
          'Phân biệt với conditionnel (1) trang 136: cùng hình thức, khác chức năng (lịch sự vs tưởng tượng).'
        ], [
          'This is the journalist’s tense for unverified claims: « aurait fait », « devrait » — committing to nothing.',
          'Regrets use the conditional past: j’aurais aimé, j’aurais dû, j’aurais pu.',
          'In a « si » sentence the conditional goes in the main clause, never after « si ».',
          'Compare chapter 31: same forms, different job (politeness vs imagination).'
        ]),
        EXAMPLES([
          EX('Sans mon psy, j’aurais raté ma vie.', 'Không có bác sĩ tâm lý, đời tôi đã hỏng.', 'Without my therapist, I would have ruined my life.'),
          EX('L’accident d’avion aurait fait deux cents victimes.', 'Vụ tai nạn máy bay được cho là làm hai trăm người chết.', 'The plane crash is said to have killed two hundred people.')
        ])
      ],
      exercises: [
        FILL('Sans toi, je {{1}} perdu. (être, conditionnel)', ['serais'],
          'Radical futur « ser- » + đuôi imparfait → serais.',
          'Future stem « ser- » + imparfait ending → serais.'),
        FILL('J’{{1}} dû travailler plus. (avoir, conditionnel passé)', ['aurais'],
          'Conditionnel passé: j’aurais + participe.',
          'Conditional past: j’aurais + participle.'),
        CHOICE('Chọn đúng: « L’accident ___ fait deux cents victimes. » (tin chưa xác nhận)', 'Choose correctly: “L’accident ___ fait deux cents victimes.” (unconfirmed)',
          ['aurait', 'avait', 'aura'], 0,
          'Tin chưa xác nhận dùng conditionnel: aurait fait.',
          'Unconfirmed reports use the conditional: aurait fait.')
      ]
    },

    /* -----------------------------------------------------
       50. Les hypothèses — p. 232–234
       ----------------------------------------------------- */
    {
      id: 'gp-hypotheses', num: 50, part: 'b2', minutes: 10,
      title: 'Les hypothèses',
      subtitle: { vi: 'Câu điều kiện: si + présent / imparfait / plus-que-parfait', en: 'Conditional sentences: si + present / imparfait / pluperfect' },
      summary: {
        vi: 'Ba mô hình: si + présent → futur; si + imparfait → conditionnel présent (thực tại giả định); si + plus-que-parfait → conditionnel passé (quá khứ không xảy ra). Sau « si » không bao giờ dùng futur hay conditionnel.',
        en: 'Three patterns: si + present → future; si + imparfait → present conditional (unreal present); si + pluperfect → past conditional (unreal past). After « si » never use a future or conditional.'
      },
      blocks: [
        H('Ba mô hình', 'The three patterns'),
        TABLE([C('Giả định', 'Hypothesis'), C('Mệnh đề « si »', '« si » clause'), C('Mệnh đề chính', 'Main clause'), C('Ví dụ', 'Example')], [
          [C('tương lai (có thể xảy ra)', 'future (possible)'), C('si + présent', 'si + present'), C('futur simple', 'future'), C('S’il fait beau, nous irons à la campagne.', 'If the weather is nice, we will go to the countryside.')],
          [C('hiện tại (không có thật)', 'present (unreal)'), C('si + imparfait', 'si + imparfait'), C('conditionnel présent', 'present conditional'), C('S’il faisait beau, je sortirais.', 'If the weather were nice, I would go out.')],
          [C('quá khứ (đã không xảy ra)', 'past (did not happen)'), C('si + plus-que-parfait', 'si + pluperfect'), C('conditionnel passé', 'past conditional'), C('S’il avait fait beau, je serais sorti.', 'If the weather had been nice, I would have gone out.')]
        ]),
        H('Quand hay si?', 'Quand or si?'),
        LIST([
          '« Quand » + futur = chắc chắn: Quand je reviendrai, j’irai au Ritz.',
          '« Si » + présent = không chắc chắn: Si je reviens, j’irai au Ritz.',
          'Sau « si » giả định KHÔNG futur, KHÔNG conditionnel: không nói « s’il fera beau ».',
          'Phân biệt « si » điều kiện với « si » của câu hỏi gián tiếp (được dùng futur): Je ne sais pas si je partirai.'
        ], [
          '« Quand » + future = certainty: Quand je reviendrai, j’irai au Ritz.',
          '« Si » + present = uncertainty: Si je reviens, j’irai au Ritz.',
          'Hypothetical « si » takes NO future and NO conditional: never “s’il fera beau”.',
          'Distinguish hypothetical « si » from the indirect-question « si » (which does take the future): Je ne sais pas si je partirai.'
        ]),
        H('Hai cách dùng khác của « si » + présent', 'Two other uses of « si » + present'),
        LIST([
          'Khái quát (si = quand): Si on mange trop, on grossit. Si je dors trop, j’ai mal à la tête.',
          'Khuyên bảo: si + présent, mệnh đề chính dùng impératif — Si tu sors, mets ton manteau ! Si tu as des problèmes, appelle-moi !',
          'Đề nghị lịch sự: si + imparfait — Si on allait au cinéma ? Si on prenait un café ?',
          'Nhấn mạnh giả định: « au cas où » + conditionnel — Au cas où vous auriez des problèmes, téléphonez-moi.'
        ], [
          'General truth (si = quand): Si on mange trop, on grossit. Si je dors trop, j’ai mal à la tête.',
          'Advice: si + present, imperative in the main clause — Si tu sors, mets ton manteau ! Si tu as des problèmes, appelle-moi !',
          'Polite suggestion: si + imparfait — Si on allait au cinéma ? Si on prenait un café ?',
          'Supposition with « au cas où » + conditional — Au cas où vous auriez des problèmes, téléphonez-moi.'
        ]),
        CALLOUT('english', 'Tiếng Anh nói “If I were rich, I would travel”. Tiếng Pháp: Si j’étais riche, je voyagerais — imparfait + conditionnel, không dùng “serais” sau « si ».',
          'English says “If I were rich, I would travel”. French: Si j’étais riche, je voyagerais — imparfait + conditional, never “serais” after « si ».'),
        EXAMPLES([
          EX('Aujourd’hui, s’il faisait beau, j’irais à la piscine.', 'Hôm nay nếu trời đẹp tôi đã đi bơi.', 'Today, if the weather were nice, I would go to the pool.'),
          EX('Hier, si je n’étais pas parti en retard, je n’aurais pas raté le train.', 'Hôm qua nếu tôi không đi trễ, tôi đã không lỡ tàu.', 'Yesterday, if I had not left late, I would not have missed the train.')
        ])
      ],
      exercises: [
        FILL('S’il {{1}} (faire) beau, nous irons à la campagne.', ['fait'],
          'Giả định tương lai: si + présent, mệnh đề chính futur.',
          'Future hypothesis: si + present, future in the main clause.'),
        FILL('Si j’{{1}} (être) riche, je voyagerais.', ['étais'],
          'Giả định hiện tại không thật: si + imparfait.',
          'Unreal present: si + imparfait.'),
        CHOICE('Chọn đúng: « Si j’avais su, je ___ venu. »', 'Choose correctly: “Si j’avais su, je ___ venu.”',
          ['serais', 'serai', 'suis'], 0,
          'Quá khứ không xảy ra → conditionnel passé « serais venu ».',
          'Unreal past → past conditional « serais venu ».'),
        TRANSLATE('Nếu tôi có thời gian, tôi sẽ học tiếng Pháp.', 'If I had time, I would study French.',
          ['Si j’avais le temps, j’étudierais le français.', 'Si j’avais du temps, j’étudierais le français.'],
          'Thực tại giả định: si + imparfait + conditionnel présent.',
          'Unreal present: si + imparfait + present conditional.')
      ]
    },

    /* -----------------------------------------------------
       51. Le subjonctif — p. 238–248
       ----------------------------------------------------- */
    {
      id: 'gp-subjonctif', num: 51, part: 'b2', minutes: 16,
      title: 'Le subjonctif',
      subtitle: { vi: 'Thức giả định: hình thành và khi nào dùng', en: 'The subjunctive: formation and triggers' },
      summary: {
        vi: 'Subjonctif diễn tả điều chủ quan — mong muốn, cảm xúc, bắt buộc, nghi ngờ. Hình thành từ radical của « ils » ở hiện tại + e, es, e, ions, iez, ent. Đây là chương “ăn điểm” của DELF B2.',
        en: 'The subjunctive is the subjective mode — wishes, feelings, obligation, doubt. Build it from the « ils » present stem + e, es, e, ions, iez, ent. This is the chapter that earns DELF B2 marks.'
      },
      blocks: [
        P('So sánh: « Paul est absent » (indicatif — thực tế khách quan) và « J’aimerais qu’il soit là » (subjonctif — ý muốn chủ quan).',
          'Compare “Paul est absent” (indicative — objective fact) and “J’aimerais qu’il soit là” (subjunctive — subjective wish).'),
        H('Hình thành quy tắc chung', 'General formation'),
        TABLE([C('Bước', 'Step'), C('Ví dụ với partir', 'Example with partir')], [
          [C('1. Lấy radical của « ils » ở hiện tại', '1. Take the « ils » present stem'), C('ils part-ent → part-', 'ils part-ent → part-')],
          [C('2. Thêm e, es, e, ions, iez, ent', '2. Add e, es, e, ions, iez, ent'), C('que je parte, que tu partes, qu’il parte, que nous partions, que vous partiez, qu’ils partent', 'que je parte, que tu partes, qu’il parte, que nous partions, que vous partiez, qu’ils partent')]
        ]),
        LIST([
          'Động từ -er: subjonctif giống hệt hiện tại, chỉ khác « nous/vous » (-ions/-iez): que nous parlions, que vous parliez.',
          'Động từ -ir/-re: dùng radical « ils »: ils finissent → que je finisse; ils mettent → que je mette; ils écrivent → que j’écrive.',
          'Khi « nous/vous » có radical khác « ils », giữ khác biệt: ils boivent → que je boive NHƯNG que nous buvions, que vous buviez; prendre → que je prenne / que nous prenions.',
          'Bất quy tắc: être (sois, soit, soyons, soyez, soient), avoir (aie, ait, ayons, ayez, aient), aller (aille, allions, alliez, aillent), faire (fasse), pouvoir (puisse), savoir (sache).'
        ], [
          '-er verbs: the subjunctive matches the present except « nous/vous » (-ions/-iez): que nous parlions, que vous parliez.',
          '-ir/-re verbs: use the « ils » stem: ils finissent → que je finisse; ils mettent → que je mette; ils écrivent → que j’écrive.',
          'When « nous/vous » have a different stem from « ils », keep it: ils boivent → que je boive BUT que nous buvions, que vous buviez; prendre → que je prenne / que nous prenions.',
          'Irregular: être (sois, soit, soyons, soyez, soient), avoir (aie, ait, ayons, ayez, aient), aller (aille, allions, alliez, aillent), faire (fasse), pouvoir (puisse), savoir (sache).'
        ]),
        H('Khi nào dùng subjonctif', 'When to use the subjunctive'),
        TABLE([C('Nhóm kích hoạt', 'Trigger group'), C('Ví dụ', 'Example')], [
          [C('bắt buộc: il faut que, il est important que', 'obligation: il faut que, il est important que'), C('Il faut que je parte pour le Brésil. Il est important que j’y sois le 10.', 'I have to leave for Brazil. It is important that I be there on the 10th.')],
          [C('mong muốn, ý chí: vouloir, désirer, souhaiter, exiger, ordonner', 'wish, will: vouloir, désirer, souhaiter, exiger, ordonner'), C('Je veux qu’il revienne. J’exige que vous partiez.', 'I want him to come back. I demand that you leave.')],
          [C('cảm xúc, sợ: aimer que, avoir peur que, craindre que, regretter que', 'emotion, fear: aimer que, avoir peur que, craindre que, regretter que'), C('J’aimerais qu’il soit là. J’ai peur qu’il ne soit malade.', 'I would like him to be here. I am afraid he may be ill.')],
          [C('phán đoán: il est dommage que, il vaut mieux que, je trouve normal que', 'judgement: il est dommage que, il vaut mieux que, je trouve normal que'), C('Il est dommage qu’il parte. Je trouve normal qu’il ait du succès.', 'It is a pity that he is leaving. I find it normal that he is successful.')],
          [C('nghi ngờ, phủ định ý kiến: je ne crois pas que, il est possible que', 'doubt, negated opinion: je ne crois pas que, il est possible que'), C('Je ne crois pas que Paul soit malade. Il est possible que Paul parte.', 'I don’t think Paul is ill. It is possible that Paul leaves.')]
        ]),
        LIST([
          'Verbe « của cái đầu » (constater, penser, croire, déclarer, dire) → indicatif; « của trái tim » (vouloir, aimer, craindre) → subjonctif.',
          '« Espérer » là ngoại lệ: luôn đi với indicatif — J’espère que vous viendrez. J’espère qu’il fera beau.',
          'Phủ định hoặc câu hỏi đảo ngữ của động từ “đầu” chuyển sang subjonctif: Je ne pense pas qu’il ait la grippe. Pensez-vous que cet homme soit coupable ?',
          'Sự thật không chắc: Je cherche une maison qui A un grand jardin (tôi biết nó tồn tại) / qui AIT un grand jardin (tôi không chắc).',
          'Độ chắc: il est probable que + indicatif / il est possible que + subjonctif.'
        ], [
          '“Head” verbs (constater, penser, croire, déclarer, dire) → indicative; “heart” verbs (vouloir, aimer, craindre) → subjunctive.',
          '« Espérer » is the exception: always indicative — J’espère que vous viendrez. J’espère qu’il fera beau.',
          'A negated or inverted “head” verb switches to the subjunctive: Je ne pense pas qu’il ait la grippe. Pensez-vous que cet homme soit coupable ?',
          'Uncertain existence: Je cherche une maison qui A un grand jardin (I know it exists) / qui AIT un grand jardin (I am not sure).',
          'Degrees of certainty: il est probable que + indicative / il est possible que + subjunctive.'
        ]),
        H('Subjonctif présent hay passé', 'Present or past subjunctive'),
        LIST([
          'Thường dùng subjonctif PRÉSENT dù động từ chính ở thì nào: J’attends / J’ai attendu / J’attendrai qu’il soit là.',
          'Dùng subjonctif PASSÉ khi hành động đã xong: être/avoir ở subjonctif présent + participe — Je regrette qu’il soit parti. Je suis contente qu’il ait trouvé un emploi.',
          '« Ne » thẩm mỹ (không phải phủ định) xuất hiện sau động từ sợ: J’ai peur qu’il ne soit malade.',
          'Sau « après que » lý thuyết là indicatif: Il est sorti après qu’il a fini son discours.'
        ], [
          'The PRESENT subjunctive is usual whatever the main tense: J’attends / J’ai attendu / J’attendrai qu’il soit là.',
          'Use the PAST subjunctive when the action is complete: être/avoir in the present subjunctive + participle — Je regrette qu’il soit parti. Je suis contente qu’il ait trouvé un emploi.',
          'A stylistic (non-negative) « ne » appears after verbs of fear: J’ai peur qu’il ne soit malade.',
          'After « après que » the indicative is the logical choice: Il est sorti après qu’il a fini son discours.'
        ]),
        H('Liên từ + subjonctif', 'Conjunctions + subjunctive'),
        TABLE([C('Liên từ', 'Conjunction'), C('Nghĩa', 'Meaning'), C('Ví dụ', 'Example')], [
          [C('pour que, afin que, de sorte que', 'pour que, afin que, de sorte que'), C('để mà (mục đích)', 'so that (purpose)'), C('Je vous prête mes clés pour que vous puissiez rentrer.', 'I am lending you my keys so that you can get in.')],
          [C('de peur que, de crainte que', 'de peur que, de crainte que'), C('vì sợ rằng', 'for fear that'), C('Nous avons accepté de peur qu’il ne parte.', 'We accepted for fear he might leave.')],
          [C('jusqu’à ce que, en attendant que, avant que', 'jusqu’à ce que, en attendant que, avant que'), C('cho đến khi, trước khi', 'until, before'), C('Je resterai jusqu’à ce qu’il revienne. Rentrons avant qu’il ne pleuve.', 'I will stay until he returns. Let’s go home before it rains.')],
          [C('bien que, quoique', 'bien que, quoique'), C('mặc dù', 'although'), C('Bien qu’il fasse froid, nous allons à la campagne.', 'Although it is cold, we are going to the countryside.')],
          [C('à moins que', 'à moins que'), C('trừ khi', 'unless'), C('Nous prendrons l’avion à moins qu’il n’y ait une grève.', 'We will fly unless there is a strike.')],
          [C('à condition que, pourvu que', 'à condition que, pourvu que'), C('với điều kiện là', 'provided that'), C('Tu peux sortir à condition que tu me dises où tu vas.', 'You can go out provided you tell me where you are going.')]
        ]),
        CALLOUT('tip', 'Bí quyết nhớ: subjonctif đi với « que » khi người nói KHÔNG khẳng định sự thật — mà ao ước, đòi hỏi, sợ, phán đoán hoặc nghi ngờ. Nếu chỉ mô tả sự thật thì dùng indicatif.',
          'Memory hook: the subjunctive follows « que » whenever the speaker is NOT asserting a fact — wishing, demanding, fearing, judging or doubting. Plain factual report keeps the indicative.')
      ],
      exercises: [
        FILL('Il faut que je {{1}} (partir) tout de suite.', ['parte'],
          'Radical « ils partent » + e → que je parte.',
          'Stem of « ils partent » + e → que je parte.'),
        FILL('Je veux que vous {{1}} (être) heureux.', ['soyez'],
          '« Être » ở subjonctif: que vous soyez.',
          '« Être » in the subjunctive: que vous soyez.'),
        CHOICE('Chọn đúng: « J’espère que vous ___ demain. »', 'Choose correctly: “J’espère que vous ___ demain.”',
          ['viendrez', 'veniez', 'venez'], 0,
          '« Espérer » là ngoại lệ, đi với indicatif (futur).',
          '« Espérer » is the exception and takes the indicative (future).'),
        CHOICE('Chọn đúng: « Bien qu’il ___ froid, nous sortons. »', 'Choose correctly: “Bien qu’il ___ froid, nous sortons.”',
          ['fasse', 'fait', 'fera'], 0,
          '« Bien que » + subjonctif.',
          '« Bien que » takes the subjunctive.'),
        TRANSLATE('Tôi muốn anh ấy đến.', 'I want him to come.',
          ['Je veux qu’il vienne.'],
          'Mong muốn + que + subjonctif: qu’il vienne.',
          'A wish + que + subjunctive: qu’il vienne.')
      ]
    },

    /* -----------------------------------------------------
       52. Les relations logiques — p. 250–254
       ----------------------------------------------------- */
    {
      id: 'gp-relations', num: 52, part: 'b2', minutes: 12,
      title: 'Les relations logiques',
      subtitle: { vi: 'Quan hệ logic: nguyên nhân, hệ quả, mục đích, đối lập', en: 'Logical links: cause, consequence, purpose, contrast' },
      summary: {
        vi: 'Bốn nhóm từ nối quyết định điểm viết DELF B2: nguyên nhân (parce que, puisque, comme, à cause de, grâce à), hệ quả (donc, si bien que), mục đích (pour que, afin que) và đối lập (mais, pourtant, bien que, malgré).',
        en: 'Four connector families decide DELF B2 writing marks: cause (parce que, puisque, comme, à cause de, grâce à), consequence (donc, si bien que), purpose (pour que, afin que) and contrast (mais, pourtant, bien que, malgré).'
      },
      blocks: [
        P('Bài viết B2 được chấm vào khả năng NỐI ý — không chỉ nói đúng mà còn chỉ rõ quan hệ logic giữa các ý.',
          'B2 writing is marked on LINKING ideas — not only correctness but naming the logical relation between them.'),
        H('Nguyên nhân', 'Cause'),
        TABLE([C('Từ nối', 'Connector'), C('Cách dùng', 'Use'), C('Ví dụ', 'Example')], [
          [C('parce que', 'parce que'), C('đặt ở giữa câu, trả lời « pourquoi ? »', 'mid-sentence, answers « pourquoi ? »'), C('Je reste à la maison parce que je suis malade.', 'I am staying home because I am ill.')],
          [C('comme', 'comme'), C('đặt ở ĐẦU câu', 'placed at the START'), C('Comme je suis malade, je reste à la maison.', 'As I am ill, I am staying home.')],
          [C('puisque', 'puisque'), C('khi nguyên nhân đã rõ/người nghe biết; hay gặp trong câu cảm thán', 'when the cause is obvious/known; common in exclamations'), C('Puisque tu sors, achète du pain ! Puisque tu sais tout, réponds-moi !', 'Since you are going out, buy some bread! Since you know everything, answer me!')],
          [C('car', 'car'), C('văn viết, trang trọng hơn « parce que »', 'written, more formal than « parce que »'), C('Mon fils ne peut pas aller à l’école, car il est souffrant.', 'My son cannot go to school, for he is unwell.')],
          [C('à cause de + nom', 'à cause de + noun'), C('nguyên nhân tiêu cực/trung tính', 'negative or neutral cause'), C('La rue est barrée à cause des travaux.', 'The street is closed because of roadworks.')],
          [C('grâce à + nom', 'grâce à + noun'), C('nguyên nhân tích cực', 'positive cause'), C('J’ai réussi grâce à toi.', 'I succeeded thanks to you.')]
        ]),
        H('Hệ quả', 'Consequence'),
        LIST([
          '« Donc », « par conséquent » (văn viết) đưa ra kết luận: Je n’ai pas de permis, donc je ne peux pas conduire.',
          'Khẩu ngữ dùng « alors »: La rue est barrée, alors passons par-derrière !',
          'Hệ quả tất yếu, văn viết: « si bien que », « de sorte que » — La pollution augmente si bien que la planète est en danger.',
          'Để nêu lý do của hành động nói: « c’est la raison pour laquelle » (viết) / « c’est pour ça que » (nói).'
        ], [
          '« Donc » and « par conséquent » (written) draw the conclusion: Je n’ai pas de permis, donc je ne peux pas conduire.',
          'Speech uses « alors »: La rue est barrée, alors passons par-derrière !',
          'Inevitable consequence in writing: « si bien que », « de sorte que » — La pollution augmente si bien que la planète est en danger.',
          'To give the reason for what you are saying: « c’est la raison pour laquelle » (written) / « c’est pour ça que » (spoken).'
        ]),
        H('Mục đích', 'Purpose'),
        TABLE([C('Cấu trúc', 'Structure'), C('Dùng', 'Use'), C('Ví dụ', 'Example')], [
          [C('pour + infinitif', 'pour + infinitive'), C('cùng chủ ngữ', 'same subject'), C('Je me dépêche pour être à l’heure.', 'I am hurrying to be on time.')],
          [C('pour que + subjonctif', 'pour que + subjunctive'), C('khác chủ ngữ', 'different subject'), C('Je me dépêche pour que tout soit prêt.', 'I am hurrying so that everything is ready.')],
          [C('afin de + infinitif', 'afin de + infinitive'), C('văn viết, cùng chủ ngữ', 'written, same subject'), C('Je vous écris afin de vous informer de la situation.', 'I am writing to inform you of the situation.')],
          [C('afin que + subjonctif', 'afin que + subjunctive'), C('văn viết, khác chủ ngữ', 'written, different subject'), C('Je vous écris afin que vous soyez informé.', 'I am writing so that you are informed.')]
        ]),
        CALLOUT('trap', '« Pour que » = mục đích, « parce que » = nguyên nhân: J’utilise ce shampoing POUR QUE mes cheveux frisent (để tóc xoăn) / PARCE QUE mes cheveux frisent (vì tóc đã xoăn).',
          '« Pour que » is purpose, « parce que » is cause: J’utilise ce shampoing POUR QUE mes cheveux frisent (to make my hair curl) / PARCE QUE mes cheveux frisent (because my hair curls).'),
        H('Đối lập và nhượng bộ', 'Opposition and concession'),
        TABLE([C('Từ nối', 'Connector'), C('Sắc thái', 'Nuance'), C('Ví dụ', 'Example')], [
          [C('mais', 'mais'), C('chỉ sự khác nhau', 'simply marks a difference'), C('Il fait froid dans le Nord, mais il fait beau dans le Sud.', 'It is cold in the North, but fine in the South.')],
          [C('par contre / en revanche', 'par contre / en revanche'), C('nhấn mạnh đối lập (nói / viết)', 'strengthen opposition (spoken / written)'), C('Il fait froid à Paris, en revanche il fait chaud à Nice.', 'It is cold in Paris, whereas it is warm in Nice.')],
          [C('tandis que / alors que', 'tandis que / alors que'), C('đối lập kèm so sánh', 'contrast by comparison'), C('C’est l’hiver en France, alors que c’est l’été au Brésil.', 'It is winter in France, while it is summer in Brazil.')],
          [C('pourtant', 'pourtant'), C('mâu thuẫn với điều vừa nói', 'contradicts what precedes'), C('Je suis fatigué, pourtant j’ai dormi neuf heures.', 'I am tired, yet I slept nine hours.')],
          [C('cependant / toutefois', 'cependant / toutefois'), C('văn viết', 'written register'), C('Tout est prêt. Toutefois, il reste quelques détails.', 'Everything is ready. However, a few details remain.')],
          [C('bien que + subjonctif', 'bien que + subjunctive'), C('mặc dù (= même si)', 'although (= même si)'), C('Il fait froid, bien qu’il y ait du soleil.', 'It is cold, although the sun is out.')],
          [C('malgré + nom', 'malgré + noun'), C('mặc dù + danh từ', 'despite + noun'), C('Nous sortons malgré la pluie.', 'We are going out despite the rain.')],
          [C('quand même', 'quand même'), C('khẩu ngữ: dù sao / trách nhẹ', 'spoken: all the same / mild reproach'), C('Il fait froid, mais je sors quand même ! Tu pourrais quand même m’aider !', 'It is cold but I am going out anyway! You could still help me!')],
          [C('avoir beau + infinitif', 'avoir beau + infinitive'), C('cố gắng mà không kết quả', 'effort without result'), C('J’ai beau chercher, je ne retrouve plus mes clés.', 'However hard I look, I cannot find my keys.')]
        ]),
        EXAMPLES([
          EX('C’est l’hiver en France, alors qu’au Brésil c’est l’été.', 'Ở Pháp là mùa đông, trong khi ở Brazil là mùa hè.', 'It is winter in France, while in Brazil it is summer.'),
          EX('Je vous écris afin que vous soyez informé de la situation.', 'Tôi viết để anh được thông tin về tình hình.', 'I am writing so that you are informed of the situation.')
        ])
      ],
      exercises: [
        FILL('Je reste à la maison {{1}} que je suis malade. (nguyên nhân)', ['parce'],
          'Nguyên nhân giữa câu: parce que.',
          'Mid-sentence cause: parce que.'),
        FILL('Nous sortons {{1}} la pluie. (mặc dù + danh từ)', ['malgré'],
          '« Malgré » + danh từ = mặc dù.',
          '« Malgré » + noun = despite.'),
        CHOICE('Chọn đúng: « Je me dépêche ___ que tout soit prêt. »', 'Choose correctly: “Je me dépêche ___ que tout soit prêt.”',
          ['pour', 'parce', 'comme'], 0,
          'Mục đích + subjonctif → « pour que ».',
          'Purpose + subjunctive → « pour que ».'),
        CHOICE('Chọn đúng: « Je suis fatigué, ___ j’ai dormi neuf heures. » (mâu thuẫn)', 'Choose correctly: “Je suis fatigué, ___ j’ai dormi neuf heures.” (contradiction)',
          ['pourtant', 'donc', 'puisque'], 0,
          '« Pourtant » chỉ mâu thuẫn với điều vừa nói.',
          '« Pourtant » marks a contradiction with what precedes.'),
        TRANSLATE('Vì trời mưa nên chúng tôi ở nhà.', 'Because it was raining, we stayed home.',
          ['Comme il pleuvait, nous sommes restés à la maison.', 'Parce qu’il pleuvait, nous sommes restés à la maison.'],
          '« Comme » đứng đầu câu, hoặc « parce que » ở giữa.',
          '« Comme » opens the sentence, or « parce que » sits in the middle.')
      ]
    },

  ];

  /* Multiple-choice options are authored with the right answer first for
     readability in this file. Rotate them per chapter and exercise so a
     learner cannot simply pick the first option every time. */
  GD.chapters.forEach(function (chapter) {
    chapter.exercises.forEach(function (ex, index) {
      if (ex.type !== 'choice' || !Array.isArray(ex.options) || ex.options.length < 2) return;
      var shift = (chapter.num + index) % ex.options.length;
      if (!shift) return;
      ex.options = ex.options.slice(shift).concat(ex.options.slice(0, shift));
      ex.answer = (ex.answer - shift + ex.options.length) % ex.options.length;
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
