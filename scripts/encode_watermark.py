# scripts/encode_watermark.py
import sys
import cv2
import os
from imwatermark import WatermarkEncoder

def embed_watermark(original_dir, output_dir, secret_text):
    print(f"encoded string", secret_text)
    # original_dir의 모든 파일 처리
    if not os.path.isdir(original_dir):
        print(f"Error: {original_dir} is not a directory")
        sys.exit(1)
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for file in os.listdir(original_dir):
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff')):
            input_path = os.path.join(original_dir, file)
            output_path = os.path.join(output_dir, file)
            embed_single_file(input_path, output_path, secret_text)

def embed_single_file(input_path, output_path, secret_text):
    # 1. 이미지 로드
    bgr_image = cv2.imread(input_path)
    if bgr_image is None:
        print(f"Error: 이미지를 불러올 수 없습니다. 경로: {input_path}")
        return

    try:
        # 2. 인코더 초기화
        encoder = WatermarkEncoder()
        
        # 3. 숨길 데이터 설정 (문자열 -> 바이트 변환)
        # 주의: 텍스트가 너무 길면 이미지가 깨지거나 인코딩에 실패할 수 있습니다.
        wm_payload = secret_text.encode('utf-8')
        encoder.set_watermark('bytes', wm_payload)

        # 4. 워터마크 적용 (알고리즘: dwtDct - 견고함)
        encoded_image = encoder.encode(bgr_image, 'dwtDctSvd')

        # 5. 결과 저장 (압축 손실을 막기 위해 가급적 png 권장)
        cv2.imwrite(output_path, encoded_image)
        
        print(f"Success: {output_path}")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Node.js에서 전달받는 인자 순서:
    # [1]: 원본 디렉토리 경로
    # [2]: 저장할 디렉토리 경로
    # [3]: 숨길 텍스트
    if len(sys.argv) < 4:
        print("Usage: python encode_watermark.py <input_dir> <output_dir> <text>")
        sys.exit(1)

    embed_watermark(sys.argv[1], sys.argv[2], sys.argv[3])