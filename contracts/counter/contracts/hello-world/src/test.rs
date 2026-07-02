#![cfg(test)]

use super::*;
use soroban_sdk::Env;

#[test]
fn test_counter() {
    let env = Env::default();
    let contract_id = env.register(CounterContract, ());
    let client = CounterContractClient::new(&env, &contract_id);

    assert_eq!(client.get(), 0);
    assert_eq!(client.increment(), 1);
    assert_eq!(client.increment(), 2);
    assert_eq!(client.get(), 2);
    client.reset();
    assert_eq!(client.get(), 0);
}
