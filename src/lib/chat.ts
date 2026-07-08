export const CHAT_NAMES = ["Dad", "Mom"] as const;
export type ChatName = (typeof CHAT_NAMES)[number];

export function otherChatName(name: string): ChatName | null {
  const other = CHAT_NAMES.find((n) => n !== name);
  return CHAT_NAMES.includes(name as ChatName) && other ? other : null;
}
