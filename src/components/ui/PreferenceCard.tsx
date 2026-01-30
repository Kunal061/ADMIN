import { cn } from '@/lib/utils';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';

interface PreferenceCardProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  onClick: () => void;
  iconColor?: string;
  labelPosition?: 'center' | 'bottom-left';
  showIcon?: boolean;
  overlayOpacity?: number;
  blurImage?: boolean;
  imageBlur?: number;
  // Trip card props
  variant?: 'preference' | 'trip';
  title?: string;
  location?: string;
  dateRange?: string;
  duration?: string;
  showNavigationArrow?: boolean;
}

export function PreferenceCard({
  id,
  name,
  description,
  icon,
  image,
  isActive,
  onClick,
  iconColor,
  labelPosition = 'center',
  showIcon = true,
  overlayOpacity = 0.25,
  blurImage = false,
  imageBlur = 4,
  variant = 'preference',
  title,
  location,
  dateRange,
  duration,
  showNavigationArrow,
}: PreferenceCardProps) {
  // Auto-detect label position based on image presence
  const finalLabelPosition = image ? (labelPosition === 'bottom-left' ? 'bottom-left' : 'center') : 'center';
  const finalShowIcon = image ? (showIcon === false ? false : true) : (showIcon !== false);
  
  // Trip card variant
  if (variant === 'trip') {
    return (
      <button
        onClick={onClick}
        className={cn(
          "relative rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full flex flex-col bg-white border-0",
          isActive && "ring-2 ring-white shadow-lg"
        )}
        style={{
          border: 'none',
          outline: 'none',
          borderWidth: 0
        }}
      >
        {/* Image Section */}
        {image && (
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-xl">
            <img 
              src={image} 
              alt={title || name}
              className="w-full h-full object-cover object-center"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
            {/* Active Checkmark */}
            {isActive && (
              <div 
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg z-10"
                style={{ backgroundColor: '#06B6D4' }}
              >
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        )}
        
        {/* Content Section - Translucent Blurred Background */}
        <div className="backdrop-blur-md bg-white/40 px-4 py-4 flex flex-col rounded-b-xl">
          {/* Title */}
          {(title || name) && (
            <h3 className="font-bold text-lg text-gray-900 mb-3 leading-tight">
              {title || name}
            </h3>
          )}
          
          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-600">{location}</span>
            </div>
          )}
          
          {/* Date Range */}
          {dateRange && (
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-600">{dateRange}</span>
            </div>
          )}
          
          {/* Footer with Duration Badge and Navigation Arrow */}
          <div className="flex items-center justify-between mt-auto">
            {duration && (
              <span className="bg-cyan-100 text-cyan-800 rounded-full px-3 py-1 text-xs font-semibold">
                {duration}
              </span>
            )}
            {showNavigationArrow !== false && (
              <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </button>
    );
  }
  
  // Preference card variant (existing layout)
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full flex flex-col bg-white border-0",
        isActive && "ring-2 ring-blue-500 shadow-lg"
      )}
      style={{
        border: 'none',
        outline: 'none',
        borderWidth: 0
      }}
    >
      {/* Image Section with Blur */}
      {image && (
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-lg">
          <img 
            src={image} 
            alt={name}
            className={cn(
              "w-full h-full object-cover object-center",
              blurImage && `blur-[${imageBlur}px]`
            )}
            style={blurImage ? { filter: `blur(${imageBlur}px)` } : { objectFit: 'cover', width: '100%', height: '100%' }}
          />
          {/* Active Checkmark */}
          {isActive && (
            <div 
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg z-10"
              style={{ backgroundColor: '#06B6D4' }}
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      {/* Content Section - Dark Background for White Text */}
      <div className="bg-gray-900 px-3 py-4 flex flex-col items-center justify-center rounded-b-lg border border-white">
        {/* Icon and Name */}
        <div className="flex flex-col items-center gap-2">
          {icon && (
            <div 
              className="text-3xl leading-none"
              style={{ color: iconColor || '#fff' }}
            >
              {icon}
            </div>
          )}
          <p className="text-sm font-semibold text-white text-center leading-tight">
            {name}
          </p>
          {description && (
            <p className="text-xs text-gray-400 text-center mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
