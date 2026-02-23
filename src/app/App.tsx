import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { initializeSampleData } from './lib/storage';

export default function App() {
  useEffect(() => {
    // Set document title
    document.title = 'Capturely - Form & Popup Builder for SMBs';
    
    // Initialize sample data
    initializeSampleData();
  }, []);
  
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}