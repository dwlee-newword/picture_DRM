import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { extname, join } from 'path';
import * as fs from 'fs';
import archiver from 'archiver';

@Injectable()
export class ImagesService {
  async uploadImages(files: Express.Multer.File[]) {
    // uploads 디렉터리 준비
    const uploadsPath = join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsPath, { recursive: true });

    // ZIP 파일명 생성
    const zipName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.zip`;
    const zipPath = join(uploadsPath, zipName);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    for (const file of files) {
      // diskStorage 사용 시 file.path 존재 -> 파일 스트림으로 추가
      if (file.path) {
        archive.file(file.path, { name: file.originalname });
      } else if (file.buffer) {
        // memoryStorage 사용 시 buffer로 추가
        archive.append(file.buffer, { name: file.originalname });
      } else {
        // 파일 정보가 부족하면 이름만 빈 파일로 추가 (드물게 발생)
        archive.append('', { name: file.originalname });
      }
    }

    // finalize와 완료 대기
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));
      archive.finalize().catch(reject);
    });

    const stats = await fs.promises.stat(zipPath);

    // 반환: 하나의 zip 파일 메타 + 원본 파일 목록
    return {
      zipName,
      zipUrl: `/uploads/${zipName}`,
      size: stats.size,
      files: files.map((f) => f.originalname),
    };
  }

  filename(
    _req: Request,
    file: Express.Multer.File,
    callback: (err: Error | null, filename: string) => void,
  ) {
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtName = extname(file.originalname);
    callback(null, `${name}${fileExtName}`);
  }

  fileFilter(
    _req: Request,
    file: Express.Multer.File,
    callback: (err: Error | null, acceptFile: boolean) => void,
  ) {
    if (!file.mimetype.startsWith('image/')) {
      return callback(
        new BadRequestException('Only image files are allowed'),
        false,
      );
    }
    callback(null, true);
  }
}
