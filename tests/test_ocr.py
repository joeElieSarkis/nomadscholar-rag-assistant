import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from ocr_utils import extract_text_from_image


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    image_path = input("Enter image path: ").strip().strip('"')

    extracted_text = extract_text_from_image(image_path)

    print("\nExtracted text:")
    print("=" * 80)

    if extracted_text:
        print(extracted_text)
    else:
        print("No text detected.")
