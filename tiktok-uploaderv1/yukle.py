"""TikTok Video Yukleme Scripti"""

from tiktok_uploader.upload import upload_video

if __name__ == "__main__":
    print("Video yukleniyor...")
    print("Dosya: Cukur_1._Bolum_part1.mp4")
    print("Tarayici acilacak, lutfen bekleyin...\n")
    
    try:
        failed_videos = upload_video(
            'Cukur_1._Bolum_part1.mp4',
            description='Cukur 1. Bolum Part 1 #cukur #dizi #turkish #fyp',
            cookies='cookies.txt',
        )
        
        if failed_videos:
            print(f"\n[HATA] Video yuklenemedi!")
            for video in failed_videos:
                print(f"  - {video.get('path', 'Bilinmeyen dosya')}")
        else:
            print("\n[OK] Video basariyla yuklendi!")
    except Exception as e:
        print(f"\n[HATA] Yukleme basarisiz: {e}")
        import traceback
        traceback.print_exc()

