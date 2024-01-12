import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service.js';
import { User } from '../user/user.entity.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService, configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('_token'),
      ]),
      secretOrKey: configService.get('APP_SECRET_KEY'),
    });
  }

  async validate(payload: Pick<User, 'id' | 'ticket'>) {
    const user: User = await this.userService.findOneBy({ id: payload.id });
    if (!user || user.ticket !== payload.ticket) {
      throw buildException(UnauthorizedException, ErrorCodeEnum.INVALID_TOKEN);
    }

    return user;
  }
}
