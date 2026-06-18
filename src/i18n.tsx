/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'fr'

type Dict = Record<string, { en: string; fr: string }>

export const S: Dict = {
  nav_work: { en: 'work', fr: 'parcours' },
  nav_lab: { en: 'lab', fr: 'lab' },
  nav_contact: { en: 'contact', fr: 'contact' },
  nav_index: { en: '— index', fr: '— index' },

  hero_role: { en: 'Senior Product Owner · Cybersecurity PM · Builder', fr: 'Senior Product Owner · Cybersecurity PM · Builder' },
  hero_l1: { en: 'I manage critical programs.', fr: 'Je pilote des programmes critiques.' },
  hero_build_pre: { en: 'I build ', fr: 'Je construis ' },
  hero_build_em: { en: 'the tools', fr: 'les outils' },
  hero_build_post: { en: ' too.', fr: ' aussi.' },
  hero_intro: {
    en: 'I run cybersecurity and product programs across the Airbus ecosystem — Europe, China and APAC — and I build the security tooling I care about. 7+ years turning complex, regulated delivery into shipped outcomes.',
    fr: "Je pilote des programmes cybersécurité et produit dans l'écosystème Airbus — Europe, Chine et APAC — et je construis l'outillage sécurité qui me tient à cœur. 7+ ans à transformer du delivery complexe et régulé en résultats livrés.",
  },
  hero_cta: { en: 'Get in touch →', fr: 'Me contacter →' },
  hero_cv: { en: 'Download CV', fr: 'Télécharger le CV' },

  s01: { en: "What I've delivered", fr: 'Ce que j’ai livré' },
  out1k: { en: 'EU + China + APAC', fr: 'EU + Chine + APAC' },
  out1v: { en: 'cyber programs coordinated across Airbus international entities', fr: 'programmes cyber coordonnés sur les entités internationales Airbus' },
  out2k: { en: 'Legacy → modern', fr: 'Legacy → moderne' },
  out2v: { en: 'in-house machine-to-machine tooling rebuilt as a scaled web platform', fr: 'outillage machine-to-machine interne reconstruit en plateforme web à l’échelle' },
  out3k: { en: 'SAFe at scale', fr: 'SAFe à l’échelle' },
  out3v: { en: 'product ownership inside an Agile Release Train, multi-timezone', fr: 'product ownership dans un Agile Release Train, multi-fuseaux' },

  s02: { en: 'Case study — digitizing a legacy aerospace toolchain', fr: 'Étude de cas — digitaliser une chaîne legacy aéronautique' },
  cs_tldr: { en: 'TL;DR — turned a brittle machine-to-machine internal tool into a modern, centralized web platform inside Airbus, owning it end-to-end in a SAFe train. Anonymized (Tier-1 aerospace, NDA).', fr: 'TL;DR — transformé un outil interne machine-to-machine fragile en plateforme web moderne et centralisée chez Airbus, piloté de bout en bout dans un train SAFe. Anonymisé (aéronautique Tier-1, NDA).' },
  cs_ctx_h: { en: 'Context', fr: 'Contexte' },
  cs_ctx: { en: 'Critical airline-support data lived in a legacy machine-to-machine system — hard to evolve, opaque to the business, slow to onboard new use cases.', fr: 'Des données critiques de support aux compagnies vivaient dans un système legacy machine-to-machine — difficile à faire évoluer, opaque pour le métier, lent à intégrer de nouveaux cas d’usage.' },
  cs_to_h: { en: 'The trade-off I owned', fr: 'L’arbitrage que j’ai tranché' },
  cs_to: { en: 'Rebuild as a modern web platform vs. patch the legacy. I chose rebuild — but phased, shipping value per release rather than a big-bang migration, to keep stakeholders bought-in.', fr: 'Reconstruire en plateforme web moderne vs. patcher le legacy. J’ai choisi reconstruire — mais par phases, en livrant de la valeur à chaque release plutôt qu’une migration big-bang, pour garder les parties prenantes engagées.' },
  cs_how_h: { en: 'How', fr: 'Comment' },
  cs_how: { en: 'Product ownership in an Agile Release Train: requirement framing, backlog maturation, UX wireframes, user stories & acceptance criteria, test scenarios, stakeholder alignment across PMO, solution owner and dev teams.', fr: 'Product ownership dans un Agile Release Train : cadrage des besoins, maturation du backlog, wireframes UX, user stories & critères d’acceptation, scénarios de test, alignement des parties prenantes (PMO, solution owner, équipes dev).' },
  cs_res_h: { en: "Result & what I'd redo", fr: 'Résultat & ce que je referais' },
  cs_res: { en: 'A high-performance, maintainable platform aligned to the group methodology. Next time I’d lock the data contract earlier — late schema changes cost the most.', fr: 'Une plateforme performante et maintenable alignée sur la méthodologie groupe. La prochaine fois je verrouillerais le data contract plus tôt — les changements de schéma tardifs coûtent le plus cher.' },

  s03: { en: 'Decision log', fr: 'Journal de décisions' },
  d1: { en: 'Precision over coverage on the scanner', fr: 'Précision avant couverture sur le scanner' },
  d1a: { en: 'ship more detectors faster', fr: 'livrer plus de détecteurs plus vite' },
  d1w: { en: 'a security tool that cries wolf gets ignored — false-positive storms kill trust before coverage ever helps.', fr: 'un outil sécurité qui crie au loup est ignoré — les tempêtes de faux positifs tuent la confiance avant que la couverture ne serve.' },
  d2: { en: 'Say no early rather than confirm late', fr: 'Dire non tôt plutôt que confirmer tard' },
  d2a: { en: 'keep options open for stakeholders', fr: 'garder les options ouvertes pour les parties prenantes' },
  d2w: { en: 'a clear early no protects the roadmap; a late maybe burns a whole sprint.', fr: 'un non clair et précoce protège la roadmap ; un peut-être tardif brûle un sprint entier.' },
  d3: { en: 'Anonymize real bugs into reproducible CTF fixtures', fr: 'Anonymiser les vrais bugs en fixtures CTF reproductibles' },
  d3a: { en: 'test on live targets only', fr: 'tester uniquement sur cibles live' },
  d3w: { en: 'regression-locked fixtures catch silent detector breakage that live runs never surface.', fr: 'des fixtures verrouillées en régression attrapent les casses silencieuses de détecteurs que les runs live ne révèlent jamais.' },
  rejected: { en: 'rejected:', fr: 'écarté :' },
  why: { en: 'why:', fr: 'pourquoi :' },

  exp_title: { en: 'Experience', fr: 'Expérience' },
  w1r: { en: 'Cybersecurity Project Manager (APAC & China)', fr: 'Cybersecurity Project Manager (APAC & Chine)' },
  w2r: { en: 'Product Owner / Project Leader', fr: 'Product Owner / Project Leader' },
  w3r: { en: 'Project Manager', fr: 'Chef de projet' },
  w4r: { en: 'Digital Project Manager', fr: 'Chef de projet digital' },

  contact_title: { en: "Let's talk", fr: 'Discutons' },
  contact_sub: { en: 'Open to senior product, project and cybersecurity roles — remote-first, EU + APAC timezones.', fr: 'Ouvert aux postes senior produit, projet et cybersécurité — remote-first, fuseaux EU + APAC.' },
  footer_built: { en: 'built in React · Swiss editorial', fr: 'fait en React · Swiss editorial' },

  // explorer
  ex_label: { en: 'Donatello — detector explorer', fr: 'Donatello — explorateur de détecteurs' },
  ex_intro_a: { en: 'The security scanner I built.', fr: 'Le scanner de sécurité que j’ai construit.' },
  ex_intro_b: { en: 'detectors across', fr: 'détecteurs sur' },
  ex_intro_c: { en: 'blockchain ecosystems, each CTF-validated. Filter the engine below — sample classes shown.', fr: 'écosystèmes blockchain, chacun validé CTF. Filtre le moteur ci-dessous — classes d’exemple affichées.' },
  ex_search: { en: 'search detectors…', fr: 'chercher des détecteurs…' },
  ex_none: { en: 'no detector matches', fr: 'aucun détecteur ne correspond' },
  ex_shown: { en: 'shown · full engine open-source →', fr: 'affichés · moteur complet open-source →' },

  // scanner
  sc_label: { en: 'Try it — live Solidity scan', fr: 'Essaie — scan Solidity live' },
  sc_intro: { en: 'A deterministic browser slice of the engine. Paste a contract or load an example, then run a scan. Runs fully client-side.', fr: 'Une tranche déterministe du moteur, côté navigateur. Colle un contrat ou charge un exemple, puis lance un scan. 100% côté client.' },
  sc_run: { en: '▸ run scan', fr: '▸ lancer le scan' },
  sc_placeholder: { en: 'findings will appear here…', fr: 'les findings apparaîtront ici…' },
  sc_clean: { en: '✓ no issues detected by the demo ruleset', fr: '✓ aucun problème détecté par le ruleset démo' },
  sc_note: { en: 'Demo ruleset (5 patterns). The full engine covers 277 detectors across 24 ecosystems with AST analysis.', fr: 'Ruleset démo (5 patterns). Le moteur complet couvre 277 détecteurs sur 24 écosystèmes avec analyse AST.' },

  proj_label: { en: 'lab — things I build', fr: 'lab — ce que je construis' },
  proj_title: { en: "I've been building a lot of things", fr: 'Je construis beaucoup de choses' },
  proj_view: { en: 'view project →', fr: 'voir le projet →' },
  proj_back: { en: '← all projects', fr: '← tous les projets' },
  pd_problem: { en: 'The problem', fr: 'Le problème' },
  pd_build: { en: 'What I built', fr: "Ce que j'ai construit" },
  pd_stack: { en: 'Stack', fr: 'Stack' },
  pd_status: { en: 'Status', fr: 'Statut' },
  pd_links: { en: 'Links', fr: 'Liens' },
}

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof S) => string }
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => S[k]?.en ?? String(k) })

export function LangProvider({ children }: { children: ReactNode }) {
  const init: Lang = typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en'
  const [lang, setLang] = useState<Lang>(init)
  const t = (k: keyof typeof S) => S[k]?.[lang] ?? String(k)
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
