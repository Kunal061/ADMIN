import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Edit, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPalette } from '@/components/ColorPalette';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ACCEPTED_ICON_EXTENSIONS = ['.svg', '.jpg', '.jpeg', '.png'];
const ACCEPTED_ICON_TYPES = ['image/svg+xml', 'image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_ICON_ACCEPT = '.svg,.jpg,.jpeg,.png,image/svg+xml,image/jpeg,image/jpg,image/png';

const isValidIconFile = (file: File): boolean => {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  const typeOk = ACCEPTED_ICON_TYPES.includes(file.type);
  const extOk = ACCEPTED_ICON_EXTENSIONS.includes(ext);
  return typeOk || extOk;
};

const getMoodIconUrl = (mood: any): string => {
  if (typeof mood.icon === 'string' && mood.icon.trim()) return mood.icon.trim();
  if (typeof mood.image === 'string' && mood.image.trim()) return mood.image.trim();
  const mi = mood.moodImage;
  if (mi && typeof mi === 'object' && typeof mi.image === 'string' && mi.image.trim())
    return mi.image.trim();
  if (typeof mi === 'string' && mi.trim()) return mi.trim();
  return '';
};

const revokeBlobUrl = (url: string) => {
  if (url?.startsWith?.('blob:')) URL.revokeObjectURL(url);
};

const isSvgUrl = (url: string) => /\.svg(\?|$)/i.test(url) || /image\/svg/i.test(url);

export function MoodPage() {
  const { showToast } = useApp();
  const [moods, setMoods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editingMood, setEditingMood] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodColor, setNewMoodColor] = useState('#000000');
  const [newMoodIconFile, setNewMoodIconFile] = useState<File | null>(null);
  const [newMoodIconPreview, setNewMoodIconPreview] = useState('');
  const [editMoodName, setEditMoodName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Combined manage dialog state
  const [activeActionMood, setActiveActionMood] = useState<any>(null);
  const [manageMoodName, setManageMoodName] = useState('');
  const [manageMoodIconFile, setManageMoodIconFile] = useState<File | null>(null);
  const [manageMoodIconPreview, setManageMoodIconPreview] = useState('');
  const [manageMoodColor, setManageMoodColor] = useState('#000000');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMoodId, setDeleteMoodId] = useState('');
  const [deleteMoodName, setDeleteMoodName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [manageSaveLoading, setManageSaveLoading] = useState(false);
  const [createMoodLoading, setCreateMoodLoading] = useState(false);
  const [failedIconIds, setFailedIconIds] = useState<Set<string>>(new Set());

  const addMoodIconInputRef = useRef<HTMLInputElement>(null);
  const manageMoodIconInputRef = useRef<HTMLInputElement>(null);

  const mapApiMood = (mood: any) => ({
    id: String(mood.id || mood._id),
    name: mood.moodName || mood.name || '',
    image: getMoodIconUrl(mood),
    moodImage: mood.image ? { image: mood.image } : undefined,
    color: mood.color || '#000000',
    isActive: mood.isActive ?? true,
  });

  const fetchMoodsFromAPI = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.get('/moods/get-all-moods');
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to fetch moods from API');
      }
      const list = data?.data?.data || data?.data || data || [];
      const transformed = Array.isArray(list) ? list.map(mapApiMood) : [];
      setMoods(transformed);
      setFailedIconIds(new Set());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch moods';
      setApiError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodsFromAPI();
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, moods.length]);

  const handleCreateMood = async () => {
    if (!newMoodName.trim()) {
      alert('Please enter a mood name');
      return;
    }
    if (!newMoodIconFile) {
      alert('Please upload a mood icon');
      return;
    }
    if (!newMoodColor.trim()) {
      alert('Please select a color');
      return;
    }

    try {
      setCreateMoodLoading(true);
      const formData = new FormData();
      formData.append('moodName', newMoodName.trim());
      if (newMoodColor.trim()) {
        formData.append('color', newMoodColor.trim());
      }
      if (newMoodIconFile) {
        formData.append('icon', newMoodIconFile, newMoodIconFile.name);
      }
      const response = await apiClient.post('/moods/create-mood', formData);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to create mood');
      }
      showToast('Mood added successfully!');
      setNewMoodName('');
      setNewMoodColor('#000000');
      setNewMoodIconFile(null);
      setNewMoodIconPreview((prev) => {
        revokeBlobUrl(prev);
        return '';
      });
      setDialogOpen(false);
      fetchMoodsFromAPI();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create mood';
      showToast(message, 'error');
    } finally {
      setCreateMoodLoading(false);
    }
  };

  const handleUpdateMood = async () => {
    if (!editingMood || !editMoodName.trim()) {
      alert('Please enter a mood name');
      return;
    }
    try {
      const response = await apiClient.put(`/moods/update-mood/${editingMood.id}`, {
        moodName: editMoodName.trim(),
      });
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to update mood');
      }
      showToast('Mood updated successfully!');
      setEditingMood(null);
      setEditMoodName('');
      fetchMoodsFromAPI();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update mood';
      showToast(message, 'error');
    }
  };

  const handleDeleteMood = async (id: string) => {
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(`/moods/delete-mood/${id}`);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to delete mood');
      }
      showToast('Mood deleted successfully!', 'error');
      if (activeActionMood?.id === id) {
        setActiveActionMood(null);
        setManageMoodName('');
        setManageMoodIconPreview((prev) => {
          revokeBlobUrl(prev);
          return '';
        });
        setManageMoodIconFile(null);
      }
      fetchMoodsFromAPI();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete mood';
      showToast(message, 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteMoodId('');
      setDeleteMoodName('');
    }
  };

  const handleRequestDeleteMood = (id: string, name: string) => {
    setDeleteMoodId(id);
    setDeleteMoodName(name);
    setDeleteDialogOpen(true);
  };

  // Combined manage dialog handlers
  const handleOpenManageDialog = (mood: any) => {
    setActiveActionMood(mood);
    setManageMoodName(mood.name);
    setManageMoodIconPreview(mood.image || '');
    setManageMoodIconFile(null);
    setManageMoodColor(mood.color || '#000000');
  };

  const handleSaveManageMood = async () => {
    if (!activeActionMood || !manageMoodName.trim()) {
      alert('Please enter a mood name');
      return;
    }
    try {
      setManageSaveLoading(true);
      const formData = new FormData();
      formData.append('moodName', manageMoodName.trim());
      if (manageMoodColor.trim()) {
        formData.append('color', manageMoodColor.trim());
      }
      if (manageMoodIconFile) {
        formData.append('icon', manageMoodIconFile, manageMoodIconFile.name);
      }
      const response = await apiClient.put(`/moods/update-mood/${activeActionMood.id}`, formData);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to update mood');
      }
      showToast('Mood updated successfully!');
      setActiveActionMood(null);
      setManageMoodName('');
      setManageMoodIconPreview((prev) => {
        revokeBlobUrl(prev);
        return '';
      });
      setManageMoodIconFile(null);
      setManageMoodColor('#000000');
      fetchMoodsFromAPI();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update mood';
      showToast(message, 'error');
    } finally {
      setManageSaveLoading(false);
    }
  };

  const handleCancelManageMood = () => {
    setActiveActionMood(null);
    setManageMoodName('');
    setManageMoodIconPreview((prev) => {
      revokeBlobUrl(prev);
      return '';
    });
    setManageMoodIconFile(null);
    setManageMoodColor('#000000');
    setManageSaveLoading(false);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Search Box + Add Mood */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search moods by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-full rounded-full bg-white shadow-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setNewMoodName('');
              setNewMoodColor('#000000');
              setNewMoodIconFile(null);
              setNewMoodIconPreview((prev) => {
                revokeBlobUrl(prev);
                return '';
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto text-white hover:opacity-90 border-0 font-medium px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: '#06B3C4' }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mood
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Mood</DialogTitle>
              <DialogDescription>
                Create a new mood option for trips.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="mood-name">Name</Label>
                <Input
                  id="mood-name"
                  placeholder="Enter mood name"
                  value={newMoodName}
                  onChange={(e) => setNewMoodName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateMood();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-mood-icon">Icon</Label>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {newMoodIconPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-white shadow-sm">
                      <img
                        src={newMoodIconPreview}
                        alt="Icon preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No icon</span>
                    </div>
                  )}
                  <input
                    ref={addMoodIconInputRef}
                    id="add-mood-icon"
                    type="file"
                    accept={ACCEPTED_ICON_ACCEPT}
                    className="visually-hidden-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!isValidIconFile(file)) {
                        alert('Please choose an image in .svg, .jpg, .jpeg, or .png format.');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_BYTES) {
                        alert('Image is too large. Please choose an image under 5 MB.');
                        e.target.value = '';
                        return;
                      }
                      setNewMoodIconFile(file);
                      setNewMoodIconPreview((prev) => {
                        revokeBlobUrl(prev);
                        return URL.createObjectURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="add-mood-icon"
                    className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newMoodIconPreview ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood-color">Color</Label>
                <ColorPalette
                  selectedColor={newMoodColor}
                  onColorSelect={setNewMoodColor}
                  showCustomPicker={true}
                />
              </div>

            </div>
            <DialogFooter>

              <Button
                onClick={handleCreateMood}
                disabled={createMoodLoading}
                className="text-white hover:opacity-90 border-0 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#06B3C4' }}
              >
                {createMoodLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Mood'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {apiError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ⚠️ {apiError}
        </div>
      )}
      {isLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
          Loading moods...
        </div>
      )}

      {/* Moods Table */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#EEF0F1' }}>
        {(() => {
          const query = searchQuery.toLowerCase().trim();
          const filteredMoods = !query
            ? moods
            : moods.filter((mood) => mood.name.toLowerCase().includes(query));

          // Pagination calculations
          const totalPages = Math.ceil(filteredMoods.length / ITEMS_PER_PAGE) || 1;
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const endIndex = startIndex + ITEMS_PER_PAGE;
          const paginatedMoods = filteredMoods.slice(startIndex, endIndex);

          return filteredMoods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery.trim() ? 'No moods found matching your search.' : 'No moods created yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="lg:hidden space-y-3 p-4">
                {paginatedMoods.map((mood) => (
                  <div
                    key={mood.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#EEF0F1' }}
                  >
                    <div className="shrink-0 flex items-center gap-3">
                      {mood.image && !failedIconIds.has(mood.id) ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                          <img
                            src={mood.image}
                            alt={mood.name}
                            className="w-full h-full object-contain"
                            onError={() => setFailedIconIds(prev => new Set(prev).add(mood.id))}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">—</span>
                        </div>
                      )}
                      <div
                        className="w-8 h-8 rounded border border-gray-300 shrink-0"
                        style={{ backgroundColor: mood.color || '#000000' }}
                        title={mood.color || '#000000'}
                      />
                    </div>
                    <div className="flex-1 min-w-0 font-medium text-gray-900">{mood.name}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenManageDialog(mood)}
                        className="h-8 w-8 p-0 hover:opacity-90 border-0"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestDeleteMood(String(mood.id), mood.name)}
                        className="h-8 w-8 p-0 hover:opacity-90 border-0"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#EEF0F1' }}>
                      <th className="w-[25%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Name</th>
                      <th className="w-[20%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Icon</th>
                      <th className="w-[10%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Color</th>
                      <th className="w-[15%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Color Code</th>
                      <th className="w-[20%] text-right py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMoods.map((mood) => {
                      return (
                        <tr
                          key={mood.id}
                          className="border-b transition-colors"
                          style={{
                            borderColor: '#EEF0F1',
                          }}
                        >
                          <td className="w-[25%] py-4 px-6 text-left">
                            <div className="font-medium text-gray-900">
                              {mood.name}
                            </div>
                          </td>
                          <td className="w-[20%] py-4 px-6 text-left">
                            {mood.image && !failedIconIds.has(mood.id) ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                                <img
                                  src={mood.image}
                                  alt={mood.name}
                                  className="w-full h-full object-contain"
                                  onError={() => setFailedIconIds(prev => new Set(prev).add(mood.id))}
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="w-[10%] py-4 px-6 text-left">
                            <div
                              className="w-8 h-8 rounded border border-gray-300"
                              style={{ backgroundColor: mood.color || '#000000' }}
                              title={mood.color || '#000000'}
                            />
                          </td>
                          <td className="w-[15%] py-4 px-6 text-left">
                            <span className="text-sm text-gray-700 font-mono">{mood.color || '#000000'}</span>
                          </td>
                          <td className="w-[20%] py-3 px-6 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleOpenManageDialog(mood)}
                                className="h-7 w-7 p-0 hover:opacity-90 border-0"
                                style={{ backgroundColor: '#06B3C4' }}
                              >
                                <Edit className="h-4 w-4 text-white" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRequestDeleteMood(String(mood.id), mood.name)}
                                className="h-7 w-7 p-0 hover:opacity-90 border-0"
                                style={{ backgroundColor: '#06B3C4' }}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-4 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: '#EEF0F1' }}>
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMoods.length)} of {filteredMoods.length} moods
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return <span key={page} className="px-2 text-gray-500">...</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <Button
                          key={page}
                          variant="ghost"
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 min-w-8 px-2 text-sm border transition-colors ${currentPage === page
                            ? 'text-white font-semibold border-transparent hover:bg-[#06B3C4]'
                            : 'text-gray-700 bg-white border-gray-300 hover:border-[#06B3C4] hover:text-[#06B3C4] hover:bg-white'
                            }`}
                          style={
                            currentPage === page
                              ? { backgroundColor: '#06B3C4' }
                              : { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' }
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Edit Mood Dialog */}
      {editingMood && (
        <Dialog open={!!editingMood} onOpenChange={(open) => {
          if (!open) {
            setEditingMood(null);
            setEditMoodName('');
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Mood</DialogTitle>
              <DialogDescription>
                Update mood details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-mood-name">Name</Label>
                <Input
                  id="edit-mood-name"
                  value={editMoodName || editingMood.name}
                  onChange={(e) => setEditMoodName(e.target.value)}
                  placeholder="Enter mood name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateMood();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>

              <Button
                onClick={handleUpdateMood}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#03A9F4' }}
              >
                Update Mood
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Combined Manage Mood Dialog */}
      {activeActionMood && (
        <Dialog open={!!activeActionMood} onOpenChange={(open) => {
          if (!open) {
            handleCancelManageMood();
          }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Manage Mood</DialogTitle>
              <DialogDescription>
                Update mood name, icon, and status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manage-mood-name">Name</Label>
                <Input
                  id="manage-mood-name"
                  value={manageMoodName}
                  onChange={(e) => setManageMoodName(e.target.value)}
                  placeholder="Enter mood name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-mood-icon">Icon</Label>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {manageMoodIconPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-white shadow-sm flex items-center justify-center">
                      <img
                        src={manageMoodIconPreview}
                        alt="Mood icon preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No icon</span>
                    </div>
                  )}
                  <input
                    ref={manageMoodIconInputRef}
                    id={`manage-icon-${activeActionMood.id}`}
                    type="file"
                    accept={ACCEPTED_ICON_ACCEPT}
                    className="visually-hidden-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!isValidIconFile(file)) {
                        alert('Please choose an image in .svg, .jpg, .jpeg, or .png format.');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_BYTES) {
                        alert('Image is too large. Please choose an image under 5 MB.');
                        e.target.value = '';
                        return;
                      }
                      setManageMoodIconFile(file);
                      setManageMoodIconPreview((prev) => {
                        revokeBlobUrl(prev);
                        return URL.createObjectURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`manage-icon-${activeActionMood.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageMoodIconPreview ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-mood-color">Color</Label>
                <ColorPalette
                  selectedColor={manageMoodColor}
                  onColorSelect={setManageMoodColor}
                  showCustomPicker={true}
                />
              </div>

            </div>
            <DialogFooter className="flex flex-row justify-between w-full">

              <Button
                onClick={handleSaveManageMood}
                disabled={manageSaveLoading}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#06B3C4' }}
              >
                {manageSaveLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteDialogOpen(false);
            setDeleteMoodId('');
            setDeleteMoodName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Mood</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-[#06B3C4]">{deleteMoodName || 'this mood'}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">

            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              disabled={!deleteMoodId || deleteLoading}
              onClick={() => {
                if (!deleteMoodId) return;
                handleDeleteMood(deleteMoodId);
              }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
