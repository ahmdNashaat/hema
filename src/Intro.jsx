import { useState } from 'react';

const KEY = 'jadwali_intro_v1';
export const seenIntro = () => { try { return !!localStorage.getItem(KEY); } catch { return true; } };
export const markIntro = () => { try { localStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ } };

const rib = (n, o) => (
  <div className="rib">{Array.from({ length: 2 * n }, (_, x) => <i key={x} className={(x < n ? 'rw' : 'rl') + (x === o ? ' t' : '')} />)}</div>
);

const slides = [
  { t: 'أهلاً بيك في جدولي', p: 'بتعرف أي يوم هو شغل وأي يوم إجازة، من غير ما تعدّ على صوابعك.', v: rib(5, 2) },
  { t: 'اختار أي تاريخ', p: 'افتح التقويم ودوس على اليوم، وتعرف على طول هو يوم كام من شغلك أو إجازتك.',
    v: <div className="hero leave" style={{ margin: 0 }}><div className="tag">الخميس 12 نوفمبر</div><div className="big">يوم 2 من إجازتك</div></div> },
  { t: 'احفظ مناسباتك', p: 'احفظ العزومة وتاريخها، والتطبيق يقولك بتقع في شغلك ولا إجازتك، ويحذّرك لو جدولك اتغيّر.',
    v: <div><span className="pill l">✓ بتقع في إجازتك، يوم 4</span></div> },
  { t: 'اتأخرت في الشغل؟', p: 'دوس «اتأخرت في الشغل» وحدد الأيام الزيادة، وكل التواريخ بتتحدّث لوحدها. وتقدر تتراجع.',
    v: <><div className="step"><button disabled aria-hidden="true">−</button><b>1</b><button disabled aria-hidden="true">+</button></div>
      <p className="mut" style={{ textAlign: 'center', margin: 0 }}>بياناتك على موبايلك بس، والتطبيق شغال من غير نت.</p></> },
];

export default function Intro({ onDone }) {
  const [i, setI] = useState(0);
  const s = slides[i], last = i === slides.length - 1;
  return (
    <div className="intro">
      <button className="lnk skip" onClick={onDone}>تخطّي</button>
      <div className="vis">{s.v}</div>
      <h1 className="h">{s.t}</h1>
      <p className="ip">{s.p}</p>
      <div className="dots">{slides.map((_, x) => <i key={x} className={x === i ? 'on' : ''} />)}</div>
      <div className="row">
        {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>السابق</button>}
        <button className="btn" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? 'ابدأ' : 'التالي'}</button>
      </div>
    </div>
  );
}
