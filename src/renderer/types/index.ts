export interface Customer {
  id: number
  platform_name: string
  full_name: string
  mother_name: string
  phone_number: string
  card_number: string
  category: string
  ministry_name: string
  status_note: string
  months_count: number
  notes: string
  user_id: number
  reminder_date: string
  reminder_text: string
  created_at: string
  updated_at: string
  [key: string]: any // custom columns
}

export interface CustomColumn {
  id: number
  column_name: string
  display_name: string
  column_type: string
  table_name: string
  sort_order: number
}

export interface CustomerInput {
  platform_name: string
  full_name: string
  mother_name: string
  phone_number: string
  card_number: string
  category: string
  ministry_name?: string
  status_note?: string
  months_count?: number
  notes?: string
  user_id?: number
  reminder_date?: string
  reminder_text?: string
}

export interface Reminder {
  id: number
  customer_id: number
  reminder_date: string
  reminder_text: string
  is_done: number
  handled_by: string
  handled_at: string
  is_postponed: number
  postpone_reason: string
  original_date: string
  handle_method: string
  created_at: string
  full_name?: string
  phone_number?: string
  ministry_name?: string
}

export interface UserData {
  id: number
  username: string
  display_name: string
  role: string
  permissions: string
  platform_name: string
  customer_count?: number
  created_at: string
}

export interface Invoice {
  id: number
  customer_id: number
  invoice_number: string
  total_months: number
  total_amount: number
  monthly_deduction: number
  creation_date: string
  status: string
  created_at: string
  updated_at: string
  customer_name?: string
  customer_phone?: string
  platform_name?: string
}

export interface Payment {
  id: number
  invoice_id: number
  payment_date: string
  amount: number
  month_number: number
  notes: string
  created_at: string
}

export interface Platform {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  totalCustomers: number
  categoryBreakdown: { category: string; count: number }[]
  ministryBreakdown: { ministry_name: string; count: number }[]
  employeeStats: { id: number; display_name: string; customer_count: number }[]
  recentCustomers: Customer[]
}

declare global {
  interface Window {
    api: {
      customer: {
        list: (params: any) => Promise<PaginatedResult<Customer>>
        get: (id: number) => Promise<Customer>
        create: (input: any) => Promise<Customer>
        update: (id: number, input: any) => Promise<Customer>
        delete: (id: number) => Promise<{ success: boolean }>
        platforms: () => Promise<string[]>
        categories: () => Promise<string[]>
        reminders: (customerId: number) => Promise<Reminder[]>
      }
      dashboard: {
        stats: (userId?: number) => Promise<DashboardStats>
      }
      reminders: {
        active: (userId?: number) => Promise<Reminder[]>
        all: (userId?: number) => Promise<Reminder[]>
        done: (id: number, handledBy: string, handleMethod: string) => Promise<{ success: boolean }>
        postpone: (id: number, newDate: string, reason: string) => Promise<{ success: boolean }>
        reremind: (id: number, newDate: string, reason: string) => Promise<{ success: boolean }>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      users: {
        login: (username: string, password: string) => Promise<UserData | null>
        list: () => Promise<UserData[]>
        create: (username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) => Promise<UserData>
        update: (id: number, displayName: string, password: string | null, permissions: string, platformName: string) => Promise<UserData>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      platforms: {
        list: () => Promise<Platform[]>
        add: (name: string) => Promise<any>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      categories: {
        list: () => Promise<Category[]>
        add: (name: string) => Promise<any>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      transfer: {
        customers: (ids: number[], targetPlatform: string) => Promise<{ success: boolean }>
      }
      columns: {
        list: (tableName?: string) => Promise<CustomColumn[]>
        add: (input: { display_name: string; column_type: string; table_name: string }) => Promise<CustomColumn>
        update: (id: number, displayName: string) => Promise<CustomColumn>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      excel: {
        selectFile: () => Promise<string | null>
        readHeaders: (filePath: string) => Promise<string[]>
        importData: (filePath: string, mapping: any) => Promise<{ success: number; failed: number; errors: string[] }>
      }
      backup: {
        database: () => Promise<string | null>
        restore: () => Promise<{ success: boolean; message?: string } | null>
        excelAll: () => Promise<string | null>
        excelUser: (userId: number, userName: string) => Promise<string | null>
        autoSetup: (dir: string, hours: number) => Promise<{ success: boolean }>
        autoStop: () => Promise<{ success: boolean }>
        autoGet: () => Promise<{ dir: string; hours: number }>
        selectDir: () => Promise<string | null>
      }
    }
  }
}
