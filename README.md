# Sauna Math

Affiliate site for home saunas: a quiz, a cost calculator and buyer pages. Plain static HTML on the Cloudflare free tier, with no build tooling beyond `build.py`.

- `pages/<slug>.html`: line 1 is the title, line 2 the meta description, the rest is the body. Run `python3 build.py` to write `public/`.
- `public/_redirects`: the `/go/<brand>` affiliate links. Replace each target with the tracking link when a program approves us.
- `public/app.js`: quiz logic (`recommend`) and the calculator. Set `FORM_ENDPOINT` to turn on email capture.
- Deploy: `npx wrangler deploy` from this folder (Worker name `saunamath`, served at https://saunamath.parlyr.site).

Plan: https://claude.ai/code/artifact/04c6bf48-e0b4-46a7-a4a3-9f91bc1e2643
