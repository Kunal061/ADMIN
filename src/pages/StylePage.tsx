import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Edit, Search } from 'lucide-react';
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
  const [newStyleImageFile, setNewStyleImageFile] = useState<File | null>(null);
  const [newStyleImagePreview, setNewStyleImagePreview] = useState('');
  const [editStyleName, setEditStyleName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  // Combined manage dialog state
  const [activeActionStyle, setActiveActionStyle] = useState<any>(null);
  const [manageStyleName, setManageStyleName] = useState('');
  const [manageStyleImage, setManageStyleImage] = useState('');
  const [manageStyleUserInputImage, setManageStyleUserInputImage] = useState('');
  const [manageStyleIconFile, setManageStyleIconFile] = useState<File | null>(null);
  const [manageStyleImageFile, setManageStyleImageFile] = useState<File | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_TOKEN = import.meta.env.VITE_API_TOKEN;
  const STYLES_BASE = `${API_BASE_URL}/styles`;

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  });

  const mapApiStyle = (style: any): StyleOption => ({
    id: String(style.id || style._id),
    name: style.styleName || style.name || '',
    icon: style.icon || '',
    image: style.image || '',
  });

  const fetchStylesFromAPI = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`${STYLES_BASE}/get-all-styles`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch styles');
      }
      const list = data?.data?.data || data?.data || data || [];
      const transformed = Array.isArray(list) ? list.map(mapApiStyle) : [];
      setDisplayStyles(transformed);
    } catch (err) {
      console.error('Failed to fetch styles', err);
      setApiError(err instanceof Error ? err.message : 'Failed to fetch styles');
      setDisplayStyles(styles);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStylesFromAPI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const response = await fetch(`${STYLES_BASE}/update-style/${styleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
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
    setNewStyleIconPreview('');
    setNewStyleIconFile(null);
  };

  const clearImagePreview = () => {
    if (newStyleImagePreview) URL.revokeObjectURL(newStyleImagePreview);
    setNewStyleImagePreview('');
    setNewStyleImageFile(null);
  };

  const clearAddStyleMedia = () => {
    clearIconPreview();
    clearImagePreview();
  };

  const handleCreateStyle = async () => {
    if (!newStyleName.trim()) {
      alert('Please enter a style name');
      return;
    }
    const formData = new FormData();
    formData.append('name', newStyleName.trim());
    if (newStyleIconFile) formData.append('icon', newStyleIconFile);
    if (newStyleImageFile) formData.append('image', newStyleImageFile);
    try {
      const response = await fetch(`${STYLES_BASE}/create-style`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
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
      const response = await fetch(`${STYLES_BASE}/update-style/${editingStyle.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editStyleName.trim(),
          icon: editingStyle.icon || undefined,
          image: editingStyle.image || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
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

  const handleDeleteStyle = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await fetch(`${STYLES_BASE}/delete-style/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || 'Failed to delete style');
        }
        showToast('Style deleted successfully!');
        fetchStylesFromAPI();
        if (activeActionStyle?.id === id) {
          setActiveActionStyle(null);
          setManageStyleName('');
          setManageStyleImage('');
          setManageStyleUserInputImage('');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete style';
        showToast(message, 'error');
      }
    }
  };

  // Combined manage dialog handlers
  const handleOpenManageDialog = (style: any) => {
    setActiveActionStyle(style);
    setManageStyleName(style.name);
    if (manageStyleImage.startsWith('blob:')) URL.revokeObjectURL(manageStyleImage);
    if (manageStyleUserInputImage.startsWith('blob:')) URL.revokeObjectURL(manageStyleUserInputImage);
    setManageStyleImage(style.icon || '');
    setManageStyleUserInputImage(style.image || '');
    setManageStyleIconFile(null);
    setManageStyleImageFile(null);
  };

  const handleManageIconUpload = (file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setManageStyleImage((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setManageStyleIconFile(file);
  };

  const handleSaveManageStyle = async () => {
    if (!activeActionStyle || !manageStyleName.trim()) {
      alert('Please enter a style name');
      return;
    }
    const formData = new FormData();
    formData.append('name', manageStyleName.trim());
    if (manageStyleIconFile) formData.append('icon', manageStyleIconFile);
    if (manageStyleImageFile) formData.append('image', manageStyleImageFile);
    try {
      const response = await fetch(`${STYLES_BASE}/update-style/${activeActionStyle.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update style');
      }
      showToast('Style updated successfully!');
      fetchStylesFromAPI();
      setActiveActionStyle(null);
      setManageStyleName('');
      if (manageStyleImage.startsWith('blob:')) URL.revokeObjectURL(manageStyleImage);
      if (manageStyleUserInputImage.startsWith('blob:')) URL.revokeObjectURL(manageStyleUserInputImage);
      setManageStyleImage('');
      setManageStyleUserInputImage('');
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
    if (manageStyleImage.startsWith('blob:')) URL.revokeObjectURL(manageStyleImage);
    if (manageStyleUserInputImage.startsWith('blob:')) URL.revokeObjectURL(manageStyleUserInputImage);
    setManageStyleImage('');
    setManageStyleUserInputImage('');
    setManageStyleIconFile(null);
    setManageStyleImageFile(null);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Search Box + Add Style */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search styles by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 rounded-full bg-white shadow-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
            <Button className="text-white hover:opacity-90 border-0 font-medium px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: '#06B3C4' }}>
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
                <Label>Icon</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newStyleIconPreview ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={newStyleIconPreview}
                          alt="Icon preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={addStyleIconInputRef}
                      id="add-style-icon"
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const previewUrl = URL.createObjectURL(file);
                        setNewStyleIconPreview((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return previewUrl;
                        });
                        setNewStyleIconFile(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor="add-style-icon"
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newStyleIconPreview ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>User input image</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newStyleImagePreview ? (
                      <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={newStyleImagePreview}
                          alt="User input preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={addStyleImageInputRef}
                      id="add-style-user-input-image"
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const previewUrl = URL.createObjectURL(file);
                        setNewStyleImagePreview((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return previewUrl;
                        });
                        setNewStyleImageFile(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor="add-style-user-input-image"
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newStyleImagePreview ? 'Change image' : 'Upload image'}
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  setNewStyleName('');
                  clearAddStyleMedia();
                }}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
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
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b" style={{ borderColor: '#EEF0F1' }}>
                  <th className="w-[25%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Name</th>
                  <th className="w-[20%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Icon</th>
                  <th className="w-[25%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Image</th>
                  <th className="w-[20%] text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStyles.map((style) => {
                  return (
                    <tr
                      key={style.id}
                      className="border-b transition-colors"
                      style={{
                        borderColor: '#EEF0F1',
                      }}
                    >
                      <td className="w-[25%] py-4 px-6 text-left">
                        <div className="font-medium text-gray-900">
                          {style.name}
                        </div>
                      </td>
                      <td className="w-[20%] py-4 px-6 text-left">
                        <div className="flex items-center justify-start gap-3">
                          {style.icon ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white">
                              <img
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
                      <td className="w-[25%] py-3 px-6 text-left">
                        {style.image ? (
                          <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                            <img
                              src={style.image}
                              alt={`${style.name} preview`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="w-[20%] py-3 px-6 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
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
                            onClick={() => handleDeleteStyle(String(style.id), style.name)}
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
                variant="outline"
                onClick={() => {
                  setEditingStyle(null);
                  setEditStyleName('');
                }}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#03A9F4' }}
              >
                Cancel
              </Button>
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
                <Label htmlFor="manage-style-icon">Icon</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {manageStyleImage ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={manageStyleImage}
                          alt="Style icon preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={manageStyleIconInputRef}
                      id={`manage-icon-${activeActionStyle.id}`}
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        handleManageIconUpload(e.target.files?.[0] || null);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor={`manage-icon-${activeActionStyle.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer shrink-0"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageStyleImage ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>User input image</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {manageStyleUserInputImage ? (
                      <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={manageStyleUserInputImage}
                          alt="User input preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={manageStyleImageInputRef}
                      id={`manage-user-input-image-${activeActionStyle.id}`}
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const previewUrl = URL.createObjectURL(file);
                        setManageStyleUserInputImage((prev) => {
                          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                          return previewUrl;
                        });
                        setManageStyleImageFile(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor={`manage-user-input-image-${activeActionStyle.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer shrink-0"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageStyleUserInputImage ? 'Change image' : 'Upload image'}
                  </label>
                </div>
              </div>

            </div>
            <DialogFooter className="flex flex-row justify-between w-full">
              <Button
                onClick={handleCancelManageStyle}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
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
    </div>
  );
}
