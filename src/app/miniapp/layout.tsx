import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = { title: "ByteLab Ops" };

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  // Inject the app URL server-side so client fetch calls work in Telegram's
  // sandboxed WebView where window.location.origin returns "null".
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
      <script dangerouslySetInnerHTML={{ __html: `window.__APP_URL__=${JSON.stringify(appUrl)};` }} />
      <div className="min-h-screen w-full">
        {children}
      </div>
    </>
  );
}
