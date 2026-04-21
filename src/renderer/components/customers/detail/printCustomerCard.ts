import dayjs from 'dayjs'
import type { Customer } from '../../../types'

// Opens a new window with a printable HTML card for the given customer.
// Extracted from CustomerDetailPage so the page component only owns UI state.
export function printCustomerCard(customer: Customer): void {
  const endDate = customer.months_count && customer.created_at
    ? dayjs(customer.created_at).add(customer.months_count, 'month').format('YYYY-MM-DD')
    : '-'
  const w = window.open('', '_blank', 'width=600,height=800')
  if (!w) return
  w.document.write(`<html dir="rtl"><head><title>بطاقة زبون</title>
    <style>body{font-family:'Segoe UI',Tahoma,Arial;padding:30px;color:#1A1F1C}
    h1{text-align:center;color:#0F4C3A;border-bottom:3px solid #0F4C3A;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    td,th{padding:10px 14px;border:1px solid #E2DED5;text-align:right}
    th{background:#F7F5F0;font-weight:600;width:35%}
    .f{text-align:center;margin-top:30px;color:#94A3B8;font-size:12px}</style></head><body>
    <h1>بطاقة زبون - منصة</h1><table>
    <tr><th>الاسم</th><td>${customer.full_name}</td></tr>
    <tr><th>اسم الأم</th><td>${customer.mother_name || '-'}</td></tr>
    <tr><th>الهاتف</th><td>${customer.phone_number || '-'}</td></tr>
    <tr><th>البطاقة</th><td>${customer.card_number || '-'}</td></tr>
    <tr><th>المنصة</th><td>${customer.platform_name || '-'}</td></tr>
    <tr><th>الوزارة</th><td>${customer.ministry_name || '-'}</td></tr>
    <tr><th>الصنف</th><td>${customer.category || '-'}</td></tr>
    <tr><th>الحالة</th><td>${customer.status_note || '-'}</td></tr>
    <tr><th>الأشهر</th><td>${customer.months_count || '-'}</td></tr>
    <tr><th>الانتهاء</th><td>${endDate}</td></tr>
    <tr><th>ملاحظات</th><td>${customer.notes || '-'}</td></tr>
    </table><div class="f">طُبعت ${dayjs().format('YYYY-MM-DD')} | منصة</div></body></html>`)
  w.document.close()
  setTimeout(() => w.print(), 500)
}
