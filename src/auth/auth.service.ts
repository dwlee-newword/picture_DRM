import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../modules/users/users.service';
import express from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  googleLogin(req: express.Request): any {
    if (!req.user) {
      return 'No user from google';
    }

    let user = this.usersService.findByEmail(req.user['email']);
    if (!user) {
      user = this.usersService.createUser(req.user);
    }

    const payload = { email: user.email, sub: user.firstName };
    return {
      message: 'User information from google',
      user,
      token: this.jwtService.sign(payload),
    };
  }
}
