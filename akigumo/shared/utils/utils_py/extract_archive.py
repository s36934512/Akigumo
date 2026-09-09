import os
import rarfile
import zipfile
import sys

EXTRACTOR_CLASSES = {
    '.zip': zipfile.ZipFile,
    '.rar': rarfile.RarFile
}


def get_archive_members(archive, ext):
    """
    根據壓縮檔型態取得所有檔名
    """
    if ext == '.zip':
        return archive.namelist()
    elif hasattr(archive, 'namelist'):
        return archive.namelist()
    elif hasattr(archive, 'infolist'):
        return [f.filename for f in archive.infolist()]
    else:
        raise ValueError('Unknown archive format or missing method')


def is_within_directory(directory, target):
    abs_directory = os.path.abspath(directory)
    abs_target = os.path.abspath(target)
    return os.path.commonpath([abs_directory]) == os.path.commonpath([abs_directory, abs_target])


def extract_archive(archive_path, output_dir):
    """
    解壓縮 zip 或 rar 檔案到指定資料夾
    """
    ext = os.path.splitext(archive_path)[1].lower()

    if ext not in EXTRACTOR_CLASSES:
        raise ValueError(f'Unsupported archive type: {ext}')

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with EXTRACTOR_CLASSES[ext](archive_path, 'r') as archive:
        members = get_archive_members(archive, ext)
        for member in members:
            member_path = os.path.join(output_dir, member)
            if not is_within_directory(output_dir, member_path):
                raise Exception(
                    f"Security Alert: Attempted Path Traversal in archive file: {member}")
        archive.extractall(output_dir)


if __name__ == '__main__':
    archive_path = sys.argv[1]
    output_dir = sys.argv[2] if len(
        sys.argv) > 2 else archive_path + '_extracted'

    extract_archive(archive_path, output_dir)
    print('{"success": true}')
