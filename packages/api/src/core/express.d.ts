import type { TokenPayload } from '@proyecto-modular/shared/tipos/auth';

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export {};