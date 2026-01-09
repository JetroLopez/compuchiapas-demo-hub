import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageCircle, Mail, Phone, User, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string | null;
  created_at: string;
}

const AdminContacts: React.FC = () => {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const whatsappNumber = "9622148546";

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Error al cargar los contactos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClick = (contact: ContactSubmission) => {
    let message: string;
    if (contact.subject && contact.subject.trim() !== '') {
      message = `Nos comunicamos de compusistemas con *${contact.name}* con respecto a *${contact.subject}*`;
    } else {
      message = `Nos comunicamos de compusistemas con *${contact.name}*, ¿Cómo podemos ayudarle?`;
    }
    
    const phoneNumber = contact.phone?.replace(/\D/g, '') || whatsappNumber;
    window.open(`https://wa.me/52${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'contacted':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Contactado</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Resuelto</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Solicitudes de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Solicitudes de Contacto
          <Badge variant="outline" className="ml-2">
            {contacts.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay solicitudes de contacto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Asunto
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">Mensaje</TableHead>
                  <TableHead className="min-w-[100px]">Estado</TableHead>
                  <TableHead className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[120px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>
                      <a 
                        href={`mailto:${contact.email}`} 
                        className="text-primary hover:underline"
                      >
                        {contact.email}
                      </a>
                    </TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={contact.subject}>
                      {contact.subject || '-'}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <p className="truncate" title={contact.message}>
                        {contact.message}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(contact.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(contact.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleContactClick(contact)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white gap-2 group relative overflow-hidden"
                        disabled={!contact.phone}
                        title={contact.phone ? 'Enviar mensaje por WhatsApp' : 'Sin número de teléfono'}
                      >
                        <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                        <span className="transition-all group-hover:tracking-wider">Contactar</span>
                        <span className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminContacts;
