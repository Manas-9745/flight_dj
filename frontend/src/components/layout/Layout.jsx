import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-aero-navy text-slate-400 py-6 text-center text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} AeroMate - The Aviation Journey Companion</p>
        <p className="mt-1 text-xs text-slate-500">Hackathon Demo Application</p>
      </footer>
    </div>
  );
};

export default Layout;
