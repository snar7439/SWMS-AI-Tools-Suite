'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const authData = sessionStorage.getItem('swms-auth');
    if (authData) {
      try {
        const authInfo = JSON.parse(authData);
        if (authInfo.authenticated) {
          // User is authenticated, redirect to components page
          router.push('/components');
          return;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
        sessionStorage.removeItem('swms-auth');
      }
    }
    
    // User is not authenticated, redirect to login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
