import React from 'react';
import { Link } from 'react-router-dom';
import { Sun } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sun className="h-8 w-8 text-amber-500" />
          <Link to="/" className="text-xl font-bold text-gray-900">
            PR Analyzer
          </Link>
        </div>
        <nav className="flex items-center space-x-4">
          {hasData && (
            <button
              onClick={onReset}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 px-3 py-2 rounded-md transition-colors"
            >
              Upload New CSV
            </button>
          )}
          <Link
            to="/about"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
};
