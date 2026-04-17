import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import router from './router';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F5F0E8',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#C9922A', secondary: '#0D0D0D' },
          },
          error: {
            iconTheme: { primary: '#E53935', secondary: '#F5F0E8' },
          },
          duration: 3000,
        }}
      />
    </>
  );
}
