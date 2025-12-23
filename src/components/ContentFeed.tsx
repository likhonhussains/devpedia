import { motion } from 'framer-motion';
import ContentCard from './ContentCard';

interface ContentFeedProps {
  activeTab: string;
}

const posts = [
  {
    type: 'post' as const,
    title: 'Understanding React Server Components: A Deep Dive',
    author: 'Sarah Chen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'React Server Components represent a fundamental shift in how we think about React applications. They allow us to render components on the server while maintaining the interactivity of client-side React...',
    likes: 234,
    comments: 45,
    timestamp: '2 hours ago',
    tags: ['react', 'nextjs', 'webdev'],
  },
  {
    type: 'post' as const,
    title: 'Why I Switched from Python to Rust for Backend Development',
    author: 'Alex Rivera',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'After 5 years of Python development, I made the switch to Rust. Here are my thoughts on memory safety, performance gains, and the learning curve you can expect...',
    likes: 567,
    comments: 89,
    timestamp: '5 hours ago',
    tags: ['rust', 'python', 'backend'],
  },
];

const notes = [
  {
    type: 'note' as const,
    title: 'Quick Tip: Optimizing Docker Images for Production',
    author: 'Marcus Johnson',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    content: 'Use multi-stage builds and alpine base images. Always specify exact versions for reproducibility. Remove dev dependencies and cache directories to reduce image size significantly.',
    likes: 123,
    comments: 12,
    timestamp: '30 mins ago',
    tags: ['docker', 'devops'],
  },
  {
    type: 'note' as const,
    title: 'TypeScript Utility Types Cheat Sheet',
    author: 'Emma Wilson',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    content: 'Partial<T>, Required<T>, Pick<T, K>, Omit<T, K>, Record<K, T>, ReturnType<T>, Parameters<T> - these are essential for type manipulation in TypeScript.',
    likes: 456,
    comments: 34,
    timestamp: '1 hour ago',
    tags: ['typescript', 'tips'],
  },
];

const videos = [
  {
    type: 'video' as const,
    title: 'Building a Real-time Collaborative Editor with WebSockets',
    author: 'Dev Academy',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevAcademy',
    content: 'Learn how to build a Google Docs-like collaborative editor from scratch using WebSockets, operational transformation, and React.',
    likes: 1234,
    comments: 156,
    timestamp: '3 hours ago',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
    tags: ['websockets', 'tutorial'],
  },
  {
    type: 'video' as const,
    title: 'Kubernetes Explained in 15 Minutes',
    author: 'Cloud Native',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CloudNative',
    content: 'A quick overview of Kubernetes concepts including pods, deployments, services, and how to get started with container orchestration.',
    likes: 890,
    comments: 78,
    timestamp: '6 hours ago',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80',
    tags: ['kubernetes', 'cloud'],
  },
];

const ContentFeed = ({ activeTab }: ContentFeedProps) => {
  const getContent = () => {
    switch (activeTab) {
      case 'notes':
        return notes;
      case 'videos':
        return videos;
      default:
        return posts;
    }
  };

  const content = getContent();

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-8 max-w-4xl mx-auto grid gap-6 md:grid-cols-2"
    >
      {content.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <ContentCard {...item} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ContentFeed;
