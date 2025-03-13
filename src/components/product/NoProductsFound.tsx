
import React from 'react';

interface NoProductsFoundProps {
  resetFilters: () => void;
}

const NoProductsFound: React.FC<NoProductsFoundProps> = ({ resetFilters }) => {
  return (
    <div className="text-center py-16">
      <p className="text-xl text-gray-600">
        No se encontraron productos que coincidan con tu búsqueda.
      </p>
      <button
        className="mt-4 text-tech-blue hover:underline"
        onClick={resetFilters}
      >
        Limpiar filtros
      </button>
    </div>
  );
};

export default NoProductsFound;
