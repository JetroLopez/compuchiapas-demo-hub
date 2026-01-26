import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText, Monitor } from 'lucide-react';
import GeneralQuotation from './GeneralQuotation';
import PCBuilderQuotation from './PCBuilderQuotation';

const AdminQuotations: React.FC = () => {
  const [isPCBuilder, setIsPCBuilder] = useState(false);

  return (
    <div className="space-y-6">
      {/* Toggle between modes */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className={`flex items-center gap-2 transition-opacity ${!isPCBuilder ? 'opacity-100' : 'opacity-50'}`}>
          <FileText size={20} />
          <span className="font-medium">General</span>
        </div>
        
        <Switch
          id="quotation-mode"
          checked={isPCBuilder}
          onCheckedChange={setIsPCBuilder}
        />
        
        <div className={`flex items-center gap-2 transition-opacity ${isPCBuilder ? 'opacity-100' : 'opacity-50'}`}>
          <Monitor size={20} />
          <span className="font-medium">PC Builder</span>
        </div>
      </div>

      {/* Render active mode */}
      {isPCBuilder ? <PCBuilderQuotation /> : <GeneralQuotation />}
    </div>
  );
};

export default AdminQuotations;
