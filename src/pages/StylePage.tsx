import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const styleColors: Record<string, string> = {
  'CALM': '#3B82F6',
  'WOMEN FRIENDLY': '#F472B6',
  'BUDGET ROAMER': '#10B981',
  'NATURE FRIENDLY': '#22C55E',
};

export function StylePage() {
  const { styles, toggleStyle } = useApp();
  const activeCount = styles.filter(s => s.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Style Options</h1>
          <p className="text-gray-500 mt-1">Configure travel style preferences for users</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          {activeCount} of {styles.length} Active
        </Badge>
      </div>

      {/* Style Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style, index) => {
          const color = styleColors[style.name] || '#3B82F6';
          
          return (
            <Card
              key={style.id}
              className={`overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                style.isActive ? 'ring-2 ring-offset-2' : 'opacity-60 grayscale'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                ['--tw-ring-color' as string]: style.isActive ? color : 'transparent'
              }}
            >
              <div 
                className="h-24 relative overflow-hidden"
                style={{ backgroundColor: color }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl transform transition-transform duration-300 hover:scale-125">
                    {style.icon}
                  </span>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{style.name}</CardTitle>
                  <Badge 
                    variant={style.isActive ? "default" : "outline"}
                    style={style.isActive ? { backgroundColor: color } : {}}
                  >
                    {style.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>{style.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: style.isActive ? color : '#E5E7EB',
                        boxShadow: style.isActive ? `0 0 10px ${color}` : 'none'
                      }}
                    />
                    <span className="text-sm text-gray-500">
                      {style.isActive ? 'Showing to users' : 'Hidden from users'}
                    </span>
                  </div>
                  <Switch
                    checked={style.isActive}
                    onCheckedChange={() => toggleStyle(style.id)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Styles Summary */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-400 via-pink-500 via-green-500 to-emerald-600" />
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Active Styles Preview</h3>
          <div className="flex flex-wrap gap-3">
            {styles.filter(s => s.isActive).map(style => {
              const color = styleColors[style.name] || '#3B82F6';
              return (
                <div
                  key={style.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span>{style.name}</span>
                </div>
              );
            })}
            {activeCount === 0 && (
              <p className="text-gray-500 italic">No styles are currently active</p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            These styles will be shown to users when they're selecting their travel preferences.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{styles.length}</p>
          <p className="text-sm text-gray-500">Total Styles</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-400">{styles.length - activeCount}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-cyan-600">
            {styles.length > 0 ? Math.round((activeCount / styles.length) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-500">Coverage</p>
        </Card>
      </div>
    </div>
  );
}
