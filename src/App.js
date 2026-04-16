import React, { useState, useEffect } from 'react';
import { copyToClipboard } from 'copy-to-clipboard';
import { QRCodeSVG } from 'qrcode.react';
import { setAllowed, requestAccess, signTransaction, getPublicKey, isAllowed } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { recordBatchPayments } from './lib/sorobanClient';
import { Copy, QrCode, LogOut, Send, History, Plus, Trash2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import './index.css';

import { getTransactions, saveTransaction } from './lib/transactionTracker';
import SendToken from './components/SendToken';
import TransactionStatus from './components/TransactionStatus';

// Initialize Soroban RPC for tracking XLM transaction confirmation
const horizonServerUrl = "https://horizon-testnet.stellar.org";
const networkPassphrase = StellarSdk.Networks.TESTNET;
const testnetServer = new StellarSdk.Horizon.Server(horizonServerUrl);

function App() {
  const [pubKey, setPubKey] = useState('');
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('send');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Send Form States
  const [recipients, setRecipients] = useState([{ address: '', amount: '' }]);
  const [memoText, setMemoText] = useState('');
  const [txError, setTxError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // History & Pending
  const [transactions, setTransactions] = useState([]);
  
  // Load transactions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stellar_tx_history');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Save transactions to localStorage when updated
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('stellar_tx_history', JSON.stringify(transactions));
    }
  }, [transactions]);
  
  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (await isAllowed()) {
        const address = await getPublicKey();
        if (address) {
          setPubKey(address);
          fetchBalance(address);
        }
      }
    };
    checkConnection();
  }, []);

  // Poll pending transactions
  useEffect(() => {
    const interval = setInterval(async () => {
      const pendingTxs = transactions.filter(tx => tx.status === 'pending');
      if (pendingTxs.length === 0) return;

      const updatedTxs = [...transactions];
      for (let tx of pendingTxs) {
        try {
          // Check Horizon server for native tx
          await testnetServer.transactions().transaction(tx.hash).call();
          // If it doesn't throw, it's successful on Horizon
          const index = updatedTxs.findIndex(t => t.hash === tx.hash);
          if (index !== -1) {
             updatedTxs[index].status = 'soroban_recording';
             setTransactions([...updatedTxs]);
             
             // Now trigger Soroban recording automatically
             try {
               await recordBatchPayments(pubKey, tx.recipients.map(r => ({ to: r.address, amount: r.amount })));
               updatedTxs[index].status = 'success';
             } catch (err) {
               console.error("Soroban record failed", err);
               updatedTxs[index].status = 'soroban_failed';
               updatedTxs[index].error = err.message || "Failed to record on smart contract";
             }
             setTransactions([...updatedTxs]);
          }
        } catch (e) {
          if (e.response && e.response.status === 404) {
             // Still pending in Horizon, keep polling
          } else {
             const index = updatedTxs.findIndex(t => t.hash === tx.hash);
             if (index !== -1) {
                updatedTxs[index].status = 'failed';
                updatedTxs[index].error = e.message;
                setTransactions([...updatedTxs]);
             }
          }
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [transactions, pubKey]);

  const fetchBalance = async (address) => {
    try {
      const account = await testnetServer.loadAccount(address);
      const xlmBalance = account.balances.find((b) => b.asset_type === 'native');
      if (xlmBalance) setBalance(xlmBalance.balance);
    } catch (e) {
      console.error('Error fetching balance:', e);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await setAllowed();
      const access = await requestAccess();
      if (access) {
        setPubKey(access);
        fetchBalance(access);
      }
    } catch (e) {
      alert("Error connecting Freighter: " + e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setPubKey('');
    setBalance('0');
    // Freighter doesn't have an explicit disconnect, we just clear local state
  };

  const handleCopy = () => {
    copyToClipboard(pubKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addRecipient = () => {
    if (recipients.length < 100) {
      setRecipients([...recipients, { address: '', amount: '' }]);
    }
  };

  const removeRecipient = (index) => {
    const newR = [...recipients];
    newR.splice(index, 1);
    setRecipients(newR);
  };

  const updateRecipient = (index, field, value) => {
    const newR = [...recipients];
    newR[index][field] = value;
    setRecipients(newR);
  };

  const validateForm = () => {
    setTxError('');
    let totalAmount = 0;
    const addresses = new Set();
    
    for (let i = 0; i < recipients.length; i++) {
        const { address, amount } = recipients[i];
        if (!address || !StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
            setTxError(`Invalid address at row ${i + 1}`);
            return false;
        }
        if (addresses.has(address)) {
            setTxError(`Duplicate address found at row ${i + 1}`);
            return false;
        }
        addresses.add(address);
        
        const floatAmt = parseFloat(amount);
        if (isNaN(floatAmt) || floatAmt <= 0) {
            setTxError(`Invalid amount at row ${i + 1}`);
            return false;
        }
        totalAmount += floatAmt;
    }
    
    if (totalAmount + 0.01 > parseFloat(balance)) {
        setTxError("Insufficient XLM balance for this batch transaction.");
        return false;
    }
    
    if (memoText.length > 28) {
        setTxError("Memo text must be 28 characters or fewer.");
        return false;
    }
    
    return true;
  };

  const handleSend = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      const account = await testnetServer.loadAccount(pubKey);
      let builder = new StellarSdk.TransactionBuilder(account, { fee: StellarSdk.BASE_FEE, networkPassphrase });
      
      recipients.forEach((rec) => {
         builder.addOperation(StellarSdk.Operation.payment({
            destination: rec.address,
            asset: StellarSdk.Asset.native(),
            amount: rec.amount.toString()
         }));
      });
      
      if (memoText) {
          builder.addMemo(StellarSdk.Memo.text(memoText));
      }
      
      const tx = builder.setTimeout(300).build();
      
      // Sign with Freighter
      const signedTxXdr = await signTransaction(tx.toXDR(), { network: 'TESTNET' });
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      
      // Submit to Horizon
      const response = await testnetServer.submitTransaction(signedTx);
      
      // Integration Point: Connect to existing transactionTracker
      const saved = saveTransaction({
         hash: response.hash,
         date: new Date().toISOString(),
         type: 'Batch Payment',
         memo: memoText,
         recipients: [...recipients],
         status: 'pending' // pending horizon confirmation and soroban logging
      });
      
      setTransactions(saved);
      
      // Reset form
      setRecipients([{ address: '', amount: '' }]);
      setMemoText('');
      setActiveTab('history');
      
    } catch (e) {
      console.error(e);
      let errorMsg = e.message || "Transaction submission failed";
      if (e.response && e.response.data && e.response.data.extras && e.response.data.extras.result_codes) {
         errorMsg = "Stellar Error: " + JSON.stringify(e.response.data.extras.result_codes);
      } else if (e.response && e.response.data && e.response.data.detail) {
         errorMsg = e.response.data.detail;
      }
      setTxError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12 shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Stellar Batch Pay
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wider border border-blue-500/30">TESTNET</span>
             {pubKey && (
                <button onClick={handleDisconnect} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 transition flex items-center gap-2">
                    Disconnect <LogOut className="w-4 h-4" />
                </button>
             )}
          </div>
        </header>

        {!pubKey ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-4xl font-extrabold mb-6">Mass Distribution on Stellar</h2>
            <p className="text-gray-400 mb-8 max-w-xl text-lg">Send XLM to multiple recipients instantly with one transaction, and automatically record the receipts on our Soroban smart contract.</p>
            <button 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 flex items-center"
              onClick={handleConnect} disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Freighter Wallet'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar Overview */}
            <div className="lg:col-span-1 space-y-6">
               <div className="glass-panel p-6">
                  <h3 className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-wider">Account Balance</h3>
                  <div className="text-4xl font-bold mb-6 flex items-end">
                      {parseFloat(balance).toFixed(2)} <span className="text-xl text-blue-400 ml-2 mb-1">XLM</span>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 mb-4">
                     <p className="text-xs text-gray-500 mb-1">Connected Address</p>
                     <div className="flex items-center justify-between font-mono text-sm">
                        <span className="truncate mr-2 text-gray-300">{pubKey.substring(0, 8)}...{pubKey.slice(-8)}</span>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="text-gray-400 hover:text-white transition" title="Copy Address">
                                {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setShowQr(!showQr)} className="text-gray-400 hover:text-white transition" title="Show QR Code">
                                <QrCode className="w-5 h-5" />
                            </button>
                        </div>
                     </div>
                  </div>

                  {showQr && (
                    <div className="bg-white p-4 rounded-xl flex justify-center mb-4 transition-all">
                        <QRCodeSVG value={pubKey} size={150} />
                    </div>
                  )}

                  <button 
                     onClick={() => window.open(`https://friendbot.stellar.org/?addr=${pubKey}`, '_blank')}
                     className="w-full text-center py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition"
                  >
                     Fund from Friendbot
                  </button>
               </div>
            </div>

            {/* Main Action Area */}
            <div className="lg:col-span-2">
               <div className="glass-panel overflow-hidden">
                  <div className="flex border-b border-gray-700/50">
                     <button 
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'send' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-800'}`}
                        onClick={() => setActiveTab('send')}
                     >
                        <Send className="w-4 h-4 inline-block mr-2 -mt-1" />
                        Send Native XLM
                     </button>
                     <button 
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'send_token' ? 'bg-green-600/10 text-green-400 border-b-2 border-green-500' : 'text-gray-400 hover:bg-gray-800'}`}
                        onClick={() => setActiveTab('send_token')}
                     >
                        <Plus className="w-4 h-4 inline-block mr-2 -mt-1" />
                        Send Tokens
                     </button>
                     <button 
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'history' ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:bg-gray-800'}`}
                        onClick={() => {
                            setActiveTab('history');
                            const saved = getTransactions();
                            setTransactions(saved);
                        }}
                     >
                        <History className="w-4 h-4 inline-block mr-2 -mt-1" />
                        Transaction History
                     </button>
                  </div>

                  <div className="p-6">
                     {activeTab === 'send_token' && (
                         <SendToken 
                             publicKey={pubKey} 
                             onBack={() => setActiveTab('history')} 
                             tokenContractId="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" 
                         />
                     )}
                     {activeTab === 'send' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-blue-900/20 p-4 rounded-lg border border-blue-800/50">
                                <span className="text-blue-200 text-sm">Send to 1-100 recipients simultaneously. Payments will be logged to Soroban automatically.</span>
                            </div>

                            {recipients.map((rec, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex-1 w-full">
                                        <input 
                                          type="text" 
                                          placeholder="Stellar Public Key (G...)" 
                                          className="input-field font-mono text-sm"
                                          value={rec.address}
                                          onChange={(e) => updateRecipient(idx, 'address', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-full sm:w-32">
                                        <input 
                                          type="number" 
                                          step="0.01"
                                          placeholder="Amount" 
                                          className="input-field text-right"
                                          value={rec.amount}
                                          onChange={(e) => updateRecipient(idx, 'amount', e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeRecipient(idx)} 
                                        disabled={recipients.length === 1}
                                        className="p-3 text-gray-500 hover:text-red-400 disabled:opacity-30 transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}

                            <div className="flex justify-between">
                                <button onClick={addRecipient} className="flex items-center text-sm text-blue-400 hover:text-blue-300 font-medium">
                                    <Plus className="w-4 h-4 mr-1" /> Add Recipient
                                </button>
                                <div className="text-sm text-gray-400 font-mono">
                                    Total: {recipients.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0).toFixed(2)} XLM
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Optional Memo (Max 28 chars)</label>
                                <input 
                                  type="text" 
                                  className="input-field" 
                                  value={memoText} 
                                  onChange={(e) => setMemoText(e.target.value)}
                                  maxLength={28}
                                />
                            </div>

                            {txError && (
                                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start text-red-200">
                                    <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                                    <span>{txError}</span>
                                </div>
                            )}

                            <button 
                               className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center ${isSubmitting ? 'bg-blue-800 text-gray-300 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                               onClick={handleSend}
                               disabled={isSubmitting}
                            >
                               {isSubmitting ? (
                                   <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white border-r-2 mr-3"></div> Sending...</>
                               ) : 'Sign & Submit Batch'}
                            </button>
                        </div>
                     )}

                     {activeTab === 'history' && (
                        <div>
                            <TransactionStatus transactions={transactions} />
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
