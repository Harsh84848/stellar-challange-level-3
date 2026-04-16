export const getTransactions = () => {
  const saved = localStorage.getItem('stellar_tx_history');
  return saved ? JSON.parse(saved) : [];
};

export const saveTransaction = (newTx) => {
  const current = getTransactions();
  const updated = [newTx, ...current].slice(0, 50);
  localStorage.setItem('stellar_tx_history', JSON.stringify(updated));
  return updated;
};

export const updateTransactionStatus = (hash, status, errorMsg = null) => {
  const current = getTransactions();
  const index = current.findIndex(t => t.hash === hash);
  if (index !== -1) {
    current[index].status = status;
    if (errorMsg) current[index].error = errorMsg;
    localStorage.setItem('stellar_tx_history', JSON.stringify(current));
  }
  return current;
};
