"use client";

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function SkeletonLoader({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = "md",
}: SkeletonLoaderProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SkeletonLoader width="60%" height="0.75rem" className="mb-2" />
          <SkeletonLoader width="80%" height="2rem" className="mb-2" />
          <SkeletonLoader width="50%" height="1rem" />
        </div>
        <SkeletonLoader width="3rem" height="3rem" rounded="lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <SkeletonLoader width="40%" height="1.5rem" className="mb-4" />
      <div className="space-y-3">
        <SkeletonLoader height="0.5rem" />
        <SkeletonLoader height="0.5rem" width="75%" />
        <SkeletonLoader height="0.5rem" width="60%" />
        <SkeletonLoader height="0.5rem" width="85%" />
        <SkeletonLoader height="0.5rem" width="50%" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <SkeletonLoader width="30%" height="1.5rem" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <SkeletonLoader width="60%" height="1rem" />
              <SkeletonLoader width="40%" height="0.75rem" />
            </div>
            <SkeletonLoader width="5rem" height="1.5rem" />
          </div>
        ))}
      </div>
    </div>
  );
}
