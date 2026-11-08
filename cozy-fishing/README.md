# Cozy Fishing — MiniGames Creative Extension

A 2D fishing mini-game built as a creative extension of MiniGames for RS School's JS/FE Short Track.

## Play

- **Live demo:** See the final Pull Request description for the up-to-date public Vercel Preview link.
- Open MiniGames → Library → **Cast n Chill** → **Play Now**, or use the direct `/cozy-fishing.html` route.

## Gameplay

1. Click **Cast line** to cast the fishing line.
2. Wait for a bite, then click **Hook fish!** before the fish escapes.
3. Hold the on-screen button (or **Space**) to reel in; release it to reduce line tension. Too much tension breaks the line. Losing all catch progress also loses the fish.
4. Keep your catch in the **Collection**, sell fish for coins, and discard unwanted junk. Use the collection-clear action only after confirming: clearing does not sell fish.
5. Visit the **Shop** to upgrade your rod and unlock new fishing locations.

## Locations

| Location        | Unlock cost |
| --------------- | ----------: |
| Sunset Cove     |        Free |
| Mountain River  |   500 coins |
| Tropical Lagoon | 1,000 coins |
| Winter Lake     | 1,500 coins |

Purchased locations and rods, wallet balance, and collection are persisted in browser `localStorage`.

## For the curator / reviewer

Use **🧪 Tester** to add enough test coins to purchase and try every fishing rod and location without grinding. The tester button does not unlock items automatically, so the purchase flow remains testable.

Suggested demonstration:

- Cast → Hook → Reel, including a failed catch or broken line.
- Catch a fish and sell it in Collection; discard junk and demonstrate the clear confirmation.
- Use Tester → Shop → unlock a location → travel there.
- Refresh and show that purchases and wallet balance persist.

## Technology

TypeScript, HTML, SCSS, Vite, Canvas 2D, Vitest, `localStorage`.

- `cozy-fishing/main.ts` — canvas rendering, UI and game phases.
- `cozy-fishing/game/catches.ts` — catches, probabilities and resistance.
- `cozy-fishing/game/reeling.ts` — tension and catching progress calculations.
- `cozy-fishing/game/economy.ts` — selling values and coins.
- `cozy-fishing/game/inventory.ts` — persistence of the collection.
- `cozy-fishing/game/shop.ts` — rod and location unlocks.
- `cozy-fishing/game/collection-actions.ts` — collection cleanup.
- `cozy-fishing/game/reviewer-tools.ts` — reviewer coin bonus.
- `cozy-fishing/game/*.test.ts` — unit tests for the game mechanics.

## Local development

From the **repository root**, run:

```bash
npm install
npm run dev
```

Open the local URL ending in `/cozy-fishing.html`.

Before submitting:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Notes

Gameplay uses locally stored progress; browser storage can be reset when testing from a fresh session. Backgrounds and character images are static PNG game assets, with additional animation rendered by Canvas. No backend is required for the fishing feature.
