import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PlatformAdminRepository } from './platform-admin.repository';

@Injectable()
export class PlatformAdminService {
  constructor(@Inject(PlatformAdminRepository) private repository: PlatformAdminRepository) {}

  listEmpresas() {
    return this.repository.findAllEmpresas();
  }

  async toggleAtivo(id: string, ativo: boolean) {
    const empresa = await this.repository.findEmpresaById(id);
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return this.repository.updateAtivo(id, ativo);
  }
}
