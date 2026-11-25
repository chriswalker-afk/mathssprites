import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 14000 },
  reporter: [["list"]],
  // Real-time animation and screenshot tests are serial within a runner.
  // Full CI regression uses six isolated test-level shards, each with one
  // worker. Ordinary focused jobs explicitly choose their worker count.
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:8787",
    headless: true,
    channel: "chrome", // Use stable Chrome preinstalled on GitHub-hosted Ubuntu runners.
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    // Python writes an access-log line for every static asset to stderr.
    // Silence those lines in CI; test failures and traces stay visible.
    command: process.env.CI
      ? "python3 -m http.server 8787 --bind 127.0.0.1 2>/dev/null"
      : "python3 -m http.server 8787 --bind 127.0.0.1",
    url: "http://127.0.0.1:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
});
