import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  X,
  Search
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Trip } from '@/types';

export function TripPage() {
  const { auth, trips, addTrip, deleteTrip, updateTrip, moods, styles, refreshTripsFromStorage, showToast } = useApp();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [editTripDialogOpen, setEditTripDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [moodSelectionDialogOpen, setMoodSelectionDialogOpen] = useState(false);
  const [styleSelectionDialogOpen, setStyleSelectionDialogOpen] = useState(false);
  const [editStyleSelectionDialogOpen, setEditStyleSelectionDialogOpen] = useState(false);
  const [editMoodSelectionDialogOpen, setEditMoodSelectionDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editParticipantSearchQuery, setEditParticipantSearchQuery] = useState('');
  const [newTripParticipantSearchQuery, setNewTripParticipantSearchQuery] = useState('');

  // When Trip page is shown and trips are empty, reload from storage (seeds 20 sample trips if needed)
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.email && trips.length === 0) {
      refreshTripsFromStorage();
    }
  }, [auth.isAuthenticated, auth.user?.email, trips.length, refreshTripsFromStorage]);

  // Keep selectedTrip in sync with trips state
  useEffect(() => {
    if (selectedTrip) {
      const updatedTrip = trips.find(t => t.id === selectedTrip.id);
      if (updatedTrip) {
        setSelectedTrip(updatedTrip);
      } else {
        setSelectedTrip(null); // Trip was deleted
      }
    }
  }, [trips]);

  // Clean up selectedMoods to remove any inactive moods
  useEffect(() => {
    setSelectedMoods(prev => 
      prev.filter(moodId => {
        const mood = moods.find(m => m.id === moodId);
        return mood && mood.isActive;
      })
    );
  }, [moods]);

  // Clean up selectedStyles to remove any inactive styles
  useEffect(() => {
    setSelectedStyles(prev => 
      prev.filter(styleId => {
        const style = styles.find(s => s.id === styleId);
        return style && style.isActive;
      })
    );
  }, [styles]);

  // Clean up editingSelectedMoods to remove any inactive moods
  useEffect(() => {
    setEditingSelectedMoods(prev =>
      prev.filter(moodId => {
        const mood = moods.find(m => m.id === moodId);
        return mood && mood.isActive;
      })
    );
  }, [moods]);

  // New trip form state
  const [newTrip, setNewTrip] = useState<{
    title: string;
    description: string;
    destination: string;
    startDate: string;
    endDate: string;
    coverImage: string;
    status: 'Active' | 'Inactive';
    participantIds: string[];
  }>({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    coverImage: '',
    status: 'Active',
    participantIds: [],
  });

  // Day-wise itinerary state for new trip
  const [dayWiseItinerary, setDayWiseItinerary] = useState<
    { id: string; day: number; description: string }[]
  >([]);

  // Day-wise itinerary state for editing existing trip
  const [editingDayWiseItinerary, setEditingDayWiseItinerary] = useState<
    { id: string; day: number; description: string }[]
  >([]);
  
  // Mood selection state
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  
  // Style selection state
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [editingSelectedStyles, setEditingSelectedStyles] = useState<string[]>([]);
  const [editingSelectedMoods, setEditingSelectedMoods] = useState<string[]>([]);
  
  // Places state
  const [places, setPlaces] = useState<Array<{ name: string; image: string; mapLink?: string }>>([]);
  const [newPlace, setNewPlace] = useState({ name: '', image: '', imageName: '' });
  const placeImageInputRef = useRef<HTMLInputElement | null>(null);

  // Cover image upload state
  const [coverImageName, setCoverImageName] = useState('');
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const editCoverInputRef = useRef<HTMLInputElement | null>(null);

  // Handle cover image upload (convert to data URL for persistence)
  const handleCoverImageUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setNewTrip(prev => ({ ...prev, coverImage: result }));
        setCoverImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearCoverImage = () => {
    setNewTrip(prev => ({ ...prev, coverImage: '' }));
    setCoverImageName('');
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleEditCoverImageUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setEditingTrip(prev => (prev ? { ...prev, coverImage: result } : null));
      }
    };
    reader.onerror = () => {
      alert('Image could not be loaded. Try a smaller or different image.');
    };
    reader.readAsDataURL(file);
  };

  const handlePlaceImageUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setNewPlace(prev => ({ ...prev, image: result, imageName: file.name }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to compute number of days between two dates (inclusive)
  const getDaysCount = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Keep dayWiseItinerary in sync with newTrip date range
  useEffect(() => {
    const daysCount = getDaysCount(newTrip.startDate, newTrip.endDate);
    if (!daysCount) {
      setDayWiseItinerary([]);
      return;
    }

    setDayWiseItinerary(prev => {
      const next: { id: string; day: number; description: string }[] = [];
      for (let day = 1; day <= daysCount; day++) {
        const existing = prev.find(d => d.day === day);
        next.push(
          existing ?? {
            id: `new-day-${day}-${Date.now()}`,
            day,
            description: '',
          }
        );
      }
      return next;
    });
  }, [newTrip.startDate, newTrip.endDate]);

  const handleCreateTrip = () => {
    // Validate required fields
    if (!newTrip.title.trim()) {
      alert('Please enter a trip title');
      return;
    }
    if (!newTrip.destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    if (!newTrip.startDate) {
      alert('Please select a start date');
      return;
    }
    if (!newTrip.endDate) {
      alert('Please select an end date');
      return;
    }

    // Create itinerary from day-wise descriptions
    const formattedItinerary = dayWiseItinerary.map((day, index) => ({
      id: `day-${Date.now()}-${index}`,
      day: day.day,
      title: `Day ${day.day}`,
      description: day.description.trim() || undefined,
      activities: [],
    }));

    // Format places
    const formattedPlaces = places.map((place, index) => ({
      id: `place-${Date.now()}-${index}`,
      name: place.name,
      image: place.image,
    }));

    // Add the trip with itinerary, moods, styles, and places
    // Filter selected moods to only include active ones
    const activeSelectedMoods = selectedMoods.filter(moodId => {
      const mood = moods.find(m => m.id === moodId);
      return mood && mood.isActive;
    });
    
    // Filter selected styles to only include active ones
    const activeSelectedStyles = selectedStyles.filter(styleId => {
      const style = styles.find(s => s.id === styleId);
      return style && style.isActive;
    });
    
    addTrip({
      ...newTrip,
      itinerary: formattedItinerary,
      moods: activeSelectedMoods,
      styles: activeSelectedStyles,
      places: formattedPlaces,
      participantIds: newTrip.participantIds ?? [],
      createdAt: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
    });
    showToast('Trip added successfully!');

    // Reset form
    setNewTrip({
      title: '',
      description: '',
      destination: '',
      startDate: '',
      endDate: '',
      coverImage: '',
      status: 'Active',
      participantIds: [],
    });
    setNewTripParticipantSearchQuery('');
    setDayWiseItinerary([]);
    setSelectedMoods([]);
    setSelectedStyles([]);
    setPlaces([]);
    setNewPlace({ name: '', image: '', imageName: '' });
    if (placeImageInputRef.current) {
      placeImageInputRef.current.value = '';
    }

    // Close dialog
    setTripDialogOpen(false);
  };


  const calculateDuration = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const days = nights + 1;
    return `${nights}N / ${days}D`;
  };

  const getDateForTripDay = (trip: Trip, dayNumber: number): string | null => {
    if (!trip.startDate) return null;
    const start = new Date(trip.startDate);
    if (isNaN(start.getTime())) return null;
    const d = new Date(start);
    d.setDate(start.getDate() + (dayNumber - 1));
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip({ ...trip, participantIds: trip.participantIds ?? [] });
    setEditingSelectedStyles(trip.styles ?? []);
    setEditingSelectedMoods(trip.moods ?? []);
    setEditTripDialogOpen(true);
  };

  // Initialize and keep editingDayWiseItinerary in sync when editingTrip or its dates change
  useEffect(() => {
    if (!editingTrip) {
      setEditingDayWiseItinerary([]);
      return;
    }

    const daysCount = getDaysCount(editingTrip.startDate, editingTrip.endDate);
    if (!daysCount) {
      // If no valid dates but itinerary exists, fall back to existing entries
      if (editingTrip.itinerary && editingTrip.itinerary.length > 0) {
        setEditingDayWiseItinerary(
          editingTrip.itinerary.map(day => ({
            id: day.id,
            day: day.day,
            description: day.description || '',
          }))
        );
      } else {
        setEditingDayWiseItinerary([]);
      }
      return;
    }

    // Detect legacy \"Full Itinerary\" single-day data
    const isLegacyFullItinerary =
      editingTrip.itinerary &&
      editingTrip.itinerary.length === 1 &&
      editingTrip.itinerary[0].title === 'Full Itinerary';

    setEditingDayWiseItinerary(prev => {
      const source =
        prev.length > 0
          ? prev
          : (editingTrip.itinerary || []).map(day => ({
              id: day.id,
              day: day.day,
              description: day.description || '',
            }));

      const next: { id: string; day: number; description: string }[] = [];
      for (let day = 1; day <= daysCount; day++) {
        let existing = source.find(d => d.day === day);

        // For legacy data, put full itinerary text in Day 1 only
        if (!existing && isLegacyFullItinerary && day === 1) {
          existing = {
            id: editingTrip.itinerary[0].id,
            day: 1,
            description: editingTrip.itinerary[0].description || '',
          };
        }

        next.push(
          existing ?? {
            id: `edit-day-${day}-${Date.now()}`,
            day,
            description: '',
          }
        );
      }
      return next;
    });
  }, [editingTrip?.id, editingTrip?.startDate, editingTrip?.endDate]);

  // Sync editingSelectedStyles when editingTrip changes
  useEffect(() => {
    if (editingTrip) {
      setEditingSelectedStyles(editingTrip.styles ?? []);
    } else {
      setEditingSelectedStyles([]);
    }
  }, [editingTrip?.id, editingTrip?.styles]);

  // Sync editingSelectedMoods when editingTrip changes
  useEffect(() => {
    if (editingTrip) {
      setEditingSelectedMoods(editingTrip.moods ?? []);
    } else {
      setEditingSelectedMoods([]);
    }
  }, [editingTrip?.id, editingTrip?.moods]);

  const handleUpdateTrip = () => {
    if (!editingTrip) return;

    let nextItinerary = editingTrip.itinerary || [];

    if (editingDayWiseItinerary.length > 0) {
      nextItinerary = editingDayWiseItinerary.map((day, index) => {
        const existingDay = editingTrip.itinerary?.find(d => d.day === day.day);
        return {
          id: existingDay?.id || `day-${editingTrip.id}-${day.day}-${index}-${Date.now()}`,
          day: day.day,
          title: `Day ${day.day}`,
          description: day.description.trim() || existingDay?.description,
          activities: existingDay?.activities || [],
        };
      });
    }

    // Filter editingSelectedStyles to only include active ones
    const activeEditingSelectedStyles = editingSelectedStyles.filter(styleId => {
      const style = styles.find(s => s.id === styleId);
      return style && style.isActive;
    });

    // Filter editingSelectedMoods to only include active ones
    const activeEditingSelectedMoods = editingSelectedMoods.filter(moodId => {
      const mood = moods.find(m => m.id === moodId);
      return mood && mood.isActive;
    });

    updateTrip(editingTrip.id, {
      ...editingTrip,
      itinerary: nextItinerary,
      participantIds: editingTrip.participantIds ?? [],
      moods: activeEditingSelectedMoods,
      styles: activeEditingSelectedStyles,
    });
    showToast('Trip updated successfully!');
    setEditTripDialogOpen(false);
    setEditingTrip(null);
  };

  return (
    <div className="space-y-5 font-sans w-full">
      <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Create New Trip</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new trip.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="trip-title">
                  Trip Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trip-title"
                  value={newTrip.title}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mountain Adventure"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-destination">
                  Destination <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trip-destination"
                  value={newTrip.destination}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="e.g., Swiss Alps"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-description">Description (Optional)</Label>
                <Textarea
                  id="trip-description"
                  value={newTrip.description}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the trip..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-start">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trip-start"
                    type="date"
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-end">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trip-end"
                    type="date"
                    value={newTrip.endDate}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-image">Cover Image</Label>
                <input
                  id="trip-image"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCoverImageUpload(e.target.files?.[0] || null)}
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    className="text-white hover:opacity-90 border-0 font-medium"
                    style={{ backgroundColor: '#06B3C4' }}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  {coverImageName && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-xs text-gray-700 max-w-xs">
                      <span className="truncate">{coverImageName}</span>
                      <button
                        type="button"
                        onClick={handleClearCoverImage}
                        className="flex items-center justify-center rounded-full p-0.5 text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload an image to use as the trip cover image.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-status">Status</Label>
                <select
                  id="trip-status"
                  value={newTrip.status}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Participants */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-base font-semibold">Participants</Label>
                <p className="text-xs text-gray-500">Select users to add to this trip (from the Users page).</p>
                <Input
                  type="text"
                  placeholder="Search for Participants"
                  value={newTripParticipantSearchQuery}
                  onChange={(e) => setNewTripParticipantSearchQuery(e.target.value)}
                  className="rounded-md border border-input"
                />
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto py-2">
                  {(() => {
                    const users = storage.getTripUsers();
                    if (users.length === 0) {
                      return <p className="text-sm text-gray-500">No users yet. Add users on the Users page first.</p>;
                    }
                    const q = newTripParticipantSearchQuery.trim().toLowerCase();
                    const filtered = q
                      ? users.filter((u) => {
                          const full = `${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.toLowerCase();
                          return full.includes(q);
                        })
                      : users;
                    if (filtered.length === 0) {
                      return <p className="text-sm text-gray-500">No participants match your search.</p>;
                    }
                    return filtered.map((u) => {
                      const isSelected = (newTrip.participantIds ?? []).includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#06B3C4] bg-[#06B3C4] text-white hover:bg-[#05a0af] hover:border-[#05a0af]'
                              : 'border-input bg-background hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setNewTrip(prev => ({
                                ...prev,
                                participantIds: isSelected
                                  ? (prev.participantIds ?? []).filter(id => id !== u.id)
                                  : [...(prev.participantIds ?? []), u.id],
                              }));
                            }}
                            className={`rounded border-input accent-[#06B3C4] ${!isSelected ? 'opacity-0' : ''}`}
                          />
                          <span>{u.firstName} {u.lastName}</span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Mood Selection Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Best for Mood</Label>
                  <Dialog open={moodSelectionDialogOpen} onOpenChange={setMoodSelectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="text-white hover:opacity-90 border-0 font-medium text-sm"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        + Add Mood
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Moods</DialogTitle>
                        <DialogDescription>
                          Choose the moods that best describe this trip.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-2 py-4">
                        {moods.filter(mood => mood.isActive).map((mood) => {
                          const isSelected = selectedMoods.includes(mood.id);
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              onClick={() => {
                                setSelectedMoods(prev =>
                                  prev.includes(mood.id)
                                    ? prev.filter(id => id !== mood.id)
                                    : [...prev, mood.id]
                                );
                              }}
                              className={`
                                px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2
                                transform transition-transform duration-200
                                ${isSelected ? 'scale-105 shadow-md' : 'scale-100'}
                                ${isSelected ? '' : 'border-transparent'}
                              `}
                              style={isSelected
                                ? { backgroundColor: '#06B3C4', borderColor: '#06B3C4' }
                                : { backgroundColor: '#06B3C4' }
                              }
                            >
                              {mood.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={mood.image}
                                    alt={mood.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : mood.icon ? (
                                <span>{mood.icon}</span>
                              ) : null}
                              <span>{mood.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => setMoodSelectionDialogOpen(false)}
                          className="text-white hover:opacity-90 border-0 font-medium"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          Done
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMoods.filter(moodId => {
                    const mood = moods.find(m => m.id === moodId);
                    return mood && mood.isActive;
                  }).length === 0 ? (
                    <p className="text-sm text-gray-500">No moods selected. Click "+ Add Mood" to select moods.</p>
                  ) : (
                    selectedMoods
                      .filter(moodId => {
                        const mood = moods.find(m => m.id === moodId);
                        return mood && mood.isActive;
                      })
                      .map((moodId) => {
                        const mood = moods.find(m => m.id === moodId);
                        if (!mood) return null;
                        return (
                          <button
                            key={mood.id}
                            type="button"
                            onClick={() => {
                              setSelectedMoods(prev => prev.filter(id => id !== mood.id));
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2 transform transition-transform duration-200 scale-105 shadow-md"
                            style={{ backgroundColor: '#06B3C4', borderColor: '#06B3C4' }}
                          >
                            {mood.image ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                <img
                                  src={mood.image}
                                  alt={mood.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              </span>
                            ) : mood.icon ? (
                              <span>{mood.icon}</span>
                            ) : null}
                            <span>{mood.name}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Style Selection Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Best for Style</Label>
                  <Dialog open={styleSelectionDialogOpen} onOpenChange={setStyleSelectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="text-white hover:opacity-90 border-0 font-medium text-sm"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        + Add Style
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Styles</DialogTitle>
                        <DialogDescription>
                          Choose the styles that best describe this trip.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-2 py-4">
                        {styles.filter(style => style.isActive).map((style) => {
                          const isSelected = selectedStyles.includes(style.id);
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                setSelectedStyles(prev =>
                                  prev.includes(style.id)
                                    ? prev.filter(id => id !== style.id)
                                    : [...prev, style.id]
                                );
                              }}
                              className={`
                                px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2
                                transform transition-transform duration-200
                                ${isSelected ? 'scale-105 shadow-md' : 'scale-100'}
                                ${isSelected ? '' : 'border-transparent'}
                              `}
                              style={isSelected
                                ? { backgroundColor: '#06B3C4', borderColor: '#06B3C4' }
                                : { backgroundColor: '#06B3C4' }
                              }
                            >
                              {style.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={style.image}
                                    alt={style.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : style.icon ? (
                                <span>{style.icon}</span>
                              ) : null}
                              <span>{style.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => setStyleSelectionDialogOpen(false)}
                          className="text-white hover:opacity-90 border-0 font-medium"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          Done
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStyles.filter(styleId => {
                    const style = styles.find(s => s.id === styleId);
                    return style && style.isActive;
                  }).length === 0 ? (
                    <p className="text-sm text-gray-500">No styles selected. Click "+ Add Style" to select styles.</p>
                  ) : (
                    selectedStyles
                      .filter(styleId => {
                        const style = styles.find(s => s.id === styleId);
                        return style && style.isActive;
                      })
                      .map((styleId) => {
                        const style = styles.find(s => s.id === styleId);
                        if (!style) return null;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => {
                              setSelectedStyles(prev => prev.filter(id => id !== style.id));
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2 transform transition-transform duration-200 scale-105 shadow-md"
                            style={{ backgroundColor: '#06B3C4', borderColor: '#06B3C4' }}
                          >
                            {style.image ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                <img
                                  src={style.image}
                                  alt={style.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              </span>
                            ) : style.icon ? (
                              <span>{style.icon}</span>
                            ) : null}
                            <span>{style.name}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Itinerary Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Itinerary</Label>
                </div>
                {dayWiseItinerary.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Select a start and end date to generate day-wise itinerary fields.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {dayWiseItinerary.map((day) => {
                      const getDisplayDate = () => {
                        if (!newTrip.startDate) return null;
                        const start = new Date(newTrip.startDate);
                        if (isNaN(start.getTime())) return null;
                        const d = new Date(start);
                        d.setDate(start.getDate() + (day.day - 1));
                        return d.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                      };

                      const displayDate = getDisplayDate();

                      return (
                        <div key={day.id} className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <p className="font-semibold text-gray-900 font-heading">
                              Day {day.day}
                              {displayDate ? (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                  {displayDate}
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <Textarea
                            value={day.description}
                            onChange={(e) =>
                              setDayWiseItinerary((prev) =>
                                prev.map((d) =>
                                  d.day === day.day ? { ...d, description: e.target.value } : d
                                )
                              )
                            }
                            placeholder={`Enter itinerary details for Day ${day.day}...`}
                            rows={4}
                            className="resize-y"
                          />
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-500">
                      Days are generated automatically based on the selected start and end dates.
                      Updating the dates will update the days while keeping existing text where possible.
                    </p>
                  </div>
                )}
              </div>

              {/* Places Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Places You'll Be Visiting</Label>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Place name"
                        value={newPlace.name}
                        onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={placeImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePlaceImageUpload(e.target.files?.[0] || null)}
                      />
                      <div className="flex items-center justify-end gap-3 max-w-full">
                        <Button
                          type="button"
                          size="sm"
                          className="text-white hover:opacity-90 border-0 font-medium text-sm"
                          style={{ backgroundColor: '#06B3C4' }}
                          onClick={() => placeImageInputRef.current?.click()}
                        >
                          Choose Image
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (newPlace.name && newPlace.image) {
                              setPlaces([...places, { name: newPlace.name, image: newPlace.image }]);
                              setNewPlace({ name: '', image: '', imageName: '' });
                              if (placeImageInputRef.current) {
                                placeImageInputRef.current.value = '';
                              }
                            }
                          }}
                          className="text-white hover:opacity-90 border-0 font-medium text-sm"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Place
                        </Button>
                        {newPlace.image && (
                          <div className="w-10 h-10 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                            <img
                              src={newPlace.image}
                              alt={newPlace.name || 'Place image preview'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {newPlace.imageName && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-xs text-gray-700 max-w-[220px] flex-1 min-w-0">
                            <span className="truncate flex-1">
                              {newPlace.imageName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {places.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {places.map((place, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          {place.image && (
                            <div className="relative">
                              <img
                                src={place.image}
                                alt={place.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            </div>
                          )}
                          <span className="flex-1 font-medium text-gray-900">{place.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPlaces(places.filter((_, i) => i !== index))}
                            className="h-8 w-8 p-0 text-white hover:opacity-90 border-0"
                            style={{ backgroundColor: '#06B3C4' }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                type="button"
                onClick={() => setTripDialogOpen(false)}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateTrip}
                className="h-9 px-4 text-sm text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Create Trip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Search Box + Add New */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#06B3C4' }} />
          <Input
            type="text"
            placeholder="Search trips by title, destination, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 rounded-full bg-white shadow-sm border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
          <DialogTrigger asChild>
            <Button className="text-white hover:opacity-90 border-0 font-medium px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: '#06B3C4' }}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#EEF0F1' }}>
        {(() => {
          const filteredTrips = trips.filter((trip) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
              trip.title.toLowerCase().includes(query) ||
              trip.destination.toLowerCase().includes(query) ||
              (trip.status || 'Active').toLowerCase().includes(query) ||
              trip.description?.toLowerCase().includes(query)
            );
          });

          return filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchQuery ? 'No trips found matching your search.' : 'No trips created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#EEF0F1' }}>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Duration</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Cover Image</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#EEF0F1' }}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {trip.title}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          (trip.status || 'Active') === 'Active'
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        style={(trip.status || 'Active') === 'Active' ? { backgroundColor: '#06B3C4' } : undefined}
                      >
                        {trip.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">
                        {calculateDuration(trip.startDate, trip.endDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {trip.coverImage ? (
                        <img
                          src={trip.coverImage}
                          alt={trip.title}
                          className="w-14 h-10 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'inline';
                          }}
                        />
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleEditTrip(trip)}
                          className="h-7 w-7 p-0 hover:opacity-90 border-0"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${trip.title}"?`)) {
                              deleteTrip(trip.id);
                              showToast('Trip deleted successfully!');
                              if (editingTrip?.id === trip.id) {
                                setEditingTrip(null);
                                setEditTripDialogOpen(false);
                              }
                            }
                          }}
                          className="h-7 w-7 p-0 hover:opacity-90 border-0"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Trip Details Dialog - Show when trip is selected */}
      {selectedTrip && (
        <Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">{selectedTrip.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Trip Header Image */}
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={selectedTrip.coverImage}
                  alt={selectedTrip.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-xl font-bold text-white font-heading mb-2">{selectedTrip.title}</h2>
                  <div className="flex items-center gap-4 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedTrip.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {selectedTrip.startDate} - {selectedTrip.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trip Summary */}
              {selectedTrip.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-2">Trip Summary</h3>
                  <p className="text-gray-600">{selectedTrip.description}</p>
                </div>
              )}

              {/* Best for Mood */}
              {selectedTrip.moods && selectedTrip.moods.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">
                    Best for <span className="text-yellow-500">Mood</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrip.moods.map((moodId) => {
                      const mood = moods.find(m => m.id === moodId);
                      if (!mood) return null;
                      return (
                        <div
                          key={moodId}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 flex items-center gap-2"
                          style={{ backgroundColor: '#06B3C4', borderColor: '#06B3C4' }}
                        >
                          {mood.image ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                              <img
                                src={mood.image}
                                alt={mood.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            </span>
                          ) : mood.icon ? (
                            <span>{mood.icon}</span>
                          ) : null}
                          <span>{mood.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Best for Style */}
              {selectedTrip.styles && selectedTrip.styles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">
                    Best for <span className="text-yellow-500">Style</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrip.styles.map((styleId) => {
                      const style = styles.find(s => s.id === styleId);
                      if (!style) return null;
                      return (
                        <div
                          key={styleId}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 flex items-center gap-2"
                          style={{ backgroundColor: '#06B3C4', borderColor: '#06B3C4' }}
                        >
                          {style.image ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                              <img
                                src={style.image}
                                alt={style.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            </span>
                          ) : style.icon ? (
                            <span>{style.icon}</span>
                          ) : null}
                          <span>{style.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedTrip.participantIds && selectedTrip.participantIds.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-2">Participants</h3>
                  <p className="text-sm text-gray-600">
                    {selectedTrip.participantIds
                      .map(id => {
                        const u = storage.getTripUsers().find(tu => tu.id === id);
                        return u ? `${u.firstName} ${u.lastName}` : null;
                      })
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              )}

              {/* Itinerary */}
              {selectedTrip.itinerary.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">Itinerary</h3>
                  <div className="space-y-3">
                    {selectedTrip.itinerary.map((day) => {
                      const isLegacyFullItinerary =
                        selectedTrip.itinerary.length === 1 && day.title === 'Full Itinerary';
                      const displayDate = getDateForTripDay(selectedTrip, day.day);

                      return (
                        <div
                          key={day.id}
                          className="border rounded-lg overflow-hidden"
                          style={{ borderColor: '#EEF0F1' }}
                        >
                          <div
                            className="w-full flex items-center text-white p-6"
                            style={{ background: 'linear-gradient(to right, #0285BF, #03A9F4)' }}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <span
                                className="w-10 h-10 text-sm flex items-center justify-center bg-white rounded-full font-semibold shrink-0"
                                style={{ color: '#0285BF' }}
                              >
                                {day.day}
                              </span>
                              <div className="flex-1 text-left">
                                <span className="text-lg font-bold text-white font-heading block">
                                  {isLegacyFullItinerary ? 'Full Itinerary' : `Day ${day.day}`}
                                  {displayDate && (
                                    <span className="ml-2 text-xs font-normal text-white/80">
                                      {displayDate}
                                    </span>
                                  )}
                                </span>
                                {day.description && (
                                  <span className="text-sm mt-2 text-white/80 block whitespace-pre-wrap">
                                    {day.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Places */}
              {selectedTrip.places && selectedTrip.places.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-heading mb-3">Places you'll be visiting</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTrip.places.map((place) => (
                      <div key={place.id} className="border rounded-lg overflow-hidden shadow-sm" style={{ borderColor: '#EEF0F1' }}>
                        <div className="relative h-48">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 font-heading mb-2">{place.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
      <Button
        onClick={() => setSelectedTrip(null)}
        className="text-white hover:opacity-90 border-0 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#03A9F4' }}
      >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Trip Dialog */}
      {editingTrip && (
        <Dialog
          open={editTripDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              if (editCoverInputRef.current) editCoverInputRef.current.value = '';
              setEditParticipantSearchQuery('');
            }
            setEditTripDialogOpen(open);
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-trip-title">Trip Title</Label>
                <Input
                  id="edit-trip-title"
                  value={editingTrip.title}
                  onChange={(e) => setEditingTrip({ ...editingTrip, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-trip-status">Status</Label>
                <select
                  id="edit-trip-status"
                  value={editingTrip.status || 'Active'}
                  onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value as 'Active' | 'Inactive' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label htmlFor="edit-trip-cover-image">Cover Image</Label>
                <input
                  id="edit-trip-cover-image"
                  ref={editCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleEditCoverImageUpload(e.target.files?.[0] || null);
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center justify-end gap-3 w-full">
                  {editingTrip.coverImage ? (
                    <div className="w-20 h-20 rounded overflow-hidden border border-gray-200 bg-gray-50 shrink-0 mr-auto">
                      <img
                        src={editingTrip.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    className="text-white hover:opacity-90 border-0 font-medium text-sm"
                    style={{ backgroundColor: '#06B3C4' }}
                    onClick={() => editCoverInputRef.current?.click()}
                  >
                    {editingTrip.coverImage ? 'Change image' : 'Add image'}
                  </Button>
                  {editingTrip.coverImage ? (
                    <Button
                      type="button"
                      size="sm"
                      className="text-sm text-white hover:opacity-90 border-0 font-medium"
                      style={{ backgroundColor: '#06B3C4' }}
                      onClick={() => setEditingTrip({ ...editingTrip, coverImage: '' })}
                    >
                      Remove
                    </Button>
                  ) : null}
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-base font-semibold">Participants</Label>
                <p className="text-xs text-gray-500">Select users to add to this trip.</p>
                <Input
                  type="text"
                  placeholder="Search for Participants"
                  value={editParticipantSearchQuery}
                  onChange={(e) => setEditParticipantSearchQuery(e.target.value)}
                  className="rounded-md border border-input"
                />
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto py-2">
                  {(() => {
                    const users = storage.getTripUsers();
                    if (users.length === 0) {
                      return <p className="text-sm text-gray-500">No users yet. Add users on the Users page first.</p>;
                    }
                    const q = editParticipantSearchQuery.trim().toLowerCase();
                    const filtered = q
                      ? users.filter((u) => {
                          const full = `${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.toLowerCase();
                          return full.includes(q);
                        })
                      : users;
                    if (filtered.length === 0) {
                      return <p className="text-sm text-gray-500">No participants match your search.</p>;
                    }
                    return filtered.map((u) => {
                      const participantIds = editingTrip.participantIds ?? [];
                      const isSelected = participantIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#06B3C4] bg-[#06B3C4] text-white hover:bg-[#05a0af] hover:border-[#05a0af]'
                              : 'border-input bg-background hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setEditingTrip(prev => prev ? {
                                ...prev,
                                participantIds: isSelected
                                  ? (prev.participantIds ?? []).filter(id => id !== u.id)
                                  : [...(prev.participantIds ?? []), u.id],
                              } : null);
                            }}
                            className={`rounded border-input accent-[#06B3C4] ${!isSelected ? 'opacity-0' : ''}`}
                          />
                          <span>{u.firstName} {u.lastName}</span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Best for Mood */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Best for Mood</Label>
                  <Dialog open={editMoodSelectionDialogOpen} onOpenChange={setEditMoodSelectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="text-white hover:opacity-90 border-0 font-medium text-sm"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        + Add Mood
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Moods</DialogTitle>
                        <DialogDescription>
                          Choose the moods that best describe this trip.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-2 py-4">
                        {moods.filter(mood => mood.isActive).map((mood) => {
                          const isSelected = editingSelectedMoods.includes(mood.id);
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              onClick={() => {
                                setEditingSelectedMoods(prev =>
                                  prev.includes(mood.id)
                                    ? prev.filter(id => id !== mood.id)
                                    : [...prev, mood.id]
                                );
                              }}
                              className={`
                                px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2
                                transform transition-transform duration-200
                                ${isSelected ? 'scale-105 shadow-md' : 'scale-100'}
                                ${isSelected ? '' : 'border-transparent'}
                              `}
                              style={isSelected
                                ? { backgroundColor: '#06B3C4', borderColor: '#06B3C4' }
                                : { backgroundColor: '#06B3C4' }
                              }
                            >
                              {mood.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={mood.image}
                                    alt={mood.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : mood.icon ? (
                                <span>{mood.icon}</span>
                              ) : null}
                              <span>{mood.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => setEditMoodSelectionDialogOpen(false)}
                          className="text-white hover:opacity-90 border-0 font-medium"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          Done
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingSelectedMoods.filter(moodId => {
                    const mood = moods.find(m => m.id === moodId);
                    return mood && mood.isActive;
                  }).length === 0 ? (
                    <p className="text-sm text-gray-500">No moods selected. Click "+ Add Mood" to select moods.</p>
                  ) : (
                    editingSelectedMoods
                      .filter(moodId => {
                        const mood = moods.find(m => m.id === moodId);
                        return mood && mood.isActive;
                      })
                      .map((moodId) => {
                        const mood = moods.find(m => m.id === moodId);
                        if (!mood) return null;
                        return (
                          <button
                            key={mood.id}
                            type="button"
                            onClick={() => {
                              setEditingSelectedMoods(prev => prev.filter(id => id !== mood.id));
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2 transform transition-transform duration-200 scale-105 shadow-md"
                            style={{ backgroundColor: '#06B3C4', borderColor: '#06B3C4' }}
                          >
                            {mood.image ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                <img
                                  src={mood.image}
                                  alt={mood.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              </span>
                            ) : mood.icon ? (
                              <span>{mood.icon}</span>
                            ) : null}
                            <span>{mood.name}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Style Selection Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Best for Style</Label>
                  <Dialog open={editStyleSelectionDialogOpen} onOpenChange={setEditStyleSelectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="text-white hover:opacity-90 border-0 font-medium text-sm"
                        style={{ backgroundColor: '#06B3C4' }}
                      >
                        + Add Style
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Styles</DialogTitle>
                        <DialogDescription>
                          Choose the styles that best describe this trip.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-2 py-4">
                        {styles.filter(style => style.isActive).map((style) => {
                          const isSelected = editingSelectedStyles.includes(style.id);
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                setEditingSelectedStyles(prev =>
                                  prev.includes(style.id)
                                    ? prev.filter(id => id !== style.id)
                                    : [...prev, style.id]
                                );
                              }}
                              className={`
                                px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2
                                transform transition-transform duration-200
                                ${isSelected ? 'scale-105 shadow-md' : 'scale-100'}
                                ${isSelected ? '' : 'border-transparent'}
                              `}
                              style={isSelected
                                ? { backgroundColor: '#06B3C4', borderColor: '#06B3C4' }
                                : { backgroundColor: '#06B3C4' }
                              }
                            >
                              {style.image ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                  <img
                                    src={style.image}
                                    alt={style.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </span>
                              ) : style.icon ? (
                                <span>{style.icon}</span>
                              ) : null}
                              <span>{style.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => setEditStyleSelectionDialogOpen(false)}
                          className="text-white hover:opacity-90 border-0 font-medium"
                          style={{ backgroundColor: '#06B3C4' }}
                        >
                          Done
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingSelectedStyles.filter(styleId => {
                    const style = styles.find(s => s.id === styleId);
                    return style && style.isActive;
                  }).length === 0 ? (
                    <p className="text-sm text-gray-500">No styles selected. Click "+ Add Style" to select styles.</p>
                  ) : (
                    editingSelectedStyles
                      .filter(styleId => {
                        const style = styles.find(s => s.id === styleId);
                        return style && style.isActive;
                      })
                      .map((styleId) => {
                        const style = styles.find(s => s.id === styleId);
                        if (!style) return null;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => {
                              setEditingSelectedStyles(prev => prev.filter(id => id !== style.id));
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 hover:opacity-90 flex items-center gap-2 transform transition-transform duration-200 scale-105 shadow-md"
                            style={{ backgroundColor: '#06B3C4', borderColor: '#06B3C4' }}
                          >
                            {style.image ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                                <img
                                  src={style.image}
                                  alt={style.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              </span>
                            ) : style.icon ? (
                              <span>{style.icon}</span>
                            ) : null}
                            <span>{style.name}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Edit Itinerary Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Itinerary</Label>
                </div>
                {editingDayWiseItinerary.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    This trip has no date range or itinerary days configured yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {editingDayWiseItinerary.map((day) => {
                      const getDisplayDate = () => {
                        if (!editingTrip.startDate) return null;
                        const start = new Date(editingTrip.startDate);
                        if (isNaN(start.getTime())) return null;
                        const d = new Date(start);
                        d.setDate(start.getDate() + (day.day - 1));
                        return d.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                      };

                      const displayDate = getDisplayDate();

                      return (
                        <div key={day.id} className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <p className="font-semibold text-gray-900 font-heading">
                              Day {day.day}
                              {displayDate ? (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                  {displayDate}
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <Textarea
                            value={day.description}
                            onChange={(e) =>
                              setEditingDayWiseItinerary((prev) =>
                                prev.map((d) =>
                                  d.day === day.day ? { ...d, description: e.target.value } : d
                                )
                              )
                            }
                            placeholder={`Enter itinerary details for Day ${day.day}...`}
                            rows={4}
                            className="resize-y"
                          />
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-500">
                      Days are based on the trip start and end dates. Updating the dates will
                      update the number of days while keeping existing text where possible.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setEditTripDialogOpen(false);
                  setEditingTrip(null);
                }}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTrip}
                className="text-white hover:opacity-90 border-0 font-medium"
                style={{ backgroundColor: '#06B3C4' }}
              >
                Update Trip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
