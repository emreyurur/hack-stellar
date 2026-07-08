#![no_std]
#![allow(deprecated)] // env.events().publish() is deprecated in SDK v26 but still functional
use soroban_sdk::{contract, contractimpl, log, symbol_short, Env, Symbol};

const COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    /// Increment the counter by 1 and return the new value.
    pub fn increment(env: Env) -> u32 {
        let mut count: u32 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        count += 1;
        log!(&env, "Terminal8 counter: {}", count);
        env.storage().instance().set(&COUNTER, &count);
        env.storage().instance().extend_ttl(50, 100);

        // Emit event for real-time streaming on the frontend
        env.events().publish(
            (symbol_short!("counter"), symbol_short!("incr")),
            count,
        );

        count
    }

    /// Return the current counter value.
    pub fn get(env: Env) -> u32 {
        env.storage().instance().get(&COUNTER).unwrap_or(0)
    }

    /// Reset the counter to zero.
    pub fn reset(env: Env) {
        env.storage().instance().set(&COUNTER, &0u32);
        env.events().publish(
            (symbol_short!("counter"), symbol_short!("reset")),
            0u32,
        );
    }
}

mod test;
