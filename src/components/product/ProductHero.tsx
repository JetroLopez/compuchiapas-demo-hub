
import React from 'react';

const ProductHero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-tech-lightGray to-white">
      <div className="container-padding max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Catálogo de Productos</h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
          Equipos y accesorios de calidad con garantía y soporte técnico incluido
        </p>
      </div>
    </section>
  );
};

export default ProductHero;
