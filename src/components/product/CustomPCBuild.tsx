
import React from 'react';

interface CheckIconProps {
  className?: string;
}

// Componente CheckIcon
const CheckIcon: React.FC<CheckIconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CustomPCBuild: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-8 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">Armamos tu PC ideal</h2>
          <p className="text-gray-600 mb-6">
            Si no encuentras el equipo que necesitas en nuestro catálogo, podemos armar una computadora personalizada según tus especificaciones y presupuesto.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
              <p>Componentes de las mejores marcas con garantía</p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
              <p>Asesoría técnica para elegir las mejores opciones</p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
              <p>Ensamblaje profesional y pruebas de rendimiento</p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
              <p>Soporte técnico post-venta sin costo adicional</p>
            </div>
          </div>
          
          <a 
            href="https://wa.me/529612345678?text=Hola,%20me%20interesa%20cotizar%20una%20PC%20personalizada." 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center"
          >
            Solicitar cotización
          </a>
        </div>
        
        <div className="hidden md:block">
          <img 
            src="https://images.unsplash.com/photo-1624705002806-5d72df19c3dd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            alt="Ensamble de PC" 
            className="rounded-xl w-full h-auto shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomPCBuild;
