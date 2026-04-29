import React, { useState, useEffect } from 'react';
import { useSorobanReact } from '../hooks';
import { Keypair, TransactionBuilder, Networks, Operation, Asset, Horizon } from '@stellar/stellar-sdk';
import Loader from './Loader';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

const SendToken = () => {
  const { publicKey, signTransaction } = useSorobanReact();
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cachedTransactions, setCachedTransactions] = useState(() => {
    const cache = localStorage.getItem('transactions');
    return cache ? JSON.parse(cache) : [];
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(cachedTransactions));
  }, [cachedTransactions]);

  const handleSend = async () => {
    setIsLoading(true);
    setStatus('Sending...');
    try {
      const sourceKeypair = Keypair.fromPublicKey(publicKey);
      const account = await server.loadAccount(sourceKeypair.publicKey());

      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount,
          })
        )
        .setTimeout(30)
        .build();

      const signedTransaction = await signTransaction(transaction);
      const result = await server.submitTransaction(signedTransaction);
      setCachedTransactions((prev) => [...prev, { hash: result.hash, destination, amount }]);
      setStatus(`Transaction successful: ${result.hash}`);
    } catch (error) {
      setStatus(`Transaction failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Send Token</h2>
      <input
        type="text"
        placeholder="Destination Address"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {isLoading && <Loader />}
      <p>{status}</p>
      <h3>Cached Transactions</h3>
      <ul>
        {cachedTransactions.map((tx, index) => (
          <li key={index}>
            {tx.hash} - {tx.destination} - {tx.amount}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SendToken;
