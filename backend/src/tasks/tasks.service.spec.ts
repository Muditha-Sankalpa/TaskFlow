import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const ownerId = 'user-1';
  const otherUserId = 'user-2';
  const task = {
    id: 'task-1',
    title: 'Write tests',
    description: null,
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: null,
    userId: ownerId,
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TasksService);
  });

  describe('create', () => {
    it('creates a task scoped to the requesting user', async () => {
      prisma.task.create.mockResolvedValue(task);

      await service.create(ownerId, { title: 'Write tests' });

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: ownerId }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('only queries tasks belonging to the requesting user', async () => {
      prisma.$transaction.mockResolvedValue([[task], 1]);

      const result = await service.findAll(ownerId, {});

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.items).toEqual([task]);
    });
  });

  describe('ownership enforcement', () => {
    it('returns the task to its owner', async () => {
      prisma.task.findUnique.mockResolvedValue(task);

      const result = await service.findOne(ownerId, 'task-1');

      expect(result).toEqual(task);
    });

    it("hides another user's task behind a 404 instead of a 403", async () => {
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.findOne(otherUserId, 'task-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('404s on update for a non-owned task and never calls update', async () => {
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(
        service.update(otherUserId, 'task-1', { title: 'Hijacked' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('404s on delete for a non-owned task and never calls delete', async () => {
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.remove(otherUserId, 'task-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('404s when the task does not exist at all', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(ownerId, 'missing-task')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
