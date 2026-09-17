import type { UserInfo } from '@vben/types';

import { CLIENT_ID, requestClient } from '../request';

export namespace AuthApi {
  /** RuoYi-Vue-Plus 登录接口参数 */
  export interface LoginParams {
    code?: string;
    grantType?: string;
    password?: string;
    tenantId?: string;
    username?: string;
    uuid?: string;
  }
  /** RuoYi-Vue-Plus 登录返回值（data 部分） */
  export interface LoginResult {
    access_token: string;
    client_id: string;
    expire_time: number;
    grant_type: string;
  }
  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/** 登录（RuoYi-Vue-Plus：password 授权模式，clientId 固定） */
export async function loginApi(data: AuthApi.LoginParams) {
  const result = await requestClient.post<AuthApi.LoginResult>('/auth/login', {
    clientId: CLIENT_ID,
    code: '',
    grantType: 'password',
    tenantId: '000000',
    uuid: '',
    ...data,
  });
  return { accessToken: result.access_token };
}

/** 退出登录 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

/** 刷新accessToken（RuoYi-Vue-Plus 未启用刷新机制，保留占位） */
export async function refreshTokenApi(): Promise<AuthApi.RefreshTokenResult> {
  return { data: '', status: 401 };
}

/** 获取用户信息（RuoYi-Vue-Plus getInfo 接口，映射为 Vben UserInfo 并携带权限码） */
export async function getUserInfoApi(): Promise<
  UserInfo & { permissions: string[] }
> {
  interface RuoYiUserInfo {
    permissions: string[];
    roles: string[];
    user: {
      avatar?: string;
      email?: string;
      nickName?: string;
      phonenumber?: string;
      userId?: number;
      userName?: string;
    };
  }
  const data = await requestClient.get<RuoYiUserInfo>('/system/user/getInfo');
  const user = data?.user ?? {};
  return {
    avatar: user.avatar || '',
    desc: user.email || user.phonenumber || '',
    homePath: '/screen',
    permissions: data?.permissions ?? [],
    realName: user.nickName || user.userName || '未知用户',
    roles: data?.roles ?? [],
    userId: String(user.userId ?? ''),
    username: user.userName || '',
  } as UserInfo & { permissions: string[] };
}
