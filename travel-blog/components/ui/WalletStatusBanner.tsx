"use client";

import { AlertCircle, WifiOff, LogIn, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";

export type WalletStatusBannerVariant =
  | "localOnly"
  | "loggedOutWithData"
  | "offline";

interface WalletStatusBannerProps {
  variant: WalletStatusBannerVariant;
  onLogin?: () => void;
  onRegister?: () => void;
  /** Compact sticky style: smaller text, opacity 80%, linki zamiast przycisków */
  compact?: boolean;
  /** W trybie compact: href dla "Zaloguj się" (domyślnie /portfel-podrozniczy?showLogin=1) */
  loginHref?: string;
  /** W trybie compact: href dla "Utwórz konto" (domyślnie /portfel-podrozniczy?showRegister=1) */
  registerHref?: string;
  className?: string;
}

const variantConfig = {
  localOnly: {
    icon: AlertCircle,
    wrapperClass:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
    title: "Dane tylko na tym urządzeniu",
    message:
      "Podróże są zapisywane wyłącznie lokalnie. Przy czyszczeniu danych przeglądarki możesz je utracić. Zaloguj się lub załóż konto, aby zapisać podróże w chmurze i mieć do nich dostęp z każdego urządzenia.",
    showLogin: true,
    showRegister: true,
  },
  loggedOutWithData: {
    icon: AlertCircle,
    wrapperClass:
      "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200",
    title: "Jesteś wylogowany",
    message:
      "Twoje podróże są zapisane tylko na tym urządzeniu. Zaloguj się, aby zsynchronizować je z chmurą i mieć dostęp z innych urządzeń.",
    showLogin: true,
    showRegister: false,
  },
  offline: {
    icon: WifiOff,
    wrapperClass:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
    title: "Jesteś offline",
    message:
      "Część funkcji może być niedostępna. Dane zapisują się lokalnie i zsynchronizują po powrocie online.",
    showLogin: false,
    showRegister: false,
  },
};

const DEFAULT_LOGIN_HREF = "/logowanie";
const DEFAULT_REGISTER_HREF = "/rejestracja";

export default function WalletStatusBanner({
  variant,
  onLogin,
  onRegister,
  compact = false,
  loginHref = DEFAULT_LOGIN_HREF,
  registerHref = DEFAULT_REGISTER_HREF,
  className = "",
}: WalletStatusBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const showActions = compact
    ? (config.showLogin || config.showRegister)
    : (config.showLogin || config.showRegister) && (onLogin || onRegister);

  return (
    <div
      className={`rounded-lg border ${compact ? "opacity-80 p-2 sm:px-3" : "p-4"} ${config.wrapperClass} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${compact ? "gap-2" : "gap-3"}`}>
        <div className="flex gap-3">
          <div className={`flex-shrink-0 ${compact ? "mt-0" : "mt-0.5"}`}>
            <Icon className={compact ? "w-4 h-4 opacity-90" : "w-5 h-5 opacity-90"} aria-hidden />
          </div>
          <div>
            <p className={compact ? "text-sm font-medium" : "font-medium"}>{config.title}</p>
            <p className={`${compact ? "text-xs mt-0.5" : "text-sm mt-1"} opacity-90`}>{config.message}</p>
          </div>
        </div>
        {showActions && (
          <div className={`flex flex-wrap gap-2 sm:flex-shrink-0 ${compact ? "items-center" : ""}`}>
            {config.showLogin && (
              compact ? (
                <Link
                  href={loginHref}
                  variant="underline"
                  className="inline-flex items-center gap-1.5 text-sm"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden />
                  Zaloguj się
                </Link>
              ) : onLogin ? (
                <Button
                  variant="primary"
                  onClick={onLogin}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Zaloguj się
                </Button>
              ) : null
            )}
            {config.showRegister && (
              compact ? (
                <Link
                  href={registerHref}
                  variant="underline"
                  className="inline-flex items-center gap-1.5 text-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden />
                  Utwórz konto
                </Link>
              ) : onRegister ? (
                <Button
                  variant="outline"
                  onClick={onRegister}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Utwórz konto
                </Button>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
