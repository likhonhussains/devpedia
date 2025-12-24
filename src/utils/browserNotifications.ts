// Browser Notifications utility

export const isBrowserNotificationSupported = () => {
  return 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export const showBrowserNotification = ({ title, body, icon, tag, onClick }: NotificationOptions) => {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    tag, // Prevents duplicate notifications with same tag
    badge: '/favicon.ico',
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  // Auto close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  return notification;
};

export const formatNotificationContent = (
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'badge',
  actorName: string,
  postTitle?: string,
  badgeName?: string
): { title: string; body: string } => {
  switch (type) {
    case 'like':
      return {
        title: 'New Like',
        body: `${actorName} liked your post${postTitle ? `: "${postTitle.slice(0, 40)}..."` : ''}`,
      };
    case 'comment':
      return {
        title: 'New Comment',
        body: `${actorName} commented on your post${postTitle ? `: "${postTitle.slice(0, 40)}..."` : ''}`,
      };
    case 'follow':
      return {
        title: 'New Follower',
        body: `${actorName} started following you`,
      };
    case 'message':
      return {
        title: 'New Message',
        body: `${actorName} sent you a message`,
      };
    case 'mention':
      return {
        title: 'You were mentioned',
        body: `${actorName} mentioned you${postTitle ? ` in "${postTitle.slice(0, 40)}..."` : ''}`,
      };
    case 'badge':
      return {
        title: '🏆 Achievement Unlocked!',
        body: badgeName ? `You earned the "${badgeName}" badge!` : 'You earned a new badge!',
      };
    default:
      return {
        title: 'Notification',
        body: 'You have a new notification',
      };
  }
};
