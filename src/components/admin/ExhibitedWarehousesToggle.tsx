import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Eye, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Warehouse {
  id: string;
  name: string;
}

interface ExhibitedWarehouse {
  id: string;
  warehouse_id: string;
  is_exhibited: boolean;
}

const ExhibitedWarehousesToggle: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async (): Promise<Warehouse[]> => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch exhibited warehouses
  const { data: exhibitedWarehouses = [], isLoading } = useQuery({
    queryKey: ['exhibited-warehouses'],
    queryFn: async (): Promise<ExhibitedWarehouse[]> => {
      const { data, error } = await supabase
        .from('exhibited_warehouses')
        .select('id, warehouse_id, is_exhibited');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ warehouseId, isExhibited }: { warehouseId: string; isExhibited: boolean }) => {
      const existing = exhibitedWarehouses.find(ew => ew.warehouse_id === warehouseId);
      
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('exhibited_warehouses')
          .update({ is_exhibited: isExhibited })
          .eq('warehouse_id', warehouseId);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('exhibited_warehouses')
          .insert({ warehouse_id: warehouseId, is_exhibited: isExhibited });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibited-warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Almacenes exhibidos actualizados');
    },
    onError: () => {
      toast.error('Error al actualizar almacenes exhibidos');
    },
  });

  // Check if a warehouse is exhibited
  const isWarehouseExhibited = (warehouseId: string): boolean => {
    const record = exhibitedWarehouses.find(ew => ew.warehouse_id === warehouseId);
    // If no record exists, default to not exhibited
    return record ? record.is_exhibited : false;
  };

  // Count exhibited warehouses
  const exhibitedCount = warehouses.filter(w => isWarehouseExhibited(w.id)).length;

  const handleToggle = (warehouseId: string, currentValue: boolean) => {
    toggleMutation.mutate({ warehouseId, isExhibited: !currentValue });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye size={16} className="mr-2" />
          Productos exhibidos
          {exhibitedCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {exhibitedCount}
            </span>
          )}
          <ChevronDown size={14} className="ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="font-medium text-sm">Almacenes exhibidos</div>
          <p className="text-xs text-muted-foreground">
            Selecciona los almacenes cuyos productos se mostrarán en la página pública.
          </p>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No hay almacenes disponibles</p>
          ) : (
            <div className="space-y-3">
              {warehouses.map((warehouse) => {
                const isExhibited = isWarehouseExhibited(warehouse.id);
                return (
                  <div key={warehouse.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`warehouse-${warehouse.id}`}
                      checked={isExhibited}
                      onCheckedChange={() => handleToggle(warehouse.id, isExhibited)}
                      disabled={toggleMutation.isPending}
                    />
                    <Label
                      htmlFor={`warehouse-${warehouse.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {warehouse.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
          
          {exhibitedCount === 0 && warehouses.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Sin almacenes seleccionados, no se mostrarán productos en la página pública.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExhibitedWarehousesToggle;
