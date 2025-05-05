import MessageSender from "./components/MessageSender";
import EventListener from "./components/EventListener";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Server-Sent Events デモ</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <MessageSender />
        <EventListener />
      </div>

      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Next.js + Express.js による SSE デモアプリケーション</p>
      </footer>
    </div>
  );
}
