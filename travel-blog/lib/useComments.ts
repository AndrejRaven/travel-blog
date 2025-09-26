"use client";

import { useState, useEffect, useCallback } from 'react';
import { useNotificationContext } from '@/components/providers/NotificationProvider';

export interface Comment {
  _id: string;
  author: {
    name: string;
    email: string;
  };
  content: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parentComment?: string | { _ref: string };
  post?: {
    _id: string;
    title: string;
  };
}

export interface NewComment {
  author: {
    name: string;
    email: string;
  };
  content: string;
}

export interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (comment: NewComment) => Promise<void>;
  replyToComment: (parentId: string, comment: NewComment) => Promise<void>;
  refreshComments: () => Promise<void>;
}

export function useComments(postId: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotificationContext();

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/comments?postId=${postId}&status=approved`);
      
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania komentarzy');
      }
      
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Błąd podczas pobierania komentarzy:', err);
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = useCallback(async (comment: NewComment) => {
    try {
      setError(null);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...comment,
          postId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas dodawania komentarza');
      }
      
      const data = await response.json();
      
      // Jeśli komentarz nie wymaga moderacji, dodaj go do listy
      if (data.comment.status === 'approved') {
        setComments(prev => [...prev, data.comment]);
      }
      
      // Pokaż komunikat o sukcesie
      addNotification({
        type: 'success',
        title: 'Komentarz dodany!',
        message: data.message
      });
      
    } catch (err) {
      console.error('Błąd podczas dodawania komentarza:', err);
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      
      addNotification({
        type: 'error',
        title: 'Błąd!',
        message: err instanceof Error ? err.message : 'Nie udało się dodać komentarza.'
      });
      
      throw err;
    }
  }, [postId, addNotification]);

  const replyToComment = useCallback(async (parentId: string, comment: NewComment) => {
    try {
      setError(null);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...comment,
          postId,
          parentComment: parentId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas dodawania odpowiedzi');
      }
      
      const data = await response.json();
      
      // Jeśli odpowiedź nie wymaga moderacji, dodaj ją do listy
      if (data.comment.status === 'approved') {
        setComments(prev => [...prev, data.comment]);
      }
      
      // Pokaż komunikat o sukcesie
      addNotification({
        type: 'success',
        title: 'Odpowiedź dodana!',
        message: data.message
      });
      
    } catch (err) {
      console.error('Błąd podczas dodawania odpowiedzi:', err);
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      
      addNotification({
        type: 'error',
        title: 'Błąd!',
        message: err instanceof Error ? err.message : 'Nie udało się dodać odpowiedzi.'
      });
      
      throw err;
    }
  }, [postId, addNotification]);

  const refreshComments = useCallback(async () => {
    await fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    replyToComment,
    refreshComments,
  };
}
