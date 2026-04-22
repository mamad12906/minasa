import { z } from 'zod'

/**
 * Shared input validation schemas.
 *
 * Mount with `validate(Schema)` middleware on routes that accept user input.
 * Only validates shape/length — business rules (uniqueness, ownership) stay
 * in the route handlers.
 */

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(128),
  display_name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).optional(),
  permissions: z.string().max(2000).optional(),
  platform_name: z.string().max(200).optional(),
})

export const UpdateUserSchema = z.object({
  display_name: z.string().min(1).max(100),
  password: z.string().min(6).max(128).optional().nullable(),
  permissions: z.string().max(2000).optional(),
  platform_name: z.string().max(200).optional(),
})

export const CreateCustomerSchema = z.object({
  full_name: z.string().min(1).max(200),
  mother_name: z.string().max(200).optional(),
  nickname: z.string().max(200).optional(),
  // Phone is now required. Min 1 rejects blank strings — we accept any format
  // so validators don't fight international numbers or legacy data.
  phone_number: z.string().min(1, 'رقم الهاتف مطلوب').max(30),
  card_number: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  ministry_name: z.string().max(200).optional(),
  platform_name: z.string().max(200).optional(),
  status_note: z.string().max(500).optional(),
  reminder_date: z.string().max(20).optional(),
  reminder_text: z.string().max(500).optional(),
  months_count: z.number().int().min(0).max(999).optional(),
  reminder_before: z.number().int().min(0).max(120).optional(),
  notes: z.string().max(5000).optional(),
  user_id: z.number().int().optional(),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  full_name: z.string().min(1).max(200),
  phone_number: z.string().min(1, 'رقم الهاتف مطلوب').max(30),
})

export const NameOnlySchema = z.object({
  name: z.string().min(1).max(200),
})

export const CreateInvoiceSchema = z.object({
  customer_id: z.number().int().positive(),
  customer_name: z.string().max(200).optional(),
  customer_phone: z.string().max(30).optional(),
  platform_name: z.string().max(200).optional(),
  amount: z.number().nonnegative(),
  paid_amount: z.number().nonnegative().optional(),
  status: z.string().max(20).optional(),
  due_date: z.string().max(20).optional(),
  notes: z.string().max(5000).optional(),
})

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial()

// Reminder action schemas — short-form bodies, but still capped so a rogue
// client can't cram multi-MB strings into handled_by/reason fields and spam
// the audit log.
export const ReminderDoneSchema = z.object({
  handled_by: z.string().max(100).optional(),
  handle_method: z.string().max(50).optional(),
})

export const ReminderPostponeSchema = z.object({
  new_date: z.string().min(1).max(20),
  reason: z.string().max(500).optional(),
})

export const ReminderRemindSchema = ReminderPostponeSchema

export const UpdateReminderSchema = z.object({
  reminder_date: z.string().max(20).optional(),
  reminder_text: z.string().max(500).optional(),
})

/**
 * Express middleware factory that validates `req.body` against a zod schema.
 * On failure, responds with 400 + a short Arabic message and the first error
 * path, and does NOT call next().
 */
export function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const issue = result.error.issues[0]
      const field = issue.path.join('.')
      return res.status(400).json({
        error: `بيانات غير صالحة${field ? ` (${field})` : ''}: ${issue.message}`,
        field,
      })
    }
    req.body = result.data
    next()
  }
}
