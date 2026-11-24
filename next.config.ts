import type { NextConfig } from "next";

const appHost = (() => {
  try {
    return process.env.APP_URL ? new URL(process.env.APP_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "*.run.app",
    "**.run.app",
    "*.asia-northeast1.run.app",
    "*.us-central1.run.app",
    "*.europe-west1.run.app",
    "localhost",
    "127.0.0.1",
    ...(appHost ? [appHost] : []),
  ],
};

export default nextConfig;
