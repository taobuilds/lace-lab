# lace lab

An interactive lace-pattern research studio developed for a Future Heritage Lab research assistant study. Explore historical pattern structures, translate a story into a visual brief, and generate image studies.

The website and image API are deployed together on Vercel from this GitHub repository. `vercel.json` builds the static files into `dist/client`; the Node.js functions in `api/` serve same-origin health and generation endpoints. Set `OPENAI_API_KEY` as a server-side Vercel environment variable. Never commit keys or put them in browser code.

Local development: set `OPENAI_API_KEY` in the ignored `.env` file and start `server.cjs` with Node.js. `worker/index.js` contains the shared image service. Vercel transfers generated images as WebP to fit function response limits; the browser exports PNG downloads. Generation has a 150-second upstream timeout and a 180-second function limit.

The existing per-visitor and daily demo limits use process memory. They reset on cold starts and are not a durable global spending cap across Vercel instances.
