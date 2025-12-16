import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { ImagesService } from './images.service';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';

interface RequestWithUploadDir extends Express.Request {
  uploadDir?: string;
}

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('/upload')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Array of image files',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const request = req as RequestWithUploadDir;
          if (!request.uploadDir) {
            const randomDir = Math.floor(Math.random() * 1e10)
              .toString()
              .padStart(10, '0');
            request.uploadDir = `./uploads/${randomDir}`;
            mkdirSync(request.uploadDir, { recursive: true });
          }
          callback(null, request.uploadDir);
        },
        filename: (_req, file, callback) => {
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const fileExtName = extname(file.originalname);
          callback(null, `${name}${fileExtName}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return await this.imagesService.uploadImages(files);
  }
}
