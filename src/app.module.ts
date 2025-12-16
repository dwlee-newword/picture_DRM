import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SampleModule } from './modules/sample/sample.module';

import { UsersModule } from './modules/users/users.module';
import { ImagesModule } from './modules/images/images.module';
import { FilesModule } from './modules/files/files.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [SampleModule, UsersModule, ImagesModule, FilesModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
