import React, { useState, useEffect, useCallback } from 'react';
import { setAllowed, requestAccess, signTransaction, getPublicKey, isAllowed } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Shield, Award, CheckCircle, TrendingUp, AlertCircle, Building, Wallet, LogOut, Loader2 } from 'lucide-react';
import './index.css';

// Mock Contract ID for now (will update after deployment)
const CONTRACT_ID = "CA...mock_contract_id...TODO"; 
const horizonServerUrl = "https://horizon-testnet.stellar.org";
const testnetServer = new StellarSdk.Horizon.Server(horizonServerUrl);

function App() {
  const [pubKey, setPubKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'org'

  // User State
  const [trustScore, setTrustScore] = useState(0);
  const [credentials, setCredentials] = useState([]);
  const [loanAmount, setLoanAmount] = useState('100');
  const [isEligible, setIsEligible] = useState(null);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Org State
  const [recipientAddress, setRecipientAddress] = useState('');
  const [scoreValue, setScoreValue] = useState('10');
  const [credentialDesc, setCredentialDesc] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueStatus, setIssueStatus] = useState('');

  const checkConnection = useCallback(async () => {
    if (await isAllowed()) {
      const address = await getPublicKey();
      if (address) {
        setPubKey(address);
        fetchUserData(address);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Mock Fetching User Data (Since contract invocation from frontend requires soroban-client setup)
  // For the MVP frontend structure, we will simulate the fetch if real contract isn't linked yet.
  const fetchUserData = async (address) => {
    setIsFetchingData(true);
    try {
      // TODO: Replace with real Soroban get_score call
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setTrustScore(0); 
      setCredentials([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await setAllowed();
      const access = await requestAccess();
      if (access) {
        setPubKey(access);
        fetchUserData(access);
      }
    } catch (e) {
      alert("Error connecting Freighter: " + e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setPubKey('');
    setTrustScore(0);
    setCredentials([]);
  };

  const checkLoanEligibility = () => {
    // Required score logic (mock): Loan > 500 requires score 50
    const required = parseInt(loanAmount) > 500 ? 50 : 20;
    setIsEligible(trustScore >= required);
  };

  const handleIssueCredential = async () => {
    if (!recipientAddress || !scoreValue || !credentialDesc) return;
    setIsIssuing(true);
    setIssueStatus('Initiating transaction...');
    try {
      // TODO: Replace with real Soroban contract invocation using @stellar/freighter-api
      // For now, simulate the issuance flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIssueStatus('Awaiting wallet signature...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIssueStatus('Credential successfully issued on Stellar!');
      setRecipientAddress('');
      setCredentialDesc('');
      
      // Update local state if issuing to self (for demo purposes)
      if (recipientAddress === pubKey) {
        setTrustScore(prev => prev + parseInt(scoreValue));
        setCredentials(prev => [...prev, {
            org: pubKey,
            score_value: parseInt(scoreValue),
            description: credentialDesc,
            date: new Date().toLocaleDateString()
        }]);
      }
    } catch (e) {
      console.error(e);
      setIssueStatus('Error issuing credential');
    } finally {
      setIsIssuing(false);
      setTimeout(() => setIssueStatus(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <nav className="relative z-10 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TrustMesh
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider border border-emerald-500/20">
               STELLAR TESTNET
             </span>
             {pubKey ? (
                <button 
                  onClick={handleDisconnect} 
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <span className="hidden sm:inline">{pubKey.substring(0, 6)}...{pubKey.slice(-4)}</span>
                  <LogOut className="w-4 h-4" />
                </button>
             ) : (
                <button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
             )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!pubKey ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" /> The Future of Financial Reputation
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Your Reputation <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                Travels With You.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
              Build a portable, decentralized Trust Score based on your real-world achievements. Access global financial services without relying on traditional credit bureaus.
            </p>
            <button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="group relative inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Building Trust
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3">
              <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-2 flex lg:flex-col gap-2">
                <button 
                  onClick={() => setActiveTab('user')}
                  className={`flex-1 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'user' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-5 h-5" /> My Trust Score
                </button>
                <button 
                  onClick={() => setActiveTab('org')}
                  className={`flex-1 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'org' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Building className="w-5 h-5" /> Organization Portal
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
              {activeTab === 'user' && (
                <div className="space-y-6">
                  {/* Score Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                        <Shield className="w-32 h-32 text-indigo-400" />
                      </div>
                      <h3 className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-4">Global Trust Score</h3>
                      {isFetchingData ? (
                        <div className="animate-pulse flex items-baseline gap-2">
                          <div className="h-16 w-32 bg-slate-800 rounded-lg"></div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-6xl font-black text-white">{trustScore}</span>
                          <span className="text-xl text-slate-400">/ 1000</span>
                        </div>
                      )}
                      <p className="text-slate-400 mt-6 max-w-[200px] text-sm">
                        Based on {credentials.length} verified credentials on Stellar.
                      </p>
                    </div>

                    {/* Loan Eligibility Simulator */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
                      <div>
                        <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          Loan Eligibility Check
                        </h3>
                        <div className="flex gap-4 mb-6">
                          <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input 
                              type="number" 
                              value={loanAmount}
                              onChange={(e) => setLoanAmount(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <button 
                            onClick={checkLoanEligibility}
                            className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-semibold transition-colors"
                          >
                            Check
                          </button>
                        </div>
                      </div>
                      
                      {isEligible !== null && (
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${isEligible ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          {isEligible ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                          <div>
                            <p className="font-semibold">{isEligible ? 'Eligible for Loan' : 'Not Eligible Yet'}</p>
                            <p className="text-sm opacity-80 mt-1">
                              {isEligible ? 'Your Trust Score meets the requirement.' : 'Build your Trust Score with more credentials to unlock this loan amount.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credentials List */}
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6">Verified Credentials</h3>
                    
                    {credentials.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                        <Award className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400">No credentials yet.</p>
                        <p className="text-sm text-slate-500 mt-1">Head to the Organization Portal to issue a mock credential.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {credentials.map((cred, i) => (
                          <div key={i} className="group bg-slate-950/50 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/30 transition-colors flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg text-slate-200">{cred.description}</h4>
                              <p className="text-sm text-slate-500 font-mono mt-2 flex items-center gap-2">
                                <Building className="w-4 h-4" /> Issued by: {cred.org.substring(0,6)}...{cred.org.slice(-4)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-2xl font-bold text-emerald-400">+{cred.score_value}</span>
                              <span className="text-xs text-slate-500 mt-1">{cred.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'org' && (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Building className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Issue Credential</h2>
                      <p className="text-slate-400 text-sm">Mint a verified achievement on the Stellar blockchain.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Recipient Public Key</label>
                      <input 
                        type="text" 
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="G..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-mono text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Achievement Description</label>
                      <input 
                        type="text" 
                        value={credentialDesc}
                        onChange={(e) => setCredentialDesc(e.target.value)}
                        placeholder="e.g. Completed 10 Freelance Projects"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Trust Score Value</label>
                      <input 
                        type="number" 
                        value={scoreValue}
                        onChange={(e) => setScoreValue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {issueStatus && (
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-emerald-400 text-sm flex items-center gap-3">
                        {isIssuing && <Loader2 className="w-4 h-4 animate-spin" />}
                        {issueStatus}
                      </div>
                    )}

                    <button 
                      onClick={handleIssueCredential}
                      disabled={isIssuing || !recipientAddress || !credentialDesc}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isIssuing ? 'Processing...' : 'Mint Credential on Stellar'}
                    </button>
                    
                    <p className="text-xs text-center text-slate-500 mt-4">
                      For demo purposes, you can issue a credential to your own connected address to see your score increase.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
