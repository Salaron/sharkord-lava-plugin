export type TLavaNodeOptions = {
  host: string;
  port: number;
  password: string;
  secure: boolean;
};

export type TRtpOptions = {
  host: string;
  port: number;
  ssrc: number;
  payloadType: number;
};

