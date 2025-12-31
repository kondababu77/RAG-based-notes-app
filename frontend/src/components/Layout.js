import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlusIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'New Note', href: '/note/new', icon: PlusIcon },
  { name: 'AI Assistant', href: '/ai', icon: SparklesIcon },
  { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
];

function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-secondary-200 z-30 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-secondary-200">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
            <DocumentTextIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-secondary-900">AI Notes</h1>
            <p className="text-xs text-secondary-500">Smart Note Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-secondary-200">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <UserCircleIcon className="w-8 h-8 text-secondary-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-secondary-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* AI Badge */}
        <div className="p-4 pt-0">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-900">RAG Powered</span>
            </div>
            <p className="text-xs text-secondary-600">
              AI-powered search and Q&A using your personal notes as context.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
