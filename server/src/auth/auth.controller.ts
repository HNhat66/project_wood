import { Response } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService, DeviceInfo } from './auth.service';
import {
  AuthResponseDto,
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  SessionsResponseDto,
  UpdateProfileDto,
  UserProfileResponseDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @ApiResponse({ status: 201, description: 'Đăng ký tài khoản thành công' })
  @ApiResponse({
    status: 400,
    description: 'Email hoặc số điện thoại đã tồn tại',
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      user,
      message: 'Đăng ký tài khoản thành công',
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Tài khoản hoặc mật khẩu không chính xác',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const deviceInfo: DeviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      platform: req.headers['platform'],
      deviceName: req.headers['device-name'],
    };
    const { access_token, refresh_token, user } = await this.authService.login(
      loginDto,
      deviceInfo,
    );
    this.setTokens(res, access_token, refresh_token);
    return {
      access_token,
      user,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới token' })
  @ApiResponse({ status: 200, description: 'Làm mới token thành công' })
  @ApiResponse({ status: 401, description: 'Token làm mới không hợp lệ' })
  async refreshToken(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo: DeviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      platform: req.headers['platform'],
      deviceName: req.headers['device-name'],
    };
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    try {
      const { access_token, refresh_token } =
        await this.authService.refreshToken(refreshToken, deviceInfo);
      this.setTokens(res, access_token, refresh_token);
      return { access_token };
    } catch (error) {
      this.clearTokens(res);
      throw new UnauthorizedException('Refresh token expired');
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    this.clearTokens(res);
    return this.authService.logout(refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất từ tất cả thiết bị' })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất từ tất cả thiết bị thành công',
  })
  async logoutAllDevices(@Request() req: any) {
    return this.authService.logoutAllDevices(req.user.sub);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy các phiên đang hoạt động' })
  @ApiResponse({
    status: 200,
    description: 'Các phiên đang hoạt động đã lấy',
    type: SessionsResponseDto,
  })
  async getActiveSessions(@Request() req: any): Promise<SessionsResponseDto> {
    const sessions = await this.authService.getActiveSessions(req.user.sub);
    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        deviceInfo: session.deviceInfo,
        lastUsedAt: session.lastUsedAt,
        createdAt: session.createdAt,
      })),
    };
  }

  @Delete('sessions/:tokenId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hủy bỏ phiên cụ thể' })
  @ApiResponse({ status: 200, description: 'Phiên đã bị hủy' })
  async revokeSession(@Param('tokenId') tokenId: number, @Request() req: any) {
    return this.authService.revokeSession(req.user.sub, tokenId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng đã lấy',
    type: UserProfileResponseDto,
  })
  async getProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    return this.authService.getProfile(req.user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng đã cập nhật' })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req: any,
  ) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thay đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Mật khẩu đã được thay đổi' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  // Admin only endpoints

  private setTokens(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Prevents client-side JS from reading the cookie
      secure: this.configService.get('NODE_ENV') === 'production', // HTTPS only in production
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax', // CSRF protection
      maxAge: 60 * 60 * 1000, // 1 hours in milliseconds
      path: '/',
      domain: `.${this.configService.get('DOMAIN') ?? 'vercel.app'}`,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      domain: `.${this.configService.get('DOMAIN') ?? 'vercel.app'}`,
    });
  }
  private clearTokens(res: Response) {
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 0,
      path: '/',
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      domain: `.${this.configService.get('DOMAIN') ?? 'vercel.app'}`,
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 0,
      path: '/',
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      domain: `.${this.configService.get('DOMAIN') ?? 'vercel.app'}`,
    });
  }
}
