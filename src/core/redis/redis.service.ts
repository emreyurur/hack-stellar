import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<string>(key);
    if (!value) return undefined;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.cacheManager.set(key, JSON.stringify(value), ttlSeconds * 1000); // cache-manager ms bekler
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
