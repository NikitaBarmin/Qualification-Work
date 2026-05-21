export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  businessType?: string | null;
}

export interface IUserSession {
  id: string;
  email: string;
  businessType?: string | null;
}

export interface IAuthResponse {
  user: IUserSession;
}
