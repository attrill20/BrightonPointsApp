# Brighton Points App

## What this app is

A personal FPL-style points tracking app for two players — **James** and **Laurie** — where each picks a squad of Brighton & Hove Albion players and earns points based on their real-world performances. The loser of each gameweek pays the winner a cash amount based on the point difference multiplied by a £-per-point multiplier.

## How it works

### Data sources
- **FPL API** (via a proxy server at `https://fpl-server-nine.vercel.app/api?endpoint=...`) provides:
  - `bootstrap-static` — all player data, team list, current gameweek
  - `fixtures` — full season fixture list with scores
  - `event/{gw}/live/` — live stats for the current GW (used for the active gameweek only)
  - `element-summary/{id}/` — per-fixture historical stats for individual players (used for past GWs)
- **Supabase** stores all persistent data: player assignments, captain selections, multiplier overrides, qualifying game flags, and gameweek results.

### Custom scoring system
Points are calculated manually (not taken directly from FPL totals) using a custom ruleset:
- Minutes played: 1pt (1–59 mins), 2pts (60+)
- Goals: 6pts (GK/DEF), 5pts (MID), 4pts (FWD)
- Assists: 3pts
- Clean sheets: 4pts (GK/DEF), 1pt (MID)
- Saves: 1pt per 3 saves
- Penalty saves: 5pts
- Bonus points: based on BPS rank within the fixture (3/2/1 for top 3)
- Defensive contribution: 2pts if a non-GK player reaches their threshold (10 for DEF, 12 for others)
- Yellow cards: -1pt, Red cards: -3pts, Own goals: -2pts, Penalties missed: -2pts

For **past gameweeks**, per-fixture stats come from `element-summary` (which gives actual awarded bonus points directly). For the **current gameweek**, bonus points are estimated by calculating BPS rank across all players in the fixture.

### Multiplier
- Default: 2 (home), 3 (away) — auto-set based on Brighton's fixture
- Can be manually overridden per gameweek/fixture and persisted to Supabase

### Double gameweeks (DGWs)
When Brighton plays twice in one GW, the fixture display splits into **GWxa / GWxb** tabs (e.g. GW33a, GW33b). Each tab shows only that fixture's points, with its own qualifying flag, multiplier, and result stored independently. The storage key for DGW sub-fixtures is the **fixture ID** (an integer in the 300s), which doesn't collide with GW numbers (1–38). Season totals resolve fixture IDs back to their GW event number via `fixturesData` when applying the "up to selected GW" cutoff.

### Player assignments
Players are assigned to James or Laurie with a `startingGameweek` and `endingGameweek`. This allows the squad to change over the season — navigating to an old GW shows the correct squad for that week.

### Captains (GW22+)
From GW22 onwards, each player can designate a captain who scores double points. Captains are locked once the fixture kicks off. The most recent captain selection carries forward to future GWs if not explicitly changed.

### Season totals
Tracks cumulative £ paid and GW wins for James and Laurie across all gameweeks marked as "qualifying". Only completed qualifying games up to and including the currently viewed GW are included.

## Key files
- `brighton-points/src/components/List/list.js` — main component, all points logic and UI
- `brighton-points/src/components/app/App.js` — data fetching, Supabase sync, state management
- `brighton-points/src/supabase/queries.js` — all Supabase read/write functions

## Before finishing any task

Always check for ESLint warnings, especially:
- `react-hooks/exhaustive-deps` — if a value is used inside a `useEffect` it must be in the dependency array. Computed values (like `selectedGwKey`) are easy to miss.

If the dev server is running, warnings appear in the terminal output after compilation. Review them before considering a task done.
