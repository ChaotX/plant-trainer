from pathlib import Path
from io import BytesIO
import yaml
import re
import sys
import os

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload


if len(sys.argv) != 2:
    raise SystemExit(
        ("Usage: python main.py <google-drive-folder-id-or-url>"
         " Also provide GOOGLE_API_KEY envar.")
    )

arg = sys.argv[1]

m = re.search(r"/folders/([a-zA-Z0-9_-]+)", arg)

if m:
    ROOT_FOLDER_ID = m.group(1)
else:
    ROOT_FOLDER_ID = arg
    
API_KEY = os.environ["GOOGLE_API_KEY"]


# ------------------------------------------------------------------------------
# PATHS
# ------------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

LINKS_YAML = REPO_ROOT / "links.yaml"

# ------------------------------------------------------------------------------
# GOOGLE DRIVE
# ------------------------------------------------------------------------------

service = build("drive", "v3", developerKey=API_KEY)


def download_text_file(file_id):
    request = service.files().get_media(fileId=file_id)
    fh = BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    return fh.getvalue().decode("utf-8")


def walk_folder(folder_id, prefix=""):
    """
    Returns:
    {
        "folder/file.jpg": {
            "id": "...",
            "mimeType": "...",
        }
    }
    """
    result = {}

    page_token = None

    while True:
        response = service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="nextPageToken,files(id,name,mimeType)",
            pageToken=page_token,
        ).execute()

        for item in response["files"]:
            name = item["name"]

            if item["mimeType"] == "application/vnd.google-apps.folder":
                result.update(
                    walk_folder(
                        item["id"],
                        f"{prefix}{name}/",
                    )
                )
            else:
                result[f"{prefix}{name}"] = {
                    "id": item["id"],
                    "mimeType": item["mimeType"],
                }

        page_token = response.get("nextPageToken")

        if not page_token:
            break

    return result


def download_text_file(file_id):
    request = service.files().get_media(fileId=file_id)

    fh = BytesIO()

    downloader = MediaIoBaseDownload(fh, request)

    done = False

    while not done:
        _, done = downloader.next_chunk()

    return fh.getvalue()


# ------------------------------------------------------------------------------
# YAML PROCESSING
# ------------------------------------------------------------------------------

def collect_image_paths(plants):
    result = set()

    for plant in plants:
        for image in plant.get("images", []):
            result.add(image)

    return result


# ------------------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------------------

print("Scanning Google Drive...")

drive_files = walk_folder(ROOT_FOLDER_ID)

print(f"Found {len(drive_files)} files")

# ------------------------------------------------------------------------------
# Find plants.yaml
# ------------------------------------------------------------------------------

plants_yaml_path = None
plants_yaml_file_id = None

for path, metadata in drive_files.items():
    if Path(path).name == "plants.yaml":
        plants_yaml_path = path
        plants_yaml_file_id = metadata["id"]
        break

if plants_yaml_file_id is None:
    raise RuntimeError("plants.yaml not found in Google Drive")

print(f"Found plants.yaml: {plants_yaml_path}")

# ------------------------------------------------------------------------------
# Download plants.yaml
# ------------------------------------------------------------------------------

plants_yaml_content = download_text_file(plants_yaml_file_id)

plants = yaml.safe_load(plants_yaml_content)

required_images = collect_image_paths(plants)

print(f"Found {len(required_images)} referenced images")

# ------------------------------------------------------------------------------
# Build image links
# ------------------------------------------------------------------------------

image_links = {}

for image_path in sorted(required_images):
    filename = Path(image_path).name

    matches = [
        (path, metadata["id"])
        for path, metadata in drive_files.items()
        if Path(path).name == filename
    ]

    if not matches:
        print(f"WARNING: Missing image: {image_path}")
        continue

    drive_path, file_id = matches[0]

    image_links[image_path] = (
        f"https://drive.google.com/uc?export=view&id={file_id}"
    )

# ------------------------------------------------------------------------------
# Output
# ------------------------------------------------------------------------------

share_link = (
    f"https://drive.google.com/drive/folders/{ROOT_FOLDER_ID}"
)

output = {
    "sources": {
        share_link: {
            "plants_yaml":
                f"https://drive.google.com/uc?export=download&id={plants_yaml_file_id}",
            "images": image_links,
        }
    }
}

with open(LINKS_YAML, "w", encoding="utf-8") as f:
    yaml.safe_dump(
        output,
        f,
        allow_unicode=True,
        sort_keys=False,
    )

print()
print(f"Generated: {LINKS_YAML}")
print(f"Images linked: {len(image_links)}")