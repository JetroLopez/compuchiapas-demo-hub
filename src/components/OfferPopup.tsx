
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
      <div className="fixed bottom-1 left-1 z-30 animate-fade-up">
        <button 
          onClick={handleReopen}
          className="bg-tech-blue text-white rounded-full py-1.5 px-3 shadow-lg hover:bg-tech-blue/90 transition-colors text-xs"
        >
          Ver oferta
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-1 left-1 z-30 max-w-xs animate-fade-up">
      <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-100 relative">
        <button 
          onClick={handleClose}
          className="absolute right-0.5 top-0.5 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Cerrar"
        >
          <X size={14} className="text-gray-500" />
        </button>
        
        <h3 className="text-sm font-bold mb-0.5">{title}</h3>
        <p className="text-xs text-gray-600 mb-1.5">
          {description}
        </p>
        <div className="flex justify-end">
          <button 
            className="text-xs text-tech-blue font-medium hover:underline"
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
