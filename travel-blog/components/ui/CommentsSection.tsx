"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Reply,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Button from "./Button";
import { useAnimation, ANIMATION_PRESETS } from "@/lib/useAnimation";

interface Comment {
  _id: string;
  author: {
    name: string;
    email: string;
  };
  content: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "spam";
  parentComment?: string | { _ref: string };
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (
    comment: Omit<Comment, "_id" | "createdAt" | "status">
  ) => Promise<void>;
  onReply: (
    parentId: string,
    comment: Omit<Comment, "_id" | "createdAt" | "status" | "parentComment">
  ) => Promise<void>;
  isModerated?: boolean;
  allowReplies?: boolean;
  maxLength?: number;
}

export default function CommentsSection({
  comments,
  onAddComment,
  onReply,
  isModerated = true,
  allowReplies = true,
  maxLength = 1000,
}: CommentsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });

  const sectionAnimation = useAnimation();

  // Funkcje walidacji
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "Email jest wymagany";
    }
    if (!emailRegex.test(email)) {
      return "Podaj prawidłowy adres email";
    }
    return "";
  };

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Imię i nazwisko jest wymagane";
    }
    if (name.trim().length < 2) {
      return "Imię i nazwisko musi mieć co najmniej 2 znaki";
    }
    if (name.trim().length > 50) {
      return "Imię i nazwisko nie może mieć więcej niż 50 znaków";
    }
    if (!/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/.test(name.trim())) {
      return "Imię i nazwisko może zawierać tylko litery, spacje i myślniki";
    }
    return "";
  };

  const validateContent = (content: string): string => {
    if (!content.trim()) {
      return "Treść komentarza jest wymagana";
    }
    if (content.trim().length < 10) {
      return "Komentarz musi mieć co najmniej 10 znaków";
    }
    if (content.trim().length > maxLength) {
      return `Komentarz nie może mieć więcej niż ${maxLength} znaków`;
    }
    return "";
  };

  const validateForm = (): boolean => {
    const errors = {
      authorName: validateName(formData.authorName),
      authorEmail: validateEmail(formData.authorEmail),
      content: validateContent(formData.content),
    };

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  // Grupuj komentarze na główne i odpowiedzi
  const mainComments = comments.filter((comment) => !comment.parentComment);
  const repliesMap = comments
    .filter((comment) => comment.parentComment)
    .reduce(
      (acc, reply) => {
        // Sprawdź czy parentComment to string (stara struktura) czy obiekt z _ref (nowa struktura)
        const parentId =
          typeof reply.parentComment === "string"
            ? reply.parentComment
            : reply.parentComment?._ref;

        if (parentId) {
          if (!acc[parentId]) {
            acc[parentId] = [];
          }
          acc[parentId].push(reply);
        }
        return acc;
      },
      {} as Record<string, Comment[]>
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (replyingTo) {
        await onReply(replyingTo, {
          author: {
            name: formData.authorName.trim(),
            email: formData.authorEmail.trim(),
          },
          content: formData.content.trim(),
        });
      } else {
        await onAddComment({
          author: {
            name: formData.authorName.trim(),
            email: formData.authorEmail.trim(),
          },
          content: formData.content.trim(),
        });
      }

      setFormData({
        authorName: "",
        authorEmail: "",
        content: "",
      });
      setValidationErrors({
        authorName: "",
        authorEmail: "",
        content: "",
      });
      setShowAddForm(false);
      setReplyingTo(null);
    } catch {
      // Error handling - could be improved with proper error state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setShowAddForm(true);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Walidacja w czasie rzeczywistym
    if (field === "authorName") {
      setValidationErrors((prev) => ({
        ...prev,
        authorName: validateName(value),
      }));
    } else if (field === "authorEmail") {
      setValidationErrors((prev) => ({
        ...prev,
        authorEmail: validateEmail(value),
      }));
    } else if (field === "content") {
      setValidationErrors((prev) => ({
        ...prev,
        content: validateContent(value),
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

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

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment._id}
      className={`${isReply ? "ml-8 mt-4" : "mb-6"} p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {comment.author.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {comment.author.name}
              </h4>
              {getStatusIcon(comment.status)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allowReplies && !isReply && (
            <Button
              variant="outline"
              onClick={() => handleReply(comment._id)}
              className="text-xs px-3 py-1"
            >
              <Reply className="w-3 h-3 mr-1" />
              Odpowiedz
            </Button>
          )}
        </div>
      </div>

      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {comment.content}
      </div>

      {/* Wyświetl odpowiedzi */}
      {repliesMap[comment._id] && repliesMap[comment._id].length > 0 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Odpowiedzi ({repliesMap[comment._id].length}):
          </p>
          {repliesMap[comment._id].map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={sectionAnimation.containerRef}
      className={`py-12 ${ANIMATION_PRESETS.sectionHeader(
        sectionAnimation.isLoaded && sectionAnimation.isInView
      )}`}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Nagłówek sekcji */}
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
            Komentarze ({mainComments.length})
          </h2>
        </div>

        {/* Formularz dodawania komentarza */}
        {showAddForm && (
          <div className="mb-8 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-all duration-300 ease-out animate-fade-in">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {replyingTo ? "Odpowiedz na komentarz" : "Dodaj komentarz"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Imię i nazwisko *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorName}
                    onChange={(e) =>
                      handleInputChange("authorName", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.authorName
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Twoje imię i nazwisko"
                  />
                  {validationErrors.authorName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.authorName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.authorEmail}
                    onChange={(e) =>
                      handleInputChange("authorEmail", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.authorEmail
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="twoj@email.com"
                  />
                  {validationErrors.authorEmail && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.authorEmail}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Komentarz *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={maxLength}
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    validationErrors.content
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Napisz swój komentarz..."
                />
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {validationErrors.content && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {validationErrors.content}
                      </p>
                    )}
                  </div>
                  <div
                    className={`text-sm ${
                      formData.content.length > maxLength * 0.9
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formData.content.length}/{maxLength}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.authorName.trim() ||
                    !formData.authorEmail.trim() ||
                    !formData.content.trim() ||
                    Object.values(validationErrors).some(
                      (error) => error !== ""
                    )
                  }
                  className="inline-flex items-center justify-center rounded-md px-8 py-2 text-sm font-sans font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:text-gray-900 dark:hover:text-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400 relative overflow-hidden group before:absolute before:inset-0 before:bg-white dark:before:bg-gray-900 before:-translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 before:-z-10 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out uppercase border border-gray-900 dark:border-gray-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Dodawanie...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {replyingTo ? "Dodaj odpowiedź" : "Dodaj komentarz"}
                    </>
                  )}
                </button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setReplyingTo(null);
                    setFormData({
                      authorName: "",
                      authorEmail: "",
                      content: "",
                    });
                    setValidationErrors({
                      authorName: "",
                      authorEmail: "",
                      content: "",
                    });
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Przycisk dodawania komentarza */}
        {!showAddForm && (
          <div className="mb-8">
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Dodaj komentarz
            </Button>
          </div>
        )}

        {/* Lista komentarzy */}
        {mainComments.length > 0 ? (
          <div className="space-y-6">
            {mainComments.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {isModerated
                ? "Brak komentarzy. Bądź pierwszy!"
                : "Brak komentarzy."}
            </p>
          </div>
        )}

        {/* Informacja o moderacji */}
        {isModerated && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Moderacja komentarzy
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Komentarze są moderowane przed publikacją. Twój komentarz
                  pojawi się po zatwierdzeniu przez administratora.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
