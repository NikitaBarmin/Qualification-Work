export interface IUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  businessType: string | null;
  createdAt: string;
}

export interface IUserSession {
  id: string;
  email: string;
  businessType: string | null;
}
