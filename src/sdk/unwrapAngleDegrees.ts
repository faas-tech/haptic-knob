export function unwrapAngleDegrees(
  previousUnwrappedDegrees: number | null,
  wrappedDegrees: number,
): number {
  if (previousUnwrappedDegrees == null) {
    return wrappedDegrees;
  }

  const previousWrappedDegrees = ((previousUnwrappedDegrees % 360) + 360) % 360;
  let deltaDegrees = wrappedDegrees - previousWrappedDegrees;
  if (deltaDegrees > 180) {
    deltaDegrees -= 360;
  } else if (deltaDegrees < -180) {
    deltaDegrees += 360;
  }

  return previousUnwrappedDegrees + deltaDegrees;
}
