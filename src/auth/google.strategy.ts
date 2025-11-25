import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GoogleProfile {
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.getOrThrow<string>('OAUTH_GOOGLE_CLIENT_ID');
    const clientSecret = configService.getOrThrow<string>(
      'OAUTH_GOOGLE_CLIENT_SECRET',
    );
    const callbackURL = configService.getOrThrow<string>(
      'OAUTH_GOOGLE_CALLBACK_URL',
    );
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'https://www.googleapis.com/auth/drive.file'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
  ): Promise<any> {
    const emails = profile.emails;
    if (!emails || emails.length === 0 || !emails[0].value) {
      throw new BadRequestException(
        'Google 프로필에서 이메일을 찾을 수 없습니다',
      );
    }

    const user = {
      email: emails[0].value,
      accessToken,
    };

    return user;
  }
}
