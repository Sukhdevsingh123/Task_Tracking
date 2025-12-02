🧾 ExpenseAI - The Agentic Blockchain Accountant

Submitted for NullShot Hacks: Season 0 > Exploring the new frontier of AI and Blockchain.

🌟 Project Overview

ExpenseAI demonstrates the power of the Agentic Economy by merging Autonomous AI Agents with Immutable Blockchain Records.

Instead of manually filling out spreadsheets, users simply chat with an AI Agent. The Agent parses the natural language, extracts structured financial data, and prepares a transaction to mint that expense permanently onto the Sepolia Blockchain using Thirdweb.

📸 Demo & Screenshots

<div align="center">
<!-- REPLACE 'demo.png' and 'architecture.png' with your actual file names inside frontend/assets/ -->
<img src="frontend/assets/src/wallet.png" alt="ExpenseAI Dashboard" width="45%">
<img src="frontend/assets/src/ui.png" alt="Blockchain Transaction Success" width="45%">
</div>

🏗 Architecture

The Brain (Nullshot Agent): Hosted on Cloudflare Workers. It uses Anthropic Claude to analyze unstructured text (e.g., "Lunch with client $50") and converts it into a strict JSON schema.

The Ledger (Smart Contract): A Solidity contract deployed via Thirdweb on the Sepolia Testnet that stores user expenses immutably.

The Interface (React + Vite): A modern dashboard that connects the User, the Agent, and the Blockchain Wallet.

🛠 Tech Stack

AI Framework: Nullshot Agent SDK (TypeScript)

LLM Provider: Anthropic (Claude 3.5 Sonnet)

Infrastructure: Cloudflare Workers & Durable Objects

Web3 Integration: Thirdweb SDK (ConnectButton, Contract Writes)

Smart Contract: Solidity (Deployed via Thirdweb)

Frontend: React, Vite, TailwindCSS

🚀 Installation & Setup

Follow these steps to run the project locally or deploy it yourself.

1. Smart Contract Deployment (Thirdweb)

We use Thirdweb for one-click deployment.

Navigate to the root directory.

Run the deploy command:

npx thirdweb deploy


Select the ExpenseTracker contract.

Deploy to Sepolia Testnet via the browser dashboard.

Copy the Contract Address (e.g., 0x123...).

2. Backend Agent (Nullshot & Cloudflare)

The Agent runs on the Edge using Cloudflare Workers.

Prerequisites:

A Cloudflare Account.

An Anthropic API Key.

Setup:

cd Agent
pnpm install


Configure Secrets:
You must upload your API keys to Cloudflare to allow the agent to think.

npx wrangler secret put AI_PROVIDER_API_KEY  # Paste your Anthropic Key
npx wrangler secret put AI_PROVIDER          # Enter: anthropic
npx wrangler secret put MODEL_ID             # Enter: claude-3-5-sonnet-20241022


Deploy:

npx wrangler deploy


Copy the workers.dev URL generated at the end (e.g., https://expense-agent.yourname.workers.dev).

3. Frontend (React + Thirdweb)

Setup:

cd frontend
npm install


Configuration:
Open frontend/src/Assistant.jsx and update the following:

Contract Address: Paste the address from Step 1.

Agent URL: Find the fetch() call and paste your Cloudflare Worker URL from Step 2.

Run Local:

npm run dev


💡 How It Works (Code logic)

The Nullshot Agent (src/index.ts)

We utilize the SimplePromptAgent class extended from the Nullshot SDK.

// The agent forces the LLM to output specific JSON tools
const expenseTools = {
    categorize_expense: tool({
        parameters: z.object({ 
            amount: z.number(), 
            category: z.enum(["Business", "Food", ...]) 
        }),
        // ...
    })
}


The Thirdweb Integration (Assistant.jsx)

We use the V5 SDK to interact with the blockchain seamlessly.

// Preparing the transaction based on AI output
const transaction = prepareContractCall({
    contract,
    method: "function logExpense(uint256 _amount, string _category, string _description)",
    params: [
      BigInt(pendingExpense.amount), 
      pendingExpense.category,
      pendingExpense.description
    ],
});

// Sending to chain
sendTransaction(transaction);


🏆 Hackathon Tracks

This project targets Track 1: MCPs/Agents using the Nullshot Framework.

Innovation: We moved beyond simple chat bots. This agent acts as a financial controller that prepares valid blockchain transactions.

Utility: Solves a real-world problem (expense tracking) using the immutability of Web3.

Integration: Deep usage of Durable Objects for session state and Thirdweb for wallet abstraction.

📜 License

This project is open-source and available under the MIT License.

Built with ❤️ by [Sukhdev Singh]
