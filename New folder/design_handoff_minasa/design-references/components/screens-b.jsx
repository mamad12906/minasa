// minasa — screens part 2: Customers List, Customer Detail, Orders, Notifications, Reports, Settings

function CustomersListScreen() {
  const M = window.MINASA;
  const segments = [
    { name: 'VIP · إنفاق مرتفع', count: 412, color: M.c3, pct: 8 },
    { name: 'زبائن متكررون', count: 2180, color: M.c1, pct: 42 },
    { name: 'في خطر الفقدان', count: 620, color: M.c5, pct: 12 },
    { name: 'زوار جدد', count: 1970, color: M.c2, pct: 38 },
  ];
  const customers = [
    { n: 'سارة العتيبي', c: 'الرياض', orders: 24, spent: 18400, last: 'قبل يومين', tag: 'VIP', color: M.c3 },
    { n: 'منى القحطاني', c: 'جدة', orders: 18, spent: 12900, last: 'قبل ٥ أيام', tag: 'مخلصة', color: M.c1 },
    { n: 'نورة السليم', c: 'الدمام', orders: 12, spent: 8700, last: 'قبل أسبوع', tag: 'متكررة', color: M.c1 },
    { n: 'ريم الزهراني', c: 'مكة', orders: 8, spent: 5200, last: 'قبل ٣ أسابيع', tag: 'في خطر', color: M.c5 },
    { n: 'هند الدوسري', c: 'الرياض', orders: 2, spent: 840, last: 'اليوم', tag: 'جديدة', color: M.c2 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="الزبائن"/>
      <div style={{ padding: '0 18px 140px' }}>
        {/* search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: M.surface, borderRadius: 14, padding: '10px 14px',
          border: `1px solid ${M.line}`,
        }}>
          <I.search size={16} color={M.textDim}/>
          <div style={{ flex: 1, fontSize: 13, color: M.textMute }}>ابحث بالاسم، المدينة، أو رقم الجوال</div>
        </div>

        {/* summary */}
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card pad={14}>
            <div style={{ fontSize: 11, color: M.textDim }}>إجمالي الزبائن</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>٥٬١٨٢</div>
            <Pill tone="up" sm>+٣٤٨ هذا الشهر</Pill>
          </Card>
          <Card pad={14}>
            <div style={{ fontSize: 11, color: M.textDim }}>القيمة الدائمة (LTV)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: M.mint, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>١٬٤٢٠ <span style={{ fontSize: 11, color: M.textDim }}>ر.س</span></div>
            <Pill tone="up" sm>+٨٪</Pill>
          </Card>
        </div>

        {/* segments */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: M.text }}>الشرائح</div>
          <div style={{ fontSize: 12, color: M.mint, fontWeight: 600 }}>إدارة ←</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, overflowX: 'auto', margin: '10px -18px 0', padding: '0 18px' }}>
          {segments.map((s, i) => (
            <div key={i} style={{
              flexShrink: 0, width: 156, background: M.surface, borderRadius: 16,
              padding: 14, border: `1px solid ${M.line}`, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: s.color, opacity: 0.12 }}/>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <I.users size={16} color={s.color}/>
              </div>
              <div style={{ fontSize: 11, color: M.textDim, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>{fmt(s.count)}</div>
              <div style={{ fontSize: 10, color: s.color, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>{fmt(s.pct)}٪ من القاعدة</div>
            </div>
          ))}
        </div>

        {/* customer list */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: M.text }}>الزبائن الأعلى إنفاقًا</div>
          <div style={{ fontSize: 12, color: M.textDim }}>ترتيب ▾</div>
        </div>
        <Card pad={0} style={{ marginTop: 10 }}>
          {customers.map((c, i, arr) => (
            <div key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none' }}>
              <Avatar initials={c.n[0]} color={c.color} size={40}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{c.n}</div>
                  <div style={{ fontSize: 9, color: c.color, background: c.color + '1a', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>{c.tag}</div>
                </div>
                <div style={{ fontSize: 11, color: M.textDim, marginTop: 2 }}>{c.c} · {fmt(c.orders)} طلبًا · آخر نشاط {c.last}</div>
              </div>
              <div style={{ textAlign: 'left', direction: 'ltr' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: M.text, fontFamily: M.fontNum }}>{fmt(c.spent.toLocaleString('en-US').replace(/,/g, '٬').split('').map(ch => '0123456789'.includes(ch) ? '٠١٢٣٤٥٦٧٨٩'[+ch] : ch).join(''))}</div>
                <div style={{ fontSize: 10, color: M.textDim }}>ر.س</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <TabBar active="users"/>
    </div>
  );
}

function CustomerDetailScreen() {
  const M = window.MINASA;
  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="ملف الزبونة"/>
      <div style={{ padding: '0 18px 140px' }}>

        {/* hero */}
        <div style={{
          background: `linear-gradient(180deg, rgba(199,167,255,0.18), transparent)`,
          border: `1px solid ${M.line}`, borderRadius: 24, padding: 18, textAlign: 'center',
        }}>
          <Avatar initials="س" color={M.c3} size={72}/>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: M.text }}>سارة العتيبي</div>
          <div style={{ fontSize: 12, color: M.textDim, marginTop: 2 }}>زبونة منذ مارس ٢٠٢٤ · الرياض</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'rgba(199,167,255,0.18)', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: M.c3 }}>
            ★ زبونة VIP
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, background: M.mint, color: M.mintInk, borderRadius: 12, padding: '11px', textAlign: 'center', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <I.message size={15}/> مراسلة
            </div>
            <div style={{ width: 46, background: M.surface2, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${M.line}` }}>
              <I.phone size={17} color={M.text}/>
            </div>
            <div style={{ width: 46, background: M.surface2, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${M.line}` }}>
              <I.tag size={17} color={M.text}/>
            </div>
          </div>
        </div>

        {/* stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          {[
            { l: 'إجمالي الإنفاق', v: '١٨٬٤٠٠', u: 'ر.س', c: M.mint },
            { l: 'عدد الطلبات', v: '٢٤', u: 'طلبًا', c: M.c2 },
            { l: 'متوسط السلة', v: '٧٦٦', u: 'ر.س', c: M.c4 },
          ].map((s, i) => (
            <Card key={i} pad={12} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.c, fontFamily: M.fontNum, direction: 'ltr' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: M.textDim, marginTop: 2 }}>{s.u}</div>
              <div style={{ fontSize: 10, color: M.textMute, marginTop: 4 }}>{s.l}</div>
            </Card>
          ))}
        </div>

        {/* purchase behavior */}
        <Card style={{ marginTop: 14 }} pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: M.text }}>نمط الشراء</div>
            <div style={{ fontSize: 10, color: M.textDim }}>آخر ٦ أشهر</div>
          </div>
          <Bars data={[3,5,4,6,7,5,8,6,9,7,10,8]} w={300} h={90} highlight={10} color={M.mint}/>
        </Card>

        {/* AI insight on customer */}
        <div style={{
          marginTop: 14, background: 'rgba(168,240,198,0.06)',
          border: `1px solid rgba(168,240,198,0.22)`, borderRadius: 16, padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <I.sparkle size={15} color={M.mint}/>
            <div style={{ fontSize: 12, fontWeight: 700, color: M.mint }}>توصية</div>
          </div>
          <div style={{ fontSize: 13, color: M.text, lineHeight: 1.6 }}>
            سارة تشتري عادةً كل ٢٨ يومًا — الطلب التالي المتوقع خلال ٤ أيام. أرسلي لها كوبون VIP لتعزيز الولاء.
          </div>
        </div>

        {/* recent orders */}
        <div style={{ marginTop: 18, fontSize: 14, fontWeight: 700, color: M.text }}>آخر الطلبات</div>
        <Card pad={0} style={{ marginTop: 10 }}>
          {[
            { n: '#١٢٨٧٥', d: '٤ نوفمبر', items: 'عباءة بيج + حقيبة', v: '١٬٢٤٠' },
            { n: '#١٢٥١٢', d: '٧ أكتوبر', items: 'طقم شاي ذهبي', v: '٨٩٠' },
            { n: '#١٢٣٠٨', d: '١٢ سبتمبر', items: 'عطر مسك × ٢', v: '٦٢٠' },
          ].map((o, i, arr) => (
            <div key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: M.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.bag size={16} color={M.textDim}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: M.text }}>{o.n}</div>
                <div style={{ fontSize: 11, color: M.textDim, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.items} · {o.d}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>{o.v} <span style={{ fontSize: 10, color: M.textDim }}>ر.س</span></div>
            </div>
          ))}
        </Card>
      </div>
      <TabBar active="users"/>
    </div>
  );
}

