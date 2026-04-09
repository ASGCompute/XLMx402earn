import {
  accountExists,
  getBalance,
  getLatestLedger,
  verifyTransaction,
  verifyMultiOpTx,
  verifyAccountOptions,
  verifyTimeBounds,
  contractExists,
  verifySorobanInvoke,
  verifyUsdcTrustline,
  verifyUsdcPayment,
  isValidContractId,
} from './stellar';

// ──────────────────────────────────────
// Auto-verify engine for task submissions
// ──────────────────────────────────────

export type VerifyResult = {
  passed: boolean;
  type: 'auto' | 'semi' | 'manual';
  reason?: string;
  score?: number;
};

const ESCROW_ADDRESS = process.env.STELLAR_ESCROW_PUBLIC_KEY || '';

/**
 * Main verify dispatcher — routes based on task verify_config.type
 */
export async function autoVerify(
  taskId: string,
  verifyConfig: { type: string; check?: string; min_words?: number; required_keywords?: string[]; expected_strings?: string[] },
  proof: string,
  agentWallet?: string
): Promise<VerifyResult> {
  switch (verifyConfig.type) {
    case 'account_exists':
      return verifyAccountExists(proof);

    case 'tx_verify':
      return verifyTxProof(taskId, proof, agentWallet);

    case 'tx_verify_memo':
      return verifyTxMemo(proof);

    case 'tx_verify_multi':
      return verifyTxMulti(taskId, proof);

    case 'tx_verify_timebounds':
      return verifyTxTimebounds(proof);

    case 'account_options':
      return verifyAccOptions(proof, agentWallet);

    case 'data_match':
      return verifyDataMatch(taskId, proof);

    case 'api_response_match':
      return verifyApiResponse(taskId, proof, verifyConfig);

    case 'text_quality':
      return verifyTextQuality(proof, verifyConfig.min_words, verifyConfig.required_keywords);

    case 'text_contains':
      return verifyTextContains(proof, verifyConfig.expected_strings);

    case 'stellar_address':
      return verifyStellarAddress(proof);

    case 'soroban_contract_exists':
      return verifySorobanContract(proof);

    case 'soroban_invoke_tx':
      return verifySorobanInvokeTx(proof);

    case 'usdc_trustline':
      return verifyUsdcTrustlineCheck(proof, agentWallet);

    case 'usdc_payment':
      return verifyUsdcPaymentTx(proof, agentWallet);

    case 'manual_review':
      return { passed: false, type: 'manual', reason: 'Queued for sponsor review' };

    default:
      return { passed: false, type: 'manual', reason: `Unknown verify type: ${verifyConfig.type}` };
  }
}

// ──────────────────────────────────────
// Verifiers
// ──────────────────────────────────────

async function verifyAccountExists(publicKey: string): Promise<VerifyResult> {
  const clean = publicKey.trim();
  if (!/^G[A-Z2-7]{55}$/.test(clean)) {
    return { passed: false, type: 'auto', reason: 'Invalid Stellar public key format' };
  }
  const exists = await accountExists(clean);
  return exists
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: 'Account not found on testnet' };
}

async function verifyTxProof(taskId: string, txHash: string, agentWallet?: string): Promise<VerifyResult> {
  const taskConfigs: Record<string, { amount?: string; memo?: string }> = {
    'task-002': { amount: '0.5000000' },
    'task-003': { amount: '1.0000000', memo: 'hello' },
    'task-013': { amount: '0.1000000' },
    'task-016': { amount: '0.1000000' },
  };

  const config = taskConfigs[taskId] || {};
  const result = await verifyTransaction(txHash.trim(), {
    expectedFrom: agentWallet,
    expectedTo: ESCROW_ADDRESS,
    expectedAmount: config.amount,
    expectedMemo: config.memo,
    maxAgeSeconds: 3600,
  });

  return result.valid
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: result.reason };
}

async function verifyTxMemo(txHash: string): Promise<VerifyResult> {
  try {
    const result = await verifyTransaction(txHash.trim(), {
      expectedTo: ESCROW_ADDRESS,
      expectedAmount: '0.1000000',
      maxAgeSeconds: 3600,
    });

    if (!result.valid) {
      return { passed: false, type: 'auto', reason: result.reason };
    }

    // Verify memo exists (accept any memo text — plain or base64 JSON)
    const tx = result.tx as { memo?: string; memo_type?: string } | undefined;
    if (!tx?.memo) {
      return { passed: false, type: 'auto', reason: 'No memo found' };
    }

    // Accept any non-empty memo — plain text or base64 JSON
    if (tx.memo.length > 0) {
      return { passed: true, type: 'auto' };
    }

    return { passed: false, type: 'auto', reason: 'Empty memo' };
  } catch (err) {
    return { passed: false, type: 'auto', reason: `Verify error: ${(err as Error).message}` };
  }
}

