import { Module } from '@nestjs/common';
import { CompressionController } from './compression.controller';
import { CompressionService } from './compression.service';

@Module({
  controllers: [CompressionController],
  providers: [CompressionService],
  exports: [CompressionService],
})
export class CompressionModule {}
