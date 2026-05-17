import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformAdminService } from './platform-admin.service';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@ApiTags('Platform Admin')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(@Inject(PlatformAdminService) private readonly service: PlatformAdminService) {}

  @Get('empresas')
  listEmpresas() {
    return this.service.listEmpresas();
  }

  @Patch('empresas/:id/status')
  @HttpCode(HttpStatus.OK)
  toggleAtivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { ativo: boolean },
  ) {
    return this.service.toggleAtivo(id, body.ativo);
  }
}
