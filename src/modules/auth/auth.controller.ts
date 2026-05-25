import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleProfilePayload } from './strategies/google.strategy';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { TrocarEmpresaDto } from './dto/trocar-empresa.dto';
import { VerificarEmailDto } from './dto/verificar-email.dto';
import { AceitarConviteDto } from './dto/aceitar-convite.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

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

  @Public()
  @Post('verificar-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verificarEmail(@Body() dto: VerificarEmailDto) {
    await this.authService.verificarEmail(dto.token);
  }

  @Public()
  @Post('aceitar-convite')
  @HttpCode(HttpStatus.OK)
  aceitarConvite(@Body() dto: AceitarConviteDto) {
    return this.authService.aceitarConvite(dto.token, dto.senha, dto.nome);
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin() {
    // O AuthGuard('google') faz o redirect para o consentimento Google.
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfilePayload;
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    try {
      const result = await this.authService.loginComGoogle(profile);
      const payload = Buffer.from(JSON.stringify(result)).toString('base64url');
      return res.redirect(`${frontendUrl}/auth/google/callback?payload=${payload}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no login com Google';
      const params = new URLSearchParams({ error: message });
      return res.redirect(`${frontendUrl}/login?${params.toString()}`);
    }
  }

  @UseGuards(SuperAdminGuard)
  @Post('impersonar/:empresaId')
  @HttpCode(HttpStatus.OK)
  impersonar(
    @CurrentUser() user: UserPayload,
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
  ) {
    return this.authService.impersonar(user.userId, empresaId);
  }
}
