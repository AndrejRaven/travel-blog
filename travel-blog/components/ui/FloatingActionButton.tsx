"use client";

import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function FloatingActionButton({
  onClick,
  label = "Dodaj",
  className = "",
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 bg-blue-600 dark:bg-blue-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 md:hidden ${className}`}
      aria-label={label}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
