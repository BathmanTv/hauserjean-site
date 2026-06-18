import DetectorExplorer from './components/DetectorExplorer'
import Scanner from './components/Scanner'
import { PROFILE } from './data'
import { useLang } from './i18n'

export default function App() {
  const { t, lang, setLang } = useLang()

  const OUTCOMES = [
    { k: t('out1k'), v: t('out1v') },
    { k: t('out2k'), v: t('out2v') },
    { k: t('out3k'), v: t('out3v') },
  ]
  const DECISIONS = [
    { d: t('d1'), alt: t('d1a'), why: t('d1w') },
    { d: t('d2'), alt: t('d2a'), why: t('d2w') },
    { d: t('d3'), alt: t('d3a'), why: t('d3w') },
  ]
  const WORK = [
    { date: '2025 → now', role: t('w1r'), org: 'Airbus · freelance' },
    { date: '2021 → 2025', role: t('w2r'), org: 'Airbus · via LINK & Hauban' },
    { date: '2018 → 2020', role: t('w3r'), org: 'ALTEN · Airbus account' },
    { date: '2018', role: t('w4r'), org: "W'COM Agency" },
  ]

  return (
    <div className="font-sans text-ink">
      <header className="mx-auto max-w-content px-6 md:px-8 flex items-center justify-between py-6 border-b border-line">
        <span className="font-mono text-[13px]"><b className="font-medium">Jean Hauser</b> <span className="text-muted">{t('nav_index')}</span></span>
        <nav className="font-mono text-[13px] flex gap-5 text-muted items-center">
          <a href="#work" className="hover:text-accent">{t('nav_work')}</a>
          <a href="#explorer" className="hover:text-accent">{t('nav_lab')}</a>
          <a href="#contact" className="hover:text-accent">{t('nav_contact')}</a>
          <button onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="border border-line rounded px-2 py-1 hover:border-accent hover:text-accent transition-colors" aria-label="switch language">
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </nav>
      </header>

      <section className="mx-auto max-w-content px-6 md:px-8 pt-20 pb-16 border-b border-line">
        <p className="font-mono text-[12px] uppercase tracking-wider text-accent mb-5">{t('hero_role')}</p>
        <h1 className="font-disp font-bold leading-[0.98] tracking-[-0.03em] text-[clamp(40px,8vw,82px)] mb-6">
          {t('hero_l1')}<br /><span className="text-muted font-normal">{t('hero_build_pre')}<span className="text-ink border-b-[3px] border-accent pb-0.5">{t('hero_build_em')}</span>{t('hero_build_post')}</span>
        </h1>
        <p className="text-[19px] text-muted max-w-2xl mb-8">{t('hero_intro')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#contact" className="inline-flex items-center gap-2 bg-ink text-paper font-mono text-[14px] px-6 py-3 hover:bg-accent transition-colors">{t('hero_cta')}</a>
          <a href="/JeanHauser_CV.pdf" className="font-mono text-[14px] border-b border-ink hover:text-accent hover:border-accent">{t('hero_cv')}</a>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 md:px-8 py-14 border-b border-line">
        <div className="flex items-baseline gap-3 mb-8"><span className="font-mono text-[13px] text-accent">01</span><h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('s01')}</h2></div>
        <div className="grid md:grid-cols-3 border border-line">
          {OUTCOMES.map((o, i) => (
            <div key={i} className={`p-6 ${i !== 2 ? 'md:border-r border-line' : ''} ${i !== 0 ? 'border-t md:border-t-0 border-line' : ''}`}>
              <p className="font-disp text-[18px] font-medium mb-2">{o.k}</p>
              <p className="text-[14px] text-muted">{o.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 md:px-8 py-14 border-b border-line">
        <div className="flex items-baseline gap-3 mb-6"><span className="font-mono text-[13px] text-accent">02</span><h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('s02')}</h2></div>
        <p className="font-mono text-[12px] text-muted mb-5 max-w-2xl">{t('cs_tldr')}</p>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-3xl">
          <div><p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('cs_ctx_h')}</p><p className="text-[15px] text-muted">{t('cs_ctx')}</p></div>
          <div><p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('cs_to_h')}</p><p className="text-[15px] text-muted">{t('cs_to')}</p></div>
          <div><p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('cs_how_h')}</p><p className="text-[15px] text-muted">{t('cs_how')}</p></div>
          <div><p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('cs_res_h')}</p><p className="text-[15px] text-muted">{t('cs_res')}</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 md:px-8 py-14 border-b border-line">
        <div className="flex items-baseline gap-3 mb-6"><span className="font-mono text-[13px] text-accent">03</span><h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('s03')}</h2></div>
        <div className="space-y-5 max-w-3xl">
          {DECISIONS.map((x, i) => (
            <div key={i} className="border-l-2 border-accent pl-5">
              <p className="text-[16px] font-medium">{x.d}</p>
              <p className="text-[14px] text-muted mt-1"><span className="font-mono text-[12px]">{t('rejected')}</span> {x.alt} · <span className="font-mono text-[12px]">{t('why')}</span> {x.why}</p>
            </div>
          ))}
        </div>
      </section>

      <DetectorExplorer />
      <Scanner />

      <section id="work" className="mx-auto max-w-content px-6 md:px-8 py-14 border-t border-line">
        <div className="flex items-baseline gap-3 mb-8"><span className="font-mono text-[13px] text-accent">06</span><h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('exp_title')}</h2></div>
        <div className="border-t border-line">
          {WORK.map((w, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr] gap-4 py-4 border-b border-line">
              <span className="font-mono text-[12px] text-accent">{w.date}</span>
              <span><span className="font-disp text-[17px] font-medium">{w.role}</span><div className="text-[14px] text-muted">{w.org}</div></span>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-content px-6 md:px-8 py-16 border-t border-line">
        <div className="flex items-baseline gap-3 mb-6"><span className="font-mono text-[13px] text-accent">07</span><h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('contact_title')}</h2></div>
        <p className="text-[16px] text-muted max-w-xl mb-6">{t('contact_sub')}</p>
        <div className="flex flex-wrap gap-3">
          <a href={`mailto:${PROFILE.email}`} className="font-mono text-[13px] border border-line rounded-lg px-4 py-2.5 hover:border-accent">{PROFILE.email}</a>
          <a href={PROFILE.linkedin} target="_blank" rel="noopener" className="font-mono text-[13px] border border-line rounded-lg px-4 py-2.5 hover:border-accent">LinkedIn ↗</a>
          <a href={PROFILE.github} target="_blank" rel="noopener" className="font-mono text-[13px] border border-line rounded-lg px-4 py-2.5 hover:border-accent">GitHub ↗</a>
        </div>
      </section>

      <footer className="mx-auto max-w-content px-6 md:px-8 py-8 border-t border-line flex flex-wrap justify-between gap-3 font-mono text-[12px] text-muted">
        <span>© 2026 Jean Hauser · {PROFILE.location}</span>
        <span>{t('footer_built')}</span>
      </footer>
    </div>
  )
}
