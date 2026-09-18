const ALLOWED_ORIGINS = new Set([
  "https://glojournal-cmyk.github.io",
]);

const hits = new Map();
const cache = new Map();

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) || /^http:\/\/localhost(?::\d+)?$/.test(origin || "");
  return {
    allowed,
    headers: {
      "Access-Control-Allow-Origin": allowed ? origin : "https://glojournal-cmyk.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    },
  };
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const max = 20;
  const current = hits.get(ip) || [];
  const recent = current.filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

function clean(value, max = 3000) {
  return String(value ?? "").slice(0, max).trim();
}

function buildPrompt(body) {
  const action = clean(body.action, 40);
  const correct = !!body.correct;
  const subject = clean(body.subject, 40) || "school subject";
  const year = clean(body.year, 10) || "9";
  const topic = clean(body.topic, 160);
  const question = clean(body.question, 2000);
  const stimulus = clean(body.stimulus, 1800);
  const studentAnswer = clean(body.studentAnswer, 1200);
  const officialAnswer = clean(body.officialAnswer, 1600);
  const staticExplanation = clean(body.staticExplanation, 2200);
  const errorKind = clean(body.errorKind, 80);
  const format = clean(body.format, 80);

  const actionInstruction = {
    why_correct: "Explain why the student's answer is correct.",
    where_wrong: "Explain exactly where the student's answer went wrong, then state the governing rule.",
    explain_rule: "Explain the underlying rule clearly, then apply it to this question.",
    simpler: "Explain the same idea in simpler language without becoming childish.",
    similar_example: "Give one closely related example after a short explanation. Include the answer, but clearly separate it so the student can try first.",
    chinese: "Explain in concise Traditional Chinese, while keeping official subject terminology in English, Latin or French where useful.",
  }[action] || (correct ? "Explain why the answer is correct." : "Explain the mistake and the correct rule.");

  return [
    `Subject: ${subject}`,
    `School year: Year ${year}`,
    topic ? `Topic: ${topic}` : "",
    format ? `Question format: ${format}` : "",
    `Question: ${question}`,
    stimulus ? `Stimulus/context: ${stimulus}` : "",
    `Student answer: ${studentAnswer || "(blank)"}`,
    `Official answer: ${officialAnswer}`,
    staticExplanation ? `Approved explanation: ${staticExplanation}` : "",
    errorKind ? `Recorded error type: ${errorKind}` : "",
    `Student was marked: ${correct ? "correct" : "incorrect"}`,
    "",
    `Task: ${actionInstruction}`,
  ].filter(Boolean).join("\n");
}

function systemInstructions() {
  return [
    "You are the optional explanation layer inside a Year 9 revision app for a 13-year-old student.",
    "The app's official answer and approved explanation are the marking source. Do not silently change or override them.",
    "If the official answer appears genuinely inconsistent with the question, say 'This may need checking' and explain the concern without re-marking the student.",
    "Be concise, accurate and educational. Usually 100-180 words.",
    "Use a rule -> application -> example structure when helpful.",
    "For Latin and French, explain grammar precisely. For science, distinguish terminology, concept, calculation and units.",
    "Do not introduce unsupported syllabus material unless it is necessary to clarify the rule.",
    "Do not mention XP, Mastery or rewards. Do not award marks.",
    "Do not ask for personal information.",
    "Return plain text only.",
  ].join(" ");
}

function extractText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

export default async function handler(req, res) {
  const origin = String(req.headers.origin || "");
  const access = cors(origin);
  for (const [key, value] of Object.entries(access.headers)) res.setHeader(key, value);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      configured: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna"
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!access.allowed) return res.status(403).json({ error: "Origin not allowed." });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI service is not configured yet." });

  const ip = clientIp(req);
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many AI requests. Please try again later." });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (!body.question || !body.officialAnswer) return res.status(400).json({ error: "Question context is incomplete." });

  const prompt = buildPrompt(body);
  if (prompt.length > 10000) return res.status(413).json({ error: "Question context is too large." });

  const cacheKey = Buffer.from(prompt).toString("base64").slice(0, 400);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) {
    return res.status(200).json({ explanation: cached.text, cached: true });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        reasoning: { effort: "low" },
        instructions: systemInstructions(),
        input: prompt,
        max_output_tokens: 450,
        store: false,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = String(data?.error?.code || data?.error?.type || "unknown");
      console.error("OpenAI API error", response.status, code);

      let error = "AI explanation is unavailable right now.";
      let diagnostic = "openai_error";

      if (response.status === 401) {
        error = "OpenAI rejected the API key. Check the Vercel OPENAI_API_KEY value.";
        diagnostic = "invalid_api_key";
      } else if (response.status === 403) {
        error = "The OpenAI API key does not have permission for this request.";
        diagnostic = "permission_denied";
      } else if (response.status === 429 && /quota|credit|billing/i.test(code)) {
        error = "OpenAI API billing or credits are required for this project.";
        diagnostic = "billing_or_credits";
      } else if (response.status === 429) {
        error = "OpenAI API rate limit reached. Please try again shortly.";
        diagnostic = "rate_limit";
      } else if (response.status === 404 || /model.*not.*found|model_not_found/i.test(code)) {
        error = "The selected OpenAI model is not available to this API project.";
        diagnostic = "model_unavailable";
      } else if (response.status === 400) {
        error = "OpenAI rejected the explanation request.";
        diagnostic = "bad_request";
      }

      return res.status(502).json({ error, diagnostic });
    }

    const explanation = extractText(data);
    if (!explanation) return res.status(502).json({ error: "AI returned an empty explanation." });
    cache.set(cacheKey, { text: explanation, at: Date.now() });
    return res.status(200).json({ explanation });
  } catch (error) {
    console.error("Ask AI backend error", error?.message || error);
    return res.status(502).json({ error: "AI explanation is unavailable right now." });
  }
}
