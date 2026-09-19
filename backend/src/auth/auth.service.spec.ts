import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    passwordHash: '',
    refreshTokenHash: null as string | null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                JWT_ACCESS_SECRET: 'access-secret-for-tests-only-32chars',
                JWT_REFRESH_SECRET: 'refresh-secret-for-tests-only-32c',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              })[key],
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('hashes the password and never stores it in plaintext', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'user-1', ...data }),
      );
      prisma.user.update.mockResolvedValue({});

      const result = await service.register({
        email: 'Jane@Example.com',
        name: 'Jane',
        password: 'Sup3rSecret!',
      } as never);

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('Sup3rSecret!');
      expect(
        await bcrypt.compare('Sup3rSecret!', createCall.data.passwordHash),
      ).toBe(true);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(
        (result.user as { passwordHash?: string }).passwordHash,
      ).toBeUndefined();
    });

    it('rejects registration when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'jane@example.com',
          name: 'Jane',
          password: 'Sup3rSecret!',
        } as never),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateCredentials', () => {
    it('accepts correct credentials', async () => {
      const passwordHash = await bcrypt.hash('Correct1Password', 12);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });

      const result = await service.validateCredentials({
        email: 'jane@example.com',
        password: 'Correct1Password',
      });

      expect(result.email).toBe('jane@example.com');
    });

    it('rejects an unknown email with a generic message', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateCredentials({
          email: 'nobody@example.com',
          password: 'whatever1A',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password with the same generic message as an unknown email', async () => {
      const passwordHash = await bcrypt.hash('Correct1Password', 12);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });

      let unknownEmailMessage = '';
      let wrongPasswordMessage = '';

      prisma.user.findUnique.mockResolvedValueOnce(null);
      try {
        await service.validateCredentials({
          email: 'nobody@example.com',
          password: 'x',
        });
      } catch (err) {
        unknownEmailMessage = (err as Error).message;
      }

      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        passwordHash,
      });
      try {
        await service.validateCredentials({
          email: 'jane@example.com',
          password: 'WrongPass1',
        });
      } catch (err) {
        wrongPasswordMessage = (err as Error).message;
      }

      expect(unknownEmailMessage).toBe(wrongPasswordMessage);
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and invalidates the old one on mismatch', async () => {
      const staleHash = await bcrypt.hash('stale-token', 12);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: staleHash,
      });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.refresh('user-1', 'not-the-stored-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshTokenHash: null },
      });
    });

    it('issues new tokens when the presented refresh token matches', async () => {
      const validToken = 'a-valid-refresh-token';
      const matchingHash = await bcrypt.hash(validToken, 12);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: matchingHash,
      });
      prisma.user.update.mockResolvedValue({});

      const tokens = await service.refresh('user-1', validToken);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });
  });
});
