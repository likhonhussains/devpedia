// Regex to match @username mentions
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

export interface ParsedMention {
  username: string;
  startIndex: number;
  endIndex: number;
}

// Extract all mentions from text
export const extractMentions = (text: string): string[] => {
  const matches = text.match(MENTION_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
};

// Parse mentions with positions
export const parseMentions = (text: string): ParsedMention[] => {
  const mentions: ParsedMention[] = [];
  let match;
  
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // Reset regex lastIndex
  MENTION_REGEX.lastIndex = 0;
  
  return mentions;
};

// Get the current mention being typed (for autocomplete)
export const getCurrentMention = (text: string, cursorPosition: number): { query: string; startIndex: number } | null => {
  // Find the @ before cursor
  const textBeforeCursor = text.slice(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  
  if (lastAtIndex === -1) return null;
  
  // Check if there's a space between @ and cursor
  const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
  if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) return null;
  
  // Check if @ is at start or preceded by whitespace
  if (lastAtIndex > 0 && !/\s/.test(text[lastAtIndex - 1])) return null;
  
  return {
    query: textAfterAt,
    startIndex: lastAtIndex
  };
};
