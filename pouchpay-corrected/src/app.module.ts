import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlltraModule } from './alltra/alltra.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AlltraModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
