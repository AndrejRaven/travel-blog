"use client";

import React, { useEffect, useState } from "react";
import { X, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "rate-limit";

export type ToastProps = {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = no auto-hide
  onClose?: () => void;
  className?: string;
};

const toastConfig = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-800 dark:text-green-200",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-800 dark:text-red-200",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-800 dark:text-yellow-200",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-800 dark:text-blue-200",
  },
  "rate-limit": {
    icon: Clock,
    iconColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-800 dark:text-orange-200",
  },
};

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className = "",
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-20 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          flex items-start p-4 rounded-lg border shadow-xl backdrop-blur-sm
          ${config.bgColor} ${config.borderColor}
          bg-opacity-95 dark:bg-opacity-95
        `}
      >
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>{title}</h3>
          {message && (
            <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
              {message}
            </p>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className={`
              inline-flex rounded-md p-1.5 transition-colors
              ${config.textColor} hover:bg-black hover:bg-opacity-5 dark:hover:bg-white dark:hover:bg-opacity-10
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            `}
            aria-label="Zamknij powiadomienie"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Container for managing multiple toasts
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Expose addToast globally for easy access
  useEffect(() => {
    (window as any).addToast = addToast;
    return () => {
      delete (window as any).addToast;
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => toast.id && removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook for easy toast usage
export function useToast() {
  const addToast = (toast: Omit<ToastProps, "id">) => {
    if (typeof window !== "undefined" && (window as any).addToast) {
      return (window as any).addToast(toast);
    }
  };

  return { addToast };
}
