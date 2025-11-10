"""TikTok Video Yukleyici - Modern GUI Uygulamasi"""

import os
import random
import threading
import time
from pathlib import Path
from typing import List, Dict, Optional

try:
    import customtkinter as ctk
except ImportError:
    print("CustomTkinter yukleniyor...")
    import subprocess
    subprocess.check_call(["py", "-m", "pip", "install", "customtkinter"])
    import customtkinter as ctk

from tkinter import filedialog, messagebox, scrolledtext

from tiktok_uploader.upload import upload_videos
from tiktok_uploader.auth import AuthBackend


class TikTokUploaderGUI:
    """TikTok video yukleme GUI uygulamasi"""
    
    # Varsayilan dosya yollari
    DEFAULT_COOKIES_FILE = "cookies.txt"
    
    def __init__(self):
        self._setup_appearance()
        self._init_variables()
        self._create_window()
        self._create_widgets()
        self._auto_load_cookies()
        self._auto_load_videos_from_folder()
        
    def _setup_appearance(self):
        """Gorunum ayarlarini yap"""
        ctk.set_appearance_mode("dark")
        # Özel renk teması
        ctk.set_default_color_theme("blue")
        # Modern renk paleti
        self.colors = {
            "primary": "#FF0050",  # TikTok kırmızısı
            "primary_hover": "#E6004A",
            "secondary": "#00F2EA",  # TikTok turkuazı
            "secondary_hover": "#00D9D1",
            "background": "#0F0F0F",
            "surface": "#1A1A1A",
            "surface_hover": "#252525",
            "text_primary": "#FFFFFF",
            "text_secondary": "#B0B0B0",
            "success": "#00D4AA",
            "error": "#FF3B5C",
            "warning": "#FFB800",
            "border": "#2A2A2A"
        }
        
    def _init_variables(self):
        """Degiskenleri baslat"""
        self.videos: List[Dict] = []
        self.cookies_path: Optional[str] = None
        self.is_uploading = False
        # Rastgele bekleme ayarlari
        self.delay_enabled = False
        self.delay_min_minutes = 1
        self.delay_max_minutes = 3
        
    def _create_window(self):
        """Ana pencereyi olustur"""
        self.root = ctk.CTk()
        self.root.title("TikTok Video Yukleyici")
        self.root.geometry("1200x900")
        self.root.minsize(800, 600)
        self.root.configure(fg_color=self.colors["background"])
        
        # Toast bildirimleri için container
        self.toast_container = ctk.CTkFrame(
            self.root,
            fg_color="transparent"
        )
        self.toast_container.pack(side="top", fill="x", padx=20, pady=10)
        self.toast_container.pack_forget()  # Başlangıçta gizli
        
        # Ana scrollable container
        self.main_scrollable = ctk.CTkScrollableFrame(
            self.root,
            fg_color="transparent",
            scrollbar_button_color=self.colors["surface"],
            scrollbar_button_hover_color=self.colors["surface_hover"]
        )
        self.main_scrollable.pack(fill="both", expand=True, padx=0, pady=0)
        
    def _create_widgets(self):
        """Widget'lari olustur"""
        self._create_header()
        self._create_action_buttons()
        self._create_cookies_section()
        self._create_delay_section()
        self._create_video_section()
        self._create_log_section()
        
    def _create_header(self):
        """Baslik bolumunu olustur"""
        header = ctk.CTkFrame(self.main_scrollable, fg_color="transparent")
        header.pack(pady=(30, 20), fill="x")
        
        # TikTok ikonu ve başlık container
        title_container = ctk.CTkFrame(header, fg_color="transparent")
        title_container.pack()
        
        # TikTok ikonu simülasyonu (emoji)
        icon_label = ctk.CTkLabel(
            title_container,
            text="🎬",
            font=ctk.CTkFont(size=40)
        )
        icon_label.pack()
        
        title = ctk.CTkLabel(
            title_container,
            text="TikTok Video Yukleyici",
            font=ctk.CTkFont(size=32, weight="bold"),
            text_color=self.colors["text_primary"]
        )
        title.pack(pady=(10, 5))
        
        subtitle = ctk.CTkLabel(
            title_container,
            text="Videolarinizi kolayca ve hizli bir sekilde yukleyin",
            font=ctk.CTkFont(size=15),
            text_color=self.colors["text_secondary"]
        )
        subtitle.pack()
        
    def _create_cookies_section(self):
        """Cookies bolumunu olustur"""
        cookies_frame = ctk.CTkFrame(
            self.main_scrollable,
            fg_color=self.colors["surface"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["border"]
        )
        cookies_frame.pack(fill="x", padx=30, pady=15)
        
        # İç container
        inner_frame = ctk.CTkFrame(cookies_frame, fg_color="transparent")
        inner_frame.pack(fill="x", padx=20, pady=18)
        
        # Sol taraf - Bilgi
        info_frame = ctk.CTkFrame(inner_frame, fg_color="transparent")
        info_frame.pack(side="left", fill="x", expand=True)
        
        # Başlık ve ikon
        title_row = ctk.CTkFrame(info_frame, fg_color="transparent")
        title_row.pack(anchor="w")
        
        ctk.CTkLabel(
            title_row,
            text="🔐",
            font=ctk.CTkFont(size=18)
        ).pack(side="left", padx=(0, 8))
        
        ctk.CTkLabel(
            title_row,
            text="Cookies Dosyasi",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=self.colors["text_primary"]
        ).pack(side="left")
        
        self.cookies_status_label = ctk.CTkLabel(
            info_frame,
            text="Yukleniyor...",
            font=ctk.CTkFont(size=13),
            text_color=self.colors["text_secondary"]
        )
        self.cookies_status_label.pack(anchor="w", pady=(8, 0))
        
        # Sag taraf - Butonlar
        button_frame = ctk.CTkFrame(inner_frame, fg_color="transparent")
        button_frame.pack(side="right")
        
        ctk.CTkButton(
            button_frame,
            text="Dosya Sec",
            command=self._select_cookies,
            width=120,
            height=40,
            font=ctk.CTkFont(size=13, weight="bold"),
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"],
            corner_radius=10
        ).pack()
        
    def _create_video_section(self):
        """Video bolumunu olustur"""
        video_frame = ctk.CTkFrame(
            self.main_scrollable,
            fg_color=self.colors["surface"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["border"]
        )
        video_frame.pack(fill="x", padx=30, pady=15)
        
        # Baslik ve ekle butonu
        top_frame = ctk.CTkFrame(video_frame, fg_color="transparent")
        top_frame.pack(fill="x", padx=20, pady=(20, 15))
        
        title_row = ctk.CTkFrame(top_frame, fg_color="transparent")
        title_row.pack(side="left")
        
        ctk.CTkLabel(
            title_row,
            text="📹",
            font=ctk.CTkFont(size=20)
        ).pack(side="left", padx=(0, 10))
        
        ctk.CTkLabel(
            title_row,
            text="Videolar",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=self.colors["text_primary"]
        ).pack(side="left")
        
        self.add_button = ctk.CTkButton(
            top_frame,
            text="+ Video Ekle",
            command=self._add_videos,
            width=140,
            height=42,
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"],
            corner_radius=10
        )
        self.add_button.pack(side="right")
        
        # Toplu aciklama duzenleme paneli
        bulk_frame = ctk.CTkFrame(
            video_frame,
            fg_color=self.colors["background"],
            corner_radius=12
        )
        bulk_frame.pack(fill="x", padx=20, pady=(0, 15))
        
        bulk_label = ctk.CTkLabel(
            bulk_frame,
            text="⚡ Toplu Aciklama:",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=self.colors["text_primary"]
        )
        bulk_label.pack(side="left", padx=(15, 10), pady=12)
        
        self.bulk_text_entry = ctk.CTkEntry(
            bulk_frame,
            placeholder_text="Ornek: Cukur 1. Bolum",
            width=220,
            height=36,
            font=ctk.CTkFont(size=12),
            fg_color=self.colors["surface"],
            border_color=self.colors["border"],
            border_width=1
        )
        self.bulk_text_entry.pack(side="left", padx=(0, 8), pady=12)
        
        ctk.CTkLabel(
            bulk_frame,
            text="Baslangic:",
            font=ctk.CTkFont(size=12),
            text_color=self.colors["text_secondary"]
        ).pack(side="left", padx=(10, 5), pady=12)
        
        self.bulk_start_entry = ctk.CTkEntry(
            bulk_frame,
            placeholder_text="1",
            width=70,
            height=36,
            font=ctk.CTkFont(size=12),
            fg_color=self.colors["surface"],
            border_color=self.colors["border"],
            border_width=1
        )
        self.bulk_start_entry.insert(0, "1")
        self.bulk_start_entry.pack(side="left", padx=(0, 10), pady=12)
        
        bulk_apply_button = ctk.CTkButton(
            bulk_frame,
            text="Uygula",
            command=self._apply_bulk_descriptions,
            width=90,
            height=36,
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"],
            corner_radius=8
        )
        bulk_apply_button.pack(side="left", padx=(0, 15), pady=12)
        
        # Video listesi
        self.videos_scroll = ctk.CTkScrollableFrame(
            video_frame,
            fg_color=self.colors["background"],
            corner_radius=12,
            scrollbar_button_color=self.colors["surface"],
            scrollbar_button_hover_color=self.colors["surface_hover"]
        )
        self.videos_scroll.pack(fill="x", padx=20, pady=(0, 20))
        # Minimum yükseklik ayarla
        self.videos_scroll.configure(height=320)
        
        # Bos durum mesaji
        self.empty_label = ctk.CTkLabel(
            self.videos_scroll,
            text="📭 Henuz video eklenmedi.\n'+ Video Ekle' butonuna tiklayarak video ekleyin.",
            font=ctk.CTkFont(size=14),
            text_color=self.colors["text_secondary"],
            justify="center"
        )
        self.empty_label.pack(pady=60)
        
    def _create_log_section(self):
        """Log bolumunu olustur"""
        log_frame = ctk.CTkFrame(
            self.main_scrollable,
            fg_color=self.colors["surface"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["border"]
        )
        log_frame.pack(fill="x", padx=30, pady=15)
        
        # Başlık
        title_row = ctk.CTkFrame(log_frame, fg_color="transparent")
        title_row.pack(anchor="w", padx=20, pady=(18, 10))
        
        ctk.CTkLabel(
            title_row,
            text="📋",
            font=ctk.CTkFont(size=18)
        ).pack(side="left", padx=(0, 10))
        
        ctk.CTkLabel(
            title_row,
            text="Durum Logu",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=self.colors["text_primary"]
        ).pack(side="left")
        
        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=10,
            font=("Consolas", 11),
            bg=self.colors["background"],
            fg=self.colors["text_primary"],
            insertbackground=self.colors["primary"],
            wrap="word",
            relief="flat",
            borderwidth=0,
            highlightthickness=0
        )
        self.log_text.pack(fill="both", expand=True, padx=20, pady=(0, 18))
        
    def _create_action_buttons(self):
        """Aksiyon butonlarini olustur"""
        # Modern buton container frame
        button_container = ctk.CTkFrame(
            self.main_scrollable, 
            fg_color="transparent"
        )
        button_container.pack(fill="x", padx=30, pady=(10, 25))
        
        # Butonlar için iç frame
        buttons_inner = ctk.CTkFrame(
            button_container,
            fg_color="transparent"
        )
        buttons_inner.pack(fill="x")
        
        # Sol buton - Listeyi Temizle
        self.clear_button = ctk.CTkButton(
            buttons_inner,
            text="🗑️  Listeyi Temizle",
            command=self._clear_list,
            height=60,
            font=ctk.CTkFont(size=15, weight="bold"),
            fg_color=self.colors["surface"],
            hover_color=self.colors["surface_hover"],
            corner_radius=14,
            border_width=1,
            border_color=self.colors["border"],
            text_color=self.colors["text_primary"]
        )
        self.clear_button.pack(side="left", fill="x", expand=True, padx=(0, 12))
        
        # Sağ buton - Yüklemeye Başla (daha büyük ve çekici)
        self.upload_button = ctk.CTkButton(
            buttons_inner,
            text="🚀  Yuklemeye Basla",
            command=self._start_upload,
            height=60,
            font=ctk.CTkFont(size=18, weight="bold"),
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"],
            corner_radius=14,
            border_width=0,
            text_color="white"
        )
        self.upload_button.pack(side="right", fill="x", expand=True, padx=(12, 0))
        
    def _auto_load_cookies(self):
        """Cookies dosyasini otomatik yukle"""
        app_dir = Path(__file__).parent
        cookies_file = app_dir / self.DEFAULT_COOKIES_FILE
        
        if cookies_file.exists():
            self.cookies_path = str(cookies_file)
            self.cookies_status_label.configure(
                text=f"✓ {cookies_file.name} bulundu",
                text_color=self.colors["success"]
            )
            self._log(f"Cookies dosyasi otomatik yuklendi: {cookies_file.name}")
        else:
            self.cookies_status_label.configure(
                text="Cookies dosyasi bulunamadi",
                text_color=self.colors["warning"]
            )
            self._log("Uyari: cookies.txt dosyasi bulunamadi. Lutfen 'Dosya Sec' butonundan secin.")
    
    def _auto_load_videos_from_folder(self):
        """Converter'dan gelen klasör yolundan videoları otomatik yükle"""
        folder_path = os.environ.get('TIKTOK_UPLOAD_FOLDER')
        if not folder_path or not os.path.isdir(folder_path):
            return
        
        # Klasördeki tüm video dosyalarını bul
        video_extensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv']
        video_files = []
        
        try:
            for file in os.listdir(folder_path):
                file_path = os.path.join(folder_path, file)
                if os.path.isfile(file_path):
                    _, ext = os.path.splitext(file)
                    if ext.lower() in video_extensions:
                        video_files.append(file_path)
            
            if video_files:
                # Videoları ekle
                for video_path in sorted(video_files):
                    if not self._is_duplicate(video_path):
                        video_info = {
                            "path": video_path,
                            "description": "",
                            "status": "Beklemede"
                        }
                        self.videos.append(video_info)
                        self._add_video_to_list(video_info, len(self.videos) - 1)
                        self._log(f"✓ Video eklendi: {Path(video_path).name}")
                
                self._update_empty_state()
                self._show_toast(
                    f"{len(video_files)} video otomatik olarak eklendi!",
                    "success"
                )
        except Exception as e:
            self._log(f"Hata: Klasörden video yüklenirken hata: {str(e)}", "error")
            
    def _create_delay_section(self):
        """Rastgele bekleme ayarlari bolumunu olustur"""
        delay_frame = ctk.CTkFrame(
            self.main_scrollable,
            fg_color=self.colors["surface"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["border"]
        )
        delay_frame.pack(fill="x", padx=30, pady=15)
        
        # İç container
        inner_frame = ctk.CTkFrame(delay_frame, fg_color="transparent")
        inner_frame.pack(fill="x", padx=20, pady=18)
        
        # Sol taraf - Checkbox
        left_frame = ctk.CTkFrame(inner_frame, fg_color="transparent")
        left_frame.pack(side="left", fill="x", expand=True)
        
        checkbox_row = ctk.CTkFrame(left_frame, fg_color="transparent")
        checkbox_row.pack(anchor="w")
        
        ctk.CTkLabel(
            checkbox_row,
            text="⏱️",
            font=ctk.CTkFont(size=16)
        ).pack(side="left", padx=(0, 8))
        
        self.delay_checkbox = ctk.CTkCheckBox(
            checkbox_row,
            text="Videolar arasi rastgele bekleme",
            command=self._toggle_delay_settings,
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=self.colors["text_primary"],
            checkbox_width=20,
            checkbox_height=20
        )
        self.delay_checkbox.pack(side="left")
        
        # Sag taraf - Min/Max ayarlari
        right_frame = ctk.CTkFrame(inner_frame, fg_color="transparent")
        right_frame.pack(side="right")
        
        # Min dakika
        min_frame = ctk.CTkFrame(right_frame, fg_color="transparent")
        min_frame.pack(side="left", padx=(0, 15))
        
        ctk.CTkLabel(
            min_frame,
            text="Min:",
            font=ctk.CTkFont(size=13),
            text_color=self.colors["text_secondary"]
        ).pack(side="left", padx=(0, 6))
        
        self.delay_min_entry = ctk.CTkEntry(
            min_frame,
            width=65,
            height=34,
            font=ctk.CTkFont(size=12),
            fg_color=self.colors["background"],
            border_color=self.colors["border"],
            border_width=1
        )
        self.delay_min_entry.insert(0, str(self.delay_min_minutes))
        self.delay_min_entry.pack(side="left", padx=(0, 5))
        self.delay_min_entry.configure(state="disabled")
        
        ctk.CTkLabel(
            min_frame,
            text="dk",
            font=ctk.CTkFont(size=12),
            text_color=self.colors["text_secondary"]
        ).pack(side="left")
        
        # Max dakika
        max_frame = ctk.CTkFrame(right_frame, fg_color="transparent")
        max_frame.pack(side="left")
        
        ctk.CTkLabel(
            max_frame,
            text="Max:",
            font=ctk.CTkFont(size=13),
            text_color=self.colors["text_secondary"]
        ).pack(side="left", padx=(0, 6))
        
        self.delay_max_entry = ctk.CTkEntry(
            max_frame,
            width=65,
            height=34,
            font=ctk.CTkFont(size=12),
            fg_color=self.colors["background"],
            border_color=self.colors["border"],
            border_width=1
        )
        self.delay_max_entry.insert(0, str(self.delay_max_minutes))
        self.delay_max_entry.pack(side="left", padx=(0, 5))
        self.delay_max_entry.configure(state="disabled")
        
        ctk.CTkLabel(
            max_frame,
            text="dk",
            font=ctk.CTkFont(size=12),
            text_color=self.colors["text_secondary"]
        ).pack(side="left")
        
    def _toggle_delay_settings(self):
        """Bekleme ayarlarini ac/kapa"""
        self.delay_enabled = self.delay_checkbox.get()
        
        if self.delay_enabled:
            self.delay_min_entry.configure(state="normal")
            self.delay_max_entry.configure(state="normal")
            self._log("Rastgele bekleme aktif edildi")
        else:
            self.delay_min_entry.configure(state="disabled")
            self.delay_max_entry.configure(state="disabled")
            self._log("Rastgele bekleme devre disi")
            
    def _get_delay_settings(self) -> tuple[int, int]:
        """Bekleme ayarlarini al"""
        try:
            min_val = max(0, int(self.delay_min_entry.get()))
            max_val = max(min_val, int(self.delay_max_entry.get()))
            return min_val, max_val
        except ValueError:
            return self.delay_min_minutes, self.delay_max_minutes
            
    def _select_cookies(self):
        """Cookies dosyasi sec"""
        file_path = filedialog.askopenfilename(
            title="Cookies Dosyasi Sec",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialdir=Path(__file__).parent
        )
        
        if file_path:
            self.cookies_path = file_path
            filename = Path(file_path).name
            self.cookies_status_label.configure(
                text=f"✓ {filename}",
                text_color=self.colors["success"]
            )
            self._log(f"Cookies dosyasi secildi: {filename}")
            
    def _add_videos(self):
        """Video ekle"""
        if not self.cookies_path:
            self._show_toast(
                "Lutfen once cookies dosyasi secin!",
                "warning"
            )
            return
            
        file_paths = filedialog.askopenfilenames(
            title="Video Dosyalari Sec",
            filetypes=[
                ("Video files", "*.mp4 *.mov *.avi *.wmv *.flv *.webm *.mkv"),
                ("All files", "*.*")
            ]
        )
        
        if not file_paths:
            return
            
        for file_path in file_paths:
            if self._is_duplicate(file_path):
                self._log(f"Atlandi (zaten ekli): {Path(file_path).name}")
                continue
                
            video_info = {
                "path": file_path,
                "description": "",
                "status": "Beklemede"
            }
            self.videos.append(video_info)
            self._add_video_to_list(video_info, len(self.videos) - 1)
            self._log(f"✓ Video eklendi: {Path(file_path).name}")
            
        self._update_empty_state()
        
    def _is_duplicate(self, file_path: str) -> bool:
        """Video zaten ekli mi kontrol et"""
        abs_path = os.path.abspath(file_path)
        return any(os.path.abspath(v["path"]) == abs_path for v in self.videos)
        
    def _add_video_to_list(self, video_info: Dict, index: int):
        """Video listesine ekle"""
        # Bos durum mesajini gizle
        self.empty_label.pack_forget()
        
        video_frame = ctk.CTkFrame(
            self.videos_scroll,
            fg_color=self.colors["surface"],
            corner_radius=12,
            border_width=1,
            border_color=self.colors["border"]
        )
        video_frame.pack(fill="x", padx=8, pady=10)
        
        # Ust satir - Dosya adi ve durum
        top_row = ctk.CTkFrame(video_frame, fg_color="transparent")
        top_row.pack(fill="x", padx=15, pady=(15, 10))
        
        filename = Path(video_info["path"]).name
        ctk.CTkLabel(
            top_row,
            text=f"{index + 1}. {filename}",
            font=ctk.CTkFont(size=14, weight="bold"),
            anchor="w",
            text_color=self.colors["text_primary"]
        ).pack(side="left", fill="x", expand=True)
        
        status_label = ctk.CTkLabel(
            top_row,
            text=video_info["status"],
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=self.colors["warning"]
        )
        status_label.pack(side="right", padx=(10, 0))
        video_info["status_label"] = status_label
        
        # Alt satir - Aciklama ve sil butonu
        bottom_row = ctk.CTkFrame(video_frame, fg_color="transparent")
        bottom_row.pack(fill="x", padx=15, pady=(0, 15))
        
        desc_entry = ctk.CTkEntry(
            bottom_row,
            placeholder_text="Video aciklamasi (opsiyonel)...",
            height=38,
            font=ctk.CTkFont(size=12),
            fg_color=self.colors["background"],
            border_color=self.colors["border"],
            border_width=1
        )
        desc_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        desc_entry.insert(0, video_info["description"])
        video_info["desc_entry"] = desc_entry
        
        ctk.CTkButton(
            bottom_row,
            text="✕ Sil",
            command=lambda idx=index: self._remove_video(idx),
            width=70,
            height=38,
            fg_color=self.colors["error"],
            hover_color="#E02E4A",
            font=ctk.CTkFont(size=12, weight="bold"),
            corner_radius=8
        ).pack(side="right")
        
    def _update_empty_state(self):
        """Bos durum mesajini guncelle"""
        if not self.videos:
            self.empty_label.pack(pady=50)
        else:
            self.empty_label.pack_forget()
            
    def _remove_video(self, index: int):
        """Video listesinden sil"""
        if 0 <= index < len(self.videos):
            removed = self.videos.pop(index)
            self._log(f"✗ Video silindi: {Path(removed['path']).name}")
            self._refresh_video_list()
            self._update_empty_state()
            
    def _refresh_video_list(self):
        """Video listesini yenile"""
        for widget in self.videos_scroll.winfo_children():
            widget.destroy()
            
        if not self.videos:
            self.empty_label.pack(pady=50)
        else:
            for i, video in enumerate(self.videos):
                self._add_video_to_list(video, i)
                
    def _apply_bulk_descriptions(self):
        """Toplu aciklama uygula"""
        if not self.videos:
            self._show_toast("Lutfen once video ekleyin!", "warning")
            return
        
        bulk_text = self.bulk_text_entry.get().strip()
        start_num_str = self.bulk_start_entry.get().strip()
        
        if not bulk_text:
            self._show_toast("Lutfen sabit metni girin!", "warning")
            return
        
        if not start_num_str:
            self._show_toast("Lutfen baslangic numarasini girin!", "warning")
            return
        
        try:
            start_num = int(start_num_str)
        except ValueError:
            self._show_toast("Baslangic numarasi gecerli bir sayi olmalidir!", "error")
            return
        
        # Her video icin aciklamayi guncelle
        for idx, video in enumerate(self.videos):
            part_num = start_num + idx
            description = f"{bulk_text} Part {part_num}"
            video["description"] = description
            
            # Entry widget'ini guncelle
            if "desc_entry" in video:
                video["desc_entry"].delete(0, "end")
                video["desc_entry"].insert(0, description)
        
        self._log(f"✓ Toplu aciklama uygulandi: {len(self.videos)} video guncellendi")
        self._show_toast(
            f"{len(self.videos)} videoya aciklama uygulandi!",
            "success"
        )
            
    def _clear_list(self):
        """Listeyi temizle"""
        if not self.videos:
            return
            
        if messagebox.askyesno(
            "Onay",
            f"Tum {len(self.videos)} videoyu silmek istediginize emin misiniz?"
        ):
            self.videos.clear()
            self._refresh_video_list()
            self._update_empty_state()
            self._log("Liste temizlendi")
            
    def _start_upload(self):
        """Yuklemeye basla"""
        if not self.cookies_path:
            self._show_toast(
                "Cookies dosyasi secilmedi! Lutfen once dosya secin.",
                "error"
            )
            return
            
        if not self.videos:
            self._show_toast("Lutfen en az bir video ekleyin!", "error")
            return
            
        if self.is_uploading:
            self._show_toast("Yukleme zaten devam ediyor!", "warning")
            return
            
        # Aciklamalari guncelle
        for video in self.videos:
            video["description"] = video["desc_entry"].get().strip()
            
        self.is_uploading = True
        self.upload_button.configure(
            state="disabled",
            text="⏳  Yukleniyor...",
            fg_color=self.colors["surface_hover"]
        )
        self.add_button.configure(state="disabled")
        self.clear_button.configure(state="disabled")
        
        # Yuklemeyi thread'de baslat
        upload_thread = threading.Thread(target=self._upload_videos_thread, daemon=True)
        upload_thread.start()
        
    def _upload_videos_thread(self):
        """Video yukleme thread'i"""
        try:
            self._log("\n" + "="*70)
            self._log("=== YUKLEME BASLADI ===")
            self._log("="*70)
            
            total = len(self.videos)
            self._log(f"\nToplam {total} video yuklenecek...\n")
            
            # Auth backend olustur
            self._log("Cookies dosyasi yukleniyor...")
            auth = AuthBackend(cookies=self.cookies_path)
            self._log("✓ Cookies dosyasi yuklendi.\n")
            
            # Bekleme ayarlarini al
            delay_enabled = self.delay_enabled
            delay_min, delay_max = self._get_delay_settings()
            
            if delay_enabled:
                self._log(f"Rastgele bekleme aktif: {delay_min}-{delay_max} dakika arasi\n")
            
            # Her video icin yukleme
            failed_videos = []
            
            for idx, video in enumerate(self.videos, 1):
                filename = Path(video["path"]).name
                video["status"] = "Hazirlaniyor"
                video["status_label"].configure(text="Hazirlaniyor", text_color=self.colors["warning"])
                self._log(f"[{idx}/{total}] Yukleme basladi: {filename}")
                
                # Tek video yukle
                video_dict = {
                    "path": video["path"],
                    "description": video["description"] or filename
                }
                
                try:
                    failed = upload_videos(
                        videos=[video_dict],
                        auth=auth,
                        headless=False
                    )
                    
                    if failed:
                        failed_videos.extend(failed)
                        video["status"] = "Basarisiz"
                        video["status_label"].configure(text="Basarisiz", text_color=self.colors["error"])
                        error_msg = failed[0].get("error", "Bilinmeyen hata")
                        self._log(f"✗ BASARISIZ: {filename}")
                        self._log(f"  Hata: {error_msg}")
                    else:
                        video["status"] = "Basarili"
                        video["status_label"].configure(text="Basarili", text_color=self.colors["success"])
                        self._log(f"✓ BASARILI: {filename}")
                        
                except Exception as e:
                    failed_videos.append({
                        "path": video["path"],
                        "error": str(e)
                    })
                    video["status"] = "Basarisiz"
                    video["status_label"].configure(text="Basarisiz", text_color=self.colors["error"])
                    self._log(f"✗ BASARISIZ: {filename}")
                    self._log(f"  Hata: {str(e)}")
                
                # Son video degilse ve bekleme aktifse, rastgele bekle
                if idx < total and delay_enabled:
                    delay_seconds = random.randint(delay_min * 60, delay_max * 60)
                    delay_minutes = delay_seconds / 60
                    self._log(f"\n⏳ Sonraki video icin {delay_minutes:.1f} dakika bekleniyor...")
                    
                    # Geri sayim goster
                    remaining = delay_seconds
                    last_line = None
                    while remaining > 0:
                        mins = remaining // 60
                        secs = remaining % 60
                        countdown_msg = f"   Kalan sure: {mins:02d}:{secs:02d}"
                        
                        # Onceki satiri sil ve yenisini ekle
                        if last_line:
                            # Son satiri sil
                            self.log_text.delete(f"end-{len(last_line)+1}c", "end-1c")
                        
                        self.log_text.insert("end", countdown_msg)
                        self.log_text.see("end")
                        self.root.update_idletasks()
                        
                        last_line = countdown_msg
                        time.sleep(1)
                        remaining -= 1
                    
                    # Geri sayim satirini temizle
                    if last_line:
                        self.log_text.delete(f"end-{len(last_line)+1}c", "end-1c")
                    
                    self._log("✓ Bekleme tamamlandi, sonraki video yukleniyor...\n")
            
            # Sonuclari guncelle
            self.root.after(0, self._update_upload_results, failed_videos)
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            self.root.after(0, self._upload_error, str(e), error_details)
            
    def _update_upload_results(self, failed_videos: List[Dict]):
        """Yukleme sonuclarini guncelle"""
        failed_paths = {os.path.abspath(v.get("path", "")) for v in failed_videos}
        
        self._log("\n" + "="*70)
        self._log("=== YUKLEME SONUCLARI ===")
        self._log("="*70)
        
        success_count = 0
        failed_count = 0
        
        for video in self.videos:
            video_abs_path = os.path.abspath(video["path"])
            if video_abs_path in failed_paths:
                video["status"] = "Basarisiz"
                video["status_label"].configure(text="Basarisiz", text_color=self.colors["error"])
                failed_count += 1
                
                error_msg = "Bilinmeyen hata"
                for failed_video in failed_videos:
                    if os.path.abspath(failed_video.get("path", "")) == video_abs_path:
                        error_msg = failed_video.get("error", "Bilinmeyen hata")
                        break
                
                filename = Path(video["path"]).name
                self._log(f"\n✗ BASARISIZ: {filename}")
                self._log(f"  Hata: {error_msg}")
            else:
                video["status"] = "Basarili"
                video["status_label"].configure(text="Basarili", text_color=self.colors["success"])
                success_count += 1
                filename = Path(video["path"]).name
                self._log(f"\n✓ BASARILI: {filename}")
                
        self._log("\n" + "="*70)
        self._log(f"OZET: {success_count} basarili, {failed_count} basarisiz")
        self._log("="*70)
        
        self.is_uploading = False
        self.upload_button.configure(
            state="normal",
            text="🚀  Yuklemeye Basla",
            fg_color=self.colors["primary"]
        )
        self.add_button.configure(state="normal")
        self.clear_button.configure(state="normal")
        
        # Sonuc mesaji
        if failed_videos:
            self._show_toast(
                f"{success_count} video basarili, {failed_count} video basarisiz oldu",
                "warning"
            )
        else:
            self._show_toast(
                f"Tum {success_count} video basariyla yuklendi!",
                "success"
            )
            
    def _upload_error(self, error_msg: str, error_details: str = ""):
        """Yukleme hatasi"""
        self._log("\n" + "="*70)
        self._log("=== HATA OLUSTU ===")
        self._log("="*70)
        self._log(f"Hata: {error_msg}")
        if error_details:
            self._log(f"\nDetayli hata:\n{error_details}")
        self._log("="*70)
        
        # Tum videolari basarisiz olarak isaretle
        for video in self.videos:
            video["status"] = "Basarisiz"
            video["status_label"].configure(text="Basarisiz", text_color=self.colors["error"])
        
        self.is_uploading = False
        self.upload_button.configure(
            state="normal",
            text="🚀  Yuklemeye Basla",
            fg_color=self.colors["primary"]
        )
        self.add_button.configure(state="normal")
        self.clear_button.configure(state="normal")
        
        self._show_toast(f"Yukleme sirasinda hata olustu: {error_msg}", "error")
        
    def _log(self, message: str, end: str = "\n"):
        """Log mesaji ekle"""
        self.log_text.insert("end", f"{message}{end}")
        self.log_text.see("end")
        self.root.update_idletasks()
    
    def _show_toast(self, message: str, toast_type: str = "info"):
        """Toast bildirim goster (2 saniye sonra otomatik kapanir)"""
        # Renkleri belirle
        if toast_type == "success":
            bg_color = self.colors["success"]
            icon = "✓"
        elif toast_type == "error":
            bg_color = self.colors["error"]
            icon = "✗"
        elif toast_type == "warning":
            bg_color = self.colors["warning"]
            icon = "⚠"
        else:  # info
            bg_color = self.colors["primary"]
            icon = "ℹ"
        
        # Toast frame oluştur
        toast_frame = ctk.CTkFrame(
            self.root,
            fg_color=bg_color,
            corner_radius=12,
            border_width=0
        )
        
        # İçerik
        content_frame = ctk.CTkFrame(toast_frame, fg_color="transparent")
        content_frame.pack(fill="x", padx=20, pady=15)
        
        # İkon ve mesaj
        icon_label = ctk.CTkLabel(
            content_frame,
            text=icon,
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color="white"
        )
        icon_label.pack(side="left", padx=(0, 12))
        
        message_label = ctk.CTkLabel(
            content_frame,
            text=message,
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="white",
            wraplength=500
        )
        message_label.pack(side="left", fill="x", expand=True)
        
        # Toast'u ekranın üstüne yerleştir (başlangıçta yukarıda gizli)
        toast_frame.place(relx=0.5, rely=-0.1, anchor="n")
        toast_frame.update()
        
        # Aşağı kaydırma animasyonu
        def animate_in(step=0):
            if step <= 10:
                y_pos = -0.1 + (step * 0.015)  # 0.05'e kadar kaydır
                toast_frame.place(relx=0.5, rely=y_pos, anchor="n")
                self.root.update_idletasks()
                self.root.after(20, lambda: animate_in(step + 1))
        
        animate_in()
        
        # 2 saniye sonra yukarı kaydırarak kapat
        def close_toast():
            def animate_out(step=0):
                if step <= 10:
                    y_pos = 0.05 - (step * 0.015)  # Yukarı kaydır
                    toast_frame.place(relx=0.5, rely=y_pos, anchor="n")
                    self.root.update_idletasks()
                    if step < 10:
                        self.root.after(20, lambda: animate_out(step + 1))
                    else:
                        toast_frame.place_forget()
                        toast_frame.destroy()
            
            animate_out()
        
        self.root.after(2000, close_toast)
        
    def run(self):
        """Uygulamayi calistir"""
        self.root.mainloop()


if __name__ == "__main__":
    app = TikTokUploaderGUI()
    app.run()
