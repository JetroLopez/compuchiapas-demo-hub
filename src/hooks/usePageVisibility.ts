import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PageVisibility {
  id: string;
  is_visible: boolean;
}

export const usePageVisibility = () => {
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['page-visibility'],
    queryFn: async (): Promise<PageVisibility[]> => {
      const { data, error } = await supabase
        .from('page_visibility')
        .select('id, is_visible');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const isPageVisible = (pageId: string): boolean => {
    const page = pages.find(p => p.id === pageId);
    return page?.is_visible ?? true;
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ pageId, isVisible }: { pageId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('page_visibility')
        .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
        .eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-visibility'] });
    },
  });

  return { pages, isLoading, isPageVisible, toggleMutation };
};
