import { Link } from 'react-router-dom';
import { User, MapPin, Palette, Heart, TrendingUp, Users, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';

const stats = [
  { label: 'Total Users', value: '1,234', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: 'Active Trips', value: '56', icon: Calendar, color: 'from-blue-400 to-cyan-500' },
  { label: 'Style Options', value: '4', icon: Sparkles, color: 'from-cyan-500 to-blue-500' },
  { label: 'Mood Types', value: '6', icon: Heart, color: 'from-blue-600 to-cyan-500' },
];

const sections = [
  {
    title: 'User Management',
    description: 'Manage user profiles, photos, and emergency contacts',
    icon: User,
    path: '/user',
    color: 'from-blue-500 to-cyan-600',
    features: ['Profile Photo', 'Edit Name', 'Emergency Contact', 'Reset Password'],
  },
  {
    title: 'Trip Management',
    description: 'Create and manage trips with detailed itineraries',
    icon: MapPin,
    path: '/trip',
    color: 'from-cyan-500 to-blue-600',
    features: ['Create Trips', 'Add Itineraries', 'Day-wise Planning', 'Activities'],
  },
  {
    title: 'Style Options',
    description: 'Configure travel style preferences',
    icon: Palette,
    path: '/style',
    color: 'from-blue-400 to-cyan-500',
    features: ['CALM', 'WOMEN FRIENDLY', 'BUDGET ROAMER', 'NATURE FRIENDLY'],
  },
  {
    title: 'Mood Settings',
    description: 'Manage mood-based travel recommendations',
    icon: Heart,
    path: '/mood',
    color: 'from-cyan-400 to-blue-500',
    features: ['ADVENTUROUS', 'CHILL', 'CURIOUS', 'SOCIAL', 'SOULFUL', 'FOODIE'],
  },
];

export function DashboardPage() {
  const { trips, styles, moods } = useApp();

  const activeStyles = styles.filter(s => s.isActive).length;
  const activeMoods = moods.filter(m => m.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to Roamana admin panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          let value = stat.value;
          if (stat.label === 'Active Trips') value = trips.length.toString();
          if (stat.label === 'Style Options') value = activeStyles.toString();
          if (stat.label === 'Mood Types') value = activeMoods.toString();
          
          return (
            <Card 
              key={stat.label} 
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Active</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sections */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link 
                key={section.path} 
                to={section.path}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300">
                          {section.title}
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {section.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
