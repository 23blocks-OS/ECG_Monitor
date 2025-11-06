'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to patients page
    router.push('/patients');
  }, [router]);

  return (
    <div className="gradient-mesh min-h-screen text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-purple mx-auto mb-4"></div>
        <p className="text-lg">Redirecting to patients...</p>
      </div>
    </div>
  );
}
