# Daily V2 — full Latin/French semantic collision triage (1 November 2026)

**Scope:** all 36 groups (194 flagged source rows) returned by the Year 7–8 review queue at commit `f74461bb`. The 194 counts are 172 different-answer rows + 22 exact-answer rows. These are **review candidates, not 194 errors**, and they do not count as independent approved Daily V2 concepts. Original source IDs and persisted student records must remain intact. No certification occurs here.

## 1. Latin: 21 groups / 164 flagged rows

| Group / shared prompt | Different source answers | Interpretation / required decision |
|---|---|---|
| now | `nunc` / `iam` | Two contextual adverbs; qualify the prompt (now vs already/by now); do not automatically merge either sense |
| book | `liber` / `liber, libri` | Lemma vs nominative + genitive dictionary entry |
| boy | `puer` / `puer, pueri` | Lemma vs dictionary entry |
| food | `cibus` / `cibus, cibi` | Lemma vs dictionary entry |
| friend | `amicus` / `amicus, amici` | Lemma vs dictionary entry |
| garden | `hortus` / `hortus, horti` | Lemma vs dictionary entry |
| girl | `puella` / `puella, puellae` | Lemma vs dictionary entry |
| letter | `epistula` / `epistula, epistulae` | Lemma vs dictionary entry |
| man | `vir` / `vir, viri` | Lemma vs dictionary entry |
| master | `dominus` / `dominus, domini` | Lemma vs dictionary entry |
| messenger | `nuntius` / `nuntius, nuntii` | Lemma vs dictionary entry |
| money | `pecunia` / `pecunia, pecuniae` | Lemma vs dictionary entry |
| shop / inn | `taberna` / `taberna, tabernae` | Lemma vs dictionary entry |
| slave | `servus` / `servus, servi` | Lemma vs dictionary entry |
| sword | `gladius` / `gladius, gladii` | Lemma vs dictionary entry |
| temple | `templum` / `templum, templi` | Lemma vs dictionary entry |
| wall | `murus` / `murus, muri` | Lemma vs dictionary entry |
| wine | `vinum` / `vinum, vini` | Lemma vs dictionary entry |
| woman | `femina` / `femina, feminae` | Lemma vs dictionary entry |
| inquit | `says`, `he/she says` | Verb subject translation alternatives; verify context and accepted English forms |
| portat | `carries`, `he/she carries` | Verb person/number inference; distinguish gloss vs complete translation |

**Action:** 18 noun pairs require **different prompt expectations** rather than simplistic merging. For a dictionary-entry exercise, explicitly ask for nominative plus genitive; for a vocabulary gloss, accept the requested lexical form. The two skills may have separate task roles, but **must not be treated as 2 distinct vocabulary lexical units without reviewer evidence**. The two verb groups and `nunc/iam` require accepted-meaning/context review.

## 2. French: four differing-answer groups

| Shared prompt | Source answers | Reviewer decision |
|---|---|---|
| `Comme dessert, je prends …` | `for dessert I have` / `for dessert I'll have` | Contextual translation, present vs idiomatic future; verify prompt intent |
| `mille` | `1000` / `1 000` | Numeric formatting variants; one lexical number concept unless differentiated by taught task |
| `funny` | `amusant / marrant / rigolo` vs `amusant(e)` | Synonyms, register and gender; accept appropriate forms but review original exercise constraints |
| `to live` | `vivre` / `habiter` | Both can be correct in context; distinguish living/existing vs residing in a place; bare prompt is ambiguous |

No source question IDs or concept IDs should be rewritten automatically.

## 3. French: eleven EXACT same-prompt/same-answer groups

These are the highest-risk candidates for **double-counting the same knowledge as two different Daily vocab concepts**; multiple questions or topic placements are pedagogically legitimate but must not create two independent lexical credits.

| Group (direction included) | Confirmed original source examples |
|---|---|
| `après avoir fini` → `after having finished` | `fr-y8-src-frv3-22-0773-linker-en-apres-avoir-fini`, `fr-y8-src-frv3-27-0893-super-en-apres-avoir-fini` |
| `ce qui est` → `which is` | `fr-y8-src-frv3-22-0769-linker-en-ce-qui-est`, `fr-y8-src-frv3-27-0889-super-en-ce-qui-est` |
| `ce qui était` → `which was` | `fr-y8-src-frv3-22-0771-linker-en-ce-qui-etait`, `fr-y8-src-frv3-27-0891-super-en-ce-qui-etait` |
| `il fait chaud` → `it is hot` | `fr-y8-src-fr-02-0266-il-fait-chaud`, `fr-y8-src-frv3-29-1018-mixed-fr-02-0266-il-fait-chaud` |
| `il fait froid` → `it is cold` | `fr-y8-src-fr-02-0268-il-fait-froid`, `fr-y8-src-frv3-29-1028-mixed-fr-02-0268-il-fait-froid` |
| `il fait gris` → `it is grey` | `fr-y8-src-fr-02-0272-il-fait-gris`, `fr-y8-src-frv3-29-1047-mixed-fr-02-0272-il-fait-gris` |
| `il fait mauvais` → `the weather is bad` | `fr-y8-src-fr-02-0270-il-fait-mauvais`, `fr-y8-src-frv3-29-1038-mixed-fr-02-0270-il-fait-mauvais` |
| `quel temps fait-il ?` → `what is the weather like?` | `fr-y8-src-fr-02-0264-quel-temps-fait-il`, `fr-y8-src-frv3-29-1008-mixed-fr-02-0264-quel-temps-fait-il` |
| `relaxant` → `relaxing` | `fr-y7-foundation-f9f072d4a7-f2e`, `fr-y8-src-fr-03-0504-relaxant` |
| `relaxing` → `relaxant` | `fr-y7-foundation-f9f072d4a7-e2f`, `fr-y8-src-fr-03-0503-relaxing` |
| `we did not write anything` → `nous n'avons rien écrit` | `fr-y8-src-frv3-21-0730-negative-we-did-not-write-anything`, `fr-y8-src-frv3-27-0886-target-negative-we-did-not-write-anything` |

**Action:** reviewer to assign a **canonical lexical credit grouping** for equivalent tasks, while retaining every historical source `questionId` and `conceptId`. The app may keep varied exercises and contexts; Daily V2 cannot count these as two independently mastered concepts. No automatic merging or deleting source questions.

## Release control

- The above 36 groups must remain in the source-bound reviewer workbook with all decisions pending until explicit source-specific approval.
- V2's `0 independently certified` status remains unchanged. A machine-generated list cannot establish correctness or Year 8 taught status.
- Preserve existing Scholar, XP, Pet MP/wardrobe, 48-hour Recovery and historical answers.
- The separate 14-item French classroom plural answer repair is in **Draft PR #250**; no production source changes are part of this document.
- Avoid reusing identical prompts as independent 30-day fresh supply even where the generated source ID differs.
