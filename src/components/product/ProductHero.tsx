
import React from 'react';

const ProductHero: React.FC = () => {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-b from-tech-lightGray to-white">
      <div className="container-padding max-w-7xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Catálogo de Productos</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Equipos y accesorios de calidad con garantía y soporte técnico
        </p>
      </div>
    </section>
  );
};

export default ProductHero;
