import React, { useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { Plus, Trash2, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import { SOROBAN_RPC_URL, SOROBAN_NETWORK_PASSPHRASE } from '../config/soroban';
import { saveTransaction } from '../lib/transactionTracker';

const SendToken = ({ publicKey, onBack, tokenContractId }) => {
  const [recipients, setRecipients] = useState([{ address: '', amount: '' }]);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState('');
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message }

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
    setErrors('');
    let isValid = true;
    const addresses = new Set();
    
    for (let i = 0; i < recipients.length; i++) {
        const { address, amount } = recipients[i];
        if (!address || !StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
            setErrors(`Invalid address at row ${i + 1}`);
            isValid = false;
            break;
        }
        if (addresses.has(address)) {
            setErrors(`Duplicate address found at row ${i + 1}`);
            isValid = false;
            break;
        }
        addresses.add(address);
        
        const floatAmt = parseFloat(amount);
        if (isNaN(floatAmt) || floatAmt <= 0) {
            setErrors(`Invalid amount at row ${i + 1}`);
            isValid = false;
            break;
        }
    }
    
    if (memo.length > 28) {
        setErrors("Memo text must be 28 characters or fewer.");
        isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setAlert(null);
    
    try {
      const sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });
      const account = await sorobanServer.getAccount(publicKey);
      
      const contract = new StellarSdk.Contract(tokenContractId);
      
      for (const rec of recipients) {
         // Handle token decimals (assume 7 decimals like XLM)
         const amountInStroops = window.BigInt(Math.floor(parseFloat(rec.amount) * 1e7));
         
         const args = [
            StellarSdk.nativeToScVal(publicKey, { type: "address" }),
            StellarSdk.nativeToScVal(rec.address, { type: "address" }),
            StellarSdk.nativeToScVal(amountInStroops, { type: "i128" })
         ];
         
         // Build transaction with invokeContract operation
         let builder = new StellarSdk.TransactionBuilder(account, { 
             fee: "100000", 
             networkPassphrase: SOROBAN_NETWORK_PASSPHRASE 
         });
         
         builder.addOperation(contract.call("transfer", ...args));
         
         if (memo) {
             builder.addMemo(StellarSdk.Memo.text(memo));
         }
         
         const tx = builder.setTimeout(300).build();
         
         // Simulate
         const sim = await sorobanServer.simulateTransaction(tx);
         if (sim.error) throw new Error("Simulation failed: " + sim.error);
         
         const finalTx = StellarSdk.rpc.assembleTransaction(tx, sim).build();
         
         // Sign with Freighter
         const signedTxXdr = await signTransaction(finalTx.toXDR(), { network: 'TESTNET' });
         const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, SOROBAN_NETWORK_PASSPHRASE);
         
         // Submit to network
         const sendResult = await sorobanServer.sendTransaction(signedTx);
         if (sendResult.errorResultXdr) {
             throw new Error("Transaction failed on the Soroban network.");
         }
         
         // Integration Point: Connect to existing transactionTracker
         saveTransaction({
            hash: sendResult.hash,
            date: new Date().toISOString(),
            type: 'Soroban Token Transfer',
            memo: memo,
            asset: 'TOKENS',
            recipients: [rec],
            status: 'pending'
         });
      }
      
      setAlert({ type: 'success', message: 'Successfully initiated transfer processes.' });
      setRecipients([{ address: '', amount: '' }]);
      setMemo('');
      
    } catch (e) {
      console.error(e);
      let errorMsg = e.message || "Transaction submission failed";
      setErrors(errorMsg);
      setAlert({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3 p-2 rounded-full hover:bg-gray-800 text-gray-400 transition">
           <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Transfer Soroban Tokens</h2>
      </div>

      <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/50 mb-4 flex justify-between items-center">
         <span className="text-blue-200 text-sm">Contract ID: {tokenContractId.substring(0,8)}...{tokenContractId.slice(-8)}</span>
      </div>

      {recipients.map((rec, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
                <input 
                  type="text" 
                  placeholder="Recipient Address (G...)" 
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
      </div>

      <div>
          <label className="block text-sm text-gray-400 mb-2">Transfer Memo (Optional)</label>
          <input 
            type="text" 
            className="input-field" 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)}
            maxLength={28}
          />
      </div>

      {errors && (
          <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start text-red-200">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <span>{errors}</span>
          </div>
      )}

      {alert && alert.type === 'success' && (
          <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200">
              {alert.message}
          </div>
      )}

      <button 
         className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center ${loading ? 'bg-blue-800 text-gray-300 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
         onClick={handleSubmit}
         disabled={loading}
      >
         {loading ? (
             <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white border-r-2 mr-3"></div> Submitting Transfer...</>
         ) : (
             <><Send className="w-5 h-5 mr-2" /> Transfer Tokens</>
         )}
      </button>
    </div>
  );
};

export default SendToken;
