# 🎬 YouTube to TikTok Converter

> **Modern • Hızlı • Kullanıcı Dostu** - YouTube videolarını TikTok formatına (9:16) dönüştürün ve direkt TikTok'a yükleyin!

[![Version](https://img.shields.io/badge/version-2.0.0--dev-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com)

---

## 🎯 Hızlı Seçim (30 Saniye)

**Ne yapmak istiyorsun?**

| Ben... | Git → |
|--------|-------|
| 🆕 İlk kez kullanıyorum | [HIZLI BAŞLANGIÇ](#-hizli-başlangıç-3-dakika) |
| 📥 İndirmek istiyorum | [KURULUM](#-kurulum) |
| 🎨 Özellikleri görmek istiyorum | [ÖZELLİKLER](#-özellikler) |
| 🎵 TikTok'a yüklemek istiyorum | [TIKTOK ENTEGRASYONU](#-tiktok-entegrasyonu) |
| 🔧 Geliştirici olarak katkıda bulunmak | [GELİŞTİRİCİ REHBERİ](#-geliştirici-rehberi) |

---

## ⚡ HIZLI BAŞLANGIÇ (3 Dakika)

### 3 Basit Adım:

```
1️⃣ YouTube Linki Yapıştır
   ↓
2️⃣ Klasör Seç
   ↓
3️⃣ Başlat → Videoları Al! 🎉
```

### Örnek:
```bash
# Link
https://youtube.com/watch?v=dQw4w9WgXcQ

# Çıktı
📁 C:/Users/You/Videos/
   ├─ Video_Adi_part1.mp4 (1080x1920, 60sn)
   ├─ Video_Adi_part2.mp4 (1080x1920, 60sn)
   └─ Video_Adi_part3.mp4 (1080x1920, 45sn)
```

---

## ✨ ÖZELLİKLER

### 🎥 Video İşleme (Core)

| Özellik | Açıklama | Kalite |
|---------|----------|--------|
| **9:16 Dönüşüm** | Letterbox format (video kırpılmaz!) | ⭐⭐⭐⭐⭐ |
| **60sn Parçalama** | TikTok limit uyumlu | ⭐⭐⭐⭐⭐ |
| **1080x1920 HD** | Full HD kalitede çıktı | ⭐⭐⭐⭐⭐ |
| **Part Yazıları** | Çoklu metin katmanları | ⭐⭐⭐⭐⭐ |

### 🎨 Gelişmiş Özelleştirme

- 📝 **Sınırsız Metin Katmanları** - İstediğin kadar yazı ekle
- 🎭 **6 Font Seçeneği** - Arial, Impact, Comic Sans, Times, Verdana
- 🎨 **Tam Renk Kontrolü** - Yazı, kenar, gölge renkleri
- 📍 **Hassas Pozisyon** - Pixel-level yerleştirme
- ✨ **8 Hazır Preset** - TikTok, YouTube Shorts, Gaming...
- 👁️ **Canlı Önizleme** - Real-time değişiklik göster

### 🚀 Performans & UX

```
⚡ 90% Hızlanma      → React optimization
🔄 3 Paralel İşlem   → Queue system
💾 Akıllı Cache      → Memoization
🛡️ Crash-Proof      → ErrorBoundary
⌨️ 7 Kısayol         → Keyboard shortcuts
📊 Progress Takip    → Real-time updates
```

### 🎯 Desteklenen Platformlar

| Platform | Format | Optimizasyon |
|----------|--------|--------------|
| 🎵 TikTok | 9:16, 60sn | ✅ Tam uyumlu |
| 📺 YouTube Shorts | 9:16 | ✅ Tam uyumlu |
| 📱 Instagram Reels | 9:16 | ✅ Tam uyumlu |
| 📹 Snapchat | 9:16 | ✅ Uyumlu |

---

## 📦 KURULUM

### 📥 İndir

#### Windows (Önerilen)
```bash
# 1. İndir
YouTube-to-TikTok-Setup-2.0.0.exe (50 MB)

# 2. Çalıştır
Çift tıkla → Kurulum tamamla

# 3. Başlat
Başlat Menüsü → YouTube to TikTok
```

#### macOS
```bash
# 1. DMG İndir
YouTube-to-TikTok-2.0.0.dmg

# 2. Mount Et
Dosyayı aç → Uygulamalar klasörüne sürükle

# 3. İlk Çalıştırma
Güvenlik uyarısı → Aç
```

#### Linux
```bash
# AppImage (Önerilen)
chmod +x YouTube-to-TikTok-2.0.0.AppImage
./YouTube-to-TikTok-2.0.0.AppImage

# Veya DEB (Debian/Ubuntu)
sudo dpkg -i youtube-to-tiktok_2.0.0_amd64.deb
```

### 🔧 Geliştirici Kurulumu

```bash
# 1. Repo'yu Clone'la
git clone https://github.com/zehedisode/tiktok-video-converter.git
cd tiktok-video-converter

# 2. Dependencies Yükle
npm install

# 3. Development Modda Çalıştır
npm run electron:dev

# 4. Build Al
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## 🎵 TIKTOK ENTEGRASYONU

### TikTok'a Direkt Yükleme

V2.0.0 ile videoları direkt TikTok'a yükleyebilirsiniz!

#### Hızlı Başlangıç

1. **Video İşle**: YouTube linkini ekle ve videoyu TikTok formatına dönüştür
2. **"TikTok'a Yükle" Butonu**: İşlem tamamlandığında buton görünür
3. **Giriş Yap**: QR kod veya email ile TikTok'a giriş yap
4. **Caption Ekle**: Video açıklaması ve hashtag'ler ekle
5. **Yükle**: Otomatik olarak TikTok'a yüklenir!

#### TikTok Giriş Yöntemleri

**QR Kod ile (Önerilen) 📱**
1. Telefonunuzda TikTok uygulamasını açın
2. Profil → Menü → QR Kod
3. Bilgisayar ekranındaki QR kodu tarayın
4. Telefondan onaylayın
5. ✅ Otomatik devam edecek

**Email/Phone ile 📧**
1. "Email veya telefon ile giriş" seçin
2. Bilgilerinizi girin
3. Doğrulama kodunu girin
4. ✅ Giriş tamamlandı

#### TikTok API Kurulumu (Geliştiriciler için)

1. **Developer Portal**: https://developers.tiktok.com/
2. **Yeni App Oluştur**: "Manage Apps" → "+ Create New App"
3. **Credentials Al**: Client Key & Client Secret
4. **Redirect URI**: `http://localhost:3000/tiktok/callback`
5. **Scopes**: `user.info.basic`, `video.upload`
6. **.env Dosyası**: Credentials'ları ekle

```env
TIKTOK_CLIENT_ID=awXXXXXXXXXXXXXXXXXX
TIKTOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TIKTOK_REDIRECT_URI=http://localhost:3000/tiktok/callback
```

**Detaylı Kurulum**: [TikTok Setup Rehberi](#-tiktok-api-kurulumu-detaylı)

---

## ⌨️ KLAVYE KISAYOLLARI

### Temel Kısayollar

| Kısayol | İşlev | Açıklama |
|---------|-------|----------|
| `Ctrl + V` | Paste | Link yapıştır (otomatik focus) |
| `Ctrl + Enter` | Start | İşlemi başlat |
| `Ctrl + L` | Clear | Tümünü temizle |
| `F5` | Refresh | Uygulamayı yenile |

### Ayarlar Kısayolları

| Kısayol | İşlev | Açıklama |
|---------|-------|----------|
| `Ctrl + S` | Settings | Ayarları aç |
| `Ctrl + ,` | Settings | Ayarları aç (alternatif) |
| `Esc` | Close | Modal/pencereyi kapat |

---

## 🎭 PRESET ŞABLONLARİ

### 8 Hazır Şablon

| # | İsim | Stil | Kullanım |
|---|------|------|----------|
| 1️⃣ | **TikTok Standart** | Beyaz yazı, ortada | Genel içerik |
| 2️⃣ | **YouTube Shorts** | Kırmızı Impact font | Dikkat çekici |
| 3️⃣ | **Gaming** | Neon yeşil, üstte | Oyun videoları |
| 4️⃣ | **Komedi** | Comic Sans, renkli | Eğlenceli içerik |
| 5️⃣ | **Minimalist** | Küçük, sade | Profesyonel |
| 6️⃣ | **Bold** | Büyük, kalın | Vurgulamak için |
| 7️⃣ | **Çift Yazı** | Üst + alt | Zengin bilgi |
| 8️⃣ | **Temiz** | Yazısız | Sadece video |

---

## 🛠️ TEKNİK DETAYLAR

### Video Spesifikasyonları

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| **Çözünürlük** | 1080x1920 | Full HD, 9:16 |
| **Codec** | H.264 | Maksimum uyumluluk |
| **Profile** | High | Yüksek kalite |
| **Level** | 4.2 | TikTok uyumlu |
| **Pixel Format** | yuv420p | Platform uyumluluğu |
| **CRF** | 23 | Kalite dengesi |
| **Preset** | medium | Hız/kalite optimal |

### İşlem Akışı

```
1. YouTube URL
   ↓ (yt-dlp)
2. Video İndir (1080p)
   ↓ (ffmpeg scale+pad)
3. 9:16'ya Çevir (letterbox)
   ↓ (ffmpeg segment)
4. 60sn Parçalara Böl
   ↓ (ffmpeg drawtext)
5. Part Yazıları Ekle
   ↓
6. ✅ TikTok'a Hazır!
```

### Sistem Gereksinimleri

#### Minimum
- **OS**: Windows 10 / macOS 10.13 / Ubuntu 18.04
- **RAM**: 4 GB
- **Disk**: 5 GB boş alan
- **İnternet**: 5 Mbps

#### Önerilen
- **OS**: Windows 11 / macOS 12+ / Ubuntu 22.04
- **RAM**: 8 GB
- **Disk**: 20 GB SSD
- **İnternet**: 25 Mbps
- **CPU**: Multi-core (paralel işlem için)

---

## 🐛 SORUN GİDERME

### Sık Karşılaşılan Sorunlar

#### ❌ "Video indirilemedi"
```
Neden: YouTube rate limit / bağlantı sorunu
Çözüm:
  1. İnternet bağlantısını kontrol et
  2. 5 dakika bekle ve tekrar dene
  3. VPN kullanmayı dene
```

#### ❌ "FFmpeg bulunamadı"
```
Neden: Binary indirilmedi
Çözüm:
  1. Uygulamayı yeniden başlat (otomatik indirir)
  2. Manuel: electron/binaries/ klasörüne ffmpeg.exe koy
  3. İnternet bağlantısını kontrol et
```

#### ❌ "TikTok girişi çalışmıyor"
```
Neden: QR kod yüklenmiyor / Bot detection
Çözüm:
  1. Chrome'u güncelleyin
  2. VPN kapatın
  3. Session'ı temizleyin (Ayarlar → TikTok Session Temizle)
  4. Email ile giriş yapmayı deneyin
```

---

## 📚 GELİŞTİRİCİ REHBERİ

### Proje Yapısı

```
tiktok-video-converter/
├── electron/          # Backend (video işleme)
│   ├── main.js        # Electron ana dosyası
│   ├── preload.js     # IPC köprüsü
│   └── utils/         # Video işleme fonksiyonları
├── src/               # Frontend (React UI)
│   ├── App.jsx        # Ana component
│   └── components/    # UI bileşenleri
├── public/            # Statik dosyalar
└── package.json       # Proje ayarları
```

### Önemli Dosyalar

| Dosya | Açıklama | Öncelik |
|-------|----------|---------|
| `src/App.jsx` | Ana state yönetimi | 🔥🔥🔥 |
| `electron/main.js` | Electron pencere yönetimi | 🔥🔥 |
| `electron/utils/videoProcessor.js` | Video işleme orkestrasyonu | 🔥🔥 |
| `electron/utils/ffmpegHelper.js` | FFmpeg komutları | 🔥 |

### Yeni Özellik Ekleme

1. **Frontend'de UI Ekle**
   ```javascript
   // src/App.jsx veya yeni component
   <button onClick={handleYeniOzellik}>
     Yeni Özellik
   </button>
   ```

2. **IPC Channel Ekle**
   ```javascript
   // electron/preload.js
   yeniOzellik: () => ipcRenderer.invoke('yeni-ozellik')
   
   // electron/main.js
   ipcMain.handle('yeni-ozellik', async () => {
     // İşlem yap
   })
   ```

3. **Backend'de İşle**
   ```javascript
   // electron/utils/ altında yeni fonksiyon
   function yeniOzellikIslemi() {
     // Kod buraya
   }
   ```

### TikTok API Kurulumu (Detaylı)

#### Adım 1: Developer Hesabı Oluştur
1. https://developers.tiktok.com/ adresine git
2. TikTok hesabınla giriş yap
3. Developer Terms'i kabul et
4. Email doğrulaması yap

#### Adım 2: App Oluştur
1. "Manage Apps" → "+ Create New App"
2. App bilgilerini doldur:
   - **App Name**: YouTube to TikTok Converter
   - **App Type**: Desktop Application
   - **Redirect URI**: `http://localhost:3000/tiktok/callback`

#### Adım 3: Credentials Al
1. App detaylarından **Client Key** ve **Client Secret** kopyala
2. `.env` dosyası oluştur:
   ```env
   TIKTOK_CLIENT_ID=awXXXXXXXXXXXXXXXXXX
   TIKTOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TIKTOK_REDIRECT_URI=http://localhost:3000/tiktok/callback
   ```

#### Adım 4: Scopes Ayarla
- `user.info.basic` - Kullanıcı bilgileri
- `video.upload` - Video yükleme yetkisi

---

## 📊 CHANGELOG

### V2.0.0-dev (Geliştirme Aşamasında)

#### ✨ Yeni Özellikler
- ✅ TikTok OAuth 2.0 Authentication
- ✅ Video Upload API entegrasyonu
- ✅ QR kod ve email giriş desteği
- ✅ Session management (otomatik giriş)
- ✅ Çoklu dosya yükleme
- ✅ Real-time upload progress

#### 🐛 Düzeltmeler
- ✅ Audio stream kaybolma sorunu düzeltildi
- ✅ `handleClearAll` initialization hatası
- ✅ React Hook bağımlılık sıralaması düzeltildi
- ✅ 27 lint sorunu düzeltildi

#### ⚡ Performans
- ✅ FFmpeg timeout mekanizmaları (3-10 dakika)
- ✅ Memory leak önleme
- ✅ Process cleanup handlers
- ✅ Vite build optimizasyonu

#### 🔒 Güvenlik
- ✅ nodeIntegration: false
- ✅ contextIsolation: true
- ✅ Input sanitization
- ✅ Session güvenliği

### V1.0.0 (Tamamlandı) ✅
- ✅ Temel video dönüşümü
- ✅ 60sn parçalama
- ✅ Çoklu metin katmanları
- ✅ 8 preset şablonu
- ✅ Canlı önizleme
- ✅ Klavye kısayolları

---

## 🎯 ROADMAP

### V2.0.0-dev (Geliştirme Aşamasında) 🔄
- ✅ Kritik bug düzeltmeleri
- ✅ Performans iyileştirmeleri
- ✅ TikTok Upload (Temel)
- 🔄 **Caption Editor** - Hashtag yönetimi
- 🔄 **Upload Queue** - Toplu yükleme
- 🔄 **Multi-account** - Çoklu hesap
- 🔄 **Scheduled Posting** - Zamanlanmış yayın

### V3.0.0 (Gelecek) 💭
- Instagram Reels upload
- YouTube Shorts upload
- AI caption generation
- Advanced video editing
- Cloud storage
- Mobile app

---

## 🤝 KATKIDA BULUNMA

### Nasıl Katkıda Bulunabilirsin?

1. **Bug Raporu**
   ```bash
   GitHub Issues → New Issue → Bug Report
   ```

2. **Özellik İsteği**
   ```bash
   GitHub Issues → New Issue → Feature Request
   ```

3. **Pull Request**
   ```bash
   1. Fork → Clone
   2. Branch oluştur: feature/amazing-feature
   3. Commit yap: git commit -m 'feat: Add amazing feature'
   4. Push: git push origin feature/amazing-feature
   5. PR aç
   ```

---

## 📜 LİSANS

MIT License - Özgürce kullan, değiştir, paylaş!

---

## 🌟 TEŞEKKÜRLER

### Kullanılan Teknolojiler

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[React](https://react.dev/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[FFmpeg](https://ffmpeg.org/)** - Video processing
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** - YouTube downloader
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Playwright](https://playwright.dev/)** - Browser automation (TikTok)

---

**Son Güncelleme**: 2025-01-07  
**Versiyon**: v2.0.0-dev  
**Durum**: Development ✅
