'use client';

interface HeaderProps {
  isConnected: boolean;
  lastUpdated: Date | null;
}

export default function Header({ isConnected, lastUpdated }: HeaderProps) {
  return (
    <header
      id="header"
      className="glass-effect rounded-3xl p-6 mb-8 opacity-0 transform translate-y-[-30px]"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-accent-purple rounded-full blur-xl opacity-50 animate-pulse-slow" />
            <svg
              className="w-12 h-12 relative"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="heartbeat-line"
                d="M4 24h8l4-8 4 16 4-12 4 8h16"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent-purple via-primary-500 to-accent-pink bg-clip-text text-transparent">
              ECG Monitor Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">Real-time cardiac monitoring system</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5">
          <div className="relative">
            <span className="flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </span>
          </div>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}
