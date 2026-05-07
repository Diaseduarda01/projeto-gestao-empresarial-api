import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { TrocarEmpresaDto } from './dto/trocar-empresa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('trocar-empresa')
  @HttpCode(HttpStatus.OK)
  trocarEmpresa(@CurrentUser() user: UserPayload, @Body() dto: TrocarEmpresaDto) {
    return this.authService.trocarEmpresa(user.userId, dto.empresaId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: UserPayload, @Body() dto: LogoutDto) {
    await this.authService.logout(user.jti, user.exp, dto.refreshToken);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('recuperar-senha')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: RecuperarSenhaDto) {
    await this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('redefinir-senha')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: RedefinirSenhaDto) {
    await this.authService.resetPassword(dto.token, dto.novaSenha);
  }
}
