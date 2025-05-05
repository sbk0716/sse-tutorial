// SSE（Server-Sent Events）メッセージコントローラー
// このファイルは接続中のすべてのSSEクライアントにメッセージを送信する機能を提供します
// ChatGPTのような段階的なメッセージ表示を実現するためのストリーミング機能も含まれています
import { Request, Response } from "express";
// 接続中のクライアントリストをインポートします
// このリストを使用して、すべてのクライアントにメッセージを送信します
import { clients } from "../models/client";
// イベント送信関数をインポートします
// この関数を使用して、SSEプロトコルに準拠したフォーマットでメッセージを送信します
import { sendEvent } from "../models/event";
// ログ出力用の関数をインポートします
// メッセージ送信のログを記録するために使用します
import { logMessageSent } from "../utils/logger";
// faker.jsをインポートします
// ランダムなメッセージを生成するために使用します
import { faker } from "@faker-js/faker/locale/ja";

// console警告を無視
// TypeScriptのESLint設定に関連するコメントです
/* eslint-disable no-console */

/**
 * クライアントメッセージに基づいて応答を生成する関数
 * クライアントのメッセージを解析し、適切なfaker.js関数を使用して応答を生成します
 *
 * @param clientMessage クライアントから送信されたメッセージ
 * @returns 生成された応答メッセージ
 */
function generateResponseFromClientMessage(clientMessage: string): string {
  // クライアントメッセージを小文字に変換して検索しやすくする
  const lowerCaseMessage = clientMessage.toLowerCase();

  // メッセージの長さに基づいて応答の長さを調整
  const responseLength = Math.min(Math.max(clientMessage.length / 10, 1), 5);

  // キーワードに基づいてテーマを選択
  let response = "";

  // 挨拶に関するキーワード
  if (
    lowerCaseMessage.includes("こんにちは") ||
    lowerCaseMessage.includes("hello") ||
    lowerCaseMessage.includes("hi") ||
    lowerCaseMessage.includes("おはよう") ||
    lowerCaseMessage.includes("こんばんは")
  ) {
    // 挨拶を返す
    response = `${clientMessage}！${faker.person.firstName()}です。${faker.person.bio()}`;
  }
  // 質問に関するキーワード
  else if (
    lowerCaseMessage.includes("?") ||
    lowerCaseMessage.includes("？") ||
    lowerCaseMessage.includes("ですか") ||
    lowerCaseMessage.includes("何") ||
    lowerCaseMessage.includes("誰") ||
    lowerCaseMessage.includes("どこ") ||
    lowerCaseMessage.includes("いつ") ||
    lowerCaseMessage.includes("なぜ") ||
    lowerCaseMessage.includes("どうして")
  ) {
    // 質問に対する回答を生成
    response = `「${clientMessage}」という質問ですね。${faker.lorem.paragraph(Math.ceil(responseLength))}`;
  }
  // 食べ物に関するキーワード
  else if (
    lowerCaseMessage.includes("食べ物") ||
    lowerCaseMessage.includes("料理") ||
    lowerCaseMessage.includes("レストラン") ||
    lowerCaseMessage.includes("食事") ||
    lowerCaseMessage.includes("おいしい")
  ) {
    // 食べ物に関する応答を生成
    response = `食べ物といえば、${faker.commerce.productName()}が好きです。${faker.commerce.productDescription()}`;
  }
  // 天気に関するキーワード
  else if (
    lowerCaseMessage.includes("天気") ||
    lowerCaseMessage.includes("雨") ||
    lowerCaseMessage.includes("晴れ") ||
    lowerCaseMessage.includes("気温")
  ) {
    // 天気に関する応答を生成
    const weather = faker.helpers.arrayElement([
      "晴れ",
      "曇り",
      "雨",
      "雪",
      "霧",
    ]);
    const temp = faker.number.int({ min: 0, max: 35 });
    response = `今日の天気は${weather}で、気温は${temp}度です。${faker.lorem.sentence()}`;
  }
  // 技術に関するキーワード
  else if (
    lowerCaseMessage.includes("技術") ||
    lowerCaseMessage.includes("プログラミング") ||
    lowerCaseMessage.includes("コード") ||
    lowerCaseMessage.includes("開発") ||
    lowerCaseMessage.includes("エンジニア")
  ) {
    // 技術に関する応答を生成
    response = `技術についてですね。${faker.hacker.phrase()}。${faker.lorem.paragraph(Math.ceil(responseLength))}`;
  }
  // デフォルトの応答
  else {
    // クライアントメッセージを引用して応答
    response = `「${clientMessage}」について考えてみました。${faker.lorem.paragraphs(Math.ceil(responseLength), "\n\n")}`;
  }

  return response;
}

