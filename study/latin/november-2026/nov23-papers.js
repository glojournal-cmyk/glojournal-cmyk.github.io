// Source: six user-uploaded Year 9 Latin QA-revised DOCX files, 20 Nov 2026.
// Independent school-style practice, not TGS-issued assessments.
// Each paper: 50 minutes, A 11 + B 14 + C 50 = 75 marks.
export const NOV23_PAPERS=[
 {
  "id": "mock-1",
  "title": "Mock 1 · The Warning at the Temple",
  "label": "Core mock",
  "description": "Original 75-mark Year 9 assessment practice",
  "glossary": [
   [
    "olim",
    "once, formerly"
   ],
   [
    "duobus",
    "two (ablative plural)"
   ],
   [
    "autem",
    "however, but"
   ],
   [
    "omnes",
    "all, everyone"
   ],
   [
    "duas horas",
    "for two hours"
   ],
   [
    "deis",
    "to the gods"
   ]
  ],
  "A": [
   {
    "prompt": "The girls were carrying water.",
    "marks": 3,
    "model": "puellae aquam portabant.",
    "units": [
     "puellae — girls, nominative plural",
     "aquam — water, accusative singular",
     "portabant — were carrying, imperfect third-person plural"
    ]
   },
   {
    "prompt": "He cannot read the letter.",
    "marks": 2,
    "model": "epistulam legere non potest.",
    "units": [
     "epistulam — letter, accusative singular",
     "legere non potest — cannot read; infinitive with present third-person singular"
    ]
   },
   {
    "prompt": "The slaves were giving gifts to the girl.",
    "marks": 4,
    "model": "servi dona puellae dabant.",
    "units": [
     "servi — slaves, nominative plural",
     "dona — gifts, accusative neuter plural",
     "puellae — to the girl, dative singular",
     "dabant — were giving, imperfect third-person plural"
    ]
   },
   {
    "prompt": "We are sailing to the island.",
    "marks": 2,
    "model": "ad insulam navigamus.",
    "units": [
     "ad insulam — to the island, ad + accusative",
     "navigamus — we sail / are sailing, present first-person plural"
    ]
   }
  ],
  "Bpassage": "nuntius cum servis ad villam domini festinabat. in villa pueri erant. nuntius epistulam portabat, sed epistulam dominae dare non poterat: puellae in horto laborabant et domina in templo erat. tandem nuntius ad templum advenit. domina laeta erat, sed nuntius miser erat. “epistulam da!” domina clamavit. nuntius epistulam dedit. domina epistulam legit et servos ad villam misit.",
  "B": [
   {
    "prompt": "Where was the messenger hurrying, and who was accompanying him?",
    "marks": 2,
    "model": "To the master's house/villa, with the slaves.",
    "units": [
     "To the master's house / villa",
     "With the slaves"
    ]
   },
   {
    "prompt": "What was the messenger carrying?",
    "marks": 1,
    "model": "A letter.",
    "units": [
     "A letter"
    ]
   },
   {
    "prompt": "State TWO things the passage tells us about the girls.",
    "marks": 2,
    "model": "They were in the garden and were working.",
    "units": [
     "They were in the garden",
     "They were working"
    ]
   },
   {
    "prompt": "Why could the messenger not give the letter to the mistress immediately?",
    "marks": 1,
    "model": "The mistress was in the temple.",
    "units": [
     "The mistress was in the temple"
    ]
   },
   {
    "prompt": "Translate into English: domina laeta erat, sed nuntius miser erat.",
    "marks": 2,
    "model": "The mistress was happy, but the messenger was miserable.",
    "units": [
     "The mistress was happy",
     "But the messenger was unhappy / miserable"
    ]
   },
   {
    "prompt": "What command did the mistress give?",
    "marks": 1,
    "model": "Give (me) the letter!",
    "units": [
     "Give (me) the letter!"
    ]
   },
   {
    "prompt": "What did the mistress do with the letter, and where did she then send the slaves?",
    "marks": 2,
    "model": "She read the letter and sent the slaves to the villa.",
    "units": [
     "She read the letter",
     "She sent the slaves to the house / villa"
    ]
   },
   {
    "prompt": "Give the tense of festinabat and misit; then give the case and number of servos.",
    "marks": 3,
    "model": "festinabat = imperfect; misit = perfect; servos = accusative plural.",
    "units": [
     "festinabat — imperfect",
     "misit — perfect",
     "servos — accusative plural"
    ]
   }
  ],
  "C": [
   {
    "latin": "olim dominus cum duobus servis Roma ad parvam insulam navigabat. in insula templum pulchrum et parvae villae erant. dominus dona deis portabat, sed servi periculum timebant.",
    "model": "Once a master was sailing from Rome with two slaves to a small island. On the island there was a beautiful temple and there were small houses. The master was carrying gifts to the gods, but the slaves feared danger.",
    "units": [
     [
      "olim",
      "once"
     ],
     [
      "dominus … navigabat",
      "the master was sailing / used to sail"
     ],
     [
      "cum duobus servis",
      "with two slaves"
     ],
     [
      "Roma",
      "from Rome"
     ],
     [
      "ad parvam insulam",
      "to a small island"
     ],
     [
      "in insula",
      "on the island"
     ],
     [
      "templum pulchrum",
      "a beautiful temple"
     ],
     [
      "et parvae villae erant",
      "and there were small houses"
     ],
     [
      "dominus dona deis portabat",
      "the master was carrying gifts to the gods"
     ],
     [
      "sed servi periculum timebant",
      "but the slaves feared danger"
     ]
    ]
   },
   {
    "latin": "subito puella ad templum cucurrit. “domine, nautae mali insulam oppugnant!” clamavit. dominus puellam audivit et servos vocavit. “templum custodite! puellam ad villam domini ducite!”",
    "model": "Suddenly a girl ran to the temple. “Master, the bad sailors are attacking the island!” she shouted. The master heard the girl and called the slaves. “Guard the temple! Lead the girl to the master’s house!”",
    "units": [
     [
      "subito",
      "suddenly"
     ],
     [
      "puella … cucurrit",
      "a girl ran"
     ],
     [
      "ad templum",
      "to the temple"
     ],
     [
      "domine",
      "Master! (direct address)"
     ],
     [
      "nautae mali",
      "the bad / evil sailors"
     ],
     [
      "insulam oppugnant",
      "are attacking the island"
     ],
     [
      "clamavit",
      "she shouted"
     ],
     [
      "dominus puellam audivit et servos vocavit",
      "the master heard the girl and called the slaves"
     ],
     [
      "templum custodite",
      "guard the temple (plural command)"
     ],
     [
      "puellam ad villam domini ducite",
      "lead the girl to the master's house (plural command)"
     ]
    ]
   },
   {
    "latin": "servi puellam ad villam duxerunt, sed nautae per forum festinaverunt. in horto ancillae et pueri erant. ancillae aquam portabant; pueri autem arma quaerebant. omnes diu laborabant.",
    "model": "The slaves led the girl to the house, but the sailors hurried through the forum. In the garden there were slave-women and boys. The slave-women were carrying water; however, the boys were looking for weapons. Everyone worked for a long time.",
    "units": [
     [
      "servi puellam duxerunt",
      "the slaves led the girl"
     ],
     [
      "ad villam",
      "to the house"
     ],
     [
      "sed nautae festinaverunt",
      "but the sailors hurried"
     ],
     [
      "per forum",
      "through the forum"
     ],
     [
      "in horto",
      "in the garden"
     ],
     [
      "ancillae et pueri erant",
      "there were slave-women and boys"
     ],
     [
      "ancillae aquam portabant",
      "the slave-women were carrying water"
     ],
     [
      "pueri autem",
      "but / however the boys"
     ],
     [
      "arma quaerebant",
      "were looking for weapons"
     ],
     [
      "omnes diu laborabant",
      "everyone was working for a long time"
     ]
    ]
   },
   {
    "latin": "dominus in templo mansit. servos videre non poterat, sed auxilium quaerere poterat. epistulam scripsit et nuntium ad villam misit. nuntius duas horas ambulavit.",
    "model": "The master stayed in the temple. He could not see the slaves, but he could seek help. He wrote a letter and sent a messenger to the house. The messenger walked for two hours.",
    "units": [
     [
      "dominus",
      "the master"
     ],
     [
      "in templo mansit",
      "stayed in the temple"
     ],
     [
      "servos",
      "the slaves (direct object)"
     ],
     [
      "videre non poterat",
      "he could not see"
     ],
     [
      "sed",
      "but"
     ],
     [
      "auxilium quaerere poterat",
      "he could seek help"
     ],
     [
      "epistulam scripsit",
      "he wrote a letter"
     ],
     [
      "et nuntium misit",
      "and sent a messenger"
     ],
     [
      "ad villam",
      "to the villa / house"
     ],
     [
      "nuntius duas horas ambulavit",
      "the messenger walked for two hours"
     ]
    ]
   },
   {
    "latin": "tandem nuntius ad villam advenit. pueri epistulam legerunt et ad templum cucurrerunt. nautae pueros viderunt et discesserunt. dominus laetus erat. “amici boni insulam custodiverunt!” clamavit.",
    "model": "At last the messenger arrived at the house. The boys read the letter and ran to the temple. The sailors saw the boys and left. The master was happy. “Good friends have guarded the island!” he shouted.",
    "units": [
     [
      "tandem",
      "at last"
     ],
     [
      "nuntius advenit",
      "the messenger arrived"
     ],
     [
      "ad villam",
      "at / to the house"
     ],
     [
      "pueri epistulam legerunt",
      "the boys read the letter (past)"
     ],
     [
      "et ad templum cucurrerunt",
      "and ran to the temple"
     ],
     [
      "nautae pueros viderunt",
      "the sailors saw the boys"
     ],
     [
      "et discesserunt",
      "and left / departed"
     ],
     [
      "dominus laetus erat",
      "the master was happy"
     ],
     [
      "amici boni insulam custodiverunt",
      "good friends guarded / have guarded the island"
     ],
     [
      "clamavit",
      "he shouted"
     ]
    ]
   }
  ]
 },
 {
  "id": "mock-2",
  "title": "Mock 2 · The Lost Letter",
  "label": "Challenge",
  "description": "A slightly more difficult 75-mark practice",
  "A": [
   {
    "prompt": "The messenger was giving a letter to the boys.",
    "marks": 4,
    "model": "nuntius epistulam pueris dabat.",
    "units": [
     "nuntius — messenger, nominative singular",
     "epistulam — letter, accusative singular",
     "pueris — to the boys, dative plural",
     "dabat — was giving, imperfect third-person singular"
    ]
   },
   {
    "prompt": "We cannot find the swords.",
    "marks": 2,
    "model": "gladios invenire non possumus.",
    "units": [
     "gladios — swords, accusative plural",
     "invenire non possumus — cannot find, infinitive + negative present first-person plural"
    ]
   },
   {
    "prompt": "The slaves were working for five hours.",
    "marks": 3,
    "model": "servi quinque horas laborabant.",
    "units": [
     "servi — slaves, nominative plural",
     "quinque horas — for five hours, accusative of duration",
     "laborabant — were working, imperfect third-person plural"
    ]
   },
   {
    "prompt": "You (plural) are warning the girl.",
    "marks": 2,
    "model": "puellam monetis.",
    "units": [
     "puellam — girl, accusative singular",
     "monetis — you (plural) warn / are warning, present second-person plural"
    ]
   }
  ],
  "Bpassage": "in villa domini pueri et ancillae habitabant. domina servos ad forum misit. servi per viam festinaverunt, sed in foro nautas malos viderunt. nautae gladios portabant et viros terrebant. servi nuntium vocaverunt. “dominam monere debes!” clamaverunt. nuntius ad villam cucurrit, sed dominam invenire non poterat: domina in templo erat. deinde nuntius ad templum festinavit. domina nuntium audivit et ad villam cucurrit. “pueri, in horto manete!” clamavit.",
  "B": [
   {
    "prompt": "Where did the boys and slave-women live?",
    "marks": 1,
    "model": "In the master's house / villa.",
    "units": [
     "In the master's house / villa"
    ]
   },
   {
    "prompt": "Whom did the mistress send, and where did she send them?",
    "marks": 2,
    "model": "The slaves; to the forum / marketplace.",
    "units": [
     "The slaves",
     "To the forum / marketplace"
    ]
   },
   {
    "prompt": "Who did the slaves see in the forum? Give both the people and their description.",
    "marks": 2,
    "model": "Bad / evil sailors.",
    "units": [
     "Sailors",
     "Bad / evil"
    ]
   },
   {
    "prompt": "State TWO things that the sailors were doing.",
    "marks": 2,
    "model": "They were carrying swords and frightening men.",
    "units": [
     "Carrying swords",
     "Frightening men"
    ]
   },
   {
    "prompt": "Translate into English: “dominam monere debes!”",
    "marks": 2,
    "model": "You must / should warn the mistress.",
    "units": [
     "You must / should",
     "Warn the mistress"
    ]
   },
   {
    "prompt": "Why could the messenger not find the mistress at the villa?",
    "marks": 1,
    "model": "She was at the temple.",
    "units": [
     "At the temple"
    ]
   },
   {
    "prompt": "Give the PERSON and NUMBER of the verb debes.",
    "marks": 2,
    "model": "Second person; singular.",
    "units": [
     "Second person",
     "Singular"
    ]
   },
   {
    "prompt": "What command did the mistress give to the boys?",
    "marks": 1,
    "model": "Stay in the garden!",
    "units": [
     "Stay / remain in the garden"
    ]
   },
   {
    "prompt": "Give the CASE and NUMBER of nautas in nautas malos viderunt.",
    "marks": 1,
    "model": "Accusative plural.",
    "units": [
     "Accusative plural (both required)"
    ]
   }
  ],
  "C": [
   {
    "latin": "Romae dominus bonus magnam cenam parabat. ad cenam amicos invitavit et servis dona dedit. nuntius epistulam ad amicum domini portabat, sed per viam festinare non poterat: equus miser in agro manebat.",
    "model": "In Rome a good master was preparing a large dinner. He invited friends to dinner and gave gifts to the slaves. A messenger was carrying a letter to the master's friend, but he could not hurry along the road: a miserable horse was staying in the field.",
    "units": [
     [
      "Romae",
      "in / at Rome"
     ],
     [
      "dominus bonus",
      "the good master"
     ],
     [
      "magnam cenam parabat",
      "was preparing a large dinner"
     ],
     [
      "ad cenam",
      "to dinner / for the meal"
     ],
     [
      "amicos invitavit",
      "invited friends"
     ],
     [
      "servis dona dedit",
      "gave gifts to the slaves"
     ],
     [
      "nuntius epistulam portabat",
      "a messenger was carrying a letter"
     ],
     [
      "ad amicum domini",
      "to the master's friend"
     ],
     [
      "sed per viam festinare non poterat",
      "but he could not hurry along the road"
     ],
     [
      "equus miser in agro manebat",
      "the miserable horse remained / was staying in the field"
     ]
    ]
   },
   {
    "latin": "subito puella per agrum cucurrit. epistulam in via vidit: epistula nuntii erat. puella nuntium vocavit, sed nuntius puellam audire non poterat. “amice, epistulam domini habeo!” clamavit. nuntius tandem ad puellam advenit.",
    "model": "Suddenly a girl ran through the field. She saw a letter on the road: it was the messenger's letter. The girl called the messenger, but he could not hear her. “Friend, I have the master's letter!” she shouted. At last the messenger reached the girl.",
    "units": [
     [
      "subito",
      "suddenly"
     ],
     [
      "puella per agrum cucurrit",
      "a girl ran through the field"
     ],
     [
      "epistulam in via vidit",
      "she saw a letter in / on the road"
     ],
     [
      "epistula nuntii erat",
      "the letter was the messenger's"
     ],
     [
      "puella nuntium vocavit",
      "the girl called the messenger"
     ],
     [
      "sed nuntius puellam audire non poterat",
      "but the messenger could not hear the girl"
     ],
     [
      "amice",
      "Friend! (vocative singular)"
     ],
     [
      "epistulam domini habeo",
      "I have the master's letter"
     ],
     [
      "clamavit",
      "she shouted"
     ],
     [
      "nuntius tandem ad puellam advenit",
      "at last the messenger arrived at / reached the girl"
     ]
    ]
   },
   {
    "latin": "puella epistulam nuntio dedit. nuntius laetus erat, sed verba epistulae legere non poterat. puella verba legebat et nuntio consilium dedit. “ad amicum domini festina et epistulam da!” inquit. nuntius consilium puellae audivit.",
    "model": "The girl gave the letter to the messenger. He was happy, but he could not read the words of the letter. The girl was reading the words and gave the messenger some advice. “Hurry to the master's friend and give him the letter!” she said. The messenger listened to the girl's advice.",
    "units": [
     [
      "puella epistulam nuntio dedit",
      "the girl gave the letter to the messenger"
     ],
     [
      "nuntius laetus erat",
      "the messenger was happy"
     ],
     [
      "sed verba epistulae",
      "but the words of the letter"
     ],
     [
      "legere non poterat",
      "he could not read"
     ],
     [
      "puella verba legebat",
      "the girl was reading the words"
     ],
     [
      "et nuntio consilium dedit",
      "and gave advice / a plan to the messenger"
     ],
     [
      "ad amicum domini festina",
      "hurry to the master's friend (singular command)"
     ],
     [
      "et epistulam da",
      "and give [him] the letter (singular command)"
     ],
     [
      "inquit",
      "she said"
     ],
     [
      "nuntius consilium puellae audivit",
      "the messenger heard the girl's advice"
     ]
    ]
   },
   {
    "latin": "nuntius ad villam amici ambulavit. quinque horas per viam festinabat, sed equus in agro manebat. tandem villam pulchram vidit. “amice, epistulam domini porto!” clamavit. amicus epistulam legebat et laetus erat.",
    "model": "The messenger walked to the friend's house. He was hurrying along the road for five hours, but the horse stayed in the field. At last he saw a beautiful house. “Friend, I am carrying the master's letter!” he shouted. The friend was reading the letter and was happy.",
    "units": [
     [
      "nuntius ad villam amici ambulavit",
      "the messenger walked to the friend's house"
     ],
     [
      "quinque horas",
      "for five hours (duration)"
     ],
     [
      "per viam festinabat",
      "he was hurrying along the road"
     ],
     [
      "sed equus in agro manebat",
      "but the horse was staying in the field"
     ],
     [
      "tandem villam pulchram vidit",
      "at last he saw a beautiful house"
     ],
     [
      "amice",
      "Friend! (vocative singular)"
     ],
     [
      "epistulam domini",
      "the master's letter"
     ],
     [
      "porto",
      "I am carrying / I carry"
     ],
     [
      "clamavit",
      "he shouted"
     ],
     [
      "amicus epistulam legebat et laetus erat",
      "the friend was reading the letter and was happy"
     ]
    ]
   },
   {
    "latin": "amicus epistulam legebat et consilium habebat. nuntio dona dedit; deinde Romam festinavit. nuntius cum amico ad villam domini advenit. dominus laetus erat: ancillae cenam parabant, servi amicos salutabant, puellae vinum portabant et pueri dona quaerebant.",
    "model": "The friend was reading the letter and had a plan. He gave gifts to the messenger; then he hurried to Rome. The messenger arrived at the master's house with the friend. The master was happy: the slave-women were preparing dinner, the slaves were greeting the friends, the girls were carrying wine and the boys were looking for gifts.",
    "units": [
     [
      "amicus epistulam legebat et consilium habebat",
      "the friend was reading the letter and had a plan"
     ],
     [
      "nuntio dona dedit",
      "he gave gifts to the messenger"
     ],
     [
      "deinde Romam festinavit",
      "then he hurried to Rome"
     ],
     [
      "nuntius cum amico",
      "the messenger with the friend"
     ],
     [
      "ad villam domini advenit",
      "arrived at the master's house"
     ],
     [
      "dominus laetus erat",
      "the master was happy"
     ],
     [
      "ancillae cenam parabant",
      "the slave-women were preparing dinner"
     ],
     [
      "servi amicos salutabant",
      "the slaves were greeting the friends"
     ],
     [
      "puellae vinum portabant",
      "the girls were carrying wine"
     ],
     [
      "pueri dona quaerebant",
      "the boys were looking for gifts"
     ]
    ]
   }
  ]
 },
 {
  "id": "mock-3",
  "title": "Mock 3 · The Alarm at the Gate",
  "label": "Higher challenge",
  "description": "Harder forms, cases and tense switches; no extra syllabus",
  "A": [
   {
    "prompt": "The boys were not able to find the messenger in the garden.",
    "marks": 4,
    "model": "pueri nuntium in horto invenire non poterant.",
    "units": [
     "pueri — boys, nominative plural",
     "nuntium — messenger, accusative singular",
     "in horto — in the garden, in + ablative",
     "invenire non poterant — could not find, infinitive + imperfect third-person plural"
    ]
   },
   {
    "prompt": "You (plural) are giving water to the women.",
    "marks": 3,
    "model": "feminis aquam datis.",
    "units": [
     "feminis — to the women, dative plural",
     "aquam — water, accusative singular",
     "datis — you (plural) are giving, present second-person plural"
    ]
   },
   {
    "prompt": "For ten hours the slave-women were guarding the gate.",
    "marks": 4,
    "model": "ancillae decem horas portam custodiebant.",
    "units": [
     "ancillae — slave-women, nominative plural",
     "decem horas — for ten hours, duration accusative",
     "portam — gate, accusative singular",
     "custodiebant — were guarding, imperfect third-person plural"
    ]
   }
  ],
  "Bpassage": "nautae in insula parva habitabant. feminae nautas in foro quaerebant, sed nautae ad templum festinaverunt. ibi servum iratum viderunt. servus epistulam domini portabat, sed verba epistulae legere non poterat. pueri cum servo erant. “pueri, epistulam ad dominam portate!” inquit servus. pueri verba servi audiverunt. deinde per forum cucurrerunt et dominam in horto invenerunt. domina epistulam legebat, sed laeta non erat. “servi in periculo sunt,” inquit, “nautae malos viros viderunt.” domina pueros ad villam misit.",
  "B": [
   {
    "prompt": "Where did the sailors live?",
    "marks": 1,
    "model": "On a small island.",
    "units": [
     "On an island (a small island)"
    ]
   },
   {
    "prompt": "What were the women looking for, and where were they looking?",
    "marks": 2,
    "model": "The sailors, in the forum.",
    "units": [
     "Sailors",
     "In the forum / marketplace"
    ]
   },
   {
    "prompt": "Where did the sailors hurry?",
    "marks": 1,
    "model": "To the temple.",
    "units": [
     "To the temple"
    ]
   },
   {
    "prompt": "Identify and describe the person the sailors saw there.",
    "marks": 2,
    "model": "An angry slave.",
    "units": [
     "A slave",
     "Angry"
    ]
   },
   {
    "prompt": "Who owned the letter, and was the slave able to read its words?",
    "marks": 2,
    "model": "The master; the slave could not read its words.",
    "units": [
     "The master owned the letter",
     "The slave could not read its words"
    ]
   },
   {
    "prompt": "Translate: “pueri, epistulam ad dominam portate!”",
    "marks": 2,
    "model": "Boys, carry the letter to the mistress!",
    "units": [
     "Boys! (direct address)",
     "Carry the letter to the mistress (plural command)"
    ]
   },
   {
    "prompt": "How did the boys travel to the mistress, and where did they find her?",
    "marks": 2,
    "model": "They ran through the forum and found her in the garden.",
    "units": [
     "They ran",
     "In the garden"
    ]
   },
   {
    "prompt": "State the CASE and NUMBER of domini in epistulam domini.",
    "marks": 1,
    "model": "Genitive singular.",
    "units": [
     "Genitive singular (both required)"
    ]
   },
   {
    "prompt": "Where did the mistress send the boys at the end?",
    "marks": 1,
    "model": "To the villa / house.",
    "units": [
     "To the villa / house"
    ]
   }
  ],
  "C": [
   {
    "latin": "Romae dominus Romanus in villa magna habitabat. servi novos muros in horto aedificabant, sed pueri dominum in foro quaerebant. subito nuntius per portam cucurrit et servos vocavit. “nautae mali Romam adveniunt!” clamavit. servi nuntium audiverunt, sed dominum invenire non poterant.",
    "model": "In Rome a Roman master was living in a large villa. Slaves were building new walls in the garden, but boys were searching for the master in the forum. Suddenly a messenger ran through the gate and called the slaves. “Bad sailors are coming to Rome!” he shouted. The slaves heard the messenger but could not find the master.",
    "units": [
     [
      "Romae",
      "in / at Rome"
     ],
     [
      "dominus Romanus in villa magna habitabat",
      "a Roman master was living in a large villa"
     ],
     [
      "servi novos muros in horto aedificabant",
      "slaves were building new walls in the garden"
     ],
     [
      "sed pueri dominum in foro quaerebant",
      "but boys were looking for the master in the forum"
     ],
     [
      "subito nuntius per portam cucurrit",
      "suddenly a messenger ran through the gate"
     ],
     [
      "et servos vocavit",
      "and called the slaves"
     ],
     [
      "nautae mali",
      "bad / evil sailors (subject)"
     ],
     [
      "Romam adveniunt",
      "are coming to / arriving at Rome"
     ],
     [
      "clamavit",
      "he shouted"
     ],
     [
      "servi nuntium audiverunt, sed dominum invenire non poterant",
      "the slaves heard the messenger but could not find the master"
     ]
    ]
   },
   {
    "latin": "dominus in templo cum amicis erat, et pueri ad templum festinaverunt. pueri dominum viderunt et gladios ad templum portaverunt. “domine, servi in periculo sunt!” clamaverunt. dominus verba puerorum audivit, sed nautas non timebat. deinde amicos per forum ad portam duxit.",
    "model": "The master was in the temple with friends, and the boys hurried to the temple. The boys saw the master and carried swords to the temple. “Master, the slaves are in danger!” they shouted. The master heard the boys’ words, but he was not afraid of the sailors. Then he led his friends through the forum to the gate.",
    "units": [
     [
      "dominus in templo cum amicis erat",
      "the master was in the temple with friends"
     ],
     [
      "et pueri ad templum festinaverunt",
      "and the boys hurried to the temple"
     ],
     [
      "pueri dominum viderunt",
      "the boys saw the master"
     ],
     [
      "et gladios ad templum portaverunt",
      "and carried swords to the temple"
     ],
     [
      "domine",
      "Master! (vocative singular)"
     ],
     [
      "servi in periculo sunt! clamaverunt",
      "the slaves are in danger, they shouted"
     ],
     [
      "dominus verba puerorum audivit",
      "the master heard the boys' words"
     ],
     [
      "sed nautas non timebat",
      "but he was not afraid of the sailors"
     ],
     [
      "deinde amicos",
      "then [he led] the friends"
     ],
     [
      "per forum ad portam duxit",
      "led [them] through the forum to the gate"
     ]
    ]
   },
   {
    "latin": "ad portam nautae laeti cum equis manebant. dona multa nautae domino Romano portabant, non gladios. nauta pulcher dominum salutavit et servos vocavit. “domine, bellum non est! nova dona habemus!” inquit. dominus verba nautae audivit, sed iratus manebat.",
    "model": "At the gate the happy sailors were remaining with horses. The sailors were carrying many gifts to the Roman master, not swords. A handsome sailor greeted the master and called the slaves. “Master, there is no war! We have new gifts!” he said. The master heard the sailor’s words, but he remained angry.",
    "units": [
     [
      "ad portam",
      "at / near the gate"
     ],
     [
      "nautae laeti cum equis manebant",
      "the happy sailors were remaining with horses"
     ],
     [
      "dona multa nautae",
      "many gifts [the] sailors"
     ],
     [
      "domino Romano portabant",
      "were carrying [them] to the Roman master"
     ],
     [
      "non gladios",
      "not swords"
     ],
     [
      "nauta pulcher dominum salutavit",
      "a handsome sailor greeted the master"
     ],
     [
      "et servos vocavit",
      "and called the slaves"
     ],
     [
      "domine, bellum non est!",
      "Master, there is no war"
     ],
     [
      "nova dona habemus! inquit",
      "We have new gifts, he said"
     ],
     [
      "dominus verba nautae audivit, sed iratus manebat",
      "the master heard the sailor's words but remained angry"
     ]
    ]
   },
   {
    "latin": "nauta dominum monuit: “quinque horas per aquam navigavimus.” “dona pueris et servis damus; patriam oppugnare non debemus!” dominus nautae verba audivit et servos ad portam misit. servi gladios in templo custodiebant, sed dona nautarum in villam portaverunt. domina cenam parabat et nautas ad villam invitavit.",
    "model": "The sailor warned the master: “We have sailed for five hours across the water.” “We are giving gifts to the boys and slaves; we must not attack the homeland!” The master heard the sailor’s words and sent slaves to the gate. The slaves were guarding swords in the temple, but carried the sailors’ gifts into the villa. The mistress was preparing dinner and invited the sailors to the villa.",
    "units": [
     [
      "nauta dominum monuit",
      "the sailor warned the master"
     ],
     [
      "quinque horas per aquam navigavimus",
      "we sailed / have sailed for five hours across the water"
     ],
     [
      "dona pueris et servis damus",
      "we are giving gifts to boys and slaves"
     ],
     [
      "patriam oppugnare non debemus",
      "we should not / must not attack the homeland"
     ],
     [
      "dominus nautae verba audivit",
      "the master heard the sailor's words"
     ],
     [
      "et servos ad portam misit",
      "and sent the slaves to the gate"
     ],
     [
      "servi gladios in templo custodiebant",
      "the slaves were guarding swords in the temple"
     ],
     [
      "sed dona nautarum in villam portaverunt",
      "but carried the sailors' gifts into the house"
     ],
     [
      "domina cenam parabat",
      "the mistress was preparing dinner"
     ],
     [
      "et nautas ad villam invitavit",
      "and invited the sailors to the villa"
     ]
    ]
   },
   {
    "latin": "subito puella parva in templo virum malum vidit. vir arma e templo trahebat et ad portam festinabat. “pueri, virum malum custodite!” clamavit puella. pueri virum malum custodiebant, sed vir per forum cucurrit. nautae virum invenerunt et arma in templum portaverunt.",
    "model": "Suddenly a small girl saw a bad man in the temple. The man was dragging weapons out of the temple and hurrying to the gate. “Boys, guard/watch the bad man!” shouted the girl. The boys were watching the bad man, but he ran through the forum. The sailors found the man and carried the weapons into the temple.",
    "units": [
     [
      "subito puella parva",
      "suddenly a small girl"
     ],
     [
      "in templo virum malum vidit",
      "saw a bad man in the temple"
     ],
     [
      "vir arma e templo trahebat",
      "the man was dragging weapons out of the temple"
     ],
     [
      "et ad portam festinabat",
      "and was hurrying to the gate"
     ],
     [
      "pueri",
      "Boys! (vocative plural)"
     ],
     [
      "virum malum custodite! clamavit puella",
      "Watch / guard the bad man, the girl shouted"
     ],
     [
      "pueri virum malum custodiebant",
      "the boys were guarding the bad man"
     ],
     [
      "sed vir per forum cucurrit",
      "but the man ran through the forum"
     ],
     [
      "nautae virum invenerunt",
      "the sailors found the man"
     ],
     [
      "et arma in templum portaverunt",
      "and carried the weapons into the temple"
     ]
    ]
   }
  ]
 }
];
export function validateNov23Papers(){
 if(NOV23_PAPERS.length!==3)throw Error("Expected three papers");
 for(const p of NOV23_PAPERS){if(p.A.reduce((n,q)=>n+q.marks,0)!==11||p.B.reduce((n,q)=>n+q.marks,0)!==14||p.C.reduce((n,s)=>n+s.units.length,0)!==50)throw Error("Mark total "+p.id);if(p.C.length!==5||p.C.some(s=>s.units.length!==10))throw Error("Translation section "+p.id);for(const q of [...p.A,...p.B])if(q.units.length!==q.marks||!q.prompt||!q.model)throw Error("Missing marking unit "+p.id);}
 return true;
}
