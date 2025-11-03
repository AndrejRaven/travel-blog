"use client";

import { useNavigationProgress } from "@/components/providers/NavigationProgressProvider";

export default function TopLoadingBar() {
  const { isNavigating } = useNavigationProgress();

  // Debug - zawsze pokazuj pasek gdy isNavigating jest true
  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-gray-200 dark:bg-gray-700">
      <div className="h-full bg-blue-500 dark:bg-blue-400 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{
            animation: "loading-shimmer 1.5s linear infinite",
            width: "30%",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes loading-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
