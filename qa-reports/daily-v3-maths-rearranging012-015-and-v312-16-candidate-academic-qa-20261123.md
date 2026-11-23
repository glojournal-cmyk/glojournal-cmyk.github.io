# Lux et Labor — Y9 Changing the Subject Q12–15 and 16 staged reasoning candidates: independent QA

**23 November 2026 · Draft PR #306 · Formal independent Academic QA acceptance 0/200 · No merge, live import or student credit**

## Current exact source and duplicate-family finding

The current GitHub QA branch's source \`qa-staging/math-v311-reviewed-200.json\` was reopened. \`LUX-MATH-Y9-REARRANGING-012,013,014,015\` were individually inspected and found to use the same mathematical rearrangement core:

\[
y=a+\frac{b}{cx+d}.
\]

These four source questions are mathematically valid yet only change the numbers and reuse error-path structures; that by itself is inadequate evidence of four **distinct Grade7+ reasoning opportunities**. The full original 200-row revised source is **left unchanged**.

No further TGS curriculum-PDF retrieval was attempted, **at the parent's explicit request**. Absence of that PDF is no longer treated as a process blocker for drafting, mathematical QA, or analysis; no unsupported assertion about which subskills have been taught is made.

## Four independently staged candidate alternatives

Candidate source:
\`qa-staging/math-v312-rearranging012-015-distinct-reasoning-candidates-20261123.json\`

| Draft source ID | Exact reconstructed result | Key | Reasoning and distractor distinction |
|---|---|---|---|
| **REARRANGING-012** | If \(y=2+\frac6{3x+2}\), \(x\ge0\), then \(\displaystyle x=\frac{10-2y}{3(y-2)}\) and **\(2<y\le5\)** | **A** | Upper endpoint is attained at \(x=0\); lower endpoint is approached but never attained. A correct inverse formula combined with a wrong interval is a wrong *complete* answer |
| **REARRANGING-013** | From \((x,y)=(1,7),(4,4)\) for \(y=a+\frac b{x+2}\), obtain \(a=1,b=18\), then \(\displaystyle x=\frac{18}{y-1}-2,\;y\ne1\) | **A** | Recover two unknown model coefficients first, then invert and preserve excluded output. Fixed one errorPath to the concrete reproducible wrong step \(b/6=3\Rightarrow b=6\) via multiplying by 2 instead of 6 |
| **REARRANGING-014** | If \(y=(x-3)^2+4\), \(x\ge3\), then \(x=3+\sqrt{y-4}\), **\(y\ge4\)** | **A** | Must choose the positive root branch from the input restriction; excluding the vertex, choosing the negative branch or moving the outer shift incorrectly makes the complete claim wrong |
| **REARRANGING-015** | Given \(y=(k-3)x+2k\), for \(k\ne3\), \(\displaystyle x=\frac{y-2k}{k-3}\); when **\(k=3\)**, the special relation is **\(y=6\)** | **D** | For \(k=3,y=6\), all real \(x\) solve it; for \(k=3,y\ne6\), no \(x\) solves it; there is no unique inverse at that parameter |

All 4 candidates are separately versioned and contain six A–F alternatives, five stated wrong-operation paths, three written model-solution steps and \`dailyEligible:false\`, \`masteryEligible:false\`, \`academicQA:'pending'\`, independent Grade7+ and student-misconception certification false.

## Independent executable checks and epistemic boundary

Dedicated regression test:
\`tests/daily-v3-maths-rearranging012-015-v312-distinct-reasoning-qa-20261123.test.mjs\`

It parses actual versioned stem numbers, uses an independent safe small TeX algebra evaluator rather than copying the stored keyed answer, tests all 24 formula/range claims (including five wrong routes per question), and directly probes valid source input/output values. It checks:
- Q12 output boundaries and exact inverse over seven different admissible source inputs;
- Q13 coefficient inference from two stated observations, plus inverse over eight x probes;
- Q14 square-root principal branch over five valid inputs including the vertex;
- Q15 inverse across multiple \(k,x\) settings and the exceptional coefficient-zero case;
- offline native MathML output for 4 stems, 24 A–F alternatives and all 12 written solution explanations;
- old bank source provenance and that no candidate is approved or student-credit eligible;
- negative mutation checks that must reject changed keys, ranges, option formulas, error explanations, source coefficients/observations and forged \`dailyEligible:true\`.

After expanding Q14's too-brief first solution step, **both (2/2) automated test suites passed when executed using actual branch source and native renderer in an independent JavaScript V8 harness**. The test and candidate pack were added to both CI path-filter sets, syntax check and Node test command.

**Critical distinction:** V8 harness PASS is **not** a confirmed completed-green official GitHub Actions run. It also is not an iPad/WebKit or actual learner-progress test.

## Cross-pack academic QA manifest: 16 draft candidates

Created:
\`qa-staging/math-v312-16-candidate-academic-review-ledger-20261123.json\`
and the independently executable integrity guard:
\`tests/daily-v3-maths-v312-16-candidate-crosspack-academic-hold-20261123.test.mjs\`.

These reconcile four separately staged draft alternative packs:

| Topic/revision candidate pack | New versions |
|---|---:|
| Indices Q005–008 | 4 |
| Standard Form Q013–016 | 4 |
| Changing the Subject Q009–011 and Q017 | 4 |
| Changing the Subject Q012–015 | 4 |
| **Total** | **16** |

The new ledger independently matches all **16 IDs** back to source-bank revision IDs and checks **96 A–F answers**, **80 stated wrong answers**, six-option uniqueness, source lineage, no duplicate source IDs and zero permission or educational approvals. **2/2 of the standalone cross-pack integrity test suites passed in the independent V8 harness**. This additional test is also wired into CI path/syntax/unit steps; official Actions green remains unobserved.

The concept-risk register flags **four overlapping or related skill pairs (8 candidates)** pending independent Mastery/academic judgement:
1. REARRANGING-009 and -013: inverse with excluded output; latter adds coefficient inference.
2. REARRANGING-010 and -012: inverse with bounded input and output range; one has a closed upper endpoint.
3. REARRANGING-011 and -015: nonunique inverse under parameter changes; one constant ratio, one linear coefficient zero.
4. INDICES-008 and STANDARD_FORM-013: optimisation under integer constraints, albeit applied to mathematically different subject matter.

**These groupings are risk indicators, not proofs of identical abstract mathematical concepts.** They must not be automatically scored as independent Mastery concepts merely because their source IDs differ.

## Academic blockers retained by design

No independent external GCSE Higher **Grade7+** calibration; no pupil-response-based evidence that all error paths are realistic and diagnostic; no official completed-green GitHub Actions or physical iPad PWA/storage/score-state acceptance. The **TGS Curriculum Outline PDF itself is deliberately not required**.

Therefore:
- **Original revised bank:** 200/200 \`dailyEligible:false\`, **0/200** independent formal Academic QA approvals.
- **Staged new alternative questions:** 16/16 \`dailyEligible:false\`, \`masteryEligible:false\`, **0/16** final educational approvals.
- **Production app and student progress:** untouched. PR #306 stays **Draft**, no merge, no release, no Daily/MP/Mastery/Recovery award writes.
- **Next source QA** can revisit unmodified REARRANGING-018 and -024 in the six-member duplicate family or audit other repeated inverse/radical/nested families, while maintaining concept-overlap discipline rather than generating another number-rotation batch.
