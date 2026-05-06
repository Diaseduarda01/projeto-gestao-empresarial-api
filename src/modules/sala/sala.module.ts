import { Module } from '@nestjs/common';
import { SalaController } from './sala.controller';
import { SalaService } from './sala.service';
import { SalaRepository } from './sala.repository';

@Module({
  controllers: [SalaController],
  providers: [SalaService, SalaRepository],
})
export class SalaModule {}
