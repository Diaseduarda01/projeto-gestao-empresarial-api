import { Module } from '@nestjs/common';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { EstoqueRepository } from './estoque.repository';

@Module({
  controllers: [EstoqueController],
  providers: [EstoqueService, EstoqueRepository],
  exports: [EstoqueService],
})
export class EstoqueModule {}
