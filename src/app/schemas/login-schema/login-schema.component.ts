interface TokenData {
  ID: number;
  data: any;
  cap_key: string;
  caps: any;
  roles: Array<string>;
  allcaps: any;
  filter: any;
}

interface TokenWC {
  ck: string;
  cs: string;
}

export interface LoginSchema {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
  data: TokenData;
  wc: TokenWC;
}