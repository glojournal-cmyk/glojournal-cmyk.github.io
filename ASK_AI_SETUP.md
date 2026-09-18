# Scholar's Garden — Ask AI backend

The live app is on GitHub Pages, so the OpenAI API key must **not** be placed in browser code or committed to this repository.

## Recommended deployment

Deploy this repository to Vercel and use the serverless function at:

`/api/ask-ai`

Set these Vercel environment variables:

- `OPENAI_API_KEY` — a project API key stored only as a Vercel secret/environment variable.
- `OPENAI_MODEL` — optional. Defaults to `gpt-5.6-luna`.

After Vercel supplies the production URL, set the public front-end endpoint to:

`https://<your-vercel-project>.vercel.app/api/ask-ai`

The browser client reads the endpoint from any of these locations, in order:

1. `window.__SCHOLAR_AI_ENDPOINT__`
2. `<meta name="scholar-ai-endpoint" content="...">`
3. `localStorage["scholar-ai-endpoint"]`

No API key is ever sent to the browser.

## Data sent to the model

Only the current educational question context is sent: subject, year, topic, question, student's submitted answer, official answer, approved explanation, format and error type. Display name, progress totals, wardrobe data and other personal profile information are not sent.

## Marking safety

Ask AI is explanatory only. It does not change official answers, XP, rewards, spaced-review state or Mastery.
