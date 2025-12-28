import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code, Key, Zap, BookOpen, Terminal, Lock } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';

const Api = () => {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/posts',
      description: 'Retrieve a list of all public posts',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/v1/posts/:id',
      description: 'Retrieve a specific post by ID',
      auth: false,
    },
    {
      method: 'POST',
      path: '/api/v1/posts',
      description: 'Create a new post',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/v1/users/:username',
      description: 'Retrieve user profile information',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/v1/users/:id/posts',
      description: "Retrieve a user's posts",
      auth: false,
    },
    {
      method: 'POST',
      path: '/api/v1/posts/:id/like',
      description: 'Like a post',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/v1/posts/:id/comments',
      description: 'Add a comment to a post',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/v1/groups',
      description: 'Retrieve a list of public groups',
      auth: false,
    },
  ];

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-background to-background pointer-events-none" />
      
      <Header />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section */}
            <div className="glass-card rounded-2xl p-8 md:p-12 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">API Documentation</h1>
                  <p className="text-muted-foreground text-sm">Build with Basic Comet</p>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                The Basic Comet API allows you to integrate our platform into your applications. Access posts, users, groups, and more through our RESTful API.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="gap-2">
                  <Key className="w-4 h-4" />
                  Get API Key
                </Button>
                <Button variant="outline" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Full Documentation
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-6"
              >
                <Zap className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fast & Reliable</h3>
                <p className="text-muted-foreground text-sm">
                  Built on modern infrastructure with 99.9% uptime guarantee and low latency responses.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-xl p-6"
              >
                <Lock className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Secure</h3>
                <p className="text-muted-foreground text-sm">
                  OAuth 2.0 authentication, rate limiting, and encrypted data transmission.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-xl p-6"
              >
                <Terminal className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
                <p className="text-muted-foreground text-sm">
                  Simple RESTful endpoints with comprehensive documentation and SDKs.
                </p>
              </motion.div>
            </div>

            {/* Base URL */}
            <div className="glass-card rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Base URL</h2>
              <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm">
                https://api.basiccomet.com/v1
              </div>
            </div>

            {/* Authentication */}
            <div className="glass-card rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-4">
                Authenticate your requests by including your API key in the Authorization header:
              </p>
              <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </div>
            </div>

            {/* Endpoints */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Endpoints</h2>
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex flex-wrap items-center gap-4 p-4 bg-secondary/30 rounded-lg"
                  >
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                      endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm flex-1">{endpoint.path}</code>
                    {endpoint.auth && (
                      <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                        Auth Required
                      </span>
                    )}
                    <p className="w-full text-muted-foreground text-sm mt-2">{endpoint.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="glass-card rounded-xl p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">Rate Limiting</h2>
              <p className="text-muted-foreground mb-4">
                API requests are limited to ensure fair usage:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Free tier:</strong> 100 requests per hour</li>
                <li><strong>Basic tier:</strong> 1,000 requests per hour</li>
                <li><strong>Pro tier:</strong> 10,000 requests per hour</li>
                <li><strong>Enterprise:</strong> Custom limits available</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Api;
