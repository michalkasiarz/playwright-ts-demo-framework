// Type augmentation for express-session to support custom session properties
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    linkingUserId?: string;
    isLinking?: boolean;
  }
}
