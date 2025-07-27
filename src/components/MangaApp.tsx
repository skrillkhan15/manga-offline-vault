import React, { useState, useEffect, useRef } from 'react';
import { Book, Home, Plus, Settings, Search, Filter, Star, ExternalLink, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, MoreVertical, Download, Upload, Moon, Sun, Tag } from 'lucide-react';

// Types
interface Manga {
  id: string;
  title: string;
  type: 'manga' | 'manhwa' | 'manhua';
  author: string;
  description: string;
  genres: string[];
  coverImage: string;
  rating: number;
  notes: string;
  currentChapter: number;
  totalChapters: number;
  sourceUrl: string;
  status: 'reading' | 'completed' | 'on-hold' | 'plan-to-read';
  createdAt: string;
  updatedAt: string;
}

interface MangaFormData extends Omit<Manga, 'id' | 'createdAt' | 'updatedAt'> {}

type Page = 'home' | 'library' | 'add' | 'settings' | 'detail' | 'edit' | 'genres';

const MangaApp: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // File input ref for cover images
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data and apply dark mode on mount
  useEffect(() => {
    loadMangas();
    applyTheme();
  }, []);

  useEffect(() => {
    applyTheme();
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const applyTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Data persistence
  const loadMangas = () => {
    try {
      const stored = localStorage.getItem('mangaTracker_data');
      if (stored) {
        setMangas(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveMangas = (data: Manga[]) => {
    try {
      localStorage.setItem('mangaTracker_data', JSON.stringify(data));
      setMangas(data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Manga CRUD operations
  const addManga = (formData: MangaFormData) => {
    const newManga: Manga = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedMangas = [...mangas, newManga];
    saveMangas(updatedMangas);
    setCurrentPage('library');
  };

  const updateManga = (id: string, formData: MangaFormData) => {
    const updatedMangas = mangas.map(manga =>
      manga.id === id
        ? { ...manga, ...formData, updatedAt: new Date().toISOString() }
        : manga
    );
    saveMangas(updatedMangas);
    setCurrentPage('detail');
  };

  const deleteManga = (id: string) => {
    const updatedMangas = mangas.filter(manga => manga.id !== id);
    saveMangas(updatedMangas);
    setCurrentPage('library');
  };

  const updateChapter = (id: string, increment: boolean) => {
    const updatedMangas = mangas.map(manga => {
      if (manga.id === id) {
        const newChapter = increment 
          ? Math.min(manga.currentChapter + 1, manga.totalChapters || 99999)
          : Math.max(manga.currentChapter - 1, 0);
        return {
          ...manga,
          currentChapter: newChapter,
          status: newChapter === manga.totalChapters && manga.totalChapters > 0 ? 'completed' as const : manga.status,
          updatedAt: new Date().toISOString()
        };
      }
      return manga;
    });
    saveMangas(updatedMangas);
    if (selectedManga) {
      setSelectedManga(updatedMangas.find(m => m.id === id) || null);
    }
  };

  // Filtering and search
  const filteredMangas = mangas.filter(manga => {
    const matchesSearch = manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         manga.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || manga.type === filterType;
    const matchesStatus = filterStatus === 'all' || manga.status === filterStatus;
    const matchesGenre = filterGenre === 'all' || manga.genres.includes(filterGenre);
    return matchesSearch && matchesType && matchesStatus && matchesGenre;
  });

  // Statistics for home page
  const stats = {
    total: mangas.length,
    reading: mangas.filter(m => m.status === 'reading').length,
    completed: mangas.filter(m => m.status === 'completed').length,
    onHold: mangas.filter(m => m.status === 'on-hold').length,
    planToRead: mangas.filter(m => m.status === 'plan-to-read').length,
  };

  // Genre statistics
  const getAllGenres = () => {
    const genreMap = new Map<string, number>();
    mangas.forEach(manga => {
      manga.genres.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });
    return Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Export/Import functionality
  const exportData = () => {
    const dataStr = JSON.stringify(mangas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manga-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          saveMangas(data);
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error reading file');
      }
    };
    reader.readAsText(file);
  };

  // Image handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): Promise<string> => {
    return new Promise((resolve) => {
      const file = event.target.files?.[0];
      if (!file) {
        resolve('');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground no-select">
      {/* Main Content */}
      <div className="pb-20">
        {currentPage === 'home' && (
          <HomePage 
            stats={stats} 
            recentMangas={mangas.slice(-3).reverse()} 
            onMangaClick={(manga) => {
              setSelectedManga(manga);
              setCurrentPage('detail');
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'library' && (
          <LibraryPage
            mangas={filteredMangas}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            onMangaClick={(manga) => {
              setSelectedManga(manga);
              setCurrentPage('detail');
            }}
          />
        )}

        {currentPage === 'add' && (
          <AddEditPage
            onSave={addManga}
            onCancel={() => setCurrentPage('library')}
            onImageUpload={handleImageUpload}
            fileInputRef={fileInputRef}
          />
        )}

        {currentPage === 'edit' && selectedManga && (
          <AddEditPage
            manga={selectedManga}
            onSave={(data) => updateManga(selectedManga.id, data)}
            onCancel={() => setCurrentPage('detail')}
            onImageUpload={handleImageUpload}
            fileInputRef={fileInputRef}
          />
        )}

        {currentPage === 'detail' && selectedManga && (
          <DetailPage
            manga={selectedManga}
            onBack={() => setCurrentPage('library')}
            onEdit={() => setCurrentPage('edit')}
            onDelete={() => {
              if (confirm('Are you sure you want to delete this manga?')) {
                deleteManga(selectedManga.id);
              }
            }}
            onChapterUpdate={(increment) => updateChapter(selectedManga.id, increment)}
          />
        )}

        {currentPage === 'genres' && (
          <GenresPage
            genres={getAllGenres()}
            onGenreClick={(genre) => {
              setSearchQuery('');
              setFilterType('all');
              setFilterStatus('all');
              setFilterGenre(genre);
              setCurrentPage('library');
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            isDarkMode={isDarkMode}
            onThemeToggle={() => setIsDarkMode(!isDarkMode)}
            onExport={exportData}
            onImport={importData}
            totalMangas={mangas.length}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
};

// Home Page Component
const HomePage: React.FC<{
  stats: any;
  recentMangas: Manga[];
  onMangaClick: (manga: Manga) => void;
  onNavigate: (page: Page) => void;
}> = ({ stats, recentMangas, onMangaClick, onNavigate }) => (
  <div className="safe-top p-6">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">Manga Tracker</h1>
      <p className="text-muted-foreground">Track your reading progress</p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="manga-card text-center">
        <div className="text-2xl font-bold text-primary">{stats.total}</div>
        <div className="text-sm text-muted-foreground">Total</div>
      </div>
      <div className="manga-card text-center">
        <div className="text-2xl font-bold text-info">{stats.reading}</div>
        <div className="text-sm text-muted-foreground">Reading</div>
      </div>
      <div className="manga-card text-center">
        <div className="text-2xl font-bold text-success">{stats.completed}</div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </div>
      <div className="manga-card text-center">
        <div className="text-2xl font-bold text-warning">{stats.onHold + stats.planToRead}</div>
        <div className="text-sm text-muted-foreground">Pending</div>
      </div>
    </div>

    {/* Recent Manga */}
    {recentMangas.length > 0 && (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Additions</h2>
        <div className="space-y-3">
          {recentMangas.map(manga => (
            <div 
              key={manga.id} 
              className="manga-card flex items-center gap-4 cursor-pointer"
              onClick={() => onMangaClick(manga)}
            >
              {manga.coverImage ? (
                <img 
                  src={manga.coverImage} 
                  alt={manga.title}
                  className="w-12 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Book className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium truncate">{manga.title}</h3>
                <p className="text-sm text-muted-foreground">{manga.author}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`status-${manga.status.replace('-', '-')}`}>
                    {manga.status.replace('-', ' ')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Ch. {manga.currentChapter}
                    {manga.totalChapters > 0 && `/${manga.totalChapters}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Quick Actions */}
    <div className="grid grid-cols-2 gap-4">
      <button 
        onClick={() => onNavigate('add')}
        className="btn-primary flex items-center justify-center gap-2 py-4"
      >
        <Plus className="w-5 h-5" />
        Add Manga
      </button>
      <button 
        onClick={() => onNavigate('library')}
        className="btn-secondary flex items-center justify-center gap-2 py-4"
      >
        <Book className="w-5 h-5" />
        View Library
      </button>
    </div>
  </div>
);

// Library Page Component
const LibraryPage: React.FC<{
  mangas: Manga[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  onMangaClick: (manga: Manga) => void;
}> = ({ 
  mangas, 
  searchQuery, 
  onSearchChange, 
  filterType, 
  onFilterTypeChange, 
  filterStatus, 
  onFilterStatusChange, 
  onMangaClick 
}) => (
  <div className="safe-top">
    {/* Header */}
    <div className="p-6 pb-4">
      <h1 className="text-2xl font-bold mb-4">Library</h1>
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          className="form-select min-w-[120px]"
        >
          <option value="all">All Types</option>
          <option value="manga">Manga</option>
          <option value="manhwa">Manhwa</option>
          <option value="manhua">Manhua</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="form-select min-w-[140px]"
        >
          <option value="all">All Status</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="plan-to-read">Plan to Read</option>
        </select>
      </div>
    </div>

    {/* Manga List */}
    <div className="px-6 space-y-4">
      {mangas.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No manga found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add your first manga to get started'}
          </p>
        </div>
      ) : (
        mangas.map(manga => (
          <MangaCard 
            key={manga.id} 
            manga={manga} 
            onClick={() => onMangaClick(manga)} 
          />
        ))
      )}
    </div>
  </div>
);

// Manga Card Component
const MangaCard: React.FC<{ manga: Manga; onClick: () => void }> = ({ manga, onClick }) => (
  <div className="manga-card flex gap-4 cursor-pointer" onClick={onClick}>
    {manga.coverImage ? (
      <img 
        src={manga.coverImage} 
        alt={manga.title}
        className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
      />
    ) : (
      <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <Book className="w-6 h-6 text-muted-foreground" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="font-medium truncate">{manga.title}</h3>
      <p className="text-sm text-muted-foreground truncate">{manga.author}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`status-${manga.status.replace('-', '-')}`}>
          {manga.status.replace('-', ' ')}
        </span>
        <span className="text-sm text-muted-foreground">
          {manga.type.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-muted-foreground">
          Ch. {manga.currentChapter}
          {manga.totalChapters > 0 && `/${manga.totalChapters}`}
        </span>
        {manga.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-warning fill-current" />
            <span className="text-sm">{manga.rating}/10</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Add/Edit Page Component
const AddEditPage: React.FC<{
  manga?: Manga;
  onSave: (data: MangaFormData) => void;
  onCancel: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<string>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({ manga, onSave, onCancel, onImageUpload, fileInputRef }) => {
  const [formData, setFormData] = useState<MangaFormData>({
    title: manga?.title || '',
    type: manga?.type || 'manga',
    author: manga?.author || '',
    description: manga?.description || '',
    genres: manga?.genres || [],
    coverImage: manga?.coverImage || '',
    rating: manga?.rating || 0,
    notes: manga?.notes || '',
    currentChapter: manga?.currentChapter || 0,
    totalChapters: manga?.totalChapters || 0,
    sourceUrl: manga?.sourceUrl || '',
    status: manga?.status || 'plan-to-read'
  });

  const [genreInput, setGenreInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageData = await onImageUpload(e);
    setFormData(prev => ({ ...prev, coverImage: imageData }));
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.genres.includes(genreInput.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, genreInput.trim()]
      }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  return (
    <div className="safe-top p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="btn-ghost p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">
          {manga ? 'Edit Manga' : 'Add New Manga'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <div className="flex items-center gap-4">
            {formData.coverImage ? (
              <img 
                src={formData.coverImage} 
                alt="Cover" 
                className="w-20 h-28 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-28 bg-muted rounded-lg flex items-center justify-center">
                <Book className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full"
              >
                {formData.coverImage ? 'Change Image' : 'Upload Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="form-input"
            required
          />
        </div>

        {/* Type and Author */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="form-select"
            >
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              className="form-input"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="form-textarea h-24"
            rows={3}
          />
        </div>

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium mb-2">Genres</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
              placeholder="Enter genre..."
              className="form-input flex-1"
            />
            <button type="button" onClick={addGenre} className="btn-secondary px-4">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.genres.map(genre => (
              <span key={genre} className="genre-tag cursor-pointer" onClick={() => removeGenre(genre)}>
                {genre} ×
              </span>
            ))}
          </div>
        </div>

        {/* Status and Rating */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="form-select"
            >
              <option value="plan-to-read">Plan to Read</option>
              <option value="reading">Reading</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rating (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              className="form-input"
            />
          </div>
        </div>

        {/* Chapters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Chapter</label>
            <input
              type="number"
              min="0"
              value={formData.currentChapter}
              onChange={(e) => setFormData(prev => ({ ...prev, currentChapter: parseInt(e.target.value) || 0 }))}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Total Chapters</label>
            <input
              type="number"
              min="0"
              value={formData.totalChapters}
              onChange={(e) => setFormData(prev => ({ ...prev, totalChapters: parseInt(e.target.value) || 0 }))}
              className="form-input"
              placeholder="0 = Unknown"
            />
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label className="block text-sm font-medium mb-2">Source URL</label>
          <input
            type="url"
            value={formData.sourceUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
            className="form-input"
            placeholder="https://..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Personal Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="form-textarea h-24"
            rows={3}
            placeholder="Your thoughts, reminders, etc..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            {manga ? 'Save Changes' : 'Add Manga'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Detail Page Component
const DetailPage: React.FC<{
  manga: Manga;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChapterUpdate: (increment: boolean) => void;
}> = ({ manga, onBack, onEdit, onDelete, onChapterUpdate }) => {
  const progress = manga.totalChapters > 0 ? (manga.currentChapter / manga.totalChapters) * 100 : 0;

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <button onClick={onBack} className="btn-ghost p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn-ghost p-2">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="btn-ghost p-2 text-destructive">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Cover and Basic Info */}
        <div className="flex gap-6">
          {manga.coverImage ? (
            <img 
              src={manga.coverImage} 
              alt={manga.title}
              className="w-32 h-44 object-cover rounded-2xl shadow-card"
            />
          ) : (
            <div className="w-32 h-44 bg-muted rounded-2xl flex items-center justify-center">
              <Book className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{manga.title}</h1>
            <p className="text-lg text-muted-foreground mb-2">{manga.author}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className={`status-${manga.status.replace('-', '-')}`}>
                {manga.status.replace('-', ' ')}
              </span>
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm">
                {manga.type.toUpperCase()}
              </span>
            </div>
            {manga.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="rating-stars">
                  {[...Array(10)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`star ${i < Math.floor(manga.rating) ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{manga.rating}/10</span>
              </div>
            )}
          </div>
        </div>

        {/* Chapter Progress */}
        <div className="manga-card">
          <h3 className="font-semibold mb-3">Reading Progress</h3>
          <div className="chapter-counter">
            <button 
              onClick={() => onChapterUpdate(false)}
              className="chapter-btn"
              disabled={manga.currentChapter <= 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1">
              <div className="text-lg font-semibold">
                Chapter {manga.currentChapter}
                {manga.totalChapters > 0 && ` / ${manga.totalChapters}`}
              </div>
              {manga.totalChapters > 0 && (
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-smooth"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            <button 
              onClick={() => onChapterUpdate(true)}
              className="chapter-btn"
              disabled={manga.totalChapters > 0 && manga.currentChapter >= manga.totalChapters}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {manga.sourceUrl && (
            <button
              onClick={() => window.open(manga.sourceUrl, '_blank')}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Read Chapter
            </button>
          )}
        </div>

        {/* Genres */}
        {manga.genres.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {manga.genres.map(genre => (
                <span key={genre} className="genre-tag">{genre}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {manga.description && (
          <div>
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{manga.description}</p>
          </div>
        )}

        {/* Notes */}
        {manga.notes && (
          <div>
            <h3 className="font-semibold mb-3">Personal Notes</h3>
            <div className="manga-card">
              <p className="text-muted-foreground leading-relaxed">{manga.notes}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-sm text-muted-foreground">
          <p>Added: {new Date(manga.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(manga.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

// Settings Page Component
const SettingsPage: React.FC<{
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalMangas: number;
}> = ({ isDarkMode, onThemeToggle, onExport, onImport, totalMangas }) => (
  <div className="safe-top p-6">
    <h1 className="text-2xl font-bold mb-6">Settings</h1>

    <div className="space-y-6">
      {/* Theme */}
      <div className="manga-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Dark Mode</h3>
            <p className="text-sm text-muted-foreground">Toggle app theme</p>
          </div>
          <button onClick={onThemeToggle} className="btn-secondary p-3">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="manga-card">
        <h3 className="font-semibold mb-4">Data Management</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Manga: {totalMangas}</span>
          </div>
          <button onClick={onExport} className="btn-secondary w-full flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </button>
          <label className="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-5 h-5" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* About */}
      <div className="manga-card">
        <h3 className="font-semibold mb-4">About</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Manga Tracker PWA</p>
          <p>Offline-first manga reading tracker</p>
          <p>All data stored locally on your device</p>
        </div>
      </div>
    </div>
  </div>
);

// Bottom Navigation Component
const BottomNav: React.FC<{
  currentPage: Page;
  onNavigate: (page: Page) => void;
}> = ({ currentPage, onNavigate }) => (
  <nav className="bottom-nav">
    <button
      onClick={() => onNavigate('home')}
      className={`bottom-nav-item ${currentPage === 'home' ? 'active' : ''}`}
    >
      <Home className="w-6 h-6" />
      <span className="text-xs mt-1">Home</span>
    </button>
    <button
      onClick={() => onNavigate('library')}
      className={`bottom-nav-item ${currentPage === 'library' ? 'active' : ''}`}
    >
      <Book className="w-6 h-6" />
      <span className="text-xs mt-1">Library</span>
    </button>
    <button
      onClick={() => onNavigate('genres')}
      className={`bottom-nav-item ${currentPage === 'genres' ? 'active' : ''}`}
    >
      <Tag className="w-6 h-6" />
      <span className="text-xs mt-1">Genres</span>
    </button>
    <button
      onClick={() => onNavigate('add')}
      className={`bottom-nav-item ${currentPage === 'add' ? 'active' : ''}`}
    >
      <Plus className="w-6 h-6" />
      <span className="text-xs mt-1">Add</span>
    </button>
    <button
      onClick={() => onNavigate('settings')}
      className={`bottom-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
    >
      <Settings className="w-6 h-6" />
      <span className="text-xs mt-1">Settings</span>
    </button>
  </nav>
);

// Genres Page Component
const GenresPage: React.FC<{
  genres: { genre: string; count: number }[];
  onGenreClick: (genre: string) => void;
  onNavigate: (page: Page) => void;
}> = ({ genres, onGenreClick, onNavigate }) => (
  <div className="safe-top p-6">
    <h1 className="text-2xl font-bold mb-6">Genres</h1>
    
    {genres.length === 0 ? (
      <div className="text-center py-12">
        <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No genres found</h3>
        <p className="text-muted-foreground mb-6">
          Add some manga with genres to see them here
        </p>
        <button 
          onClick={() => onNavigate('add')}
          className="btn-primary"
        >
          Add Your First Manga
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        <p className="text-muted-foreground mb-4">
          Browse your collection by genre ({genres.length} total)
        </p>
        
        <div className="grid gap-3">
          {genres.map(({ genre, count }) => (
            <div
              key={genre}
              className="manga-card flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-smooth"
              onClick={() => onGenreClick(genre)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">{genre}</h3>
                  <p className="text-sm text-muted-foreground">
                    {count} {count === 1 ? 'title' : 'titles'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('library')}
              className="btn-secondary flex items-center justify-center gap-2 py-3"
            >
              <Book className="w-5 h-5" />
              Browse All
            </button>
            <button 
              onClick={() => onNavigate('add')}
              className="btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default MangaApp;