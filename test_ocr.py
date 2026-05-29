from ocr_utils import extract_text_from_image


if __name__ == "__main__":
    image_path = input("Enter image path: ").strip().strip('"')

    extracted_text = extract_text_from_image(image_path)

    print("\nExtracted text:")
    print("=" * 80)

    if extracted_text:
        print(extracted_text)
    else:
        print("No text detected.")