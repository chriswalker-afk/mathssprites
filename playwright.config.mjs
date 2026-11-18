import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 8000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8787",
    headless: true,
    channel: "chrome", // Use stable Chrome preinstalled on GitHub-hosted Ubuntu runners.
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "python3 -m http.server 8787 --bind 127.0.0.1",
    url: "http://127.0.0.1:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
});
