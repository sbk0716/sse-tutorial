import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン - SSE Tutorial",
  description: "Server-Sent Events チュートリアルのログインページ",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
