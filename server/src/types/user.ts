export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface SafeUser {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}
