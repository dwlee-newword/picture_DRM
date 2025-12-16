import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { extname, join, resolve as pathResolve } from 'path';
import * as fs from 'fs';
import archiver from 'archiver';
import { spawn } from 'child_process';

@Injectable()
export class ImagesService {
  async uploadImages(files: Express.Multer.File[]) {
    const uploadsDir = pathResolve(
      process.cwd(),
      'uploads',
      files[0]?.destination.split('/').pop() || '',
    );
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

    const watermarkedDir = uploadsDir + '_watermarked';
    await fs.promises.mkdir(watermarkedDir, { recursive: true });
    await this.addInvisibleWatermark(uploadsDir, watermarkedDir, 'secret');
    await this.decodeInvisibleWatermark(watermarkedDir, 6);

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

  async addInvisibleWatermark(
    inputPath: string,
    outputPath: string,
    secretText: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // 스크립트 절대 경로 설정
      const scriptPath = pathResolve(
        process.cwd(),
        'scripts',
        'encode_watermark.py',
      );

      // Python 프로세스 실행
      // 가상환경 사용 시 'python3' 대신 가상환경의 python 경로 입력 (예: 'venv/bin/python')
      const processRef = spawn('python3', [
        scriptPath, // 스크립트 파일
        inputPath, // 인자 1: 원본 경로
        outputPath, // 인자 2: 저장 경로
        secretText, // 인자 3: 숨길 텍스트
      ]);

      let errorData = '';

      processRef.stdout.on('data', (data) => {
        // Python의 print() 출력값 확인 (디버깅용)
        console.log(`Python Output: ${data}`);
      });

      processRef.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      processRef.on('close', (code) => {
        if (code !== 0) {
          console.error(`Watermark Error: ${errorData}`);
          reject(new InternalServerErrorException('워터마크 삽입 실패'));
        } else {
          resolve(outputPath); // 성공 시 저장된 경로 반환
        }
      });
    });
  }

  async decodeInvisibleWatermark(
    imagePath: string,
    length: number = 36,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = pathResolve(
        process.cwd(),
        'scripts',
        'decode_watermark.py',
      );

      const pythonProcess = spawn('python3', [
        scriptPath,
        imagePath,
        length.toString(), // 예상 글자 수 전달
      ]);

      let resultText = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        resultText += data.toString();
        console.log(`Python Output: ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Decode Error: ${errorData}`);
          reject(new InternalServerErrorException('워터마크 추출 실패'));
        } else {
          // 결과값의 공백/줄바꿈 제거 후 반환
          resolve(resultText.trim());
        }
      });
    });
  }
}
