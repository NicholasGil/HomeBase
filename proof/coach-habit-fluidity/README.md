# Coach habit fluidity (@375×812)

Regenerate: `npm run test:e2e -- e2e/coach-habit-fluidity-proof.spec.ts`

| File | What it proves |
| --- | --- |
| `discovery-empty-chips-clear-375.png` | Discovery cold open: chip center hits + scroll-end Ask clearance |
| `file-session-chips-clear-375.png` | File session: pinned chips clear docked Ask |
| `file-return-chips-clear-375.png` | File return (pricing→coach): restored thread + all 8 chip center hits + Ask center hit |

| File | Path | What it proves |
| --- | --- | --- |
| `discovery-empty-chips-clear-375.png` | Discovery Alex (no property), scroll end | Three cold-open starters stay center-tappable above the docked Ask row. |
| `file-session-chips-clear-375.png` | Alex with file + ten-second hero, scroll end | Fold starters (incl. “What happens next?” and “When do I leave…”) center-tap above Ask after scroll. |

**Layout fix:** Mobile Ask is absolutely docked inside the concierge card (no longer sticky over the scroll lane), with scroll-end inset and a single-row horizontal chip strip on file sessions so 44px targets fit between the ten-second block and Ask.
