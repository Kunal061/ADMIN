import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useState, useRef, useEffect } from 'react';
import type { StyleOption } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { S3Image } from '@/components/ui/S3Image';

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

export function StylePage() {
  const { styles, showToast } = useApp();
  const [displayStyles, setDisplayStyles] = useState<StyleOption[]>(styles);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editingStyle, setEditingStyle] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleIconFile, setNewStyleIconFile] = useState<File | null>(null);
  const [newStyleIconPreview, setNewStyleIconPreview] = useState('');

  const [newStyleImagePreview, setNewStyleImagePreview] = useState('');
  const [newStyleImageFile, setNewStyleImageFile] = useState<File | null>(null);
  const [editStyleName, setEditStyleName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Combined manage dialog state
  const [activeActionStyle, setActiveActionStyle] = useState<any>(null);
  const [manageStyleName, setManageStyleName] = useState('');
  const [manageStyleIconPreview, setManageStyleIconPreview] = useState('');
  const [manageStyleIconFile, setManageStyleIconFile] = useState<File | null>(null);
  const [manageStyleImagePreview, setManageStyleImagePreview] = useState('');
  const [manageStyleImageFile, setManageStyleImageFile] = useState<File | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStyleId, setDeleteStyleId] = useState('');
  const [deleteStyleName, setDeleteStyleName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);


  const mapApiStyle = (style: any): StyleOption => {
    let iconUrl = style.icon || '';
    let imageUrl = style.image || '';

    // Dev proxy hack removed - handled by S3Image

    return {
      id: String(style.id || style._id),
      name: style.styleName || style.name || '',
      icon: iconUrl,
      image: imageUrl,
    };
  };

  const fetchStylesFromAPI = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.get('/styles/get-all-styles');
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to fetch styles');
      }
      const list = data?.data?.data || data?.data || data || [];
      const transformed = Array.isArray(list) ? list.map(mapApiStyle) : [];
      setDisplayStyles(transformed);
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch styles', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch styles';
        setApiError(message);
        showToast(message, 'error');
        setDisplayStyles(styles);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStylesFromAPI();

    const intervalId = setInterval(() => {
      fetchStylesFromAPI(true);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, displayStyles.length]);

  // Refs for file inputs
  const addStyleIconInputRef = useRef<HTMLInputElement>(null);
  const addStyleImageInputRef = useRef<HTMLInputElement>(null);
  const manageStyleIconInputRef = useRef<HTMLInputElement>(null);
  const manageStyleImageInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = async (styleId: string, file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('icon', file);
    try {
      const response = await apiClient.put(`/styles/update-style/${styleId}`, formData);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to update style');
      }
      showToast('Style updated successfully!');
      fetchStylesFromAPI();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update style';
      showToast(message, 'error');
    }
  };

  const clearIconPreview = () => {
    if (newStyleIconPreview) URL.revokeObjectURL(newStyleIconPreview);
    if (newStyleImagePreview) URL.revokeObjectURL(newStyleImagePreview);

    setNewStyleIconPreview('');
    setNewStyleImagePreview('');

    setNewStyleIconFile(null);
    setNewStyleImageFile(null);
  };

  const clearAddStyleMedia = () => {
    clearIconPreview();
  };

  const handleCreateStyle = async () => {
    if (!newStyleName.trim()) {
      showToast('Please enter a style name', 'error');
      return;
    }
    if (!newStyleIconFile) {
      showToast('Please upload an icon', 'error');
      return;
    }
    if (!newStyleImageFile) {
      showToast('Please upload an image', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('name', newStyleName.trim());
    if (newStyleIconFile) formData.append('icon', newStyleIconFile);
    if (newStyleImageFile) formData.append('image', newStyleImageFile);
    try {
      const response = await apiClient.post('/styles/create-style', formData);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to create style');
      }
      showToast('Style added successfully!');
      fetchStylesFromAPI();
      setNewStyleName('');
      clearAddStyleMedia();
      setDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create style';
      showToast(message, 'error');
    }
  };

  const handleUpdateStyle = async () => {
    if (!editingStyle || !editStyleName.trim()) {
      alert('Please enter a style name');
      return;
    }
    try {
      const response = await apiClient.put(`/styles/update-style/${editingStyle.id}`, {
        name: editStyleName.trim(),
        icon: editingStyle.icon || undefined,
        image: editingStyle.image || undefined,
      });
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to update style');
      }
      showToast('Style updated successfully!');
      fetchStylesFromAPI();
      setEditingStyle(null);
      setEditStyleName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update style';
      showToast(message, 'error');
    }
  };

  const handleDeleteStyle = async (id: string) => {
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(`/styles/delete-style/${id}`);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to delete style');
      }
      showToast('Style deleted successfully!', 'error');
      fetchStylesFromAPI();
      if (activeActionStyle?.id === id) {
        setActiveActionStyle(null);
        setManageStyleName('');
        setManageStyleIconPreview('');
        setManageStyleImagePreview('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete style';
      showToast(message, 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteStyleId('');
      setDeleteStyleName('');
    }
  };

  const handleRequestDeleteStyle = (id: string, name: string) => {
    setDeleteStyleId(id);
    setDeleteStyleName(name);
    setDeleteDialogOpen(true);
  };

  // Combined manage dialog handlers
  const handleOpenManageDialog = (style: any) => {
    setActiveActionStyle(style);
    setManageStyleName(style.name);
    // Revoke previous URLs if they were blobs
    if (manageStyleIconPreview.startsWith('blob:')) URL.revokeObjectURL(manageStyleIconPreview);
    if (manageStyleImagePreview.startsWith('blob:')) URL.revokeObjectURL(manageStyleImagePreview);

    setManageStyleIconPreview(style.icon || '');
    setManageStyleImagePreview(style.image || '');
    setManageStyleIconFile(null);
    setManageStyleImageFile(null);
  };

  const handleManageIconUpload = (file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setManageStyleIconPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setManageStyleIconFile(file);
  };

  const handleManageImageUpload = (file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setManageStyleImagePreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setManageStyleImageFile(file);
  };

  const handleSaveManageStyle = async () => {
    if (!activeActionStyle || !manageStyleName.trim()) {
      showToast('Please enter a style name', 'error');
      return;
    }
    if (!manageStyleIconPreview) {
      showToast('Icon is required', 'error');
      return;
    }
    if (!manageStyleImagePreview) {
      showToast('Image is required', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('name', manageStyleName.trim());
    if (manageStyleIconFile) formData.append('icon', manageStyleIconFile);
    if (manageStyleImageFile) formData.append('image', manageStyleImageFile);

    try {
      const response = await apiClient.put(`/styles/update-style/${activeActionStyle.id}`, formData);
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || 'Failed to update style');
      }
      showToast('Style updated successfully!');
      fetchStylesFromAPI();
      setActiveActionStyle(null);
      setManageStyleName('');

      // Cleanup
      if (manageStyleIconPreview.startsWith('blob:')) URL.revokeObjectURL(manageStyleIconPreview);
      if (manageStyleImagePreview.startsWith('blob:')) URL.revokeObjectURL(manageStyleImagePreview);

      setManageStyleIconPreview('');
      setManageStyleImagePreview('');
      setManageStyleIconFile(null);
      setManageStyleImageFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update style';
      showToast(message, 'error');
    }
  };

  const handleCancelManageStyle = () => {
    setActiveActionStyle(null);
    setManageStyleName('');

    // Cleanup
    if (manageStyleIconPreview.startsWith('blob:')) URL.revokeObjectURL(manageStyleIconPreview);
    if (manageStyleImagePreview.startsWith('blob:')) URL.revokeObjectURL(manageStyleImagePreview);

    setManageStyleIconPreview('');
    setManageStyleImagePreview('');
    setManageStyleIconFile(null);
    setManageStyleImageFile(null);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Search Box + Add Style */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search styles by name..."
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
              setNewStyleName('');
              clearAddStyleMedia();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto text-white hover:opacity-90 border-0 font-medium px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: '#06B3C4' }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Style
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Style</DialogTitle>
              <DialogDescription>
                Create a new style option for trips.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="style-name">Name</Label>
                <Input
                  id="style-name"
                  placeholder="Enter style name"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateStyle();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-style-icon">Icon <span className="text-red-500">*</span></Label>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {newStyleIconPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-white shadow-sm">
                      <S3Image
                        src={newStyleIconPreview}
                        alt="Icon preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No icon</span>
                    </div>
                  )}
                  <input
                    ref={addStyleIconInputRef}
                    id="add-style-icon"
                    type="file"
                    accept={ACCEPTED_ICON_ACCEPT}
                    className="visually-hidden-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!isValidIconFile(file)) {
                        showToast('Please upload a valid image file (SVG, JPG, or PNG)', 'error');
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_BYTES) {
                        showToast('File size must be less than 5MB', 'error');
                        return;
                      }
                      const previewUrl = URL.createObjectURL(file);
                      setNewStyleIconPreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return previewUrl;
                      });
                      setNewStyleIconFile(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="add-style-icon"
                    className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newStyleIconPreview ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-style-image">Image <span className="text-red-500">*</span></Label>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {newStyleImagePreview ? (
                    <div className="w-48 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-white shadow-sm">
                      <S3Image
                        src={newStyleImagePreview}
                        alt="Style image preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                  <input
                    ref={addStyleImageInputRef}
                    id="add-style-image"
                    type="file"
                    accept="image/*"
                    className="visually-hidden-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        e.target.value = '';
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_BYTES) {
                        showToast('File size must be less than 5MB', 'error');
                        e.target.value = '';
                        return;
                      }
                      const previewUrl = URL.createObjectURL(file);
                      setNewStyleImagePreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return previewUrl;
                      });
                      setNewStyleImageFile(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="add-style-image"
                    className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newStyleImagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>

            </div>
            <DialogFooter>

              <Button
                onClick={handleCreateStyle}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Create Style
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Styles Table */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#EEF0F1' }}>
        {apiError && (
          <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
            Failed to load styles: {apiError}
          </div>
        )}
        {(() => {
          const query = searchQuery.toLowerCase().trim();
          const filteredStyles = !query
            ? displayStyles
            : displayStyles.filter((style) =>
              style.name.toLowerCase().includes(query)
            );

          // Pagination calculations
          const totalPages = Math.ceil(filteredStyles.length / ITEMS_PER_PAGE) || 1;
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const endIndex = startIndex + ITEMS_PER_PAGE;
          const paginatedStyles = filteredStyles.slice(startIndex, endIndex);

          return filteredStyles.length === 0 ? (
            <div className="text-center py-12">
              {isLoading ? (
                <p className="text-gray-500">Loading styles...</p>
              ) : (
                <p className="text-gray-500">
                  {searchQuery.trim() ? 'No styles found matching your search.' : 'No styles created yet'}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="lg:hidden space-y-3 p-4">
                {paginatedStyles.map((style) => (
                  <div
                    key={style.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#EEF0F1' }}
                  >
                    {style.icon ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                        <S3Image
                          src={style.icon}
                          alt={style.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                        <span className="text-gray-400 text-xs">—</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 font-medium text-gray-900">{style.name}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenManageDialog(style)}
                        className="h-8 w-8 p-0 hover:opacity-90 border-0"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestDeleteStyle(String(style.id), style.name)}
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
                      <th className="w-[20%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Name</th>
                      <th className="w-[15%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Icon</th>
                      <th className="w-[20%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Image</th>
                      <th className="w-[15%] text-right py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStyles.map((style) => {
                      return (
                        <tr
                          key={style.id}
                          className="border-b transition-colors"
                          style={{
                            borderColor: '#EEF0F1',
                          }}
                        >
                          <td className="w-[20%] py-4 px-6 text-left">
                            <div className="font-medium text-gray-900">
                              {style.name}
                            </div>
                          </td>
                          <td className="w-[15%] py-4 px-6 text-left">
                            <div className="flex items-center justify-start gap-3">
                              {style.icon ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white">
                                  <S3Image
                                    src={style.icon}
                                    alt={style.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : null}
                              <input
                                id={`style-icon-${style.id}`}
                                type="file"
                                accept="image/*"
                                className="visually-hidden-input"
                                onChange={(e) =>
                                  handleIconUpload(style.id, e.target.files?.[0] || null)
                                }
                              />
                            </div>
                          </td>
                          <td className="w-[20%] py-4 px-6 text-left">
                            {(style as any).image ? (
                              <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 bg-white">
                                <S3Image
                                  src={(style as any).image}
                                  alt={`${style.name} image`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="w-[15%] py-3 px-6 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleOpenManageDialog(style)}
                                className="h-7 w-7 p-0 hover:opacity-90 border-0"
                                style={{ backgroundColor: '#06B3C4' }}
                              >
                                <Edit className="h-4 w-4 text-white" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRequestDeleteStyle(String(style.id), style.name)}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredStyles.length)} of {filteredStyles.length} styles
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

      {/* Edit Style Dialog */}
      {editingStyle && (
        <Dialog open={!!editingStyle} onOpenChange={(open) => {
          if (!open) {
            setEditingStyle(null);
            setEditStyleName('');
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Style</DialogTitle>
              <DialogDescription>
                Update style details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-style-name">Name</Label>
                <Input
                  id="edit-style-name"
                  value={editStyleName || editingStyle.name}
                  onChange={(e) => setEditStyleName(e.target.value)}
                  placeholder="Enter style name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateStyle();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>

              <Button
                onClick={handleUpdateStyle}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#03A9F4' }}
              >
                Update Style
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Combined Manage Style Dialog */}
      {activeActionStyle && (
        <Dialog open={!!activeActionStyle} onOpenChange={(open) => {
          if (!open) {
            handleCancelManageStyle();
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Manage Style</DialogTitle>
              <DialogDescription>
                Update style name, icon, and image.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manage-style-name">Name</Label>
                <Input
                  id="manage-style-name"
                  value={manageStyleName}
                  onChange={(e) => setManageStyleName(e.target.value)}
                  placeholder="Enter style name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-style-icon">Icon <span className="text-red-500">*</span></Label>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {manageStyleIconPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-white shadow-sm">
                      <S3Image
                        src={manageStyleIconPreview}
                        alt="Style icon preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No icon</span>
                    </div>
                  )}
                  <input
                    ref={manageStyleIconInputRef}
                    id={`manage-icon-${activeActionStyle.id}`}
                    type="file"
                    accept={ACCEPTED_ICON_ACCEPT}
                    className="visually-hidden-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        e.target.value = '';
                        return;
                      }
                      if (!isValidIconFile(file)) {
                        showToast('Please upload a valid image file (SVG, JPG, or PNG)', 'error');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_BYTES) {
                        showToast('File size must be less than 5MB', 'error');
                        e.target.value = '';
                        return;
                      }
                      handleManageIconUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`manage-icon-${activeActionStyle.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageStyleIconPreview ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-style-image">Image <span className="text-red-500">*</span></Label>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {manageStyleImagePreview ? (
                    <div className="w-48 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-white shadow-sm">
                      <S3Image
                        src={manageStyleImagePreview}
                        alt="Style image preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                  <input
                    ref={manageStyleImageInputRef}
                    id={`manage-image-${activeActionStyle.id}`}
                    type="file"
                    accept="image/*"
                    className="visually-hidden-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        e.target.value = '';
                        return;
                      }
                      // Basic image validation (check size)
                      if (file.size > MAX_IMAGE_SIZE_BYTES) {
                        showToast('File size must be less than 5MB', 'error');
                        e.target.value = '';
                        return;
                      }
                      handleManageImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`manage-image-${activeActionStyle.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageStyleImagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>


            </div>
            <DialogFooter className="flex flex-row justify-between w-full">

              <Button
                onClick={handleSaveManageStyle}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Save Changes
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
            setDeleteStyleId('');
            setDeleteStyleName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-[#06B3C4]">{deleteStyleName || 'this style'}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">

            <Button
              type="button"
              className="h-9 px-4 text-sm text-white font-medium"
              style={{ backgroundColor: '#06B3C4' }}
              disabled={!deleteStyleId || deleteLoading}
              onClick={() => {
                if (!deleteStyleId) return;
                handleDeleteStyle(deleteStyleId);
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
