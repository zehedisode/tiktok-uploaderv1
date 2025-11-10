import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, ExternalLink, Calendar, FileText } from 'lucide-react';

function NotesModal({ isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({
    title: '',
    youtubeLink: '',
    note: '',
    episode: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = async () => {
    try {
      const savedNotes = await window.electronAPI.getNotes();
      setNotes(savedNotes || []);
    } catch (error) {
      console.error('Notlar yüklenemedi:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.youtubeLink) {
      window.alert('Başlık ve YouTube linki zorunludur!');
      return;
    }

    try {
      const noteToSave = {
        ...newNote,
        id: editingNote?.id || Date.now().toString(),
        createdAt: editingNote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await window.electronAPI.saveNote(noteToSave);
      
      setNewNote({ title: '', youtubeLink: '', note: '', episode: '' });
      setEditingNote(null);
      setShowAddForm(false);
      loadNotes();
    } catch (error) {
      console.error('Not kaydedilemedi:', error);
      window.alert('Not kaydedilirken hata oluştu!');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      youtubeLink: note.youtubeLink,
      note: note.note || '',
      episode: note.episode || '',
    });
    setShowAddForm(true);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await window.electronAPI.deleteNote(noteId);
      loadNotes();
    } catch (error) {
      console.error('Not silinemedi:', error);
    }
  };

  const handleCancel = () => {
    setNewNote({ title: '', youtubeLink: '', note: '', episode: '' });
    setEditingNote(null);
    setShowAddForm(false);
  };

  const handleOpenLink = (link) => {
    window.electronAPI.openExternal(link);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="text-primary-500" size={28} />
            <h2 className="text-2xl font-bold text-white">İçerik Notları</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Note Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} />
              Yeni Not Ekle
            </button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-3 border-2 border-primary-500">
              <h3 className="text-lg font-semibold text-white mb-3">
                {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Başlık / Dizi Adı *
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Örn: Game of Thrones"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bölüm
                </label>
                <input
                  type="text"
                  value={newNote.episode}
                  onChange={(e) => setNewNote({ ...newNote, episode: e.target.value })}
                  placeholder="Örn: Sezon 1 - Bölüm 3"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  YouTube Linki *
                </label>
                <input
                  type="url"
                  value={newNote.youtubeLink}
                  onChange={(e) => setNewNote({ ...newNote, youtubeLink: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Notlar
                </label>
                <textarea
                  value={newNote.note}
                  onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                  placeholder="Bu bölümle ilgili notlarınız..."
                  rows={3}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveNote}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Save size={18} />
                  {editingNote ? 'Güncelle' : 'Kaydet'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all font-medium"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {notes.length === 0 && !showAddForm && (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-600 mb-4" size={64} />
              <p className="text-gray-400 text-lg">Henüz not eklenmemiş</p>
              <p className="text-gray-500 text-sm mt-2">İlerlemenizi takip etmek için not ekleyin</p>
            </div>
          )}

          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-all border border-gray-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {note.title}
                    </h3>
                    {note.episode && (
                      <p className="text-sm text-primary-400 font-medium mb-2">
                        📺 {note.episode}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                      title="Düzenle"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {note.note && (
                  <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">
                    {note.note}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => handleOpenLink(note.youtubeLink)}
                    className="text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 font-medium"
                  >
                    <ExternalLink size={16} />
                    YouTube'da Aç
                  </button>
                  
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar size={14} />
                    <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-750">
          <p className="text-sm text-gray-400 text-center">
            💡 İpucu: Her diziyi indirdikten sonra not ekleyerek ilerlemenizi takip edin
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotesModal;


