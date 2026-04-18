/**
 * Shared reminder calculation utilities (server copy).
 *
 * NOTE: This is intentionally duplicated from `src/shared/reminder-utils.ts`
 * because the server uses its own tsx runtime with a separate rootDir and
 * cannot import from `../src/shared/`. Keep these two files in sync.
 */

/**
 * Add months to a date safely, handling month-end edge cases.
 * e.g., Jan 31 + 1 month = Feb 28/29 (not Mar 3)
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const targetMonth = d.getMonth() + months
  d.setMonth(targetMonth)
  // Handle month rollover (e.g., Jan 31 + 1 = Feb 28)
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0)
  }
  return d
}

/**
 * Calculate reminder date based on customer creation and months count.
 *
 * @param createdAt - Customer creation date (ISO string or Date)
 * @param monthsCount - Total subscription months
 * @param reminderBeforeMonths - How many months before expiry to remind (default: 2)
 * @returns ISO date string (YYYY-MM-DD) for the reminder
 */
export function calculateReminderDate(
  createdAt: string | Date,
  monthsCount: number,
  reminderBeforeMonths: number = 2
): string | null {
  if (!monthsCount || monthsCount <= 0) return null

  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (isNaN(created.getTime())) return null

  // Clamp reminder_before to not exceed months_count - 1
  const clampedBefore = Math.min(reminderBeforeMonths, monthsCount - 1)
  const effectiveMonths = Math.max(monthsCount - Math.max(clampedBefore, 1), 1)

  const reminderDate = addMonths(created, effectiveMonths)
  return reminderDate.toISOString().split('T')[0]
}

/**
 * Calculate expiry date (end of subscription).
 */
export function calculateExpiryDate(
  createdAt: string | Date,
  monthsCount: number
): string | null {
  if (!monthsCount || monthsCount <= 0) return null
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (isNaN(created.getTime())) return null
  const expiry = addMonths(created, monthsCount)
  return expiry.toISOString().split('T')[0]
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Check if a reminder date is due (past or today).
 */
export function isReminderDue(reminderDate: string): boolean {
  return reminderDate <= todayISO()
}
