// minasa — Zabaen directory screen (full customer directory)

function ZabaenDirectoryScreen() {
  const M = window.MINASA;

  // realistic 4-5 part Saudi names + phone + added-by user
  const zabaen = [
    { n: 'سارة عبدالله العتيبي الحربي',        p: '٠٥٥ ٤٢٣ ٧٨٩١', by: 'فاتن',  city: 'الرياض', spent: 18400, tag: 'VIP',   color: M.c3, when: 'مارس ٢٠٢٤' },
    { n: 'منى فهد القحطاني الزهراني',          p: '٠٥٠ ٨٩٢ ٣٤٥٦', by: 'فاتن',  city: 'جدة',   spent: 12900, tag: 'مخلصة', color: M.c1, when: 'يناير ٢٠٢٤' },
    { n: 'نورة محمد السليم الدوسري',           p: '٠٥٤ ٧٢١ ٦٥٤٣', by: 'ريم',   city: 'الدمام', spent: 8700,  tag: 'متكررة', color: M.c1, when: 'فبراير ٢٠٢٤' },
    { n: 'ريم خالد الزهراني الشهري',           p: '٠٥٦ ٣٣٤ ٩٨٧٢', by: 'عبير',  city: 'مكة',   spent: 5200,  tag: 'في خطر', color: M.c5, when: 'مايو ٢٠٢٣' },
    { n: 'هند ناصر الدوسري البقمي',            p: '٠٥٩ ٦٥٤ ٧٨٩٠', by: 'فاتن',  city: 'الرياض', spent: 840,   tag: 'جديدة', color: M.c2, when: 'اليوم'    },
    { n: 'فاطمة سعد البقمي العنزي',            p: '٠٥٥ ١٢٣ ٤٥٦٧', by: 'ريم',   city: 'بريدة', spent: 3200,  tag: 'متكررة', color: M.c1, when: 'يوليو ٢٠٢٤' },
    { n: 'لطيفة عبدالعزيز السبيعي القحطاني',   p: '٠٥٠ ٩٨٧ ٦٥٤٣', by: 'فاتن',  city: 'الرياض', spent: 22100, tag: 'VIP',   color: M.c3, when: 'يونيو ٢٠٢٣' },
    { n: 'أمل يوسف الغامدي الأحمدي',           p: '٠٥٦ ٢٤٦ ٨١٣٥', by: 'عبير',  city: 'الطائف', spent: 1450,  tag: 'جديدة', color: M.c2, when: 'قبل ٣ أيام' },
    { n: 'دلال ماجد الشمري المطيري',           p: '٠٥٤ ٥٥٥ ٢٢٢٣', by: 'ريم',   city: 'حائل',  spent: 7600,  tag: 'متكررة', color: M.c1, when: 'أغسطس ٢٠٢٤' },
    { n: 'شهد طلال الرشيدي العتيبي',           p: '٠٥٥ ٦٦٦ ٣٣٣٤', by: 'فاتن',  city: 'تبوك',  spent: 4100,  tag: 'متكررة', color: M.c1, when: 'أكتوبر ٢٠٢٤' },
    { n: 'جود محمد الخالدي السعدون',           p: '٠٥٩ ٧٧٧ ٤٤٤٥', by: 'عبير',  city: 'الخبر', spent: 980,   tag: 'جديدة', color: M.c2, when: 'قبل ساعة' },
    { n: 'رهف عبدالرحمن التميمي الحربي',       p: '٠٥٠ ٨٨٨ ٥٥٥٦', by: 'فاتن',  city: 'الرياض', spent: 31800, tag: 'VIP',   color: M.c3, when: 'ديسمبر ٢٠٢٢' },
  ];

  // group alphabetically-ish by first letter
  const letters = {};
  zabaen.forEach(z => {
    const L = z.n[0];
    (letters[L] = letters[L] || []).push(z);
  });
  const sortedLetters = Object.keys(letters).sort();

  // users that added (for filter chips)
  const adders = ['الكل', 'فاتن', 'ريم', 'عبير'];

  return (
    <div style={{ width: '100%', height: '100%', background: M.bg, fontFamily: M.fontAr, position: 'relative' }}>
      <ScreenHeader title="الزبائن"/>

      <div style={{ padding: '0 18px 140px' }}>
        {/* search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: M.surface, borderRadius: 14, padding: '11px 14px',
          border: `1px solid ${M.line}`,
        }}>
          <I.search size={16} color={M.textDim}/>
          <div style={{ flex: 1, fontSize: 13, color: M.textMute }}>ابحث بالاسم أو رقم الجوال</div>
          <I.filter size={15} color={M.textDim}/>
        </div>

        {/* summary strip */}
        <div style={{
          display: 'flex', gap: 0, marginTop: 12, background: M.surface,
          border: `1px solid ${M.line}`, borderRadius: 16, padding: '12px 8px',
          alignItems: 'stretch',
        }}>
          {[
            { l: 'الإجمالي', v: '٥٬١٨٢', c: M.text },
            { l: 'هذا الشهر', v: '+٣٤٨', c: M.mint },
            { l: 'VIP', v: '٤١٢', c: M.c3 },
            { l: 'في خطر', v: '٦٢٠', c: M.c5 },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, textAlign: 'center', padding: '0 6px' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.c, fontFamily: M.fontNum, direction: 'ltr' }}>{s.v}</div>
                <div style={{ fontSize: 10, color: M.textDim, marginTop: 2 }}>{s.l}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, background: M.line }}/>}
            </React.Fragment>
          ))}
        </div>

        {/* who-added filter chips */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: M.textMute, letterSpacing: 0.3, marginBottom: 8 }}>
            أضيف من قِبل
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -18px', padding: '0 18px' }}>
            {adders.map((a, i) => {
              const on = i === 0;
              return (
                <div key={i} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px 7px 14px', borderRadius: 999,
                  background: on ? M.mint : M.surface,
                  color: on ? M.mintInk : M.text,
                  fontSize: 12, fontWeight: on ? 700 : 500,
                  border: on ? 'none' : `1px solid ${M.line}`,
                }}>
                  {i > 0 && (
                    <div style={{
                      width: 18, height: 18, borderRadius: 9,
                      background: [M.c2, M.c3, M.c4][(i-1) % 3] + '44',
                      color: [M.c2, M.c3, M.c4][(i-1) % 3],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}>{a[0]}</div>
                  )}
                  <span>{a}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* sort row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 13, color: M.textDim }}>
            يُعرض <b style={{ color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>١٢</b> من أصل <b style={{ color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>٥٬١٨٢</b>
          </div>
          <div style={{ fontSize: 12, color: M.mint, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            أبجديًا <I.chevD size={13}/>
          </div>
        </div>

        {/* alphabetical list */}
        <div style={{ marginTop: 12 }}>
          {sortedLetters.map(L => (
            <div key={L} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: M.mint, fontFamily: M.fontAr,
                padding: '6px 2px', marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'rgba(168,240,198,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>{L}</div>
                <div style={{ flex: 1, height: 1, background: M.line }}/>
                <div style={{ fontSize: 10, color: M.textMute, fontFamily: M.fontNum, direction: 'ltr' }}>{fmt(letters[L].length)}</div>
              </div>
              <Card pad={0}>
                {letters[L].map((z, i, arr) => (
                  <div key={i} style={{
                    padding: '12px 14px',
                    borderBottom: i < arr.length - 1 ? `1px solid ${M.line}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <Avatar initials={z.n[0]} color={z.color} size={40}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* name + tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: M.text,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                          }}>{z.n}</div>
                          <div style={{
                            fontSize: 9, color: z.color, background: z.color + '1a',
                            padding: '1px 6px', borderRadius: 999, fontWeight: 700, flexShrink: 0,
                          }}>{z.tag}</div>
                        </div>
                        {/* phone */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
                          fontSize: 12, color: M.textDim, fontFamily: M.fontNum, direction: 'rtl',
                        }}>
                          <I.phone size={11} color={M.textMute}/>
                          <span style={{ letterSpacing: 0.3 }}>{z.p}</span>
                          <span style={{ color: M.textMute, margin: '0 4px' }}>·</span>
                          <span style={{ fontFamily: M.fontAr }}>{z.city}</span>
                        </div>
                        {/* added-by meta */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                          padding: '5px 8px', background: 'rgba(255,255,255,0.03)',
                          borderRadius: 8, fontSize: 10, color: M.textDim,
                        }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: 8,
                            background: (z.by === 'فاتن' ? M.mint : z.by === 'ريم' ? M.c3 : M.c2) + '33',
                            color: z.by === 'فاتن' ? M.mint : z.by === 'ريم' ? M.c3 : M.c2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700,
                          }}>{z.by[0]}</div>
                          <span>أُضيف بواسطة</span>
                          <b style={{ color: M.text, fontWeight: 600 }}>{z.by}</b>
                          <span style={{ color: M.textMute, margin: '0 2px' }}>·</span>
                          <span>{z.when}</span>
                        </div>
                      </div>
                      {/* chevron + quick action */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 4 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 15,
                          background: M.surface2, border: `1px solid ${M.line}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <I.phone size={13} color={M.mint}/>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>

        {/* load more */}
        <div style={{
          marginTop: 14, padding: '12px', textAlign: 'center',
          background: M.surface, borderRadius: 14, border: `1px dashed ${M.lineStrong}`,
          fontSize: 12, color: M.textDim,
        }}>
          تحميل المزيد · تبقى <b style={{ color: M.text, fontFamily: M.fontNum, direction: 'ltr' }}>٥٬١٧٠</b> زبون
        </div>
      </div>

      {/* floating add button */}
      <div style={{
        position: 'absolute', bottom: 100, left: 20, zIndex: 41,
        width: 56, height: 56, borderRadius: 28,
        background: M.mint, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 28px rgba(168,240,198,0.35)',
      }}>
        <I.plus size={24} color={M.mintInk} stroke={2.5}/>
      </div>

      <TabBar active="users"/>
    </div>
  );
}

window.ZabaenDirectoryScreen = ZabaenDirectoryScreen;