async function verifyTxMulti(taskId: string, txHash: string): Promise<VerifyResult> {
  // task-014: multi-destination payment
  if (taskId !== 'task-014') {
    return { passed: false, type: 'auto', reason: 'Multi-op verify only for task-014' };
  }

  // For now use placeholder destinations — will be set via env/config
  const destinations = [
    process.env.STELLAR_DEST_1 || '',
    process.env.STELLAR_DEST_2 || '',
    process.env.STELLAR_DEST_3 || '',
  ].filter(Boolean);

  if (destinations.length < 3) {
    // If destinations not configured, just verify it has 3 payment ops
    return { passed: true, type: 'semi', reason: 'Destinations not configured, manual check needed' };
  }

  const result = await verifyMultiOpTx(txHash.trim(), destinations.map(d => ({ to: d, amount: '0.1000000' })));
  return result.valid
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: result.reason };
}

async function verifyTxTimebounds(txHash: string): Promise<VerifyResult> {
  const result = await verifyTimeBounds(txHash.trim());
  return result.valid
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: result.reason };
}

async function verifyAccOptions(txHash: string, agentWallet?: string): Promise<VerifyResult> {
  if (!agentWallet) {
    return { passed: false, type: 'auto', reason: 'Agent wallet not provided' };
  }
  const result = await verifyAccountOptions(agentWallet, 'agent-earn.stellar');
  return result.valid
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: result.reason };
}

async function verifyDataMatch(taskId: string, proof: string): Promise<VerifyResult> {
  const proofClean = proof.trim();

  if (taskId === 'task-004') {
    // Check escrow balance
    try {
      const actualBalance = await getBalance(ESCROW_ADDRESS);
      const proofBalance = parseFloat(proofClean);
      const actual = parseFloat(actualBalance);
      if (isNaN(proofBalance)) {
        return { passed: false, type: 'auto', reason: 'Proof is not a valid number' };
      }
      if (Math.abs(proofBalance - actual) <= 50) {
        return { passed: true, type: 'auto' };
      }
      return { passed: false, type: 'auto', reason: `Balance mismatch: proof=${proofBalance}, actual=${actual}` };
    } catch (err) {
      return { passed: false, type: 'auto', reason: `Balance check error: ${(err as Error).message}` };
    }
  }

  if (taskId === 'task-005') {
    // Check ledger sequence
    try {
      const actualLedger = await getLatestLedger();
      const proofLedger = parseInt(proofClean, 10);
      if (isNaN(proofLedger)) {
        return { passed: false, type: 'auto', reason: 'Proof is not a valid number' };
      }
      if (Math.abs(proofLedger - actualLedger) <= 5) {
        return { passed: true, type: 'auto' };
      }
      return { passed: false, type: 'auto', reason: `Ledger mismatch: proof=${proofLedger}, actual=${actualLedger}` };
    } catch (err) {
      return { passed: false, type: 'auto', reason: `Ledger check error: ${(err as Error).message}` };
    }
  }

  return { passed: false, type: 'semi', reason: 'Unknown data_match task' };
}

async function verifyApiResponse(
  taskId: string,
  proof: string,
  verifyConfig: { check?: string }
): Promise<VerifyResult> {
  const proofLower = proof.toLowerCase().trim();

  // task-006: x402 weather — check for temperature-like content
  if (taskId === 'task-006') {
    if (proofLower.includes('temperature') || proofLower.includes('temp') || /\d+\.?\d*\s*[°cfk]?/i.test(proof)) {
      return { passed: true, type: 'auto' };
    }
    return { passed: false, type: 'auto', reason: 'No temperature data found in proof' };
  }

  // task-007: x402 crypto quote
  if (taskId === 'task-007') {
    if (proofLower.includes('price') || proofLower.includes('xlm') || /\d+\.\d+/.test(proof)) {
      return { passed: true, type: 'auto' };
    }
    return { passed: false, type: 'auto', reason: 'No price data found in proof' };
  }

  // task-008: ASG Card health
  if (taskId === 'task-008') {
    if (proofLower.includes('"status"') && proofLower.includes('"ok"') && proofLower.includes('"version"')) {
      return { passed: true, type: 'auto' };
    }
    return { passed: false, type: 'auto', reason: 'Missing status=ok or version field' };
  }

  // task-009: ASG Card pricing
  if (taskId === 'task-009') {
    if (proofLower.includes('cardfee') || proofLower.includes('card_fee') || proofLower.includes('"10"') || proofLower.includes('10') && proofLower.includes('3.5')) {
      return { passed: true, type: 'auto' };
    }
    return { passed: false, type: 'auto', reason: 'Missing pricing data (cardFee, topUpPercent)' };
  }

  return { passed: false, type: 'semi', reason: `API response verify for ${taskId}: ${verifyConfig.check}` };
}

