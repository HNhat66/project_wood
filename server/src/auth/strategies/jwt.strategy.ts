import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService, JwtPayload } from '../auth.service';
import { UsersService } from 'src/users/users.service';
import { UserStatus } from 'src/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.getUserById(payload.sub, true);
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.',
      );
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
