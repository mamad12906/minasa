/**
 * In-process last-seen tracker.
 *
 * Every authenticated request bumps the user's timestamp. Admin can query
 * `/api/users/online` to see who's active and when each user was last seen.
 *
 * Not persisted — on restart the map clears and refills as users hit the
 * server again. That's fine for a "who's around right now" indicator.
 */

const _lastSeen = new Map<number, number>()

export function touch(userId: number | undefined): void {
  if (userId == null) return
  _lastSeen.set(userId, Date.now())
}

/**
 * Returns `{ userId: lastSeenMs }` for every user who has touched the server.
 * Entries older than [keepFor] ms are pruned to stop the map growing without
 * bound. Default 30 days — matches the JWT lifetime.
 */
export function snapshot(keepForMs: number = 30 * 24 * 60 * 60 * 1000):
    Record<number, number> {
  const now = Date.now()
  const out: Record<number, number> = {}
  for (const [id, ts] of _lastSeen) {
    if (now - ts > keepForMs) {
      _lastSeen.delete(id)
      continue
    }
    out[id] = ts
  }
  return out
}
