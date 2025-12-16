# scripts/decode_watermark.py
import sys
import cv2
import os
from imwatermark import WatermarkDecoder

def extract_watermark(original_dir, text_length=36):
    # original_dir의 모든 파일 처리
    if not os.path.isdir(original_dir):
        print(f"Error: {original_dir} is not a directory")
        sys.exit(1)
    
    for file in os.listdir(original_dir):
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff')):
            input_path = os.path.join(original_dir, file)
            extract_single_file(input_path, text_length)

def extract_single_file(image_path, text_length):
    bgr_image = cv2.imread(image_path)
    if bgr_image is None:
        print(f"Error: 이미지를 불러올 수 없습니다. 경로: {image_path}")
        return

    try:
        # 1. 디코더 초기화
        # 'bytes': 바이트 단위 데이터
        # length: 읽어올 데이터의 비트 수 (글자수 * 8비트)
        # 예: UUID(36자) = 36 * 8 = 288 bits
        decoder = WatermarkDecoder('bytes', text_length * 8)

        # 2. 워터마크 추출 (인코딩과 동일한 'dwtDct' 알고리즘 사용)
        watermark = decoder.decode(bgr_image, 'dwtDctSvd')

        # 3. 바이트를 문자열로 변환
        if watermark:
            print(f"Raw watermark bytes: {watermark} (length: {len(watermark)})")
            try:
                decoded_text = watermark.decode('utf-8').rstrip('\x00')
                print(f"Decoded text (strict): {decoded_text}")
            except UnicodeDecodeError as e:
                print(f"UTF-8 decode error: {e}")
                decoded_text = watermark.decode('utf-8', errors='ignore').rstrip('\x00')
                print(f"Decoded text (ignore errors): {decoded_text}")
        else:
            print(f"{image_path}: No watermark found")

    except Exception as e:
        print(f"Error in {image_path}: {str(e)}")

if __name__ == "__main__":
    # [1]: 이미지 디렉토리 경로
    # [2]: (선택) 예상 글자 수 (기본값 36)
    if len(sys.argv) < 2:
        print("Usage: python decode_watermark.py <input_dir> [length]")
        sys.exit(1)
    input_dir = sys.argv[1]
    # 인자로 길이가 들어오면 사용, 없으면 36(UUID 길이) 가정
    expected_len = int(sys.argv[2]) if len(sys.argv) > 2 else 36

    extract_watermark(input_dir, expected_len)