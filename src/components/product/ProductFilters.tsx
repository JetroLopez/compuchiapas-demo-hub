
import React from 'react';
import { Search, Filter } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="mb-12 space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar productos..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-1 overflow-x-auto pb-2">
        <div className="p-2 bg-tech-gray/10 rounded-lg mr-2">
          <Filter size={18} className="text-tech-gray" />
        </div>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-tech-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductFilters;
