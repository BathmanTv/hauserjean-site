export interface Project {
  slug: string
  title: string
  icon: string
  tag: { en: string; fr: string }
  problem: { en: string; fr: string }
  build: { en: string; fr: string }
  stack: string[]
  status: { en: string; fr: string }
  links: { label: string; url: string }[]
  privateNote?: { en: string; fr: string }
}

export const PROJECTS: Project[] = [
  {
    slug: 'donatello',
    title: 'Donatello',
    icon: '◆',
    tag: { en: 'Multi-chain smart-contract security scanner', fr: 'Scanner de sécurité smart-contract multi-chaînes' },
    problem: {
      en: 'Smart-contract security audits are slow, manual, and do not scale across the many blockchain VMs in use — EVM, Solana, Move, Cairo, Cosmos and more, each with its own vulnerability classes.',
      fr: 'Les audits de sécurité smart-contract sont lents, manuels, et ne passent pas à l’échelle sur les nombreuses VMs blockchain — EVM, Solana, Move, Cairo, Cosmos… chacune avec ses classes de vulnérabilités.',
    },
    build: {
      en: 'A static-analysis engine covering 277 detectors across 24 ecosystems, each CTF-validated against a known-vulnerability corpus and regression-locked against false positives. Auto-detects file types, runs every relevant detector kit, then triages findings through a multi-gate pipeline into ranked, submit-ready candidates.',
      fr: 'Un moteur d’analyse statique : 277 détecteurs sur 24 écosystèmes, chacun validé CTF contre un corpus de vulnérabilités connues et verrouillé en régression contre les faux positifs. Auto-détecte les types de fichiers, lance chaque kit pertinent, puis trie les findings via un pipeline multi-gates en candidats classés prêts à soumettre.',
    },
    stack: ['Python', 'Slither', 'static analysis', 'CTF harness', 'Z3'],
    status: { en: 'Live · regression-locked · continuous sweeps', fr: 'Live · verrouillé régression · sweeps continus' },
    links: [{ label: 'GitHub', url: 'https://github.com/BathmanTv' }],
  },
  {
    slug: 'quant-trading',
    title: 'Quant & trading systems',
    icon: '▲',
    tag: { en: 'Algorithmic trading on prediction & crypto markets', fr: 'Trading algorithmique sur marchés de prédiction & crypto' },
    problem: {
      en: 'Fast-moving markets reward disciplined, automated execution over manual, emotional trading — but only if risk is controlled rigorously.',
      fr: 'Les marchés rapides récompensent l’exécution automatisée et disciplinée plutôt que le trading manuel et émotionnel — à condition de contrôler le risque rigoureusement.',
    },
    build: {
      en: 'Algorithmic trading systems with automated position sizing and risk gates, multi-confirmation entry logic, backtesting before going live, and a paper-trading shadow running in parallel. Designed around capital preservation first.',
      fr: 'Systèmes de trading algorithmique avec dimensionnement de position et garde-fous de risque automatisés, logique d’entrée multi-confirmation, backtesting avant le live, et un shadow paper-trading en parallèle. Pensés d’abord pour la préservation du capital.',
    },
    stack: ['Python', 'backtesting', 'risk engine', 'automation'],
    status: { en: 'Live · risk-gated', fr: 'Live · risque maîtrisé' },
    links: [],
    privateNote: { en: 'Strategy details kept private — happy to discuss the engineering in person.', fr: 'Détails de stratégie gardés privés — ravi d’en discuter techniquement de vive voix.' },
  },
  {
    slug: 'agentic-workflows',
    title: 'Agentic workflows',
    icon: '●',
    tag: { en: 'Multi-agent pipelines built with Claude', fr: 'Pipelines multi-agents construits avec Claude' },
    problem: {
      en: 'Complex research and automation tasks need orchestration beyond a single LLM call — parallel fan-out, verification, and structured output.',
      fr: 'Les tâches complexes de recherche et d’automatisation nécessitent une orchestration au-delà d’un seul appel LLM — fan-out parallèle, vérification, sortie structurée.',
    },
    build: {
      en: 'Multi-agent pipelines built with Claude and the Model Context Protocol: parallel research fan-out, adversarial verification of findings, and structured triage. They power sourcing, analysis and end-to-end automation across my other systems.',
      fr: 'Pipelines multi-agents construits avec Claude et le Model Context Protocol : recherche fan-out parallèle, vérification adversariale des findings, triage structuré. Ils alimentent le sourcing, l’analyse et l’automatisation end-to-end de mes autres systèmes.',
    },
    stack: ['Claude', 'MCP', 'orchestration', 'structured output'],
    status: { en: 'Active · evolving', fr: 'Actif · en évolution' },
    links: [],
  },
  {
    slug: 'career-ops',
    title: 'career-ops',
    icon: '◈',
    tag: { en: 'AI-scored job-application pipeline', fr: 'Pipeline de candidatures auto-scoré par IA' },
    problem: {
      en: 'Job opportunities are scattered across dozens of portals; manually tracking, scoring and tailoring applications does not scale.',
      fr: 'Les opportunités sont éparpillées sur des dizaines de portails ; suivre, scorer et adapter les candidatures à la main ne passe pas à l’échelle.',
    },
    build: {
      en: 'A pipeline that scans job portals, scores each offer against a personal priority model (work-mode, role fit, location), tailors a CV per offer, and tracks everything through a dashboard. Built to surface the few right roles, not blast many.',
      fr: 'Un pipeline qui scanne les portails, score chaque offre contre un modèle de priorités personnel (mode de travail, fit du rôle, localisation), adapte un CV par offre, et suit tout via un dashboard. Conçu pour faire émerger les bons postes, pas pour spammer.',
    },
    stack: ['Node', 'Claude', 'automation', 'dashboards'],
    status: { en: 'In use', fr: 'En usage' },
    links: [],
  },
  {
    slug: 'web-builds',
    title: 'Web builds',
    icon: '◇',
    tag: { en: 'Sites and tools shipped end-to-end', fr: 'Sites et outils livrés de bout en bout' },
    problem: {
      en: 'Ideas and clients need real, shipped interfaces — fast, accessible, and maintainable.',
      fr: 'Les idées et les clients ont besoin d’interfaces réelles et livrées — rapides, accessibles, maintenables.',
    },
    build: {
      en: 'This site (React + Vite, Swiss editorial, bilingual), a multi-direction studio landing, and a client architecture/design tool (canvas-based, PWA). Design, build and deploy owned end-to-end.',
      fr: 'Ce site (React + Vite, Swiss editorial, bilingue), une landing studio multi-directions, et un outil archi/design client (canvas, PWA). Design, build et déploiement pilotés de bout en bout.',
    },
    stack: ['React', 'Vite', 'Tailwind', 'vanilla JS', 'Canva/Konva'],
    status: { en: 'Live', fr: 'Live' },
    links: [{ label: 'hauserjean.fr', url: 'https://hauserjean.fr' }],
  },
]
