// minasa — screens part 1: Onboarding, Home, Analytics, Products

function OnboardingScreen() {
  const M = window.MINASA;
  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, position: 'relative', overflow: 'hidden', fontFamily: M.fontAr }}>
      {/* mint aurora */}
      <div style={{
        position: 'absolute', top: -120, right: -100, width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,240,198,0.35), transparent 60%)',
        filter: 'blur(20px)',
      }}/>
      <div style={{
        position: 'absolute', top: 200, left: -120, width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(127,184,255,0.22), transparent 60%)',
        filter: 'blur(20px)',
      }}/>

      {/* logo */}
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: M.mint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.mint size={20} color={M.mintInk}/>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: M.text, letterSpacing: -0.3 }}>مِناصة</div>
      </div>

      {/* hero chart card */}
      <div style={{ position: 'absolute', top: 130, left: 24, right: 24 }}>
        <div style={{
          background: M.surface, borderRadius: 24, padding: 18,
          border: `1px solid ${M.line}`, boxShadow: M.shadow,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: M.textDim, marginBottom: 4 }}>المبيعات هذا الأسبوع</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>
                ١٢٨٬٤٠٠ <span style={{ fontSize: 13, color: M.textDim }}>ر.س</span>
              </div>
            </div>
            <Pill tone="up">↑ ٢٣٪</Pill>
          </div>
          <LineArea data={[40,45,42,55,58,72,85,90,88,110,120,128]} w={310} h={100} color={M.mint}/>
        </div>

        {/* floating mini cards */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, background: M.surface, borderRadius: 18, padding: 12, border: `1px solid ${M.line}` }}>
            <div style={{ fontSize: 10, color: M.textDim, marginBottom: 2 }}>زبائن جدد</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>٣٤٢</div>
            <Sparkline data={[3,4,3,5,6,5,7,8]} w={60} h={20} color={M.info}/>
          </div>
          <div style={{ flex: 1, background: M.surface, borderRadius: 18, padding: 12, border: `1px solid ${M.line}` }}>
            <div style={{ fontSize: 10, color: M.textDim, marginBottom: 2 }}>معدل التحويل</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>٤٫٧٪</div>
            <Sparkline data={[2,3,2,4,3,4,5,5]} w={60} h={20} color={M.purple}/>
          </div>
          <div style={{ flex: 1, background: M.surface, borderRadius: 18, padding: 12, border: `1px solid ${M.line}` }}>
            <div style={{ fontSize: 10, color: M.textDim, marginBottom: 2 }}>متوسط السلة</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right' }}>٣٧٥</div>
            <Sparkline data={[5,6,5,7,6,8,7,9]} w={60} h={20} color={M.warn}/>
          </div>
        </div>
      </div>

      {/* headline */}
      <div style={{ position: 'absolute', bottom: 180, left: 24, right: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: M.text, lineHeight: 1.2, marginBottom: 10 }}>
          متجرك يتحدث.<br/><span style={{ color: M.mint }}>ونحن نُنصت.</span>
        </div>
        <div style={{ fontSize: 14, color: M.textDim, lineHeight: 1.6 }}>
          تحليلات فورية، قرارات أذكى،<br/>ونموّ يظهر في أرقامك كل يوم.
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 70, left: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          background: M.mint, color: M.mintInk, borderRadius: 16, padding: '16px',
          textAlign: 'center', fontWeight: 700, fontSize: 15,
          boxShadow: '0 12px 30px rgba(168,240,198,0.22)',
        }}>ابدأ الآن — ربط متجرك خلال دقيقة</div>
        <div style={{ textAlign: 'center', fontSize: 13, color: M.textDim }}>
          لديك حساب؟ <span style={{ color: M.mint, fontWeight: 600 }}>تسجيل الدخول</span>
        </div>
        {/* dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 6 }}>
          <div style={{ width: 20, height: 4, borderRadius: 2, background: M.mint }}/>
          <div style={{ width: 4, height: 4, borderRadius: 2, background: M.textMute }}/>
          <div style={{ width: 4, height: 4, borderRadius: 2, background: M.textMute }}/>
        </div>
      </div>
    </div>
  );
}

function HomeScreen() {
  const M = window.MINASA;
  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <TopBar greeting="مساء الخير" name="ف" store="متجر فاتن" unread={5}/>

      <div style={{ padding: '0 18px 140px' }}>
        {/* hero revenue card */}
        <div style={{
          background: `linear-gradient(135deg, ${M.mint} 0%, ${M.mintDeep} 100%)`,
          borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(11,32,24,0.7)', marginBottom: 4 }}>إيرادات اليوم</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: M.mintInk, fontFamily: M.fontNum, direction: 'ltr', textAlign: 'right', lineHeight: 1 }}>
                ٤٨٬٣٢٠
              </div>
              <div style={{ fontSize: 13, color: 'rgba(11,32,24,0.7)', marginTop: 4 }}>ر.س · ٨٧ طلبًا</div>
            </div>
            <div style={{
              background: 'rgba(11,32,24,0.12)', padding: '6px 10px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, color: M.mintInk, direction: 'ltr',
            }}>↑ ١٨٫٤٪</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <LineArea data={[20,24,22,30,28,35,42,40,48,52,48]} w={330} h={56} color={M.mintInk} fill={false} thickness={2.2}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(11,32,24,0.55)', marginTop: 4, direction: 'ltr' }}>
            <span>12م</span><span>6ص</span><span>12ظ</span><span>6م</span><span>الآن</span>
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { l: 'زوار', v: '٢٬٤٣٠', d: '+١٢٪', color: M.c2, data: [3,4,3,5,6,5,7,8,7,9] },
            { l: 'معدل التحويل', v: '٤٫٧٪', d: '+٠٫٦', color: M.c3, data: [2,3,2,4,3,4,5,5,6,5] },
            { l: 'متوسط السلة', v: '٣٧٥', d: '-٢٪', down: true, color: M.c4, data: [5,6,5,4,5,4,3,4,3,4] },
            { l: 'عودة للشراء', v: '٢٨٪', d: '+٤٪', color: M.c5, data: [2,3,3,4,4,5,5,6,7,7] },
          ].map((k, i) => (
            <Card key={i} pad={14}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: M.textDim }}>{k.l}</div>
                <Pill tone={k.down ? 'down' : 'up'} sm>{k.d}</Pill>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Sparkline data={k.data} w={60} h={24} color={k.color}/>
                <div style={{ fontSize: 20, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>{k.v}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* AI insight */}
        <div style={{
          marginTop: 14, background: M.surface, borderRadius: 20, padding: 16,
          border: `1px solid ${M.line}`, position: 'relative',
          backgroundImage: `linear-gradient(135deg, rgba(168,240,198,0.08), rgba(199,167,255,0.06))`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(168,240,198,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.sparkle size={16} color={M.mint}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: M.text }}>استبصار اليوم</div>
            <div style={{ marginRight: 'auto', fontSize: 10, color: M.mint, fontWeight: 600 }}>جديد</div>
          </div>
          <div style={{ fontSize: 14, color: M.text, lineHeight: 1.7 }}>
            مبيعاتك من <b style={{ color: M.mint }}>الرياض</b> ارتفعت ٣٢٪ هذا الأسبوع، ومعظمها من منتج <b>العباءة البيج</b>. ننصح بتعزيز المخزون قبل الجمعة.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ background: M.mint, color: M.mintInk, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>زيادة المخزون</div>
            <div style={{ background: 'transparent', color: M.textDim, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500, border: `1px solid ${M.line}` }}>رفض</div>
          </div>
        </div>

        {/* recent orders */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: M.text }}>الطلبات الأخيرة</div>
          <div style={{ fontSize: 12, color: M.mint, fontWeight: 600 }}>عرض الكل ←</div>
        </div>
        <Card pad={0} style={{ marginTop: 10 }}>
          {[
            { n: '#١٢٨٧٥', c: 'سارة العتيبي', t: 'قبل ٣ دقائق', v: '٤٢٠', s: 'up' },
            { n: '#١٢٨٧٤', c: 'منى القحطاني', t: 'قبل ١٢ دقيقة', v: '١٬٢٣٠', s: 'up' },
            { n: '#١٢٨٧٣', c: 'نورة السليم', t: 'قبل ٢٥ دقيقة', v: '٢٨٥', s: 'warn' },
          ].map((o, i, arr) => (
            <div key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none' }}>
              <Avatar initials={o.c[0]} color={i === 0 ? M.c2 : i === 1 ? M.c3 : M.c4} size={36}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{o.c}</div>
                <div style={{ fontSize: 11, color: M.textDim, marginTop: 1 }}>{o.n} · {o.t}</div>
              </div>
              <div style={{ textAlign: 'left', direction: 'ltr' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: M.text, fontFamily: M.fontNum }}>{o.v}</div>
                <div style={{ fontSize: 10, color: M.textDim }}>ر.س</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <TabBar active="home"/>
    </div>
  );
}

function AnalyticsScreen() {
  const M = window.MINASA;
  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="المبيعات والإيرادات"/>

      <div style={{ padding: '0 18px 140px' }}>
        {/* time segment */}
        <SegmentControl items={['يوم', 'أسبوع', 'شهر', 'سنة', 'مخصص']} active={2}/>

        {/* main metric */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: M.textDim }}>إجمالي الإيرادات · نوفمبر</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, direction: 'ltr', justifyContent: 'flex-end' }}>
            <Pill tone="up">↑ ٢٣٫٤٪</Pill>
            <div style={{ fontSize: 36, fontWeight: 700, color: M.text, fontFamily: M.fontNum }}>
              ٨٤٢٬١٥٠ <span style={{ fontSize: 15, color: M.textDim }}>ر.س</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: M.textDim, textAlign: 'right', marginTop: 2 }}>
            مقارنة بـ ٦٨٢٬٣٤٠ ر.س في أكتوبر
          </div>
        </div>

        {/* main chart */}
        <Card style={{ marginTop: 14 }} pad={16}>
          <LineArea data={[45,52,48,61,58,72,68,80,85,78,92,110,105,120,128,140]} w={334} h={150} color={M.mint} thickness={2.5}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: M.textMute, marginTop: 8, direction: 'ltr' }}>
            <span>1</span><span>8</span><span>15</span><span>22</span><span>30</span>
          </div>
        </Card>

        {/* channel breakdown */}
        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: M.text }}>المصادر</div>
        <Card style={{ marginTop: 10 }} pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut size={110} thickness={16} segments={[
              { value: 42, color: M.c1 },
              { value: 28, color: M.c2 },
              { value: 18, color: M.c3 },
              { value: 12, color: M.c4 },
            ]}/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { c: M.c1, l: 'البحث المجاني', v: '٤٢٪' },
                { c: M.c2, l: 'الإعلانات', v: '٢٨٪' },
                { c: M.c3, l: 'إنستغرام', v: '١٨٪' },
                { c: M.c4, l: 'تيك توك', v: '١٢٪' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: s.c }}/>
                  <div style={{ flex: 1, fontSize: 12, color: M.text }}>{s.l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* funnel */}
        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: M.text }}>قمع التحويل</div>
        <Card style={{ marginTop: 10 }} pad={14}>
          <Funnel steps={[
            { label: 'زيارات', value: 24300 },
            { label: 'مشاهدة منتج', value: 12840 },
            { label: 'إضافة للسلة', value: 4210 },
            { label: 'إتمام الشراء', value: 1142 },
          ]} w={330} color={M.mint}/>
          <div style={{ marginTop: 10, padding: 10, background: 'rgba(94,226,160,0.06)', borderRadius: 12, fontSize: 11, color: M.textDim, lineHeight: 1.6 }}>
            معدل التحويل الكلي: <b style={{ color: M.mint, fontFamily: M.fontNum }}>٤٫٧٪</b> · أعلى من متوسط القطاع (٢٫٨٪)
          </div>
        </Card>

        {/* heatmap */}
        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: M.text }}>ساعات الذروة</div>
        <Card style={{ marginTop: 10 }} pad={16}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10, color: M.textMute, fontFamily: M.fontNum, paddingTop: 0, direction: 'ltr' }}>
              {['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'].map(d => (
                <div key={d} style={{ height: 14, fontSize: 9, fontFamily: M.fontAr }}>{d}</div>
              ))}
            </div>
            <Heatmap cell={13} gap={3} color={M.mint} data={[
              [0,1,1,2,3,4,5,5,4,3,2,1,1,2,3,4,5,6,7,8,7,5,3,1],
              [0,1,2,2,3,4,5,6,5,4,3,2,2,3,4,5,6,7,8,8,7,5,3,1],
              [0,1,1,2,3,5,6,6,5,4,3,2,2,3,4,5,6,7,8,8,7,5,3,1],
              [0,1,2,3,4,5,6,6,5,4,3,3,3,4,5,6,7,8,9,8,7,5,3,1],
              [0,2,2,3,4,5,7,7,6,5,4,3,3,4,5,6,7,9,9,9,8,6,4,2],
              [1,2,3,4,5,6,7,8,7,6,5,4,4,5,6,7,8,9,9,9,8,7,5,3],
              [1,2,3,4,5,6,7,7,6,5,4,4,4,5,6,7,8,9,9,9,8,7,5,3],
            ]}/>
          </div>
        </Card>
      </div>
      <TabBar active="chart"/>
    </div>
  );
}

