#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Credential {
    pub org: Address,
    pub score_value: u32,
    pub description: String,
}

#[contract]
pub struct TrustMeshContract;

#[contractimpl]
impl TrustMeshContract {
    pub fn add_credential(
        env: Env,
        user: Address,
        org: Address,
        score_value: u32,
        description: String,
    ) -> u32 {
        org.require_auth();

        let mut credentials: Vec<Credential> = env
            .storage()
            .persistent()
            .get(&user)
            .unwrap_or_else(|| Vec::new(&env));

        credentials.push_back(Credential {
            org: org.clone(),
            score_value,
            description,
        });

        env.storage().persistent().set(&user, &credentials);

        Self::get_score(env.clone(), user)
    }

    pub fn get_score(env: Env, user: Address) -> u32 {
        let credentials: Vec<Credential> = env
            .storage()
            .persistent()
            .get(&user)
            .unwrap_or_else(|| Vec::new(&env));

        let mut total_score = 0;
        for cred in credentials.iter() {
            total_score += cred.score_value;
        }
        total_score
    }

    pub fn is_eligible_for_loan(env: Env, user: Address, required_score: u32) -> bool {
        let current_score = Self::get_score(env.clone(), user);
        current_score >= required_score
    }
}

mod test;
