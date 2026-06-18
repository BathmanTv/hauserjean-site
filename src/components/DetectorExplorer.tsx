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
  const [eco, setEco] = useState<string | null>(null)
  const [sev, setSev] = useState<Severity | null>(null)
  const [open, setOpen] = useState(false)

  const ecoSuggest = useMemo(() => {
    const ql = q.toLowerCase()
    return ECOSYSTEMS.filter((e) => !ql || e.name.toLowerCase().includes(ql))
  }, [q])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return DETECTORS.filter(
      (d) =>
        (!eco || d.ecosystem === eco) &&
        (!sev || d.severity === sev) &&
        (!ql || (d.name + d.id + d.ecosystem).toLowerCase().includes(ql)),
    )
  }, [q, eco, sev])

  const hasFilters = eco || sev || q

  return (
    <section id="explorer" className="border-t border-line">
      <div className="mx-auto max-w-content px-6 md:px-8 py-16">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-[13px] text-accent">05</span>
          <h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('ex_label')}</h2>
        </div>
        <p className="text-muted text-[15px] max-w-2xl mb-8">
          {t('ex_intro_a')} <strong className="text-ink font-medium">{TOTAL_DETECTORS} {t('ex_intro_b')}</strong>{' '}
          <strong className="text-ink font-medium">{ECOSYSTEMS.length}</strong> {t('ex_intro_c')}
        </p>

        {/* action search bar */}
        <div className="relative mb-4">
          <div className="flex items-center gap-3 border border-line rounded-xl bg-white px-4 py-3 focus-within:border-accent transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={t('ex_search')}
              className="flex-1 font-mono text-[13.5px] bg-transparent outline-none"
            />
            <span className="font-mono text-[11px] text-muted">{filtered.length}/{DETECTORS.length}</span>
          </div>

          {open && (
            <div className="absolute z-20 left-0 right-0 mt-2 border border-line rounded-xl bg-white shadow-sm p-3 max-h-[260px] overflow-y-auto">
              <p className="font-mono text-[10.5px] uppercase tracking-wide text-muted mb-2">ecosystems</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ecoSuggest.map((e) => (
                  <button key={e.name} onMouseDown={(ev) => { ev.preventDefault(); setEco(e.name); setOpen(false) }}
                    className={`font-mono text-[11px] px-2 py-1 rounded border transition-colors ${eco === e.name ? 'bg-ink text-paper border-ink' : 'border-line hover:border-accent'}`}>
                    {e.name} <span className="opacity-60">{e.count}</span>
                  </button>
                ))}
              </div>
              <p className="font-mono text-[10.5px] uppercase tracking-wide text-muted mb-2">severity</p>
              <div className="flex flex-wrap gap-1.5">
                {SEV_ORDER.map((s) => (
                  <button key={s} onMouseDown={(ev) => { ev.preventDefault(); setSev(s); setOpen(false) }}
                    className={`font-mono text-[11px] px-2 py-1 rounded border transition-colors ${sev === s ? 'bg-ink text-paper border-ink' : 'border-line hover:border-accent'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* active filter pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {eco && <button onClick={() => setEco(null)} className="font-mono text-[11px] bg-paper border border-accent text-accent rounded px-2 py-1">{eco} ✕</button>}
            {sev && <button onClick={() => setSev(null)} className="font-mono text-[11px] bg-paper border border-accent text-accent rounded px-2 py-1">{sev} ✕</button>}
            <button onClick={() => { setEco(null); setSev(null); setQ('') }} className="font-mono text-[11px] text-muted hover:text-accent">clear all</button>
          </div>
        )}

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
