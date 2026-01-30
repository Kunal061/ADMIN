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
import { useState, useRef } from 'react';

export function StylePage() {
  const { styles, toggleStyle, addStyle, updateStyle, deleteStyle, showToast } = useApp();
  const [editingStyle, setEditingStyle] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleIcon, setNewStyleIcon] = useState('');
  const [newStyleImage, setNewStyleImage] = useState('');
  const [editStyleName, setEditStyleName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  // Combined manage dialog state
  const [activeActionStyle, setActiveActionStyle] = useState<any>(null);
  const [manageStyleName, setManageStyleName] = useState('');
  const [manageStyleImage, setManageStyleImage] = useState('');
  const [manageStyleUserInputImage, setManageStyleUserInputImage] = useState('');
  const [manageStyleIsActive, setManageStyleIsActive] = useState(false);

  // Refs for file inputs
  const addStyleIconInputRef = useRef<HTMLInputElement>(null);
  const addStyleImageInputRef = useRef<HTMLInputElement>(null);
  const manageStyleIconInputRef = useRef<HTMLInputElement>(null);
  const manageStyleImageInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (styleId: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        updateStyle(styleId, { image: result });
        showToast('Style updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStyle = () => {
    if (!newStyleName.trim()) {
      alert('Please enter a style name');
      return;
    }
    addStyle({
      name: newStyleName.trim(),
      description: '',
      icon: '',
      isActive: true,
      ...(newStyleIcon ? { image: newStyleIcon } : {}),
      ...(newStyleImage ? { styleImage: { image: newStyleImage } } : {}),
    });
    showToast('Style added successfully!');
    setNewStyleName('');
    setNewStyleIcon('');
    setNewStyleImage('');
    setDialogOpen(false);
  };

  const handleUpdateStyle = () => {
    if (!editingStyle || !editStyleName.trim()) {
      alert('Please enter a style name');
      return;
    }
    updateStyle(editingStyle.id, {
      name: editStyleName.trim(),
    });
    showToast('Style updated successfully!');
    setEditingStyle(null);
    setEditStyleName('');
  };

  const handleDeleteStyle = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteStyle(id);
      showToast('Style deleted successfully!');
      if (activeActionStyle?.id === id) {
        setActiveActionStyle(null);
        setManageStyleName('');
        setManageStyleImage('');
        setManageStyleUserInputImage('');
        setManageStyleIsActive(false);
      }
    }
  };

  // Combined manage dialog handlers
  const handleOpenManageDialog = (style: any) => {
    setActiveActionStyle(style);
    setManageStyleName(style.name);
    setManageStyleImage(style.image || '');
    setManageStyleUserInputImage(style.styleImage?.image ?? '');
    setManageStyleIsActive(style.isActive);
  };

  const handleManageIconUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setManageStyleImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveManageStyle = () => {
    if (!activeActionStyle || !manageStyleName.trim()) {
      alert('Please enter a style name');
      return;
    }
    updateStyle(activeActionStyle.id, {
      name: manageStyleName.trim(),
      image: manageStyleImage,
      isActive: manageStyleIsActive,
      styleImage: manageStyleUserInputImage ? { image: manageStyleUserInputImage } : undefined,
    });
    showToast('Style updated successfully!');
    setActiveActionStyle(null);
    setManageStyleName('');
    setManageStyleImage('');
    setManageStyleUserInputImage('');
    setManageStyleIsActive(false);
  };

  const handleCancelManageStyle = () => {
    setActiveActionStyle(null);
    setManageStyleName('');
    setManageStyleImage('');
    setManageStyleUserInputImage('');
    setManageStyleIsActive(false);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Search Box + Add Style */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search styles by name or status..."
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
              setNewStyleIcon('');
              setNewStyleImage('');
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
                    {newStyleIcon ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={newStyleIcon}
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
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setNewStyleIcon(result);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor="add-style-icon"
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newStyleIcon ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>User input image</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newStyleImage ? (
                      <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={newStyleImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={addStyleImageInputRef}
                      id="add-style-image"
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setNewStyleImage(result);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor="add-style-image"
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newStyleImage ? 'Change image' : 'Choose image'}
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  setNewStyleName('');
                  setNewStyleIcon('');
                  setNewStyleImage('');
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
        {(() => {
          const query = searchQuery.toLowerCase().trim();
          const filteredStyles = !query
            ? styles
            : styles.filter(
                (style) =>
                  style.name.toLowerCase().includes(query) ||
                  (style.isActive ? 'active' : 'inactive').includes(query)
              );
          return filteredStyles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery.trim() ? 'No styles found matching your search.' : 'No styles created yet'}
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b" style={{ borderColor: '#EEF0F1' }}>
                  <th className="w-[20%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Name</th>
                  <th className="w-[15%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Icon</th>
                  <th className="w-[12%] text-center py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="w-[15%] text-left py-4 px-6 text-sm font-semibold text-gray-700">Preview</th>
                  <th className="w-[18%] text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStyles.map((style) => {
                  const isActive = style.isActive;
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
                          {style.image ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white">
                              <img
                                src={style.image}
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
                      <td className="w-[12%] py-3 px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1 rounded-full text-xs font-medium text-center ${
                            isActive
                              ? 'text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          style={isActive ? { backgroundColor: '#06B3C4' } : undefined}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="w-[15%] py-3 px-6 text-left">
                        {style.styleImage?.image ? (
                          <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                            <img
                              src={style.styleImage.image}
                              alt={`${style.name} preview`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="w-[18%] py-3 px-6 text-center">
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
                            onClick={() => handleDeleteStyle(style.id, style.name)}
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
                Update style name, icon, and status.
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
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setManageStyleUserInputImage(result);
                        };
                        reader.readAsDataURL(file);
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

              <div className="space-y-2">
                <Label htmlFor="manage-style-status">Status</Label>
                <select
                  id="manage-style-status"
                  value={manageStyleIsActive ? 'Active' : 'Inactive'}
                  onChange={(e) => setManageStyleIsActive(e.target.value === 'Active')}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
