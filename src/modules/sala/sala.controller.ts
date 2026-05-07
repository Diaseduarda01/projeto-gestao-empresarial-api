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
import { SalaService } from './sala.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Salas')
@ApiBearerAuth()
@Controller('salas')
export class SalaController {
  constructor(@Inject(SalaService) private readonly salaService: SalaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateSalaDto) {
    return this.salaService.create(dto, user.empresaId);
  }

  @Get()
  list(@CurrentUser() user: UserPayload, @Query() pagination: PaginationDto) {
    return this.salaService.list(user.empresaId, pagination.page, pagination.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.salaService.get(id, user.empresaId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateSalaDto,
  ) {
    return this.salaService.update(id, user.empresaId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    await this.salaService.remove(id, user.empresaId);
  }
}
