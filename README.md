# ChemiAI – SSC Chemistry Teacher (Bengali) – 100% FREE setup

Public website, no login. Everything below is free: GitHub, Vercel (Hobby plan), Google AI Studio (Gemini free tier, no card).

## Structure
- `public/index.html` – the website
- `api/chat.js`       – backend (holds the secret key, rate limits, teacher prompt)

## Deploy
1. Get a free key: https://aistudio.google.com -> Get API key -> Create API key.
   Do NOT enable billing, so nothing can ever be charged.
2. Upload this folder's contents to a new GitHub repository.
3. vercel.com -> Continue with GitHub -> Add New Project -> import the repo.
4. Environment Variables: `GEMINI_API_KEY` = your key. (Optional `GEMINI_MODEL`.) Deploy.

## Free-tier limits (important)
- Google's free quota is small and changes over time. Check yours at https://aistudio.google.com/rate-limit.
- The site stops at `GLOBAL_DAILY_LIMIT` (default 300) questions/day; each visitor gets 4/minute and 20/day.
  Raise these only if your Google quota allows.
- On the free tier Google may use questions to improve its products. Tell students not to type personal information.
- If the model name stops working, copy a current "Free of charge" model ID from Google's pricing page into `GEMINI_MODEL`.
