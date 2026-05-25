import { Controller, Get, Post, Put, Delete, Param, Body, Inject } from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CreateMovimentoDto } from './dto/create-movimento.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('estoque')
export class EstoqueController {
  constructor(@Inject(EstoqueService) private service: EstoqueService) {}

  @Post('produtos')
  createProduto(@CurrentUser() user: any, @Body() dto: CreateProdutoDto) {
    return this.service.createProduto(user.empresaId, dto);
  }

  @Get('produtos')
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.empresaId);
  }

  @Get('alertas')
  findAlertas(@CurrentUser() user: any) {
    return this.service.findAlertas(user.empresaId);
  }

  @Get('produtos/:id')
  findById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findById(id, user.empresaId);
  }

  @Put('produtos/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.service.update(id, user.empresaId, dto);
  }

  @Delete('produtos/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(id, user.empresaId);
  }

  @Post('movimentos')
  registrarMovimento(@CurrentUser() user: any, @Body() dto: CreateMovimentoDto) {
    return this.service.registrarMovimento(user.empresaId, user.userId, dto);
  }

  @Get('produtos/:id/movimentos')
  findMovimentos(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findMovimentos(id, user.empresaId);
  }
}
