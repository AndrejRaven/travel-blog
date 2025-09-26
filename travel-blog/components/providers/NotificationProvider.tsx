"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "@/components/ui/Notification";
import Notification from "@/components/ui/Notification";

interface NotificationContextType {
  addNotification: (notification: {
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    duration?: number;
  }) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export default function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const { notifications, addNotification, removeNotification, clearAll } =
    useNotifications();

  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification, clearAll }}
    >
      {children}

      {/* Renderuj wszystkie powiadomienia */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={notification.onClose}
        />
      ))}
    </NotificationContext.Provider>
  );
}
