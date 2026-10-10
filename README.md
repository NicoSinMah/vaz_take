# nick_vaz | Backend Portfolio

Personal portfolio for **nick_vaz**, a Systems and Computing Engineering student focused on backend development: Java, Spring Boot, microservices, distributed systems, and cloud infrastructure.

**Live site:** [nick-vaz.com](https://nick-vaz.com)


## Features

- **Live activity panel**: shows what I'm listening to on YouTube Music and my Discord status in real time (Supabase Realtime with a polling fallback).
- **Current Obsession**: a curated list of favorite tracks, editable from a single array in `script.js`.
- **Projects section**: selected backend projects (Java microservices, Spring Data CRUD, Elixir/OTP distributed chat).
- **Interactive profile cards**: accordion-style on desktop, swipeable carousel with dot indicators on mobile.
- **Contact form**: powered by Netlify Forms with reCAPTCHA and a honeypot field, plus a typewriter-style name placeholder.
- **Link previews**: Clean embeds on Discord, LinkedIn, Steam and GitHub.
- **Responsive design**: built mobile-first with plain CSS.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Live data | [Supabase](https://supabase.com) (Postgres + Realtime) |
| Forms | [Netlify Forms](https://docs.netlify.com/manage/forms/setup/) + reCAPTCHA |
| Hosting | [Netlify](https://www.netlify.com) |

## Project structure

.
├── index.html     # Page markup, meta tags, Netlify form
├── styles.css     # All styling, including the mobile breakpoints
├── script.js      # Tracks, info panels, activity feed, typewriter, form handling
└── images/        # Avatars, track covers, favicon, backgrounds

## Running locally
script.js is a private script used to connect Pear Desktop with Supabase. It may be made public in a future update.

bash
git clone https://github.com/NicoSinMah/vaz_take.git
cd vaz_take

# any static server works, for example:
npx serve .
# or
python3 -m http.server 8000

> **Note:** the contact form only works on the deployed Netlify site. Netlify detects and processes forms at deploy time, so submissions from a local server won't be captured.

## Customizing

- **Favorite tracks:** edit the `favoriteTracks` array at the top of `script.js` (title, artist, cover path, link).
- **Typewriter names:** edit `TYPEWRITER_NAMES` in `script.js`.
- **Projects and profile cards:** edit the corresponding sections in `index.html`.
- **Live activity:** the page reads the `presence` and `discord_presence` tables from Supabase. Updates are pushed to those tables by an external relay, which is not part of this repository.

## Deployment

The site is deployed on Netlify directly from this repository.

1. Connect the repo to a Netlify site (no build command, publish directory is the repo root).
2. Netlify's form detection picks up the `contact` form from `index.html` on the next deploy.
3. In **Site configuration → Forms → Form notifications**, add an email notification to receive messages.

## Security note

The Supabase key in `script.js` is the public **anon** key. It is designed to be exposed in the browser, and access is restricted by Row Level Security policies on the Supabase project. Never commit a `service_role` key.

## License

See the [LICENSE](https://github.com/NicoSinMah/vaz_take/blob/main/LICENSE) file for details.

## Contact

- GitHub: [@NicoSinMah](https://github.com/NicoSinMah)
- LinkedIn: [vaz-nico](https://www.linkedin.com/in/vaz-nico)
- Discord: nick_vaz
