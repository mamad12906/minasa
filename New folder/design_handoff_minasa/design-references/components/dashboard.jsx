// ============================================
// Dashboard — 3 variations
// ============================================

const FMT = (n) => n.toLocaleString('ar-EG');

// Mock data reflecting real schema
const DASH_DATA = {
  totalCustomers: 5182,
  totalInvoices: 8934,
  totalRevenue: 247800000, // IQD
  activeReminders: 24,
  overdueReminders: 7,
  categoryBreakdown: [
    { category: 'رعاية اجتماعية', count: 1842 },
    { category: 'رواتب متقاعدين', count: 1204 },
    { category: 'تأهيل ذوي الاحتياجات', count: 786 },
    { category: 'مستحقات عمالية',  count: 612 },
    { category: 'تعويضات',           count: 428 },
    { category: 'أخرى',              count: 310 },
  ],
  ministryBreakdown: [
    { ministry_name: 'وزارة العمل والشؤون الاجتماعية', count: 1520 },
    { ministry_name: 'وزارة المالية',                    count: 1180 },
    { ministry_name: 'وزارة الصحة',                      count: 842 },
    { ministry_name: 'وزارة التربية',                    count: 630 },
    { ministry_name: 'وزارة الداخلية',                   count: 510 },
    { ministry_name: 'وزارة التخطيط',                    count: 320 },
  ],
  employeeStats: [
    { id: 1, name: 'فاتن المحمد',   role: 'أدمن',   customer_count: 1420, initials: 'ف.م', color: '#D4A574' },
    { id: 2, name: 'ريم الجبوري',    role: 'موظفة', customer_count: 1108, initials: 'ر.ج', color: '#60A5FA' },
    { id: 3, name: 'عبير العزاوي',   role: 'موظفة', customer_count: 980,  initials: 'ع.ع', color: '#A78BFA' },
    { id: 4, name: 'منى الساعدي',   role: 'موظفة', customer_count: 842,  initials: 'م.س', color: '#4ADE80' },
    { id: 5, name: 'سارة الركابي',   role: 'موظفة', customer_count: 620,  initials: 'س.ر', color: '#FBBF24' },
    { id: 6, name: 'هدى الخفاجي',   role: 'موظفة', customer_count: 212,  initials: 'ه.خ', color: '#F87171' },
  ],
  recentCustomers: [
    { id: 1, full_name: 'سارة عبدالله العتيبي',    phone: '٠٧٧٠ ١٢٣ ٤٥٦٧', ministry: 'وزارة العمل',   category: 'رعاية اجتماعية', months: 6,  added: 'قبل ١٢ دقيقة',  user: 'ر.ج' },
    { id: 2, full_name: 'لطيفة عبدالعزيز السبيعي', phone: '٠٧٩٠ ٨٤٥ ٢١٣٣', ministry: 'وزارة المالية', category: 'رواتب متقاعدين', months: 12, added: 'قبل ٣٢ دقيقة',  user: 'ع.ع' },
    { id: 3, full_name: 'محمد كاظم الحسيني',        phone: '٠٧٥٠ ٢٢٤ ٩٩٨١', ministry: 'وزارة الصحة',   category: 'تعويضات',         months: 3,  added: 'قبل ساعة',       user: 'م.س' },
    { id: 4, full_name: 'زهراء علي الموسوي',        phone: '٠٧٨٠ ٣٣٤ ١١٢٢', ministry: 'وزارة التربية', category: 'تأهيل ذوي الاحتياجات', months: 24, added: 'قبل ٣ ساعات', user: 'س.ر' },
    { id: 5, full_name: 'عبدالرحمن طارق الدليمي',   phone: '٠٧٧٠ ٥٠٦ ٧٧٨٨', ministry: 'وزارة الداخلية', category: 'مستحقات عمالية', months: 6,  added: 'اليوم ٠٩:٤٠',  user: 'ر.ج' },
    { id: 6, full_name: 'نور حسين التميمي',         phone: '٠٧٩٠ ٤٤٢ ٦٦٠٠', ministry: 'وزارة العمل',   category: 'رعاية اجتماعية', months: 12, added: 'أمس ١٥:٢٠',    user: 'ع.ع' },
  ],
  timeline: [
    { d: 'س', v: 42 }, { d: 'ح', v: 58 }, { d: 'ن', v: 73 }, { d: 'ث', v: 65 },
    { d: 'ر', v: 88 }, { d: 'خ', v: 104 }, { d: 'ج', v: 71 },
  ],
  pendingRem: [
    { name: 'سارة عبدالله العتيبي',    text: 'انتهاء المدة خلال ٣ أيام', due: 'اليوم', status: 'overdue' },
    { name: 'محمد كاظم الحسيني',       text: 'متابعة استلام البطاقة',    due: 'غداً',   status: 'due' },
    { name: 'زهراء علي الموسوي',        text: 'تأكيد التسجيل بالمنصة',   due: 'بعد ٣ أيام', status: 'upcoming' },
    { name: 'عبدالرحمن طارق الدليمي',   text: 'استكمال الوثائق',          due: 'بعد أسبوع',  status: 'upcoming' },
  ],
};

