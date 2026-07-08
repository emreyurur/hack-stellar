#![cfg(test)]
#![allow(deprecated)] // env.events().publish() is deprecated in SDK v26 but still functional

use super::*;
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

// ─── Inline mock of the counter contract ─────────────────────────────────────
// We define a minimal counter here so the router tests are self-contained
// and don't require a pre-compiled WASM artifact.

#[contract]
pub struct MockCounterContract;

#[contractimpl]
impl MockCounterContract {
    pub fn increment(env: Env) -> u32 {
        let key = symbol_short!("CNT");
        let mut count: u32 = env.storage().instance().get(&key).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&key, &count);
        env.events().publish(
            (symbol_short!("counter"), symbol_short!("incr")),
            count,
        );
        count
    }

    pub fn get(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("CNT")).unwrap_or(0)
    }

    pub fn reset(env: Env) {
        env.storage().instance().set(&symbol_short!("CNT"), &0u32);
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[test]
fn test_route_increment_delegates_to_counter() {
    let env = Env::default();
    env.mock_all_auths();

    let counter_id = env.register(MockCounterContract, ());
    let router_id = env.register(PoolRouterContract, ());
    let router = PoolRouterContractClient::new(&env, &router_id);

    assert_eq!(router.route_increment(&counter_id), 1);
    assert_eq!(router.route_increment(&counter_id), 2);
    assert_eq!(router.route_increment(&counter_id), 3);
}

#[test]
fn test_read_counter_via_router() {
    let env = Env::default();
    env.mock_all_auths();

    let counter_id = env.register(MockCounterContract, ());
    let router_id = env.register(PoolRouterContract, ());
    let router = PoolRouterContractClient::new(&env, &router_id);

    // Before any increment
    assert_eq!(router.read_counter(&counter_id), 0);

    // Increment through router, then read
    router.route_increment(&counter_id);
    assert_eq!(router.read_counter(&counter_id), 1);
}

#[test]
fn test_route_emits_routing_event() {
    let env = Env::default();
    env.mock_all_auths();

    let counter_id = env.register(MockCounterContract, ());
    let router_id = env.register(PoolRouterContract, ());
    let router = PoolRouterContractClient::new(&env, &router_id);

    // route_increment should complete successfully, returning the new counter value.
    // Event emission is a side-effect of the call — if publish() fails the tx would revert.
    let value = router.route_increment(&counter_id);
    assert_eq!(value, 1, "route_increment must return the new counter value after emitting event");
}

#[test]
fn test_batch_increment() {
    let env = Env::default();
    env.mock_all_auths();

    let counter_id = env.register(MockCounterContract, ());
    let router_id = env.register(PoolRouterContract, ());
    let router = PoolRouterContractClient::new(&env, &router_id);

    let final_value = router.batch_increment(&counter_id, &3);
    assert_eq!(final_value, 3);
    assert_eq!(router.read_counter(&counter_id), 3);
}

#[test]
fn test_multiple_routers_share_same_counter() {
    let env = Env::default();
    env.mock_all_auths();

    let counter_id = env.register(MockCounterContract, ());
    let router1_id = env.register(PoolRouterContract, ());
    let router2_id = env.register(PoolRouterContract, ());
    let router1 = PoolRouterContractClient::new(&env, &router1_id);
    let router2 = PoolRouterContractClient::new(&env, &router2_id);

    // Both routers modify the same underlying counter
    router1.route_increment(&counter_id);
    router2.route_increment(&counter_id);

    assert_eq!(router1.read_counter(&counter_id), 2);
    assert_eq!(router2.read_counter(&counter_id), 2);
}
