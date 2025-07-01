import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface RealMetrics {
  linkedin: {
    totalSent: number;
    accepted: number;
    pending: number;
    declined: number;
    acceptanceRate: number;
    companies: string[];
    recentActivity: any[];
  };
  email: {
    totalSent: number;
    opened: number;
    replied: number;
    openRate: number;
    replyRate: number;
    campaigns: string[];
    recentActivity: any[];
  };
  webinar: {
    totalInvited: number;
    confirmed: number;
    pending: number;
    declined: number;
    rsvpRate: number;
    industries: string[];
    recentActivity: any[];
  };
  datasets: any[];
}

export const useRealData = () => {
  const [metrics, setMetrics] = useState<RealMetrics>({
    linkedin: {
      totalSent: 0,
      accepted: 0,
      pending: 0,
      declined: 0,
      acceptanceRate: 0,
      companies: [],
      recentActivity: [],
    },
    email: {
      totalSent: 0,
      opened: 0,
      replied: 0,
      openRate: 0,
      replyRate: 0,
      campaigns: [],
      recentActivity: [],
    },
    webinar: {
      totalInvited: 0,
      confirmed: 0,
      pending: 0,
      declined: 0,
      rsvpRate: 0,
      industries: [],
      recentActivity: [],
    },
    datasets: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchRealData = async () => {
    try {
      setLoading(true);

      // Fetch LinkedIn data
      const { data: linkedinData } = await supabase
        .from('linkedin_contacts')
        .select('*');

      // Fetch Email data
      const { data: emailData } = await supabase
        .from('email_contacts')
        .select('*');

      // Fetch Webinar data
      const { data: webinarData } = await supabase
        .from('webinar_attendees')
        .select('*');

      // Fetch Datasets
      const { data: datasetsData } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate LinkedIn metrics
      const linkedinMetrics = {
        totalSent: linkedinData?.length || 0,
        accepted: linkedinData?.filter(c => c.status === 'accepted').length || 0,
        pending: linkedinData?.filter(c => c.status === 'pending').length || 0,
        declined: linkedinData?.filter(c => c.status === 'declined').length || 0,
        acceptanceRate: linkedinData?.length 
          ? ((linkedinData.filter(c => c.status === 'accepted').length / linkedinData.length) * 100)
          : 0,
        companies: [...new Set(linkedinData?.map(c => c.company) || [])],
        recentActivity: linkedinData?.slice(0, 5) || [],
      };

      // Calculate Email metrics
      const emailMetrics = {
        totalSent: emailData?.length || 0,
        opened: emailData?.filter(c => c.opened).length || 0,
        replied: emailData?.filter(c => c.replied).length || 0,
        openRate: emailData?.length 
          ? ((emailData.filter(c => c.opened).length / emailData.length) * 100)
          : 0,
        replyRate: emailData?.length 
          ? ((emailData.filter(c => c.replied).length / emailData.length) * 100)
          : 0,
        campaigns: [...new Set(emailData?.map(c => c.campaign_name) || [])],
        recentActivity: emailData?.slice(0, 5) || [],
      };

      // Calculate Webinar metrics
      const webinarMetrics = {
        totalInvited: webinarData?.length || 0,
        confirmed: webinarData?.filter(w => w.rsvp_status === 'confirmed').length || 0,
        pending: webinarData?.filter(w => w.rsvp_status === 'pending').length || 0,
        declined: webinarData?.filter(w => w.rsvp_status === 'declined').length || 0,
        rsvpRate: webinarData?.length 
          ? ((webinarData.filter(w => w.rsvp_status === 'confirmed').length / webinarData.length) * 100)
          : 0,
        industries: [...new Set(webinarData?.map(w => w.industry) || [])],
        recentActivity: webinarData?.slice(0, 5) || [],
      };

      setMetrics({
        linkedin: linkedinMetrics,
        email: emailMetrics,
        webinar: webinarMetrics,
        datasets: datasetsData || [],
      });

    } catch (error) {
      console.error('Error fetching real data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  return { metrics, loading, refetch: fetchRealData };
};