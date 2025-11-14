/**
 * Walidacja wymaganych zmiennych środowiskowych przy starcie aplikacji
 */
export function validateEnvVars() {
  const required = [
    "JWT_SECRET",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    "SANITY_VIEWER_TOKEN",
  ];

  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please set them in your .env.local file or deployment environment.`
    );
  }
}

