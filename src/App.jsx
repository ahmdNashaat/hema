import { useEffect, useRef, useState } from 'react';
import { D, toN, toS, todayN, fmt, short, dm, days, after, cycleAt, info, extend, startState } from './logic.js';

const KEY = 'jadwali_v1';
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.cycles && s.cycles.length ? s : null; } catch { return null; } };
const byDate = (a, b) => (a.date < b.date ? -1 : 1);

function EvRow({ s, e, del, onOk, onDel }) {
  const d = toN(e.date), i = info(s, d);
  return (
    <div className="card">
      <b>{e.title}</b>
      <div className="mut">{short(d)}</div>
      <span className={'pill ' + (i.work ? 'w' : 'l')}>{i.work ? '⚠ بتقع في الشغل، يوم ' + i.day : '✓ بتقع في إجازتك، يوم ' + i.day}</span>
      {e.chg && <div className="chg"><span>⚠ اتغيّرت بعد التعديل، كانت {e.chg}</span><button className="btn ghost" onClick={() => onOk(e.id)}>تمام</button></div>}
      {del && <button className="lnk" onClick={() => onDel(e.id)}>حذف المناسبة</button>}
    </div>
  );
}

function SetupForm({ ob, setOb, sheet, onGo, onCancel }) {
  const upd = (p) => setOb((o) => { const n = { ...o, ...p }; n.day = Math.min(n.day, n.n); return n; });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  return (
    <>
      <div className="card"><b>كام يوم شغل، وبعدها نفس العدد إجازة؟</b>
        <div className="step"><button onClick={() => upd({ n: clamp(ob.n - 1, 1, 30) })} aria-label="أقل">−</button><b>{ob.n}</b><button onClick={() => upd({ n: clamp(ob.n + 1, 1, 30) })} aria-label="أكتر">+</button></div></div>
      <div className="card"><b>النهارده أنت في:</b>
        <div className="seg"><button className={ob.work ? 'on w' : ''} onClick={() => upd({ work: true })}>شغل</button><button className={ob.work ? '' : 'on l'} onClick={() => upd({ work: false })}>إجازة</button></div></div>
      <div className="card"><b>يوم كام من {ob.work ? 'الشغل' : 'الإجازة'}؟</b>
        <div className="step"><button onClick={() => upd({ day: clamp(ob.day - 1, 1, ob.n) })} aria-label="أقل">−</button><b>{ob.day}</b><button onClick={() => upd({ day: clamp(ob.day + 1, 1, ob.n) })} aria-label="أكتر">+</button></div></div>
      <div className="row">{sheet && <button className="btn ghost" onClick={onCancel}>إلغاء</button>}<button className="btn" onClick={onGo}>{sheet ? 'احفظ' : 'ابدأ'}</button></div>
    </>
  );
}

