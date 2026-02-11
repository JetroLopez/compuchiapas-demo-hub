import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Download, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";

type WarrantyStatus = "En revisión" | "Con proveedor" | "Listo para su entrega";

interface Warranty {
  id: string;
  cliente: string;
  clave_producto: string;
  descripcion_producto: string;
  descripcion_problema: string;
  clave_proveedor: string;
  remision_factura: string;
  fecha_ingreso: string;
  folio_servicio: string | null;
  estatus: WarrantyStatus;
  comentarios: string | null;
  created_at: string;
  updated_at: string;
}

const statusOptions: WarrantyStatus[] = [
  "En revisión",
  "Con proveedor",
  "Listo para su entrega",
];

const getStatusBadge = (estatus: WarrantyStatus) => {
  switch (estatus) {
    case "En revisión":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-xs">{estatus}</Badge>;
    case "Con proveedor":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 text-xs">{estatus}</Badge>;
    case "Listo para su entrega":
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-xs">{estatus}</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{estatus}</Badge>;
  }
};

export default function AdminWarranties() {
  const queryClient = useQueryClient();
  const { hasAccess } = useAuth();
  const canEdit = hasAccess(["admin", "supervisor"]);
  const isMobile = useIsMobile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [expandedWarranty, setExpandedWarranty] = useState<string | null>(null);

  // Form state
  const [cliente, setCliente] = useState("");
  const [claveProducto, setClaveProducto] = useState("");
  const [descripcionProducto, setDescripcionProducto] = useState("");
  const [descripcionProblema, setDescripcionProblema] = useState("");
  const [claveProveedor, setClaveProveedor] = useState("");
  const [remisionFactura, setRemisionFactura] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState<Date>(new Date());
  const [folioServicio, setFolioServicio] = useState("");
  const [estatus, setEstatus] = useState<WarrantyStatus>("En revisión");
  const [comentarios, setComentarios] = useState("");

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .order("fecha_ingreso", { ascending: false });
      if (error) throw error;
      return data as Warranty[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (warranty: Omit<Warranty, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("warranties").insert([warranty]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      toast.success("Garantía registrada");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Error al registrar la garantía"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Warranty> & { id: string }) => {
      const { error } = await supabase.from("warranties").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      toast.success("Garantía actualizada");
      resetForm();
      setIsDialogOpen(false);
      setEditingWarranty(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, estatus }: { id: string; estatus: WarrantyStatus }) => {
      const { error } = await supabase.from("warranties").update({ estatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      toast.success("Estatus actualizado");
    },
    onError: () => toast.error("Error al actualizar estatus"),
  });

  const resetForm = () => {
    setCliente("");
    setClaveProducto("");
    setDescripcionProducto("");
    setDescripcionProblema("");
    setClaveProveedor("");
    setRemisionFactura("");
    setFechaIngreso(new Date());
    setFolioServicio("");
    setEstatus("En revisión");
    setComentarios("");
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setCliente(warranty.cliente);
    setClaveProducto(warranty.clave_producto);
    setDescripcionProducto(warranty.descripcion_producto);
    setDescripcionProblema(warranty.descripcion_problema);
    setClaveProveedor(warranty.clave_proveedor);
    setRemisionFactura(warranty.remision_factura);
    setFechaIngreso(new Date(warranty.fecha_ingreso));
    setFolioServicio(warranty.folio_servicio || "");
    setEstatus(warranty.estatus);
    setComentarios(warranty.comentarios || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !claveProducto.trim() || !descripcionProducto.trim() || !descripcionProblema.trim() || !claveProveedor.trim() || !remisionFactura.trim()) {
      toast.error("Todos los campos obligatorios deben ser llenados");
      return;
    }

    const data = {
      cliente,
      clave_producto: claveProducto,
      descripcion_producto: descripcionProducto,
      descripcion_problema: descripcionProblema,
      clave_proveedor: claveProveedor,
      remision_factura: remisionFactura,
      fecha_ingreso: format(fechaIngreso, "yyyy-MM-dd"),
      folio_servicio: folioServicio || null,
      estatus,
      comentarios: comentarios || null,
    };

    if (editingWarranty) {
      updateMutation.mutate({ id: editingWarranty.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const exportToExcel = () => {
    const exportData = warranties.map((w) => ({
      Cliente: w.cliente,
      "Clave Producto": w.clave_producto,
      "Descripción Producto": w.descripcion_producto,
      "Descripción Problema": w.descripcion_problema,
      "Clave Proveedor": w.clave_proveedor,
      "Remisión/Factura": w.remision_factura,
      "Fecha de Ingreso": w.fecha_ingreso,
      "Folio de Servicio": w.folio_servicio,
      Estatus: w.estatus,
      Comentarios: w.comentarios,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Garantías");
    XLSX.writeFile(wb, `garantias_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Archivo exportado");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Garantías</h2>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar XLSX
          </Button>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { resetForm(); setEditingWarranty(null); }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Garantía
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingWarranty ? "Editar Garantía" : "Nueva Garantía"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Cliente *</Label>
                      <Input id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claveProducto">Clave del Producto *</Label>
                      <Input id="claveProducto" value={claveProducto} onChange={(e) => setClaveProducto(e.target.value)} required />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="descripcionProducto">Descripción del Producto *</Label>
                      <Input id="descripcionProducto" value={descripcionProducto} onChange={(e) => setDescripcionProducto(e.target.value)} required />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="descripcionProblema">Descripción del Problema/Daño *</Label>
                      <Textarea id="descripcionProblema" value={descripcionProblema} onChange={(e) => setDescripcionProblema(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claveProveedor">Clave del Proveedor *</Label>
                      <Input id="claveProveedor" value={claveProveedor} onChange={(e) => setClaveProveedor(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="remisionFactura">Remisión o Factura *</Label>
                      <Input id="remisionFactura" value={remisionFactura} onChange={(e) => setRemisionFactura(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Ingreso</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaIngreso && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaIngreso ? format(fechaIngreso, "PPP", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={fechaIngreso} onSelect={(d) => d && setFechaIngreso(d)} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="folioServicio">Folio de Servicio</Label>
                      <Input id="folioServicio" value={folioServicio} onChange={(e) => setFolioServicio(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estatus</Label>
                      <Select value={estatus} onValueChange={(v) => setEstatus(v as WarrantyStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="comentarios">Comentarios adicionales</Label>
                      <Textarea id="comentarios" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingWarranty ? "Guardar Cambios" : "Registrar Garantía"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Warranty Cards */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : warranties.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay garantías registradas</p>
        </div>
      ) : (
        isMobile ? (
          <div className="space-y-2">
            {warranties.map((w) => (
              <div
                key={w.id}
                className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpandedWarranty(expandedWarranty === w.id ? null : w.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-1 flex-1">{w.descripcion_producto}</p>
                  <div onClick={(e) => e.stopPropagation()}>
                    {canEdit ? (
                      <Select
                        value={w.estatus}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: w.id, estatus: v as WarrantyStatus })}
                      >
                        <SelectTrigger className="w-auto h-7 text-xs border-0 p-0">
                          {getStatusBadge(w.estatus)}
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : getStatusBadge(w.estatus)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{format(new Date(w.fecha_ingreso), "d MMM yyyy", { locale: es })}</span>
                  <span>•</span>
                  <span>{w.clave_proveedor}</span>
                </div>
                {expandedWarranty === w.id && (
                  <div className="pt-2 border-t space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Cliente:</span> {w.cliente}</p>
                    <p><span className="text-muted-foreground">Clave:</span> {w.clave_producto}</p>
                    <p><span className="text-muted-foreground">Problema:</span> {w.descripcion_problema}</p>
                    <p><span className="text-muted-foreground">Remisión:</span> {w.remision_factura}</p>
                    {w.folio_servicio && <p><span className="text-muted-foreground">Folio:</span> {w.folio_servicio}</p>}
                    {w.comentarios && <p><span className="text-muted-foreground">Comentarios:</span> {w.comentarios}</p>}
                    {canEdit && (
                      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={(e) => { e.stopPropagation(); handleEdit(w); }}>
                        Editar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_auto_auto_auto] md:grid-cols-[2fr_1fr_1fr_auto] gap-0">
            {/* Header */}
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">Producto</div>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">Proveedor</div>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">Ingreso</div>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50 text-right">Estatus</div>
            {/* Rows */}
            {warranties.map((w) => (
              <React.Fragment key={w.id}>
                <div
                  className={cn("px-3 py-2.5 text-sm truncate border-b cursor-pointer hover:bg-muted/30", canEdit && "hover:underline")}
                  onClick={() => canEdit ? handleEdit(w) : undefined}
                >
                  {w.descripcion_producto}
                </div>
                <div className="px-3 py-2.5 text-sm text-muted-foreground border-b">{w.clave_proveedor}</div>
                <div className="px-3 py-2.5 text-sm text-muted-foreground border-b">
                  {format(new Date(w.fecha_ingreso), "d MMM yyyy", { locale: es })}
                </div>
                <div className="px-3 py-2 border-b flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
                  {canEdit ? (
                    <Select
                      value={w.estatus}
                      onValueChange={(v) => updateStatusMutation.mutate({ id: w.id, estatus: v as WarrantyStatus })}
                    >
                      <SelectTrigger className="w-auto h-7 text-xs border-0 p-0">
                        {getStatusBadge(w.estatus)}
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(w.estatus)
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        )
      )}
    </div>
  );
}
