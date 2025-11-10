"""TikTok Video Yukleme Ornegi"""

from tiktok_uploader.upload import upload_video

# Tek video yukleme
upload_video(
    'Cukur_1._Bolum_part1.mp4',  # Video dosya yolu
    description='Cukur 1. Bolum Part 1 #cukur #dizi #turkish #fyp',  # Video aciklamasi
    cookies='cookies.txt',  # Cookies dosyasi
)

