// Round 1 batch repair acceptance. The old 6/12 RED run is retained as
// historical evidence in qa/food-tests-ethanol-marking-acceptance.result.json.
// This wrapper now exercises the actual per-question scorer dispatch in BOTH
// quiz-session bundles, rather than calling the generic R() matcher that is no
// longer the active path for bio-y8-app-ethanol-safety.
// Also verifies 9 MCQ distractors and 64 scenario/16 concept-group integrity.
// A green function test is NOT academic approval or an iPad E2E pass.
import './food-tests-round1-batch-acceptance.mjs';
