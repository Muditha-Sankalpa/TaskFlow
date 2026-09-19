import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as exempt from the global JwtAuthGuard.
 * Everything is authenticated by default — this is the explicit opt-out.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
