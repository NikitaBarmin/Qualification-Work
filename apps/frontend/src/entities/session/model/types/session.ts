export type SessionStatus =
  | 'anonymous'
  | 'guest'
  | 'authenticated';

export interface ISessionUser {
  id: string;
  email: string;
  businessType?: string | null;
}

export interface ISessionSchema {
  initialized: boolean;
  status: SessionStatus;
  user: ISessionUser | null;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload extends ILoginPayload {
  businessType?: string;
}
