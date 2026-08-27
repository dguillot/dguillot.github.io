# It Used To Say

Static Bootstrap **v5.3.8** site that tracks movie lines replaced, muted, or deleted for TV, airlines, ratings, and streaming.

## Run it

Do not open the HTML files directly. `fetch()` needs a local server:

```bash
cd it-used-to-say
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Stack

- Bootstrap 5.3.8 via jsDelivr (official SRI hashes)
- `css/custom.css` — dark theme
- `js/app.js` — loads JSON and renders list/detail pages
- `data/movies.json` + `data/changes.json`

## Add a change

1. Add the film to `data/movies.json` if it is new.
2. Add an object to `data/changes.json` with `id`, `movieId`, `character`, `original`, `replacement`, `type`, `action`, `scene`, `notes`, `sources`.
3. `type`: `tv` | `airline` | `streaming` | `rating` | `regional`
4. `action`: `replaced` | `deleted` | `muted`

## Pages

| File | Role |
|---|---|
| `index.html` | Home + famous swaps |
| `movies.html` | Searchable index |
| `movie.html?id=` | All changes for one film |
| `change.html?id=` | One line, original vs replacement |
| `versions.html` | Glossary |
| `about.html` | Scope |
| `submit.html` | Mailto form |