export default function App() {
  const [s, setS] = useState(load);
  const [tab, setTab] = useState('home');
  const [sheet, setSheet] = useState(null);
  const [ob, setOb] = useState({ work: true, day: 1, n: 5 });
  const [k, setK] = useState(1);
  const [sel, setSel] = useState(null);
  const [my, setMy] = useState(() => { const d = new Date(todayN() * D); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const [evt, setEvt] = useState('');
  const [rs, setRs] = useState(false);
  const [toast, setToast] = useState(null);
  const undo = useRef(null);
  const bk = useRef(null);

  useEffect(() => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }, [s]);
  useEffect(() => { navigator.storage?.persist?.(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 8000); return () => clearTimeout(t); }, [toast]);

  const go = (t) => { setTab(t); window.scrollTo(0, 0); };
  const obGo = () => { setS(startState(ob, s)); setSheet(null); setTab('home'); };

  if (!s) {
    return (
      <div className="wrap"><h1 className="h">أهلاً بيك</h1>
        <p className="mut">سؤالين بس وبعدها تعرف أي يوم تختاره هو شغل ولا إجازة.</p>
        <SetupForm ob={ob} setOb={setOb} sheet={false} onGo={obGo} />
      </div>
    );
  }

  const okEv = (id) => setS({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, chg: undefined } : e)) });
  const delEv = (id) => setS({ ...s, events: s.events.filter((e) => e.id !== id) });
  const addEv = () => {
    setS({ ...s, seq: s.seq + 1, events: [...s.events, { id: s.seq, date: toS(sel), title: evt.trim() || 'مناسبة' }] });
    setEvt(''); setToast({ t: 'اتحفظت المناسبة' });
  };
  const confirmDelay = () => {
    const n = extend(s, k, todayN());
    n.events = n.events.map((e) => { const d = toN(e.date), a = info(s, d).work, b = info(n, d).work; return a !== b ? { ...e, chg: a ? 'شغل' : 'إجازة' } : e; });
    undo.current = s; setS(n); setSheet(null); setToast({ t: 'اتسجّل التأخير', u: true });
  };
  const doUndo = () => { if (undo.current) setS(undo.current); undo.current = null; setToast(null); };
  const openSetup = () => { const i = info(s, todayN()); setOb({ work: i.work, day: Math.min(i.day, s.n), n: s.n }); setSheet('setup'); };
  const importEv = () => {
    try {
      const arr = JSON.parse(bk.current.value); let q = s.seq;
      const events = arr.filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map((e) => ({ id: q++, date: e.date, title: String(e.title || 'مناسبة') }));
      setS({ ...s, events, seq: q }); setToast({ t: 'اتستوردت ' + events.length + ' مناسبة' });
    } catch { setToast({ t: 'النص مش صحيح' }); }
  };
  const reset = () => { if (rs) { setS(null); setRs(false); } else setRs(true); };

  const t = todayN();

  const home = () => {
    const i = info(s, t), c = cycleAt(s, t), left = i.pEnd - t + 1, o = t - c.start;
    const up = s.events.filter((e) => toN(e.date) >= t).sort(byDate).slice(0, 2);
    return (<>
      <h1 className="h">جدولي</h1>
      <div className={'hero ' + (i.work ? 'work' : 'leave')}>
        <div className="tag">{i.work ? 'أنت في الشغل' : 'أنت في إجازتك'}</div>
        <div className="num">{i.day}<span>من {i.n}</span></div>
        <div className="rib">{Array.from({ length: 2 * c.n }, (_, x) => <i key={x} className={(x < c.n ? 'rw' : 'rl') + (x < o ? ' p' : '') + (x === o ? ' t' : '')} />)}</div>
        <div className="nx">{i.work ? 'هتنزل' : 'هترجع الشغل'} {after(left)}</div>
        <div className="mut">{short(i.pEnd + 1)}</div>
      </div>
      <div className="row">
        <button className="btn" onClick={() => go('cal')}>اختار تاريخ</button>
        {i.work && <button className="btn sec" onClick={() => { setK(1); setSheet('delay'); }}>اتأخرت في الشغل</button>}
      </div>
      {up.length > 0 && <><h2 className="h2">مناسبات جاية</h2>{up.map((e) => <EvRow key={e.id} s={s} e={e} onOk={okEv} />)}</>}
    </>);
  };

  const result = (d) => {
    const i = info(s, d), cur = cycleAt(s, t), conf = d < cur.start + 2 * cur.n, ex = s.events.find((e) => toN(e.date) === d);
    return (
      <div className={'hero ' + (i.work ? 'work' : 'leave')}>
        <div className="tag">{short(d)}</div>
        <div className="big">يوم {i.day} من {i.work ? 'شغلك' : 'إجازتك'}</div>
        <div>{i.work ? 'الشغل ده' : 'الإجازة دي'} من {dm(i.pStart)} لحد {dm(i.pEnd)} ({days(i.n)})</div>
        <span className="badge">{conf ? 'مؤكد' : 'حسب جدولك المعتاد'}</span>
        {!conf && <div className="mut" style={{ marginTop: 6 }}>لو اتأخرت في الشغل قبل اليوم ده، الرقم ممكن يتحرك.</div>}
        <div style={{ marginTop: 14 }}>{ex ? 'محفوظ كمناسبة: ' + ex.title
          : <div className="row"><input value={evt} onChange={(e) => setEvt(e.target.value)} placeholder="اسم المناسبة" style={{ flex: 2 }} /><button className="btn" onClick={addEv}>احفظ المناسبة</button></div>}</div>
      </div>
    );
  };

  const cal = () => {
    const { y, m } = my, first = Math.round(Date.UTC(y, m, 1) / D), dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), off = (new Date(first * D).getUTCDay() + 1) % 7;
    const evd = new Set(s.events.map((e) => toN(e.date)));
    const step = (v) => { let mm = m + v, yy = y; if (mm < 0) { mm = 11; yy--; } if (mm > 11) { mm = 0; yy++; } setMy({ y: yy, m: mm }); };
    return (<>
      <h1 className="h">التقويم</h1>
      <div className="mh"><button onClick={() => step(-1)}>السابق</button><b>{fmt(first, { month: 'long', year: 'numeric' })}</b><button onClick={() => step(1)}>التالي</button></div>
      <div className="cal">
        {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((x) => <div key={x} className="wd">{x}</div>)}
        {Array.from({ length: off }, (_, x) => <div key={'o' + x} />)}
        {Array.from({ length: dim }, (_, x) => {
          const d = first + x, i = info(s, d);
          return <button key={d} aria-label={short(d)} onClick={() => setSel(d)} className={'c ' + (i.work ? 'w' : 'l') + (d === t ? ' t' : '') + (d === sel ? ' s' : '') + (evd.has(d) ? ' e' : '')}>{x + 1}<small>{i.work ? 'ش' : 'إ'}</small></button>;
        })}
      </div>
      <div className="leg"><span><i style={{ background: 'var(--work)' }} />شغل (ش)</span><span><i style={{ background: 'var(--leave)' }} />إجازة (إ)</span><span>نقطة حمرا = مناسبة</span></div>
      <label className="mut" htmlFor="dp">أو اكتب التاريخ</label>
      <input type="date" id="dp" value={sel ? toS(sel) : ''} style={{ margin: '6px 0 14px' }}
        onChange={(e) => { if (!e.target.value) return; const n = toN(e.target.value), d = new Date(n * D); setSel(n); setMy({ y: d.getUTCFullYear(), m: d.getUTCMonth() }); }} />
      {sel ? result(sel) : <p className="mut">دوس على أي يوم وهقولك هو يوم كام من شغلك أو إجازتك.</p>}
    </>);
  };

  const evs = () => {
    const l = s.events.slice().sort(byDate);
    return (<><h1 className="h">مناسباتي</h1>
      {l.length ? l.map((e) => <EvRow key={e.id} s={s} e={e} del onOk={okEv} onDel={delEv} />)
        : <div className="card"><p>لسه مفيش مناسبات محفوظة.</p><button className="btn" onClick={() => go('cal')}>اختار تاريخ واحفظه</button></div>}
    </>);
  };

  const more = () => (<>
    <h1 className="h">المزيد</h1>
    <div className="card"><b>ضبط الجدول من الأول</b><p className="mut">لو الأرقام مش مظبوطة، قول أنت النهارده في أنهي يوم وأنا أظبط الباقي. المناسبات بتفضل زي ما هي.</p>
      <button className="btn sec" onClick={openSetup} style={{ width: '100%' }}>صحّح النهارده</button></div>
    <div className="card"><b>نسخة احتياطية للمناسبات</b><p className="mut">انسخ النص ده واحفظه. ولصقه هنا بعدين يرجّع المناسبات.</p>
      <textarea ref={bk} key={JSON.stringify(s.events)} defaultValue={JSON.stringify(s.events.map((e) => ({ date: e.date, title: e.title })))} />
      <button className="btn sec" onClick={importEv} style={{ width: '100%', marginTop: 8 }}>استيراد من النص</button></div>
    <div className="card"><p className="mut">كل البيانات محفوظة على الموبايل ده بس.</p>
      <button className="lnk" onClick={reset}>{rs ? 'اضغط تاني للتأكيد: مسح كل البيانات' : 'مسح كل البيانات'}</button></div>
  </>);

  const delayView = () => {
    const cur = cycleAt(s, t), nn = cur.n + k, c = extend(s, k, t);
    const chg = s.events.filter((e) => { const d = toN(e.date); return info(s, d).work !== info(c, d).work; });
    return (<>
      <h2 className="h2" style={{ marginTop: 0 }}>اتأخرت في الشغل</h2>
      <div className="card"><b>كام يوم زيادة؟</b>
        <div className="step"><button onClick={() => setK(Math.max(1, k - 1))} aria-label="أقل">−</button><b>{k}</b><button onClick={() => setK(Math.min(6, k + 1))} aria-label="أكتر">+</button></div></div>
      <ul className="pv">
        <li>الشغل هيبقى {days(nn)} بدل {days(cur.n)}</li>
        <li>هتنزل {short(cur.start + nn)} بدل {dm(cur.start + cur.n)}</li>
        <li>الإجازة هتبقى {days(nn)}، وهترجع {short(cur.start + 2 * nn)}</li>
        <li>بعدها الجدول يرجع {s.n} و{s.n} زي ما هو</li>
        <li>{chg.length ? '⚠ مناسبات هيتغيّر وضعها: ' + chg.map((e) => e.title).join('، ') : '✓ مفيش مناسبات هتتأثر'}</li>
      </ul>
      <div className="row"><button className="btn ghost" onClick={() => setSheet(null)}>إلغاء</button><button className="btn" onClick={confirmDelay}>أكّد التأخير</button></div>
    </>);
  };

  const views = { home, cal, ev: evs, more };
  return (<>
    <div className="wrap">{views[tab]()}</div>
    <nav>{[['home', 'الرئيسية'], ['cal', 'التقويم'], ['ev', 'مناسباتي'], ['more', 'المزيد']].map(([key, l]) =>
      <button key={key} className={tab === key ? 'on' : ''} onClick={() => go(key)}>{l}</button>)}</nav>
    {sheet && <div className="sheet"><div>{sheet === 'delay' ? delayView()
      : <><h2 className="h2" style={{ marginTop: 0 }}>ضبط الجدول</h2><SetupForm ob={ob} setOb={setOb} sheet onGo={obGo} onCancel={() => setSheet(null)} /></>}</div></div>}
    {toast && <div className="toast"><span>{toast.t}</span>{toast.u && <button onClick={doUndo}>تراجع</button>}</div>}
  </>);
}
