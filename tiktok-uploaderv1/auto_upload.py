#!/usr/bin/env python3
"""Otomatik TikTok Video Yükleyici - Converter'dan çağrılır"""

import sys
import os
from pathlib import Path

# Proje root'unu path'e ekle
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from tiktok_uploader.upload import upload_videos
from tiktok_uploader.auth import AuthBackend

def main():
    if len(sys.argv) < 2:
        print("Kullanım: python auto_upload.py <klasor_yolu>")
        sys.exit(1)
    
    folder_path = sys.argv[1]
    
    if not os.path.isdir(folder_path):
        print(f"Hata: Klasör bulunamadı: {folder_path}")
        sys.exit(1)
    
    # Klasördeki tüm video dosyalarını bul
    video_files = []
    video_extensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv']
    folder = Path(folder_path)
    for video_file in folder.iterdir():
        if video_file.is_file() and video_file.suffix.lower() in video_extensions:
            video_files.append(video_file)
    
    if not video_files:
        print(f"Klasörde video dosyası bulunamadı: {folder_path}")
        sys.exit(1)
    
    # Video listesi oluştur
    videos = []
    for video_file in sorted(video_files):
        videos.append({
            'path': str(video_file),
            'description': f"#{Path(video_file).stem.replace(' ', '')}"
        })
    
    print(f"{len(videos)} video bulundu. Yükleniyor...")
    
    # Cookies dosyasını bul
    cookies_file = Path(project_root) / 'cookies.txt'
    if not cookies_file.exists():
        # Bir üst dizinde ara
        cookies_file = Path(project_root).parent / 'cookies.txt'
    
    if not cookies_file.exists():
        print("Hata: cookies.txt dosyası bulunamadı!")
        print("Lütfen cookies.txt dosyasını proje klasörüne koyun.")
        sys.exit(1)
    
    # Auth backend oluştur
    auth = AuthBackend(cookies=str(cookies_file))
    
    # Videoları yükle
    failed_videos = upload_videos(videos=videos, auth=auth)
    
    if failed_videos:
        print(f"\n{len(failed_videos)} video yüklenemedi:")
        for video in failed_videos:
            print(f"  - {video.get('path', 'Bilinmeyen')}")
    else:
        print("\nTüm videolar başarıyla yüklendi!")

if __name__ == '__main__':
    main()