function OrdersScreen() {
  const M = window.MINASA;
  const orders = [
    { n: '#١٢٨٧٥', c: 'سارة العتيبي', items: 3, v: '١٬٢٤٠', s: 'جديد', sc: M.mint, t: 'قبل ٣ د' },
    { n: '#١٢٨٧٤', c: 'منى القحطاني', items: 2, v: '٨٩٠', s: 'قيد التجهيز', sc: M.warn, t: 'قبل ١٢ د' },
    { n: '#١٢٨٧٣', c: 'نورة السليم', items: 1, v: '٢٨٥', s: 'قيد التجهيز', sc: M.warn, t: 'قبل ٢٥ د' },
    { n: '#١٢٨٧٢', c: 'ريم الزهراني', items: 4, v: '٢٬١٤٠', s: 'شُحن', sc: M.info, t: 'قبل ٢ س' },
    { n: '#١٢٨٧١', c: 'هند الدوسري', items: 2, v: '٥٦٠', s: 'مُسلّم', sc: M.textDim, t: 'قبل ٣ س' },
    { n: '#١٢٨٧٠', c: 'فاطمة البقمي', items: 1, v: '٣٢٠', s: 'ملغي', sc: M.down, t: 'قبل ٥ س' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="الطلبات"/>
      <div style={{ padding: '0 18px 140px' }}>

        {/* summary row */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -18px', padding: '0 18px' }}>
          {[
            { l: 'اليوم', v: '٨٧', c: M.mint },
            { l: 'قيد التجهيز', v: '١٢', c: M.warn },
            { l: 'شُحنت', v: '٣٤', c: M.info },
            { l: 'إرجاع', v: '٢', c: M.down },
          ].map((s, i) => (
            <div key={i} style={{
              flexShrink: 0, minWidth: 100, background: M.surface, padding: '12px 14px',
              borderRadius: 14, border: `1px solid ${M.line}`,
            }}>
              <div style={{ fontSize: 11, color: M.textDim }}>{s.l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, direction: 'ltr', justifyContent: 'flex-end' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: s.c }}/>
                <div style={{ fontSize: 22, fontWeight: 700, color: M.text, fontFamily: M.fontNum }}>{s.v}</div>
              </div>
            </div>
          ))}
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', margin: '14px -18px 0', padding: '0 18px' }}>
          {['الكل', 'جديد', 'قيد التجهيز', 'شُحن', 'مُسلّم', 'ملغي'].map((c, i) => {
            const on = i === 0;
            return (
              <div key={i} style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 999,
                background: on ? M.mint : M.surface,
                color: on ? M.mintInk : M.textDim,
                fontSize: 12, fontWeight: on ? 700 : 500,
                border: on ? 'none' : `1px solid ${M.line}`,
              }}>{c}</div>
            );
          })}
        </div>

        {/* list */}
        <Card pad={0} style={{ marginTop: 14 }}>
          {orders.map((o, i, arr) => (
            <div key={i} style={{ padding: 14, borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: o.sc, flexShrink: 0 }}/>
                <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>{o.n}</div>
                <div style={{ marginRight: 'auto', fontSize: 10, color: o.sc, background: o.sc + '1a', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{o.s}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingRight: 18 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: M.text }}>{o.c}</div>
                  <div style={{ fontSize: 11, color: M.textDim, marginTop: 1 }}>{fmt(o.items)} منتجات · {o.t}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>{o.v} <span style={{ fontSize: 10, color: M.textDim }}>ر.س</span></div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <TabBar active="chart"/>
    </div>
  );
}

function NotificationsScreen() {
  const M = window.MINASA;
  const notifs = [
    { t: 'اليوم', items: [
      { icon: I.sparkle, c: M.mint, title: 'استبصار ذكي', body: 'مبيعات الرياض ارتفعت ٣٢٪ — راجعي التوصية', time: 'الآن', unread: true },
      { icon: I.bag, c: M.c2, title: 'طلب جديد #١٢٨٧٥', body: 'سارة العتيبي · ١٬٢٤٠ ر.س', time: 'قبل ٣ د', unread: true },
      { icon: I.upArr, c: M.up, title: 'هدف اليوم تحقق', body: 'تجاوزتِ ٤٥٬٠٠٠ ر.س قبل الظهر', time: 'قبل ٢ س', unread: true },
    ]},
    { t: 'أمس', items: [
      { icon: I.downArr, c: M.down, title: 'انخفاض في التحويل', body: 'معدل التحويل انخفض ١٫٢٪ — افحصي صفحة الدفع', time: 'أمس ٧م', unread: false },
      { icon: I.box, c: M.warn, title: 'مخزون منخفض', body: 'عباءة كلاسيك بيج — تبقت ٨ قطع', time: 'أمس ٣م', unread: false },
      { icon: I.star, c: M.c3, title: 'تقييم جديد ٥ نجوم', body: 'نورة السليم: "الجودة فوق الممتازة"', time: 'أمس ١٠ص', unread: false },
    ]},
    { t: 'هذا الأسبوع', items: [
      { icon: I.users, c: M.c2, title: '٣٤٨ زبونة جديدة', body: 'معظمهن من حملة إنستغرام', time: 'الأحد', unread: false },
    ]},
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="التنبيهات"/>
      <div style={{ padding: '0 18px 140px' }}>
        <SegmentControl items={['الكل', 'استبصارات', 'طلبات', 'تنبيهات']} active={0}/>

        <div style={{ marginTop: 16 }}>
          {notifs.map((sec, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: M.textMute, letterSpacing: 0.5, marginBottom: 8 }}>{sec.t.toUpperCase()}</div>
              <Card pad={0}>
                {sec.items.map((n, j, arr) => (
                  <div key={j} style={{
                    padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12,
                    borderBottom: j < arr.length - 1 ? `1px solid ${M.line}` : 'none',
                    background: n.unread ? 'rgba(168,240,198,0.03)' : 'transparent',
                    position: 'relative',
                  }}>
                    {n.unread && <div style={{ position: 'absolute', right: 6, top: 20, width: 6, height: 6, borderRadius: 3, background: M.mint }}/>}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: n.c + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <n.icon size={16} color={n.c}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{n.title}</div>
                        <div style={{ fontSize: 10, color: M.textMute, flexShrink: 0 }}>{n.time}</div>
                      </div>
                      <div style={{ fontSize: 12, color: M.textDim, marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="bell"/>
    </div>
  );
}

function ReportsScreen() {
  const M = window.MINASA;
  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="التقارير والاستبصارات"/>
      <div style={{ padding: '0 18px 140px' }}>

        {/* featured AI report */}
        <div style={{
          background: `linear-gradient(135deg, rgba(199,167,255,0.2) 0%, rgba(168,240,198,0.12) 100%)`,
          border: `1px solid ${M.line}`, borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: M.c3 }}>
            <I.sparkle size={13}/> تقرير أسبوعي · مُولّد بالذكاء
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: M.text, marginTop: 8, lineHeight: 1.4 }}>
            أسبوع استثنائي: النمو يتسارع في المنطقة الغربية
          </div>
          <div style={{ fontSize: 12, color: M.textDim, marginTop: 8, lineHeight: 1.7 }}>
            ٣ اتجاهات جوهرية، ٥ فرص، وتوقّع لنهاية الشهر.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <div style={{ background: M.text, color: M.bg, borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700 }}>اقرأ التقرير ←</div>
            <div style={{ color: M.textDim, padding: '8px 14px', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <I.eye size={13}/> مشاهدة مختصرة
            </div>
          </div>
        </div>

        {/* key insights */}
        <div style={{ marginTop: 18, fontSize: 14, fontWeight: 700, color: M.text }}>استبصارات رئيسية</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: I.upArr, c: M.up, title: 'قفزة في إعلانات تيك توك', body: 'عائد الإعلان ارتفع من ٢٫٣ إلى ٣٫٨', metric: '+٦٥٪' },
            { icon: I.heart, c: M.c5, title: 'ولاء زبائن VIP', body: 'معدل العودة ٧٨٪ — أعلى من الربع السابق', metric: '+١٢٪' },
            { icon: I.truck, c: M.info, title: 'سرعة الشحن', body: 'متوسط التسليم انخفض إلى ٢٫١ يوم', metric: '-١٫٤ يوم' },
            { icon: I.downArr, c: M.down, title: 'تراجع في سلة الشراء', body: 'متوسط السلة انخفض ٤٪ هذا الأسبوع', metric: '-٤٪' },
          ].map((n, i) => (
            <Card key={i} pad={14}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: n.c + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <n.icon size={17} color={n.c}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{n.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: n.c, fontFamily: M.fontNum, direction: 'ltr' }}>{n.metric}</div>
                  </div>
                  <div style={{ fontSize: 12, color: M.textDim, marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* saved reports */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: M.text }}>تقارير محفوظة</div>
          <div style={{ fontSize: 12, color: M.mint, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><I.plus size={12}/> تقرير جديد</div>
        </div>
        <Card pad={0} style={{ marginTop: 10 }}>
          {[
            { t: 'الأداء الشهري', d: 'آخر تحديث قبل ساعة', c: M.c1 },
            { t: 'تحليل الشرائح', d: 'آخر تحديث أمس', c: M.c2 },
            { t: 'المخزون والمرتجعات', d: 'آخر تحديث منذ ٣ أيام', c: M.c4 },
          ].map((r, i, arr) => (
            <div key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: r.c + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.chart size={15} color={r.c}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{r.t}</div>
                <div style={{ fontSize: 11, color: M.textDim, marginTop: 1 }}>{r.d}</div>
              </div>
              <I.chevL size={16} color={M.textMute}/>
            </div>
          ))}
        </Card>
      </div>
      <TabBar active="chart"/>
    </div>
  );
}

function SettingsScreen() {
  const M = window.MINASA;
  const group = (title, rows) => (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: M.textMute, letterSpacing: 0.5, marginBottom: 8, paddingRight: 4 }}>{title.toUpperCase()}</div>
      <Card pad={0}>
        {rows.map((r, i, arr) => (
          <div key={i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: r.c + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <r.icon size={15} color={r.c}/>
            </div>
            <div style={{ flex: 1, fontSize: 14, color: M.text }}>{r.l}</div>
            {r.detail && <div style={{ fontSize: 12, color: M.textDim }}>{r.detail}</div>}
            {r.toggle !== undefined ? (
              <div style={{
                width: 40, height: 24, borderRadius: 12, position: 'relative',
                background: r.toggle ? M.mint : M.surface2,
                border: `1px solid ${r.toggle ? M.mint : M.line}`,
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: r.toggle ? 2 : 'auto', right: r.toggle ? 'auto' : 2,
                  width: 18, height: 18, borderRadius: 9, background: r.toggle ? M.mintInk : M.text,
                }}/>
              </div>
            ) : <I.chevL size={15} color={M.textMute}/>}
          </div>
        ))}
      </Card>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="الإعدادات"/>
      <div style={{ padding: '0 18px 140px' }}>

        {/* profile card */}
        <Card pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar initials="ف" color={M.mint} size={56}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: M.text }}>فاتن الحربي</div>
              <div style={{ fontSize: 12, color: M.textDim, marginTop: 2 }}>متجر فاتن · الخطة المميزة</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, background: 'rgba(168,240,198,0.14)', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: M.mint }}>
                ★ Pro · متجدد
              </div>
            </div>
          </div>
        </Card>

        {group('المتجر', [
          { icon: I.bag,    c: M.c1, l: 'ربط المتجر',            detail: 'سلة · متصل' },
          { icon: I.globe,  c: M.c2, l: 'اللغة والمنطقة',        detail: 'العربية · KSA' },
          { icon: I.tag,    c: M.c4, l: 'العلامة التجارية' },
        ])}

        {group('التطبيق', [
          { icon: I.bell,     c: M.c3, l: 'تنبيهات ذكية',   toggle: true },
          { icon: I.sparkle,  c: M.mint, l: 'الاستبصارات اليومية', toggle: true },
          { icon: I.eye,      c: M.c2,   l: 'الوضع الداكن',   toggle: true },
        ])}

        {group('الحساب', [
          { icon: I.users,   c: M.c2, l: 'الفريق والصلاحيات', detail: '٣ أعضاء' },
          { icon: I.star,    c: M.c4, l: 'الخطة والفواتير' },
          { icon: I.settings,c: M.textDim, l: 'الخصوصية والأمان' },
        ])}

        {group('أخرى', [
          { icon: I.message, c: M.c2, l: 'الدعم والمساعدة' },
          { icon: I.logout,  c: M.down, l: 'تسجيل الخروج' },
        ])}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: M.textMute, fontFamily: M.fontNum }}>
          minasa v2.4.0 · صُنع بحب في الرياض
        </div>
      </div>
      <TabBar active="settings"/>
    </div>
  );
}

Object.assign(window, { CustomersListScreen, CustomerDetailScreen, OrdersScreen, NotificationsScreen, ReportsScreen, SettingsScreen });
