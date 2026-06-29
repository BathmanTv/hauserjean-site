import { useState } from 'react'
import { SCAN_RULES, SAMPLE_CONTRACTS, type Severity } from '../data'
import { useLang } from '../i18n'

const sevClass: Record<Severity, string> = {
  High: 'text-red-700', Medium: 'text-amber-700', Low: 'text-blue-700', Info: 'text-stone-500',
}

interface Finding { id: string; name: string; severity: Severity; note: string }

export default function Scanner() {
  const { t } = useLang()
  const [code, setCode] = useState(SAMPLE_CONTRACTS[0].code)
  const [findings, setFindings] = useState<Finding[] | null>(null)

  function scan() {
    try {
      const hits = SCAN_RULES.filter((r) => r.test(code)).map((r) => ({ id: r.id, name: r.name, severity: r.severity, note: r.note }))
      setFindings(hits)
    } catch {
      setFindings([])
    }
  }

  return (
    <section id="scanner" className="border-t border-line py-16 bg-white">
      <div className="mx-auto max-w-content px-6 md:px-8">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-[13px] text-accent">06</span>
          <h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('sc_label')}</h2>
        </div>
        <p className="text-muted text-[15px] max-w-2xl mb-6">{t('sc_intro')}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {SAMPLE_CONTRACTS.map((c) => (
            <button key={c.label} onClick={() => { setCode(c.code); setFindings(null) }}
              className="font-mono text-[12px] px-3 py-2.5 rounded border border-line bg-paper hover:border-accent transition-colors">
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <textarea value={code} onChange={(e) => { setCode(e.target.value); setFindings(null) }} spellCheck={false} rows={9}
              className="w-full font-mono text-[12.5px] leading-relaxed bg-[#0d0f12] text-[#e8e6e0] rounded-xl p-4 outline-none focus:ring-2 focus:ring-accent resize-y" />
            <button onClick={scan}
              className="mt-3 font-mono text-[13px] bg-ink text-paper px-5 py-2.5 rounded-lg hover:bg-accent transition-colors">
              {t('sc_run')}
            </button>
          </div>

          <div className="border border-line rounded-xl p-4 bg-paper min-h-[220px]">
            {findings === null && <p className="font-mono text-[12px] text-muted">{t('sc_placeholder')}</p>}
            {findings?.length === 0 && <p className="font-mono text-[13px] text-green-700">{t('sc_clean')}</p>}
            {findings && findings.length > 0 && findings.map((f) => (
              <div key={f.id} className="mb-3 pb-3 border-b border-line last:border-0">
                <p className="text-[14px]"><span className={`font-mono text-[11px] ${sevClass[f.severity]}`}>[{f.severity}]</span> <span className="font-medium">{f.name}</span> <span className="font-mono text-[11px] text-muted">{f.id}</span></p>
                <p className="text-[13px] text-muted mt-1">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="font-mono text-[11px] text-muted mt-3">{t('sc_note')}</p>
      </div>
    </section>
  )
}
