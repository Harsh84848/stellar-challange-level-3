import React, { useState, useEffect, useCallback } from 'react';
import { copyToClipboard } from 'copy-to-clipboard';
import { QRCodeSVG } from 'qrcode.react';
import { setAllowed, requestAccess, signTransaction, getPublicKey, isAllowed } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Copy, QrCode, LogOut, Send, Search, Users, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import './index.css';
import Loader from './components/Loader';

const horizonServerUrl = "https://horizon-testnet.stellar.org";
const networkPassphrase = StellarSdk.Networks.TESTNET;
const testnetServer = new StellarSdk.Horizon.Server(horizonServerUrl);

const FEEDBACK_SINK = "GB6JLDD5HBGI6Y7XQDDMAIZYX4WCZZAY66LWHOS3EUW677DCQC6TVGYL";

function App() {
  const [pubKey, setPubKey] = useState('');
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('submit');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Submit Feedback States
  const [feedbackText, setFeedbackText] = useState('');
  const [txError, setTxError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  
  // Search States
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState({});
  
  // Global States
  const [globalFeedbacks, setGlobalFeedbacks] = useState([]);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);

  // Load cache from localStorage
  useEffect(() => {
    const savedCache = localStorage.getItem('stellar_feedback_cache');
    if (savedCache) {
      setSearchCache(JSON.parse(savedCache));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stellar_feedback_cache', JSON.stringify(searchCache));
  }, [searchCache]);

  const checkConnection = useCallback(async () => {
    if (await isAllowed()) {
      const address = await getPublicKey();
      if (address) {
        setPubKey(address);
        fetchBalance(address);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Make sure the Feedback Sink account exists on Testnet
  useEffect(() => {
    const initSink = async () => {
      try {
        await testnetServer.loadAccount(FEEDBACK_SINK);
      } catch (e) {
        if (e.response && e.response.status === 404) {
          fetch(`https://friendbot.stellar.org?addr=${FEEDBACK_SINK}`);
        }
      }
    };
    initSink();
  }, []);

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
  };

  const handleCopy = () => {
    copyToClipboard(pubKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitFeedback = async () => {
    setTxError('');
    setSubmitStatus('');
    if (!feedbackText || feedbackText.length > 28) {
      setTxError("Feedback must be between 1 and 28 characters.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const account = await testnetServer.loadAccount(pubKey);
      let builder = new StellarSdk.TransactionBuilder(account, { fee: StellarSdk.BASE_FEE, networkPassphrase });
      
      builder.addOperation(StellarSdk.Operation.payment({
        destination: FEEDBACK_SINK,
        asset: StellarSdk.Asset.native(),
        amount: "0.0000001"
      }));
      
      builder.addMemo(StellarSdk.Memo.text(feedbackText));
      
      const tx = builder.setTimeout(300).build();
      
      setSubmitStatus('Awaiting wallet signature...');
      const signedTxXdr = await signTransaction(tx.toXDR(), { network: 'TESTNET' });
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      
      setSubmitStatus('Submitting to Stellar network...');
      const response = await testnetServer.submitTransaction(signedTx);
      
      setSubmitStatus(`Success! Hash: ${response.hash}`);
      setFeedbackText('');
      
      // Clear global cache so it refreshes
      fetchGlobalFeedbacks(true);
      
    } catch (e) {
      console.error(e);
      let errorMsg = e.message || "Transaction submission failed";
      if (e.response && e.response.data && e.response.data.extras) {
         errorMsg = "Stellar Error: " + JSON.stringify(e.response.data.extras.result_codes);
      }
      setTxError(errorMsg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(''), 5000);
    }
  };

  const parseFeedbacksFromTxs = (txs) => {
    return txs.records
      .filter(tx => tx.memo_type === 'text' && tx.memo)
      .map(tx => ({
        id: tx.id,
        hash: tx.hash,
        sender: tx.source_account,
        feedback: tx.memo,
        date: tx.created_at
      }));
  };

  const handleSearch = async () => {
    if (!searchAddress || !StellarSdk.StrKey.isValidEd25519PublicKey(searchAddress)) {
      alert("Please enter a valid Stellar address.");
      return;
    }

    if (searchCache[searchAddress]) {
      setSearchResults(searchCache[searchAddress]);
      return;
    }

    setIsSearching(true);
    try {
      // Find transactions for this account where destination is FEEDBACK_SINK
      // To simplify, we get the account's transactions and filter for the feedback memo
      const txs = await testnetServer.transactions().forAccount(searchAddress).limit(100).order('desc').call();
      
      // We assume any text memo sent by this account in this dApp is feedback
      const feedbacks = parseFeedbacksFromTxs(txs).filter(f => f.sender === searchAddress);
      
      setSearchResults(feedbacks);
      
      setSearchCache(prev => ({
        ...prev,
        [searchAddress]: feedbacks
      }));
    } catch (error) {
      console.error(error);
      alert("Failed to fetch feedback for this address.");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchGlobalFeedbacks = async (force = false) => {
    if (globalFeedbacks.length > 0 && !force) return;
    setIsFetchingGlobal(true);
    try {
      const txs = await testnetServer.transactions().forAccount(FEEDBACK_SINK).limit(50).order('desc').call();
      const feedbacks = parseFeedbacksFromTxs(txs);
      
      // Remove duplicates from the same sender if desired, or keep all
      // For this global list, let's keep all recent ones
      setGlobalFeedbacks(feedbacks);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingGlobal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobalFeedbacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const FeedbackCard = ({ fb }) => (
    <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50 mb-4 transition hover:bg-gray-800">
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-sm text-blue-400">
          {fb.sender.substring(0, 8)}...{fb.sender.slice(-8)}
        </span>
        <span className="text-xs text-gray-500">{new Date(fb.date).toLocaleString()}</span>
      </div>
      <p className="text-gray-200 font-medium text-lg">&quot;{fb.feedback}&quot;</p>
      <div className="mt-3 text-xs">
        <a href={`https://stellar.expert/explorer/testnet/tx/${fb.hash}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-400 flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" /> Verified on Chain
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden text-white bg-[#0B101E]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Stellar Feedback
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
            <h2 className="text-4xl font-extrabold mb-6">Decentralized Feedback System</h2>
            <p className="text-gray-400 mb-8 max-w-xl text-lg">Leave immutable feedback on the Stellar blockchain. View what others have shared globally, and search by specific addresses.</p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105 flex items-center"
              onClick={handleConnect} disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Freighter Wallet'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar Overview */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl">
                  <h3 className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-wider">Account Balance</h3>
                  <div className="text-4xl font-bold mb-6 flex items-end">
                      {parseFloat(balance).toFixed(2)} <span className="text-xl text-indigo-400 ml-2 mb-1">XLM</span>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 border border-gray-800 mb-4">
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
                     className="w-full text-center py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition"
                  >
                     Fund from Friendbot
                  </button>
               </div>
            </div>

            {/* Main Action Area */}
            <div className="lg:col-span-2">
               <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                  <div className="flex border-b border-gray-800">
                     <button 
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'submit' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
                        onClick={() => setActiveTab('submit')}
                     >
                        <Send className="w-4 h-4 inline-block mr-2 -mt-1" />
                        Submit
                     </button>
                     <button 
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'search' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
                        onClick={() => setActiveTab('search')}
                     >
                        <Search className="w-4 h-4 inline-block mr-2 -mt-1" />
                        Search
                     </button>
                     <button 
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'global' ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
                        onClick={() => setActiveTab('global')}
                     >
                        <Users className="w-4 h-4 inline-block mr-2 -mt-1" />
                        Global
                     </button>
                  </div>

                  <div className="p-6">
                     {activeTab === 'submit' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-indigo-900/20 p-4 rounded-lg border border-indigo-800/50">
                                <span className="text-indigo-200 text-sm">Submit your message on the Stellar blockchain. It will be permanently recorded.</span>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Your Feedback (Max 28 chars)</label>
                                <textarea 
                                  className="w-full bg-black/40 border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-24"
                                  placeholder="E.g., Great dApp experience!"
                                  value={feedbackText} 
                                  onChange={(e) => setFeedbackText(e.target.value)}
                                  maxLength={28}
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {feedbackText.length}/28
                                </div>
                            </div>

                            {txError && (
                                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start text-red-200">
                                    <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                                    <span>{txError}</span>
                                </div>
                            )}

                            {submitStatus && !txError && (
                                <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg flex items-center text-blue-200">
                                    {isSubmitting && <Loader />}
                                    <span className={isSubmitting ? "ml-3" : ""}>{submitStatus}</span>
                                </div>
                            )}

                            <button 
                               className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center ${isSubmitting ? 'bg-indigo-800 text-gray-300 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                               onClick={handleSubmitFeedback}
                               disabled={isSubmitting || !feedbackText}
                            >
                               {isSubmitting ? 'Processing...' : 'Record Feedback on Chain'}
                            </button>
                        </div>
                     )}

                     {activeTab === 'search' && (
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Enter Stellar Public Key (G...)" 
                                  className="flex-1 bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                                  value={searchAddress}
                                  onChange={(e) => setSearchAddress(e.target.value)}
                                />
                                <button 
                                  onClick={handleSearch}
                                  disabled={isSearching || !searchAddress}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                  {isSearching ? <Loader /> : 'Search'}
                                </button>
                            </div>

                            <div className="mt-6 max-h-[400px] overflow-y-auto pr-2">
                                {searchResults.length === 0 && !isSearching && searchAddress && (
                                    <div className="text-center py-10 text-gray-500">
                                        No feedback found for this address.
                                    </div>
                                )}
                                {searchResults.map(fb => <FeedbackCard key={fb.id} fb={fb} />)}
                            </div>
                        </div>
                     )}

                     {activeTab === 'global' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-200">Recent Global Contributors</h3>
                                <button onClick={() => fetchGlobalFeedbacks(true)} className="text-xs text-purple-400 hover:text-purple-300">
                                    Refresh
                                </button>
                            </div>
                            
                            {isFetchingGlobal ? (
                                <div className="py-10 flex justify-center"><Loader /></div>
                            ) : (
                                <div className="max-h-[500px] overflow-y-auto pr-2">
                                    {globalFeedbacks.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">No global feedback yet.</div>
                                    ) : (
                                        globalFeedbacks.map(fb => <FeedbackCard key={fb.id} fb={fb} />)
                                    )}
                                </div>
                            )}
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
