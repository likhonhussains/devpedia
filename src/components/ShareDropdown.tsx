import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ShareDropdownProps {
  title: string;
  url?: string;
}

const ShareDropdown = ({ title, url }: ShareDropdownProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
          <Facebook className="w-4 h-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')} className="cursor-pointer">
          <Linkedin className="w-4 h-4 mr-2" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Link2 className="w-4 h-4 mr-2" />
          )}
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareDropdown;