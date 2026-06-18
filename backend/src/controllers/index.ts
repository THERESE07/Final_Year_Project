// ============================================================
// controllers/index.ts  (barrel re-export)
//
// WHY THIS FILE EXISTS:
//   The original was a single 350-line file with all controllers.
//   We've split it into one file per domain. This barrel file
//   re-exports everything so that routes/index.ts (and any other
//   file that did `import { X } from '../controllers'`) requires
//   ZERO changes — the import path stays the same.
//
// The original routes/index.ts import:
//   import { AuthController, UserController, ... } from '../controllers';
//   ↑ Still works perfectly with this barrel.
// ============================================================

export { AuthController }         from './auth.controller';
export { UserController }         from './user.controller';
export { CooperativeController }  from './cooperative.controller';
export { SubsidyController }      from './subsidy.controller';
export { InputController }        from './input.controller';
export { AnalyticsController }    from './analytics.controller';
export { NotificationController } from './notification.controller';
