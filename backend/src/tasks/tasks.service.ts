import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        userId,
      },
    });
  }

  async findAll(userId: string, query: QueryTaskDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(userId: string, taskId: string) {
    return this.getOwnedTaskOrThrow(userId, taskId);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.getOwnedTaskOrThrow(userId, taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(userId: string, taskId: string): Promise<void> {
    await this.getOwnedTaskOrThrow(userId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  /**
   * Loads a task and verifies ownership in one step. A task that exists but
   * belongs to someone else is reported as 404, not 403 — this avoids
   * confirming to an attacker that a given task ID exists at all.
   */
  private async getOwnedTaskOrThrow(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== userId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}
