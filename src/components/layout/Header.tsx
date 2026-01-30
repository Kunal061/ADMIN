export function Header() {
  return (
    <header className="w-full relative h-20 md:h-24 lg:h-28 overflow-hidden">
      {/* Solid Color Background with Blur - Matching sidebar color */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: '#686C88',
        }}
      >
        {/* Blur effect layer */}
        <div 
          className="absolute inset-0"
          style={{ 
            filter: 'blur(8px)',
            backdropFilter: 'blur(10px)',
            backgroundColor: '#686C88',
            opacity: 0.9,
          }}
        />
        
        {/* Gradient Overlay to merge seamlessly with sidebar - darker on left to match sidebar */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(to right, rgba(104, 108, 136, 0.95) 0%, rgba(104, 108, 136, 0.85) 30%, rgba(104, 108, 136, 0.8) 100%)',
          }}
        />
      </div>
      
      {/* Subtle texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
        }}
      />
      
      {/* Content Overlay - Optional branding or navigation */}
      <div className="relative z-10 h-full flex items-end">
        <div className="w-full px-6 pb-4">
          {/* You can add navigation, title, or other header content here */}
        </div>
      </div>
    </header>
  );
}
