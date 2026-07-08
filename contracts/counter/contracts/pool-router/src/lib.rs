#![no_std]
#![allow(deprecated)] // env.events().publish() is deprecated in SDK v26 but still functional
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

/// PoolRouter demonstrates inter-contract communication by delegating
/// counter operations to an external CounterContract on Soroban.
#[contract]
pub struct PoolRouterContract;

#[contractimpl]
impl PoolRouterContract {
    /// Route an increment call to the target counter contract.
    /// Emits a "route/incr" event with the returned counter value.
    pub fn route_increment(env: Env, counter_id: Address) -> u32 {
        let value: u32 = env.invoke_contract(
            &counter_id,
            &Symbol::new(&env, "increment"),
            soroban_sdk::vec![&env],
        );

        // Emit routing event so callers can observe cross-contract activity
        env.events().publish(
            (symbol_short!("route"), symbol_short!("incr")),
            value,
        );

        value
    }

    /// Read the counter value from an external contract without writing state.
    pub fn read_counter(env: Env, counter_id: Address) -> u32 {
        env.invoke_contract(
            &counter_id,
            &Symbol::new(&env, "get"),
            soroban_sdk::vec![&env],
        )
    }

    /// Batch: call increment N times on the target contract and return the final value.
    pub fn batch_increment(env: Env, counter_id: Address, times: u32) -> u32 {
        let mut last: u32 = 0;
        for _ in 0..times {
            last = env.invoke_contract(
                &counter_id,
                &Symbol::new(&env, "increment"),
                soroban_sdk::vec![&env],
            );
        }
        env.events().publish(
            (symbol_short!("route"), symbol_short!("batch")),
            last,
        );
        last
    }
}

mod test;
