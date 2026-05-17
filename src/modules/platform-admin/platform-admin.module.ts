import { Module } from '@nestjs/common';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminRepository } from './platform-admin.repository';

@Module({
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService, PlatformAdminRepository],
})
export class PlatformAdminModule {}
