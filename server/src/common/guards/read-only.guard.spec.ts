import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ReadOnlyGuard } from './read-only.guard';

describe('ReadOnlyGuard', () => {
  let guard: ReadOnlyGuard;
  let jwtService: Partial<JwtService>;

  const createContext = (request: Record<string, any>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    guard = new ReadOnlyGuard(jwtService as JwtService);
    process.env.DEMO_EMAIL = 'demo@example.com';
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.DEMO_EMAIL;
  });

  it('allows safe methods for anonymous users', () => {
    const ctx = createContext({ method: 'GET', headers: {}, cookies: {} });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows mutation requests for non-demo users', () => {
    const ctx = createContext({
      method: 'POST',
      user: { email: 'realuser@example.com' },
      headers: {},
      cookies: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException for demo user on POST when user is on request', () => {
    const ctx = createContext({
      method: 'POST',
      user: { email: 'demo@example.com' },
      headers: {},
      cookies: {},
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for demo user with Bearer token on DELETE', () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ email: 'demo@example.com' });
    const ctx = createContext({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      cookies: {},
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(jwtService.verify).toHaveBeenCalledWith('token');
  });

  it('allows requests when token verification fails', () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const ctx = createContext({
      method: 'PATCH',
      headers: { authorization: 'Bearer invalid' },
      cookies: {},
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
