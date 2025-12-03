import React, { useState } from 'react';
import { Play, Trash2, Edit, Lock, Unlock, Search } from 'lucide-react';
import { SavedQuery, PredefinedQuery } from '../../types/reporting';

interface QueryLibraryProps {
  savedQueries: SavedQuery[];
  predefinedQueries: PredefinedQuery[];
  onExecute: (query: SavedQuery | PredefinedQuery) => void;
  onDelete?: (id: string) => void;
  onEdit?: (query: SavedQuery) => void;
  isAdmin: boolean;
  currentUserId: string;
}

export const QueryLibrary: React.FC<QueryLibraryProps> = ({
  savedQueries,
  predefinedQueries,
  onExecute,
  onDelete,
  onEdit,
  isAdmin,
  currentUserId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allQueries = [...savedQueries, ...predefinedQueries];

  const categories = ['all', ...Array.from(new Set(allQueries.map(q => q.category)))];

  const filteredQueries = allQueries.filter(query => {
    const matchesSearch = query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || query.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isSavedQuery = (query: any): query is SavedQuery => {
    return 'created_by' in query;
  };

  const canEdit = (query: SavedQuery | PredefinedQuery): boolean => {
    if (!isSavedQuery(query)) return false;
    return isAdmin || query.created_by === currentUserId;
  };

  const canDelete = (query: SavedQuery | PredefinedQuery): boolean => {
    if (!isSavedQuery(query)) return false;
    return isAdmin || query.created_by === currentUserId;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Query Library</h2>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {filteredQueries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No queries found
          </div>
        ) : (
          filteredQueries.map(query => (
            <div
              key={query.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{query.name}</h3>
                    {isSavedQuery(query) && (
                      query.is_public ? (
                        <Unlock size={14} className="text-green-600" title="Public query" />
                      ) : (
                        <Lock size={14} className="text-gray-400" title="Private query" />
                      )
                    )}
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {query.category}
                    </span>
                    {!isSavedQuery(query) && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                        Predefined
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{query.description}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onExecute(query)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Execute query"
                  >
                    <Play size={16} />
                  </button>

                  {canEdit(query) && onEdit && isSavedQuery(query) && (
                    <button
                      onClick={() => onEdit(query)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit query"
                    >
                      <Edit size={16} />
                    </button>
                  )}

                  {canDelete(query) && onDelete && (
                    <button
                      onClick={() => onDelete(query.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete query"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
