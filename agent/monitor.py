import os
import hashlib
import time
import json
import requests
import datetime

# Configuration
BACKEND_URL = "http://localhost:3000/api/metadata/upload"
USER_ID = 1
SCAN_DIRECTORIES = ["/Users/Shared", "/tmp"] # Example paths

def get_file_hash(filepath):
    """Generate SHA256 hash for a file."""
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except:
        return None

def scan_files(directories):
    """Scan directories for file metadata."""
    metadata_list = []
    for directory in directories:
        for root, dirs, files in os.walk(directory):
            for name in files:
                filepath = os.path.join(root, name)
                try:
                    stats = os.stat(filepath)
                    metadata = {
                        "name": name,
                        "path": filepath,
                        "size": stats.st_size,
                        "type": os.path.splitext(name)[1],
                        "lastAccessed": datetime.datetime.fromtimestamp(stats.st_atime).isoformat(),
                        "hash": get_file_hash(filepath)
                    }
                    metadata_list.append(metadata)
                except:
                    continue
    return metadata_list

def main():
    print(f"[{datetime.datetime.now()}] DataDetox Agent: Starting Scan...")
    files = scan_files(SCAN_DIRECTORIES)
    print(f"[{datetime.datetime.now()}] DataDetox Agent: Scan Complete. Found {len(files)} files.")
    
    payload = {
        "userId": USER_ID,
        "files": files
    }
    
    try:
        response = requests.post(BACKEND_URL, json=payload)
        if response.status_code == 200:
            print(f"[{datetime.datetime.now()}] DataDetox Agent: Metadata successfully synchronized with Neural Backend.")
        else:
            print(f"[{datetime.datetime.now()}] DataDetox Agent: Synchronization failed. Status: {response.status_code}")
    except Exception as e:
        print(f"[{datetime.datetime.now()}] DataDetox Agent: Network Error: {e}")

if __name__ == "__main__":
    main()
