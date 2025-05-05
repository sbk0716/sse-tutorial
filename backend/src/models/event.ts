import { Response } from "express";
import { MAX_CACHE_SIZE } from "../config/index";

// イベントの型定義
export interface Event {
  id: number;
  type: string;
  data: Record<string, unknown>;
}

// 過去のイベントを保存するキャッシュ
export const eventCache: Event[] = [];
export let eventId = 0;

// イベント送信関数
export const sendEvent = (
  res: Response,
  type: string,
  data: Record<string, unknown>,
): void => {
  eventId++;
  res.write(`id: ${eventId}\n`);
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);

  // イベントをキャッシュに保存
  eventCache.push({ id: eventId, type, data });

  // キャッシュサイズの制限
  if (eventCache.length > MAX_CACHE_SIZE) {
    eventCache.shift(); // 最も古いイベントを削除
  }
};

// 過去のイベントを送信する関数
export const sendMissedEvents = (res: Response, lastEventId: number): void => {
  const missedEvents = eventCache.filter((event) => event.id > lastEventId);
  missedEvents.forEach((event) => {
    sendEvent(res, event.type, event.data);
  });
};
