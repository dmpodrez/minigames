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
): ReelState {
  // Cap the time step, e.g. if the user switches browser tabs.
  const dt = Math.max(0, Math.min(deltaSeconds, 0.05));

  return {
    progress: clamp(current.progress + (holding ? 26 : -3) * dt),
    tension: clamp(current.tension + (holding ? 44 : -52) * dt),
    elapsed: current.elapsed + dt,
  };
}
