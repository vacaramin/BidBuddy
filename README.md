# BidBuddy

A local-first workspace for writing freelance proposals. Paste a job post, pick a profile and model, and keep the draft with the rest of your bids.

Data stays in your browser. API keys are sent only when you generate, and only to the provider you chose (ChatGPT or Claude).

## Features

- **Generate proposals** from a job description with ChatGPT or Claude
- **Multiple freelancer profiles** — personal info, headline, color, and prompt opening/closing per profile
- **Shared API keys** across profiles
- **History** of generated drafts, prompt-only saves, and failed attempts, filterable by profile
- **Home analytics** for proposal volume and activity
- **Import / export** for proposals, profiles, and related data when you switch browsers

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## How it works

1. Open **Profile setup** and add at least one profile, plus a ChatGPT and/or Claude key.
2. Go to **Generate**, paste the job post, choose a model, and generate (or save the prompt for later).
3. Reopen past bids from **History**, including ones that failed.

## Stack

- [Preact](https://preactjs.com/) + [Vite](https://vitejs.dev/)
- [preact-router](https://github.com/preactjs/preact-router)
- [styled-components](https://styled-components.com/)
- Browser `localStorage` for profiles, keys, and proposals

## Contributing

Ideas, fixes, and pull requests are welcome:

[github.com/vacaramin/BidBuddy](https://github.com/vacaramin/BidBuddy)
