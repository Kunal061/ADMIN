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

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_LOAD_ERROR_MSG = 'Image could not be loaded. Try a smaller or different image.';

export function MoodPage() {
  const { moods, addMood, updateMood, deleteMood, showToast } = useApp();
  const [editingMood, setEditingMood] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodImage, setNewMoodImage] = useState('');
  const [newMoodIcon, setNewMoodIcon] = useState('');
  const [editMoodName, setEditMoodName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  // Combined manage dialog state
  const [activeActionMood, setActiveActionMood] = useState<any>(null);
  const [manageMoodName, setManageMoodName] = useState('');
  const [manageMoodImage, setManageMoodImage] = useState('');
  const [manageMoodUserInputImage, setManageMoodUserInputImage] = useState('');
  const [manageMoodIsActive, setManageMoodIsActive] = useState(false);

  const addMoodIconInputRef = useRef<HTMLInputElement>(null);
  const addMoodImageInputRef = useRef<HTMLInputElement>(null);
  const manageMoodIconInputRef = useRef<HTMLInputElement>(null);
  const manageMoodImageInputRef = useRef<HTMLInputElement>(null);

  const handleCreateMood = () => {
    if (!newMoodName.trim()) {
      alert('Please enter a mood name');
      return;
    }
    addMood({
      name: newMoodName.trim(),
      description: '',
      icon: newMoodIcon || '',
      isActive: true,
      ...(newMoodIcon ? { image: newMoodIcon } : {}),
      ...(newMoodImage ? { moodImage: { image: newMoodImage } } : {}),
    });
    showToast('Mood added successfully!');
    setNewMoodName('');
    setNewMoodImage('');
    setNewMoodIcon('');
    setDialogOpen(false);
  };

  const handleUpdateMood = () => {
    if (!editingMood || !editMoodName.trim()) {
      alert('Please enter a mood name');
      return;
    }
    updateMood(editingMood.id, {
      name: editMoodName.trim(),
    });
    showToast('Mood updated successfully!');
    setEditingMood(null);
    setEditMoodName('');
  };

  const handleDeleteMood = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMood(id);
      showToast('Mood deleted successfully!');
      if (activeActionMood?.id === id) {
        setActiveActionMood(null);
        setManageMoodName('');
        setManageMoodImage('');
        setManageMoodUserInputImage('');
        setManageMoodIsActive(false);
      }
    }
  };

  // Combined manage dialog handlers
  const handleOpenManageDialog = (mood: any) => {
    setActiveActionMood(mood);
    setManageMoodName(mood.name);
    setManageMoodImage(mood.image || '');
    setManageMoodUserInputImage(mood.moodImage?.image ?? '');
    setManageMoodIsActive(mood.isActive);
  };

  const handleSaveManageMood = () => {
    if (!activeActionMood || !manageMoodName.trim()) {
      alert('Please enter a mood name');
      return;
    }
    updateMood(activeActionMood.id, {
      name: manageMoodName.trim(),
      image: manageMoodImage,
      isActive: manageMoodIsActive,
      moodImage: manageMoodUserInputImage ? { image: manageMoodUserInputImage } : undefined,
    });
    showToast('Mood updated successfully!');
    setActiveActionMood(null);
    setManageMoodName('');
    setManageMoodImage('');
    setManageMoodUserInputImage('');
    setManageMoodIsActive(false);
  };

  const handleCancelManageMood = () => {
    setActiveActionMood(null);
    setManageMoodName('');
    setManageMoodImage('');
    setManageMoodUserInputImage('');
    setManageMoodIsActive(false);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Search Box + Add Mood */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search moods by name or status..."
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
              setNewMoodName('');
              setNewMoodImage('');
              setNewMoodIcon('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="text-white hover:opacity-90 border-0 font-medium px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: '#06B3C4' }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mood
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newMoodIcon ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={newMoodIcon}
                          alt="Icon preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={addMoodIconInputRef}
                      id="add-mood-icon"
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > MAX_IMAGE_SIZE_BYTES) {
                          alert('Image is too large. Please choose an image under 5 MB.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setNewMoodIcon(result);
                        };
                        reader.onerror = () => {
                          alert(IMAGE_LOAD_ERROR_MSG);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor="add-mood-icon"
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer shrink-0"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newMoodIcon ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>User input image</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newMoodImage ? (
                      <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={newMoodImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={addMoodImageInputRef}
                      id="add-mood-image"
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > MAX_IMAGE_SIZE_BYTES) {
                          alert('Image is too large. Please choose an image under 5 MB.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setNewMoodImage(result);
                        };
                        reader.onerror = () => {
                          alert(IMAGE_LOAD_ERROR_MSG);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor="add-mood-image"
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {newMoodImage ? 'Change image' : 'Choose image'}
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  setNewMoodName('');
                  setNewMoodImage('');
                  setNewMoodIcon('');
                }}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMood}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Create Mood
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Moods Table */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#EEF0F1' }}>
        {(() => {
          const query = searchQuery.toLowerCase().trim();
          const filteredMoods = !query
            ? moods
            : moods.filter(
                (mood) =>
                  mood.name.toLowerCase().includes(query) ||
                  (mood.isActive ? 'active' : 'inactive').includes(query)
              );
          return filteredMoods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery.trim() ? 'No moods found matching your search.' : 'No moods created yet'}
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
                {filteredMoods.map((mood) => {
                  const isActive = mood.isActive;
                  return (
                    <tr
                      key={mood.id}
                      className="border-b transition-colors"
                      style={{
                        borderColor: '#EEF0F1',
                      }}
                    >
                      <td className="w-[20%] py-4 px-6 text-left">
                        <div className="font-medium text-gray-900">
                          {mood.name}
                        </div>
                      </td>
                      <td className="w-[15%] py-4 px-6 text-left">
                        {mood.image ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white">
                            <img
                              src={mood.image}
                              alt={mood.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
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
                        {mood.moodImage?.image ? (
                          <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                            <img
                              src={mood.moodImage.image}
                              alt={`${mood.name} preview`}
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
                            onClick={() => handleOpenManageDialog(mood)}
                            className="h-7 w-7 p-0 hover:opacity-90 border-0"
                            style={{ backgroundColor: '#06B3C4' }}
                          >
                            <Edit className="h-4 w-4 text-white" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteMood(mood.id, mood.name)}
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
                variant="outline"
                onClick={() => {
                  setEditingMood(null);
                  setEditMoodName('');
                }}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#03A9F4' }}
              >
                Cancel
              </Button>
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
          <DialogContent className="sm:max-w-md">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {manageMoodImage ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={manageMoodImage}
                          alt="Mood icon preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={manageMoodIconInputRef}
                      id={`manage-icon-${activeActionMood.id}`}
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > MAX_IMAGE_SIZE_BYTES) {
                          alert('Image is too large. Please choose an image under 5 MB.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setManageMoodImage(result);
                        };
                        reader.onerror = () => {
                          alert(IMAGE_LOAD_ERROR_MSG);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor={`manage-icon-${activeActionMood.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer shrink-0"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageMoodImage ? 'Change Icon' : 'Upload Icon'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>User input image</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {manageMoodUserInputImage ? (
                      <div className="w-14 h-10 rounded overflow-hidden border border-gray-200 bg-white shrink-0">
                        <img
                          src={manageMoodUserInputImage}
                          alt="User input preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={manageMoodImageInputRef}
                      id={`manage-user-input-image-${activeActionMood.id}`}
                      type="file"
                      accept="image/*"
                      className="visually-hidden-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > MAX_IMAGE_SIZE_BYTES) {
                          alert('Image is too large. Please choose an image under 5 MB.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result;
                          if (typeof result === 'string') setManageMoodUserInputImage(result);
                        };
                        reader.onerror = () => {
                          alert(IMAGE_LOAD_ERROR_MSG);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <label
                    htmlFor={`manage-user-input-image-${activeActionMood.id}`}
                    className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium text-white hover:opacity-90 border-0 cursor-pointer shrink-0"
                    style={{ backgroundColor: '#06B3C4' }}
                  >
                    {manageMoodUserInputImage ? 'Change image' : 'Upload image'}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-mood-status">Status</Label>
                <select
                  id="manage-mood-status"
                  value={manageMoodIsActive ? 'Active' : 'Inactive'}
                  onChange={(e) => setManageMoodIsActive(e.target.value === 'Active')}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between w-full">
              <Button
                onClick={handleCancelManageMood}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveManageMood}
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
