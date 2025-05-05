// SSE（Server-Sent Events）クライアントモデル
// このファイルはSSE接続中のクライアントの管理を担当します
import { Response } from "express";

// クライアントの型定義
// SSE接続中の各クライアントは以下の情報を持ちます：
// - id: クライアントの一意の識別子（通常はタイムスタンプ）
// - res: Expressのレスポンスオブジェクト（イベント送信に使用）
// - user: 認証済みクライアントの場合のユーザー情報（オプション）
export interface Client {
  id: number;
  res: Response;
  user?: { id: number; username: string; role: string };
}

// クライアント接続を保持する配列
// 現在接続中のすべてのクライアントを追跡します
// この配列はイベント送信時に使用され、すべての接続クライアントにイベントを配信します
export const clients: Client[] = [];

// クライアントを追加する関数
// 新しいSSE接続が確立されたときに呼び出されます
// クライアント情報をグローバルな配列に追加します
export const addClient = (client: Client): void => {
  // クライアントをクライアント配列の末尾に追加します
  clients.push(client);
};

// クライアントを削除する関数
// クライアントが切断したときに呼び出されます
// 指定されたIDを持つクライアントをグローバルな配列から削除します
export const removeClient = (clientId: number): void => {
  // 指定されたIDを持つクライアントのインデックスを検索します
  const index = clients.findIndex((client) => client.id === clientId);
  // クライアントが見つかった場合（インデックスが-1でない場合）
  if (index !== -1) {
    // 配列からクライアントを削除します
    // splice(index, 1)は、指定されたインデックスから1つの要素を削除します
    clients.splice(index, 1);
  }
};

// クライアントを検索する関数
// 指定されたIDを持つクライアントを検索します
// 特定のクライアントにのみイベントを送信する場合などに使用できます
export const findClient = (clientId: number): Client | undefined => {
  // 指定されたIDを持つクライアントを配列から検索します
  // 見つかった場合はそのクライアントオブジェクトを返し、
  // 見つからない場合はundefinedを返します
  return clients.find((client) => client.id === clientId);
};
