import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListaEsperaService } from './lista-espera.service';
import { CreateListaEsperaDto } from './dto/lista-espera.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Lista de Espera')
@ApiBearerAuth()
@Controller('lista-espera')
export class ListaEsperaController {
  constructor(@Inject(ListaEsperaService) private readonly service: ListaEsperaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateListaEsperaDto) {
    return this.service.create(dto, user.empresaId);
  }

  @Get()
  list(
    @CurrentUser() user: UserPayload,
    @Query() pagination: PaginationDto,
    @Query('atendida') atendida: string | undefined,
  ) {
    return this.service.list(user.empresaId, pagination, atendida);
  }

  @Patch(':id/atender')
  @HttpCode(HttpStatus.OK)
  atender(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.atender(id, user.empresaId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    await this.service.remove(id, user.empresaId);
  }
}
