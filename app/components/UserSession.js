'use client';

import { useState, useEffect } from 'react';

export default function UserSession() {
  const [userIdInput, setUserIdInput] = useState('TEST0100');
  const [currentUserId, setCurrentUserId] = useState('TEST0100');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentUserId(userIdInput);
    setIsEditing(false);
    
    // Store in sessionStorage for persistence
    sessionStorage.setItem('swms-user-id', userIdInput);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setUserIdInput(currentUserId);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUserIdInput(currentUserId);
  };

  useEffect(() => {
    // Load from sessionStorage on component mount
    const stored = sessionStorage.getItem('swms-user-id');
    if (stored) {
      setCurrentUserId(stored);
      setUserIdInput(stored);
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">SWMS User ID</h3>
      </div>

      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">OPS$</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {currentUserId}
            </span>
          </div>
          <button
            onClick={handleEdit}
            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">OPS$</span>
            <input
              type="text"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter User ID"
              required
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="submit"
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
