import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PROJECTS } from '../projects'
import { useLang } from '../i18n'

export default function ProjectPage() {
  const { slug } = useParams()
  const { t, lang, setLang } = useLang()
  const p = PROJECTS.find((x) => x.slug === slug)

  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  // per-route SEO metadata (Googlebot renders JS); restored on unmount
  useEffect(() => {
    if (!p) return
    const prevTitle = document.title
    const setMeta = (sel: string, attr: string, val: string) => {
      const el = document.querySelector(sel) as HTMLMetaElement | HTMLLinkElement | null
      const prev = el?.getAttribute(attr) ?? null
      if (el) el.setAttribute(attr, val)
      return () => { if (el && prev !== null) el.setAttribute(attr, prev) }
    }
    document.title = `${p.title} — Jean Hauser`
    const restore = [
      setMeta('meta[name="description"]', 'content', `${p.title} — ${p.tag.en}. Built by Jean Hauser.`),
      setMeta('link[rel="canonical"]', 'href', `https://hauserjean.fr/projects/${p.slug}`),
      setMeta('meta[property="og:title"]', 'content', `${p.title} — Jean Hauser`),
      setMeta('meta[property="og:url"]', 'content', `https://hauserjean.fr/projects/${p.slug}`),
    ]
    return () => { document.title = prevTitle; restore.forEach((r) => r()) }
  }, [p])

  if (!p) {
    return (
      <div className="mx-auto max-w-content px-6 md:px-8 py-24 font-sans text-ink">
        <p className="font-mono text-[14px] text-muted">Project not found.</p>
        <Link to="/" className="font-mono text-[13px] text-accent border-b border-line">{t('proj_back')}</Link>
      </div>
    )
  }

  return (
    <div className="font-sans text-ink min-h-screen">
      <header className="border-b border-line py-6">
        <div className="mx-auto max-w-content px-6 md:px-8 flex items-center justify-between">
          <Link to="/" className="font-mono text-[13px] text-muted hover:text-accent">{t('proj_back')}</Link>
          <button onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="font-mono text-[13px] text-muted border border-line rounded px-2 py-1 hover:border-accent hover:text-accent transition-colors" aria-label="switch language">
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
      </header>

      <article className="mx-auto max-w-content px-6 md:px-8 py-16">
        <div className="flex items-center gap-4 mb-3">
          <span className="font-disp text-[32px] text-accent">{p.icon}</span>
          <h1 className="font-disp text-[clamp(32px,6vw,56px)] font-bold tracking-[-0.02em]">{p.title}</h1>
        </div>
        <p className="text-[18px] text-muted max-w-2xl mb-12">{p.tag[lang]}</p>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-3xl mb-12">
          <div><p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('pd_problem')}</p><p className="text-[15px] text-muted leading-relaxed">{p.problem[lang]}</p></div>
          <div><p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('pd_build')}</p><p className="text-[15px] text-muted leading-relaxed">{p.build[lang]}</p></div>
        </div>

        <div className="flex flex-wrap gap-x-12 gap-y-6 items-start border-t border-line pt-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('pd_stack')}</p>
            <div className="flex flex-wrap gap-1.5">{p.stack.map((s) => <span key={s} className="font-mono text-[11px] text-muted border border-line rounded px-2 py-0.5">{s}</span>)}</div>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('pd_status')}</p>
            <p className="font-mono text-[13px]" style={{ color: '#7A2E2E' }}>{p.status[lang]}</p>
          </div>
          {p.links.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-accent mb-2">{t('pd_links')}</p>
              <div className="flex flex-wrap gap-2">
                {p.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener" className="font-mono text-[13px] text-accent border-b border-line hover:border-accent">{l.label} ↗</a>)}
              </div>
            </div>
          )}
        </div>

        {p.privateNote && <p className="font-mono text-[12px] text-muted mt-8 border-l-2 border-line pl-4">{p.privateNote[lang]}</p>}
      </article>
    </div>
  )
}
