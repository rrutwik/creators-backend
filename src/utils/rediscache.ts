import { BaseCache, deserializeStoredGeneration, serializeGeneration } from "@langchain/core/caches";
import { Generation } from "@langchain/core/outputs";
import Redis from "ioredis";

class RedisCache extends BaseCache<Generation[]> {
  private client: Redis;
  private ttl?: number;

  constructor(client: Redis, options?: { ttl?: number }) {
    super();
    this.client = client;
    this.ttl = options?.ttl;
  }

  async lookup(prompt: string, llmKey: string): Promise<Generation[] | null> {
    const key = this.keyEncoder(prompt, llmKey);
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }
    const storedGenerations = JSON.parse(value);
    return storedGenerations.map(deserializeStoredGeneration);
  }

  async update(prompt: string, llmKey: string, value: Generation[]): Promise<void> {
    const key = this.keyEncoder(prompt, llmKey);
    const serializedValue = JSON.stringify(value.map(serializeGeneration));
    if (this.ttl !== undefined) {
      await this.client.set(key, serializedValue, "EX", this.ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }
}

export default RedisCache;
