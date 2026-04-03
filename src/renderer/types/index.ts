export interface Customer {
  id: number
  platform_name: string
  full_name: string
  mother_name: string
  phone_number: string
  card_number: string
  category: string
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

export interface InvoiceInput {
  customer_id: number
  invoice_number: string
  total_months: number
  total_amount: number
  monthly_deduction: number
  creation_date: string
  status: string
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

export interface PaymentInput {
  invoice_id: number
  payment_date: string
  amount: number
  month_number: number
  notes: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  totalCustomers: number
  activeInvoices: number
  totalRevenue: number
  totalAmount: number
  overdueInvoices: number
  completedInvoices: number
  statusBreakdown: { status: string; count: number }[]
  categoryBreakdown: { category: string; count: number }[]
  recentInvoices: any[]
}

declare global {
  interface Window {
    api: {
      customer: {
        list: (params: any) => Promise<PaginatedResult<Customer>>
        get: (id: number) => Promise<Customer>
        create: (input: CustomerInput) => Promise<Customer>
        update: (id: number, input: CustomerInput) => Promise<Customer>
        delete: (id: number) => Promise<{ success: boolean }>
        platforms: () => Promise<string[]>
        categories: () => Promise<string[]>
        reminders: (customerId: number) => Promise<any[]>
      }
      invoice: {
        list: (params: any) => Promise<PaginatedResult<Invoice>>
        get: (id: number) => Promise<Invoice>
        create: (input: InvoiceInput) => Promise<Invoice>
        update: (id: number, input: InvoiceInput) => Promise<Invoice>
        delete: (id: number) => Promise<{ success: boolean }>
        payments: (invoiceId: number) => Promise<Payment[]>
      }
      payment: {
        create: (input: PaymentInput) => Promise<Payment>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      dashboard: {
        stats: () => Promise<DashboardStats>
      }
      excel: {
        selectFile: () => Promise<string | null>
        readHeaders: (filePath: string) => Promise<string[]>
        importData: (filePath: string, mapping: any) => Promise<{ success: number; failed: number; errors: string[] }>
        exportCustomers: (filters: any) => Promise<string | null>
      }
      reminders: {
        active: () => Promise<any[]>
        all: () => Promise<any[]>
        done: (id: number, handledBy: string, handleMethod: string) => Promise<{ success: boolean }>
        postpone: (id: number, newDate: string, reason: string) => Promise<{ success: boolean }>
        reremind: (id: number, newDate: string, reason: string) => Promise<{ success: boolean }>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      platforms: {
        list: () => Promise<{ id: number; name: string }[]>
        add: (name: string) => Promise<{ success?: boolean; error?: string }>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      categories: {
        list: () => Promise<{ id: number; name: string }[]>
        add: (name: string) => Promise<{ success?: boolean; error?: string }>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      transfer: {
        customers: (ids: number[], targetPlatform: string) => Promise<{ success: boolean }>
      }
      columns: {
        list: (tableName?: string) => Promise<CustomColumn[]>
        add: (input: { display_name: string; column_type: string; table_name: string }) => Promise<CustomColumn>
        update: (id: number, display_name: string) => Promise<CustomColumn>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      users: {
        login: (username: string, password: string) => Promise<any>
        list: () => Promise<any[]>
        create: (username: string, password: string, displayName: string, role: string, permissions: string) => Promise<any>
        update: (id: number, displayName: string, password: string | null, permissions: string) => Promise<any>
        delete: (id: number) => Promise<{ success: boolean }>
      }
    }
  }
}
