
# Refactorizacion del Sistema de Inventario

## Diagnostico del problema actual

El sistema tiene una tabla `products` con una columna `existencias` que es una **copia redundante** de la suma de `product_warehouse_stock`. Cada sincronizacion actualiza el stock por almacen y luego recorre **todos** los productos afectados uno por uno para recalcular la suma. Con ~1,944 productos y ~1,968 registros de stock, este paso final (paso 6 del sync) genera cientos de llamadas individuales UPDATE, que es muy probablemente la causa del error "Bad Request" (timeout o payload excedido).

Ademas, `products_por_surtir` no tiene `warehouse_id`, asi que no puede diferenciar en que almacen falta el producto, causando los conflictos que describes.

## Solucion propuesta: Eliminar la redundancia

La arquitectura actual (1 tabla de productos + 1 tabla de stock por almacen) **es el patron correcto**. El problema es la columna `existencias` duplicada en `products`. La solucion es:

1. **Dejar de usar `products.existencias`** - siempre calcular el stock desde `product_warehouse_stock`
2. **Agregar `warehouse_id` a `products_por_surtir`** - para saber exactamente en que almacen falta
3. **Simplificar el sync** - eliminar el paso 6 que recorre producto por producto

No se duplican datos, no se duplican tiempos de carga. El catalogo publico ya carga `product_warehouse_stock` por separado y lo filtra por almacenes exhibidos.

## Cambios detallados

### 1. Base de datos
- Crear una funcion SQL `get_product_total_stock(product_id)` que retorne la suma de existencias de todos los almacenes (para uso puntual)
- Agregar columna `warehouse_id` a `products_por_surtir` (nullable para compatibilidad con registros existentes)
- Mantener `products.existencias` temporalmente pero dejar de escribirla (eliminarla despues cuando todo funcione)

### 2. Sincronizacion (`ProductSync.tsx`)
- Eliminar el paso 6 completo (el loop que actualiza `products.existencias` uno por uno) - esto soluciona el "Bad Request"
- Simplificar el paso 7 (Por Surtir): al detectar productos con stock 0 en el almacen sincronizado, registrarlos con el `warehouse_id` correspondiente
- Simplificar el paso 8: al restaurar stock, solo borrar la entrada de Por Surtir del almacen especifico

### 3. Catalogo publico (`ProductsList.tsx`)
- Ya funciona correctamente porque usa `product_warehouse_stock` para filtrar. Solo necesita dejar de leer `products.existencias` y usar la suma de `product_warehouse_stock` en su lugar.
- El campo `existencias` que se pasa a `ProductCard` se calculara de la suma del stock en almacenes exhibidos

### 4. Por Surtir (`AdminPorSurtir.tsx`)
- Mostrar el almacen de origen en cada producto faltante
- Filtro por almacen mas preciso (usa directamente `warehouse_id` del registro en vez de cruzar con stock)
- Al restaurar un producto, solo se elimina la entrada del almacen donde recupero stock

### 5. PC Builder y compatibilidad (`useCompatibility.ts`, `PCBuilder.tsx`)
- Cambiar `.gt('existencias', 0)` por un filtro basado en `product_warehouse_stock` con join, o cargar el stock por separado como ya hace el catalogo

### 6. Admin Products (`AdminProducts.tsx`)
- El stock total mostrado se calculara desde `product_warehouse_stock` en vez de `products.existencias`

## Seccion tecnica

### Migracion SQL
```sql
-- Agregar warehouse_id a products_por_surtir
ALTER TABLE products_por_surtir 
  ADD COLUMN warehouse_id uuid REFERENCES warehouses(id);

-- Funcion para obtener stock total
CREATE OR REPLACE FUNCTION get_product_total_stock(p_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(existencias), 0)::integer
  FROM product_warehouse_stock
  WHERE product_id = p_id;
$$ LANGUAGE sql STABLE;
```

### Archivos a modificar
- `src/components/admin/ProductSync.tsx` - Eliminar paso 6, simplificar pasos 7-8
- `src/components/product/ProductsList.tsx` - Calcular existencias desde warehouse stock
- `src/components/admin/AdminPorSurtir.tsx` - Usar warehouse_id, mostrar almacen
- `src/components/admin/AdminProducts.tsx` - Stock total desde warehouse stock
- `src/hooks/useCompatibility.ts` - Filtrar por stock de warehouse
- `src/pages/PCBuilder.tsx` - Misma logica de stock
- `src/components/ProductCard.tsx` - Sin cambios (recibe existencias como prop)

### Impacto en rendimiento
- **Sync**: Mucho mas rapido al eliminar ~2000 UPDATE individuales
- **Catalogo**: Sin cambio (ya carga warehouse stock)
- **Por Surtir**: Mas rapido y preciso con filtro directo por warehouse_id
- **No se duplican productos** ni se duplican tiempos de carga
