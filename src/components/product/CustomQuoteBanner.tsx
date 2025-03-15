
import React from 'react';
import { MessageCircle } from 'lucide-react';

const CustomQuoteBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-tech-blue to-blue-700 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="col-span-2 p-6 md:p-8 text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-3">
            ¿Necesitas un equipo personalizado?
          </h2>
          <p className="text-white/90 text-base mb-4">
            Ensamblamos tu PC ideal según tus necesidades y presupuesto.
          </p>
          <a 
            href="https://wa.me/529622148546?text=Hola,%20me%20interesa%20ensamblar%20una%20PC%20personalizada.%20¿Me%20pueden%20asesorar?" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-tech-blue hover:bg-gray-100 py-2 px-4 rounded-lg font-medium inline-flex items-center transition-all duration-300"
          >
            <MessageCircle size={16} className="mr-2" />
            Cotiza tu PC ahora
          </a>
        </div>
        <div className="hidden lg:block relative">
          <img 
            src="https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            alt="PC Personalizada" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomQuoteBanner;
