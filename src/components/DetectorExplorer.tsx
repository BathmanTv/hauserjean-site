import { useMemo, useState } from 'react'
import { DETECTORS, ECOSYSTEMS, TOTAL_DETECTORS, type Severity } from '../data'
import { useLang } from '../i18n'

const SEV_ORDER: Severity[] = ['High', 'Medium', 'Low', 'Info']
const sevClass: Record<Severity, string> = {
  High: 'bg-red-50 text-red-800 border-red-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  Low: 'bg-blue-50 text-blue-800 border-blue-200',
  Info: 'bg-stone-100 text-stone-600 border-stone-200',
}

export default function DetectorExplorer() {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [eco, setEco] = useState<string>('All')
  const [sev, setSev] = useState<string>('All')

  const ecos = useMemo(() => ['All', ...ECOSYSTEMS.map((e) => e.name)], [])
  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return DETECTORS.filter(
      (d) =>
        (eco === 'All' || d.ecosystem === eco) &&
        (sev === 'All' || d.severity === sev) &&
        (!ql || (d.name + d.id + d.ecosystem).toLowerCase().includes(ql)),
    )
  }, [q, eco, sev])

  return (
    <section id="explorer" className="border-t border-line py-16">
      <div className="mx-auto max-w-content px-6 md:px-8">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-[13px] text-accent">05</span>
          <h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('ex_label')}</h2>
        </div>
        <p className="text-muted text-[15px] max-w-2xl mb-8">
          {t('ex_intro_a')} <strong className="text-ink font-medium">{TOTAL_DETECTORS} {t('ex_intro_b')}</strong>{' '}
          <strong className="text-ink font-medium">{ECOSYSTEMS.length}</strong> {t('ex_intro_c')}
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ex_search')}
            className="flex-1 min-w-[180px] font-mono text-[13px] bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-accent" />
          <select value={eco} onChange={(e) => setEco(e.target.value)} className="font-mono text-[13px] bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-accent">
            {ecos.map((e) => <option key={e}>{e}</option>)}
          </select>
          <select value={sev} onChange={(e) => setSev(e.target.value)} className="font-mono text-[13px] bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-accent">
            <option>All</option>{SEV_ORDER.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {ECOSYSTEMS.map((e) => (
            <button key={e.name} onClick={() => setEco(e.name)}
              className={`font-mono text-[11px] px-2 py-1 rounded border transition-colors ${eco === e.name ? 'bg-ink text-paper border-ink' : 'bg-white text-muted border-line hover:border-accent'}`}>
              {e.name} <span className="opacity-60">{e.count}</span>
            </button>
          ))}
        </div>

        <div className="border border-line rounded-xl overflow-hidden bg-white">
          {filtered.length === 0 && <p className="p-6 text-center font-mono text-[13px] text-muted">{t('ex_none')}</p>}
          {filtered.map((d, i) => (
            <div key={d.id} className={`grid grid-cols-[56px_1fr_auto] gap-3 items-center px-4 py-3 ${i !== 0 ? 'border-t border-line' : ''}`}>
              <span className="font-mono text-[12px] text-muted">{d.id}</span>
              <span><span className="text-[14px] text-ink">{d.name}</span> <span className="font-mono text-[11px] text-muted">· {d.ecosystem}</span></span>
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${sevClass[d.severity]}`}>{d.severity}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[11px] text-muted mt-3">
          {filtered.length} {t('ex_shown')}{' '}
          <a href="https://github.com/BathmanTv" target="_blank" rel="noopener" className="text-accent border-b border-line hover:border-accent">github.com/BathmanTv</a>
        </p>
      </div>
    </section>
  )
}
