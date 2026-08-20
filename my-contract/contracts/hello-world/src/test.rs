#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_add_credential() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TrustMeshContract, ());
    let client = TrustMeshContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let org = Address::generate(&env);

    let description = String::from_str(&env, "Freelance Dev Project");
    let score = client.add_credential(&user, &org, &100, &description);
    assert_eq!(score, 100);

    let description2 = String::from_str(&env, "Hackathon Winner");
    let score2 = client.add_credential(&user, &org, &50, &description2);
    assert_eq!(score2, 150);

    let eligible = client.is_eligible_for_loan(&user, &120);
    assert_eq!(eligible, true);

    let not_eligible = client.is_eligible_for_loan(&user, &200);
    assert_eq!(not_eligible, false);
}
