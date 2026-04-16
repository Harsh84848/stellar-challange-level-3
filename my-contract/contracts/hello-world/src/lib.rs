#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, Vec, Map};

pub struct PaymentRecorder;

#[contract]
pub struct PaymentRecorderContract;

#[contractimpl]
impl PaymentRecorderContract {
    /// Record a payment transaction
    pub fn record_payment(
        env: Env,
        from: soroban_sdk::Address,
        to: soroban_sdk::Address,
        amount: i32,
        timestamp: i32,
    ) -> bool {
        // Get or create the payments vector
        let key = Symbol::new(&env, "payments");
        let mut payments: Vec<Map<Symbol, soroban_sdk::Val>> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));

        // Create payment record
        let mut payment = Map::new(&env);
        payment.set(Symbol::new(&env, "from"), from.to_val());
        payment.set(Symbol::new(&env, "to"), to.to_val());
        payment.set(Symbol::new(&env, "amount"), amount.into());
        payment.set(Symbol::new(&env, "timestamp"), timestamp.into());

        payments.push_back(payment);

        // Store updated payments
        env.storage().persistent().set(&key, &payments);

        true
    }

    /// Get all recorded payments
    pub fn get_payments(env: Env) -> Vec<Map<Symbol, soroban_sdk::Val>> {
        let key = Symbol::new(&env, "payments");
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get payment count
    pub fn get_payment_count(env: Env) -> u32 {
        let key = Symbol::new(&env, "payments");
        let payments: Vec<Map<Symbol, soroban_sdk::Val>> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        payments.len() as u32
    }

    /// Clear all payments (admin only)
    pub fn clear_payments(env: Env) -> bool {
        let key = Symbol::new(&env, "payments");
        env.storage().persistent().remove(&key);
        true
    }
}
