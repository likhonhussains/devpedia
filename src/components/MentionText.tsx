import { Link } from 'react-router-dom';
import { parseMentions } from '@/utils/mentions';

interface MentionTextProps {
  text: string;
  className?: string;
}

const MentionText = ({ text, className }: MentionTextProps) => {
  const mentions = parseMentions(text);
  
  if (mentions.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  mentions.forEach((mention, index) => {
    // Add text before this mention
    if (mention.startIndex > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, mention.startIndex)}
        </span>
      );
    }

    // Add the mention as a link
    parts.push(
      <Link
        key={`mention-${index}`}
        to={`/profile/${mention.username}`}
        className="text-primary hover:underline font-medium"
      >
        @{mention.username}
      </Link>
    );

    lastIndex = mention.endIndex;
  });

  // Add any remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
};

export default MentionText;
