# Lux et Labor — Changing the Subject Q012–Q015: source-first independent reasoning QA

**23 November 2026 · Draft PR #306 · old 200-row revised bank unchanged · 0/200 Academic QA formally accepted**

## Why these four original questions were selected

Reviewed the **actual current** \`qa-staging/math-v311-reviewed-200.json\`. The source items \`REARRANGING-012,013,014,015\` each used only a different coefficient version of the same formula \(\displaystyle y=a+\frac{b}{cx+d}\), with analogous inverse-solving steps and recycled wrong-answer logic. All 4 previously had correct mathematical candidate answers, but this single number-rotation template does **not** establish 4 independently challenging GCSE Higher Grade7+ AO2/AO3 ideas.

**The parent has approved SKIPPING the TGS Year 9 Maths Curriculum Outline PDF.** This review did not retrieve that PDF, and absence of the PDF is **not a separate procedural blocker**. No claim of classroom-taught evidence is made.

The new *standalone draft proposal* is:
\`qa-staging/math-v312-rearranging012-015-distinct-reasoning-candidates-20261123.json\`.

It does **not** replace any source item in the 200-row bank, nor change the student's App.

## New topic, algebra, correct answer and key

| Proposed question | Distinct mathematical task | Source-first result | Correct choice |
|---|---|---|---|
| **REARRANGING-012** | \(y=2+\frac6{3x+2}\) with \(x\ge0\): rearrange and give exact **strict/weak endpoint range** | \(\displaystyle x=\frac{10-2y}{3(y-2)},\quad 2<y\le5\) | **A** |
| **REARRANGING-013** | From \((x,y)=(1,7),(4,4)\), infer unknown constants in \(y=a+\frac b{x+2}\), then invert and exclude unreachable output | \(\displaystyle a=1,\ b=18,\ x=\frac{18}{y-1}-2,\ y\ne1\) | **A** |
| **REARRANGING-014** | \(y=(x-3)^2+4\) with \(x\ge3\): determine correct **principal square-root branch** and output domain | \(\displaystyle x=3+\sqrt{y-4},\ y\ge4\) | **A** |
| **REARRANGING-015** | \(y=(k-3)x+2k\): separate **unique inversion** from the exceptional coefficient-zero case | \(\displaystyle k\ne3:\ x=\frac{y-2k}{k-3};\quad k=3:\ y=6\) | **D** |

In the Q015 exception, \(k=3,\ y=6\) means *every real x* satisfies the equation; \(k=3,\ y\ne6\) means *no x* does. Both are non-unique inversion cases, and all six answer options must be evaluated as **entire statements**, not just as the displayed inverse fraction.

Q012 strict/weak inequalities are similarly intrinsic to the answer: \(y=5\) is attained at \(x=0\), but \(y=2\) is only a limiting value as \(x\) increases.

Q013 is not the same routine single-coefficient inversion as the originals: it first requires solving the two independent observed data points to determine \((a,b)\), then inverting and identifying the missing range value.

Q014 uses the non-negative branch because of the *given input restriction*. The negative branch would be inconsistent with \(x\ge3\) at any \(y>4\).

## Independent calculation, wrong-response semantics, and fail-closed test

Committed file:
\`tests/daily-v3-maths-rearranging012-015-v312-distinct-reasoning-qa-20261123.test.mjs\`

The test directly parses the **actual candidate stem parameters**, independently derives source relationships, and checks:

1. **4 correct A–F selections and all 24 complete algebra/domain statements**. All 20 wrong responses have a derived wrong-operation formula or incorrect endpoint/exception rather than merely being numerically different from the key.
2. Repeated valid input/output substitution, including the Q012 closed endpoint, Q013 observed data inversion, Q014 square-root branch, and Q015 numerous \(k,x\) values and the exceptional \(k=3\) case.
3. Each wrong-answer **errorPath** is tied to a specific change to the underlying operation or domain restriction; one Q013 errorPath was clarified to **wrongly multiply \(b/6=3\) by 2 instead of 6**, which genuinely produces the wrong candidate \(b=6\).
4. **All four stems, 24 A–F options and 12 solution steps** were rendered successfully using the actual native offline MathML renderer. A Q014 first explanation step was expanded to state the square-isolation operation more clearly.
5. Six-option uniqueness, old-versus-new revision provenance, a pristine 200-row current bank, and **mandatory false** values for \`dailyEligible\`, \`masteryEligible\`, \`independentGradeCalibrated\` and \`independentStudentMisconceptionCertified\`.
6. Adversarial mutations: tamper the keyed option, corrupt a wrong algebraic choice, fabricate an exclusion/range clause, change an input coefficient or observation, invent an unsupported \`errorPath\`, or set \`dailyEligible:true\`; **all must be rejected**.

**Independent real-JavaScript V8 harness execution: 2/2 suites PASS**, using the actual GitHub branch test source, source-bank JSON, candidate JSON and offline MathML renderer. The test file is wired into the existing GitHub Actions workflow's two push/PR path filters, syntax check and Node command. **This is not a verified completed-green official GitHub Actions run**, nor an iPad WebKit/PWA end-user test.

## Academic caveats and across-pack template overlap

Mathematical proof of each wrong answer is not evidence that the wrong reasoning is a *realistic/common pupil mistake*, nor that each resulting question meets externally benchmarked GCSE Higher Grade7+ challenge.

- Q012 and the earlier staged REARRANGING-010 both involve **inverse plus output range**; the closed endpoint of Q012 is a meaningful distinction, but these should **not automatically count as two independent Mastery concepts**.
- Q013 and earlier REARRANGING-009 both involve **inverse output exclusions**; Q013 adds an independent coefficient-reconstruction problem. Separate concept credit requires educational review.
- Q015 and earlier REARRANGING-011 both involve a **parameter-based exceptional case**; their actual mathematical criteria differ (linear coefficient zero vs proportional numerator/denominator), but duplicate-concept risk remains.
- Q014 uses square-root branch selection, which overlaps partially with the previously staged Year9 Changing the Subject square-root topic. This difference must be evaluated against real student work and Higher benchmarks.

**No source PDF lookup is necessary to continue the agreed parent-directed QA**, but these concerns still require an *independent* Grade7+ / diagnostic-reality assessment and later actual App integration tests.

## Safety/release disposition

- Reworked candidate IDs: **4 new unapproved alternatives**, \`dailyEligible:false\`, \`masteryEligible:false\`.
- Earlier staged 4 Indices + 4 Standard Form + 4 other Rearranging = **16 total candidate alternatives**, all unapproved and not imported.
- Actual 200-item revised Maths source unchanged, all 200 blocked, formal Academic QA **0/200**, actual 10-question Daily not switched to this candidate pack.
- PR #306 remains **Draft**; no merge/deployment, no student XP/MP/Mastery/Recovery credit.
