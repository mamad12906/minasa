// ============================================
// Customers screens — Table (3 variations) + Detail (3 variations)
// ============================================

const CUSTOMERS_SAMPLE = [
  { id: 1, full_name: 'سارة عبدالله العتيبي',       mother: 'أم عبدالله',  phone: '٠٧٧٠ ١٢٣ ٤٥٦٧', card: '١٩٨٤١٢٣٤٥',   platform: 'منصة أور',     ministry: 'وزارة العمل',     category: 'رعاية اجتماعية',    months: 6,  status: 'نشط',        user: 'ر.ج', added: '٢٠٢٥-٠٤-١٨', star: true  },
  { id: 2, full_name: 'لطيفة عبدالعزيز السبيعي',     mother: 'أم لطيفة',    phone: '٠٧٩٠ ٨٤٥ ٢١٣٣', card: '١٩٨٦٣٣٢٢١',   platform: 'منصة ماجد',    ministry: 'وزارة المالية',   category: 'رواتب متقاعدين',     months: 12, status: 'نشط',        user: 'ع.ع', added: '٢٠٢٥-٠٤-١٨', star: false },
  { id: 3, full_name: 'محمد كاظم الحسيني',             mother: 'أم محمد',     phone: '٠٧٥٠ ٢٢٤ ٩٩٨١', card: '١٩٧٨٢٢١١٠',   platform: 'منصة أور',     ministry: 'وزارة الصحة',      category: 'تعويضات',             months: 3,  status: 'بانتظار',    user: 'م.س', added: '٢٠٢٥-٠٤-١٨', star: false },
  { id: 4, full_name: 'زهراء علي الموسوي',            mother: 'أم زهراء',    phone: '٠٧٨٠ ٣٣٤ ١١٢٢', card: '١٩٩٢٤٥٣٢٢',   platform: 'منصة ماجد',    ministry: 'وزارة التربية',    category: 'تأهيل ذوي الاحتياجات', months: 24, status: 'نشط',        user: 'س.ر', added: '٢٠٢٥-٠٤-١٧', star: true  },
  { id: 5, full_name: 'عبدالرحمن طارق الدليمي',       mother: 'أم عبدالرحمن', phone: '٠٧٧٠ ٥٠٦ ٧٧٨٨', card: '١٩٨٠٧٧٦٦٥',   platform: 'منصة أور',     ministry: 'وزارة الداخلية',   category: 'مستحقات عمالية',      months: 6,  status: 'نشط',        user: 'ر.ج', added: '٢٠٢٥-٠٤-١٧', star: false },
  { id: 6, full_name: 'نور حسين التميمي',              mother: 'أم نور',      phone: '٠٧٩٠ ٤٤٢ ٦٦٠٠', card: '١٩٨٨٤٤٢٢١',   platform: 'منصة أور',     ministry: 'وزارة العمل',      category: 'رعاية اجتماعية',     months: 12, status: 'نشط',        user: 'ع.ع', added: '٢٠٢٥-٠٤-١٦', star: false },
  { id: 7, full_name: 'حسين عبدالله الجبوري',          mother: 'أم حسين',     phone: '٠٧٧٠ ٩٩٨ ٧٧٦٦', card: '١٩٧٥٥٥٤٤٣',   platform: 'منصة كلاسيك',   ministry: 'وزارة الصحة',      category: 'رعاية اجتماعية',     months: 6,  status: 'منتهي',      user: 'م.س', added: '٢٠٢٥-٠٤-١٦', star: false },
  { id: 8, full_name: 'فاطمة الزهراء الشمري',         mother: 'أم فاطمة',    phone: '٠٧٥٠ ١١٢ ٣٣٤٤', card: '١٩٩٠١٢٣٤٥',   platform: 'منصة ماجد',    ministry: 'وزارة التخطيط',    category: 'رواتب متقاعدين',     months: 12, status: 'نشط',        user: 'س.ر', added: '٢٠٢٥-٠٤-١٥', star: true  },
  { id: 9, full_name: 'علي جاسم الربيعي',               mother: 'أم علي',      phone: '٠٧٨٠ ٥٥٥ ٦٦٧٧', card: '١٩٨٢٢٢١١٠',   platform: 'منصة أور',     ministry: 'وزارة المالية',    category: 'تعويضات',             months: 3,  status: 'بانتظار',    user: 'ر.ج', added: '٢٠٢٥-٠٤-١٥', star: false },
  { id: 10, full_name: 'مريم أحمد الساعدي',            mother: 'أم مريم',     phone: '٠٧٧٠ ٢٢٢ ٣٣٣٣', card: '١٩٩٥٨٨٧٧٦',   platform: 'منصة ماجد',    ministry: 'وزارة العمل',      category: 'رعاية اجتماعية',     months: 24, status: 'نشط',        user: 'ع.ع', added: '٢٠٢٥-٠٤-١٤', star: false },
];

