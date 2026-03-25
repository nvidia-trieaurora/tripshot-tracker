import { slackEmojiToUnicode } from "./emoji";

export function formatSlackText(
  text: string | null | undefined,
  userMap?: Record<string, string>
): string {
  if (!text) return "";

  let result = text;

  // Convert :emoji_name: to unicode emoji
  result = result.replace(/:([a-zA-Z0-9_+-]+):/g, (_, name) => {
    return slackEmojiToUnicode(name);
  });

  // Convert <@U12345> user mentions to @displayName
  result = result.replace(/<@([A-Z0-9]+)>/g, (_, userId) => {
    const name = userMap?.[userId];
    return name ? `@${name}` : `@${userId}`;
  });

  // Convert <!channel> <!here> <!everyone>
  result = result.replace(/<!channel>/g, "@channel");
  result = result.replace(/<!here>/g, "@here");
  result = result.replace(/<!everyone>/g, "@everyone");

  // Convert <URL|label> to just label
  result = result.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, "$2");

  // Convert <URL> to just URL
  result = result.replace(/<(https?:\/\/[^>]+)>/g, "$1");

  // Convert <#C12345|channel-name> to #channel-name
  result = result.replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1");

  return result.trim();
}
