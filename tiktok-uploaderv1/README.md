<p align="center">
<h1 align="center"> ⬆️ TikTok Video Yükleyici </h1>
<p align="center">Selenium tabanlı otomatik TikTok video yükleme aracı - Modern GUI ve CLI desteği</p>
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-blue.svg" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg" />
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg" />
</p>

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
  - [Gereksinimler](#gereksinimler)
  - [PyPI ile Kurulum](#pypi-ile-kurulum)
  - [Kaynak Koddan Kurulum](#kaynak-koddan-kurulum)
- [Kullanım](#kullanım)
  - [🖥️ Grafik Arayüz (GUI)](#grafik-arayüz-gui)
  - [💻 Komut Satırı (CLI)](#komut-satırı-cli)
  - [📝 Python API](#python-api)
- [Özellikler](#özellikler-detay)
  - [Video Yükleme](#video-yükleme)
  - [Çoklu Video Yükleme](#çoklu-video-yükleme)
  - [Zamanlama](#zamanlama)
  - [Proxy Desteği](#proxy-desteği)
  - [Özel Kapak Resmi](#özel-kapak-resmi)
  - [Ürün Bağlantısı](#ürün-bağlantısı)
  - [Kimlik Doğrulama](#kimlik-doğrulama)
- [Örnekler](#örnekler)
- [Notlar](#notlar)
- [Lisans](#lisans)

## ✨ Özellikler

- 🎯 **Kolay Kullanım**: Basit ve kullanıcı dostu arayüz
- 🖥️ **Modern GUI**: CustomTkinter ile modern grafik arayüz
- 💻 **CLI Desteği**: Komut satırından kullanım
- 📹 **Toplu Yükleme**: Birden fazla video aynı anda yükleme
- ⏱️ **Zamanlama**: Videoları belirli bir zamanda yayınlama
- 🔐 **Güvenli Kimlik Doğrulama**: Cookie tabanlı kimlik doğrulama
- 🌐 **Proxy Desteği**: Proxy üzerinden yükleme
- 🎨 **Özelleştirilebilir**: Açıklama, hashtag, mention desteği
- 📊 **Detaylı Loglama**: Yükleme sürecini takip etme

## 📦 Kurulum

### Gereksinimler

- Python 3.10 veya üzeri
- [Selenium uyumlu web tarayıcı](https://www.selenium.dev/documentation/webdriver/getting_started/install_drivers/) (Google Chrome önerilir)
- TikTok hesabı ve cookies.txt dosyası

### PyPI ile Kurulum

```bash
pip install tiktok-uploader
```

### Kaynak Koddan Kurulum

Önce [`uv`](https://docs.astral.sh/uv/getting-started/installation/) paket yöneticisini kurun:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ardından repository'yi klonlayın ve projeyi çalıştırın:

```bash
git clone https://github.com/zehedisode/tiktok-uploaderv1.git
cd tiktok-uploaderv1
uv run tiktok-uploader
```

## 🚀 Kullanım

### 🖥️ Grafik Arayüz (GUI)

En kolay kullanım yöntemi modern GUI uygulamasıdır.

**Özellikler:**
- 🎯 Basit ve kullanıcı dostu arayüz
- 📁 Otomatik cookies.txt algılama
- 📹 Çoklu video yükleme desteği
- ✏️ Her video için ayrı açıklama
- ⏱️ Yüklemeler arası rastgele gecikme (yapılandırılabilir)
- 📊 Gerçek zamanlı yükleme durumu ve loglama
- ✅ Her video için başarı/başarısızlık takibi

**Kullanım:**

```bash
cd tiktok-uploader
python gui_app.py
```

veya

```bash
py gui_app.py
```

**Gereksinimler:**
- Python 3.7+
- CustomTkinter (eksikse otomatik yüklenir)

### 💻 Komut Satırı (CLI)

CLI kullanımı çok basittir:

```bash
tiktok-uploader -v video.mp4 -d "bu benim açıklamam" -c cookies.txt
```

### 📝 Python API

#### Tek Video Yükleme

```python
from tiktok_uploader.upload import upload_video

upload_video(
    'video.mp4',  # Video dosya yolu
    description='Bu benim açıklamam #fyp #tiktok',  # Video açıklaması
    cookies='cookies.txt',  # Cookies dosyası
)
```

#### Çoklu Video Yükleme

```python
from tiktok_uploader.upload import upload_videos
from tiktok_uploader.auth import AuthBackend

videos = [
    {
        'path': 'video1.mp4',
        'description': 'İlk video açıklaması'
    },
    {
        'path': 'video2.mp4',
        'description': 'İkinci video açıklaması'
    }
]

auth = AuthBackend(cookies='cookies.txt')
failed_videos = upload_videos(videos=videos, auth=auth)

for video in failed_videos:
    print(f"{video['path']} yüklenemedi")
```

## 🔧 Özellikler Detay

### Video Yükleme

Temel video yükleme fonksiyonu:

```python
upload_video(
    filename='video.mp4',
    description='Video açıklaması',
    cookies='cookies.txt'
)
```

### Çoklu Video Yükleme

Birden fazla videoyu aynı anda yükleyin:

```python
videos = [
    {'path': 'video1.mp4', 'description': 'Açıklama 1'},
    {'path': 'video2.mp4', 'description': 'Açıklama 2'}
]
upload_videos(videos=videos, auth=auth)
```

### Zamanlama

Videoyu belirli bir zamanda yayınlamak için:

```python
import datetime

schedule = datetime.datetime(2024, 12, 25, 20, 0)  # UTC zaman dilimi
upload_video('video.mp4', schedule=schedule, cookies='cookies.txt')
```

**Not:** Zamanlama en az 20 dakika sonrası, en fazla 10 gün sonrası olmalıdır.

### Proxy Desteği

Proxy üzerinden yükleme yapmak için:

```python
# Kullanıcı adı ve şifre ile proxy
proxy = {'user': 'kullanici', 'pass': 'sifre', 'host': '111.111.111.111', 'port': '8080'}

# Sadece host ve port ile proxy
proxy = {'host': '111.111.111.111', 'port': '8080'}

upload_video('video.mp4', proxy=proxy, cookies='cookies.txt')
```

### Özel Kapak Resmi

Videoya özel kapak resmi eklemek için:

```python
upload_video('video.mp4', cover='kapak.jpg', cookies='cookies.txt')
```

**Desteklenen formatlar:** `.png`, `.jpeg`, `.jpg`

### Ürün Bağlantısı

Videoya ürün bağlantısı eklemek için:

```bash
tiktok-uploader -v video.mp4 -d "açıklama" -c cookies.txt --product-id URUN_ID
```

```python
upload_video('video.mp4', product_id='URUN_ID', cookies='cookies.txt')
```

### Kimlik Doğrulama

Kimlik doğrulama için TikTok cookies'lerinize ihtiyacınız var. Cookies'i almak için:

1. [🍪 Get cookies.txt](https://github.com/kairi003/Get-cookies.txt-LOCALLY) eklentisini yükleyin
2. TikTok.com'da eklentiyi açın
3. `Export As ⇩` seçeneğini kullanarak cookies.txt dosyasını kaydedin

```python
upload_video('video.mp4', cookies='cookies.txt')
```

## 📚 Örnekler

Proje içinde çeşitli örnekler bulunmaktadır:

- **[basic_upload.py](examples/basic_upload.py)**: Tek video yükleme örneği
- **[multiple_videos_at_once.py](examples/multiple_videos_at_once.py)**: Çoklu video yükleme örneği
- **[series_upload.py](examples/series_upload.py)**: CSV dosyasından seri yükleme örneği
- **[private_upload.py](examples/private_upload.py)**: Gizli video yükleme örneği

## ⚠️ Notlar

- Bu bot **%100 güvenilir değildir**. Çok fazla yükleme yapıldığında TikTok tarafından engellenebilir.
- Testlerde, birkaç saat beklemek sorunu çözmüştür.
- Bu aracı bir **spam botu** olarak değil, **zamanlanmış yükleyici** olarak düşünün.
- Hashtag ve mention'ların doğru çalışması için sonlarında boşluk olmalıdır.

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen önce bir issue açın veya pull request gönderin.

## ⭐ Destek

Bu projeyi beğendiyseniz, GitHub'da yıldız vermeyi unutmayın! ❤️

---

**Not:** Bu araç eğitim amaçlıdır. TikTok'un kullanım şartlarına uygun kullanın.
