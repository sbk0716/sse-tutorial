// ユーザーモデルファイル
// このファイルはユーザー情報の管理と認証に関連する機能を提供します
// 認証付きSSEエンドポイントで使用されるユーザー情報を定義します

// ユーザーの型定義
// 各ユーザーは以下の情報を持ちます：
// - id: ユーザーの一意の識別子
// - username: ユーザー名（ログインに使用）
// - password: ハッシュ化されたパスワード
// - role: ユーザーの役割（権限管理に使用）
export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

// 簡易的なユーザーデータ（開発用）
// 実際のアプリケーションではデータベースを使用するべきです
// このサンプルでは、メモリ内の配列を使用しています
export const users: User[] = [
  {
    id: 1,
    username: "user01",
    // 'password'のハッシュ値
    // bcryptでハッシュ化されたパスワードです
    // 実際のパスワードは'password'です
    password: "$2b$10$rIC1ORaXrBsIbNL8OjYEbOQoYs492r.Vz7g/MPCnLAYfYrQu7tXcG", // 'password'
    role: "user",
  },
  {
    id: 2,
    username: "user02",
    // 'password'のハッシュ値
    // こちらも同じく'password'のハッシュ値です
    password: "$2b$10$rIC1ORaXrBsIbNL8OjYEbOQoYs492r.Vz7g/MPCnLAYfYrQu7tXcG", // 'password'
    role: "user",
  },
];

// ユーザーを検索する関数
// 指定されたユーザー名を持つユーザーを検索します
// 認証処理で使用されます
export const findUserByUsername = (username: string): User | undefined => {
  // usersの配列から、指定されたユーザー名を持つユーザーを検索します
  // 見つかった場合はそのユーザーオブジェクトを返し、
  // 見つからない場合はundefinedを返します
  return users.find((user) => user.username === username);
};
