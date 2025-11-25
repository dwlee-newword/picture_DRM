import { Controller, Get } from '@nestjs/common';

@Controller('Users')
export class UsersController {
  //   constructor(private readonly usersService: UsersService) {}

  @Get()
  temp(): string {
    return 'This is Users Controller';
  }
}
