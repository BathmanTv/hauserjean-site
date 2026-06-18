// Real content for Jean Hauser's portfolio v2 (Swiss editorial, React).

export type Severity = 'High' | 'Medium' | 'Low' | 'Info'

export interface Detector { id: string; name: string; ecosystem: string; severity: Severity }

// Donatello — real ecosystem coverage (the tool Jean built). Counts reflect the
// engine's detector kits; sample detectors are representative real classes.
export const ECOSYSTEMS: { name: string; count: number }[] = [
  { name: 'EVM', count: 48 }, { name: 'Solana', count: 42 }, { name: 'Vyper', count: 22 },
  { name: 'Move', count: 22 }, { name: 'Cairo', count: 20 }, { name: 'Cosmos/Go', count: 18 },
  { name: 'Stellar/Soroban', count: 16 }, { name: 'Clarity', count: 15 }, { name: 'AA/4337', count: 12 },
  { name: 'Sui', count: 12 }, { name: 'Cadence', count: 12 }, { name: 'Aptos', count: 12 },
  { name: 'Sway', count: 11 }, { name: 'CosmWasm', count: 10 }, { name: 'Polkadot', count: 10 },
  { name: 'TON/Tact', count: 10 }, { name: 'Bitcoin', count: 10 }, { name: 'NEAR', count: 9 },
  { name: 'ink!', count: 7 }, { name: 'Cardano', count: 6 }, { name: 'Aleo', count: 5 },
  { name: 'Algorand', count: 4 }, { name: 'Mina', count: 3 },
]

export const TOTAL_DETECTORS = ECOSYSTEMS.reduce((s, e) => s + e.count, 0)

// Representative sample of real detector classes (the explorer shows these + counts).
export const DETECTORS: Detector[] = [
  { id: 'E1', name: 'Reentrancy (state-after-call)', ecosystem: 'EVM', severity: 'High' },
  { id: 'E17', name: 'tx.origin authentication', ecosystem: 'EVM', severity: 'High' },
  { id: 'E31', name: 'Unchecked ERC20 return', ecosystem: 'EVM', severity: 'Medium' },
  { id: 'E33', name: 'Stale Chainlink oracle', ecosystem: 'EVM', severity: 'High' },
  { id: 'E36', name: 'Missing access control', ecosystem: 'EVM', severity: 'Medium' },
  { id: 'E37', name: 'Yul / inline-asm memory-safety', ecosystem: 'EVM', severity: 'High' },
  { id: 'E43', name: 'EIP-7702 delegation abuse', ecosystem: 'EVM', severity: 'Medium' },
  { id: 'S31', name: 'Arbitrary CPI', ecosystem: 'Solana', severity: 'High' },
  { id: 'S32', name: 'Post-CPI account reload', ecosystem: 'Solana', severity: 'High' },
  { id: 'S33', name: 'Non-canonical PDA', ecosystem: 'Solana', severity: 'Medium' },
  { id: 'S37', name: 'Token-2022 transfer-hook', ecosystem: 'Solana', severity: 'Medium' },
  { id: 'V16', name: 'Vyper 0.3.10 reentrancy lock', ecosystem: 'Vyper', severity: 'High' },
  { id: 'C46', name: 'Starknet component storage clash', ecosystem: 'Cairo', severity: 'Medium' },
  { id: 'X19', name: 'Soroban archival / TTL fund-loss', ecosystem: 'Stellar/Soroban', severity: 'High' },
  { id: 'GO13', name: 'IBC OnRecv timeout-refund', ecosystem: 'Cosmos/Go', severity: 'High' },
  { id: 'SU1', name: 'Sui owned-object auth model', ecosystem: 'Sui', severity: 'High' },
  { id: 'AP1', name: 'Aptos public(friend) gate', ecosystem: 'Aptos', severity: 'Medium' },
  { id: 'A3', name: '4337 paymaster validation', ecosystem: 'AA/4337', severity: 'High' },
  { id: 'K1', name: 'Clarity asserts! auth idiom', ecosystem: 'Clarity', severity: 'Medium' },
  { id: 'CA1', name: 'Cadence entitlement auth', ecosystem: 'Cadence', severity: 'High' },
]

// Deterministic Solidity scanner — pattern rules (client-side, demo subset).
export interface ScanRule { id: string; name: string; severity: Severity; test: (src: string) => boolean; note: string }
export const SCAN_RULES: ScanRule[] = [
  { id: 'E17', name: 'tx.origin used for authentication', severity: 'High',
    test: (s) => /require\s*\(\s*tx\.origin/.test(s) || /tx\.origin\s*==/.test(s),
    note: 'tx.origin is phishable — use msg.sender for auth.' },
  { id: 'E1', name: 'External call before state update (reentrancy)', severity: 'High',
    test: (s) => /\.call\{?\s*value/.test(s) && /balances?\[[^\]]+\]\s*[-=]/.test(s),
    note: 'State mutated after an external call — apply checks-effects-interactions or a reentrancy guard.' },
  { id: 'E34', name: 'Unchecked low-level call return', severity: 'Medium',
    test: (s) => /\.call\{?[^;]*\}?\([^;]*\)\s*;/.test(s) && !/\(\s*bool\s+\w+\s*,?/.test(s),
    note: 'Return value of low-level call not checked.' },
  { id: 'E36', name: 'State-changing function without access control', severity: 'Medium',
    test: (s) => /function\s+\w+\s*\([^)]*\)\s*(external|public)(?![^{]*(onlyOwner|require\s*\(\s*msg\.sender))/.test(s) && /selfdestruct|owner\s*=|mint\s*\(/.test(s),
    note: 'Privileged action reachable without an access-control check.' },
  { id: 'E31', name: 'Unchecked ERC20 transfer return', severity: 'Medium',
    test: (s) => /\.transfer\(|\.transferFrom\(/.test(s) && !/require\s*\(\s*\w+\.transfer/.test(s) && !/SafeERC20|safeTransfer/.test(s),
    note: 'Some tokens return false instead of reverting — use SafeERC20.' },
]

export const SAMPLE_CONTRACTS: { label: string; code: string }[] = [
  { label: 'Reentrancy', code: `function withdraw(uint amount) external {\n  require(balances[msg.sender] >= amount);\n  (bool ok,) = msg.sender.call{value: amount}("");\n  balances[msg.sender] -= amount;\n}` },
  { label: 'tx.origin auth', code: `function setOwner(address newOwner) public {\n  require(tx.origin == owner, "not owner");\n  owner = newOwner;\n}` },
  { label: 'Clean', code: `function withdraw(uint amount) external nonReentrant {\n  require(balances[msg.sender] >= amount);\n  balances[msg.sender] -= amount;\n  (bool ok,) = msg.sender.call{value: amount}("");\n  require(ok, "transfer failed");\n}` },
]

export const PROFILE = {
  name: 'Jean Hauser',
  role: 'Senior Product Owner · Cybersecurity PM · Builder',
  intro: 'I run cybersecurity and product programs across the Airbus ecosystem — Europe, China and APAC — and I build the security tooling I care about. 7+ years turning complex, regulated delivery into shipped outcomes.',
  email: 'hauserjeann@gmail.com',
  linkedin: 'https://www.linkedin.com/in/hauserjean',
  github: 'https://github.com/BathmanTv',
  location: 'Remote-first · EU + APAC',
}
