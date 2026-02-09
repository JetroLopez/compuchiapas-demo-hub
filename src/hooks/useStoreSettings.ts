import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreSettings = () => {
  const [showPrices, setShowPrices] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchSettings = async () => {
      const { data, error } = await (supabase
        .from('store_settings' as any)
        .select('show_public_prices')
        .eq('id', 'main')
        .single() as any);

      if (!error && data) {
        setShowPrices(data.show_public_prices);
      }
      setIsLoading(false);
    };

    fetchSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('store-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_settings',
          filter: 'id=eq.main',
        },
        (payload) => {
          const newData = payload.new as { show_public_prices: boolean };
          setShowPrices(newData.show_public_prices);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { showPrices, isLoading };
};
