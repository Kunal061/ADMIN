import { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  MapPinned
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const { trips, addTrip, deleteTrip, addItinerary, addActivity } = useApp();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [itineraryDialogOpen, setItineraryDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  // New trip form state
  const [newTrip, setNewTrip] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
  });

  // New itinerary form state
  const [newItinerary, setNewItinerary] = useState({
    day: 1,
    title: '',
  });

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    time: '',
    title: '',
    description: '',
    location: '',
  });

  const handleCreateTrip = () => {
    if (newTrip.title && newTrip.destination && newTrip.startDate && newTrip.endDate) {
      addTrip(newTrip);
      setNewTrip({
        title: '',
        description: '',
        destination: '',
        startDate: '',
        endDate: '',
        coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
      });
      setTripDialogOpen(false);
    }
  };

  const handleCreateItinerary = () => {
    if (selectedTrip && newItinerary.title) {
      addItinerary(selectedTrip.id, newItinerary.day, newItinerary.title);
      setNewItinerary({ day: (selectedTrip.itinerary.length || 0) + 2, title: '' });
      setItineraryDialogOpen(false);
      // Refresh selected trip
      const updatedTrip = trips.find(t => t.id === selectedTrip.id);
      if (updatedTrip) setSelectedTrip(updatedTrip);
    }
  };

  const handleCreateActivity = () => {
    if (selectedTrip && selectedDayId && newActivity.title) {
      addActivity(selectedTrip.id, selectedDayId, newActivity);
      setNewActivity({ time: '', title: '', description: '', location: '' });
      setActivityDialogOpen(false);
      // Refresh selected trip
      const updatedTrip = trips.find(t => t.id === selectedTrip.id);
      if (updatedTrip) setSelectedTrip(updatedTrip);
    }
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const openAddActivity = (dayId: string) => {
    setSelectedDayId(dayId);
    setActivityDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-500 mt-1">Create and manage trips with detailed itineraries</p>
        </div>
        <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new trip.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="trip-title">Trip Title</Label>
                <Input
                  id="trip-title"
                  value={newTrip.title}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mountain Adventure"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-destination">Destination</Label>
                <Input
                  id="trip-destination"
                  value={newTrip.destination}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="e.g., Swiss Alps"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-description">Description</Label>
                <Textarea
                  id="trip-description"
                  value={newTrip.description}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the trip..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-start">Start Date</Label>
                  <Input
                    id="trip-start"
                    type="date"
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-end">End Date</Label>
                  <Input
                    id="trip-end"
                    type="date"
                    value={newTrip.endDate}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-image">Cover Image URL</Label>
                <Input
                  id="trip-image"
                  value={newTrip.coverImage}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTripDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTrip}
                className="bg-gradient-to-r from-blue-500 to-cyan-600"
              >
                Create Trip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">All Trips ({trips.length})</h2>
          <div className="space-y-3">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className={`cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  selectedTrip?.id === trip.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
                onClick={() => setSelectedTrip(trip)}
              >
                <div className="relative h-72">
                  <img
                    src={trip.coverImage}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {/* Translucent overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4">
                    <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      {trip.destination}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      {trip.startDate} - {trip.endDate}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {trip.itinerary.length} Days
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {trips.length === 0 && (
              <Card className="p-8 text-center">
                <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No trips created yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Create Trip" to get started</p>
              </Card>
            )}
          </div>
        </div>

        {/* Trip Details & Itinerary */}
        <div className="lg:col-span-2">
          {selectedTrip ? (
            <Card className="overflow-hidden">
              {/* Trip Header */}
              <div className="relative h-48">
                <img
                  src={selectedTrip.coverImage}
                  alt={selectedTrip.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-2xl font-bold text-white">{selectedTrip.title}</h2>
                  <div className="flex items-center gap-4 text-white/80 text-sm mt-2">
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
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrip(selectedTrip.id);
                    setSelectedTrip(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-6">
                {selectedTrip.description && (
                  <p className="text-gray-600 mb-6">{selectedTrip.description}</p>
                )}

                {/* Itinerary Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Itinerary</h3>
                    <Dialog open={itineraryDialogOpen} onOpenChange={setItineraryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="!bg-blue-300 !text-black hover:!bg-blue-400">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Day
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Day to Itinerary</DialogTitle>
                          <DialogDescription>
                            Create a new day in the trip itinerary.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="day-number">Day Number</Label>
                            <Input
                              id="day-number"
                              type="number"
                              min="1"
                              value={newItinerary.day}
                              onChange={(e) => setNewItinerary(prev => ({ ...prev, day: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="day-title">Day Title</Label>
                            <Input
                              id="day-title"
                              value={newItinerary.title}
                              onChange={(e) => setNewItinerary(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Arrival & Exploration"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setItineraryDialogOpen(false)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateItinerary}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                          >
                            Add Day
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Days */}
                  <div className="space-y-3">
                    {selectedTrip.itinerary.map((day) => (
                      <div
                        key={day.id}
                        className="border border-blue-200 rounded-lg overflow-hidden"
                      >
                        <button
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-colors"
                          onClick={() => toggleDay(day.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-full text-sm font-semibold">
                              {day.day}
                            </span>
                            <span className="font-medium text-white">{day.title}</span>
                            <Badge variant="outline" className="ml-2 border-white/50 text-white bg-white/20">
                              {day.activities.length} activities
                            </Badge>
                          </div>
                          {expandedDays.includes(day.id) ? (
                            <ChevronDown className="h-5 w-5 text-white" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-white" />
                          )}
                        </button>

                        {expandedDays.includes(day.id) && (
                          <div className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200 bg-blue-50/50">
                            {day.activities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex gap-4 p-3 bg-white border border-blue-100 rounded-lg"
                              >
                                <div className="flex-shrink-0 w-16 text-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {activity.time}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                  <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                    <MapPinned className="h-3 w-3" />
                                    {activity.location}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <Button
                              size="sm"
                              className="w-full !bg-blue-300 !text-black hover:!bg-blue-400"
                              onClick={() => openAddActivity(day.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Activity
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {selectedTrip.itinerary.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto text-blue-300 mb-4" />
                        <p>No itinerary created yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click "Add Day" to start planning</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a Trip</h3>
                <p className="text-gray-500 mt-1">Choose a trip from the list to view and manage its itinerary</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              Add a new activity to this day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activity-time">Time</Label>
              <Input
                id="activity-time"
                value={newActivity.time}
                onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                placeholder="e.g., 09:00 AM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-title">Activity Title</Label>
              <Input
                id="activity-title"
                value={newActivity.title}
                onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mountain Hike"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-description">Description</Label>
              <Textarea
                id="activity-description"
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the activity..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-location">Location</Label>
              <Input
                id="activity-location"
                value={newActivity.location}
                onChange={(e) => setNewActivity(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Mountain Base Camp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActivityDialogOpen(false)}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateActivity}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              Add Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
