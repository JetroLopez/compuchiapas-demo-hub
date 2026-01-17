import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Download, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";

type SpecialOrderStatus = "Notificado con Esdras" | "Pedido" | "En tienda" | "Entregado";

interface SpecialOrder {
  id: string;
  fecha: string;
  cliente: string;
  telefono: string | null;
  producto: string;
  clave: string | null;
  precio: number | null;
  anticipo: number | null;
  resta: number | null;
  folio_ingreso: string | null;
  fecha_aprox_entrega: string | null;
  estatus: SpecialOrderStatus;
  fecha_entrega: string | null;
  folio_servicio: string | null;
  remision: string | null;
  comentarios: string | null;
  created_at: string;
  updated_at: string;
}

const statusOptions: SpecialOrderStatus[] = [
  "Notificado con Esdras",
  "Pedido",
  "En tienda",
  "Entregado",
];

export default function AdminSpecialOrders() {
  const queryClient = useQueryClient();
  const { hasAccess } = useAuth();
  const isAdmin = hasAccess(["admin"]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SpecialOrder | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<SpecialOrder | null>(null);
  
  // Form state
  const [fecha, setFecha] = useState<Date>(new Date());
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [producto, setProducto] = useState("");
  const [clave, setClave] = useState("");
  const [precio, setPrecio] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const [resta, setResta] = useState("");
  const [folioIngreso, setFolioIngreso] = useState("");
  const [fechaAproxEntrega, setFechaAproxEntrega] = useState<Date | undefined>();
  const [estatus, setEstatus] = useState<SpecialOrderStatus>("Pedido");
  const [folioServicio, setFolioServicio] = useState("");
  const [remision, setRemision] = useState("");
  const [comentarios, setComentarios] = useState("");
  
  // Delivery dialog state
  const [fechaEntrega, setFechaEntrega] = useState<Date>(new Date());
  const [remisionEntrega, setRemisionEntrega] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["special-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("special_orders")
        .select("*")
        .neq("estatus", "Entregado")
        .order("fecha", { ascending: false });
      
      if (error) throw error;
      return data as SpecialOrder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (order: { cliente: string; producto: string; fecha: string; estatus: SpecialOrderStatus; [key: string]: unknown }) => {
      const { error } = await supabase.from("special_orders").insert([order]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-orders"] });
      toast.success("Pedido especial creado");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al crear el pedido");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...order }: Partial<SpecialOrder> & { id: string }) => {
      const { error } = await supabase
        .from("special_orders")
        .update(order)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-orders"] });
      toast.success("Pedido actualizado");
      resetForm();
      setIsDialogOpen(false);
      setEditingOrder(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al actualizar el pedido");
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async ({ id, fecha_entrega, remision }: { id: string; fecha_entrega: string; remision: string }) => {
      const { error } = await supabase
        .from("special_orders")
        .update({ estatus: "Entregado" as SpecialOrderStatus, fecha_entrega, remision })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-orders"] });
      toast.success("Pedido marcado como entregado");
      setIsDeliveryDialogOpen(false);
      setOrderToDeliver(null);
      setRemisionEntrega("");
      setFechaEntrega(new Date());
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al marcar como entregado");
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("special_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-orders"] });
      toast.success("Todos los registros han sido eliminados");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al limpiar registros");
    },
  });

  const resetForm = () => {
    setFecha(new Date());
    setCliente("");
    setTelefono("");
    setProducto("");
    setClave("");
    setPrecio("");
    setAnticipo("");
    setResta("");
    setFolioIngreso("");
    setFechaAproxEntrega(undefined);
    setEstatus("Pedido");
    setFolioServicio("");
    setRemision("");
    setComentarios("");
  };

  const handleEdit = (order: SpecialOrder) => {
    setEditingOrder(order);
    setFecha(new Date(order.fecha));
    setCliente(order.cliente);
    setTelefono(order.telefono || "");
    setProducto(order.producto);
    setClave(order.clave || "");
    setPrecio(order.precio?.toString() || "");
    setAnticipo(order.anticipo?.toString() || "");
    setResta(order.resta?.toString() || "");
    setFolioIngreso(order.folio_ingreso || "");
    setFechaAproxEntrega(order.fecha_aprox_entrega ? new Date(order.fecha_aprox_entrega) : undefined);
    setEstatus(order.estatus);
    setFolioServicio(order.folio_servicio || "");
    setRemision(order.remision || "");
    setComentarios(order.comentarios || "");
    setIsDialogOpen(true);
  };

  const handleStatusChange = (order: SpecialOrder, newStatus: SpecialOrderStatus) => {
    if (newStatus === "Entregado") {
      setOrderToDeliver(order);
      setIsDeliveryDialogOpen(true);
    } else {
      updateMutation.mutate({ id: order.id, estatus: newStatus });
    }
  };

  const handleDeliveryConfirm = () => {
    if (!orderToDeliver) return;
    if (!remisionEntrega.trim()) {
      toast.error("La remisión es obligatoria");
      return;
    }
    deliverMutation.mutate({
      id: orderToDeliver.id,
      fecha_entrega: format(fechaEntrega, "yyyy-MM-dd"),
      remision: remisionEntrega,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente.trim() || !producto.trim()) {
      toast.error("Cliente y Producto son obligatorios");
      return;
    }

    const orderData = {
      fecha: format(fecha, "yyyy-MM-dd"),
      cliente,
      telefono: telefono || null,
      producto,
      clave: clave || null,
      precio: precio ? parseFloat(precio) : null,
      anticipo: anticipo ? parseFloat(anticipo) : null,
      resta: resta ? parseFloat(resta) : null,
      folio_ingreso: folioIngreso || null,
      fecha_aprox_entrega: fechaAproxEntrega ? format(fechaAproxEntrega, "yyyy-MM-dd") : null,
      estatus,
      folio_servicio: folioServicio || null,
      remision: remision || null,
      comentarios: comentarios || null,
    };

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, ...orderData });
    } else {
      createMutation.mutate(orderData);
    }
  };

  const exportToExcel = async () => {
    const { data, error } = await supabase
      .from("special_orders")
      .select("*")
      .order("fecha", { ascending: false });
    
    if (error) {
      toast.error("Error al exportar");
      return;
    }

    const exportData = (data as SpecialOrder[]).map((order) => ({
      Fecha: order.fecha,
      Cliente: order.cliente,
      Teléfono: order.telefono,
      Producto: order.producto,
      Clave: order.clave,
      Precio: order.precio,
      Anticipo: order.anticipo,
      Resta: order.resta,
      "Folio de Ingreso": order.folio_ingreso,
      "Fecha Aprox. Entrega": order.fecha_aprox_entrega,
      Estatus: order.estatus,
      "Fecha de Entrega": order.fecha_entrega,
      "Folio de Servicio": order.folio_servicio,
      Remisión: order.remision,
      Comentarios: order.comentarios,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos Especiales");
    XLSX.writeFile(wb, `pedidos_especiales_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Archivo exportado correctamente");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pedidos Especiales</h2>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar XLSX
          </Button>
          
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Registro
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará TODOS los pedidos especiales de la base de datos.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearAllMutation.mutate()}>
                    Eliminar Todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
              setEditingOrder(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? "Editar Pedido Especial" : "Nuevo Pedido Especial"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !fecha && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fecha}
                          onSelect={(date) => date && setFecha(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Input
                      id="cliente"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Input
                      id="producto"
                      value={producto}
                      onChange={(e) => setProducto(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clave">Clave</Label>
                    <Input
                      id="clave"
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="anticipo">Anticipo</Label>
                    <Input
                      id="anticipo"
                      type="number"
                      step="0.01"
                      value={anticipo}
                      onChange={(e) => setAnticipo(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resta">Resta</Label>
                    <Input
                      id="resta"
                      type="number"
                      step="0.01"
                      value={resta}
                      onChange={(e) => setResta(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="folioIngreso">Folio de Ingreso</Label>
                    <Input
                      id="folioIngreso"
                      value={folioIngreso}
                      onChange={(e) => setFolioIngreso(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fecha Aprox. Entrega</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !fechaAproxEntrega && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaAproxEntrega 
                            ? format(fechaAproxEntrega, "PPP", { locale: es }) 
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fechaAproxEntrega}
                          onSelect={setFechaAproxEntrega}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Estatus</Label>
                    <Select value={estatus} onValueChange={(v) => setEstatus(v as SpecialOrderStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="folioServicio">Folio de Servicio</Label>
                    <Input
                      id="folioServicio"
                      value={folioServicio}
                      onChange={(e) => setFolioServicio(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="remision">Remisión</Label>
                    <Input
                      id="remision"
                      value={remision}
                      onChange={(e) => setRemision(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="comentarios">Comentarios</Label>
                    <Textarea
                      id="comentarios"
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      placeholder="Comentarios adicionales sobre el pedido..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingOrder ? "Guardar Cambios" : "Crear Pedido"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delivery confirmation dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha de Entrega *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaEntrega, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaEntrega}
                    onSelect={(date) => date && setFechaEntrega(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remisionEntrega">Remisión *</Label>
              <Input
                id="remisionEntrega"
                value={remisionEntrega}
                onChange={(e) => setRemisionEntrega(e.target.value)}
                placeholder="Número de remisión"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeliveryConfirm} disabled={deliverMutation.isPending}>
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders table */}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : orders && orders.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Clave</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Anticipo</TableHead>
                <TableHead>Resta</TableHead>
                <TableHead>Folio Ingreso</TableHead>
                <TableHead>Fecha Aprox.</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Folio Servicio</TableHead>
                <TableHead>Comentarios</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.fecha}</TableCell>
                  <TableCell>{order.cliente}</TableCell>
                  <TableCell>{order.telefono || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.producto}</TableCell>
                  <TableCell>{order.clave || "-"}</TableCell>
                  <TableCell>{order.precio ? `$${order.precio.toFixed(2)}` : "-"}</TableCell>
                  <TableCell>{order.anticipo ? `$${order.anticipo.toFixed(2)}` : "-"}</TableCell>
                  <TableCell>{order.resta ? `$${order.resta.toFixed(2)}` : "-"}</TableCell>
                  <TableCell>{order.folio_ingreso || "-"}</TableCell>
                  <TableCell>{order.fecha_aprox_entrega || "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={order.estatus}
                      onValueChange={(v) => handleStatusChange(order, v as SpecialOrderStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{order.folio_servicio || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.comentarios || ""}>
                    {order.comentarios || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(order)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay pedidos especiales pendientes
        </div>
      )}
    </div>
  );
}
