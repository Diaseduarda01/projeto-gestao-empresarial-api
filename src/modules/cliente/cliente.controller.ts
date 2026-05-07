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
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClienteController {
  constructor(@Inject(ClienteService) private readonly clienteService: ClienteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateClienteDto) {
    return this.clienteService.create(dto, user.empresaId);
  }

  @Get()
  list(@CurrentUser() user: UserPayload, @Query() pagination: PaginationDto) {
    return this.clienteService.list(user.empresaId, pagination.page, pagination.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.clienteService.get(id, user.empresaId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clienteService.update(id, user.empresaId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    await this.clienteService.remove(id, user.empresaId);
  }
}
