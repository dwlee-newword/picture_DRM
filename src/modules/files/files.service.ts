import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FilesService {
  uploadFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return files.map((f) => ({
      originalName: f.originalname,
      filename: f.filename ?? null,
      mimetype: f.mimetype,
      size: f.size,
      // 정적 서빙은 main.ts에서 '/uploads'로 설정되어 있음
      url: f.filename ? `/uploads/${f.filename}` : null,
      // 필요하면 저장된 절대 경로도 반환 가능:
      // path: (f as any).path ?? null,
    }));
  }
}
