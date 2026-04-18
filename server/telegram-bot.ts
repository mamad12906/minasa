import https from 'https'
import { Pool } from 'pg'
import { execSync } from 'child_process'
import dotenv from 'dotenv'
dotenv.config()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const SERVER_URL = 'http://localhost:3000'
const API_KEY = process.env.API_KEY || ''

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ===== Telegram API =====
function sendMessage(text: string, chatId = CHAT_ID) {
  const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  req.write(data)
  req.end()
}

function getUpdates(offset: number): Promise<any[]> {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`,
      method: 'GET'
    }, (res) => {
      let data = ''
      res.on('data', (d) => data += d)
      res.on('end', () => {
        try { resolve(JSON.parse(data).result || []) }
        catch { resolve([]) }
      })
    })
    req.on('error', () => resolve([]))
    req.end()
  })
}

// ===== Commands =====
async function cmdStatus(): Promise<string> {
  try {
    const pm2 = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8' })
    const processes = JSON.parse(pm2)
    const minasa = processes.find((p: any) => p.name === 'minasa')
    if (!minasa) return '🔴 <b>السيرفر متوقف</b>'

    const uptime = Math.floor((Date.now() - minasa.pm2_env.pm_uptime) / 1000 / 60)
    const mem = (minasa.monit.memory / 1024 / 1024).toFixed(1)
    const cpu = minasa.monit.cpu
    const restarts = minasa.pm2_env.restart_time

    return `🟢 <b>السيرفر شغّال</b>

⏱ مدة التشغيل: <b>${uptime > 60 ? Math.floor(uptime/60) + ' ساعة ' + (uptime%60) + ' دقيقة' : uptime + ' دقيقة'}</b>
💾 الذاكرة: <b>${mem} MB</b>
⚡ CPU: <b>${cpu}%</b>
🔄 إعادات تشغيل: <b>${restarts}</b>`
  } catch {
    return '🔴 <b>السيرفر متوقف أو PM2 غير متاح</b>'
  }
}

async function cmdCustomers(): Promise<string> {
  try {
    const total = (await pool.query('SELECT COUNT(*) as c FROM customers')).rows[0].c
    const today = (await pool.query("SELECT COUNT(*) as c FROM customers WHERE created_at::date = CURRENT_DATE")).rows[0].c
    const week = (await pool.query("SELECT COUNT(*) as c FROM customers WHERE created_at > NOW() - INTERVAL '7 days'")).rows[0].c

    // Top 5 by category
    const cats = (await pool.query("SELECT category, COUNT(*) as c FROM customers WHERE category != '' GROUP BY category ORDER BY c DESC LIMIT 5")).rows

    let text = `👥 <b>إحصائيات الزبائن</b>

📊 الإجمالي: <b>${total}</b>
📅 اليوم: <b>${today}</b>
📆 آخر 7 أيام: <b>${week}</b>`

    if (cats.length > 0) {
      text += '\n\n📋 <b>الأصناف:</b>'
      cats.forEach((c: any) => { text += `\n  • ${c.category}: <b>${c.c}</b>` })
    }
    return text
  } catch (e: any) {
    return '❌ خطأ: ' + e.message
  }
}

async function cmdUsers(): Promise<string> {
  try {
    const users = (await pool.query(`
      SELECT u.display_name, u.role, u.platform_name,
        (SELECT COUNT(*) FROM customers c WHERE c.user_id = u.id) as customer_count
      FROM users u ORDER BY customer_count DESC
    `)).rows

    let text = `👤 <b>المستخدمين (${users.length})</b>\n`
    users.forEach((u: any) => {
      const role = u.role === 'admin' ? '👑' : '👤'
      text += `\n${role} <b>${u.display_name}</b>`
      if (u.platform_name) text += ` | ${u.platform_name}`
      text += ` | ${u.customer_count} زبون`
    })
    return text
  } catch (e: any) {
    return '❌ خطأ: ' + e.message
  }
}

async function cmdSystem(): Promise<string> {
  try {
    const mem = execSync("free -h | grep Mem | awk '{print $2, $3, $4}'", { encoding: 'utf-8' }).trim().split(' ')
    const disk = execSync("df -h / | tail -1 | awk '{print $2, $3, $5}'", { encoding: 'utf-8' }).trim().split(' ')
    const uptime = execSync('uptime -p', { encoding: 'utf-8' }).trim()
    const load = execSync("cat /proc/loadavg | awk '{print $1, $2, $3}'", { encoding: 'utf-8' }).trim()

    return `🖥 <b>حالة النظام</b>

💾 <b>الذاكرة:</b>
  الكلي: ${mem[0]} | المستخدم: ${mem[1]} | المتاح: ${mem[2]}

💿 <b>القرص:</b>
  الكلي: ${disk[0]} | المستخدم: ${disk[1]} | النسبة: ${disk[2]}

⏱ <b>التشغيل:</b> ${uptime.replace('up ', '')}
📈 <b>الحمل:</b> ${load}`
  } catch (e: any) {
    return '❌ خطأ: ' + e.message
  }
}

async function cmdLogs(): Promise<string> {
  try {
    const logs = execSync('pm2 logs minasa --nostream --lines 10 2>&1', { encoding: 'utf-8' })
    const lines = logs.split('\n').filter(l => l.trim()).slice(-10)
    return `📋 <b>آخر السجلات:</b>\n\n<code>${lines.join('\n').slice(0, 3000)}</code>`
  } catch {
    return '❌ لا يوجد سجلات'
  }
}

async function cmdRestart(): Promise<string> {
  try {
    execSync('pm2 restart minasa')
    return '✅ <b>تم إعادة تشغيل السيرفر</b>'
  } catch (e: any) {
    return '❌ فشل: ' + e.message
  }
}

async function cmdSearch(query: string): Promise<string> {
  try {
    const results = (await pool.query(
      "SELECT full_name, phone_number, category, ministry_name FROM customers WHERE full_name ILIKE $1 OR phone_number ILIKE $1 LIMIT 10",
      [`%${query}%`]
    )).rows
    if (results.length === 0) return `🔍 لا نتائج لـ "${query}"`
    let text = `🔍 <b>نتائج البحث عن "${query}" (${results.length}):</b>\n`
    results.forEach((c: any, i: number) => {
      text += `\n${i+1}. <b>${c.full_name}</b>`
      if (c.phone_number) text += ` | 📱 ${c.phone_number}`
      if (c.category) text += ` | ${c.category}`
    })
    return text
  } catch (e: any) {
    return '❌ خطأ: ' + e.message
  }
}

async function cmdBackup(): Promise<string> {
  try {
    const date = new Date().toISOString().split('T')[0]
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
    const file = `/root/backups/minasa-${date}_${time}.sql`
    execSync('mkdir -p /root/backups')
    execSync(`pg_dump -U minasa_user minasa > ${file} 2>/dev/null || sudo -u postgres pg_dump minasa > ${file}`)
    const size = execSync(`ls -lh ${file} | awk '{print $5}'`, { encoding: 'utf-8' }).trim()
    return `💾 <b>تم النسخ الاحتياطي</b>\n📄 ${file}\n📦 الحجم: ${size}`
  } catch (e: any) {
    return '❌ فشل النسخ: ' + e.message
  }
}

async function cmdHelp(): Promise<string> {
  return `🤖 <b>أوامر بوت منصة</b>

/status - حالة السيرفر
/customers - إحصائيات الزبائن
/users - قائمة المستخدمين
/system - حالة النظام (ذاكرة، قرص)
/logs - آخر السجلات
/restart - إعادة تشغيل السيرفر
/backup - نسخ احتياطي لقاعدة البيانات
/search [اسم أو رقم] - بحث عن زبون
/help - هذه القائمة

<i>يتم فحص السيرفر تلقائياً كل 5 دقائق</i>`
}

// ===== Auto Monitor =====
let lastServerState = true

async function autoCheck() {
  try {
    const pm2 = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8' })
    const processes = JSON.parse(pm2)
    const minasa = processes.find((p: any) => p.name === 'minasa')
    const isRunning = minasa && minasa.pm2_env.status === 'online'

    if (!isRunning && lastServerState) {
      sendMessage('🚨 <b>تنبيه: السيرفر توقف!</b>\n\nاستخدم /restart لإعادة التشغيل')
      lastServerState = false
    } else if (isRunning && !lastServerState) {
      sendMessage('✅ <b>السيرفر عاد للعمل</b>')
      lastServerState = true
    }
  } catch (err) { console.error('[telegram-bot] Auto-check failed:', err) }
}

// Check every 5 minutes
setInterval(autoCheck, 5 * 60 * 1000)

// Daily report at 8 AM
function scheduleDailyReport() {
  const now = new Date()
  const next8AM = new Date()
  next8AM.setHours(8, 0, 0, 0)
  if (now > next8AM) next8AM.setDate(next8AM.getDate() + 1)
  const delay = next8AM.getTime() - now.getTime()

  setTimeout(async () => {
    const status = await cmdStatus()
    const customers = await cmdCustomers()
    const system = await cmdSystem()
    sendMessage(`📊 <b>التقرير اليومي - ${new Date().toLocaleDateString('ar-IQ')}</b>\n\n${status}\n\n${customers}\n\n${system}`)
    setInterval(async () => {
      const s = await cmdStatus()
      const c = await cmdCustomers()
      const sys = await cmdSystem()
      sendMessage(`📊 <b>التقرير اليومي - ${new Date().toLocaleDateString('ar-IQ')}</b>\n\n${s}\n\n${c}\n\n${sys}`)
    }, 24 * 60 * 60 * 1000)
  }, delay)
}

// ===== Main Loop =====
async function main() {
  console.log('🤖 Telegram bot started')
  sendMessage('🟢 <b>بوت المراقبة بدأ العمل</b>\n\nأرسل /help لعرض الأوامر')
  scheduleDailyReport()

  let offset = 0
  while (true) {
    try {
      const updates = await getUpdates(offset)
      for (const update of updates) {
        offset = update.update_id + 1
        const msg = update.message
        if (!msg || !msg.text) continue

        const chatId = msg.chat.id.toString()
        const text = msg.text.trim()
        const cmd = text.split(' ')[0].toLowerCase()
        const args = text.split(' ').slice(1).join(' ')

        let reply = ''
        switch (cmd) {
          case '/start': case '/help': reply = await cmdHelp(); break
          case '/status': reply = await cmdStatus(); break
          case '/customers': reply = await cmdCustomers(); break
          case '/users': reply = await cmdUsers(); break
          case '/system': reply = await cmdSystem(); break
          case '/logs': reply = await cmdLogs(); break
          case '/restart': reply = await cmdRestart(); break
          case '/backup': reply = await cmdBackup(); break
          case '/search':
            if (!args) { reply = '❌ اكتب: /search اسم أو رقم'; break }
            reply = await cmdSearch(args); break
          default:
            if (text.startsWith('/')) reply = '❓ أمر غير معروف. أرسل /help'
        }

        if (reply) sendMessage(reply, chatId)
      }
    } catch (e) {
      console.error('Bot error:', e)
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

main()