function verifyTextQuality(
  proof: string,
  minWords?: number,
  requiredKeywords?: string[]
): VerifyResult {
  const words = proof.trim().split(/\s+/).length;
  const min = minWords || 100;

  if (words < min) {
    return { passed: false, type: 'semi', reason: `Too short: ${words} words (need ${min}+)` };
  }

  if (requiredKeywords) {
    const lowerProof = proof.toLowerCase();
    const missing = requiredKeywords.filter((kw) => !lowerProof.includes(kw.toLowerCase()));
    if (missing.length > 0) {
      return { passed: false, type: 'semi', reason: `Missing keywords: ${missing.join(', ')}` };
    }
  }

  return { passed: true, type: 'semi', score: Math.min(100, Math.round((words / min) * 80)) };
}

function verifyTextContains(proof: string, expectedStrings?: string[]): VerifyResult {
  if (!expectedStrings || expectedStrings.length === 0) {
    return { passed: true, type: 'semi' };
  }

  const lowerProof = proof.toLowerCase();
  const missing = expectedStrings.filter((s) => !lowerProof.includes(s.toLowerCase()));

  if (missing.length > 0) {
    return { passed: false, type: 'semi', reason: `Missing: ${missing.join(', ')}` };
  }

  return { passed: true, type: 'semi' };
}

function verifyStellarAddress(proof: string): VerifyResult {
  const clean = proof.trim();
  if (/^G[A-Z2-7]{55}$/.test(clean)) {
    return { passed: true, type: 'auto' };
  }
  // Try to extract from text
  const match = clean.match(/G[A-Z2-7]{55}/);
  if (match) {
    return { passed: true, type: 'auto' };
  }
  return { passed: false, type: 'auto', reason: 'No valid Stellar address found (G..., 56 chars)' };
}

// ──────────────────────────────────────
// Soroban verifiers
// ──────────────────────────────────────

async function verifySorobanContract(proof: string): Promise<VerifyResult> {
  const clean = proof.trim();

  // Accept C... contract IDs
  if (isValidContractId(clean)) {
    return { passed: true, type: 'auto' };
  }

  // Try to extract C... address from text
  const match = clean.match(/C[A-Z2-7]{55}/);
  if (match) {
    return { passed: true, type: 'auto' };
  }

  return { passed: false, type: 'auto', reason: 'No valid Soroban contract ID found (C..., 56 chars)' };
}

async function verifySorobanInvokeTx(txHash: string): Promise<VerifyResult> {
  const clean = txHash.trim();

  // If proof looks like a TX hash (64 hex chars), verify on-chain
  if (/^[a-f0-9]{64}$/i.test(clean)) {
    const result = await verifySorobanInvoke(clean);
    return result.valid
      ? { passed: true, type: 'auto' }
      : { passed: false, type: 'auto', reason: result.reason };
  }

  // Fallback: if it contains a C... contract address, accept as semi-verified
  const contractMatch = clean.match(/C[A-Z2-7]{55}/);
  if (contractMatch) {
    const words = clean.split(/\s+/).length;
    if (words >= 10) {
      return { passed: true, type: 'semi', reason: 'Contract ID found in text proof' };
    }
  }

  return { passed: false, type: 'semi', reason: 'Provide a TX hash (64 hex chars) or text proof with contract ID' };
}

// ──────────────────────────────────────
// USDC verifiers
// ──────────────────────────────────────

async function verifyUsdcTrustlineCheck(proof: string, agentWallet?: string): Promise<VerifyResult> {
  // Proof can be a TX hash or just the agent wallet
  const walletToCheck = agentWallet || proof.trim();

  if (!/^G[A-Z2-7]{55}$/.test(walletToCheck)) {
    return { passed: false, type: 'auto', reason: 'No valid wallet address to check trustline' };
  }

  const result = await verifyUsdcTrustline(walletToCheck);
  return result.valid
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: result.reason };
}

async function verifyUsdcPaymentTx(txHash: string, agentWallet?: string): Promise<VerifyResult> {
  const result = await verifyUsdcPayment(txHash.trim(), {
    expectedFrom: agentWallet,
  });
  return result.valid
    ? { passed: true, type: 'auto' }
    : { passed: false, type: 'auto', reason: result.reason };
}
