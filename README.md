# FARM PULSE — Research Project Website (R26-IT-068)

Static website for **Farm Pulse**, an AI-powered smart poultry farming research project (SLIIT).
Plain HTML, CSS and vanilla JavaScript. There are no frameworks, no build step and no backend.

## Pages

| Page | File | What's on it |
|---|---|---|
| Home | `index.html` | Scroll-driven hero, the four research components, mission, team |
| Domain | `pages/domain.html` | Literature, gap, problem, objectives, methodology, technologies |
| Milestones | `pages/milestones.html` | Assessment inspector + timeline that fills as you scroll |
| Documents | `pages/documents.html` | Proposals and reports, **opened from OneDrive** |
| Slides | `pages/slides.html` | Presentation decks, **opened in PowerPoint Online** |
| About Us | `pages/about.html` | Team profiles (click a card to expand), supervisors |
| Contact | `pages/contact.html` | Contact details + mailto form |

Navigation is through the bottom dock. **Ctrl/⌘ + K** opens site search.

## Publishing documents and slides (OneDrive)

All document links are managed in **one file: `js/links.js`**.

1. In OneDrive, right-click the file, choose **Share**, then **Copy link**.
   If examiners outside SLIIT must open it, set the link to *Anyone with the link can view*.
2. Paste the link between the quotes for that item in `js/links.js`, for example:
   ```js
   'proposal-IT22139962': 'https://mysliit-my.sharepoint.com/:b:/g/personal/...',
   ```
3. Save. No HTML changes are needed:
   - **Available** items (proposals, proposal/PP1/PP2 slides) open the shared folder until a direct link is pasted, then open the file directly.
   - **Coming Soon** items (charter, checklists, final reports, final slides) switch to *Available* automatically once a link is pasted.

The "Open full OneDrive folder" buttons use `folder` in the same file.

## Editing other content

- **Placeholders** appear with an orange highlight (`class="ph"`): literature references, milestone dates and marks, and the project email.
- **Milestones:** edit `data-date` / `data-marks` and the visible text in `pages/milestones.html`.
- **Contact email:** `CONTACT_EMAIL` at the top of `js/script.js` and the form `action` in `pages/contact.html`.
- **Colours / fonts:** the `:root` variables at the top of `css/style.css`.
- The top bar, search and dock are repeated on every page. If you change them, change all seven files.

## Running locally

Double-click `index.html`, or serve the folder (closer to real hosting):

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Hosting

Upload the **contents** of this folder (keeping the structure) to any static host, such as Vercel, Netlify, GitHub Pages or Cloudflare Pages.

> The `.pptx` files in `assets/presentations/` (≈240 MB in total) are no longer linked, because slides now open from OneDrive.
> Leave them out of the upload, since many hosts reject files that large.
