import { Injectable } from '@nestjs/common';
// import request from 'express';

interface logined_user {
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  private readonly users = [
    {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  ];

  findByEmail(email: string | undefined): logined_user | undefined {
    return this.users.find((user) => user.email === email);
  }

  createUser(user: any): logined_user {
    this.users.push(user as logined_user);
    return user as logined_user;
  }
}
