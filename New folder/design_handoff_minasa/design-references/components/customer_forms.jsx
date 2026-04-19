// Customer Add/Edit modal + Detail-page wrapper
// Exposes: CustomerFormModal, CustomerDetailPage

const MINISTRIES = ['وزارة العمل والشؤون الاجتماعية','وزارة المالية','وزارة الصحة','وزارة التربية','وزارة الداخلية','وزارة التخطيط'];
const PLATFORMS  = ['منصة أور','منصة ماجد','منصة كلاسيك'];
const CATEGORIES = ['رعاية اجتماعية','رواتب متقاعدين','تأهيل ذوي الاحتياجات','مستحقات عمالية','تعويضات','أخرى'];

function CustomerFormModal({ mode = 'add', initial, onClose, onSave }) {
  const [form, setForm] = React.useState(initial || {
    full_name: '', mother: '', phone: '', card: '',
    platform: PLATFORMS[0], ministry: MINISTRIES[0], category: CATEGORIES[0],
    months: 6, status: 'نشط', notes: '',
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'var(--bg-overlay)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--brand-tint)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={mode === 'edit' ? 'edit' : 'plus'} size={17} stroke={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18 }}>{mode === 'edit' ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}</h2>
            <p style={{ fontSize: 12.5, marginTop: 2 }}>
              {mode === 'edit' ? `تحديث بيانات ${initial?.full_name || ''}` : 'املأ الحقول المطلوبة. * إلزامي.'}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Section title="المعلومات الشخصية">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="الاسم الرباعي *">
                <input className="input" placeholder="مثال: سارة عبدالله العتيبي الحربي" value={form.full_name} onChange={set('full_name')}/>
              </Field>
              <Field label="اسم الأم">
                <input className="input" placeholder="مثال: أم عبدالله" value={form.mother} onChange={set('mother')}/>
              </Field>
              <Field label="رقم الجوال *">
                <input className="input num" placeholder="٠٧٧٠ ١٢٣ ٤٥٦٧" value={form.phone} onChange={set('phone')}/>
              </Field>
              <Field label="رقم البطاقة">
                <input className="input num" placeholder="١٩٨٤١٢٣٤٥" value={form.card} onChange={set('card')}/>
              </Field>
            </div>
          </Section>

          <Section title="التصنيف والمنصة">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="المنصة *">
                <Select value={form.platform} onChange={set('platform')} options={PLATFORMS}/>
              </Field>
              <Field label="الوزارة *">
                <Select value={form.ministry} onChange={set('ministry')} options={MINISTRIES}/>
              </Field>
              <Field label="الصنف *">
                <Select value={form.category} onChange={set('category')} options={CATEGORIES}/>
              </Field>
              <Field label="المدة (بالأشهر) *">
                <div style={{ display: 'flex', gap: 6 }}>
                  {[3, 6, 12, 24].map(m => (
                    <button key={m} type="button" onClick={() => setForm(f => ({ ...f, months: m }))}
                      className={`btn btn--sm ${form.months === m ? 'btn--primary' : 'btn--ghost'}`}
                      style={{ flex: 1 }}>
                      <span className="num">{m}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="الحالة">
                <Select value={form.status} onChange={set('status')} options={['نشط','بانتظار','منتهي']}/>
              </Field>
            </div>
          </Section>

          <Section title="ملاحظات إضافية">
            <textarea className="input" placeholder="أي ملاحظات خاصة بالزبون..." value={form.notes} onChange={set('notes')}
              style={{ height: 80, padding: 12, resize: 'vertical', lineHeight: 1.7 }}/>
          </Section>

          {mode === 'add' && (
            <div style={{ padding: 14, background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-hi)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="sparkles" size={14} stroke={2}/>
              <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                سيتم إنشاء تذكير تلقائي قبل انتهاء المدة بـ ٣٠ يومًا. يمكنك تعديله لاحقًا من صفحة التذكيرات.
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'edit' && (
            <button className="btn btn--danger btn--sm"><Icon name="trash" size={12}/> حذف الزبون</button>
          )}
          <div style={{ flex: 1 }}/>
          <button className="btn btn--ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn--primary" onClick={() => onSave?.(form)}>
            <Icon name="check" size={13} stroke={2.2}/>
            {mode === 'edit' ? 'حفظ التغييرات' : 'إضافة الزبون'}
          </button>
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);
const Field = ({ label, children }) => (
  <div>
    <div className="label" style={{ marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);
const Select = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select value={value} onChange={onChange} className="input"
      style={{ appearance: 'none', paddingLeft: 32, cursor: 'pointer' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
      <Icon name="arrow_down" size={12} stroke={2.2}/>
    </span>
  </div>
);

// ---------- Customer detail page with A/B/C + back + edit ----------
function CustomerDetailPage({ customer, variant, onVariant, onBack, onEdit }) {
  const c = customer;
  return (
    <div>
      <div style={{ padding: '14px 28px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          <Icon name="arrow_right" size={12}/> عودة لقائمة الزبائن
        </button>
        <div style={{ flex: 1 }}/>
        <div className="var-switcher">
          {[['A','موجز'],['B','بطاقة'],['C','كامل']].map(([k,l]) => (
            <button key={k} className={variant === k ? 'active' : ''} onClick={() => onVariant(k)}>{l}</button>
          ))}
        </div>
      </div>
      {variant === 'A' && <DetailA c={c}/>}
      {variant === 'B' && <DetailB c={c}/>}
      {variant === 'C' && <DetailC c={c}/>}
    </div>
  );
}

Object.assign(window, { CustomerFormModal, CustomerDetailPage });
