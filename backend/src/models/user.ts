// ユーザーの型定義
export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

// 簡易的なユーザーデータ（開発用）
export const users: User[] = [
  {
    id: 1,
    username: "user01",
    // 'password'のハッシュ値
    password: "$2b$10$rIC1ORaXrBsIbNL8OjYEbOQoYs492r.Vz7g/MPCnLAYfYrQu7tXcG", // 'password'
    role: "user",
  },
  {
    id: 2,
    username: "user02",
    // 'password'のハッシュ値
    password: "$2b$10$rIC1ORaXrBsIbNL8OjYEbOQoYs492r.Vz7g/MPCnLAYfYrQu7tXcG", // 'password'
    role: "user",
  },
];

// ユーザーを検索する関数
export const findUserByUsername = (username: string): User | undefined => {
  return users.find((user) => user.username === username);
};
