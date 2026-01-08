
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface OfferPopupProps {
  title: string;
  description: string;
  ctaText: string;
  onCtaClick: () => void;
  delay?: number;
}

const OfferPopup: React.FC<OfferPopupProps> = ({
  title,
  description,
  ctaText,
  onCtaClick,
  delay = 40000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleClose = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleReopen = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  if (!isVisible) return null;

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
    <div className="fixed bottom-1 left-1 z-30 max-w-[200px] md:max-w-xs animate-fade-up">
      <div className="bg-white rounded-lg shadow-xl p-2 md:p-3 border border-gray-100 relative">
        <button 
          onClick={handleClose}
          className="absolute right-0.5 top-0.5 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Cerrar"
        >
          <X size={14} className="text-gray-500" />
        </button>
        
        <h3 className="text-xs md:text-sm font-bold mb-0.5 pr-4">{title}</h3>
        <p className="text-[10px] md:text-xs text-gray-600 mb-1 md:mb-1.5">
          {description}
        </p>
        <div className="flex justify-end">
          <button 
            className="text-[10px] md:text-xs text-tech-blue font-medium hover:underline"
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
