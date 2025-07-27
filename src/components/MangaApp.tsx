import React, { useState, useEffect, useRef } from 'react';
import { Book, Home, Plus, Settings, Search, Filter, Star, ExternalLink, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, MoreVertical, Download, Upload, Moon, Sun, Tag, BarChart3, Target, List, Clock, Calendar, TrendingUp, Award, Play, Pause, Timer, FileText, Grid3X3, SortAsc, SortDesc } from 'lucide-react';

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

interface ReadingSession {
  id: string;
  mangaId: string;
  chaptersRead: number;
  startChapter: number;
  endChapter: number;
  duration: number; // in minutes
  date: string;
  notes?: string;
}

interface CustomList {
  id: string;
  name: string;
  description: string;
  mangaIds: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface ReadingGoal {
  id: string;
  title: string;
  type: 'chapters' | 'manga' | 'time';
  target: number;
  current: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface MangaFormData extends Omit<Manga, 'id' | 'createdAt' | 'updatedAt'> {}

type Page = 'home' | 'library' | 'add' | 'settings' | 'detail' | 'edit' | 'genres' | 'stats' | 'goals' | 'lists' | 'history' | 'import';

const MangaApp: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [readingGoals, setReadingGoals] = useState<ReadingGoal[]>([]);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterList, setFilterList] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // File input ref for cover images
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data and apply dark mode on mount
  useEffect(() => {
    loadAllData();
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
  const loadAllData = () => {
    try {
      const mangaData = localStorage.getItem('mangaTracker_data');
      const sessionData = localStorage.getItem('mangaTracker_sessions');
      const listData = localStorage.getItem('mangaTracker_lists');
      const goalData = localStorage.getItem('mangaTracker_goals');
      
      if (mangaData) setMangas(JSON.parse(mangaData));
      if (sessionData) setReadingSessions(JSON.parse(sessionData));
      if (listData) setCustomLists(JSON.parse(listData));
      if (goalData) setReadingGoals(JSON.parse(goalData));
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

  const saveReadingSessions = (data: ReadingSession[]) => {
    try {
      localStorage.setItem('mangaTracker_sessions', JSON.stringify(data));
      setReadingSessions(data);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };

  const saveCustomLists = (data: CustomList[]) => {
    try {
      localStorage.setItem('mangaTracker_lists', JSON.stringify(data));
      setCustomLists(data);
    } catch (error) {
      console.error('Error saving lists:', error);
    }
  };

  const saveReadingGoals = (data: ReadingGoal[]) => {
    try {
      localStorage.setItem('mangaTracker_goals', JSON.stringify(data));
      setReadingGoals(data);
    } catch (error) {
      console.error('Error saving goals:', error);
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
    const manga = mangas.find(m => m.id === id);
    if (!manga) return;

    const oldChapter = manga.currentChapter;
    const newChapter = increment 
      ? Math.min(manga.currentChapter + 1, manga.totalChapters || 99999)
      : Math.max(manga.currentChapter - 1, 0);
    
    const updatedMangas = mangas.map(manga => {
      if (manga.id === id) {
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
    
    // Create reading session if chapters changed
    if (newChapter !== oldChapter) {
      const session: ReadingSession = {
        id: Date.now().toString(),
        mangaId: id,
        chaptersRead: increment ? 1 : -1,
        startChapter: increment ? oldChapter + 1 : newChapter + 1,
        endChapter: increment ? newChapter : oldChapter,
        duration: 0, // Will be tracked in future
        date: new Date().toISOString(),
      };
      saveReadingSessions([...readingSessions, session]);
    }
    
    if (selectedManga) {
      setSelectedManga(updatedMangas.find(m => m.id === id) || null);
    }
  };

  // Reading Session CRUD
  const addReadingSession = (session: Omit<ReadingSession, 'id'>) => {
    const newSession: ReadingSession = {
      ...session,
      id: Date.now().toString(),
    };
    saveReadingSessions([...readingSessions, newSession]);
  };

  // Custom Lists CRUD
  const addCustomList = (name: string, description: string, color: string) => {
    const newList: CustomList = {
      id: Date.now().toString(),
      name,
      description,
      mangaIds: [],
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCustomLists([...customLists, newList]);
  };

  const updateCustomList = (id: string, updates: Partial<CustomList>) => {
    const updatedLists = customLists.map(list =>
      list.id === id
        ? { ...list, ...updates, updatedAt: new Date().toISOString() }
        : list
    );
    saveCustomLists(updatedLists);
  };

  const deleteCustomList = (id: string) => {
    const updatedLists = customLists.filter(list => list.id !== id);
    saveCustomLists(updatedLists);
  };

  const addMangaToList = (listId: string, mangaId: string) => {
    const updatedLists = customLists.map(list =>
      list.id === listId && !list.mangaIds.includes(mangaId)
        ? { ...list, mangaIds: [...list.mangaIds, mangaId], updatedAt: new Date().toISOString() }
        : list
    );
    saveCustomLists(updatedLists);
  };

  const removeMangaFromList = (listId: string, mangaId: string) => {
    const updatedLists = customLists.map(list =>
      list.id === listId
        ? { ...list, mangaIds: list.mangaIds.filter(id => id !== mangaId), updatedAt: new Date().toISOString() }
        : list
    );
    saveCustomLists(updatedLists);
  };

  // Reading Goals CRUD
  const addReadingGoal = (goal: Omit<ReadingGoal, 'id' | 'current'>) => {
    const newGoal: ReadingGoal = {
      ...goal,
      id: Date.now().toString(),
      current: 0,
    };
    saveReadingGoals([...readingGoals, newGoal]);
  };

  const updateReadingGoal = (id: string, updates: Partial<ReadingGoal>) => {
    const updatedGoals = readingGoals.map(goal =>
      goal.id === id ? { ...goal, ...updates } : goal
    );
    saveReadingGoals(updatedGoals);
  };

  const deleteReadingGoal = (id: string) => {
    const updatedGoals = readingGoals.filter(goal => goal.id !== id);
    saveReadingGoals(updatedGoals);
  };

  // Filtering and search
  const filteredMangas = mangas.filter(manga => {
    const matchesSearch = manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         manga.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || manga.type === filterType;
    const matchesStatus = filterStatus === 'all' || manga.status === filterStatus;
    const matchesGenre = filterGenre === 'all' || manga.genres.includes(filterGenre);
    const matchesList = filterList === 'all' || customLists.find(list => list.id === filterList)?.mangaIds.includes(manga.id);
    return matchesSearch && matchesType && matchesStatus && matchesGenre && matchesList;
  }).sort((a, b) => {
    const getValue = (manga: Manga) => {
      switch (sortBy) {
        case 'title': return manga.title.toLowerCase();
        case 'author': return manga.author.toLowerCase();
        case 'rating': return manga.rating;
        case 'progress': return manga.totalChapters > 0 ? manga.currentChapter / manga.totalChapters : 0;
        case 'created': return new Date(manga.createdAt).getTime();
        case 'updated': return new Date(manga.updatedAt).getTime();
        default: return new Date(manga.updatedAt).getTime();
      }
    };
    
    const aVal = getValue(a);
    const bVal = getValue(b);
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
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

  // Enhanced statistics
  const getAdvancedStats = () => {
    const totalChapters = mangas.reduce((sum, manga) => sum + manga.currentChapter, 0);
    const averageRating = mangas.length > 0 ? mangas.reduce((sum, manga) => sum + manga.rating, 0) / mangas.length : 0;
    const completionRate = mangas.length > 0 ? (stats.completed / mangas.length) * 100 : 0;
    
    const readingSessions30Days = readingSessions.filter(session => 
      new Date(session.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );
    
    const chaptersThisMonth = readingSessions30Days.reduce((sum, session) => sum + session.chaptersRead, 0);
    
    return {
      ...stats,
      totalChapters,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: Math.round(completionRate),
      chaptersThisMonth,
      sessionsThisMonth: readingSessions30Days.length,
    };
  };

  // Export/Import functionality
  const exportData = (format: 'json' | 'csv' = 'json') => {
    if (format === 'json') {
      const allData = {
        mangas,
        readingSessions,
        customLists,
        readingGoals,
        exportDate: new Date().toISOString()
      };
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manga-tracker-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // CSV export for manga data
      const headers = ['Title', 'Author', 'Type', 'Status', 'Current Chapter', 'Total Chapters', 'Rating', 'Genres', 'Created Date'];
      const csvData = [
        headers.join(','),
        ...mangas.map(manga => [
          `"${manga.title.replace(/"/g, '""')}"`,
          `"${manga.author.replace(/"/g, '""')}"`,
          manga.type,
          manga.status,
          manga.currentChapter,
          manga.totalChapters,
          manga.rating,
          `"${manga.genres.join('; ')}"`,
          new Date(manga.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n');
      
      const dataBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manga-tracker-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.mangas && Array.isArray(data.mangas)) {
          // Full backup import
          saveMangas(data.mangas);
          if (data.readingSessions) saveReadingSessions(data.readingSessions);
          if (data.customLists) saveCustomLists(data.customLists);
          if (data.readingGoals) saveReadingGoals(data.readingGoals);
          alert('Full backup imported successfully!');
        } else if (Array.isArray(data)) {
          // Legacy manga-only import
          saveMangas(data);
          alert('Manga data imported successfully!');
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
            filterGenre={filterGenre}
            onFilterGenreChange={setFilterGenre}
            filterList={filterList}
            onFilterListChange={setFilterList}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            customLists={customLists}
            allGenres={getAllGenres()}
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

        {currentPage === 'stats' && (
          <StatsPage
            stats={getAdvancedStats()}
            mangas={mangas}
            readingSessions={readingSessions}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'goals' && (
          <GoalsPage
            goals={readingGoals}
            onAddGoal={addReadingGoal}
            onUpdateGoal={updateReadingGoal}
            onDeleteGoal={deleteReadingGoal}
            mangas={mangas}
            readingSessions={readingSessions}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'lists' && (
          <ListsPage
            lists={customLists}
            mangas={mangas}
            selectedList={selectedList}
            onListClick={setSelectedList}
            onAddList={addCustomList}
            onUpdateList={updateCustomList}
            onDeleteList={deleteCustomList}
            onAddMangaToList={addMangaToList}
            onRemoveMangaFromList={removeMangaFromList}
            onMangaClick={(manga) => {
              setSelectedManga(manga);
              setCurrentPage('detail');
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'history' && (
          <HistoryPage
            sessions={readingSessions}
            mangas={mangas}
            onMangaClick={(manga) => {
              setSelectedManga(manga);
              setCurrentPage('detail');
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'import' && (
          <ImportPage
            onExport={exportData}
            onImport={importData}
            mangas={mangas}
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
            onNavigate={setCurrentPage}
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
  filterGenre: string;
  onFilterGenreChange: (genre: string) => void;
  filterList: string;
  onFilterListChange: (list: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  customLists: CustomList[];
  allGenres: { genre: string; count: number }[];
  onMangaClick: (manga: Manga) => void;
}> = ({ 
  mangas, 
  searchQuery, 
  onSearchChange, 
  filterType, 
  onFilterTypeChange, 
  filterStatus, 
  onFilterStatusChange,
  filterGenre,
  onFilterGenreChange,
  filterList,
  onFilterListChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  customLists,
  allGenres,
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
      <div className="flex gap-2 overflow-x-auto pb-2">
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          className="form-select min-w-[100px] text-sm"
        >
          <option value="all">All Types</option>
          <option value="manga">Manga</option>
          <option value="manhwa">Manhwa</option>
          <option value="manhua">Manhua</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="form-select min-w-[120px] text-sm"
        >
          <option value="all">All Status</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="plan-to-read">Plan to Read</option>
        </select>
        <select
          value={filterGenre}
          onChange={(e) => onFilterGenreChange(e.target.value)}
          className="form-select min-w-[100px] text-sm"
        >
          <option value="all">All Genres</option>
          {allGenres.map(({ genre }) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
        <select
          value={filterList}
          onChange={(e) => onFilterListChange(e.target.value)}
          className="form-select min-w-[100px] text-sm"
        >
          <option value="all">All Lists</option>
          {customLists.map(list => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>
      </div>

      {/* Sorting */}
      <div className="flex items-center gap-2 mt-3">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="form-select text-sm flex-1"
        >
          <option value="updated">Last Updated</option>
          <option value="created">Date Added</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="rating">Rating</option>
          <option value="progress">Progress</option>
        </select>
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="btn-ghost p-2"
        >
          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
        </button>
      </div>
    </div>

    {/* Manga List */}
    <div className="px-6 space-y-4">
      {mangas.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No manga found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterGenre !== 'all' || filterList !== 'all'
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
  onExport: (format?: 'json' | 'csv') => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalMangas: number;
  onNavigate: (page: Page) => void;
}> = ({ isDarkMode, onThemeToggle, onExport, onImport, totalMangas, onNavigate }) => (
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
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onExport('json')} className="btn-secondary flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button onClick={() => onExport('csv')} className="btn-secondary flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              CSV
            </button>
          </div>
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
          <button onClick={() => onNavigate('import')} className="btn-ghost w-full">
            Advanced Import/Export
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="manga-card">
        <h3 className="font-semibold mb-4">Features</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate('stats')} className="btn-ghost flex items-center justify-center gap-2 py-3">
            <BarChart3 className="w-5 h-5" />
            Statistics
          </button>
          <button onClick={() => onNavigate('goals')} className="btn-ghost flex items-center justify-center gap-2 py-3">
            <Target className="w-5 h-5" />
            Goals
          </button>
          <button onClick={() => onNavigate('lists')} className="btn-ghost flex items-center justify-center gap-2 py-3">
            <List className="w-5 h-5" />
            Custom Lists
          </button>
          <button onClick={() => onNavigate('history')} className="btn-ghost flex items-center justify-center gap-2 py-3">
            <Clock className="w-5 h-5" />
            History
          </button>
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
      <Home className="w-5 h-5" />
      <span className="text-xs mt-1">Home</span>
    </button>
    <button
      onClick={() => onNavigate('library')}
      className={`bottom-nav-item ${currentPage === 'library' ? 'active' : ''}`}
    >
      <Book className="w-5 h-5" />
      <span className="text-xs mt-1">Library</span>
    </button>
    <button
      onClick={() => onNavigate('stats')}
      className={`bottom-nav-item ${currentPage === 'stats' ? 'active' : ''}`}
    >
      <BarChart3 className="w-5 h-5" />
      <span className="text-xs mt-1">Stats</span>
    </button>
    <button
      onClick={() => onNavigate('goals')}
      className={`bottom-nav-item ${currentPage === 'goals' ? 'active' : ''}`}
    >
      <Target className="w-5 h-5" />
      <span className="text-xs mt-1">Goals</span>
    </button>
    <button
      onClick={() => onNavigate('settings')}
      className={`bottom-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
    >
      <Settings className="w-5 h-5" />
      <span className="text-xs mt-1">More</span>
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

// Stats Page Component
const StatsPage: React.FC<{
  stats: any;
  mangas: Manga[];
  readingSessions: ReadingSession[];
  onNavigate: (page: Page) => void;
}> = ({ stats, mangas, readingSessions, onNavigate }) => {
  const genreStats = () => {
    const genreMap = new Map<string, number>();
    mangas.forEach(manga => {
      manga.genres.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });
    return Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const monthlyProgress = () => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthSessions = readingSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getMonth() === date.getMonth() && 
               sessionDate.getFullYear() === date.getFullYear();
      });
      months.push({
        month: date.toLocaleDateString('en', { month: 'short' }),
        chapters: monthSessions.reduce((sum, s) => sum + s.chaptersRead, 0)
      });
    }
    return months;
  };

  return (
    <div className="safe-top p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Statistics</h1>
        <button onClick={() => onNavigate('home')} className="btn-ghost">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="manga-card text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalChapters}</div>
          <div className="text-sm text-muted-foreground">Total Chapters</div>
        </div>
        <div className="manga-card text-center">
          <div className="text-2xl font-bold text-success">{stats.averageRating}</div>
          <div className="text-sm text-muted-foreground">Avg Rating</div>
        </div>
        <div className="manga-card text-center">
          <div className="text-2xl font-bold text-info">{stats.chaptersThisMonth}</div>
          <div className="text-sm text-muted-foreground">This Month</div>
        </div>
        <div className="manga-card text-center">
          <div className="text-2xl font-bold text-warning">{stats.completionRate}%</div>
          <div className="text-sm text-muted-foreground">Completion</div>
        </div>
      </div>

      {/* Monthly Progress */}
      <div className="manga-card mb-6">
        <h3 className="font-semibold mb-4">Monthly Progress</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {monthlyProgress().map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="bg-primary/20 w-full rounded-t"
                style={{ 
                  height: `${Math.max(8, (month.chapters / Math.max(...monthlyProgress().map(m => m.chapters), 1)) * 100)}px`
                }}
              />
              <div className="text-xs mt-2 text-muted-foreground">{month.month}</div>
              <div className="text-xs font-medium">{month.chapters}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Genres */}
      <div className="manga-card">
        <h3 className="font-semibold mb-4">Top Genres</h3>
        <div className="space-y-3">
          {genreStats().map(({ genre, count }) => (
            <div key={genre} className="flex items-center justify-between">
              <span className="text-sm">{genre}</span>
              <div className="flex items-center gap-2">
                <div className="bg-muted h-2 w-24 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(count / Math.max(...genreStats().map(g => g.count))) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Goals Page Component
const GoalsPage: React.FC<{
  goals: ReadingGoal[];
  onAddGoal: (goal: Omit<ReadingGoal, 'id' | 'current'>) => void;
  onUpdateGoal: (id: string, updates: Partial<ReadingGoal>) => void;
  onDeleteGoal: (id: string) => void;
  mangas: Manga[];
  readingSessions: ReadingSession[];
  onNavigate: (page: Page) => void;
}> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, mangas, readingSessions, onNavigate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'chapters' as 'chapters' | 'manga' | 'time',
    target: 10,
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const calculateProgress = (goal: ReadingGoal) => {
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    const now = new Date();

    if (goal.type === 'chapters') {
      const sessions = readingSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= start && sessionDate <= end;
      });
      return sessions.reduce((sum, session) => sum + session.chaptersRead, 0);
    } else if (goal.type === 'manga') {
      return mangas.filter(manga => {
        const completedDate = new Date(manga.updatedAt);
        return manga.status === 'completed' && completedDate >= start && completedDate <= end;
      }).length;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal({
      ...formData,
      isActive: true,
    });
    setShowAddForm(false);
    setFormData({
      title: '',
      type: 'chapters',
      target: 10,
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  return (
    <div className="safe-top p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reading Goals</h1>
        <button onClick={() => onNavigate('home')} className="btn-ghost">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Add Goal Button */}
      {!showAddForm && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary w-full mb-6 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Goal
        </button>
      )}

      {/* Add Goal Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="manga-card mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Goal title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="form-input"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="form-select"
              >
                <option value="chapters">Chapters</option>
                <option value="manga">Manga</option>
              </select>
              <input
                type="number"
                placeholder="Target"
                value={formData.target}
                onChange={(e) => setFormData({...formData, target: parseInt(e.target.value)})}
                className="form-input"
                required
              />
            </div>
            <select
              value={formData.period}
              onChange={(e) => setFormData({...formData, period: e.target.value as any})}
              className="form-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="form-input"
                required
              />
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Add Goal</button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(goal => {
          const progress = calculateProgress(goal);
          const percentage = Math.min((progress / goal.target) * 100, 100);
          
          return (
            <div key={goal.id} className="manga-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {goal.target} {goal.type} • {goal.period}
                  </p>
                </div>
                <button 
                  onClick={() => onDeleteGoal(goal.id)}
                  className="btn-ghost p-1 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{progress} / {goal.target}</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      percentage >= 100 ? 'bg-success' : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              
              {percentage >= 100 && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <Award className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
            </div>
          );
        })}
        
        {goals.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground">Set reading goals to track your progress</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Lists Page Component
const ListsPage: React.FC<{
  lists: CustomList[];
  mangas: Manga[];
  selectedList: CustomList | null;
  onListClick: (list: CustomList) => void;
  onAddList: (name: string, description: string, color: string) => void;
  onUpdateList: (id: string, updates: Partial<CustomList>) => void;
  onDeleteList: (id: string) => void;
  onAddMangaToList: (listId: string, mangaId: string) => void;
  onRemoveMangaFromList: (listId: string, mangaId: string) => void;
  onMangaClick: (manga: Manga) => void;
  onNavigate: (page: Page) => void;
}> = ({ 
  lists, 
  mangas, 
  selectedList, 
  onListClick, 
  onAddList, 
  onDeleteList, 
  onAddMangaToList,
  onRemoveMangaFromList,
  onMangaClick,
  onNavigate 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#a855f7'
  });

  const colors = [
    '#a855f7', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddList(formData.name, formData.description, formData.color);
    setShowAddForm(false);
    setFormData({ name: '', description: '', color: '#a855f7' });
  };

  if (selectedList) {
    const listMangas = mangas.filter(manga => selectedList.mangaIds.includes(manga.id));
    
    return (
      <div className="safe-top p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onListClick(null as any)} className="btn-ghost">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-center">{selectedList.name}</h1>
          <button 
            onClick={() => onDeleteList(selectedList.id)}
            className="btn-ghost text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {selectedList.description && (
          <p className="text-muted-foreground mb-6 text-center">{selectedList.description}</p>
        )}

        <div className="space-y-4">
          {listMangas.map(manga => (
            <div key={manga.id} className="manga-card flex gap-4">
              <div className="flex-1" onClick={() => onMangaClick(manga)}>
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
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{manga.title}</h3>
                <p className="text-sm text-muted-foreground">{manga.author}</p>
              </div>
              <button
                onClick={() => onRemoveMangaFromList(selectedList.id, manga.id)}
                className="btn-ghost p-2 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {listMangas.length === 0 && (
            <div className="text-center py-12">
              <List className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Empty list</h3>
              <p className="text-muted-foreground">Add manga from your library</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="safe-top p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Custom Lists</h1>
        <button onClick={() => onNavigate('home')} className="btn-ghost">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {!showAddForm && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary w-full mb-6 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New List
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="manga-card mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="List name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input resize-none"
              rows={2}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-white shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Create List</button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {lists.map(list => (
          <div 
            key={list.id} 
            className="manga-card cursor-pointer"
            onClick={() => onListClick(list)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: list.color }}
              />
              <div className="flex-1">
                <h3 className="font-semibold">{list.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {list.mangaIds.length} manga
                  {list.description && ` • ${list.description}`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        ))}
        
        {lists.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <List className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No custom lists</h3>
            <p className="text-muted-foreground">Create lists to organize your manga</p>
          </div>
        )}
      </div>
    </div>
  );
};

// History Page Component
const HistoryPage: React.FC<{
  sessions: ReadingSession[];
  mangas: Manga[];
  onMangaClick: (manga: Manga) => void;
  onNavigate: (page: Page) => void;
}> = ({ sessions, mangas, onMangaClick, onNavigate }) => {
  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const groupedSessions = sortedSessions.reduce((groups, session) => {
    const date = new Date(session.date).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ReadingSession[]>);

  return (
    <div className="safe-top p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reading History</h1>
        <button onClick={() => onNavigate('home')} className="btn-ghost">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No reading history</h3>
          <p className="text-muted-foreground">Start reading to track your progress</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([date, daySessions]) => (
            <div key={date}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                {date}
              </h3>
              <div className="space-y-3">
                {daySessions.map(session => {
                  const manga = mangas.find(m => m.id === session.mangaId);
                  if (!manga) return null;
                  
                  return (
                    <div 
                      key={session.id}
                      className="manga-card flex items-center gap-4 cursor-pointer"
                      onClick={() => onMangaClick(manga)}
                    >
                      {manga.coverImage ? (
                        <img 
                          src={manga.coverImage} 
                          alt={manga.title}
                          className="w-10 h-14 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded-lg flex items-center justify-center">
                          <Book className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium truncate">{manga.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.chaptersRead > 0 ? '+' : ''}{session.chaptersRead} chapters
                          {session.chaptersRead > 0 && (
                            <span> • Ch. {session.startChapter}-{session.endChapter}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          session.chaptersRead > 0 ? 'text-success' : 'text-warning'
                        }`}>
                          {session.chaptersRead > 0 ? '+' : ''}{session.chaptersRead}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Import Page Component  
const ImportPage: React.FC<{
  onExport: (format: 'json' | 'csv') => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  mangas: Manga[];
  onNavigate: (page: Page) => void;
}> = ({ onExport, onImport, mangas, onNavigate }) => (
  <div className="safe-top p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Import/Export</h1>
      <button onClick={() => onNavigate('settings')} className="btn-ghost">
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>

    {/* Export Section */}
    <div className="manga-card mb-6">
      <h3 className="font-semibold mb-4">Export Data</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onExport('json')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Full Backup (JSON)
          </button>
          <button 
            onClick={() => onExport('csv')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Manga Only (CSV)
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          JSON includes all data (manga, reading sessions, lists, goals). 
          CSV exports only basic manga information.
        </p>
      </div>
    </div>

    {/* Import Section */}
    <div className="manga-card mb-6">
      <h3 className="font-semibold mb-4">Import Data</h3>
      <div className="space-y-3">
        <label className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer">
          <Upload className="w-5 h-5" />
          Import Backup File
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Import a previously exported JSON backup file to restore your data.
          This will merge with existing data.
        </p>
      </div>
    </div>

    {/* Stats */}
    <div className="manga-card">
      <h3 className="font-semibold mb-4">Current Data</h3>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{mangas.length}</div>
          <div className="text-sm text-muted-foreground">Total Manga</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-info">
            {(JSON.stringify(mangas).length / 1024).toFixed(1)}KB
          </div>
          <div className="text-sm text-muted-foreground">Data Size</div>
        </div>
      </div>
    </div>
  </div>
);

export default MangaApp;