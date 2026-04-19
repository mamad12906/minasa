// ============================================
// Login + Invoices + Reports + WhatsApp + Admin + Settings
// ============================================

// ---------- Login ----------
const LoginScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.1fr',
    background: 'var(--bg-base)',
  }}>
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, var(--brand-deep) 0%, #062A1F 100%)',
      padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(212,165,116,0.18) 0%, transparent 60%)' }}/>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(140deg, var(--accent), var(--accent-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20V8l8-5 8 5v12M9 20v-7h6v7" stroke="#0F4C3A" strokeWidth="2" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div style={{ color: '#F5F0E8', fontWeight: 700, fontSize: 18 }}>مِناصة</div>
          <div style={{ color: '#D4A574', fontSize: 11, letterSpacing: '0.1em' }}>MINASA CRM</div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 14 }}>الإصدار ٢٫٤</div>
        <h1 style={{ fontSize: 36, color: '#F5F0E8', lineHeight: 1.3, marginBottom: 16 }}>نظام إدارة الزبائن<br/>على المنصات الحكومية</h1>
        <p style={{ color: '#A8B2AD', fontSize: 14, maxWidth: 420, lineHeight: 1.8 }}>
          منظومة متكاملة لإدارة الزبائن، الفواتير، التذكيرات، والتواصل عبر واتساب — بتصميم عربي معاصر.
        </p>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 24, color: '#6B7570', fontSize: 11 }}>
        <span>© ٢٠٢٥ مِناصة</span>
        <span>·</span>
        <span>شروط الاستخدام</span>
        <span>·</span>
        <span>الخصوصية</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>مرحباً بعودتك</div>
        <h2 style={{ fontSize: 26, marginBottom: 8 }}>تسجيل الدخول</h2>
        <p style={{ fontSize: 13, marginBottom: 28 }}>أدخل بياناتك للوصول إلى لوحة التحكم</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>اسم المستخدم</div>
            <input className="input" placeholder="admin" style={{ height: 42 }}/>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="label">كلمة المرور</span>
              <a style={{ fontSize: 11, color: 'var(--brand)' }}>نسيت كلمة المرور؟</a>
            </div>
            <input className="input" type="password" placeholder="••••••••" style={{ height: 42 }}/>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <input type="checkbox" defaultChecked/> تذكرني على هذا الجهاز
          </label>
          <button className="btn btn--primary" style={{ height: 42, marginTop: 8 }}>تسجيل الدخول</button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            <span className="dot" style={{ background: 'var(--success)', marginInlineEnd: 5 }}/> متصل بالسيرفر · v2.4.0
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ---------- Invoices ----------
const InvoicesScreen = () => {
  const invoices = [
    { n: 'INV-8934', name: 'سارة عبدالله العتيبي',   amt: 250000, date: '٢٠٢٥-٠٤-١٨', status: 'مدفوعة', tone: 'success' },
    { n: 'INV-8933', name: 'لطيفة عبدالعزيز السبيعي', amt: 180000, date: '٢٠٢٥-٠٤-١٨', status: 'مدفوعة', tone: 'success' },
    { n: 'INV-8932', name: 'محمد كاظم الحسيني',        amt: 120000, date: '٢٠٢٥-٠٤-١٧', status: 'معلّقة', tone: 'warning' },
    { n: 'INV-8931', name: 'زهراء علي الموسوي',        amt: 350000, date: '٢٠٢٥-٠٤-١٧', status: 'مدفوعة', tone: 'success' },
    { n: 'INV-8930', name: 'عبدالرحمن طارق الدليمي',   amt: 210000, date: '٢٠٢٥-٠٤-١٦', status: 'متأخرة', tone: 'danger' },
    { n: 'INV-8929', name: 'نور حسين التميمي',         amt: 165000, date: '٢٠٢٥-٠٤-١٦', status: 'مدفوعة', tone: 'success' },
    { n: 'INV-8928', name: 'فاطمة الزهراء الشمري',     amt: 420000, date: '٢٠٢٥-٠٤-١٥', status: 'مسودة',  tone: 'neutral' },
  ];
  return (
    <div style={{ padding: '20px 28px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'إجمالي الفواتير', v: '٨٬٩٣٤', sub: '+١٥ هذا اليوم', tone: 'success', icon: 'invoice' },
          { l: 'مدفوعة',           v: '٧٬٢١٠', sub: '٨٠٫٧٪',         tone: 'success', icon: 'check' },
          { l: 'معلّقة',            v: '١٬٢٠٢', sub: '١٣٫٥٪',         tone: 'warning', icon: 'clock' },
          { l: 'متأخرة',            v: '٥٢٢',   sub: '٥٫٨٪',           tone: 'danger',  icon: 'bell' },
        ].map((k,i) => (
          <div key={i} className="kpi">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="kpi__label">{k.l}</div>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `var(--${k.tone}-bg)`, color: `var(--${k.tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={k.icon} size={13}/></div>
            </div>
            <div className="kpi__value num" style={{ fontSize: 26 }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: `var(--${k.tone})`, marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
          <h3>الفواتير</h3>
          <div style={{ flex: 1 }}/>
          <div className="input-wrap" style={{ width: 240 }}><Icon name="search" size={14}/><input className="input" placeholder="بحث..." style={{ height: 34 }}/></div>
          <button className="btn btn--ghost btn--sm"><Icon name="filter" size={12}/> تصفية</button>
          <button className="btn btn--ghost btn--sm"><Icon name="download" size={12}/> تصدير</button>
          <button className="btn btn--primary btn--sm"><Icon name="plus" size={12} stroke={2.3}/> فاتورة جديدة</button>
        </div>
        <table className="dtable">
          <thead><tr><th>رقم الفاتورة</th><th>الزبون</th><th>المبلغ</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.n}>
                <td><span className="mono" style={{ fontWeight: 600 }}>#{inv.n}</span></td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{inv.name[0]}</div>{inv.name}</div></td>
                <td><span className="num" style={{ fontWeight: 600 }}>{inv.amt.toLocaleString('ar-EG')}</span> <span className="muted" style={{ fontSize: 11 }}>د.ع</span></td>
                <td className="num muted" style={{ fontSize: 12 }}>{inv.date}</td>
                <td><span className={`chip chip--${inv.tone}`} style={{ fontSize: 11 }}>{inv.status}</span></td>
                <td><div style={{ display: 'flex', gap: 2 }}><button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="eye" size={13}/></button><button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="printer" size={13}/></button><button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="more" size={13}/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------- Reports ----------
const ReportsScreen = () => (
  <div style={{ padding: '20px 28px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {[
        { t: 'تقرير الزبائن الشهري',     sub: '٥٬١٨٢ زبون · آخر ٣٠ يوم', icon: 'users',   tone: 'brand' },
        { t: 'تقرير الإيرادات',            sub: '٢٤٧٫٨م د.ع · +٥٫٤٪',       icon: 'chart',   tone: 'accent' },
        { t: 'تقرير التذكيرات المتأخرة', sub: '٧ تذكيرات · عاجل',         icon: 'bell',    tone: 'danger' },
        { t: 'تقرير أداء الموظفين',       sub: '٦ موظفين نشطين',            icon: 'crown',   tone: 'info' },
        { t: 'تقرير الوزارات',              sub: '١٤ وزارة',                   icon: 'building',tone: 'violet' },
        { t: 'تقرير الفواتير',               sub: '٨٬٩٣٤ فاتورة',               icon: 'invoice', tone: 'warning' },
      ].map((r, i) => (
        <div key={i} className="card card-hover" style={{ padding: 20, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `var(--${r.tone}${r.tone === 'brand' || r.tone === 'accent' ? '-tint' : '-bg'})`, color: `var(--${r.tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={18}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.t}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{r.sub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn--ghost btn--sm" style={{ flex: 1 }}><Icon name="eye" size={12}/> عرض</button>
            <button className="btn btn--ghost btn--sm"><Icon name="download" size={12}/></button>
            <button className="btn btn--ghost btn--sm"><Icon name="printer" size={12}/></button>
          </div>
        </div>
      ))}
    </div>

    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div className="eyebrow">آخر ١٢ شهر</div>
          <h3 style={{ fontSize: 16, marginTop: 4 }}>تطوّر الزبائن والإيرادات</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot" style={{ background: 'var(--brand)' }}/> الزبائن</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot" style={{ background: 'var(--accent)' }}/> الإيرادات</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200 }}>
        {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m, i) => {
          const h1 = 30 + Math.sin(i * 0.6) * 25 + i * 4;
          const h2 = 20 + Math.cos(i * 0.7) * 20 + i * 3;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 160 }}>
                <div style={{ flex: 1, height: `${h1}%`, background: 'var(--brand)', borderRadius: '4px 4px 0 0' }}/>
                <div style={{ flex: 1, height: `${h2}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0' }}/>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{m}</div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ---------- WhatsApp + Reminders ----------
const WhatsAppScreen = () => (
  <div style={{ padding: '20px 28px 48px' }}>
    <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 140px)', display: 'grid', gridTemplateColumns: '320px 1fr 280px' }}>
      <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(37,211,102,0.15)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="whatsapp" size={16}/></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>واتساب أعمال</div><div className="muted" style={{ fontSize: 11 }}><span className="dot" style={{ background: '#25D366' }}/> متصل</div></div>
        </div>
        <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
          <div className="input-wrap"><Icon name="search" size={14}/><input className="input" placeholder="ابحث في المحادثات..." style={{ height: 34 }}/></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[
            { n: 'سارة عبدالله', m: 'شكراً جزيلاً، استلمت البطاقة', t: '١٠:٤٢', u: 2, on: true },
            { n: 'محمد كاظم',    m: 'متى موعد المراجعة القادم؟',  t: '٠٩:١٥', u: 1, on: true },
            { n: 'زهراء علي',     m: 'تم الإرسال. تأكيد الاستلام',  t: 'أمس',    u: 0, on: false },
            { n: 'عبدالرحمن ط.',  m: 'هل يمكنني تحديث رقم هاتفي؟', t: 'أمس',    u: 0, on: true },
            { n: 'نور حسين',       m: '(ملف مرفق) بطاقة_الهوية.pdf',  t: '١٧/٤',    u: 0, on: false },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: i === 0 ? 'var(--bg-card-hover)' : 'transparent', borderRight: i === 0 ? '3px solid var(--brand)' : '3px solid transparent' }}>
              <div style={{ position: 'relative' }}>
                <div className="avatar" style={{ width: 38, height: 38 }}>{c.n[0]}</div>
                {c.on && <span style={{ position: 'absolute', bottom: 0, insetInlineStart: 0, width: 10, height: 10, borderRadius: 50, background: '#25D366', border: '2px solid var(--bg-card)' }}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{c.n}</span><span className="num muted" style={{ fontSize: 10.5 }}>{c.t}</span></div>
                <div className="truncate" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.m}</div>
              </div>
              {c.u > 0 && <div className="num" style={{ width: 20, height: 20, borderRadius: 50, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 600 }}>{c.u}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="avatar" style={{ width: 36, height: 36 }}>س</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>سارة عبدالله العتيبي</div><div className="muted" style={{ fontSize: 11 }}>متصلة الآن · ٠٧٧٠ ١٢٣ ٤٥٦٧</div></div>
          <button className="icon-btn"><Icon name="phone" size={15}/></button>
          <button className="icon-btn"><Icon name="more" size={15}/></button>
        </div>
        <div style={{ flex: 1, padding: 20, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}><span className="chip chip--neutral" style={{ fontSize: 10.5 }}>اليوم</span></div>
          {[
            { me: false, t: 'السلام عليكم، أود الاستفسار عن موعد استلام البطاقة',     tm: '١٠:٣٠' },
            { me: true,  t: 'وعليكم السلام، تفضلي أستاذة سارة. بطاقتكم جاهزة للاستلام.', tm: '١٠:٣٢' },
            { me: true,  t: 'يمكنكِ الحضور أي يوم ما عدا الجمعة، من ٩ إلى ٢ ظهراً.',       tm: '١٠:٣٢' },
            { me: false, t: 'شكراً جزيلاً، استلمت البطاقة',                                tm: '١٠:٤٢' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: b.me ? 'flex-start' : 'flex-end' }}>
              <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: b.me ? '12px 12px 3px 12px' : '12px 12px 12px 3px', background: b.me ? 'var(--brand-tint)' : 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 13, lineHeight: 1.6 }}>
                {b.t}
                <div className="num muted" style={{ fontSize: 10, textAlign: 'left', marginTop: 3 }}>{b.tm} {b.me && '✓✓'}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button className="icon-btn"><Icon name="folder" size={16}/></button>
          <input className="input" placeholder="اكتب رسالة..." style={{ flex: 1 }}/>
          <button className="btn btn--primary" style={{ width: 40, padding: 0 }}><Icon name="arrow_left" size={16}/></button>
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <h4 style={{ marginBottom: 12 }}>قوالب جاهزة</h4>
        {['تذكير بالمدة', 'طلب وثائق', 'تأكيد الموعد', 'إشعار انتهاء', 'تحية عامة'].map((t, i) => (
          <div key={i} style={{ padding: '10px 12px', marginBottom: 6, borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12.5, cursor: 'pointer' }}>{t}</div>
        ))}
        <div className="hr" style={{ margin: '16px 0' }}/>
        <h4 style={{ marginBottom: 10 }}>الإرسال الجماعي</h4>
        <button className="btn btn--ghost btn--sm" style={{ width: '100%', marginBottom: 6 }}><Icon name="users" size={12}/> ٥٬١٨٢ زبون</button>
        <button className="btn btn--primary btn--sm" style={{ width: '100%' }}><Icon name="message" size={12}/> جدولة حملة</button>
      </div>
    </div>
  </div>
);

// ---------- Admin Panel ----------
const AdminScreen = () => (
  <div style={{ padding: '20px 28px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {[
        { l: 'المستخدمون النشطون', v: '٦',    tone: 'success', icon: 'users' },
        { l: 'الأدمن',              v: '٢',    tone: 'accent',  icon: 'crown' },
        { l: 'آخر نسخة احتياطية',   v: 'اليوم ١٣:٤٢', tone: 'brand',   icon: 'save', small: true },
        { l: 'حجم قاعدة البيانات',  v: '٢٫٤ ج.ب', tone: 'info',    icon: 'database', small: true },
      ].map((k,i) => (
        <div key={i} className="kpi">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="kpi__label">{k.l}</div>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `var(--${k.tone}${k.tone === 'brand' || k.tone === 'accent' ? '-tint' : '-bg'})`, color: `var(--${k.tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={k.icon} size={13}/></div>
          </div>
          <div className="num" style={{ fontSize: k.small ? 18 : 30, fontWeight: 600, marginTop: 10 }}>{k.v}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <h3>الموظفون والصلاحيات</h3>
          <div style={{ flex: 1 }}/>
          <button className="btn btn--primary btn--sm"><Icon name="plus" size={12} stroke={2.3}/> موظف جديد</button>
        </div>
        <table className="dtable">
          <thead><tr><th>الموظف</th><th>الدور</th><th>الصلاحيات</th><th>آخر دخول</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {[
              { n: 'فاتن المحمد',   r: 'أدمن',   p: ['الكل'],                  last: 'الآن',      s: true,  c: '#D4A574', i: 'ف.م' },
              { n: 'ريم الجبوري',    r: 'موظفة', p: ['زبائن','فواتير','تقارير'], last: 'قبل ٥د',  s: true,  c: '#60A5FA', i: 'ر.ج' },
              { n: 'عبير العزاوي',   r: 'موظفة', p: ['زبائن','فواتير'],          last: 'قبل ساعة', s: true,  c: '#A78BFA', i: 'ع.ع' },
              { n: 'منى الساعدي',   r: 'موظفة', p: ['زبائن'],                    last: '١٣:٢٠',    s: true,  c: '#4ADE80', i: 'م.س' },
              { n: 'سارة الركابي',   r: 'موظفة', p: ['زبائن','استيراد'],         last: 'أمس',       s: false, c: '#FBBF24', i: 'س.ر' },
              { n: 'هدى الخفاجي',   r: 'موظفة', p: ['زبائن'],                    last: '١٦/٤',      s: false, c: '#F87171', i: 'ه.خ' },
            ].map((u, i) => (
              <tr key={i}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: `${u.c}22`, color: u.c }}>{u.i}</div><span style={{ fontWeight: 500 }}>{u.n}</span></div></td>
                <td>{u.r === 'أدمن' ? <span className="chip chip--accent" style={{ fontSize: 11 }}><Icon name="crown" size={11} stroke={2.3}/> أدمن</span> : <span className="chip chip--neutral" style={{ fontSize: 11 }}>{u.r}</span>}</td>
                <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{u.p.map((pp, j) => <span key={j} className="chip chip--brand" style={{ fontSize: 10.5 }}>{pp}</span>)}</div></td>
                <td className="muted" style={{ fontSize: 12 }}>{u.last}</td>
                <td><span className={`chip chip--${u.s ? 'success' : 'neutral'}`} style={{ fontSize: 11 }}><span className="dot" style={{ background: 'currentColor' }}/>{u.s ? 'نشط' : 'غير متصل'}</span></td>
                <td><button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="edit" size={13}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><Icon name="history" size={15}/><h3>سجل التغييرات الأخير</h3></div>
        {[
          { who: 'ف.م', a: 'أضافت موظفة جديدة',   sub: 'هدى الخفاجي', t: 'قبل ٢د', tone: 'success' },
          { who: 'ر.ج', a: 'عدّلت زبون',           sub: 'زهراء علي',    t: 'قبل ١٥د', tone: 'info' },
          { who: 'ف.م', a: 'غيّرت صلاحية',          sub: 'عبير العزاوي', t: 'قبل ساعة', tone: 'accent' },
          { who: 'ع.ع', a: 'حذفت زبون',             sub: 'تجريبي',       t: '١١:٢٠',   tone: 'danger' },
          { who: 'ف.م', a: 'أطلقت نسخة احتياطية', sub: '٢٫٤ ج.ب',      t: '١٣:٤٢',   tone: 'brand' },
          { who: 'م.س', a: 'استوردت Excel',          sub: '٤٢٠ زبون',      t: 'أمس',     tone: 'info' },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{e.who}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5 }}><strong>{e.a}</strong> · <span className="muted">{e.sub}</span></div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{e.t}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---------- Settings / Backup ----------
const SettingsScreen = () => (
  <div style={{ padding: '20px 28px 48px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14 }}>
    <div className="card" style={{ padding: 10, alignSelf: 'flex-start' }}>
      {[
        { i: 'settings', t: 'عام',           active: true },
        { i: 'users',    t: 'الحساب' },
        { i: 'save',     t: 'نسخ احتياطي' },
        { i: 'database', t: 'قاعدة البيانات' },
        { i: 'whatsapp', t: 'واتساب' },
        { i: 'bell',     t: 'التنبيهات' },
        { i: 'shield',   t: 'الأمان' },
      ].map((m, i) => (
        <button key={i} className="btn btn--quiet" style={{ width: '100%', justifyContent: 'flex-start', height: 36, background: m.active ? 'var(--brand-tint)' : 'transparent', color: m.active ? 'var(--brand)' : 'var(--text-secondary)' }}>
          <Icon name={m.i} size={14}/> {m.t}
        </button>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <h3 style={{ marginBottom: 4 }}>الإعدادات العامة</h3>
        <p style={{ fontSize: 12.5, marginBottom: 22 }}>تخصيص المظهر واللغة والتفضيلات العامة للنظام.</p>
        {[
          { l: 'الوضع الداكن',       sub: 'تبديل بين الواجهة الفاتحة والداكنة',       toggle: true, on: true },
          { l: 'اللغة',                sub: 'لغة الواجهة الرئيسية',                   val: 'العربية' },
          { l: 'كثافة الجدول',         sub: 'المسافات بين الصفوف',                   val: 'مريحة' },
          { l: 'التحديث التلقائي',     sub: 'تحديث البيانات كل ٥ دقائق',              toggle: true, on: true },
          { l: 'إشعارات التذكيرات',    sub: 'تنبيه عند اقتراب أو تجاوز موعد التذكير', toggle: true, on: true },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>{s.l}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{s.sub}</div>
            </div>
            {s.toggle ? (
              <div style={{ width: 38, height: 22, borderRadius: 12, background: s.on ? 'var(--brand)' : 'var(--border-strong)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 2, insetInlineStart: s.on ? 18 : 2, width: 18, height: 18, borderRadius: 50, background: 'white', transition: 'inset-inline-start 0.2s' }}/>
              </div>
            ) : <button className="btn btn--ghost btn--sm">{s.val} <Icon name="arrow_down" size={11} stroke={2.3}/></button>}
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="save" size={15}/></div>
          <div style={{ flex: 1 }}><h3>النسخ الاحتياطي</h3><div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>آخر نسخة: اليوم الساعة ١٣:٤٢ — <span style={{ color: 'var(--success)' }}>نجحت</span></div></div>
          <button className="btn btn--primary btn--sm"><Icon name="save" size={12}/> نسخة احتياطية الآن</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { d: '٢٠٢٥-٠٤-١٨ ١٣:٤٢', s: '٢٫٤ ج.ب', ok: true },
            { d: '٢٠٢٥-٠٤-١٧ ١٣:٤٢', s: '٢٫٣ ج.ب', ok: true },
            { d: '٢٠٢٥-٠٤-١٦ ١٣:٤٢', s: '٢٫٣ ج.ب', ok: true },
          ].map((b, i) => (
            <div key={i} className="card-flat" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon name="file" size={13}/>
                <span className="num" style={{ fontSize: 12 }}>{b.d}</span>
              </div>
              <div className="num muted" style={{ fontSize: 11, marginBottom: 8 }}>{b.s}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn--ghost btn--sm" style={{ flex: 1, height: 26, fontSize: 11 }}><Icon name="download" size={11}/> تحميل</button>
                <button className="btn btn--ghost btn--sm" style={{ height: 26, padding: '0 8px' }}><Icon name="history" size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  LoginScreen,
  InvoicesScreen,
  ReportsDeskScreen: ReportsScreen,
  WhatsAppScreen,
  AdminScreen,
  SettingsDeskScreen: SettingsScreen,
});
