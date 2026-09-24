# lace lab

An interactive lace-pattern research studio developed for a Future Heritage Lab research assistant study. Explore historical pattern structures, translate a story into a visual brief, and generate image studies.

The public website is published from `dist/client` by [GitHub Pages](https://docs.github.com/en/pages). Run `node build-site.cjs` to assemble that folder. The image API runs separately from the static website because it needs a server-side `OPENAI_API_KEY`; the key must never be committed or added to GitHub Pages.

Local development: set `OPENAI_API_KEY` in the ignored `.env` file and start `server.cjs` with Node.js. `worker/index.js` is the hosted image API. Public image generation is limited per visitor and per day.
