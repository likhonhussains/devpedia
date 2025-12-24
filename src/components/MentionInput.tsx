import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentMention } from '@/utils/mentions';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  minHeight?: string;
  id?: string;
}

interface UserSuggestion {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const MentionInput = ({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  minHeight = '80px',
  id
}: MentionInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch users for autocomplete
  const { data: suggestions = [] } = useQuery({
    queryKey: ['mention-users', mentionQuery],
    queryFn: async () => {
      if (!mentionQuery || mentionQuery.length < 1) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .ilike('username', `${mentionQuery}%`)
        .limit(5);
      
      if (error) {
        console.error('Error fetching users for mentions:', error);
        return [];
      }
      
      return data as UserSuggestion[];
    },
    enabled: !!mentionQuery && mentionQuery.length >= 1,
  });

  // Handle text changes and detect mentions
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const cursorPos = e.target.selectionStart;
    const mention = getCurrentMention(newValue, cursorPos);
    
    if (mention) {
      setMentionQuery(mention.query);
      setMentionStartIndex(mention.startIndex);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setMentionQuery(null);
      setShowSuggestions(false);
    }
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Tab':
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          selectUser(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  // Select a user from suggestions
  const selectUser = useCallback((user: UserSuggestion) => {
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(textareaRef.current?.selectionStart || mentionStartIndex);
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery(null);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + user.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, mentionStartIndex, onChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('resize-none', className)}
        style={{ minHeight }}
        maxLength={maxLength}
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-w-xs bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.user_id}
              type="button"
              onClick={() => selectUser(user)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
              )}
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`}
                alt={user.display_name}
                className="w-8 h-8 rounded-full border border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
