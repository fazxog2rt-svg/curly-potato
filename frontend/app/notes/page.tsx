"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, Edit3, Search, Tag, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { NoteItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    try {
      const data = await api.notes.list();
      if (Array.isArray(data)) setNotes(data);
    } catch (e) {
      console.error("Error loading notes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const openCreateModal = () => {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
    setTags("");
    setModalOpen(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || "");
    setModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      if (editingNoteId) {
        const updated = await api.notes.update(editingNoteId, {
          title: title.trim(),
          content: content.trim(),
          tags: tags.trim() || undefined,
        });
        setNotes((prev) => prev.map((n) => (n.id === editingNoteId ? updated : n)));
      } else {
        const created = await api.notes.create({
          title: title.trim(),
          content: content.trim(),
          tags: tags.trim() || undefined,
        });
        setNotes((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan catatan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    try {
      await api.notes.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus catatan: " + err.message);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags && n.tags.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout
      title="Catatan Pembelajaran"
      subtitle="Kelola catatan pribadi, rangkuman AI Tutor, dan materi penting dalam satu tempat."
    >
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan berdasarkan judul, kata kunci, atau tag..."
              className="pl-9"
            />
          </div>
          <Button onClick={openCreateModal} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Buat Catatan Baru
          </Button>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <Card className="py-16 text-center border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              {searchQuery ? "Tidak ada catatan yang cocok" : "Belum Ada Catatan Belajar"}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Simpan rangkuman dari sesi AI Tutor atau tulis pemahaman konsep baru Anda di sini.
            </p>
            {!searchQuery && (
              <Button onClick={openCreateModal} size="sm" className="mt-4 text-xs gap-1.5">
                <Plus className="h-4 w-4" /> Tambah Catatan Pertama
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(note)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit Catatan"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(note.updated_at || note.created_at)}</span>
                  </div>

                  {note.tags && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-indigo-500" />
                      <span className="truncate max-w-[120px] font-medium text-indigo-600 dark:text-indigo-400">
                        {note.tags}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Note Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNoteId ? "Ubah Catatan" : "Buat Catatan Baru"}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Catatan
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rangkuman Struktur Data Hash Map"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Isi Catatan
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan materi atau konsep penting..."
              rows={8}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tag / Kategori (Pisahkan dengan koma)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Contoh: Matematika, Ujian, Teorema"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={submitting}>
              {editingNoteId ? "Simpan Perubahan" : "Simpan Catatan"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