// --- Sparkline ---
const Sparkline = ({ data, color = 'var(--brand)', w = 100, h = 32, fill = true }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark">
      {fill && (
        <>
          <defs>
            <linearGradient id={`g-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#g-${color.replace(/[^a-z0-9]/gi,'')})`}/>
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const KpiTile = ({ label, value, delta, deltaTone = 'success', sparkData, sparkColor, icon, sublabel }) => (
  <div className="kpi">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
      <div className="kpi__label">{label}</div>
      {icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--brand-tint)', color: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={14} />
        </div>
      )}
    </div>
    <div className="kpi__value num">{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        {delta && (
          <span className={`chip chip--${deltaTone}`} style={{ height: 20, padding: '0 7px', fontSize: 11 }}>
            <Icon name={deltaTone === 'success' ? 'arrow_up' : 'arrow_down'} size={10} stroke={2.3}/>
            {delta}
          </span>
        )}
        {sublabel && <span className="muted">{sublabel}</span>}
      </div>
      {sparkData && <Sparkline data={sparkData} color={sparkColor || 'var(--brand)'} />}
    </div>
  </div>
);

// ============================================
// Variation A — "Executive" : قليل الأقسام، تركيز عالٍ، كبير
// ============================================
const DashboardA = () => {
  const d = DASH_DATA;
  const maxEmp = Math.max(...d.employeeStats.map(e => e.customer_count));
  const maxCat = Math.max(...d.categoryBreakdown.map(c => c.count));
  const maxMin = Math.max(...d.ministryBreakdown.map(m => m.count));

  return (
    <div style={{ padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiTile label="إجمالي الزبائن"   value={FMT(d.totalCustomers)} delta="+٨٫٢٪" deltaTone="success"
          sparkData={[30,45,50,62,58,72,80,95,110]} sparkColor="#2D6B55" sublabel="هذا الشهر" icon="users"/>
        <KpiTile label="الفواتير"          value={FMT(d.totalInvoices)} delta="+١٢٪" deltaTone="success"
          sparkData={[60,65,70,68,78,85,92,88,104]} sparkColor="#D4A574" sublabel="هذا الشهر" icon="invoice"/>
        <KpiTile label="الإيرادات (د.ع)"   value="٢٤٧٫٨ م" delta="+٥٫٤٪" deltaTone="success"
          sparkData={[50,58,55,70,75,82,78,95,100]} sparkColor="#60A5FA" sublabel="هذا الشهر" icon="chart"/>
        <KpiTile label="تذكيرات نشطة"      value={FMT(d.activeReminders)} delta="٧ متأخرة" deltaTone="danger"
          sparkData={[14,20,18,22,19,25,24]} sparkColor="#F87171" sublabel="تحتاج متابعة" icon="bell"/>
      </div>

      {/* Main grid: timeline + employees */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>آخر ٧ أيام</div>
              <h3 style={{ fontSize: 17 }}>الزبائن المُضافون</h3>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 3, borderRadius: 9, border: '1px solid var(--border)' }}>
              {['٧ أيام','٣٠ يوم','٩٠ يوم'].map((p,i) => (
                <button key={i} className={i === 0 ? 'btn btn--sm btn--primary' : 'btn btn--sm btn--quiet'} style={{ height: 26, fontSize: 11 }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, padding: '0 4px' }}>
            {d.timeline.map((t, i) => {
              const max = Math.max(...d.timeline.map(x => x.v));
              const h = (t.v / max) * 100;
              const isMax = t.v === max;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }} className="num">{t.v}</div>
                  <div style={{
                    width: '100%', height: `${h}%`,
                    background: isMax ? 'linear-gradient(180deg, var(--brand-hover) 0%, var(--brand) 100%)' : 'var(--brand-tint-hi)',
                    borderRadius: '8px 8px 2px 2px',
                    border: `1px solid ${isMax ? 'var(--brand)' : 'var(--border)'}`,
                    position: 'relative',
                  }}/>
                  <div style={{ fontSize: 11, color: isMax ? 'var(--brand)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {t.d}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hr" style={{ margin: '22px 0' }}/>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>متوسط يومي</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>٧٢٫١</div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>أعلى يوم</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>١٠٤ <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>· الخميس</span></div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>الإجمالي</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>٥٠١</div>
            </div>
          </div>
        </div>

        {/* Employees */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>أداء الفريق</div>
              <h3 style={{ fontSize: 17 }}>الموظفون</h3>
            </div>
            <button className="btn btn--sm btn--quiet">عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {d.employeeStats.slice(0, 6).map(e => {
              const pct = (e.customer_count / maxEmp) * 100;
              return (
                <div key={e.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <div className="avatar" style={{ width: 28, height: 28, background: `${e.color}22`, color: e.color, fontSize: 11 }}>{e.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
                    </div>
                    <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{FMT(e.customer_count)}</div>
                  </div>
                  <div className="progress" style={{ height: 3 }}>
                    <span style={{ width: `${pct}%`, background: e.color }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category + Ministry */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3>توزيع الأصناف</h3>
            <div className="chip chip--neutral">٦ أصناف</div>
          </div>
          {d.categoryBreakdown.map((c, i) => {
            const colors = ['#2D6B55','#D4A574','#60A5FA','#A78BFA','#FBBF24','#F87171'];
            const pct = (c.count / d.totalCustomers) * 100;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < d.categoryBreakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span className="dot" style={{ background: colors[i], width: 8, height: 8 }}/>
                <div style={{ flex: 1, fontSize: 13 }}>{c.category}</div>
                <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{FMT(c.count)}</div>
                <div className="num" style={{ fontSize: 12, color: 'var(--text-muted)', width: 50, textAlign: 'left' }}>{pct.toFixed(1)}٪</div>
              </div>
            );
          })}
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3>أعلى الوزارات</h3>
            <div className="chip chip--neutral">١٤ وزارة</div>
          </div>
          {d.ministryBreakdown.map((m, i) => {
            const pct = (m.count / maxMin) * 100;
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < d.ministryBreakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="num muted" style={{ fontSize: 11, width: 16 }}>{i + 1}.</span>
                  <div style={{ flex: 1, fontSize: 13 }} className="truncate">{m.ministry_name}</div>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{FMT(m.count)}</div>
                </div>
                <div className="progress"><span style={{ width: `${pct}%`, background: 'var(--accent)' }}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Variation B — "Operational" : كثيف، تركيز على النشاط اليومي
// ============================================
const DashboardB = () => {
  const d = DASH_DATA;
  const maxCat = Math.max(...d.categoryBreakdown.map(c => c.count));

  return (
    <div style={{ padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero strip */}
      <div style={{
        padding: 24, borderRadius: 14,
        background: 'linear-gradient(135deg, var(--brand-deep) 0%, var(--bg-card) 60%)',
        border: '1px solid var(--border-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,165,116,0.12) 0%, transparent 70%)' }}/>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>صباح الخير، فاتن</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>٧ تذكيرات تحتاج متابعتك اليوم</h2>
          <p style={{ fontSize: 13.5 }}>أُضيف <strong className="num" style={{ color: 'var(--text-primary)' }}>٤٢</strong> زبون جديد منذ آخر زيارة، و <strong className="num" style={{ color: 'var(--text-primary)' }}>١٨</strong> فاتورة بانتظار التدقيق.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button className="btn btn--ghost">
            <Icon name="bell" size={14}/> مراجعة التذكيرات
          </button>
          <button className="btn btn--primary">
            <Icon name="plus" size={14} stroke={2.3}/> إضافة زبون
          </button>
        </div>
      </div>

      {/* Dense KPI row with small tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {[
          { label: 'الزبائن',      val: FMT(d.totalCustomers),   delta: '+٨٫٢٪',  tone: 'success', icon: 'users' },
          { label: 'هذا الشهر',    val: '٤٣٢',                 delta: '+١٢٪',   tone: 'success', icon: 'calendar' },
          { label: 'الفواتير',     val: FMT(d.totalInvoices),   delta: '+١٥',     tone: 'success', icon: 'invoice' },
          { label: 'مستحقة',       val: '٢٤',                   delta: '٧ متأخرة', tone: 'danger',  icon: 'clock' },
          { label: 'ناشطة اليوم',  val: '١٨',                   delta: 'آخر ٢٤س', tone: 'info',    icon: 'wifi' },
          { label: 'نسبة الإنجاز', val: '٨٤٪',                  delta: '+٣٪',     tone: 'success', icon: 'check' },
        ].map((k, i) => (
          <div key={i} className="card-flat" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--brand-tint)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={k.icon} size={12}/>
              </div>
              <div className="label">{k.label}</div>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{k.val}</div>
            <div className={`chip chip--${k.tone}`} style={{ marginTop: 8, height: 18, padding: '0 6px', fontSize: 10.5 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* 3-col: reminders | recent | insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 14 }}>
        {/* Reminders column */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="bell" size={15} />
              <h3 style={{ fontSize: 14.5 }}>التذكيرات القادمة</h3>
            </div>
            <span className="chip chip--warning">{d.activeReminders}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.pendingRem.map((r, i) => {
              const tone = r.status === 'overdue' ? 'danger' : r.status === 'due' ? 'warning' : 'info';
              return (
                <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={`chip chip--${tone}`} style={{ height: 20, padding: '0 7px', fontSize: 10.5 }}>
                      <span className="dot" style={{ background: 'currentColor' }}/>
                      {r.due}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.text}</div>
                </div>
              );
            })}
          </div>
          <button className="btn btn--ghost" style={{ width: '100%', marginTop: 12 }}>عرض جميع التذكيرات ({d.activeReminders})</button>
        </div>

        {/* Recent customers */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="users" size={15} />
              <h3 style={{ fontSize: 14.5 }}>آخر الزبائن المُضافين</h3>
            </div>
            <button className="btn btn--sm btn--quiet">الكل</button>
          </div>
          <table className="dtable" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>الزبون</th>
                <th>الصنف</th>
                <th>المدة</th>
                <th>أُضيف</th>
              </tr>
            </thead>
            <tbody>
              {d.recentCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{c.full_name[0]}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }} className="truncate">{c.full_name}</div>
                        <div className="num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip chip--brand" style={{ fontSize: 11 }}>{c.category}</span></td>
                  <td><span className="num">{c.months} شهر</span></td>
                  <td className="muted" style={{ fontSize: 11.5 }}>{c.added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insight / sparkles */}
        <div className="card" style={{ padding: 20, background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-elevated) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={12}/>
            </div>
            <h3 style={{ fontSize: 14.5 }}>استبصارات</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { t: 'ريم الجبوري أضافت ١١٢ زبون هذا الأسبوع — أعلى من المعتاد بـ ٢٤٪', tone: 'success' },
              { t: '٧ تذكيرات من وزارة العمل متأخرة — يُنصح بالمتابعة اليوم', tone: 'danger' },
              { t: 'صنف "تأهيل ذوي الاحتياجات" ارتفع ١٨٪ هذا الشهر', tone: 'info' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 9,
                background: `var(--${s.tone}-bg)`,
                border: `1px solid var(--${s.tone}-border)`,
                fontSize: 12, lineHeight: 1.5, textWrap: 'pretty',
              }}>{s.t}</div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 0', marginTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <span className="label">تحديث تلقائي كل ٥ دقائق</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--success)' }}>
              <span className="dot" style={{ background: 'var(--success)' }}/>  متصل
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Variation C — "Analytical" : مخطط دائري + hero metric
// ============================================
const DashboardC = () => {
  const d = DASH_DATA;
  const colors = ['#2D6B55','#D4A574','#60A5FA','#A78BFA','#FBBF24','#F87171'];
  const total = d.categoryBreakdown.reduce((s, c) => s + c.count, 0);

  // donut
  let acc = 0;
  const segments = d.categoryBreakdown.map((c, i) => {
    const pct = c.count / total;
    const seg = { start: acc, end: acc + pct, pct, color: colors[i], ...c };
    acc += pct;
    return seg;
  });
  const R = 70, C = 2 * Math.PI * R;

  return (
    <div style={{ padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero metric */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: 14 }}>
        <div className="card" style={{
          padding: 28, position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse at top right, var(--brand-tint) 0%, var(--bg-card) 60%)',
        }}>
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--brand)' }}>القيمة الإجمالية</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <span className="num" style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>٢٤٧٫٨</span>
            <span style={{ fontSize: 18, color: 'var(--text-secondary)', fontWeight: 500 }}>مليون د.ع</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="chip chip--success">
              <Icon name="arrow_up" size={11} stroke={2.3}/> +٥٫٤٪ vs الشهر الماضي
            </span>
            <span className="muted" style={{ fontSize: 12 }}>آخر تحديث: قبل ٣ دقائق</span>
          </div>
          <div style={{ marginTop: 22 }}>
            <Sparkline data={[50,58,55,70,75,82,78,95,100,92,105,118]} color="var(--brand)" w={400} h={60}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5 }} className="muted">
            {['يناير','فبراير','مارس','أبريل','مايو','يونيو'].map((m,i) => <span key={i}>{m}</span>)}
          </div>
        </div>

        {/* Donut */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14.5 }}>الأصناف</h3>
            <button className="btn btn--sm btn--quiet" style={{ width: 26, height: 26, padding: 0 }}>
              <Icon name="more" size={14}/>
            </button>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
            <svg width="170" height="170" viewBox="0 0 170 170">
              <g transform="translate(85, 85) rotate(-90)">
                {segments.map((s, i) => {
                  const len = s.pct * C;
                  const offset = -s.start * C;
                  return (
                    <circle key={i} r={R} cx="0" cy="0" fill="transparent"
                      stroke={s.color}
                      strokeWidth="18"
                      strokeDasharray={`${len} ${C - len}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </g>
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>{FMT(d.totalCustomers)}</div>
              <div className="label">زبون</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
            {segments.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span className="dot" style={{ background: s.color, width: 7, height: 7 }}/>
                <span className="truncate" style={{ flex: 1 }}>{s.category}</span>
                <span className="num muted">{(s.pct * 100).toFixed(0)}٪</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, marginBottom: 14 }}>آخر النشاطات</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { who: 'ر.ج', t: 'أضافت زبون جديد', sub: 'سارة عبدالله', time: 'الآن', tone: 'success' },
              { who: 'ع.ع', t: 'تعاملت مع تذكير', sub: 'محمد كاظم', time: 'قبل ١٢د', tone: 'info' },
              { who: 'ف.م', t: 'أصدرت فاتورة', sub: '#INV-8934', time: 'قبل ٣٢د', tone: 'accent' },
              { who: 'م.س', t: 'نقلت زبون لمنصة', sub: '٣ زبائن', time: 'قبل ساعة', tone: 'info' },
              { who: 'ر.ج', t: 'حدّثت ملاحظات', sub: 'زهراء علي', time: 'قبل ساعتين', tone: 'neutral' },
              { who: 'ف.م', t: 'أكملت النسخ الاحتياطي', sub: '٢٫٤ ج.ب', time: '١٣:٤٢', tone: 'success' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div className={`avatar`} style={{ width: 26, height: 26, fontSize: 10 }}>{a.who}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12 }} className="truncate">
                    <span>{a.t} · </span>
                    <span style={{ color: 'var(--text-muted)' }}>{a.sub}</span>
                  </div>
                </div>
                <span className="num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table + side */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 14.5 }}>آخر الزبائن المُضافين</h3>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>آخر ٢٤ ساعة</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--sm btn--ghost"><Icon name="filter" size={12}/> تصفية</button>
              <button className="btn btn--sm btn--ghost"><Icon name="download" size={12}/> تصدير</button>
            </div>
          </div>
          <table className="dtable">
            <thead>
              <tr>
                <th>الزبون</th>
                <th>الوزارة</th>
                <th>الصنف</th>
                <th>المدة</th>
                <th>الموظف</th>
                <th>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {d.recentCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{c.full_name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
                        <div className="num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{c.ministry}</td>
                  <td><span className="chip chip--brand" style={{ fontSize: 11 }}>{c.category}</span></td>
                  <td><span className="num chip chip--accent" style={{ fontSize: 11 }}>{c.months} شهر</span></td>
                  <td><div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{c.user}</div></td>
                  <td className="muted" style={{ fontSize: 12 }}>{c.added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, marginBottom: 14 }}>أعلى الوزارات</h3>
          {d.ministryBreakdown.slice(0, 6).map((m, i) => {
            const max = d.ministryBreakdown[0].count;
            const pct = (m.count / max) * 100;
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="building" size={12}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5 }} className="truncate">{m.ministry_name}</div>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{FMT(m.count)}</div>
                </div>
                <div className="progress"><span style={{ width: `${pct}%`, background: colors[i % colors.length] }}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DashboardA, DashboardB, DashboardC, Sparkline, DASH_DATA, FMT, KpiTile });
