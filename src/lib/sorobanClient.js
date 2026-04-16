import { SOROBAN_RPC_URL, SOROBAN_NETWORK_PASSPHRASE, CONTRACT_ID } from '../config/soroban';
import { rpc, TransactionBuilder, Contract, nativeToScVal, Keypair } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const sorobanServer = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });

async function getTxBuilder(pubKey) {
  const account = await sorobanServer.getAccount(pubKey);
  return new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
  });
}

export async function recordPaymentOnChain(fromPubKey, toPubKey, amount, timestamp) {
  const contract = new Contract(CONTRACT_ID);
  
  // Convert arguments to ScVals
  // record_payment(from: Address, to: Address, amount: i32, timestamp: i32)
  const args = [
    nativeToScVal(fromPubKey, { type: "address" }),
    nativeToScVal(toPubKey, { type: "address" }),
    nativeToScVal(amount, { type: "i32" }),
    nativeToScVal(timestamp, { type: "i32" })
  ];

  const op = contract.call("record_payment", ...args);
  
  const txBuilder = await getTxBuilder(fromPubKey);
  const tx = txBuilder.addOperation(op).setTimeout(300).build();

  // Simulate to get footprint & fee
  const sim = await sorobanServer.simulateTransaction(tx);
  if (sim.error) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  // Assemble the final transaction
  const finalTx = rpc.assembleTransaction(tx, sim).build();

  try {
    const signedTxXdr = await signTransaction(finalTx.toXDR(), {
      network: "TESTNET",
      networkPassphrase: SOROBAN_NETWORK_PASSPHRASE
    });
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, SOROBAN_NETWORK_PASSPHRASE);
    const sendResult = await sorobanServer.sendTransaction(signedTx);
    
    if (sendResult.status === "PENDING") {
      let getTx = await sorobanServer.getTransaction(sendResult.hash);
      let attempts = 0;
      while (getTx.status === "NOT_FOUND" && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        getTx = await sorobanServer.getTransaction(sendResult.hash);
        attempts++;
      }
      return getTx;
    }
    return sendResult;
  } catch (error) {
    console.error("Soroban contract call failed:", error);
    throw error;
  }
}

export async function recordBatchPayments(fromPubKey, recipients) {
  if (recipients.length === 0) return null;
  const contract = new Contract(CONTRACT_ID);
  
  // Create or load a local burner wallet to autonomously sign Soroban receipts 
  // bypassing Freighter's current Protocol 22 XDR parsing limitations (Bad union switch: 4 bug)
  let burnerSecret = localStorage.getItem('soroban_burner_key');
  let burnerKeypair;
  if (!burnerSecret) {
    burnerKeypair = Keypair.random();
    burnerSecret = burnerKeypair.secret();
    localStorage.setItem('soroban_burner_key', burnerSecret);
  } else {
    burnerKeypair = Keypair.fromSecret(burnerSecret);
  }

  try {
    await sorobanServer.getAccount(burnerKeypair.publicKey());
  } catch (e) {
    // Fund it if it doesn't exist
    await fetch(`https://friendbot.stellar.org?addr=${burnerKeypair.publicKey()}`);
    // Wait for the ledger to close (usually ~5-7 seconds) so the account reflects natively
    await new Promise(resolve => setTimeout(resolve, 8000));
  }

  const burnerAccount = await sorobanServer.getAccount(burnerKeypair.publicKey());
  const txBuilder = new TransactionBuilder(burnerAccount, {
    fee: "100000",
    networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const { to, amount } = recipients[0];
  const args = [
    nativeToScVal(fromPubKey, { type: "address" }),
    nativeToScVal(to, { type: "address" }),
    nativeToScVal(Math.floor(Number(amount)), { type: "i32" }),
    nativeToScVal(timestamp, { type: "i32" })
  ];
  
  const op = contract.call("record_payment", ...args);
  txBuilder.addOperation(op);
  const tx = txBuilder.setTimeout(300).build();
  
  const sim = await sorobanServer.simulateTransaction(tx);
  if (sim.error) {
    throw new Error(`Batch Simulation failed: ${sim.error}`);
  }

  const finalTx = rpc.assembleTransaction(tx, sim).build();

  try {
    // Autonomously sign the transaction to bypass Freighter
    finalTx.sign(burnerKeypair);
    
    const sendResult = await sorobanServer.sendTransaction(finalTx);
    
    let getTx = await sorobanServer.getTransaction(sendResult.hash);
    let attempts = 0;
    while (getTx.status === "NOT_FOUND" && attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      getTx = await sorobanServer.getTransaction(sendResult.hash);
      attempts++;
    }
    return getTx;
  } catch (error) {
    console.error("Batch payments logging failed:", error);
    throw error;
  }
}
