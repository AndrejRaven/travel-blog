"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import Button from "./Button";

interface Comment {
  _id: string;
  author: {
    name: string;
    email: string;
    website?: string;
  };
  content: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "spam";
  parentComment?: string;
  post?: {
    _id: string;
    title: string;
  };
  ipAddress?: string;
  userAgent?: string;
}

interface CommentsModerationProps {
  onStatusChange?: (commentId: string, newStatus: Comment["status"]) => void;
  onDelete?: (commentId: string) => void;
}

export default function CommentsModeration({
  onStatusChange,
  onDelete,
}: CommentsModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "spam"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComments, setSelectedComments] = useState<string[]>([]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/comments/admin");

      if (!response.ok) {
        throw new Error("Błąd podczas pobierania komentarzy");
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Błąd podczas pobierania komentarzy:", err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (
    commentId: string,
    newStatus: Comment["status"]
  ) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Błąd podczas aktualizacji statusu");
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? { ...comment, status: newStatus }
            : comment
        )
      );

      onStatusChange?.(commentId, newStatus);
    } catch (err) {
      console.error("Błąd podczas aktualizacji statusu:", err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania komentarza");
      }

      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
      onDelete?.(commentId);
    } catch (err) {
      console.error("Błąd podczas usuwania komentarza:", err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  const bulkUpdateStatus = async (status: Comment["status"]) => {
    try {
      const response = await fetch("/api/comments/bulk-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentIds: selectedComments,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Błąd podczas masowej aktualizacji");
      }

      setComments((prev) =>
        prev.map((comment) =>
          selectedComments.includes(comment._id)
            ? { ...comment, status }
            : comment
        )
      );

      setSelectedComments([]);
    } catch (err) {
      console.error("Błąd podczas masowej aktualizacji:", err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const filteredComments = comments.filter((comment) => {
    const matchesFilter = filter === "all" || comment.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      comment.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.post?.title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: Comment["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "spam":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Comment["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "spam":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Ładowanie komentarzy...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchComments} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek i filtry */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
            Moderacja komentarzy ({filteredComments.length})
          </h2>
        </div>

        <Button onClick={fetchComments} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Odśwież
        </Button>
      </div>

      {/* Filtry i wyszukiwanie */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Wszystkie</option>
            <option value="pending">Oczekujące</option>
            <option value="approved">Zatwierdzone</option>
            <option value="rejected">Odrzucone</option>
            <option value="spam">Spam</option>
          </select>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj komentarzy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Masowe akcje */}
      {selectedComments.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Wybrano {selectedComments.length} komentarzy
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => bulkUpdateStatus("approved")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Zatwierdź
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateStatus("rejected")}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Odrzuć
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateStatus("spam")}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Oznacz jako spam
            </Button>
          </div>
        </div>
      )}

      {/* Lista komentarzy */}
      <div className="space-y-4">
        {filteredComments.length > 0 ? (
          filteredComments.map((comment) => (
            <div
              key={comment._id}
              className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedComments.includes(comment._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedComments((prev) => [...prev, comment._id]);
                      } else {
                        setSelectedComments((prev) =>
                          prev.filter((id) => id !== comment._id)
                        );
                      }
                    }}
                    className="mt-1"
                  />

                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {comment.author.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(comment.status)}`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <p>{comment.author.email}</p>
                      {comment.author.website && (
                        <p>
                          <a
                            href={comment.author.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {comment.author.website}
                          </a>
                        </p>
                      )}
                      <p>{formatDate(comment.createdAt)}</p>
                      {comment.post && (
                        <p>
                          <span className="font-medium">Post:</span>{" "}
                          {comment.post.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCommentStatus(comment._id, "approved")}
                    disabled={comment.status === "approved"}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCommentStatus(comment._id, "rejected")}
                    disabled={comment.status === "rejected"}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteComment(comment._id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                {comment.content}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "Nie znaleziono komentarzy pasujących do wyszukiwania"
                : "Brak komentarzy"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
