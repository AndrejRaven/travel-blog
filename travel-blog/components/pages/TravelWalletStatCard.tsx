"use client";

import { ArrowRight } from "lucide-react";

interface TravelWalletStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export default function TravelWalletStatCard({
  label,
  value,
  icon: Icon,
  onClick,
}: TravelWalletStatCardProps) {
  // Check if value contains "/" (like "29600/30000") - use smaller font for compact display
  const valueStr = String(value);
  const isCompact = valueStr.includes("/");
  
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-fade-in-up ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
      style={{ animationDelay: "0.1s" }}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between flex-1">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
              {label}
            </p>
            <p className={isCompact ? "text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100" : "text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100"}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:rotate-3 transition-transform duration-300" />
            </div>
          )}
        </div>
        {onClick && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              <span>Zobacz wszystko</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

