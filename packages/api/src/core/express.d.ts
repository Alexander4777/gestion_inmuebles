import type { TokenPayload } from './auth';

declare module 'express' {
  interface Request {
    usuario?: TokenPayload;
  }
}
