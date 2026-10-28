/* =========================================================
   VocabLab — js/exam-data.js
   Examen blanc n°1 (DELF B2) — paper text, questions, audio.
   French content is the exam itself and never gets translated.
   ========================================================= */
(function (global) {
  'use strict';

  function q(text, points, options, extra) {
    const out = { text: text, points: points, options: options };
    if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  /* ---------- Partie 1 — compréhension de l'oral ---------- */

  const ORAL_1 = {
    id: 'o1',
    number: 1,
    piste: 25,
    audio: 'delf_b2_ibk_25.mp3',
    plays: 'Vous allez écouter 2 fois un document.',
    instruction: 'Répondez aux questions en cochant la bonne réponse.',
    points: 9,
    questions: [
      q('D’après l’étude citée par Lucie, quelle est la réaction la plus courante face au bruit en open space ?', 1, [
        'S’isoler.',
        'Prendre une pause.',
        'Se plaindre à ses responsables.'
      ]),
      q('Le sentiment d’être dérangé par ses collègues est partagé par…', 1, [
        '62 % des salariés et salariées.',
        '71 % des femmes.',
        '71 % des hommes.'
      ]),
      q('Pour les journalistes, le bruit en open space est…', 1.5, [
        'un phénomène qui ne les touche pas.',
        'un fait auquel eux-mêmes sont confrontés.',
        'une conséquence inévitable du travail en collectivité.'
      ]),
      q('D’après le reportage, quelle est la nuisance sonore qui dérange le plus en open space ?', 1.5, [
        'Les conversations.',
        'Les bruits corporels.',
        'Les gens qui parlent tout seuls.'
      ]),
      q('Selon le sondage, comment pensent être perçues les personnes qui partagent un open space ?', 1.5, [
        'Ce sont les autres qui dérangent, pas moi.',
        'Tout le monde fait du bruit donc je fais pareil.',
        'Je sais que je dérange mais je ne peux rien y faire.'
      ]),
      q('Quel était, à l’origine, l’intérêt de travailler en open space ?', 1.5, [
        'Gagner de la place au bureau.',
        'Encourager les réunions de travail.',
        'Favoriser les échanges entre collègues.'
      ]),
      q('Une enquête récente a montré qu’en open space, les salariés…', 1, [
        'écrivent plus d’e-mails.',
        'travaillent plus en petits groupes.',
        'communiquent plus en face à face.'
      ])
    ]
  };

  const ORAL_2 = {
    id: 'o2',
    number: 2,
    piste: 26,
    audio: 'delf_b2_ibk_26.mp3',
    plays: 'Vous allez écouter 2 fois un document.',
    instruction: 'Répondez aux questions en cochant la bonne réponse.',
    points: 9,
    questions: [
      q('Quinze ans après le vote de la loi sur le handicap en France, on constate que les crèches qui intègrent les enfants en situation de handicap…', 1, [
        'ont plus de moyens.',
        'sont aidées par l’État.',
        'sont peu nombreuses.'
      ]),
      q('Quelle est la particularité de la crèche Jourdan ?', 1.5, [
        'Elle travaille de manière étroite avec les parents.',
        'Elle reçoit une aide spécifique de la direction régionale.',
        'Elle recrute des professionnels, toutes spécialités confondues.'
      ]),
      q('Selon la directrice, l’idée reçue sur l’accueil d’enfants handicapés en crèche est que…', 1.5, [
        'cela coûte cher.',
        'cela nécessite des équipements spéciaux.',
        'cela fait appel à des spécialistes médicaux.'
      ]),
      q('Concernant le handicap, la directrice de la crèche Jourdan déplore…', 1, [
        'une absence de prise de conscience de la société.',
        'un manque dans la formation du personnel éducatif.',
        'un retard dans les progrès des infrastructures médicales.'
      ]),
      q('Quel reproche est fait à de nombreuses crèches accueillant des enfants handicapés ?', 1.5, [
        'Elles ont souvent un matériel inadapté.',
        'Elles les placent avec des enfants plus petits.',
        'Elles montrent peu de volonté de s’en occuper.'
      ]),
      q('Selon la maman de Lazare, quel est l’avantage de la crèche Jourdan pour son fils ? Le personnel…', 1.5, [
        'met tout en place pour que Lazare se sente bien.',
        'propose à Lazare des petits challenges éducatifs.',
        's’occupe de Lazare en dehors du groupe d’enfants.'
      ]),
      q('Selon la maman d’Elsa, l’intégration des enfants en situation de handicap à la crèche est l’opportunité pour les enfants…', 1, [
        'de se montrer solidaires.',
        'de combattre leurs peurs.',
        'de développer leur curiosité.'
      ])
    ]
  };

  const ORAL_3 = {
    id: 'o3',
    number: 3,
    piste: 27,
    audio: 'delf_b2_ibk_27.mp3',
    plays: 'Vous allez écouter 1 fois 3 documents.',
    instruction: 'Lisez les questions. Écoutez le document et répondez en cochant la bonne réponse.',
    points: 7,
    documents: [
      { number: 1, label: 'Document 1' },
      { number: 2, label: 'Document 2' },
      { number: 3, label: 'Document 3' }
    ],
    questions: [
      q('Selon l’étude publiée par les chercheurs de l’université du Michigan, la pratique d’un sport aurait un lien avec…', 1, [
        'la durée des études.',
        'le désintérêt pour les études.',
        'les mauvaises notes des étudiants.'
      ], { doc: 1 }),
      q('Quel est le problème auquel peuvent faire face les étudiants ?', 1.5, [
        'Le niveau trop élevé.',
        'L’esprit de compétition.',
        'La mauvaise gestion du temps.'
      ], { doc: 1 }),
      q('Germaine Acogny danse en solo dans un spectacle qui…', 1.5, [
        'montre l’importance de la formation.',
        'met en avant le travail et la tradition.',
        'parle de ses origines et des rapports avec sa famille.'
      ], { doc: 2 }),
      q('L’École des Sables a besoin de…', 1, [
        'recruter du personnel.',
        'obtenir plus de financements.',
        'faire des travaux d’aménagement.'
      ], { doc: 2 }),
      q('D’après l’article de Psychologie magazine cité, quel rapport ont les Français avec l’apprentissage des langues ?', 1, [
        'Ils se montrent confiants dans leur apprentissage.',
        'Ils prennent plaisir à apprendre une nouvelle langue.',
        'Ils se sentent en insécurité quand ils apprennent une langue.'
      ], { doc: 3 }),
      q('Selon le journaliste, l’intérêt pour les langues est lié à…', 1, [
        'notre caractère.',
        'notre façon d’apprendre.',
        'notre quotient intellectuel.'
      ], { doc: 3 })
    ]
  };

  /* ---------- Partie 2 — compréhension des écrits ---------- */

  const SMALL_TALK = {
    title: 'Avec le déconfinement, le retour bienfaisant du small talk',
    source: 'Le Monde',
    author: 'Marie Slavicek',
    date: '4 juin 2020',
    blocks: [
      { p: 'Après plusieurs mois d’angoisse et de conversations graves suite à la pandémie de Covid-19, le déconfinement permet aux êtres humains de renouer avec un besoin vital : parler pour ne rien dire.' },
      { p: '[…] Soyons honnêtes : on a déjà vu plus intéressant comme sujet de discussion. Mais avouez que ça a aussi un côté sympa, presque rassurant, de parler de la pluie et du beau temps, d’échanger des platitudes, de faire des commentaires insignifiants… Bref, de faire ce que les anglophones appellent du small talk (littéralement « de la petite conversation »).' },
      { h: 'Trouver des points d’entente' },
      { p: 'Sympathique, le retour de la conversation banale est même vital. Comme le notait le New York Times, fin mai, le small talk a disparu pendant plus de deux mois. Fini le blabla inoffensif, terminés les bavardages insouciants. Les rues se sont vidées, nos vies sociales aussi. Et toutes nos discussions — sur Skype ou avec nos « co-confinés » — se sont focalisées sur la gravité de la pandémie et ses conséquences : courbes de progression du virus, crise économique mondiale, peur d’une deuxième vague… Dans un climat d’angoisse généralisée, impossible, ou presque, de renouer avec la légèreté du small talk.' },
      { p: 'Comment ça va ? Quoi de neuf ? Que répondre à ces interrogations, si communes en temps normal ? À ces questions d’habitude balayées par un automatique « Bien, et toi ? », même si ce n’est pas vrai. Personne ne commence une discussion en parlant de ses problèmes de couple, d’argent ou de travail. À supposer que vous puissiez parler de ces choses-là avec votre interlocuteur, vous allez d’abord prendre la peine d’évoquer sa nouvelle coupe de cheveux ou vos difficultés à trouver une place de parking.' },
      { p: 'Les « conversations confinées » étaient peut-être plus « vraies », plus « authentiques », parce qu’elles permettaient d’évacuer ses émotions profondes sans s’encombrer de faux-semblants. Mais c’est oublier un peu vite que le small talk, précisément par son caractère futile, constitue en fait un rouage essentiel dans les interactions humaines. […]' },
      { p: 'En fait, faire du small talk, cela revient tout simplement à signifier à son interlocuteur, quelle que soit sa culture : « Je suis comme toi. »' },
      { h: 'Il sert à nous rapprocher' },
      { p: 'Assez paradoxalement, nous avons donc abandonné le small talk à un moment où nous avions pourtant un fort besoin d’interactions. Pendant le confinement, l’anxiété et l’inquiétude l’ont emporté sur la nécessité d’avoir des échanges frivoles. C’est pourquoi se remettre à parler de la météo, c’est un des signes d’un retour à la normale. Et ça, contrairement à la pluie, on ne va pas s’en plaindre.' }
    ]
  };

  const ECRIT_1 = {
    id: 'e1',
    number: 1,
    title: 'Comprendre un texte informatif ou argumentatif',
    points: 9,
    intro: 'Vous lisez un article dans un journal francophone.',
    note: '* déconfinement : arrêt du maintien obligatoire d’une personne à domicile.',
    text: SMALL_TALK,
    questions: [
      q('Selon l’article, en quoi consiste le small talk ?', 1, [
        'Parler de choses légères avec des gens.',
        'Aborder des sujets graves avec des inconnus.',
        'Débattre de questions d’actualité avec ses collègues.'
      ]),
      q('D’après une étude du New York Times, le small talk a disparu pendant le confinement parce qu’…', 1.5, [
        'il était compliqué d’avoir le temps de discuter.',
        'il était irresponsable de parler avec d’autres personnes.',
        'il était difficile de parler d’autre chose que de l’actualité.'
      ]),
      q('En pratiquant le small talk,…', 1, [
        'nous créons des habitudes communes entre deux individus.',
        'nous évitons d’aborder directement des problèmes personnels.',
        'nous nous assurons que notre interlocuteur va bien avant de lui parler.'
      ]),
      q('Selon l’article, pendant le confinement, les conversations étaient…', 1.5, [
        'moins profondes.',
        'moins amusantes.',
        'moins superficielles.'
      ]),
      q('D’après l’article, il ne faut pas oublier que le small talk a la fonction de…', 1.5, [
        'gommer les différences culturelles.',
        'garder une distance entre les gens.',
        'introduire un discours plus profond.'
      ]),
      q('Pour le journaliste, qu’est-ce qui était paradoxal dans notre comportement pendant le confinement ?', 1.5, [
        'On négligeait une pratique dont on avait besoin.',
        'On parlait du temps sans pouvoir sortir de chez soi.',
        'On avait des échanges légers dans un climat d’angoisse générale.'
      ]),
      q('Pour le journaliste, le retour du small talk dans nos conversations est…', 1, [
        'plutôt positif.',
        'assez déplorable.',
        'un peu inévitable.'
      ])
    ]
  };

  const ECOCIRQUE = {
    title: 'Des animaux hologrammes dans le cirque Bouglione à Montpellier',
    source: 'Le Parisien',
    author: 'Alexandre Seba',
    date: '4 novembre 2020',
    blocks: [
      { p: 'L’écocirque Bouglione dresse son chapiteau à Montpellier (Hérault) […]. Ce cirque d’un nouveau genre, préparé depuis trois ans par André-Joseph Bouglione, sera 100 % humain.' },
      { p: '« Ce projet est né d’un engagement éthique et personnel. Nous ne devons plus exploiter d’animaux sauvages. Les cirques doivent se remettre en question et se réinventer », dit-il clairement, en saluant les mesures du gouvernement en ce sens (NDLR : les animaux sauvages dans les cirques itinérants seront progressivement interdits en France).' },
      { p: 'Ce n’est d’ailleurs pas un hasard si Montpellier a été « choisi naturellement » pour lancer son spectacle : « Cette ville a toujours été précurseur en termes de protection des animaux, souligne Eddine Ariztegui, délégué municipal au bien-être animal. Cela a donc du sens d’accueillir l’Écocirque et nous en sommes très fiers. »' },
      { p: 'Au programme de ce grand événement, pas de fauves ni d’éléphants, mais un ours polaire et une orque… en hologrammes ! Conçus par Adrénaline Studio, ces animations 3D s’appuient sur les derniers procédés en la matière : « Une technologie haut de gamme avec un rendu très réaliste, utilisée pour les jeux vidéo, précise leur créateur, Sébastien Mizermont. Nous n’aurions pas pu faire ça il y a un an et demi… »' },
      { h: 'Un arbre planté pour une place achetée' },
      { p: 'Derrière l’image de ces deux espèces en voie de disparition, l’Écocirque veut « faire réfléchir à l’état de la planète et au rôle de la nature, mais sans faire de morale ni donner de leçons… car on est aussi là pour faire la fête ! » poursuit André-Joseph. Et dans ce domaine, le circassien ne manque pas d’ambition : « Les hologrammes ne sont pas là juste pour remplacer les animaux mais pour vraiment proposer quelque chose de nouveau dans le cirque, comme une nouvelle discipline à part entière à développer », assure l’ancien dompteur.' },
      { p: 'Les numéros traditionnels seront bien sûr bien là : clowns, jongleurs, acrobates… 25 artistes de tous horizons seront en piste. « Nous faisons venir le meilleur du cirque mondial : une troupe de clowns russes extraordinaires, une lanceuse de couteaux ukrainienne qui va faire frémir le public… », annonce Bouglione.' },
      { p: 'Ces artistes « qui risquent leur vie pour quelques bravos » seront accompagnés de musiciens et d’un écran géant pour offrir « un spectacle de très haute qualité ». Autour du grand chapiteau couleur d’abeille, un écovillage sera formé de conteneurs recyclés. Ces box colorés utilisés pour acheminer le matériel accueilleront des associations et des artisans locaux, dans un cadre respectueux de l’environnement : toilettes sèches, collecte des déchets, matériaux biodégradables, opération un arbre planté pour une place achetée (avec Reforest’Action), etc. « Nous sommes le seul cirque à n’avoir aucun camion sur le parking, ajoute André-Joseph. Et nous espérons à l’avenir pouvoir nous déplacer en train avec nos conteneurs. »' }
    ]
  };

  const ECRIT_2 = {
    id: 'e2',
    number: 2,
    title: 'Comprendre un texte informatif ou argumentatif',
    points: 9,
    intro: 'Vous lisez un article dans un journal francophone.',
    text: ECOCIRQUE,
    questions: [
      q('Le cirque présenté dans cet article est qualifié d’« écocirque » parce qu’…', 1, [
        'il utilise des énergies renouvelables.',
        'il refuse de mettre en scène des animaux.',
        'il travaille avec des associations écologiques.'
      ]),
      q('Selon André-Joseph Bouglione, le projet de l’Écocirque a vu le jour parce que…', 1.5, [
        'les animaux du cirque étaient trop vieux.',
        'les lois obligent les cirques à se renouveler.',
        'les spectateurs voulaient voir de nouveaux spectacles.'
      ]),
      q('Le cirque Bouglione s’installe dans la ville de Montpellier parce que…', 1.5, [
        'la mairie met à disposition un chapiteau.',
        'la ville a déjà fait des projets dans ce sens.',
        'les habitants ont demandé de le faire venir.'
      ]),
      q('Le but du spectacle de l’Écocirque est de…', 1.5, [
        'sensibiliser à l’environnement.',
        'promouvoir de nouvelles technologies.',
        'faire venir plus de nouveaux spectateurs.'
      ]),
      q('Dans l’écocirque Bouglione, les numéros traditionnels seront…', 1, [
        'assurés par des artistes internationaux.',
        'retransmis en direct sur une plate-forme.',
        'accompagnés d’une musique enregistrée.'
      ]),
      q('Le cirque sera accompagné d’un écovillage qui…', 1, [
        'vend des spécialités locales.',
        'sert de logement aux employés du cirque.',
        'accueille les associations et les artisans locaux.'
      ]),
      q('André-Joseph Bouglione veut aller plus loin dans sa démarche écologique…', 1.5, [
        'en supprimant les déplacements.',
        'en se déplaçant uniquement en train.',
        'en travaillant seulement avec des artistes locaux.'
      ])
    ]
  };

  const OPINIONS = {
    title: 'La gentillesse, le secret pour bien travailler ?',
    intro: 'Un magazine a interrogé ses lecteurs à propos de la question « La gentillesse, le secret pour bien travailler ? ». Lisez les réponses des trois lecteurs ci-dessous.',
    people: [
      {
        name: 'Marie',
        text: 'La gentillesse au travail, je n’y crois pas ! Ce n’est pas une qualité essentielle pour bien travailler. Ce qui compte, c’est l’expérience professionnelle, les compétences et l’énergie. D’ailleurs, dans les faits, on voit bien que la gentillesse mène souvent à des situations problématiques. Je me rappelle, j’avais un collègue bien trop gentil qui finissait toujours par tout accepter et faire le travail des autres. Je pense donc au contraire qu’il faut être assez ferme, tout en restant poli, sur son lieu de travail. Je ne suis pas non plus tout à fait d’accord avec le fait de voir ses collègues en dehors du bureau, je ne mélange jamais ma vie privée et ma vie professionnelle.'
      },
      {
        name: 'Fatou',
        text: 'On connaît tous quelqu’un, que l’on travaille avec lui directement ou indirectement, qui a gravi les échelons rapidement alors qu’il est antipathique ! C’est le type de personne que l’on n’ose pas contrarier et qui a évolué très rapidement dans sa carrière, souvent en écrasant les autres sur son passage ! Les gens autour n’osent pas s’exprimer par peur de déplaire ou de mal faire. Ce qui permet à ce type de collègue de monter dans la hiérarchie sans que personne ne se mette en travers du chemin. Pourtant, moi, je crois au contraire que les collègues qui font preuve de gentillesse et à qui on peut s’adresser sans crainte sont ceux qui installent de meilleures conditions de travail. Ce sont eux qui devraient être reconnus et promus !'
      },
      {
        name: 'Babacar',
        text: 'En tant que manager, je veux que mon équipe fasse au mieux et qu’on travaille tous ensemble dans une bonne ambiance. Parfois, certaines tensions existent entre les membres d’une même équipe et mon rôle est d’écouter tout le monde pour être juste et équitable et pouvoir apaiser les choses. Pour cela, j’organise régulièrement des réunions où tout le monde est libre de s’exprimer, de donner son point de vue et de proposer des solutions. J’encourage l’interaction entre les gens, qui est la solution pour une bonne entente au travail. Pour moi, tout cela fait partie de la « gentillesse » que j’ai envie de transmettre à mon équipe.'
      }
    ]
  };

  const ECRIT_3 = {
    id: 'e3',
    number: 3,
    title: 'Comprendre le point de vue d’un locuteur francophone',
    points: 7,
    intro: 'À quelle personne associez-vous chaque point de vue ? Pour chaque affirmation, cochez la bonne réponse.',
    matching: true,
    text: OPINIONS,
    questions: [
      q('Il faut être capable d’écouter le point de vue des autres.', 1.5, ['Marie', 'Fatou', 'Babacar']),
      q('Être gentil peut amener une personne à travailler plus que ses collègues.', 1, ['Marie', 'Fatou', 'Babacar']),
      q('Les personnes bienveillantes devraient être celles qui évoluent dans leur carrière.', 1.5, ['Marie', 'Fatou', 'Babacar']),
      q('Le travail devrait être un espace où l’on ne craint pas d’imposer son point de vue.', 1, ['Marie', 'Fatou', 'Babacar']),
      q('Les échanges au travail encouragent une bonne ambiance.', 1, ['Marie', 'Fatou', 'Babacar']),
      q('Plus que l’attitude, ce qui compte au travail c’est ce que l’on sait faire.', 1, ['Marie', 'Fatou', 'Babacar'])
    ]
  };

  /* ---------- Partie 3 — production écrite ---------- */

  const ESSAY = {
    title: 'Production écrite',
    points: 25,
    minWords: 250,
    type: 'article',
    prompt: 'Vous habitez en France et vous êtes bénévole dans une association qui fait la promotion de la lecture chez les adolescents. Vous écrivez un article dans la revue de votre ville où vous expliquez pourquoi votre association existe. Vous demandez à ce qu’un espace soit mis à votre disposition pour recevoir les jeunes et organiser des activités. Vous exposez vos arguments de manière détaillée et cohérente en citant des exemples précis (250 mots).',
    note: 'Vous disposez d’une feuille entière pour réaliser l’épreuve de production écrite le jour de l’examen.'
  };

  /* ==========================================================
     Examen blanc n°2 — pistes 28, 29, 30
     ========================================================== */

  /* ---------- Partie 1 — compréhension de l'oral ---------- */

  const ORAL2_1 = {
    id: 'x1',
    number: 1,
    piste: 28,
    audio: 'delf_b2_ibk_28.mp3',
    plays: 'Vous allez écouter 2 fois un document.',
    instruction: 'Répondez aux questions en cochant la bonne réponse.',
    points: 9,
    questions: [
      q('Le projet de Ludivine pourra voir le jour grâce…', 1.5, [
        'au soutien de la ville de Tours.',
        'à l’aide d’un collectif de projets originaux.',
        'à la participation financière de donateurs.'
      ]),
      q('Qu’est-ce qui a donné naissance au projet de Ludivine ?', 1.5, [
        'Son envie de créer.',
        'Son esprit d’entreprise.',
        'Son sens de l’engagement.'
      ]),
      q('En quoi consiste le projet de Ludivine ?', 1.5, [
        'C’est un café avec des chats en liberté.',
        'C’est une association d’amoureux des chats.',
        'C’est un centre d’accueil pour les chats malades.'
      ]),
      q('Ludivine explique que son établissement pourra se financer grâce…', 1, [
        'à la générosité des visiteurs.',
        'aux associations de la région.',
        'à la vente de produits sur place.'
      ]),
      q('L’objectif final du projet de Ludivine est…', 1.5, [
        'que les gens adoptent des chats abandonnés.',
        'que les gens nourrissent les chats abandonnés.',
        'que les gens s’occupent de la santé des chats abandonnés.'
      ]),
      q('Concernant la réalisation de son projet, Ludivine est…', 1, [
        'peu enthousiaste.',
        'assez découragée.',
        'plutôt confiante.'
      ]),
      q('Face au projet de Ludivine, les habitants de Tours sont plutôt…', 1, [
        'intéressés.',
        'sceptiques.',
        'indifférents.'
      ])
    ]
  };

  const ORAL2_2 = {
    id: 'x2',
    number: 2,
    piste: 29,
    audio: 'delf_b2_ibk_29.mp3',
    plays: 'Vous allez écouter 2 fois un document.',
    instruction: 'Répondez aux questions en cochant la bonne réponse.',
    points: 9,
    questions: [
      q('L’aide financière dont il est question dans le reportage est une prime…', 1.5, [
        'que l’État va donner aux entreprises.',
        'que tous les députés veulent rendre obligatoire.',
        'que les entreprises peuvent donner à leurs employés.'
      ]),
      q('La prime dont le reportage parle est de…', 1, [
        '400 euros par an.',
        '500 euros par an.',
        '800 euros par an.'
      ]),
      q('Cette idée de prime fait partie de mesures pour…', 1, [
        'réduire la pollution.',
        'relancer l’économie.',
        'soutenir les entreprises.'
      ]),
      q('Pour bénéficier de cette aide, les salariés s’engagent à…', 1.5, [
        'acheter une voiture électrique.',
        'modifier leur mode de déplacement.',
        'faire plus d’efforts pour les entreprises.'
      ]),
      q('D’après le journaliste, la mesure d’aide vise prioritairement…', 1.5, [
        'les cyclistes.',
        'les automobilistes.',
        'les usagers des transports en commun.'
      ]),
      q('L’application de l’aide financière…', 1.5, [
        'évoluera dans le temps.',
        'sera la même dans tout le pays.',
        'variera selon les entreprises concernées.'
      ]),
      q('La prime pourra être attribuée aux salariés grâce à un système de…', 1, [
        'versement.',
        'carte prépayée.',
        'ticket restaurant.'
      ])
    ]
  };

  const ORAL2_3 = {
    id: 'x3',
    number: 3,
    piste: 30,
    audio: 'delf_b2_ibk_30.mp3',
    plays: 'Vous allez écouter 1 fois 3 documents.',
    instruction: 'Lisez les questions. Écoutez le document et répondez en cochant la bonne réponse.',
    points: 7,
    documents: [
      { number: 1, label: 'Document 1' },
      { number: 2, label: 'Document 2' },
      { number: 3, label: 'Document 3' }
    ],
    questions: [
      q('Quelle est la particularité des cours de français d’Odile ?', 1.5, [
        'Ils se déroulent sur Internet.',
        'Ses élèves participent à une radio.',
        'Elle crée ses propres documents audio.'
      ], { doc: 1 }),
      q('Qu’est-ce qui plaît le plus aux étudiants d’Odile ?', 1, [
        'Réaliser des interviews.',
        'Travailler de façon collective.',
        'Améliorer leurs compétences orales.'
      ], { doc: 1 }),
      q('Le reportage met en évidence…', 1, [
        'la mauvaise image du tourisme de masse sur Instagram.',
        'les conséquences négatives d’Instagram sur certains lieux.',
        'l’influence démesurée de certains instagrameurs sur les réseaux sociaux.'
      ], { doc: 2 }),
      q('Selon le reportage, de nos jours, certains vacanciers…', 1, [
        'publient trop de photos de leurs voyages sur les réseaux.',
        'voyagent dans le seul but de publier leurs photos sur les réseaux.',
        's’inspirent un peu des photos que les autres ont postées sur les réseaux.'
      ], { doc: 2 }),
      q('Selon l’Académie française, quel serait le risque d’utiliser trop de mots en anglais ?', 1, [
        'La mort de la langue française.',
        'L’émergence d’une nouvelle langue.',
        'La disparition de l’Académie française.'
      ], { doc: 3 }),
      q('Pourquoi le Québec est-il un exemple en matière de protection de la langue française ?', 1.5, [
        'L’anglais est interdit au travail.',
        'Les titres de films anglophones sont traduits.',
        'Les dictionnaires ne comportent pas d’anglicismes.'
      ], { doc: 3 })
    ]
  };

  const ECRIT2_1 = {
    id: 'x4',
    number: 1,
    title: 'Comprendre un texte informatif ou argumentatif',
    points: 9,
    intro: 'Vous lisez un entretien dans un journal francophone.',
    note: '1. École nationale supérieure des métiers de l’image et du son (France). 2. Réalisateur originaire du Burkina Faso. 3. Gagner peu, voire pas d’argent.',
    text: {
      title: 'Alain Gomis : « Le cinéma, c’est ma vie ! Pas le moyen de gagner ma vie. »',
      source: 'africultures.com',
      author: 'Entretien de Claude Forest',
      date: '7 août 2017',
      blocks: [
        { p: 'Le Franco-Sénégalais Alain Gomis est avant tout réalisateur (Félicité, 2017). […] Pour payer ses études de cinéma à La Sorbonne, après avoir échoué aux concours d’entrée à la Fémis et à Louis-Lumière (Paris), il devient surveillant dans les écoles. Avec ses premiers salaires il achète une caméra vidéo et commence à tourner des petits films. […]' },
        { h: 'Comment êtes-vous venu au cinéma ?' },
        { p: 'J’ai toujours aimé […] vivre les films comme si j’étais dedans. En troisième année de licence de cinéma, on n’avait pas de caméra ni de matériel, les cours étaient théoriques mais j’ai pu voir plein de films, et j’ai notamment passé beaucoup de temps à la cinémathèque. […]' },
        { p: '[…] J’ai toujours voulu réaliser, et quand je pensais être chef opérateur c’était dans l’optique de réaliser. Étudier le scénario c’était aussi dans l’optique de réaliser. Car pour moi le cinéma était une globalité et qu’il est difficile de devenir réalisateur sans connaître ce qui se passe autour. Mais finalement, je suis devenu directement réalisateur. […] J’ai appris en faisant.' },
        { h: 'Pourquoi avoir créé votre société de production ?' },
        { p: 'Par la force des choses. […] Mais j’ai eu de la chance, car après avoir écrit un premier scénario pour l’université, un ami gabonais me dit avoir des connexions avec Idrissa Ouedraogo, qui avait une société de production à Montreuil, et qu’on pourrait peut-être y faire notre stage. […] On arrive à faire le film dans des conditions un peu difficiles mais je me retrouve propulsé et ça devient presque facile ; certes j’ai dû me battre mais je trouve que j’ai eu de la chance par rapport à d’autres. À un moment la porte s’ouvre, on ne sait pas pourquoi.' },
        { h: 'Essentiellement producteur de vos films, comment définiriez-vous ce métier ?' },
        { p: 'Comme je produis davantage mes films que ceux des autres, le métier de producteur c’est d’essayer peut-être de comprendre, à la lecture du scénario ou du projet, vers qui aller, qui ça peut intéresser, quel genre de budget on peut obtenir, et ainsi inscrire le film dans une réalité économique. Il faut faire avec l’argent qui est là, c’est ce que j’ai appris. Au premier film je me suis aperçu qu’il y avait des éléments que je demandais que je n’obtiendrais pas, et donc dès le deuxième projet j’ai écrit en fonction d’une réalité économique. […]' },
        { h: 'Quelle est votre relation au public ?' },
        { p: '[…] J’essaye d’être le plus honnête, le plus sincère possible ; j’espère que ça touchera les gens, mais je ne le fais pas dans une volonté de séduction. Le cinéma c’est ma vie ! Ce n’est pas mon moyen de gagner ma vie, même si j’essaye d’en vivre aussi. […] J’ai fait Aujourd’hui en essayant d’être le plus direct, en cherchant une espèce d’authenticité, de vérité, et je l’ai d’abord destiné à un public populaire africain.' },
        { h: 'Comment cette démarche s’insère-t-elle dans votre métier de producteur ?' },
        { p: '[…] Je ne vis pas matériellement de mon métier de producteur, parce que sur mes films en général, je commence juste à coproduire, et que ça me prend un tel temps d’écrire et de faire mes films seul, qu’il est incompatible avec celui que je dois donner aux autres en tant que producteur. C’est très compliqué quand on a un réalisateur qui vient avec son projet, car il attend qu’on soit avec lui, qu’on le soutienne, etc. C’est pour ça que je coproduis très peu et que je ne gagne pas d’argent dessus, et quand je le fais c’est à perte. J’aimerais pouvoir le faire plus mais je veux être honnête avec ce que je peux faire. […] J’ai l’impression que beaucoup se rendent compte de la difficulté de réaliser des films en les faisant. C’est pour ça que quand des jeunes me disent « je veux faire du cinéma », la première chose que je leur dis c’est « Vous êtes sûr ? » parce que c’est très difficile, c’est un sport d’endurance et de combat. C’est très difficile d’allier les deux. Être combatif pendant aussi longtemps, c’est épuisant, tu ne gagnes pas un rond, il faut le faire pour des motivations profondes, sinon ce n’est pas la peine, c’est trop difficile. […]' },
      ]
    },
    questions: [
      q('Alain Gomis estime que, grâce à ses études de cinéma,…', 1.5, [
        'il a eu accès à du matériel.',
        'il a pu rencontrer des réalisateurs.',
        'il a perfectionné sa culture cinématographique.'
      ]),
      q('Alain Gomis a toujours voulu être…', 1, [
        'réalisateur.',
        'producteur.',
        'chef-opérateur.'
      ]),
      q('Alain Gomis considère que, globalement, dans son parcours, il a eu…', 1.5, [
        'des facilités.',
        'les bonnes relations.',
        'de belles opportunités.'
      ]),
      q('Quel est le conseil d’Alain Gomis en tant que producteur ?', 1.5, [
        'Écrire le film une fois les financements obtenus.',
        'Tout faire pour obtenir l’argent dont on a besoin.',
        'Adapter le budget du film en fonction des financements.'
      ]),
      q('Qu’est-ce qui guide Alain Gomis dans ce qu’il propose au public ?', 1.5, [
        'La volonté de séduire.',
        'Le désir d’authenticité.',
        'L’envie de vivre de son art.'
      ]),
      q('Quelle difficulté Alain Gomis rencontre-t-il en tant que producteur ? Le manque…', 1, [
        'de temps.',
        'de soutien.',
        'd’honnêteté.'
      ]),
      q('Son discours envers les jeunes qui veulent se tourner vers le cinéma est…', 1, [
        'réaliste.',
        'rassurant.',
        'encourageant.'
      ])
    ]
  };

  const ECRIT2_2 = {
    id: 'x5',
    number: 2,
    title: 'Comprendre un texte informatif ou argumentatif',
    points: 9,
    intro: 'Vous lisez un article dans un journal francophone.',
    note: '1. coup de barre : moment de fatigue. 2. farouche : cruelle, sauvage.',
    text: {
      title: 'La sieste au travail à travers le monde',
      source: 'welcometothejungle.com',
      author: 'Gabriel Boccara',
      date: '16 octobre 2018',
      blocks: [
        { p: 'Qui ne l’a jamais rencontré… le coup de barre après la pause déjeuner où l’on rêverait d’être dans son lit, rien que 5 minutes, pour reposer ses yeux ? Personne ! Peut-être avez-vous même déjà testé des techniques pour dormir, incognito, à votre bureau ? Dans certains pays, les salariés n’ont pas à se cacher de vouloir faire la sieste au travail, au contraire ! Les perceptions de la sieste diffèrent grandement selon la culture et peuvent nous révéler quelques indices sur la mentalité de chaque pays au travail…' },
        { h: 'Historique de la sieste' },
        { p: 'La sieste a toujours fait partie intégrante de la vie de nos ancêtres, que ce soit à l’époque des hommes des cavernes ou des philosophes des Lumières. Ce n’est qu’à partir de la révolution industrielle (entre le XVIIIe et le XIXe siècle) et de l’urbanisation de la population qu’elle a été abandonnée : les chaleurs de mi-journée étant plus supportables en intérieur qu’au milieu d’un champ et le travail à la chaîne nécessitant une présence constante des ouvriers, il est vite devenu inapproprié de s’endormir au travail.' },
        { p: 'Pourtant, la sieste n’a pas dit son dernier mot et fait son grand retour sur nos lieux de travail, en tant que facilitateur de bien-être, bien sûr, mais aussi en tant qu’outil de performance. En effet, il a été prouvé par la Nasa qu’une sieste de 15 minutes a des effets considérables sur notre vigilance, notre humeur et notre mémoire, augmentant ainsi nos performances cognitives de manière générale et réduisant nos risques de maladies cardiovasculaires de 37 % d’après la Harvard Medical School. Si ses bienfaits ne sont plus à prouver, chaque culture a néanmoins sa propre perception de la sieste… […]' },
        { h: 'France : la sieste, de plus en plus acceptée' },
        { p: 'En France, la sieste en entreprise est acceptée dans la plupart des start-up et des entreprises technologiques, où le turnover est très important et donc la qualité de vie au travail aussi. Mais dans les métiers de la finance, de la grande distribution ou encore de l’industrie, la sieste aura encore beaucoup à prouver, avant d’être finalement tolérée.' },
        { p: 'D’après un sondage OpinionWay datant de 2016, 12 % des managers seraient pour la pratique de la sieste à la pause. Ces dernières années ont été le théâtre d’une véritable prise de conscience autour du bien-être en entreprise… Une tendance générale devenue difficile à ignorer dans un contexte où la course aux talents se fait de plus en plus farouche ? Parmi les composantes de cette tendance, on retrouve toujours la qualité de sommeil car elle impacte l’ensemble de nos capacités cognitives. Le moment idéal pour la sieste de pointer de nouveau le bout de son nez et de rappeler qu’elle est bien plus qu’un luxe : elle est une nécessité, surtout en entreprise.' }
      ]
    },
    questions: [
      q('Selon l’article, qu’est-ce qui influence la perception qu’un pays a de la sieste ?', 1, [
        'Sa culture.',
        'Son climat.',
        'Ses horaires.'
      ]),
      q('Au cours de l’histoire, qu’est-ce qui a contribué à la disparition de la sieste ?', 1, [
        'L’industrialisation.',
        'La réduction des horaires.',
        'Les changements climatiques.'
      ]),
      q('Selon l’article, la Harvard Medical School a prouvé que la sieste au travail…', 1.5, [
        'avait des effets positifs sur notre santé.',
        'augmentait notre sensation de bien-être.',
        'facilitait les échanges dans les entreprises.'
      ]),
      q('D’après l’article, en France, la sieste est plus acceptée dans les start-up que dans d’autres secteurs, car…', 1.5, [
        'elles ont une culture d’entreprise différente.',
        'elles veulent que leurs salariés se sentent bien.',
        'elles sont dirigées par des managers plus tolérants.'
      ]),
      q('Selon l’article, dans le secteur de l’industrie et de la finance, la sieste…', 1.5, [
        'n’est pas considérée efficace.',
        'ne convainc pas les dirigeants.',
        'n’intéresse pas les travailleurs.'
      ]),
      q('D’après l’article, quelle est la tendance générale dans le monde de l’entreprise ?', 1.5, [
        'Le confort des salariés.',
        'La rapidité des salariés.',
        'La rentabilité des salariés.'
      ]),
      q('L’article conclut sur le fait que la sieste est…', 1, [
        'un fait culturel.',
        'un besoin humain.',
        'un caprice au travail.'
      ])
    ]
  };

  const CINE_COMMENTS = {
    title: 'Plate-formes ou salles de cinéma ?',
    intro: 'Après avoir lu, sur Internet, l’article « Plate-formes ou salles de ciné ? », trois lecteurs réagissent et envoient des commentaires. Lisez les réponses des trois lecteurs ci-dessous.',
    people: [
      {
        name: 'Asma',
        text: 'Moi, c’est simple, je ne vois pas pourquoi on devrait payer une place de cinéma le même prix qu’un abonnement à une plate-forme qui diffuse des films et séries télé ! Je trouve que, maintenant, les places de ciné sont hors de prix. Et, en plus, question confort, c’est pas l’idéal d’être assise à côté de quelqu’un qui mange des pop-corn ou d’avoir quelqu’un devant qui me cache la moitié de l’écran, merci bien ! Quand je suis sur mon ordi, je choisis le film que je veux voir, je le regarde quand j’ai envie, et surtout je suis à l’aise ! Je peux mettre pause, grignoter, etc. Pour moi, c’est l’idéal.'
      },
      {
        name: 'Julie',
        text: 'J’ai toujours été une grande fan de cinéma ! Je tiens ça de ma mère, qui m’a emmenée dans les salles obscures dès que j’étais en âge de l’accompagner. Quand j’étais petite, je me souviens de l’excitation que je ressentais à l’idée d’aller voir le dernier Disney ! Cette excitation est intacte, je surveille de près l’actualité ciné et, dès qu’un film me plaît, je vais le voir aussitôt ! J’ai souscrit à un abonnement dans un petit cinéma indépendant de mon quartier, du coup j’y vais au moins six fois par mois ! Avec des amis ou toute seule, peu importe, j’y vais avant tout pour voir le film. Je suis un peu inquiète de la popularité des plate-formes telles que Netflix, mais je suis sûre que le cinéma a encore de beaux jours devant lui !'
      },
      {
        name: 'Antoine',
        text: 'Je crois que les plate-formes sont en train de marquer la fin des salles de cinéma. Je suis assez pessimiste, à vrai dire. Quand on voit que, maintenant, des grosses maisons de production lancent de nouvelles sorties uniquement en ligne et plus du tout dans les salles de cinéma, on a de quoi s’inquiéter ! Mais bon, moi aussi je me suis abonné à Netflix, c’est tellement pratique et avantageux financièrement ! Comment concurrencer ces nouveaux géants d’Internet ? Alors, du coup, moi, ce que je fais c’est que de temps en temps je vais au cinéma pour soutenir les petits films d’auteurs. Les grosses productions, je pense qu’elles s’en sortiront toujours. Mais les petits films d’auteurs, il faut les aider !'
      }
    ]
  };

  const ECRIT2_3 = {
    id: 'x6',
    number: 3,
    title: 'Comprendre le point de vue d’un locuteur francophone',
    points: 7,
    intro: 'À quelle personne associez-vous chaque point de vue ? Pour chaque affirmation, cochez la bonne réponse.',
    matching: true,
    text: CINE_COMMENTS,
    questions: [
      q('Le problème du cinéma, c’est que le coût des places est trop élevé…', 1.5, ['Asma', 'Julie', 'Antoine']),
      q('Certains films méritent d’être vus au cinéma car ils ont plus besoin de spectateurs que d’autres.', 1.5, ['Asma', 'Julie', 'Antoine']),
      q('Aller au cinéma procure des sensations uniques.', 1, ['Asma', 'Julie', 'Antoine']),
      q('Les plate-formes mettent gravement en danger l’avenir des salles de cinéma.', 1, ['Asma', 'Julie', 'Antoine']),
      q('Les salles de cinéma ont des inconvénients que les plate-formes n’ont pas.', 1, ['Asma', 'Julie', 'Antoine']),
      q('Les formules d’abonnement dans des salles de quartier permettent d’aller souvent au cinéma.', 1, ['Asma', 'Julie', 'Antoine'])
    ]
  };

  /* ---------- Partie 3 — production écrite ---------- */

  const ESSAY2 = {
    title: 'Production écrite',
    points: 25,
    minWords: 250,
    type: 'letter',
    prompt: 'Vous avez voyagé en France le mois dernier et votre train a subi un retard d’une heure. Arrivé à la gare, vous avez raté le bus qui devait vous conduire à votre hôtel. Vous avez donc dû prendre un taxi et cela vous a coûté 80 euros. Vous écrivez une lettre à la société de train française pour expliquer les faits et réclamer le remboursement de votre billet et la prise en charge du paiement de votre taxi (250 mots).',
    note: 'Vous disposez d’une feuille entière pour réaliser l’épreuve de production écrite le jour de l’examen.'
  };

  const EXAMS = [{
    id: 'blanc-1',
    number: 1,
    level: 'DELF B2',
    title: 'Examen blanc n°1',
    subtitle: 'Épreuve complète : oral, écrits et production écrite',
    folder: 'exam/No.1/',
    hours: 24,
    parts: [
      {
        id: 'oral',
        title: 'Compréhension de l’oral',
        points: 25,
        exercises: [ORAL_1, ORAL_2, ORAL_3]
      },
      {
        id: 'ecrit',
        title: 'Compréhension des écrits',
        points: 25,
        exercises: [ECRIT_1, ECRIT_2, ECRIT_3]
      },
      {
        id: 'production',
        title: 'Production écrite',
        points: 25,
        essay: ESSAY
      }
    ]
  }, {
    id: 'blanc-2',
    number: 2,
    level: 'DELF B2',
    title: 'Examen blanc n°2',
    subtitle: 'Épreuve complète : oral, écrits et production écrite',
    folder: 'exam/No.2/',
    hours: 24,
    parts: [
      {
        id: 'oral',
        title: 'Compréhension de l’oral',
        points: 25,
        exercises: [ORAL2_1, ORAL2_2, ORAL2_3]
      },
      {
        id: 'ecrit',
        title: 'Compréhension des écrits',
        points: 25,
        exercises: [ECRIT2_1, ECRIT2_2, ECRIT2_3]
      },
      {
        id: 'production',
        title: 'Production écrite',
        points: 25,
        essay: ESSAY2
      }
    ]
  }];

  /* ---------- Normalisation: ids, audio paths, totals ---------- */

  function pisteFrom(file) {
    const m = String(file || '').match(/(\d+)(?=\.mp3$)/i);
    return m ? Number(m[1]) : null;
  }

  EXAMS.forEach(function (exam) {
    let total = 0;
    exam.parts.forEach(function (part) {
      let partPoints = 0;
      (part.exercises || []).forEach(function (ex) {
        ex.audio = ex.audio || '';
        ex.src = exam.folder + ex.audio;
        ex.piste = ex.piste || pisteFrom(ex.audio);
        let sum = 0;
        ex.questions.forEach(function (question, i) {
          question.id = ex.id + 'q' + (i + 1);
          question.n = i + 1;
          question.options = question.options.map(function (label, k) {
            return { id: ex.id + 'q' + (i + 1) + 'o' + (k + 1), label: label };
          });
          sum += question.points;
        });
        ex.total = Math.round(sum * 10) / 10;
        partPoints += ex.total;
      });
      part.points = Math.round(partPoints * 10) / 10 || part.points;
      total += part.points;
    });
    exam.points = Math.round(total * 10) / 10;
    exam.questionCount = exam.parts.reduce(function (n, part) {
      return n + (part.exercises || []).reduce(function (m, ex) { return m + ex.questions.length; }, 0);
    }, 0);
  });

  const byId = {};
  EXAMS.forEach(function (exam) { byId[exam.id] = exam; });

  global.ExamData = {
    list: EXAMS,
    byId: byId,
    defaultId: EXAMS[0] && EXAMS[0].id,
    pisteFrom: pisteFrom
  };
})(typeof window !== 'undefined' ? window : globalThis);
