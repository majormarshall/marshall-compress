import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user (or a specific property) from the request object.
 * The SupabaseAuthGuard attaches the JWT payload to `req.user`.
 *
 * Usage:
 *   @CurrentUser()           → full user payload
 *   @CurrentUser('id')       → user.sub || user.id
 *   @CurrentUser('email')    → user.email
 */
export const CurrentUser = createParamDecorator(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return null;
    if (property === 'id') return user.sub || user.id;
    if (property) return user[property] ?? null;
    return user;
  },
);
