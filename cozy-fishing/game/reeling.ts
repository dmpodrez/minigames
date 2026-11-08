// A small, independent module: no DOM or Canvas code.
// A value of 100 progress means the fish is caught.
// A value of 100 tension means the fishing line breaks.

export interface ReelState {
  progress: number;
  tension: number;
  elapsed: number;
}

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

export function nextReelState(
  current: ReelState,
  holding: boolean,
  deltaSeconds: number,
  tensionMultiplier = 1,
  fishResistance = 1,
): ReelState {
  const dt = Math.max(0, Math.min(deltaSeconds, 0.05));

  // Stronger fish are slower to reel in.
  const progressChange = holding ? 26 / fishResistance : -3;

  // Rod upgrades reduce tension.
  // Stronger fish increase it.
  const tensionChange = holding ? 44 * tensionMultiplier * fishResistance : -52;

  return {
    progress: clamp(current.progress + progressChange * dt),

    tension: clamp(current.tension + tensionChange * dt),

    elapsed: current.elapsed + dt,
  };
}
