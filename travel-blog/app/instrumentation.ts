import { injectSpeedInsights } from "@vercel/speed-insights";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    injectSpeedInsights();
  }
}

