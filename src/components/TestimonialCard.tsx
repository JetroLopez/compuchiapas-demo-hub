
import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  testimonial: string;
  rating: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  name, 
  testimonial, 
  rating 
}) => {
  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <div className="flex mb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={18}
            className={`${
              index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      
      <p className="text-gray-700 italic flex-grow mb-6">{`"${testimonial}"`}</p>
      
      <div className="mt-auto">
        <p className="font-semibold text-tech-gray">{name}</p>
      </div>
    </div>
  );
};

export default TestimonialCard;
