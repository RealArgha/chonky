import webpush from "web-push";
import { redis } from "@/lib/redis";

type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:arghadipsom@gmail.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

const subsKey = (name: string) => `chonky:push:subs:${name}`;

export async function saveSubscription(name: string, subscription: PushSubscriptionJSON) {
  if (!redis || !subscription?.endpoint) return;
  await redis.hset(subsKey(name), { [subscription.endpoint]: subscription });
}

export async function notify(name: string, payload: { title: string; body: string }) {
  const client = redis;
  if (!client || !publicKey || !privateKey) return;

  const subs = await client.hgetall<Record<string, PushSubscriptionJSON>>(subsKey(name));
  if (!subs) return;

  await Promise.all(
    Object.entries(subs).map(async ([endpoint, sub]) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await client.hdel(subsKey(name), endpoint);
        }
      }
    })
  );
}
