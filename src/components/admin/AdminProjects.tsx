import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, CalendarIcon, Phone, User, FileText, Check, Loader2, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  project_number: number;
  fecha: string;
  cliente_nombre: string;
  telefono_contacto: string;
  nombre_proyecto: string;
  descripcion: string | null;
  assigned_user_id: string;
  assigned_user_name: string;
  is_completed: boolean;
  completed_at: string | null;
  remision_numero: string | null;
  monto_total: number | null;
  created_at: string;
  updated_at: string;
}

interface ProjectLog {
  id: string;
  project_id: string;
  content: string;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
}

const AdminProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [completionData, setCompletionData] = useState({ remision: '', monto: '' });
  const [showCelebration, setShowCelebration] = useState<{
    projectNumber: number;
    userName: string;
    monto: number;
    fecha: string;
  } | null>(null);
  
  // Form states
  const [newProjectDate, setNewProjectDate] = useState<Date>(new Date());
  const [newProject, setNewProject] = useState({
    cliente_nombre: '',
    telefono_contacto: '',
    nombre_proyecto: '',
    descripcion: ''
  });
  
  // Edit states
  const [editData, setEditData] = useState({
    cliente_nombre: '',
    telefono_contacto: '',
    nombre_proyecto: '',
    descripcion: ''
  });
  const [newLogEntry, setNewLogEntry] = useState('');

  // Fetch user profile name
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    }
  });

  // Fetch logs for selected project
  const { data: projectLogs } = useQuery({
    queryKey: ['project-logs', selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject?.id) return [];
      const { data, error } = await supabase
        .from('project_logs')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectLog[];
    },
    enabled: !!selectedProject?.id
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const userName = userProfile?.full_name || userProfile?.email || 'Usuario';
      const { data, error } = await supabase
        .from('projects')
        .insert({
          fecha: format(newProjectDate, 'yyyy-MM-dd'),
          cliente_nombre: newProject.cliente_nombre,
          telefono_contacto: newProject.telefono_contacto,
          nombre_proyecto: newProject.nombre_proyecto,
          descripcion: newProject.descripcion || null,
          assigned_user_id: user!.id,
          assigned_user_name: userName
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsNewProjectOpen(false);
      setNewProject({ cliente_nombre: '', telefono_contacto: '', nombre_proyecto: '', descripcion: '' });
      setNewProjectDate(new Date());
      toast({ title: 'Proyecto creado exitosamente' });
    },
    onError: (error) => {
      toast({ title: 'Error al crear proyecto', description: error.message, variant: 'destructive' });
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) return;
      const { error } = await supabase
        .from('projects')
        .update({
          cliente_nombre: editData.cliente_nombre,
          telefono_contacto: editData.telefono_contacto,
          nombre_proyecto: editData.nombre_proyecto,
          descripcion: editData.descripcion || null
        })
        .eq('id', selectedProject.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Proyecto actualizado' });
    },
    onError: (error) => {
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
    }
  });

  // Add log mutation
  const addLogMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject || !newLogEntry.trim()) return;
      const userName = userProfile?.full_name || userProfile?.email || 'Usuario';
      const { error } = await supabase
        .from('project_logs')
        .insert({
          project_id: selectedProject.id,
          content: newLogEntry.trim(),
          created_by_id: user!.id,
          created_by_name: userName
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-logs', selectedProject?.id] });
      setNewLogEntry('');
      toast({ title: 'Entrada de bitácora guardada' });
    },
    onError: (error) => {
      toast({ title: 'Error al guardar entrada', description: error.message, variant: 'destructive' });
    }
  });

  // Complete project mutation
  const completeProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const { error } = await supabase
        .from('projects')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          remision_numero: completionData.remision,
          monto_total: parseFloat(completionData.monto)
        })
        .eq('id', project.id);
      if (error) throw error;
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCompletingProject(false);
      setShowCelebration({
        projectNumber: project.project_number,
        userName: project.assigned_user_name,
        monto: parseFloat(completionData.monto),
        fecha: format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
      });
      setCompletionData({ remision: '', monto: '' });
      setSelectedProject(null);
    },
    onError: (error) => {
      toast({ title: 'Error al completar proyecto', description: error.message, variant: 'destructive' });
    }
  });

  // Set edit data when project is selected
  useEffect(() => {
    if (selectedProject) {
      setEditData({
        cliente_nombre: selectedProject.cliente_nombre,
        telefono_contacto: selectedProject.telefono_contacto,
        nombre_proyecto: selectedProject.nombre_proyecto,
        descripcion: selectedProject.descripcion || ''
      });
    }
  }, [selectedProject]);

  const activeProjects = projects?.filter(p => !p.is_completed) || [];
  const completedProjects = projects?.filter(p => p.is_completed) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Proyectos</h2>
        <Button onClick={() => setIsNewProjectOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Active Projects */}
      {activeProjects.length === 0 && completedProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay proyectos. Crea uno nuevo para comenzar.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProject(project)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{project.nombre_proyecto}</CardTitle>
                  <CardDescription className="text-xs">
                    Proyecto #{project.project_number}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{project.cliente_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{project.telefono_contacto}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(project.fecha), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Asignado a: {project.assigned_user_name}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setIsCompletingProject(true);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Proyecto Completado
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-muted-foreground mb-4">Proyectos Completados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedProjects.map((project) => (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer bg-muted/50 opacity-75 hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        {project.nombre_proyecto}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Proyecto #{project.project_number}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{project.cliente_nombre}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Remisión: {project.remision_numero}
                      </div>
                      <div className="text-sm font-medium text-primary">
                        Monto: ${project.monto_total?.toLocaleString('es-MX')}
                      </div>
                      {project.completed_at && (
                        <div className="text-xs text-muted-foreground">
                          Completado: {format(new Date(project.completed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto</DialogTitle>
            <DialogDescription>Crea un nuevo proyecto de ventas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newProjectDate, 'PPP', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newProjectDate}
                    onSelect={(date) => date && setNewProjectDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Nombre del Cliente</Label>
              <Input 
                value={newProject.cliente_nombre}
                onChange={(e) => setNewProject(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de Contacto</Label>
              <Input 
                value={newProject.telefono_contacto}
                onChange={(e) => setNewProject(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="9611234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre del Proyecto</Label>
              <Input 
                value={newProject.nombre_proyecto}
                onChange={(e) => setNewProject(prev => ({ ...prev, nombre_proyecto: e.target.value }))}
                placeholder="Ej: Instalación de red"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción del Proyecto</Label>
              <Textarea 
                value={newProject.descripcion}
                onChange={(e) => setNewProject(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción detallada..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => createProjectMutation.mutate()}
              disabled={!newProject.cliente_nombre || !newProject.telefono_contacto || !newProject.nombre_proyecto || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Detail/Edit Dialog */}
      <Dialog open={!!selectedProject && !isCompletingProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProject?.nombre_proyecto}
              {selectedProject?.is_completed && <Check className="h-5 w-5 text-green-500" />}
            </DialogTitle>
            <DialogDescription>Proyecto #{selectedProject?.project_number}</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Editable Fields (disabled if completed) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Cliente</Label>
                <Input 
                  value={editData.cliente_nombre}
                  onChange={(e) => setEditData(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                  disabled={selectedProject?.is_completed}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono de Contacto</Label>
                <Input 
                  value={editData.telefono_contacto}
                  onChange={(e) => setEditData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                  disabled={selectedProject?.is_completed}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Nombre del Proyecto</Label>
                <Input 
                  value={editData.nombre_proyecto}
                  onChange={(e) => setEditData(prev => ({ ...prev, nombre_proyecto: e.target.value }))}
                  disabled={selectedProject?.is_completed}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descripción</Label>
                <Textarea 
                  value={editData.descripcion}
                  onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                  disabled={selectedProject?.is_completed}
                  rows={2}
                />
              </div>
            </div>

            {!selectedProject?.is_completed && (
              <Button 
                onClick={() => updateProjectMutation.mutate()}
                disabled={updateProjectMutation.isPending}
                className="w-full"
              >
                {updateProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            )}

            {/* Non-editable info */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
              <p><span className="font-medium">Fecha:</span> {selectedProject && format(new Date(selectedProject.fecha), 'PPP', { locale: es })}</p>
              <p><span className="font-medium">Usuario Asignado:</span> {selectedProject?.assigned_user_name}</p>
              <p><span className="font-medium">Creado:</span> {selectedProject && format(new Date(selectedProject.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              <p><span className="font-medium">Última actualización:</span> {selectedProject && format(new Date(selectedProject.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              {selectedProject?.is_completed && (
                <>
                  <p><span className="font-medium">Remisión:</span> {selectedProject.remision_numero}</p>
                  <p><span className="font-medium">Monto Total:</span> ${selectedProject.monto_total?.toLocaleString('es-MX')}</p>
                  <p><span className="font-medium">Completado:</span> {format(new Date(selectedProject.completed_at!), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                </>
              )}
            </div>

            {/* Bitácora / Logs */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bitácora del Proyecto
              </h4>
              
              {!selectedProject?.is_completed && (
                <div className="space-y-2">
                  <Textarea 
                    value={newLogEntry}
                    onChange={(e) => setNewLogEntry(e.target.value)}
                    placeholder="Escribe una nueva entrada de bitácora..."
                    rows={3}
                  />
                  <Button 
                    onClick={() => addLogMutation.mutate()}
                    disabled={!newLogEntry.trim() || addLogMutation.isPending}
                    size="sm"
                  >
                    {addLogMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Guardar Entrada
                  </Button>
                </div>
              )}

              <ScrollArea className="h-48 border rounded-lg p-4">
                {projectLogs && projectLogs.length > 0 ? (
                  <div className="space-y-4">
                    {projectLogs.map((log) => (
                      <div key={log.id} className="border-b pb-3 last:border-0">
                        <div className="text-xs text-muted-foreground mb-1">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })} - {log.created_by_name}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{log.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No hay entradas en la bitácora
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Project Dialog */}
      <Dialog open={isCompletingProject} onOpenChange={(open) => { setIsCompletingProject(open); if (!open) setSelectedProject(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Proyecto</DialogTitle>
            <DialogDescription>
              Proyecto #{selectedProject?.project_number} - {selectedProject?.nombre_proyecto}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número de Remisión</Label>
              <Input 
                value={completionData.remision}
                onChange={(e) => setCompletionData(prev => ({ ...prev, remision: e.target.value }))}
                placeholder="Ej: REM-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Monto Total</Label>
              <Input 
                type="number"
                value={completionData.monto}
                onChange={(e) => setCompletionData(prev => ({ ...prev, monto: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCompletingProject(false); setSelectedProject(null); }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedProject && completeProjectMutation.mutate(selectedProject)}
              disabled={!completionData.remision || !completionData.monto || completeProjectMutation.isPending}
            >
              {completeProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Completar Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={!!showCelebration} onOpenChange={() => setShowCelebration(null)}>
        <DialogContent className="text-center">
          <div className="py-8 space-y-4">
            <PartyPopper className="h-16 w-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold text-primary">¡Proyecto Completado!</h2>
            <p className="text-lg">
              El proyecto <strong>#{showCelebration?.projectNumber}</strong> de{' '}
              <strong>{showCelebration?.userName}</strong> ha sido completado por{' '}
              <strong>${showCelebration?.monto.toLocaleString('es-MX')}</strong> hoy{' '}
              <strong>{showCelebration?.fecha}</strong>.
            </p>
          </div>
          <DialogFooter className="justify-center">
            <Button onClick={() => setShowCelebration(null)}>¡Excelente!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProjects;
