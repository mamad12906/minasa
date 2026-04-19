import { EventEmitter } from 'events'

/**
 * Global in-process event bus.
 *
 * Every route that mutates a shared resource calls `emit(event)`; the SSE
 * `/api/events` handler subscribes and streams events to connected admins.
 *
 * This is not durable — clients that miss a window re-sync via the regular
 * pull path on reconnect. SSE is best-effort notification, not the source of
 * truth. Scale limit: hundreds of concurrent admins on a single process.
 */

export type AppEventKind =
  | 'customer.created' | 'customer.updated' | 'customer.deleted'
  | 'reminder.created' | 'reminder.updated' | 'reminder.deleted' | 'reminder.done'
  | 'invoice.created' | 'invoice.updated' | 'invoice.deleted'
  | 'ministry.created' | 'ministry.deleted'
  | 'category.created' | 'category.deleted'
  | 'platform.created' | 'platform.deleted'
  | 'user.created'  | 'user.updated'  | 'user.deleted'  | 'user.password_reset'
  | 'auth.login'    | 'auth.login_failed'
  | 'heartbeat'

export interface AppEvent {
  kind: AppEventKind
  actor?: { id: number; username: string } | null
  entity_id?: number | null
  entity_name?: string
  details?: string
  at: number
}

class Bus extends EventEmitter {
  emitEvent(partial: Omit<AppEvent, 'at'>): void {
    const event: AppEvent = { ...partial, at: Date.now() }
    this.emit('event', event)
  }
}

export const bus = new Bus()
// Events are pure notifications — no back-pressure / no replay / no ordering
// guarantees beyond in-process Node semantics.
bus.setMaxListeners(200)

/**
 * Fire-and-forget helper used from route handlers.
 *
 *   emitEvent('customer.created', req.user, customer.id, customer.full_name)
 */
export function emitEvent(
  kind: AppEventKind,
  actor: { id?: number; username?: string } | null | undefined,
  entityId: number | null = null,
  entityName: string = '',
  details: string = '',
): void {
  try {
    bus.emitEvent({
      kind,
      actor: actor && actor.id != null
        ? { id: actor.id, username: actor.username || '' }
        : null,
      entity_id: entityId,
      entity_name: entityName,
      details: details.slice(0, 500),
    })
  } catch (e) {
    // never let telemetry crash a mutation path
    console.error('[events.emit]', (e as Error).message)
  }
}
