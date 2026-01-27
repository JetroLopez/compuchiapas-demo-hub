import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Check, AlertCircle } from 'lucide-react';
import { useComponentProducts, useFilteredProducts } from '@/hooks/useCompatibility';
import { PCBuild, ProductWithSpec, COMPONENT_CATEGORIES } from '@/lib/compatibility-rules';
import { formatCurrency } from '@/lib/quotation-export';

interface ComponentSelectorProps {
  type: keyof PCBuild;
  label: string;
  icon: string;
  selected: ProductWithSpec | null;
  onSelect: (product: ProductWithSpec | null) => void;
  currentBuild: PCBuild;
  price: number;
  onPriceChange: (price: number) => void;
  // RAM quantity support
  quantity?: number;
  maxQuantity?: number;
  onQuantityChange?: (qty: number) => void;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  type,
  label,
  icon,
  selected,
  onSelect,
  currentBuild,
  price,
  onPriceChange,
  quantity,
  maxQuantity,
  onQuantityChange,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allProducts = [], isLoading } = useComponentProducts(type as keyof typeof COMPONENT_CATEGORIES);
  const compatibleProducts = useFilteredProducts(allProducts, type, currentBuild);

  const filteredProducts = search
    ? compatibleProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.clave?.toLowerCase().includes(search.toLowerCase())
      )
    : compatibleProducts;

  const incompatibleCount = allProducts.length - compatibleProducts.length;

  const handleSelect = (product: ProductWithSpec) => {
    onSelect(product);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelect(null);
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      {/* Icon and Label */}
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-lg">
        {icon}
      </div>

      {/* Selection Display */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {selected ? (
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{selected.name}</p>
            {selected.spec && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {selected.spec.socket || selected.spec.ram_type || selected.spec.form_factor || 'Specs ✓'}
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin seleccionar</p>
        )}
      </div>

      {/* Quantity selector for RAM */}
      {selected && quantity !== undefined && onQuantityChange && (
        <div className="w-16 shrink-0">
          <Input
            type="number"
            min="1"
            max={maxQuantity || 4}
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            className="h-8 text-sm text-center"
            title={`Máximo: ${maxQuantity || 4}`}
          />
        </div>
      )}

      {/* Price Input */}
      {selected && (
        <div className="w-24 shrink-0">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
            placeholder="Precio"
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {selected && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
            <X size={14} />
          </Button>
        )}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant={selected ? "outline" : "default"} size="sm" className="h-8">
              {selected ? 'Cambiar' : 'Seleccionar'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{icon}</span>
                Seleccionar {label}
              </DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Buscar por nombre o clave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Compatibility info */}
            {incompatibleCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle size={14} />
                <span>{incompatibleCount} productos ocultos por incompatibilidad</span>
              </div>
            )}

            {/* Products List */}
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando productos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron productos compatibles
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selected?.id === product.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleSelect(product)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.clave && (
                            <p className="text-xs text-muted-foreground">{product.clave}</p>
                          )}
                          
                          {/* Specs badges */}
                          {product.spec && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.spec.socket && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Socket: {product.spec.socket}
                                </Badge>
                              )}
                              {product.spec.ram_type && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {product.spec.ram_type}
                                </Badge>
                              )}
                              {product.spec.form_factor && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {product.spec.form_factor}
                                </Badge>
                              )}
                              {product.spec.cpu_tdp && (
                                <Badge variant="secondary" className="text-[10px]">
                                  TDP: {product.spec.cpu_tdp}W
                                </Badge>
                              )}
                              {product.spec.gpu_tdp && (
                                <Badge variant="secondary" className="text-[10px]">
                                  TDP: {product.spec.gpu_tdp}W
                                </Badge>
                              )}
                              {product.spec.psu_wattage && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {product.spec.psu_wattage}W
                                </Badge>
                              )}
                              {product.spec.ram_capacity && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {product.spec.ram_capacity}GB
                                </Badge>
                              )}
                              {product.spec.ram_speed && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {product.spec.ram_speed}MHz
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {!product.spec && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                              Sin especificaciones configuradas
                            </p>
                          )}
                        </div>
                        
                        {selected?.id === product.id && (
                          <Check size={18} className="text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ComponentSelector;
