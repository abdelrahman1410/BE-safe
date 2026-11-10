# BE SAFE

**Health, Safety & Environment (HSE)** website: safety services, a library of HSE templates (PTW, JSA, risk assessment), risk tools, and a WhatsApp contact page.

## Structure

| Path | Content |
|------|---------|
| `index.html` | Home page |
| `services/` | Safety services (audits, training, consultancy) |
| `library/` | Safety library (PTW, JSA, checklists) |
| `tools/` | Interactive 5×5 risk matrix and safety KPI calculator (TRIR, LTIFR, severity rate) |
| `request/` | Request form that sends the details on WhatsApp |
| `assets/` | Shared design (`style.css`) and header, footer and Arabic/English switch (`site.js`) |
| `app/` | Installable mobile app (PWA): `manifest.json`, `sw.js`, icons |
| `docs/` | Alternative version of the site with a shared stylesheet |

## Run locally

Requires [Node.js](https://nodejs.org/).

```bash
node app/server.js
```

Then open <http://localhost:3000> (site) or <http://localhost:3000/app/> (app).
