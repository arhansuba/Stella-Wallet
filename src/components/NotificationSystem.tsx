import { useState } from "react";
import { Loader } from "@stellar/design-system";

export interface NotificationProps {
  id?: number;
  message: string;
  type: "success" | "info" | "error";
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
    const id = Date.now();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.duration || 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification,
  };
};

export const NotificationContainer = ({ notifications }: { notifications: any[] }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border max-w-sm ${
            notification.type === "success"
              ? "bg-green-900/90 border-green-500/50 text-green-100"
              : notification.type === "error"
              ? "bg-red-900/90 border-red-500/50 text-red-100"
              : "bg-blue-900/90 border-blue-500/50 text-blue-100"
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "info" && <Loader size="sm" />}
            <div className="text-sm font-medium">{notification.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
};