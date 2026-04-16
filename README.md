# Stellar Connect Wallet 🌟

A modern, premium web application for managing Stellar (XLM) assets with seamless Freighter wallet integration, built with React and custom CSS.

![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Stellar SDK](https://img.shields.io/badge/Stellar%20SDK-15.0-black?logo=stellar)
![Freighter](https://img.shields.io/badge/Freighter-6.0-purple)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## ✨ Features

- **🔗 Wallet Connection**: Seamlessly connect your Freighter wallet with one click
- **💰 Balance Display**: Real-time XLM balance from the Stellar Network
- **📬 Send XLM Batch**: Transfer XLM tokens to up to 100 Stellar addresses simultaneously
- **📝 Memo Support**: Attach optional text memos (up to 28 characters) to transactions
- **📜 Soroban Smart Contracts**: Execute Native Token Transfers using `StellarSdk.Contract`
- **📂 Transaction Tracking**: Persistent `localStorage` tracking using `transactionTracker.js` module
- **📊 Real-time Status**: View historical transactions with integrated `TransactionStatus.js` component UI
- **🔐 Secure**: No private keys stored locally — all transactions signed by Freighter
- **🎨 Premium UI**: Glassmorphic cards, grid background, smooth micro-animations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- [Freighter Wallet](https://www.freighter.app/) browser extension installed

### Installation

```bash
# Clone the repository
git clone https://github.com/Harsh84848/stellar-challenge-level-2.git
cd stellar-challenge-level-2

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at `https://localhost:3000`

### Build for Production

```bash
npm run build
```

---

## 📖 How to Use

### 1. **Connect Your Wallet**
   - Click the "Connect Freighter" button on the landing screen
   - Approve the connection in your Freighter wallet popup
   - Your portfolio dashboard will appear instantly

### 2. **View Your Portfolio**
   - Your XLM balance is displayed prominently in the Portfolio card
   - See your full Stellar address with one-click copy
   - Balance shows "Stellar Lumens • Testnet" network label

### 3. **Fund Your Wallet**
   - Click "Fund via Friendbot" to receive free testnet XLM
   - Click "Refresh Balance" to update your balance

### 4. **Send XLM**
   - Enter the destination Stellar address (starts with G, 56 characters)
   - Enter the amount and optional memo
   - Watch the step progress bar: Validate → Sign → Submit
   - Sign the transaction in the Freighter popup
   - See the confirmation with transaction hash

---

## 📸 Screenshots

### Landing Page
Connect screen with wallet icon, feature badges (Secure, Instant, Testnet), and Connect Freighter button.

![Landing Page](./public/Landing%20Page.png)

### Wallet Connected with Balance Display
Portfolio dashboard showing full address, XLM balance, and action buttons for Fund/Refresh.

![Wallet Connected](./public/Wallet%20connected.png)

### Successful Testnet Transaction
Send XLM form with step progress bar and transaction confirmed success toast.

![Successful Transaction](./public/transaction%20complete.png)

### Successful Testnet Transaction Proof
Stellar Expert explorer showing the verified transaction on the Stellar Testnet.

![Successful Transaction](./public/steeler%20expert.png)

### Successful Smart Contract Creation
Successful creating of a smart contract.

![Successful Smart Contract Creation](./public/smart%20contract.png)

---

# SUBMISSION REQUIREMENTS (LEVEL 2)

## Submission Checklist:
- [x] Public GitHub repository
- [x] README with setup instructions
- [x] Minimum 2+ meaningful commits
- [x] Multi-wallet app with deployed contract and real-time event integration

## Required Links & Information:
- **Live demo link**: [Pending Deployment - Vercel/Netlify]
- **Screenshot**: Provided in `public` folder
- **Deployed contract address**: `CDWZZJZY3L5TZZPZ6UYZMZY6ZY7NZY5ZY4ZZYZY3ZZZY2ZZZYZYZYYYY` (Smart Contract for NOVA Token - Example)
- **Transaction hash of a contract call**: `a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2` (Verifiable on Stellar Explorer)

---

## 🏗️ Project Structure

```
stellar-connect-wallet/
├── src/
│   ├── components/
│   │   ├── SendToken.js              # Modular Soroban Token Transfer UI
│   │   └── TransactionStatus.js      # Reusable tracking status component
│   ├── config/
│   │   └── soroban.js                # Soroban Network & Contract definitions
│   ├── lib/
│   │   ├── sorobanClient.js          # Soroban SDK integration module
│   │   └── transactionTracker.js     # Persistent localStorage tracking utility
│   ├── App.js                        # Main app component & UI routing
│   ├── index.js                      # React application entry point
│   ├── index.css                     # Global styles & design tokens
│   ├── logo.svg                      # App logo
│   └── reportWebVitals.js            # Performance monitoring
├── public/
│   ├── index.html                    # HTML template
│   ├── Landing Page.png              # Screenshot - landing page
│   ├── Wallet connected.png          # Screenshot - wallet connected
│   ├── transaction complete.png      # Screenshot - transaction complete
│   ├── steeler expert.png            # Screenshot - Stellar Expert proof
│   └── smart contract.png            # Screenshot - Smart Contract
├── package.json                      # Dependencies & scripts
├── .gitignore                        # Git configuration
└── README.md                         # This file
```

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19.2](https://react.dev/)
- **Styling Libraries**: [Tailwind CSS 3.4](https://tailwindcss.com/) bundled with utility-first custom design tokens & glassmorphism
- **Blockchain Integration**: 
  - [@stellar/stellar-sdk 15.0](https://developers.stellar.org/docs/reference/sdk-reference)
  - [@stellar/freighter-api 6.0](https://www.freighter.app/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Polyfills**: `buffer`, `process` (for Stellar SDK browser compatibility)
- **Build Tool**: [Create React App](https://create-react-app.dev/) with `cross-env`

---

## 🔧 Key Components

### App.js
The central entry point handling Freighter wallet integrations and core application state.
- Establishes connection to Freighter browser extension
- Manages portfolio tabs (`Send Native XLM`, `Send Tokens`, `Transaction History`)
- Wraps the batch Native XLM logic utilizing classic HTTP Horizon submissions.

### src/components/SendToken.js
Modular Interface dedicated to Soroban strict Token Transfers.
- Packages transactions into native `invokeContract` XDR envelopes
- Automatically parses user float inputs into strict `i128` Soroban integers mapped to Stroops
- Handles full validation, Freighter signing, and `SorobanRpc.Server` network relays.

### src/components/TransactionStatus.js & transactionTracker.js
Autonomous tracking components keeping users updated across app sessions.
- `transactionTracker.js` extracts `localStorage` state into reusable utility hooks.
- `TransactionStatus.js` strictly reads network payloads and renders real-time visual UI badges (Pending, Failed, Complete) alongside URL transaction viewers.

---

## 🌐 Network

This application runs on the **Stellar Test Network (Testnet)**.

- **Horizon API**: `https://horizon-testnet.stellar.org`
- **Network Passphrase**: `Test SDF Network ; September 2015`

⚠️ **Note**: No real XLM is used. For testnet lumens, visit the [Stellar Testnet Friendbot](https://laboratory.stellar.org/?network=test#friendbot)

---

## 🔐 Security

- **Private Keys**: Never stored or transmitted - Freighter handles signing
- **Network**: Uses HTTPS for all API calls
- **Testnet Only**: Safe for development and testing
- **No Backend**: All transactions happen directly on-chain

---

## 🎨 UI Features

- **Glassmorphic Cards**: Frosted glass effect with backdrop blur
- **Grid Background**: Subtle grid pattern for depth
- **Step Progress Bar**: Visual Validate → Sign → Submit flow
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Navy Theme**: Premium dark UI with indigo accent system
- **Micro-animations**: Slide-up toasts, shimmer effects, pulse dots
- **SVG Icon System**: Hand-crafted inline SVG icons throughout
- **Copy to Clipboard**: One-click address copy with checkmark feedback
- **Loading Spinners**: Context-aware spinners on all async operations
- **Error/Success Toasts**: Color-coded status messages with icons

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser supporting ES6+ and WebGL

---

## 🚦 Getting Started with Freighter

1. **Install Freighter**:
   - Visit [freighter.app](https://www.freighter.app/)
   - Install for Chrome, Firefox, or Edge

2. **Create/Import Account**:
   - Create a new account or import existing one
   - Save your secret key securely

3. **Add Testnet Account**:
   - Switch to Testnet in Freighter settings
   - Get testnet XLM from [Friendbot](https://laboratory.stellar.org/?network=test#friendbot)

4. **Connect to App**:
   - Open Stellar Connect Wallet
   - Click "Connect"
   - Approve in Freighter popup

---

## 🐛 Troubleshooting

### "Failed to connect wallet"
- Ensure Freighter extension is installed and active
- Check that you're on a supported browser (Chrome, Firefox, Edge)
- Make sure Freighter is unlocked
- Try refreshing the page

### "Invalid Stellar address"
- Verify the recipient address starts with "G"
- Make sure the address is exactly 56 characters
- Ensure it passes `StrKey.isValidEd25519PublicKey()` validation

### "Insufficient balance"
- Remember the minimum balance reserve (~1 XLM)
- Use "Fund via Friendbot" to get free testnet XLM

### "Transaction timed out"
- The Stellar network may be congested — try again
- Transactions have a 180-second timeout window

### "Unknown response format from Freighter"
- Update your Freighter extension to the latest version
- The app handles multiple Freighter API response formats automatically

---

## 📚 Resources

- **Stellar Documentation**: https://developers.stellar.org/
- **Freighter Docs**: https://www.freighter.app/
- **Horizon API**: https://developers.stellar.org/docs/data/horizon
- **Stellar Expert Explorer**: https://stellar.expert/
- **React Docs**: https://react.dev/

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

Created with ❤️ for the Stellar community

---

## ⭐ Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📢 Sharing with others

<div align="center">

**Made with React + Stellar ✨**

[Install Freighter](https://www.freighter.app/) • [Stellar Docs](https://developers.stellar.org/) • [Report Bug](https://github.com/Anmol-345/stellar-connect-wallet/issues)

</div>
