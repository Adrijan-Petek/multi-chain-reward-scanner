#!/usr/bin/env node
/**
 * src/scan.js
 * Lightweight multi-chain scanner template.
 *
 * NOTE: This is a starter template — adapt it to your needs.
 * - Configure RPC endpoints in environment variables (see .env.example)
 * - REWARD_CONTRACTS_{CHAIN} is a comma-separated list of contract addresses to watch per chain
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const fetch = require('node-fetch');

const CHAINS = [
  { name: 'base', env: 'BASE_RPC' },
  { name: 'optimism', env: 'OP_RPC' },
  { name: 'arbitrum', env: 'ARBITRUM_RPC' },
  { name: 'moonbeam', env: 'MOONBEAM_RPC' }
];

const ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];
const iface = new ethers.Interface(ABI);
const TRANSFER_TOPIC = iface.getEvent('Transfer').topic;

const REPORT_DIR = process.env.REPORT_DIR || 'reports';
const BLOCK_WINDOW = parseInt(process.env.SCAN_BLOCK_WINDOW || '500', 10);

async function scanChain(chain) {
  const rpc = process.env[chain.env];
  if (!rpc) {
    console.warn(`[${chain.name}] no RPC configured (${chain.env}) — skipping`);
    return null;
  }
  const contracts = (process.env[`REWARD_CONTRACTS_${chain.name.toUpperCase()}`] || '').split(',').map(s => s.trim()).filter(Boolean);
  const provider = new ethers.JsonRpcProvider(rpc);
  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(1, latest - BLOCK_WINDOW);
  let events = [];
  for (const address of contracts) {
    try {
      const filter = {
        address,
        fromBlock,
        toBlock: latest,
        topics: [TRANSFER_TOPIC]
      };
      const logs = await provider.getLogs(filter);
      for (const log of logs) {
        const parsed = iface.parseLog(log);
        if (parsed) {
          events.push({
            contract: address,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            from: parsed.args.from,
            to: parsed.args.to,
            value: parsed.args.value.toString()
          });
        }
      }
    } catch (err) {
      console.error(`[${chain.name}] error scanning ${address}:`, err.message);
    }
  }
  return { chain: chain.name, latest, fromBlock, events, contractsCount: contracts.length };
}

(async () => {
  const results = [];
  for (const c of CHAINS) {
    const r = await scanChain(c);
    if (r) {
      console.log(`[${r.chain}] latest=${r.latest} fromBlock=${r.fromBlock} contracts=${r.contractsCount} logsFound=${r.events.length}`);
      results.push(r);
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    results
  };

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(REPORT_DIR, `report-${now}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote', outPath);

  // Optional webhook post
  const webhook = process.env.SCAN_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(out) });
      console.log('Posted report to webhook');
    } catch (e) {
      console.error('Webhook post failed:', e.message);
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
