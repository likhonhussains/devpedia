import { useState } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Mail, Check, Trash2, BellRing, AtSign, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'like':
      return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'follow':
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case 'message':
      return <Mail className="w-4 h-4 text-purple-500" />;
    case 'mention':
      return <AtSign className="w-4 h-4 text-orange-500" />;
    case 'badge':
      return <Award className="w-4 h-4 text-yellow-500" />;
    case 'group_post':
      return <Users className="w-4 h-4 text-cyan-500" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationText = (notification: Notification) => {
  const actorName = notification.actor?.display_name || 'Someone';
  const postTitle = notification.post?.title;

  switch (notification.type) {
    case 'like':
      return `${actorName} liked your post${postTitle ? `: "${postTitle.slice(0, 30)}${postTitle.length > 30 ? '...' : ''}"` : ''}`;
    case 'comment':
      return `${actorName} commented on your post${postTitle ? `: "${postTitle.slice(0, 30)}${postTitle.length > 30 ? '...' : ''}"` : ''}`;
    case 'follow':
      return `${actorName} started following you`;
    case 'message':
      return `${actorName} sent you a message`;
    case 'mention':
      return `${actorName} mentioned you${postTitle ? ` in "${postTitle.slice(0, 30)}${postTitle.length > 30 ? '...' : ''}"` : ''}`;
    case 'badge':
      const badgeName = notification.latestBadge?.name || 'a badge';
      return `You earned the "${badgeName}" badge!`;
    case 'group_post':
      return `${actorName} posted in a group you're a member of`;
    default:
      return 'New notification';
  }
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notificationPermission,
    canRequestPermission,
    requestPermission,
  } = useNotifications();

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast({
        title: "Notifications enabled",
        description: "You'll receive browser notifications for new activity.",
      });
    } else if (result === 'denied') {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'follow' && notification.actor?.username) {
      navigate(`/profile/${notification.actor.username}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    } else if (notification.type === 'badge') {
      navigate('/leaderboard');
    } else if (notification.type === 'group_post') {
      navigate('/groups');
    } else if (notification.post_id) {
      // Navigate to the article
      navigate(`/article/${notification.post_id}`);
    }

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllAsRead()}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {canRequestPermission && (
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={handleEnableNotifications}
            >
              <BellRing className="w-3 h-3" />
              Enable push notifications
            </Button>
          </div>
        )}

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors group",
                    !notification.read_at && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <img
                    src={notification.actor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.actor_id}`}
                    alt=""
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <NotificationIcon type={notification.type} />
                      <p className="text-sm line-clamp-2">
                        {getNotificationText(notification)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
