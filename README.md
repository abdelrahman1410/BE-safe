# BE SAFE

Personal HSE website of **Abdul Rahman Zain**, Senior HSE Professional: profile, areas of expertise, a free library of HSE templates, interactive risk tools and a WhatsApp contact page.

## Structure

| Path | Content |
|------|---------|
| `index.html` | Home page |
| `about/` | Profile: experience, achievements, certifications, skills |
| `services/` | Areas of expertise |
| `library/` | Safety library (PTW, JSA, checklists) |
| `tools/` | Interactive 5×5 risk matrix and safety KPI calculator (TRIR, LTIFR, severity rate) |
| `request/` | Contact form that sends the message on WhatsApp |
| `assets/` | Shared design (`style.css`) and header, footer and Arabic/English switch (`site.js`) |
| `app/` | Installable mobile app (PWA): `manifest.json`, `sw.js`, icons |

## Run locally

Requires [Node.js](https://nodejs.org/).

```bash
node app/server.js
```

Then open <http://localhost:3000> (site) or <http://localhost:3000/app/> (app).
