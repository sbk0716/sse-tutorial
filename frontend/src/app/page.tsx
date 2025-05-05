/**
 * Server-Sent Events (SSE) とは？
 *
 * SSEはサーバーからクライアントへの一方向通信を実現するWeb技術です。
 * 従来のHTTP通信では、クライアントがリクエストを送信し、サーバーがレスポンスを返す
 * という一回限りの通信でしたが、SSEでは一度接続を確立すると、サーバーから
 * クライアントへ継続的にデータを送信し続けることができます。
 *
 * 主な特徴:
 * 1. 一方向通信 - サーバーからクライアントへの通信のみ
 * 2. 自動再接続 - 接続が切れた場合に自動的に再接続を試みる
 * 3. イベントID - 各イベントに一意のIDを付与し、再接続時の続きから受信可能
 * 4. イベントタイプ - 異なる種類のイベントを区別可能
 *
 * SSEはWebSocketと似ていますが、より単純で、HTTPプロトコル上に構築されています。
 * チャット、通知、リアルタイム更新など、サーバーからクライアントへの
 * プッシュ通知が必要なアプリケーションに適しています。
 */

import MessageSender from "./components/MessageSender";
// メッセージ送信フォームコンポーネントをインポート
// このコンポーネントは、ユーザーがメッセージを入力して送信するためのUIを提供します
// 通常送信とストリーミング送信（段階的表示）の両方をサポートしています

import EventListener from "./components/EventListener";
// イベントリスナーコンポーネントをインポート
// このコンポーネントは、SSE接続を確立し、サーバーからのイベントを受信・表示します
// 通常メッセージ、システムメッセージ、部分的なメッセージ（ストリーミング）を処理します

/**
 * ホームページコンポーネント
 *
 * アプリケーションのメインページを構成するコンポーネント
 * SSEデモアプリケーションのUIを提供します
 *
 * このコンポーネントは以下の要素で構成されています:
 * 1. ヘッダー - アプリケーションのタイトルを表示
 * 2. メインコンテンツ - MessageSenderとEventListenerコンポーネントを配置
 * 3. フッター - アプリケーションの説明を表示
 *
 * @returns メインページのJSX要素
 */
export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ヘッダーセクション - アプリケーションのタイトルを表示 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Server-Sent Events デモ</h1>
      </div>

      {/* メインコンテンツセクション - メッセージ送信とイベント表示領域 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        {/* メッセージ送信フォーム - ユーザーがメッセージを入力して送信するためのUI */}
        <MessageSender />

        {/* イベントリスナー - サーバーからのSSEイベントを受信して表示するコンポーネント */}
        <EventListener />
      </div>

      {/* フッターセクション - アプリケーションの説明 */}
      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Next.js + Express.js による SSE デモアプリケーション</p>
      </footer>
    </div>
  );
}
