import { Link } from 'react-router-dom'
import { PROJECTS } from '../projects'
import { useLang } from '../i18n'

export default function Projects() {
  const { t, lang } = useLang()
  return (
    <section id="projects" className="border-t border-line">
      <div className="mx-auto max-w-content px-6 md:px-8 py-14">
        <p className="font-mono text-[12px] text-muted mb-1">## {t('proj_label')}</p>
        <div className="flex items-baseline gap-3 mb-8"><span className="font-mono text-[13px] text-accent">04</span><h2 className="font-disp text-2xl md:text-3xl font-medium tracking-tight">{t('proj_title')}</h2></div>
        <div className="grid sm:grid-cols-2 gap-3">
          {PROJECTS.map((p) => (
            <Link key={p.slug} to={`/projects/${p.slug}`}
              className="group border border-line rounded-xl p-5 bg-paper hover:border-accent transition-colors block">
              <div className="flex items-start justify-between mb-3">
                <span className="font-disp text-[20px] text-accent">{p.icon}</span>
                <span className="font-mono text-[11px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">{t('proj_view')}</span>
              </div>
              <p className="font-disp text-[18px] font-medium mb-1">{p.title}</p>
              <p className="text-[13px] text-muted leading-relaxed">{p.tag[lang]}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.stack.slice(0, 4).map((s) => (
                  <span key={s} className="font-mono text-[10.5px] text-muted border border-line rounded px-2 py-0.5">{s}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
