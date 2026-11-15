import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private instance?: PrismaClient;

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('DATABASE_URL')?.trim());
  }

  get client(): PrismaClient {
    if (!this.instance) {
      const connectionString = this.config.get<string>('DATABASE_URL')?.trim();
      if (!connectionString) {
        throw new ServiceUnavailableException('PostgreSQL is not configured. Set DATABASE_URL locally.');
      }
      let url: URL;
      try { url = new URL(connectionString); } catch {
        throw new ServiceUnavailableException('DATABASE_URL must be a valid PostgreSQL connection URL.');
      }
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname ||
          /DB_HOST|APP_USER|URL_ENCODED_PASSWORD|DB_NAME|YOUR_/i.test(connectionString)) {
        throw new ServiceUnavailableException('Set a real PostgreSQL DATABASE_URL before using the database.');
      }
      const adapter = new PrismaPg({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        query_timeout: 5000,
      });
      this.instance = new PrismaClient({ adapter });
    }
    return this.instance;
  }

  async checkConnection(): Promise<{ configured: boolean; ready: boolean }> {
    if (!this.isConfigured) return { configured: false, ready: false };
    try {
      await this.client.$queryRaw`SELECT 1`;
      return { configured: true, ready: true };
    } catch {
      // Do not expose database URLs, passwords, or provider errors.
      return { configured: true, ready: false };
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = undefined;
    }
  }
}
