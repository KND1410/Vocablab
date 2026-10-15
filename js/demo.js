/* =========================================================
   VocabLab — demo.js
   Built-in sample deck (Travel / Work / Food & Dining),
   French → Vietnamese. Same shape as decks parsed from Sheets.
   ========================================================= */
(function (global) {
  'use strict';

  const DATA = [
    {
      name: 'Travel',
      words: [
        ['gare', 'nhà ga', '/ɡaʁ/', 'Le train part de la gare à huit heures.', 'noun (f)'],
        ['aéroport', 'sân bay', '/a.e.ʁɔ.pɔʁ/', "Notre vol part de l'aéroport.", 'noun (m)'],
        ['billet', 'vé', '/bi.jɛ/', "J'ai acheté un billet aller-retour.", 'noun (m)'],
        ['valise', 'va li', '/va.liz/', 'Ma valise est trop lourde.', 'noun (f)'],
        ['voyage', 'chuyến đi', '/vwa.jaʒ/', 'Bon voyage !', 'noun (m)'],
        ['horaire', 'giờ tàu, thời gian biểu', '/ɔ.ʁɛʁ/', "Je vérifie l'horaire des trains.", 'noun (m)'],
        ['retard', 'sự trì hoãn, sự muộn', '/ʁə.taʁ/', 'Le train a du retard.', 'noun (m)'],
        ['réservation', 'sự đặt trước', '/ʁe.zɛʁ.va.sjɔ̃/', "J'ai une réservation pour deux nuits.", 'noun (f)'],
        ['destination', 'điểm đến', '/dɛs.ti.na.sjɔ̃/', 'La destination finale est Nice.', 'noun (f)'],
        ['bagage', 'hành lý', '/ba.ɡaʒ/', 'Enregistrez vos bagages ici.', 'noun (m)'],
        ['quai', 'sân ga, bến tàu', '/kɛ/', 'Le train arrive sur le quai numéro trois.', 'noun (m)'],
        ['environ', 'khoảng, xấp xỉ', '/ɑ̃.vi.ʁɔ̃/', 'Le trajet dure environ deux heures.', 'adverb']
      ]
    },
    {
      name: 'Work',
      words: [
        ['bureau', 'văn phòng, bàn làm việc', '/by.ʁo/', 'Je travaille au bureau le mardi.', 'noun (m)'],
        ['réunion', 'cuộc họp', '/ʁe.y.njɔ̃/', 'La réunion commence à neuf heures.', 'noun (f)'],
        ['collègue', 'đồng nghiệp', '/kɔ.lɛɡ/', "Mon collègue m'aide souvent.", 'noun'],
        ['salaire', 'tiền lương', '/sa.lɛʁ/', 'Son salaire est payé chaque mois.', 'noun (m)'],
        ['entretien', 'cuộc phỏng vấn', '/ɑ̃.tʁə.tjɛ̃/', "J'ai un entretien demain matin.", 'noun (m)'],
        ['délai', 'thời hạn', '/de.lɛ/', 'Il faut respecter le délai.', 'noun (m)'],
        ['congé', 'ngày nghỉ phép', '/kɔ̃.ʒe/', 'Je prends un congé la semaine prochaine.', 'noun (m)'],
        ['patron', 'ông chủ', '/pa.tʁɔ̃/', 'Mon patron est très occupé.', 'noun (m)'],
        ['expérience', 'kinh nghiệm', '/ɛks.pe.ʁjɑ̃s/', "Elle a cinq ans d'expérience.", 'noun (f)'],
        ['contrat', 'hợp đồng', '/kɔ̃.tʁa/', 'Je signe le contrat lundi.', 'noun (m)'],
        ['promotion', 'sự thăng chức', '/pʁɔ.mɔ.sjɔ̃/', 'Il a reçu une promotion.', 'noun (f)'],
        ['tâche', 'nhiệm vụ, công việc', '/taʃ/', 'Cette tâche est facile.', 'noun (f)']
      ]
    },
    {
      name: 'Food & Dining',
      words: [
        ['restaurant', 'nhà hàng', '/ʁɛs.tɔ.ʁɑ̃/', 'Le restaurant ouvre à midi.', 'noun (m)'],
        ['pain', 'bánh mì', '/pɛ̃/', "J'achète du pain frais.", 'noun (m)'],
        ['fromage', 'phô mai', '/fʁɔ.maʒ/', 'Ce fromage est délicieux.', 'noun (m)'],
        ['boisson', 'đồ uống', '/bwa.sɔ̃/', 'Quelle boisson voulez-vous ?', 'noun (f)'],
        ['dessert', 'món tráng miệng', '/de.sɛʁ/', 'Nous partageons un dessert.', 'noun (m)'],
        ['légume', 'rau củ', '/le.ɡym/', 'Les légumes sont frais au marché.', 'noun (m)'],
        ['entrée', 'món khai vị', '/ɑ̃.tʁe/', "L'entrée est une salade.", 'noun (f)'],
        ['addition', 'hóa đơn thanh toán', '/a.di.sjɔ̃/', "L'addition, s'il vous plaît !", 'noun (f)'],
        ['recette', 'công thức nấu ăn', '/ʁə.sɛt/', 'Cette recette est simple.', 'noun (f)'],
        ['épicerie', 'cửa hàng tạp hóa', '/e.pi.sʁi/', "L'épicerie ouvre tôt le matin.", 'noun (f)'],
        ['beurre', 'bơ', '/bœʁ/', 'Je mets du beurre sur le pain.', 'noun (m)'],
        ['goûter', 'nếm thử, ăn nhẹ', '/ɡu.te/', 'Tu veux goûter ce gâteau ?', 'verb']
      ]
    }
  ];

  function load() {
    const topics = DATA.map(function (t) {
      return {
        id: Util.slugify(t.name),
        name: t.name,
        words: t.words.map(function (w) {
          return { term: w[0], meaning: w[1], pron: w[2], example: w[3], pos: w[4] };
        })
      };
    });
    const wordCount = topics.reduce(function (n, t) { return n + t.words.length; }, 0);
    return {
      source: { mode: 'demo', label: 'Demo deck (French)', detail: topics.length + ' topics · ' + wordCount + ' words' },
      loadedAt: Date.now(),
      topics: topics,
      wordCount: wordCount
    };
  }

  global.DemoDeck = { load: load };
})(typeof window !== 'undefined' ? window : globalThis);
