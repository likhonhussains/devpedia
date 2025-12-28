import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Award, Users, Check, CheckCheck, Trash2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Helmet } from 'react-helmet-async';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const iconMap = {
    like: { icon: Heart, color: 'text-red-500 bg-red-500/10' },
    comment: { icon: MessageCircle, color: 'text-blue-500 bg-blue-500/10' },
    follow: { icon: UserPlus, color: 'text-green-500 bg-green-500/10' },
    message: { icon: MessageCircle, color: 'text-purple-500 bg-purple-500/10' },
    mention: { icon: AtSign, color: 'text-orange-500 bg-orange-500/10' },
    badge: { icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
    group_post: { icon: Users, color: 'text-cyan-500 bg-cyan-500/10' },
  };

  const config = iconMap[type] || { icon: Bell, color: 'text-muted-foreground bg-muted' };
  const Icon = config.icon;

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
};

const getNotificationMessage = (notification: Notification) => {
  const actorName = notification.actor?.display_name || 'Someone';
  
  switch (notification.type) {
    case 'like':
      return (
        <span>
          <strong>{actorName}</strong> liked your post{' '}
          {notification.post && <em>"{notification.post.title}"</em>}
        </span>
      );
    case 'comment':
      return (
        <span>
          <strong>{actorName}</strong> commented on{' '}
          {notification.post && <em>"{notification.post.title}"</em>}
        </span>
      );
    case 'follow':
      return (
        <span>
          <strong>{actorName}</strong> started following you
        </span>
      );
    case 'message':
      return (
        <span>
          <strong>{actorName}</strong> sent you a message
        </span>
      );
    case 'mention':
      return (
        <span>
          <strong>{actorName}</strong> mentioned you in{' '}
          {notification.post && <em>"{notification.post.title}"</em>}
        </span>
      );
    case 'badge':
      return (
        <span>
          You earned a new badge: <strong>{notification.latestBadge?.name || 'Achievement'}</strong>
        </span>
      );
    case 'group_post':
      return (
        <span>
          <strong>{actorName}</strong> posted in your group
        </span>
      );
    default:
      return <span>New notification</span>;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read_at) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'follow' && notification.actor) {
      navigate(`/profile/${notification.actor.username}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    } else if (notification.type === 'badge') {
      navigate('/achievements');
    } else if (notification.post_id) {
      // Get post slug if available, otherwise navigate by ID
      navigate(`/article/${notification.post_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
      className={`group flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer ${
        notification.read_at
          ? 'bg-card/50 hover:bg-card'
          : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
      }`}
      onClick={handleClick}
    >
      {/* Actor Avatar */}
      {notification.actor ? (
        <img
          src={notification.actor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.actor_id}`}
          alt={notification.actor.display_name}
          className="w-12 h-12 rounded-[10px] ring-2 ring-border/50"
        />
      ) : (
        <NotificationIcon type={notification.type} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm leading-relaxed">{getNotificationMessage(notification)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read_at && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    canRequestPermission,
    requestPermission,
    notificationPermission,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read_at)
    : notifications;

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Notifications | Basic Comet</title>
        <meta name="description" content="View your notifications on Basic Comet" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bell className="w-6 h-6 text-primary" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
          </motion.div>

          {/* Browser Notification Permission */}
          {canRequestPermission && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Enable push notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone interacts with your content
                  </p>
                </div>
                <Button size="sm" onClick={requestPermission}>
                  Enable
                </Button>
              </div>
            </motion.div>
          )}

          {notificationPermission === 'denied' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
            >
              <p className="text-sm text-muted-foreground">
                Push notifications are blocked. Enable them in your browser settings to receive notifications.
              </p>
            </motion.div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="gap-1"
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-card rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-muted rounded-[10px]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {filter === 'unread'
                  ? "You've read all your notifications"
                  : "When someone interacts with your content, you'll see it here"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Notifications;