// タイムアウトとクリアタイムアウトの型定義
// TypeScriptでNode.jsのタイマー関数を使用するための型宣言です
// ストリーミングメッセージ送信時の遅延処理に使用します
declare const setTimeout: (callback: () => void, ms: number) => NodeJS.Timeout;
declare const clearTimeout: (timeoutId: NodeJS.Timeout) => void;

// 全クライアントにメッセージを送信するコントローラー
// このコントローラーは'/send-message'エンドポイントで使用され、
// 接続中のすべてのSSEクライアントにメッセージを一度に送信します
export const sendMessage = (req: Request, res: Response): void => {
  // リクエストボディからメッセージを取得します
  // メッセージが指定されていない場合は、デフォルトメッセージを使用します
  const clientMessage = req.body.message || "デフォルトメッセージ";

  // クライアントメッセージに基づいて応答を生成
  const message = generateResponseFromClientMessage(clientMessage);
  // 現在のタイムスタンプをISO形式で取得します
  // これはメッセージの送信時刻として使用されます
  const timestamp = new Date().toISOString();
  // クライアントのIPアドレスを取得します（ロギングとデバッグ用）
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // 全クライアントにメッセージを送信
  // 接続中のすべてのクライアントに対して繰り返し処理を行います
  let successCount = 0;
  clients.forEach((client) => {
    try {
      // 各クライアントにSSEイベントとしてメッセージを送信します
      // イベントタイプは'message'、データはタイムスタンプとメッセージ内容を含むオブジェクトです
      sendEvent(client.res, "message", { time: timestamp, message: message });
      // 送信成功カウンターをインクリメントします
      successCount++;
    } catch (error) {
      // エラーが発生した場合（クライアントが切断されているなど）はログに記録します
      // これにより、問題のあるクライアントを特定できます
      console.error(
        `[${new Date().toISOString()}] メッセージ送信エラー - クライアントID: ${client.id} - エラー: ${error}`,
      );
    }
  });

  // メッセージ送信をログに記録します
  // メッセージ内容、送信先クライアント数、送信元IPアドレスを記録します
  logMessageSent(message, successCount, clientIP as string);
  // 送信結果をJSON形式でレスポンスします
  // 成功フラグ、メッセージ、送信先クライアント数を含みます
  res.status(200).json({
    success: true,
    message: "メッセージが送信されました",
    recipients: successCount,
  });
};

