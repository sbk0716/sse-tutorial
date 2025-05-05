import { Response } from 'express';

// クライアントの型定義
export interface Client {
  id: number;
  res: Response;
  user?: { id: number; username: string; role: string };
}

// クライアント接続を保持する配列
export const clients: Client[] = [];

// クライアントを追加する関数
export const addClient = (client: Client): void => {
  clients.push(client);
};

// クライアントを削除する関数
export const removeClient = (clientId: number): void => {
  const index = clients.findIndex((client) => client.id === clientId);
  if (index !== -1) {
    clients.splice(index, 1);
  }
};

// クライアントを検索する関数
export const findClient = (clientId: number): Client | undefined => {
  return clients.find((client) => client.id === clientId);
};