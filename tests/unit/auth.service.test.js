import authService from '../../src/services/auth.service.js';

describe('AuthService token helpers', () => {
  test('generateTokenPair returns access and refresh tokens', () => {
    const tokens = authService.generateTokenPair(42);

    expect(tokens.access_token).toEqual(expect.any(String));
    expect(tokens.refresh_token).toEqual(expect.any(String));
    expect(tokens.expires_in).toBeGreaterThan(0);
  });

  test('tokenExpiresInSeconds matches configured jwt expiry', () => {
    const tokens = authService.generateTokenPair(1);
    expect(tokens.expires_in).toBe(authService.tokenExpiresInSeconds);
    expect(authService.tokenExpiresInSeconds).toBeGreaterThan(0);
  });
});

describe('AuthService password helpers', () => {
  test('hashPassword and comparePassword work together', async () => {
    const hash = await authService.hashPassword('secret123');
    expect(await authService.comparePassword('secret123', hash)).toBe(true);
    expect(await authService.comparePassword('wrong', hash)).toBe(false);
  });
});
