
import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const whatsappNumber = "9622148546"; // Número de WhatsApp actualizado
  const whatsappMessage = "¡Hola! Me gustaría obtener más información sobre sus servicios.";
  
  const handleClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  return (
    <>
      <div 
        className={`fixed bottom-24 right-6 z-50 transition-all duration-300 ease-in-out ${showTooltip ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs flex items-start gap-2">
          <button 
            onClick={() => setShowTooltip(false)}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
          <p className="text-sm">¡Hola! ¿En qué podemos ayudarte? Escríbenos por WhatsApp 😊</p>
        </div>
        <div className="w-4 h-4 bg-white transform rotate-45 absolute -bottom-2 right-6"></div>
      </div>
    
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        className="fixed bottom-8 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle size={28} />
      </button>
    </>
  );
};

export default WhatsAppButton;
