import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ReadOnlyGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const method = (req?.method || '').toUpperCase();
    let user = req?.user;
    if (!user) {
      try {
        const authHeader: string | undefined = req?.headers?.authorization;
        const bearer = authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.substring('Bearer '.length)
          : undefined;
        const cookieToken: string | undefined = req?.cookies?.['access_token'];
        const token = bearer || cookieToken;
        if (token) {
          const payload = this.jwtService.verify(token);
          if (payload && typeof payload === 'object') {
            user = { email: payload.email };
          }
        }
      } catch (_) {
        // ignore decode errors; treat as non-demo
      }
    }

    const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

    const demoEmail = process.env.DEMO_EMAIL;
    const isDemoUser = !!demoEmail && user?.email && user.email.toLowerCase() === String(demoEmail).toLowerCase();

    if (isDemoUser && isMutation) {
      throw new ForbiddenException('Demo account is read-only');
    }

    return true;
  }
}


