import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: any;
  let refreshTokenRepository: any;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    refreshTokenRepository = {
      find: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    authService = new AuthService(
      userRepository,
      refreshTokenRepository,
      {} as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.DEMO_EMAIL;
    delete process.env.DEMO_PASSWORD;
    delete process.env.DEMO_PHONE;
  });

  describe('ensureDemoUser', () => {
    beforeEach(() => {
      process.env.DEMO_EMAIL = 'demo@example.com';
      process.env.DEMO_PASSWORD = 'DemoPass123';
      process.env.DEMO_PHONE = '0123456789';
    });

    it('skips seeding when demo env vars are missing', async () => {
      delete process.env.DEMO_EMAIL;
      await expect(authService.ensureDemoUser({})).resolves.toBeUndefined();
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('creates a new demo user when none exists', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        email: 'demo@example.com',
        passwordHash: 'hashed',
      });
      userRepository.save.mockResolvedValue({
        id: 1,
        email: 'demo@example.com',
        role: UserRole.ADMIN,
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');

      await authService.ensureDemoUser({});

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'demo@example.com' },
      });
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'demo@example.com',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('updates an existing user when data is incomplete', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 2,
        email: 'demo@example.com',
        role: UserRole.USER,
        passwordHash: 'oldhash',
        phone: null,
        fullName: null,
        status: UserStatus.INACTIVE,
      });
      userRepository.save.mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newhash');

      await authService.ensureDemoUser({});

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
          passwordHash: 'newhash',
          phone: '0123456789',
          fullName: 'Demo Admin',
          status: UserStatus.ACTIVE,
        }),
      );
    });
  });
});