// 全クライアントにメッセージをストリーミング形式で送信するコントローラー
// このコントローラーは'/stream-message'エンドポイントで使用され、
// メッセージを小さなチャンクに分割して段階的に送信します
// ChatGPTのような「考え中」の表示を実現するための機能です
export const streamMessage = (req: Request, res: Response): void => {
  // リクエストボディからメッセージを取得します
  const clientMessage = req.body.message || "デフォルトメッセージ";

  // クライアントメッセージに基づいて応答を生成
  const message = generateResponseFromClientMessage(clientMessage);
  // 現在のタイムスタンプをISO形式で取得します
  const timestamp = new Date().toISOString();
  // クライアントのIPアドレスを取得します
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // メッセージをチャンクに分割（単語ごと）
  // 空白文字で分割することで、単語単位でのストリーミングを実現します
  // これにより、自然な「タイピング中」の表現が可能になります
  const chunks = message.split(" ");

  // 各チャンクを順次送信するための変数初期化
  // chunkIndex: 現在処理中のチャンクのインデックス
  // accumulatedMessage: これまでに送信したチャンクを累積したメッセージ
  // successCount: 送信に成功したクライアント数のカウンター
  let chunkIndex = 0;
  let accumulatedMessage = "";
  let successCount = 0;

  // 接続中のクライアント数を確認
  // クライアントが一人も接続されていない場合は処理を行わず早期リターンします
  // これにより、不要な処理を回避し、サーバーリソースを節約します
  if (clients.length === 0) {
    // クライアントが接続されていない場合は早期リターン
    res.status(200).json({
      success: true,
      message: "クライアントが接続されていません",
      recipients: 0,
    });
    return;
  }

  // 送信開始をログに記録
  // ストリーミングの開始時点をログに残すことで、デバッグや監視が容易になります
  logMessageSent(
    `ストリーミング開始: ${message}`,
    clients.length,
    clientIP as string,
  );

  // 次のチャンクを送信する関数
  // この関数は再帰的に呼び出され、すべてのチャンクが送信されるまで処理を続けます
  // 各チャンクの送信間には一定の遅延（100ms）を設けることで、タイピング中の効果を演出します
  const sendNextChunk = () => {
    if (chunkIndex < chunks.length) {
      // 次のチャンクを累積メッセージに追加
      // 2つ目以降のチャンクの前には空白を挿入して、単語間のスペースを維持します
      // これにより、自然な文章として表示されます
      accumulatedMessage += (chunkIndex > 0 ? " " : "") + chunks[chunkIndex];
      chunkIndex++;

      // 全クライアントに現在までの累積メッセージを送信
      // 各クライアントに対して、現在までに処理したチャンクを含むメッセージを送信します
      clients.forEach((client) => {
        try {
          // 'partial-message'イベントタイプで送信することで、フロントエンド側で特別な処理が可能になります
          // time: タイムスタンプ（メッセージの送信時刻）
          // message: 現在までの累積メッセージ
          // isComplete: すべてのチャンクが送信完了したかどうかのフラグ
          // progress: 送信の進捗率（パーセント）- プログレスバー表示に使用
          sendEvent(client.res, "partial-message", {
            time: timestamp,
            message: accumulatedMessage,
            isComplete: chunkIndex >= chunks.length,
            progress: Math.floor((chunkIndex / chunks.length) * 100),
          });

          // 最後のチャンクの場合は成功カウントをインクリメント
          if (chunkIndex >= chunks.length) {
            successCount++;
          }
        } catch (error) {
          // エラーが発生した場合はログに記録
          console.error(
            `[${new Date().toISOString()}] ストリーミングメッセージ送信エラー - クライアントID: ${client.id} - エラー: ${error}`,
          );
        }
      });

      // 次のチャンクを送信するタイマーをセット（100ms間隔）
      // まだ送信すべきチャンクが残っている場合は、100ms後に再度この関数を呼び出します
      // この遅延により、タイピング中のような段階的な表示効果が生まれます
      if (chunkIndex < chunks.length) {
        setTimeout(sendNextChunk, 100);
      } else {
        // 全チャンク送信完了をログに記録
        // すべてのチャンクの送信が完了したことをログに残し、処理の終了を明確にします
        logMessageSent(
          `ストリーミング完了: ${message}`,
          successCount,
          clientIP as string,
        );
      }
    }
  };

  // 最初のチャンクを送信開始
  // ストリーミング処理の開始点です
  // この呼び出しにより、チャンクの送信プロセスが開始されます
  sendNextChunk();

  // 送信開始をレスポンス
  // クライアントに対して、ストリーミングの開始を即座に通知します
  // これにより、クライアントは長時間待つことなく、リクエストの成功を確認できます
  // 実際のメッセージ内容はSSE接続を通じて段階的に届きます
  res.status(200).json({
    success: true,
    message: "ストリーミングメッセージの送信を開始しました",
    recipients: clients.length,
  });
};
