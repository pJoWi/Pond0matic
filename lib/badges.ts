export const BADGE_EMOJIS: Record<string, string> = {
  pork: "🐽",
  chef: "👨‍🍳",
  points: "✨",
  swap: "🤝",
  diamond: "💎",
  crown: "👑",
  explorer: "🧭",
  guardian: "🛡️",
  puzzle: "🧩",
};

export function getBadgeEmoji(badgeName: string): string {
  const lowerBadge = badgeName.toLowerCase().trim();
  return BADGE_EMOJIS[lowerBadge] || "";
}
