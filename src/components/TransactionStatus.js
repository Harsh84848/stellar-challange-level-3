import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const TransactionStatus = ({ transactions }) => {
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center text-yellow-400 text-sm"><Clock className="w-4 h-4 mr-1"/> Confirming Native...</span>;
      case 'soroban_recording':
        return <span className="flex items-center text-blue-400 text-sm"><Clock className="w-4 h-4 mr-1"/> Log to Smart Contract...</span>;
      case 'success':
        return <span className="flex items-center text-green-400 text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Complete</span>;
      case 'failed':
      case 'soroban_failed':
        return <span className="flex items-center text-red-400 text-sm"><XCircle className="w-4 h-4 mr-1"/> Failed</span>;
      default:
        return null;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No transactions found in history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {transactions.map((tx, idx) => (
        <div key={idx} className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50">
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold">{tx.type} ({tx.recipients.length} recipients)</span>
            {renderStatusBadge(tx.status)}
          </div>
          <div className="text-xs text-gray-400 mb-3">
            {new Date(tx.date).toLocaleString()} • Hash:{' '}
            <a href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
              {tx.hash.substring(0, 12)}...
            </a>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg text-sm max-h-32 overflow-y-auto">
            {tx.recipients.map((r, i) => (
              <div key={i} className="flex justify-between text-gray-300 border-b border-gray-800/50 last:border-0 py-1">
                <span className="font-mono">...{r.address.slice(-8)}</span>
                <span>{r.amount} {tx.asset || 'TOKENS'}</span>
              </div>
            ))}
          </div>
          {tx.error && (
            <div className="mt-2 text-xs text-red-400">Error: {tx.error}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TransactionStatus;
