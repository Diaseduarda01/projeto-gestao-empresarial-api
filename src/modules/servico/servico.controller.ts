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
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServicoService } from './servico.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
export class ServicoController {
  constructor(@Inject(ServicoService) private readonly servicoService: ServicoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateServicoDto) {
    return this.servicoService.create(dto, user.empresaId);
  }

  @Get()
  list(@CurrentUser() user: UserPayload, @Query() pagination: PaginationDto) {
    return this.servicoService.list(user.empresaId, pagination.page, pagination.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.servicoService.get(id, user.empresaId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateServicoDto,
  ) {
    return this.servicoService.update(id, user.empresaId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    await this.servicoService.remove(id, user.empresaId);
  }
}
