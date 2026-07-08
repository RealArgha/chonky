import { Redis } from "@upstash/redis";

const url =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.REDIS_URL;
const token =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.REDIS_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;
