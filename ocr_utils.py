from pathlib import Path
from tempfile import NamedTemporaryFile

import cv2
import easyocr


_readers = {}


def get_ocr_reader(languages=None):
    """
    Create and reuse OCR readers.

    English is the default because most official scholarship and admissions
    screenshots are in English, and mixing Arabic OCR on English documents can
    reduce accuracy.
    """
    if languages is None:
        languages = ["en"]

    reader_key = tuple(languages)

    if reader_key not in _readers:
        _readers[reader_key] = easyocr.Reader(list(reader_key), gpu=False)

    return _readers[reader_key]


def preprocess_image(image_path):
    """
    Improve image readability before OCR.
    """
    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError(f"Could not read image: {image_path}")

    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    height, width = grayscale.shape

    if width < 1200:
        scale_factor = 1200 / width
        grayscale = cv2.resize(
            grayscale,
            None,
            fx=scale_factor,
            fy=scale_factor,
            interpolation=cv2.INTER_CUBIC,
        )

    with NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        processed_path = temp_file.name
        cv2.imwrite(processed_path, grayscale)

    return processed_path


def extract_text_from_image(image_path, languages=None):
    """
    Extract text from an uploaded image using EasyOCR.
    """
    if not image_path:
        return ""

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    processed_path = preprocess_image(path)

    reader = get_ocr_reader(languages=languages)
    results = reader.readtext(processed_path, detail=0, paragraph=True)

    extracted_text = "\n".join(results).strip()

    return extracted_text