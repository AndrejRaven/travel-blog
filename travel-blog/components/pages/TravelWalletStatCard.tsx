"use client";

interface TravelWalletStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function TravelWalletStatCard({
  label,
  value,
  icon: Icon,
}: TravelWalletStatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 ml-4">
            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}

