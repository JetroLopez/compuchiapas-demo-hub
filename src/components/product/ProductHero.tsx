import React from 'react';

const ProductHero: React.FC = () => {
  return (
    <section 
      className="pt-24 pb-3 md:pt-32 md:pb-4"
      style={{ background: 'linear-gradient(to bottom, #1e293b, #1e3a5f)' }}
    >
      <div className="container-padding max-w-7xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Catálogo de productos en tienda</h1>
        <p className="text-lg text-slate-300 max-w-3xl mx-auto">
          Equipos y accesorios de calidad con garantía y soporte técnico
        </p>
      </div>
    </section>
  );
};

export default ProductHero;
