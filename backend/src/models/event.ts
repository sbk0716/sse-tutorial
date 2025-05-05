// SSE（Server-Sent Events）イベントモデル
// このファイルはSSEイベントの送信と過去イベントの管理を担当します
import { Response } from "express";
// キャッシュサイズの上限を設定ファイルから読み込みます
// これにより、メモリ使用量を制限します
import { MAX_CACHE_SIZE } from "../config/index";

// イベントの型定義
// SSEイベントは以下の要素で構成されます：
// - id: イベントの一意の識別子（連番）
// - type: イベントの種類（'message', 'system'など）
// - data: イベントのデータ（任意のJSONオブジェクト）
export interface Event {
  id: number;
  type: string;
  data: Record<string, unknown>;
}

// 過去のイベントを保存するキャッシュ
// これは再接続時に失われたイベントを再送するために使用されます
// クライアントが切断している間に送信されたイベントを追跡します
export const eventCache: Event[] = [];
// グローバルなイベントIDカウンター
// 各イベントに一意のIDを割り当てるために使用されます
export let eventId = 0;

// イベント送信関数
// この関数はSSEプロトコルに準拠したフォーマットでイベントを送信します
// SSEイベントは以下の形式で送信されます：
// id: イベントID
// event: イベントタイプ
// data: JSONデータ
// 空行（\n\n）でイベントの終わりを示します
export const sendEvent = (
  res: Response,
  type: string,
  data: Record<string, unknown>,
): void => {
  // イベントIDをインクリメントして一意性を確保します
  eventId++;
  // イベントIDを送信します
  // クライアントはこのIDを保存し、再接続時にLast-Event-IDヘッダーで送信します
  res.write(`id: ${eventId}\n`);
  // イベントタイプを送信します
  // クライアントはこのタイプに基づいてイベントハンドラーを選択できます
  res.write(`event: ${type}\n`);
  // イベントデータをJSON文字列として送信します
  // クライアントはこのデータをJSON.parse()で解析できます
  res.write(`data: ${JSON.stringify(data)}\n\n`);

  // イベントをキャッシュに保存
  // 再接続時に失われたイベントを再送するために使用されます
  eventCache.push({ id: eventId, type, data });

  // キャッシュサイズの制限
  // メモリ使用量を制限するために、キャッシュサイズが上限を超えた場合は
  // 最も古いイベントを削除します（FIFO: First In, First Out）
  if (eventCache.length > MAX_CACHE_SIZE) {
    eventCache.shift(); // 最も古いイベントを削除
  }
};

// 過去のイベントを送信する関数
// クライアントが再接続した際に、切断中に失われたイベントを再送します
// lastEventIdは、クライアントが最後に受信したイベントのIDです
export const sendMissedEvents = (res: Response, lastEventId: number): void => {
  // lastEventIdより新しいイベントをキャッシュから抽出します
  // これらは、クライアントが切断中に送信されたイベントです
  const missedEvents = eventCache.filter((event) => event.id > lastEventId);
  // 失われた各イベントを順番に再送します
  // これにより、クライアントは切断中に送信されたすべてのイベントを受信できます
  missedEvents.forEach((event) => {
    sendEvent(res, event.type, event.data);
  });
};
