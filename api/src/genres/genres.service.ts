import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGenreDto } from './dto/create-genre.dto.js';
import { UpdateGenreDto } from './dto/update-genre.dto.js';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async create(createGenreDto: CreateGenreDto) {
    const slug = createGenreDto.slug?.trim() || this.slugify(createGenreDto.name);

    try {
      return await this.prisma.genre.create({
        data: {
          name: createGenreDto.name.trim(),
          slug,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A genre with this name or slug already exists.');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found.`);
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    await this.findOne(id);

    const data: Prisma.GenreUpdateInput = {};
    if (updateGenreDto.name !== undefined) {
      data.name = updateGenreDto.name.trim();
    }
    if (updateGenreDto.slug !== undefined) {
      data.slug = updateGenreDto.slug.trim();
    } else if (updateGenreDto.name !== undefined) {
      data.slug = this.slugify(updateGenreDto.name);
    }

    try {
      return await this.prisma.genre.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A genre with this name or slug already exists.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.prisma.genre.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Cannot delete genre because books are assigned to it.');
      }
      throw error;
    }
  }
}

