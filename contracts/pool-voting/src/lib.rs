#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // Stores if a user has voted on a pool (true = upvote, false = downvote)
    Vote(Address, Address), // (User, Pool)
    // Stores the aggregate score for a pool: (upvotes, downvotes)
    Score(Address), // (Pool)
    // List of all pools that have been voted on
    PoolList,
}

#[contract]
pub struct PoolVotingContract;

#[contractimpl]
impl PoolVotingContract {
    /// Cast a vote for a specific pool.
    /// `user`: The address of the voter. Must be authenticated.
    /// `pool`: The address of the liquidity pool being voted on.
    /// `is_upvote`: true for Upvote, false for Downvote.
    pub fn vote(env: Env, user: Address, pool: Address, is_upvote: bool) {
        user.require_auth();

        let vote_key = DataKey::Vote(user.clone(), pool.clone());
        let score_key = DataKey::Score(pool.clone());
        let pool_list_key = DataKey::PoolList;

        let mut current_score: (u32, u32) = env.storage().persistent().get(&score_key).unwrap_or((0, 0));
        let previous_vote: Option<bool> = env.storage().persistent().get(&vote_key);

        let is_new_pool = current_score == (0, 0);

        if let Some(prev) = previous_vote {
            if prev == is_upvote {
                // Vote is the same, do nothing
                return;
            }
            // User changed their vote
            if prev {
                current_score.0 -= 1;
                current_score.1 += 1;
            } else {
                current_score.0 += 1;
                current_score.1 -= 1;
            }
        } else {
            // New vote
            if is_upvote {
                current_score.0 += 1;
            } else {
                current_score.1 += 1;
            }
        }

        // Save the new state
        env.storage().persistent().set(&vote_key, &is_upvote);
        env.storage().persistent().set(&score_key, &current_score);
        
        // Add to the master pool list if it's new
        if is_new_pool {
            let mut pools: Vec<Address> = env.storage().persistent().get(&pool_list_key).unwrap_or(Vec::new(&env));
            if !pools.contains(&pool) {
                pools.push_back(pool.clone());
                env.storage().persistent().set(&pool_list_key, &pools);
                env.storage().persistent().extend_ttl(&pool_list_key, 518400, 6307200);
            }
        }
        
        // Extend TTL
        env.storage().persistent().extend_ttl(&vote_key, 518400, 6307200);
        env.storage().persistent().extend_ttl(&score_key, 518400, 6307200);
    }

    /// Retrieve the score of a pool.
    /// Returns a tuple of (upvotes, downvotes).
    pub fn get_score(env: Env, pool: Address) -> (u32, u32) {
        let score_key = DataKey::Score(pool.clone());
        
        // Extend TTL when accessed to keep active pools alive in storage
        if env.storage().persistent().has(&score_key) {
            env.storage().persistent().extend_ttl(&score_key, 518400, 6307200);
            env.storage().persistent().get(&score_key).unwrap_or((0, 0))
        } else {
            (0, 0)
        }
    }

    /// Retrieve scores of all pools.
    /// Returns a Map mapping Pool Address -> (upvotes, downvotes)
    pub fn get_all_scores(env: Env) -> Map<Address, (u32, u32)> {
        let pool_list_key = DataKey::PoolList;
        let pools: Vec<Address> = env.storage().persistent().get(&pool_list_key).unwrap_or(Vec::new(&env));
        
        let mut all_scores: Map<Address, (u32, u32)> = Map::new(&env);
        
        for pool in pools.into_iter() {
            let score_key = DataKey::Score(pool.clone());
            let score: (u32, u32) = env.storage().persistent().get(&score_key).unwrap_or((0, 0));
            all_scores.set(pool, score);
        }
        
        if env.storage().persistent().has(&pool_list_key) {
            env.storage().persistent().extend_ttl(&pool_list_key, 518400, 6307200);
        }
        
        all_scores
    }
}

#[cfg(test)]
mod test;
