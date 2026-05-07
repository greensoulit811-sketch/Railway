import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function DebugPanel() {
  const { user, isAdmin, isLoading, authError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white px-3 py-1 rounded text-xs font-mono"
      >
        {isOpen ? 'Hide' : 'Debug'}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-10 right-0 bg-black text-white p-4 rounded-lg text-xs font-mono min-w-[250px] shadow-lg">
          <div className="space-y-1">
            <p>authLoading: <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{String(isLoading)}</span></p>
            <p>user: <span className={user ? 'text-green-400' : 'text-red-400'}>{user?.email || 'null'}</span></p>
            <p>isAdmin: <span className={isAdmin ? 'text-green-400' : 'text-yellow-400'}>{String(isAdmin)}</span></p>
            {authError && <p>error: <span className="text-red-400">{authError}</span></p>}
          </div>
        </div>
      )}
    </div>
  );
}
