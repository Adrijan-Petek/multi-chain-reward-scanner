# Multi‑Chain Reward Scanner

**multi-chain-reward-scanner** is a lightweight daily monitoring tool for tracking reward‑related events across **Base**, **Optimism**, and **Arbitrum**. It automates scans using GitHub Actions, produces JSON reports, and can be deployed to Vercel for a simple dashboard experience. A realistic `.env.example` is provided for quick configuration.


---

## ✨ Features

* 🔗 **Multi‑chain scanning** — supports Base, Optimism, and Arbitrum.
* 📦 **Daily scheduled scans** via GitHub Actions.
* 📝 **JSON report generation** with timestamped logs.
* 🌐 **Webhook notifications** (Discord, Slack, custom endpoints).
* ⚡ **Vercel dashboard** for easy deployment and report visibility.
* 🔧 **Fully configurable** via `.env`.

---

## 📂 Folder Structure

```
multi-chain-reward-scanner/
├─ .github/
│  └─ workflows/
│     ├─ daily-scan.yml      # Daily scheduled job
│     └─ ci.yml              # Basic CI workflow
├─ src/
│  └─ scan.js                # Main scanner logic
├─ reports/                  # Generated reports (JSON)
├─ package.json
├─ vercel.json
├─ .env.example              # Configuration template
└─ README.md
```

---

## 🛠️ Prerequisites

* **Node.js** 18 or newer
* **npm** or **pnpm**
* **RPC endpoints** for Base, Optimism, and Arbitrum (Alchemy, Infura, or public)
* **GitHub account** (for Actions)
* **Vercel account** (optional, for dashboard)

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-username/multi-chain-reward-scanner.git
cd multi-chain-reward-scanner

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your RPC URLs and contract addresses

# 4. Run a one-time scan
npm run scan:once

# 5. View latest report
ls reports/
cat reports/report-*.json | jq
```

---

## ⚙️ Configuration — `.env.example`

```env
BASE_RPC=https://base-mainnet.myprovider.io/v2/your-key
OP_RPC=https://opt-mainnet.myprovider.io/v2/your-key
ARBITRUM_RPC=https://arb-mainnet.myprovider.io/v2/your-key

# Comma-separated list of contract addresses to watch
REWARD_CONTRACTS=0x123...,0x456...

# Number of blocks to look back per scan
SCAN_BLOCK_WINDOW=500

# Optional webhook for notifications
SCAN_WEBHOOK_URL=https://hooks.example.com/your-webhook

REPORT_DIR=reports
NODE_ENV=production
```

🔑 **Tip:** Store secrets in GitHub Actions → **Settings → Secrets and variables → Actions** instead of committing `.env`.

---

## 🤖 GitHub Actions — Daily Scan

`.github/workflows/daily-scan.yml`

```yaml
name: Daily multi-chain scan
on:
  schedule:
    - cron: '0 9 * * *' # Run daily at 09:00 UTC
  workflow_dispatch: {}

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run scan:once
        env:
          BASE_RPC: ${{ secrets.BASE_RPC }}
          OP_RPC: ${{ secrets.OP_RPC }}
          ARBITRUM_RPC: ${{ secrets.ARBITRUM_RPC }}
          REWARD_CONTRACTS: ${{ secrets.REWARD_CONTRACTS }}
          SCAN_BLOCK_WINDOW: ${{ secrets.SCAN_BLOCK_WINDOW }}
          SCAN_WEBHOOK_URL: ${{ secrets.SCAN_WEBHOOK_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: scan-report
          path: reports/*.json
```

---

## 🌐 Deploy to Vercel (Dashboard)

1. Push repo to GitHub.
2. Import into Vercel.
3. Add environment variables in **Vercel Project → Settings → Environment Variables**.
4. Deploy.

**Vercel env example:**

```
BASE_RPC=https://.../your-key
OP_RPC=https://.../your-key
ARBITRUM_RPC=https://.../your-key
REWARD_CONTRACTS=0xabc...,0xdef...
SCAN_WEBHOOK_URL=https://hooks...
```

---

## 🧩 How It Works

1. Reads RPC URLs and contract addresses from `.env`.
2. For each chain:

   * Fetches latest block.
   * Queries logs for `Transfer` events (`getLogs`).
   * Parses events and normalizes into JSON.
3. Writes report to `reports/report-<timestamp>.json`.
4. Optionally sends report to webhook.

---

## 📊 Example Output

**CLI:**

```
[base] latest=12345678 fromBlock=12345178 contracts=1 logsFound=3
[optimism] latest=9876543 fromBlock=9876043 contracts=1 logsFound=0
[arbitrum] latest=22233344 fromBlock=22232844 contracts=1 logsFound=1
Wrote reports/report-2025-09-28T09-00-00-000Z.json
Posted report to webhook
```

**JSON Report:**

```json
{
  "generatedAt": "2025-09-28T09:00:00.000Z",
  "results": [
    {
      "chain": "base",
      "latest": 12345678,
      "fromBlock": 12345178,
      "events": [
        {
          "contract": "0xAbc...",
          "txHash": "0xabc123...",
          "blockNumber": 12345670,
          "from": "0xSender...",
          "to": "0xRewardContract...",
          "value": "200000000000000000"
        }
      ]
    }
  ]
}
```

---

## 🛠️ Troubleshooting

* Reduce `SCAN_BLOCK_WINDOW` if queries return too many results.
* Use archival RPCs for historical scans.
* Always keep RPC URLs in secrets, never commit them.

---

## 🤝 Contributing

Pull requests welcome! Open issues for feature requests, bug reports, or improvements.

---

## 📜 License

MIT — free to use and modify.
