"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "@/components/ui/Link";
import { AdminStats } from "@/lib/admin-stats";
import { getPostUrl } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/stats");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Błąd pobierania statystyk");
        }

        setStats(data.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err instanceof Error ? err.message : "Błąd pobierania danych");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          Ładowanie statystyk...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400 font-medium">
          Błąd: {error}
        </p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Statystyki komentarzy */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Komentarze
          </h2>
          <Link
            href="/admin/komentarze"
            variant="arrow"
            className="text-sm sm:text-base whitespace-nowrap"
          >
            Zarządzaj komentarzami
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Oczekujące"
            value={stats.comments.pending}
            color="yellow"
          />
          <StatCard
            icon={CheckCircle}
            label="Zatwierdzone"
            value={stats.comments.approved}
            color="green"
          />
          <StatCard
            icon={XCircle}
            label="Odrzucone"
            value={stats.comments.rejected}
            color="red"
          />
          <StatCard
            icon={AlertTriangle}
            label="Spam"
            value={stats.comments.spam}
            color="red"
          />
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Łącznie komentarzy:{" "}
          <span className="font-semibold">{stats.comments.total}</span>
        </div>
      </div>

      {/* Statystyki newslettera */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Newsletter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={Mail}
            label="Wszyscy subskrybenci"
            value={stats.newsletter.total}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Aktywni subskrybenci"
            value={stats.newsletter.active}
            color="green"
          />
        </div>
        {stats.newsletter.error && (
          <div className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
            {stats.newsletter.error}
          </div>
        )}
      </div>

      {/* Statystyki postów */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Posty
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Łączna liczba postów
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.posts.total}
                </p>
              </div>
            </div>
          </div>

          {stats.posts.recent.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Najnowsze posty
              </h3>
              <div className="space-y-2">
                {stats.posts.recent.map((post) => {
                  const postUrl = getPostUrl(post);
                  return (
                    <div
                      key={post._id}
                      className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={postUrl !== "#" ? postUrl : "#"}
                          variant="underline"
                          className="text-gray-900 dark:text-gray-100 break-words"
                        >
                          {post.title}
                        </Link>
                        {post.publishedAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(post.publishedAt).toLocaleDateString(
                              "pl-PL",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.posts.error && (
            <div className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
              {stats.posts.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorStyles = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400",
  };

  const iconBgStyles = {
    blue: "bg-blue-100 dark:bg-blue-900",
    green: "bg-green-100 dark:bg-green-900",
    yellow: "bg-yellow-100 dark:bg-yellow-900",
    red: "bg-red-100 dark:bg-red-900",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorStyles[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgStyles[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
