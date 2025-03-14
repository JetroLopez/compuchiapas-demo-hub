
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface OfferPopupProps {
  title: string;
  description: string;
  ctaText: string;
  onCtaClick: () => void;
}

const OfferPopup: React.FC<OfferPopupProps> = ({
  title,
  description,
  ctaText,
  onCtaClick,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClose = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleReopen = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-30 animate-fade-up">
        <button 
          onClick={handleReopen}
          className="bg-tech-blue text-white rounded-full py-2 px-4 shadow-lg hover:bg-tech-blue/90 transition-colors"
        >
          Ver oferta especial
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-6 z-30 max-w-sm animate-fade-up">
      <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-100 relative">
        <button 
          onClick={handleClose}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} className="text-gray-500" />
        </button>
        
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">
          {description}
        </p>
        <div className="flex justify-end">
          <button 
            className="text-tech-blue font-medium hover:underline"
            onClick={onCtaClick}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferPopup;
