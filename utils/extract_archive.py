import os
import sys
import zipfile
import rarfile


def extract_archive(archive_path, output_dir):
    """
    解壓縮 zip 或 rar 檔案到指定資料夾
    """
    ext = os.path.splitext(archive_path)[1].lower()

    extractor_classes = {
        '.zip': zipfile.ZipFile,
        '.rar': rarfile.RarFile
    }

    if ext not in extractor_classes:
        raise ValueError(f'Unsupported archive type: {ext}')

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with extractor_classes[ext](archive_path, 'r') as archive:
        archive.extractall(output_dir)


if __name__ == '__main__':
    archive_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'extracted_images'
    extract_archive(archive_path, output_dir)