function ProductsScreen() {
  const M = window.MINASA;
  const products = [
    { name: 'عباءة كلاسيك بيج', sales: 1240, rev: 186000, trend: [3,4,5,4,6,7,8,9], img: M.c1 },
    { name: 'حقيبة يد جلد طبيعي', sales: 874, rev: 142900, trend: [5,4,5,6,5,7,6,8], img: M.c2 },
    { name: 'طقم شاي ذهبي', sales: 612, rev: 98200, trend: [2,3,3,4,5,5,6,7], img: M.c3 },
    { name: 'عطر مسك النجوم', sales: 498, rev: 74700, trend: [4,5,4,6,5,6,7,7], img: M.c4 },
    { name: 'كنزة قطنية أوفر', sales: 342, rev: 41040, trend: [3,2,3,4,3,4,5,5], img: M.c5 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="أداء المنتجات"/>
      <div style={{ padding: '0 18px 140px' }}>
        <SegmentControl items={['الأكثر مبيعًا', 'الأكثر ربحًا', 'المخزون المنخفض']} active={0}/>

        {/* top product highlight */}
        <div style={{
          marginTop: 16, background: `linear-gradient(135deg, rgba(168,240,198,0.16), rgba(20,25,24,0.2))`,
          border: `1px solid ${M.line}`, borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 10, color: M.mint, fontWeight: 700, letterSpacing: 0.5 }}>★ المنتج الأول</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: M.text, marginTop: 4 }}>عباءة كلاسيك بيج</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 14, direction: 'ltr', justifyContent: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: M.mint, fontFamily: M.fontNum }}>١٨٦٬٠٠٠</div>
              <div style={{ fontSize: 10, color: M.textDim, fontFamily: M.fontAr, textAlign: 'right' }}>إيرادات · ر.س</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: M.text, fontFamily: M.fontNum }}>١٬٢٤٠</div>
              <div style={{ fontSize: 10, color: M.textDim, fontFamily: M.fontAr, textAlign: 'right' }}>قطعة مباعة</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: M.c5, fontFamily: M.fontNum }}>٣٤٪</div>
              <div style={{ fontSize: 10, color: M.textDim, fontFamily: M.fontAr, textAlign: 'right' }}>هامش ربح</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <LineArea data={[20,24,22,28,30,34,40,42,48,52,58,62]} w={300} h={50} color={M.mint} thickness={2}/>
          </div>
        </div>

        {/* product list */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: M.text }}>جميع المنتجات (٤٢)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: M.textDim }}>
            <I.filter size={14}/> تصفية
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.map((p, i) => (
            <Card key={i} pad={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${p.img}55, ${p.img}22)`,
                  border: `1px solid ${p.img}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: p.img, fontWeight: 700, fontSize: 16, fontFamily: M.fontNum,
                }}>#{fmt(i+1)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: M.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: M.textDim, marginTop: 2, fontFamily: M.fontNum, direction: 'rtl', textAlign: 'right' }}>
                    {fmt(p.sales)} قطعة · {fmt(p.rev.toLocaleString('en-US').replace(/,/g, '٬').split('').map(c => '0123456789'.includes(c) ? '٠١٢٣٤٥٦٧٨٩'[+c] : c).join(''))} ر.س
                  </div>
                </div>
                <Sparkline data={p.trend} w={50} h={22} color={M.mint}/>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <TabBar active="chart"/>
    </div>
  );
}

Object.assign(window, { OnboardingScreen, HomeScreen, AnalyticsScreen, ProductsScreen });
