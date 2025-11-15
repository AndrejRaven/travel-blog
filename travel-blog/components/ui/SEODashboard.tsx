"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Code,
  Map,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface IndexNowStatus {
  status: string;
  config: {
    apiKey: string;
    apiKeyValue: string;
    siteUrl: string;
    keyFileUrl: string;
  };
  keyFile: {
    available: boolean;
    url: string;
    status?: number;
    error?: string;
    note?: string;
    keyMatches?: boolean;
  };
  testResult?: {
    success: boolean;
    message: string;
    statusCode?: number;
  };
}

interface SEOAnalysisResult {
  url: string;
  success: boolean;
  error?: string;
  metaTags?: {
    title?: string;
    description?: string;
    og?: {
      title?: string;
      description?: string;
      image?: string;
      type?: string;
      url?: string;
    };
    twitter?: {
      card?: string;
      title?: string;
      description?: string;
      image?: string;
    };
    robots?: string;
    canonical?: string;
  };
  structuredData?: {
    found: boolean;
    types: string[];
    count: number;
    schemas: Array<{
      type: string;
      content: object;
    }>;
  };
  sitemap?: {
    available: boolean;
    url: string;
    urlCount?: number;
    lastModified?: string;
    error?: string;
  };
}

interface SubmitAllResult {
  success: boolean;
  message: string;
  totalPosts?: number;
  totalUrls?: number;
  batches?: Array<{
    batch: number;
    totalBatches: number;
    urlsInBatch: number;
    success: boolean;
    message: string;
    statusCode?: number;
  }>;
  summary?: {
    successfulBatches: number;
    failedBatches: number;
    totalBatches: number;
  };
  timestamp?: string;
}

