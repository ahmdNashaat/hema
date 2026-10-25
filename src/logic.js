// Core schedule logic. A cycle = { start, n }: n work days, then n leave days.
// Dates are handled as whole-day numbers (UTC) so daylight saving never shifts a day.
export const D = 864e5;
export const toN = (s) => { const [a, b, c] = s.split('-').map(Number); return Math.round(Date.UTC(a, b - 1, c) / D); };
export const toS = (n) => new Date(n * D).toISOString().slice(0, 10);
export const todayN = () => { const t = new Date(); return Math.round(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / D); };

export const fmt = (n, o) => new Date(n * D).toLocaleDateString('ar-EG-u-nu-latn', { timeZone: 'UTC', ...o });
export const short = (n) => fmt(n, { weekday: 'long', day: 'numeric', month: 'long' });
export const dm = (n) => fmt(n, { day: 'numeric', month: 'long' });
export const days = (n) => (n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? n + ' أيام' : n + ' يوم');
export const after = (k) => (k === 1 ? 'بكره' : 'بعد ' + days(k));

export function cycleAt(s, d) {
  const cs = s.cycles, N = s.n, f = cs[0];
  if (d < f.start) { const k = Math.floor((d - f.start) / (2 * N)); return { start: f.start + k * 2 * N, n: N }; }
  for (const x of cs) if (d < x.start + 2 * x.n) return x;
  const l = cs[cs.length - 1], e = l.start + 2 * l.n, k = Math.floor((d - e) / (2 * N));
  return { start: e + k * 2 * N, n: N };
}

export function info(s, d) {
  const c = cycleAt(s, d), o = d - c.start, w = o < c.n;
  return { work: w, day: w ? o + 1 : o - c.n + 1, n: c.n, pStart: c.start + (w ? 0 : c.n), pEnd: c.start + (w ? c.n : 2 * c.n) - 1 };
}

// Returns a new state where the cycle containing day t is k days longer (work k more, leave k more).
export function extend(s, k, t) {
  const c = JSON.parse(JSON.stringify(s));
  let l = c.cycles[c.cycles.length - 1];
  while (t >= l.start + 2 * l.n) { l = { start: l.start + 2 * l.n, n: c.n }; c.cycles.push(l); }
  l.n += k;
  return c;
}

export function startState(o, prev) {
  const t = todayN(), start = o.work ? t - (o.day - 1) : t - o.n - (o.day - 1);
  return { n: o.n, cycles: [{ start, n: o.n }], events: prev ? prev.events : [], seq: prev ? prev.seq : 1 };
}
