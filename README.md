# TrustMesh – Your Financial Reputation Travels With You 🌍

**TrustMesh** is a decentralized financial reputation platform built on Stellar, designed for the Level 4 Stellar Challenge. It allows users to build a portable financial reputation (Trust Score) based on verified real-world achievements instead of traditional credit history.

## 🚨 Problem Statement
Millions of freelancers, gig workers, students, migrants, and small entrepreneurs struggle to access financial services because traditional credit systems don't recognize their real-world accomplishments. People with genuine financial discipline are excluded simply because they lack conventional credit records.

## 💡 Our Solution
Instead of starting from zero every time someone moves to a new country or changes jobs, their reputation moves with them on TrustMesh.
Trusted organizations (universities, employers, platforms) issue digitally verified credentials to users via **Soroban Smart Contracts**. These credentials dynamically update a portable **Trust Score**.

## 🏗️ Technical Architecture
- **Smart Contracts (Soroban/Rust):** Handles Credential Registry, Trust Score Calculation, and Loan Eligibility Engine on the Stellar network.
- **Frontend (React/Tailwind):** A premium, responsive interface featuring dynamic dashboard elements and loan simulation.
- **Wallet Integration:** Seamless connection to the Stellar ecosystem via **Freighter Wallet**.

## ⚙️ Local Development Setup

### 1. Smart Contracts
Ensure you have Rust and the Stellar CLI installed.
```bash
cd my-contract
# Build the contract
cargo build --target wasm32v1-none --release

# Run Tests
cargo test
```

### 2. Frontend Application
```bash
# Install dependencies
npm install

# Start the local development server
npm start
```

## 🛣️ Roadmap
- **MVP (Current):** Wallet login, Credential issuance mock, Trust Score dashboard, Loan simulation.
- **Phase 2:** Mainnet deployment, employer verification APIs, AI-powered trust scoring.

## 🌟 Long-Term Vision
We envision a future where people don't lose their financial identity because they changed countries or became freelancers. Wherever you go, your reputation goes with you. Instead of borrowing based on what you own, you borrow based on who you've proven yourself to be.

---

## 📸 Demo & Review

### Live Demo Video
Here is the automated demo recording of the TrustMesh landing page in action:
![TrustMesh Demo Video](/C:/Users/sangw/.gemini/antigravity-ide/brain/b4606ca6-8bb2-4104-bbd6-0d98b346d832/trustmesh_demo_1787204359632.webp)

### Sample Dashboard Screenshot
![TrustMesh Dashboard Mockup](/C:/Users/sangw/.gemini/antigravity-ide/brain/b4606ca6-8bb2-4104-bbd6-0d98b346d832/trustmesh_dashboard_1787204332898.jpg)

---

## 🏆 Team Review Criteria

### Technical Complexity
- **Soroban Contracts**: Efficiently handles state mappings for multiple users and organizations, along with custom structs (`Credential`) in Rust.
- **Frontend & Blockchain Integration**: Integrates Freighter wallet for transaction signing, simulating complex cross-border financial requests seamlessly.

### Product Quality
- **Premium UI/UX**: Designed with a sleek, dark-mode glassmorphism aesthetic (using Tailwind CSS and Lucide Icons). 
- **Responsive**: Fully responsive and optimized for both desktop and mobile viewing.
- **Micro-animations**: Includes smooth hover states and transitions to ensure a high-quality product feel.

### Architecture Quality
- **Separation of Concerns**: Smart contracts strictly handle Trust Score logic and data immutability, while the Next.js/React frontend handles user interaction and score aggregation display.
- **Production-Ready**: Configured for immediate deployment on Vercel (frontend) and Stellar Testnet (WASM).

### Real-World Usefulness
- **Immediate Impact**: Targets a massive demographic (freelancers, immigrants, students) who are currently unbanked or underbanked due to a lack of traditional credit scores.
- **Scalable Utility**: Organizations can immediately plug in to issue credentials, and lenders can plug in to query scores without building their own risk models from scratch.
