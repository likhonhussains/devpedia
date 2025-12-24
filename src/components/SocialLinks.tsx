import { motion } from 'framer-motion';
import { Twitter, Github, Linkedin, Globe } from 'lucide-react';

interface SocialLinksProps {
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;
}

const SocialLinks = ({ website, twitter, github, linkedin }: SocialLinksProps) => {
  const links = [
    { 
      icon: Globe, 
      url: website, 
      label: 'Website',
      color: 'hover:text-blue-500 hover:bg-blue-500/10'
    },
    { 
      icon: Twitter, 
      url: twitter ? `https://twitter.com/${twitter.replace('@', '')}` : null, 
      label: 'Twitter',
      color: 'hover:text-sky-500 hover:bg-sky-500/10'
    },
    { 
      icon: Github, 
      url: github ? `https://github.com/${github}` : null, 
      label: 'GitHub',
      color: 'hover:text-gray-900 dark:hover:text-white hover:bg-gray-500/10'
    },
    { 
      icon: Linkedin, 
      url: linkedin ? `https://linkedin.com/in/${linkedin}` : null, 
      label: 'LinkedIn',
      color: 'hover:text-blue-600 hover:bg-blue-600/10'
    },
  ].filter(link => link.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((link, index) => {
        const Icon = link.icon;
        const href = link.url?.startsWith('http') ? link.url : `https://${link.url}`;
        
        return (
          <motion.a
            key={link.label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`p-2 rounded-lg bg-secondary/50 text-muted-foreground transition-all ${link.color}`}
            title={link.label}
          >
            <Icon className="w-5 h-5" />
          </motion.a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