export default function SEODashboard() {
  // IndexNow state
  const [indexNowStatus, setIndexNowStatus] = useState<IndexNowStatus | null>(null);
  const [indexNowLoading, setIndexNowLoading] = useState(true);
  const [manualUrl, setManualUrl] = useState("");
  const [manualSubmitLoading, setManualSubmitLoading] = useState(false);
  const [manualSubmitResult, setManualSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [submitAllLoading, setSubmitAllLoading] = useState(false);
  const [submitAllResult, setSubmitAllResult] = useState<SubmitAllResult | null>(null);
  const [submitAllPreview, setSubmitAllPreview] = useState<{
    totalPosts: number;
    urlsToSubmit: number;
  } | null>(null);

  // SEO Check state
  const [seoCheckUrl, setSeoCheckUrl] = useState("");
  const [seoCheckLoading, setSeoCheckLoading] = useState(false);
  const [seoCheckResult, setSeoCheckResult] = useState<SEOAnalysisResult | null>(null);

  // Load IndexNow status on mount
  useEffect(() => {
    fetchIndexNowStatus();
    fetchSubmitAllPreview();
  }, []);

  const fetchIndexNowStatus = async () => {
    try {
      setIndexNowLoading(true);
      const response = await fetch("/api/indexnow/test");
      const data = await response.json();
      setIndexNowStatus(data);
    } catch (error) {
      console.error("Error fetching IndexNow status:", error);
    } finally {
      setIndexNowLoading(false);
    }
  };

  const fetchSubmitAllPreview = async () => {
    try {
      const response = await fetch("/api/indexnow/submit-all");
      const data = await response.json();
      if (data.status === "ready") {
        setSubmitAllPreview({
          totalPosts: data.totalPosts,
          urlsToSubmit: data.urlsToSubmit,
        });
      }
    } catch (error) {
      console.error("Error fetching submit all preview:", error);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualUrl.trim()) {
      setManualSubmitResult({
        success: false,
        message: "Wprowadź URL",
      });
      return;
    }

    try {
      setManualSubmitLoading(true);
      setManualSubmitResult(null);

      const response = await fetch(
        `/api/indexnow/test?url=${encodeURIComponent(manualUrl)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        setManualSubmitResult({
          success: true,
          message: data.message || "URL wysłany pomyślnie",
        });
        setManualUrl("");
      } else {
        setManualSubmitResult({
          success: false,
          message: data.error || data.message || "Błąd wysyłania",
        });
      }
    } catch (error) {
      setManualSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : "Błąd wysyłania",
      });
    } finally {
      setManualSubmitLoading(false);
    }
  };

  const handleSubmitAll = async () => {
    if (
      !confirm(
        `Czy na pewno chcesz wysłać ${submitAllPreview?.urlsToSubmit || 0} URL-i do IndexNow?`
      )
    ) {
      return;
    }

    try {
      setSubmitAllLoading(true);
      setSubmitAllResult(null);

      const response = await fetch("/api/indexnow/submit-all", {
        method: "POST",
      });

      const data = await response.json();
      setSubmitAllResult(data);
    } catch (error) {
      setSubmitAllResult({
        success: false,
        message: error instanceof Error ? error.message : "Błąd wysyłania",
      });
    } finally {
      setSubmitAllLoading(false);
    }
  };

  const handleSEOCheck = async () => {
    if (!seoCheckUrl.trim()) {
      return;
    }

    try {
      setSeoCheckLoading(true);
      setSeoCheckResult(null);

      const response = await fetch("/api/admin/seo-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: seoCheckUrl }),
      });

      const data = await response.json();
      setSeoCheckResult(data);
    } catch (error) {
      setSeoCheckResult({
        url: seoCheckUrl,
        success: false,
        error: error instanceof Error ? error.message : "Błąd analizy",
      });
    } finally {
      setSeoCheckLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* IndexNow Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          IndexNow
        </h2>

        {/* Status IndexNow */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Status konfiguracji
            </h3>
            <Button
              variant="outline"
              onClick={fetchIndexNowStatus}
              disabled={indexNowLoading}
              className="text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${indexNowLoading ? "animate-spin" : ""}`}
              />
              Odśwież
            </Button>
          </div>

          {indexNowLoading ? (
            <div className="text-gray-600 dark:text-gray-400">Ładowanie...</div>
          ) : indexNowStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  API Key:
                </span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {indexNowStatus.config.apiKeyValue}
                </span>
                {indexNowStatus.config.apiKey === "✅ Ustawiony" ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  URL strony:
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {indexNowStatus.config.siteUrl}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Plik klucza:
                </span>
                <a
                  href={indexNowStatus.keyFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {indexNowStatus.keyFile.url}
                </a>
                {indexNowStatus.keyFile.available ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              {indexNowStatus.keyFile.note && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {indexNowStatus.keyFile.note}
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-400">
              Błąd pobierania statusu
            </div>
          )}
        </div>

        {/* Ręczne wysyłanie URL */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Ręczne wysyłanie URL
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://vlogizdrogi.pl/..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="primary"
              onClick={handleManualSubmit}
              disabled={manualSubmitLoading}
            >
              {manualSubmitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Wyślij
                </>
              )}
            </Button>
          </div>
          {manualSubmitResult && (
            <div
              className={`mt-4 p-3 rounded-md ${
                manualSubmitResult.success
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  manualSubmitResult.success
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {manualSubmitResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {manualSubmitResult.message}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wysyłanie wszystkich postów */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Wysyłanie wszystkich postów
          </h3>
          {submitAllPreview && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Znaleziono <span className="font-semibold">{submitAllPreview.totalPosts}</span>{" "}
                postów, do wysłania:{" "}
                <span className="font-semibold">{submitAllPreview.urlsToSubmit}</span> URL-i
              </div>
            </div>
          )}
          <Button
            variant="primary"
            onClick={handleSubmitAll}
            disabled={submitAllLoading}
          >
            {submitAllLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Wyślij wszystkie posty
              </>
            )}
          </Button>
          {submitAllResult && (
            <div className="mt-4 space-y-2">
              <div
                className={`p-3 rounded-md ${
                  submitAllResult.success
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    submitAllResult.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {submitAllResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">
                    {submitAllResult.message}
                  </span>
                </div>
              </div>
              {submitAllResult.summary && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Partie: {submitAllResult.summary.successfulBatches} sukces,{" "}
                  {submitAllResult.summary.failedBatches} błąd
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SEO Check Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Sprawdzanie SEO
        </h2>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Analiza URL
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="url"
              value={seoCheckUrl}
              onChange={(e) => setSeoCheckUrl(e.target.value)}
              placeholder="https://vlogizdrogi.pl/..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="primary"
              onClick={handleSEOCheck}
              disabled={seoCheckLoading}
            >
              {seoCheckLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizowanie...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analizuj
                </>
              )}
            </Button>
          </div>

          {seoCheckResult && (
            <div className="space-y-6">
              {!seoCheckResult.success ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {seoCheckResult.error || "Błąd analizy"}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Meta Tags */}
                  {seoCheckResult.metaTags && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                          Meta Tagi
                        </h4>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 space-y-2">
                        {seoCheckResult.metaTags.title && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Title:
                            </span>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                              {seoCheckResult.metaTags.title}
                            </div>
                          </div>
                        )}
                        {seoCheckResult.metaTags.description && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Description:
                            </span>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                              {seoCheckResult.metaTags.description}
                            </div>
                          </div>
                        )}
                        {seoCheckResult.metaTags.og && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                              Open Graph:
                            </div>
                            {seoCheckResult.metaTags.og.title && (
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                og:title: {seoCheckResult.metaTags.og.title}
                              </div>
                            )}
                            {seoCheckResult.metaTags.og.description && (
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                og:description: {seoCheckResult.metaTags.og.description}
                              </div>
                            )}
                            {seoCheckResult.metaTags.og.image && (
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                og:image: {seoCheckResult.metaTags.og.image}
                              </div>
                            )}
                          </div>
                        )}
                        {seoCheckResult.metaTags.twitter && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                              Twitter:
                            </div>
                            {seoCheckResult.metaTags.twitter.card && (
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                twitter:card: {seoCheckResult.metaTags.twitter.card}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Structured Data */}
                  {seoCheckResult.structuredData && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                          Structured Data (JSON-LD)
                        </h4>
                        {seoCheckResult.structuredData.found ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                        {seoCheckResult.structuredData.found ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              Znaleziono {seoCheckResult.structuredData.count} schemat(ów)
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Typy: {seoCheckResult.structuredData.types.join(", ")}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            Nie znaleziono structured data
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sitemap */}
                  {seoCheckResult.sitemap && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Map className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                          Sitemap
                        </h4>
                        {seoCheckResult.sitemap.available ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                        {seoCheckResult.sitemap.available ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              <a
                                href={seoCheckResult.sitemap.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {seoCheckResult.sitemap.url}
                              </a>
                            </div>
                            {seoCheckResult.sitemap.urlCount !== undefined && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                URL-i w sitemap: {seoCheckResult.sitemap.urlCount}
                              </div>
                            )}
                            {seoCheckResult.sitemap.lastModified && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Ostatnia modyfikacja:{" "}
                                {seoCheckResult.sitemap.lastModified}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {seoCheckResult.sitemap.error || "Sitemap niedostępny"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