const statusTone = (s) => s === 'نشط' ? 'success' : s === 'بانتظار' ? 'warning' : s === 'منتهي' ? 'danger' : 'neutral';

// ============================================
// Customers A — Dense Editorial Table
// ============================================
const CustomersA = ({ onRowClick, onAdd }) => (
  <div style={{ padding: '20px 28px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    {/* Filter toolbar */}
    <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div className="input-wrap" style={{ flex: '1 1 220px', minWidth: 200 }}>
        <Icon name="search" size={15}/>
        <input className="input" placeholder="ابحث بالاسم أو الهاتف..."/>
      </div>
      {['المنصة','الوزارة','الصنف','الموظف','المدة'].map(f => (
        <button key={f} className="btn btn--ghost btn--sm">
          {f} <Icon name="arrow_down" size={11} stroke={2.3}/>
        </button>
      ))}
      <button className="btn btn--primary btn--sm" onClick={onAdd} style={{ marginInlineStart: 'auto' }}><Icon name="plus" size={12} stroke={2.3}/> إضافة زبون</button>
    </div>

    {/* Active filters */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span className="label">فلاتر نشطة:</span>
      <span className="chip chip--brand">وزارة العمل <Icon name="x" size={10} stroke={2.3}/></span>
      <span className="chip chip--accent">رعاية اجتماعية <Icon name="x" size={10} stroke={2.3}/></span>
      <span className="chip chip--info">آخر ٧ أيام <Icon name="x" size={10} stroke={2.3}/></span>
      <span className="muted" style={{ fontSize: 11.5 }}>· إظهار <strong className="num" style={{ color: 'var(--text-primary)' }}>٥٬١٨٢</strong> من أصل ٥٬١٨٢</span>
    </div>

    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="dtable">
        <thead>
          <tr>
            <th style={{ width: 34 }}><input type="checkbox"/></th>
            <th>الزبون</th>
            <th>الهاتف / البطاقة</th>
            <th>المنصة</th>
            <th>الوزارة</th>
            <th>الصنف</th>
            <th>المدة</th>
            <th>الحالة</th>
            <th>الموظف</th>
            <th>أُضيف</th>
            <th style={{ width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {CUSTOMERS_SAMPLE.map(c => (
            <tr key={c.id} onClick={() => onRowClick?.(c)} style={{ cursor: 'pointer' }}>
              <td><input type="checkbox"/></td>
                <td style={{ minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 12.5, flexShrink: 0 }}>{c.full_name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      {c.full_name}
                      {c.star && <Icon name="sparkles" size={11} stroke={2.2}/>}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>والدة: {c.mother}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="num" style={{ fontSize: 12.5 }}>{c.phone}</div>
                <div className="num muted" style={{ fontSize: 11 }}>{c.card}</div>
              </td>
              <td style={{ fontSize: 12.5 }}>{c.platform}</td>
              <td className="truncate" style={{ maxWidth: 140, fontSize: 12.5 }}>{c.ministry}</td>
              <td><span className="chip chip--brand" style={{ fontSize: 11 }}>{c.category}</span></td>
              <td><span className="num">{c.months} شهر</span></td>
              <td><span className={`chip chip--${statusTone(c.status)}`} style={{ fontSize: 11 }}><span className="dot" style={{ background: 'currentColor' }}/> {c.status}</span></td>
              <td><div className="avatar" style={{ width: 26, height: 26, fontSize: 10.5 }}>{c.user}</div></td>
              <td className="num muted" style={{ fontSize: 11.5 }}>{c.added}</td>
              <td>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="eye" size={13}/></button>
                  <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="edit" size={13}/></button>
                  <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="more" size={13}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
        <div className="muted" style={{ fontSize: 12 }}>إجمالي: <strong className="num" style={{ color: 'var(--text-primary)' }}>٥٬١٨٢</strong> زبون · صفحة ١ من ١٠٤</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn--sm btn--ghost">السابق</button>
          {['١','٢','٣','٤','٥'].map((p,i) => (
            <button key={i} className={`btn btn--sm ${i === 0 ? 'btn--primary' : 'btn--ghost'}`} style={{ width: 30, padding: 0 }}>{p}</button>
          ))}
          <button className="btn btn--sm btn--ghost">التالي</button>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// Customers B — Cards grid (gallery view)
// ============================================
const CustomersB = () => (
  <div style={{ padding: '20px 28px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="input-wrap grow" style={{ maxWidth: 400 }}>
        <Icon name="search" size={15}/>
        <input className="input" placeholder="ابحث عن زبون..."/>
      </div>
      <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', padding: 3, borderRadius: 9, border: '1px solid var(--border)' }}>
        {['بطاقات','جدول','مخطط'].map((v,i) => (
          <button key={i} className={`btn btn--sm ${i === 0 ? 'btn--primary' : 'btn--quiet'}`} style={{ height: 28 }}>{v}</button>
        ))}
      </div>
      <div style={{ flex: 1 }}/>
      <button className="btn btn--ghost btn--sm"><Icon name="filter" size={12}/> تصفية</button>
      <button className="btn btn--primary btn--sm"><Icon name="plus" size={12} stroke={2.3}/> إضافة زبون</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {CUSTOMERS_SAMPLE.map(c => (
        <div key={c.id} className="card card-hover" style={{ padding: 18, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div className="avatar avatar-ring" style={{ width: 44, height: 44, fontSize: 16 }}>{c.full_name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }} className="truncate">{c.full_name}</div>
              <div className="num muted" style={{ fontSize: 12 }}>{c.phone}</div>
            </div>
            <span className={`chip chip--${statusTone(c.status)}`} style={{ fontSize: 10.5 }}>
              <span className="dot" style={{ background: 'currentColor' }}/>{c.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="label" style={{ marginBottom: 3 }}>الوزارة</div>
              <div className="truncate" style={{ fontSize: 12.5 }}>{c.ministry}</div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 3 }}>المدة</div>
              <div className="num" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.months} شهر</div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 3 }}>المنصة</div>
              <div style={{ fontSize: 12.5 }}>{c.platform}</div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 3 }}>رقم البطاقة</div>
              <div className="num muted" style={{ fontSize: 12 }}>{c.card}</div>
            </div>
          </div>

          <div style={{ marginTop: 10, padding: '8px 0 0', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="chip chip--brand" style={{ fontSize: 10.5 }}>{c.category}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="phone" size={12}/></button>
              <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="message" size={12}/></button>
              <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="eye" size={12}/></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// Customers C — Split view (list + preview)
// ============================================
const CustomersC = () => {
  const [sel, setSel] = React.useState(0);
  const c = CUSTOMERS_SAMPLE[sel];
  return (
    <div style={{ padding: '20px 28px 48px' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 140px)', display: 'grid', gridTemplateColumns: '380px 1fr' }}>
        {/* List */}
        <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <div className="input-wrap">
              <Icon name="search" size={14}/>
              <input className="input" placeholder="ابحث..." style={{ height: 34 }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span className="muted" style={{ fontSize: 12 }}><span className="num">٥٬١٨٢</span> زبون</span>
              <button className="btn btn--sm btn--primary" style={{ height: 28 }}><Icon name="plus" size={12} stroke={2.3}/> إضافة</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {CUSTOMERS_SAMPLE.map((cc, i) => (
              <button key={cc.id}
                onClick={() => setSel(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '12px 16px',
                  background: sel === i ? 'var(--brand-tint)' : 'transparent',
                  border: 'none', borderRight: sel === i ? '3px solid var(--brand)' : '3px solid transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'inherit', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                }}>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{cc.full_name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{cc.full_name}</div>
                  <div className="num muted" style={{ fontSize: 11, marginTop: 2 }}>{cc.phone}</div>
                </div>
                <span className={`dot`} style={{ background: `var(--${statusTone(cc.status)})`, width: 7, height: 7 }}/>
              </button>
            ))}
          </div>
        </div>

        {/* Preview pane */}
        <div style={{ padding: 28, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
            <div className="avatar avatar-ring" style={{ width: 60, height: 60, fontSize: 22 }}>{c.full_name[0]}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22 }}>{c.full_name}</h2>
              <div className="num muted" style={{ marginTop: 4, fontSize: 13 }}>{c.phone} · {c.card}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <span className={`chip chip--${statusTone(c.status)}`}>{c.status}</span>
                <span className="chip chip--brand">{c.category}</span>
                <span className="chip chip--neutral">{c.platform}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm"><Icon name="phone" size={12}/> اتصال</button>
              <button className="btn btn--ghost btn--sm"><Icon name="edit" size={12}/> تعديل</button>
              <button className="btn btn--primary btn--sm"><Icon name="printer" size={12}/> طباعة</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { l: 'المدة',           v: `${c.months} شهر`, icon: 'calendar' },
              { l: 'تاريخ الانتهاء',  v: '٢٠٢٦-٠١-١٨',       icon: 'clock' },
              { l: 'الوزارة',         v: c.ministry,          icon: 'building', truncate: true },
              { l: 'الموظف',          v: c.user,              icon: 'users' },
            ].map((k,i) => (
              <div key={i} className="card-flat" style={{ padding: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>{k.l}</div>
                <div className={k.truncate ? 'truncate' : 'num'} style={{ fontSize: 14, fontWeight: 600 }}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card-flat">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="bell" size={14}/>
                <h4>التذكيرات</h4>
              </div>
              {['انتهاء المدة بعد ٣ أيام','تأكيد استلام البطاقة','متابعة الوثائق الجديدة'].map((r,i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', fontSize: 12.5 }}>
                  <span className={`chip chip--${['danger','warning','info'][i]}`} style={{ fontSize: 10.5, marginLeft: 8 }}>{['اليوم','غداً','+٧ أيام'][i]}</span>
                  {r}
                </div>
              ))}
            </div>
            <div className="card-flat">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="history" size={14}/>
                <h4>سجل التعديلات</h4>
              </div>
              {[
                { a: 'إضافة',  w: 'ر.ج', t: '٢٠٢٥-٠٤-١٨ ٠٩:٤٠' },
                { a: 'تعديل', w: 'ع.ع', t: '٢٠٢٥-٠٤-١٧ ١٤:٢٢' },
                { a: 'تذكير', w: 'ف.م', t: '٢٠٢٥-٠٤-١٦ ١١:٠٨' },
              ].map((h,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', fontSize: 12.5 }}>
                  <span className={`chip chip--${h.a === 'إضافة' ? 'success' : h.a === 'تعديل' ? 'info' : 'warning'}`} style={{ fontSize: 10.5 }}>{h.a}</span>
                  <span className="muted">بواسطة</span>
                  <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{h.w}</div>
                  <span className="num muted" style={{ marginInlineStart: 'auto', fontSize: 11 }}>{h.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Customer Detail — 3 variations (for drawer/page)
// ============================================
const DetailA = ({ c }) => (
  <div style={{ padding: '20px 28px 48px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
      <div className="avatar avatar-ring" style={{ width: 72, height: 72, fontSize: 28 }}>{c.full_name[0]}</div>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 26 }}>{c.full_name}</h1>
        <div className="num muted" style={{ fontSize: 13, marginTop: 6 }}>والدة: {c.mother} · بطاقة: {c.card}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <span className={`chip chip--${statusTone(c.status)}`}>{c.status}</span>
          <span className="chip chip--brand">{c.category}</span>
          <span className="chip chip--accent">{c.months} شهر</span>
          <span className="chip chip--neutral">{c.platform}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn--ghost"><Icon name="phone" size={14}/> اتصال</button>
        <button className="btn btn--ghost"><Icon name="message" size={14}/> واتساب</button>
        <button className="btn btn--ghost"><Icon name="swap" size={14}/> نقل لمنصة</button>
        <button className="btn btn--primary"><Icon name="edit" size={14}/> تعديل</button>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>المعلومات الأساسية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              ['الهاتف', c.phone, 'num'],
              ['رقم البطاقة', c.card, 'num'],
              ['اسم الأم', c.mother],
              ['الوزارة', c.ministry],
              ['المنصة', c.platform],
              ['تاريخ الإضافة', c.added, 'num'],
              ['تاريخ الانتهاء', '٢٠٢٦-٠١-١٨', 'num'],
              ['المدة', `${c.months} شهر`, 'num'],
              ['الموظف المسؤول', 'ريم الجبوري'],
            ].map(([l, v, cls], i) => (
              <div key={i}>
                <div className="label" style={{ marginBottom: 4 }}>{l}</div>
                <div className={cls || ''} style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>سجل التذكيرات</h3>
            <button className="btn btn--ghost btn--sm"><Icon name="plus" size={12} stroke={2.3}/> تذكير جديد</button>
          </div>
          {[
            { t: 'انتهاء المدة (٦ أشهر) بتاريخ ٢٠٢٥-٠٧-١٨', d: '٢٠٢٥-٠٧-١٥', tone: 'info',    s: 'قادم',      icon: 'clock' },
            { t: 'متابعة استلام البطاقة',                   d: '٢٠٢٥-٠٤-٢٠', tone: 'warning', s: 'مستحق',    icon: 'bell' },
            { t: 'تم التواصل وتأكيد البيانات',              d: '٢٠٢٥-٠٤-١٨', tone: 'success', s: 'تم',        icon: 'check', meta: 'ر.ج · هاتفياً' },
          ].map((r, i) => (
            <div key={i} style={{
              padding: 14, marginBottom: 10, borderRadius: 10,
              background: `var(--${r.tone}-bg)`, border: `1px solid var(--${r.tone}-border)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 13.5 }}>
                  <Icon name={r.icon} size={14}/>
                  {r.t}
                </div>
                <span className={`chip chip--${r.tone}`} style={{ fontSize: 10.5 }}>{r.s}</span>
              </div>
              <div className="num" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {r.d}{r.meta && <> · {r.meta}</>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          <h4 style={{ marginBottom: 10 }}>ملاحظات</h4>
          <p style={{ fontSize: 13, lineHeight: 1.7, textWrap: 'pretty' }}>
            الزبونة لديها طلب معلّق منذ أسبوعين، تمت متابعة الوزارة وتم الاتفاق على إكمال الوثائق خلال ٣ أيام. تفضل التواصل بعد الساعة ١٠ صباحاً.
          </p>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 10 }}>الفواتير</h4>
          {[
            { n: 'INV-8934', a: '٢٥٠٬٠٠٠', s: 'مدفوعة', tone: 'success' },
            { n: 'INV-8756', a: '١٢٠٬٠٠٠', s: 'معلّقة', tone: 'warning' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>#{f.n}</div>
                <div className="num muted" style={{ fontSize: 11, marginTop: 2 }}>{f.a} د.ع</div>
              </div>
              <span className={`chip chip--${f.tone}`} style={{ fontSize: 10.5 }}>{f.s}</span>
            </div>
          ))}
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', marginTop: 10 }}>عرض الفواتير</button>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 10 }}>سجل التعديلات</h4>
          {[
            { a: 'إضافة', by: 'ر.ج', t: '٢٠٢٥-٠٤-١٨ ٠٩:٤٠' },
            { a: 'تعديل الهاتف', by: 'ع.ع', t: '٢٠٢٥-٠٤-١٧ ١٤:٢٢' },
            { a: 'تذكير جديد', by: 'ف.م', t: '٢٠٢٥-٠٤-١٦ ١١:٠٨' },
          ].map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', fontSize: 12 }}>
              <div className="dot" style={{ background: 'var(--brand)' }}/>
              <span style={{ flex: 1 }}>{h.a}</span>
              <div className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>{h.by}</div>
              <span className="num muted" style={{ fontSize: 10.5 }}>{h.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DetailB = ({ c }) => (
  <div style={{ padding: '20px 28px 48px' }}>
    {/* Hero banner */}
    <div className="card" style={{
      padding: 28, marginBottom: 14,
      background: 'linear-gradient(135deg, var(--brand-deep) 0%, var(--bg-card) 55%)',
      border: '1px solid var(--border-strong)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -30, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-tint) 0%, transparent 70%)' }}/>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 22 }}>
        <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, background: 'var(--accent-tint)', color: 'var(--accent)', boxShadow: '0 0 0 3px var(--brand-deep)' }}>{c.full_name[0]}</div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 4 }}>زبون · مُسجّل منذ ٢٠٢٣</div>
          <h1 style={{ fontSize: 28 }}>{c.full_name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="phone" size={13}/><span className="num" style={{ fontSize: 13 }}>{c.phone}</span></div>
            <div className="muted">·</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="id" size={13}/><span className="num" style={{ fontSize: 13 }}>{c.card}</span></div>
            <div className="muted">·</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="building" size={13}/><span style={{ fontSize: 13 }}>{c.ministry}</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 24px', borderInlineStart: '1px solid var(--border)' }}>
          <div className="label">الحالة</div>
          <span className={`chip chip--${statusTone(c.status)}`} style={{ height: 28, padding: '0 12px', fontSize: 12 }}>{c.status}</span>
          <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{c.months}</div>
          <div className="label">شهر متبقٍ</div>
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div style={{ display: 'flex', gap: 2, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
      {['نظرة عامة','التذكيرات (٣)','الفواتير (٢)','الوثائق','سجل التغييرات','ملاحظات'].map((t, i) => (
        <button key={t} className="btn btn--quiet" style={{
          height: 40, borderRadius: 0,
          borderBottom: i === 0 ? '2px solid var(--brand)' : '2px solid transparent',
          color: i === 0 ? 'var(--brand)' : 'var(--text-secondary)',
          fontWeight: i === 0 ? 600 : 500,
        }}>{t}</button>
      ))}
    </div>

    {/* 2 col content */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>التفاصيل</h3>
        {[
          ['المنصة', c.platform],
          ['الصنف', c.category],
          ['اسم الأم', c.mother],
          ['المدة الكلية', `${c.months} شهر`],
          ['تاريخ الإضافة', c.added],
          ['تاريخ الانتهاء', '٢٠٢٦-٠١-١٨'],
          ['الموظف المسؤول', 'ريم الجبوري'],
        ].map(([l, v], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < 6 ? '1px solid var(--border-subtle)' : 'none' }}>
            <span className="muted" style={{ fontSize: 12.5 }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>الجدول الزمني</h3>
        <div style={{ position: 'relative', paddingInlineStart: 20 }}>
          <div style={{ position: 'absolute', insetInlineStart: 5, top: 6, bottom: 6, width: 1.5, background: 'var(--border)' }}/>
          {[
            { a: 'أُضيف الزبون',            d: '٢٠٢٥-٠٤-١٨ ٠٩:٤٠', by: 'ر.ج', tone: 'success' },
            { a: 'تعديل رقم الهاتف',         d: '٢٠٢٥-٠٤-١٧ ١٤:٢٢', by: 'ع.ع', tone: 'info' },
            { a: 'تذكير: متابعة البطاقة',    d: '٢٠٢٥-٠٤-١٦ ١١:٠٨', by: 'ف.م', tone: 'warning' },
            { a: 'تم التواصل هاتفياً',        d: '٢٠٢٥-٠٤-١٥ ١٠:٣٠', by: 'ر.ج', tone: 'brand' },
            { a: 'إصدار فاتورة #INV-8756',    d: '٢٠٢٥-٠٤-١٢ ١٦:٠٠', by: 'ف.م', tone: 'accent' },
          ].map((e, i) => (
            <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
              <span style={{
                position: 'absolute', insetInlineStart: -19, top: 3,
                width: 11, height: 11, borderRadius: 50,
                background: `var(--${e.tone})`, boxShadow: '0 0 0 3px var(--bg-card)',
              }}/>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{e.a}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <div className="avatar" style={{ width: 18, height: 18, fontSize: 8.5 }}>{e.by}</div>
                <span className="num muted" style={{ fontSize: 11 }}>{e.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DetailC = ({ c }) => (
  <div style={{ padding: '20px 28px 48px' }}>
    {/* Breadcrumb action bar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <button className="btn btn--ghost btn--sm"><Icon name="arrow_right" size={14}/> عودة للقائمة</button>
      <div style={{ flex: 1 }}/>
      <button className="btn btn--ghost btn--sm"><Icon name="printer" size={12}/> طباعة</button>
      <button className="btn btn--ghost btn--sm"><Icon name="swap" size={12}/> نقل</button>
      <button className="btn btn--danger btn--sm"><Icon name="trash" size={12}/> حذف</button>
      <button className="btn btn--primary btn--sm"><Icon name="edit" size={12}/> تعديل</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
      {/* Left identity card */}
      <div className="card" style={{ padding: 22, textAlign: 'center' }}>
        <div className="avatar avatar-ring" style={{ width: 96, height: 96, margin: '0 auto 16px', fontSize: 36 }}>{c.full_name[0]}</div>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>{c.full_name}</h2>
        <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>والدة: {c.mother}</div>
        <span className={`chip chip--${statusTone(c.status)}`} style={{ marginBottom: 20 }}>
          <span className="dot" style={{ background: 'currentColor' }}/> {c.status}
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'right', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          {[
            ['phone', 'الهاتف', c.phone, true],
            ['id', 'البطاقة', c.card, true],
            ['building', 'الوزارة', c.ministry],
            ['layers', 'المنصة', c.platform],
            ['tag', 'الصنف', c.category],
          ].map(([ic, l, v, isNum], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ic} size={13}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="label">{l}</div>
                <div className={(isNum ? 'num ' : '') + 'truncate'} style={{ fontSize: 12.5, fontWeight: 500 }}>{v}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
          <button className="btn btn--ghost" style={{ flex: 1, height: 34 }}><Icon name="phone" size={12}/></button>
          <button className="btn btn--ghost" style={{ flex: 1, height: 34 }}><Icon name="message" size={12}/></button>
          <button className="btn btn--ghost" style={{ flex: 1, height: 34 }}><Icon name="mail" size={12}/></button>
        </div>
      </div>

      {/* Right content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { l: 'المدة',           v: `${c.months}`, sub: 'شهر',      tone: 'brand' },
            { l: 'متبقٍ',            v: '٩٢',            sub: 'يوم',      tone: 'warning' },
            { l: 'الفواتير',         v: '٢',             sub: 'فاتورة',   tone: 'accent' },
            { l: 'التذكيرات',        v: '٣',             sub: 'نشطة',     tone: 'info' },
          ].map((k,i) => (
            <div key={i} className="card-flat" style={{ padding: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>{k.l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="num" style={{ fontSize: 26, fontWeight: 700, color: `var(--${k.tone})` }}>{k.v}</span>
                <span className="muted" style={{ fontSize: 11 }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={13}/>
            </div>
            <h3>استبصارات هذا الزبون</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'يتبقى على انتهاء مدة الاشتراك ٩٢ يوم — تذكير تلقائي مبرمج',
              'هذه الزبونة أضافتها ريم الجبوري مع ٤٢ زبون آخر هذا الشهر',
              'متوسط وقت الاستجابة للتذكيرات: ٢٫٤ يوم',
            ].map((t,i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12.5, lineHeight: 1.6 }}>
                · {t}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>التذكيرات النشطة</h3>
          {[
            { t: 'انتهاء المدة بعد ٩٢ يوم', d: '٢٠٢٥-٠٧-١٨', tone: 'info' },
            { t: 'متابعة استلام البطاقة',    d: '٢٠٢٥-٠٤-٢٠', tone: 'warning' },
            { t: 'مراجعة الوثائق',            d: '٢٠٢٥-٠٥-٠١', tone: 'info' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `var(--${r.tone}-bg)`, color: `var(--${r.tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell" size={14}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.t}</div>
                <div className="num muted" style={{ fontSize: 11, marginTop: 2 }}>{r.d}</div>
              </div>
              <button className="btn btn--ghost btn--sm">تعامل</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { CustomersA, CustomersB, CustomersC, DetailA, DetailB, DetailC, CUSTOMERS_SAMPLE, statusTone });
