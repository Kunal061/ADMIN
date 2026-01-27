import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export function MoodPage() {
  const { moods, toggleMood } = useApp();
  const activeCount = moods.filter(m => m.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mood Settings</h1>
          <p className="text-gray-500 mt-1">Manage mood-based travel recommendations</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          {activeCount} of {moods.length} Active
        </Badge>
      </div>

      {/* Mood Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {moods.map((mood, index) => (
          <Card
            key={mood.id}
            className={`overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
              mood.isActive ? 'ring-2 ring-offset-2' : 'opacity-60 grayscale'
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
              ['--tw-ring-color' as string]: mood.isActive ? mood.color : 'transparent'
            }}
          >
            <div 
              className="h-24 relative overflow-hidden"
              style={{ backgroundColor: mood.color }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl transform transition-transform duration-300 hover:scale-125">
                  {mood.emoji}
                </span>
              </div>
              {/* Decorative circles */}
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{mood.name}</CardTitle>
                <Badge 
                  variant={mood.isActive ? "default" : "outline"}
                  style={mood.isActive ? { backgroundColor: mood.color } : {}}
                >
                  {mood.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>{mood.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: mood.isActive ? mood.color : '#E5E7EB',
                      boxShadow: mood.isActive ? `0 0 10px ${mood.color}` : 'none'
                    }}
                  />
                  <span className="text-sm text-gray-500">
                    {mood.isActive ? 'Showing to users' : 'Hidden from users'}
                  </span>
                </div>
                <Switch
                  checked={mood.isActive}
                  onCheckedChange={() => toggleMood(mood.id)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Moods Summary */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-400 via-cyan-500 via-blue-500 via-cyan-400 to-blue-600" />
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Active Moods Preview</h3>
          <div className="flex flex-wrap gap-3">
            {moods.filter(m => m.isActive).map(mood => (
              <div
                key={mood.id}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: mood.color }}
              >
                <span className="text-xl">{mood.emoji}</span>
                <span>{mood.name}</span>
              </div>
            ))}
            {activeCount === 0 && (
              <p className="text-gray-500 italic">No moods are currently active</p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            These moods will be shown to users when they're selecting their travel preferences.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{moods.length}</p>
          <p className="text-sm text-gray-500">Total Moods</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-400">{moods.length - activeCount}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-cyan-600">
            {Math.round((activeCount / moods.length) * 100)}%
          </p>
          <p className="text-sm text-gray-500">Coverage</p>
        </Card>
      </div>
    </div>
  );
}
