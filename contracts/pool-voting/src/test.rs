#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_vote() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, PoolVotingContract);
    let client = PoolVotingContractClient::new(&env, &contract_id);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let pool = Address::generate(&env);

    // Initial score should be (0, 0)
    assert_eq!(client.get_score(&pool), (0, 0));

    // User 1 upvotes
    client.vote(&user1, &pool, &true);
    assert_eq!(client.get_score(&pool), (1, 0));

    // User 1 tries to upvote again (should not change score)
    client.vote(&user1, &pool, &true);
    assert_eq!(client.get_score(&pool), (1, 0));

    // User 2 downvotes
    client.vote(&user2, &pool, &false);
    assert_eq!(client.get_score(&pool), (1, 1));

    // User 1 changes upvote to downvote
    client.vote(&user1, &pool, &false);
    assert_eq!(client.get_score(&pool), (0, 2));

    // User 2 changes downvote to upvote
    client.vote(&user2, &pool, &true);
    assert_eq!(client.get_score(&pool), (1, 1));
}

#[test]
fn test_get_all_scores() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, PoolVotingContract);
    let client = PoolVotingContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let pool1 = Address::generate(&env);
    let pool2 = Address::generate(&env);
    let pool3 = Address::generate(&env);

    client.vote(&user, &pool1, &true);
    client.vote(&user, &pool2, &false);
    client.vote(&user, &pool3, &true);

    let all_scores = client.get_all_scores();

    assert_eq!(all_scores.len(), 3);
    assert_eq!(all_scores.get(pool1).unwrap(), (1, 0));
    assert_eq!(all_scores.get(pool2).unwrap(), (0, 1));
    assert_eq!(all_scores.get(pool3).unwrap(), (1, 0));
}
