
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
      <div className="fixed bottom-3 left-3 z-30 animate-fade-up">
        <button 
          onClick={handleReopen}
          className="bg-tech-blue text-white rounded-full py-2 px-4 shadow-lg hover:bg-tech-blue/90 transition-colors text-sm"
        >
          Ver oferta
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-3 left-3 z-30 max-w-xs animate-fade-up">
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-100 relative">
        <button 
          onClick={handleClose}
          className="absolute right-1 top-1 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} className="text-gray-500" />
        </button>
        
        <h3 className="text-base font-bold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">
          {description}
        </p>
        <div className="flex justify-end">
          <button 
            className="text-sm text-tech-blue font-medium hover:underline"
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
