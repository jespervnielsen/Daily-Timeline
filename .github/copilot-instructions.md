# GitHub Copilot Instructions – Daily Timeline

## What is Daily Timeline?

Daily Timeline is a daily puzzle game inspired by Wordle. Every day, players are presented with **5 historical events** and must **drag them into the correct chronological order** (oldest to newest). A fresh puzzle is available each day, and a **Random mode** lets players practice with unlimited new sets of events.

The live game is hosted at: <https://jespervnielsen.github.io/Daily-Timeline/>

---

## Game Design

### Core Loop

1. The player sees 5 historical event cards, each showing a title, image, and short description.
2. The player drags the cards to reorder them from oldest (top) to most recent (bottom).
3. After submitting, a results screen reveals the correct order and a score from 0 to 100.

### Game Modes

| Mode | Description |
|------|-------------|
| **Daily** | The same 5 events are shown to every player on a given date. Seeded by a hash of the date string, so it is deterministic and reproducible. The result is saved to `localStorage` so the player only plays it once per day. |
| **Random** | 5 events chosen at random from the full database. Unlimited replays, no persistence. |

### Scoring

Scoring rewards **relative ordering** rather than exact positions, so a nearly-correct answer still gets a good score.

The algorithm (`src/lib/calculateScore.ts`) combines two components:

- **Pair scoring** – for each consecutive pair of cards in the player's answer, check whether the left card comes before the right card in the correct order. Correct pairs earn `2 + streak × 0.5` points, where `streak` is the current run of correct pairs (combo bonus).
- **Position scoring** – for each card, award 2 pts if in the exact correct slot, 1.5 pts if off by 1, or 1 pt if off by 2 or more.

The raw score is then **normalised** to the [0, 100] range anchored to the achievable min/max for 5 items, ensuring that a perfect answer always scores 100 and the worst possible answer scores 0.

Performance tiers shown on the result screen:

| Score | Label |
|-------|-------|
| ≥ 90  | Perfect! 🏆 |
| ≥ 70  | Strong! 💪  |
| ≥ 40  | Okay! 👍    |
| < 40  | Keep trying! 😅 |

### Sharing

After completing a puzzle the player can copy a shareable emoji grid to the clipboard (🟩 = correct pair, 🟨 = off by one, 🟥 = off by two or more), similar to Wordle share cards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| UI Framework | React 19 (functional components + hooks) |
| Build Tool | Vite (with `@vitejs/plugin-react` / Oxc transpilation) |
| Styling | Plain CSS with CSS custom properties, dark theme |
| Hosting | GitHub Pages (`/Daily-Timeline/` base path) |
| Linting | ESLint with `typescript-eslint` and `eslint-plugin-react-hooks` |

There are **no external UI component libraries** and **no client-side state management library** – state is kept in `App.tsx` and passed down via props.

---

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component – game state, mode switching, persistence
├── types.ts              # Shared TypeScript interfaces (Item, ScoreResult, PairResult)
├── index.css             # Global styles (dark theme, CSS variables, responsive layout)
├── App.css               # App-level style overrides
├── components/
│   ├── GameBoard.tsx     # Drag-and-drop card list; handles mouse and touch events
│   ├── ResultScreen.tsx  # Score display, correct-order reveal, share button
│   └── PairResultRow.tsx # Single row in the pair-by-pair feedback table
├── lib/
│   ├── getDailyItems.ts  # Daily puzzle selection (date-seeded RNG) and random selection
│   └── calculateScore.ts # Scoring algorithm (pair streaks + position points + normalisation)
└── data/
    └── items.json        # Database of ~185 historical events (id, title, year, image, description, wikipedia)
```

---

## Key Implementation Details

### Data (`src/data/items.json`)

Each event object has:
```json
{
  "id": "great-pyramid",
  "title": "Great Pyramid of Giza",
  "year": -2560,
  "image": "<Wikimedia Commons URL>",
  "description": "One of the Seven Wonders of the Ancient World…",
  "wikipedia": "https://en.wikipedia.org/wiki/…"
}
```
`year` is a plain integer; negative values represent BC years.

### Daily Puzzle Selection (`src/lib/getDailyItems.ts`)

- A numeric hash is derived from the ISO date string (e.g. `"2025-06-01"`).
- A seeded pseudo-random number generator (mulberry32 or similar) uses that hash to deterministically pick 5 items from the full list.
- This guarantees every player gets the same puzzle on the same day without a server.

### Drag-and-Drop (`src/components/GameBoard.tsx`)

- Uses native HTML5 drag events (`dragstart`, `dragover`, `drop`) for desktop.
- Uses `touchstart`, `touchmove`, and `touchend` with a cloned ghost element for mobile.
- The component maintains the ordered list in local state and calls `onSubmit` with the final order.

### Persistence (`src/App.tsx`)

- On submit (daily mode only), the ordered items and score are serialised to `localStorage` under the key `timeline_played_YYYY-MM-DD`.
- On load, the app checks for a saved game and immediately shows the result screen if one exists.

---

## Coding Conventions

- All components are **React functional components** with TypeScript generics where needed.
- Prefer **explicit return types** on exported functions.
- CSS class names use **kebab-case** (e.g. `.app-header`, `.card-item`).
- Do **not** introduce external state management (Redux, Zustand, etc.) or UI libraries – keep the dependency footprint minimal.
- New historical events should be added to `src/data/items.json` following the existing schema.
- The scoring algorithm is intentionally self-contained in `calculateScore.ts`; keep it pure (no side effects).
