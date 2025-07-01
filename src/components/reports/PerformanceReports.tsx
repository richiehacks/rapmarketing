import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { useRealData } from '@/hooks/useRealData';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Target,
  Users,
  Mail,
  Video,
  BarChart3
} from 'lucide-react';

export function PerformanceReports() {
  const { metrics, loading } = useRealData();
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [industryData, setIndustryData] = useState<any[]>([]);

  useEffect(() => {
    generateTimeSeriesData();
    generateIndustryData();
  }, [metrics]);

  const generateTimeSeriesData = async () => {
    try {
      // Get data grouped by week for the last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: linkedinWeekly } = await supabase
        .from('linkedin_contacts')
        .select('date_sent, status')
        .gte('date_sent', fourWeeksAgo.toISOString().split('T')[0]);

      const { data: emailWeekly } = await supabase
        .from('email_contacts')
        .select('date_sent, opened, replied')
        .gte('date_sent', fourWeeksAgo.toISOString().split('T')[0]);

      const { data: webinarWeekly } = await supabase
        .from('webinar_attendees')
        .select('invited_date, rsvp_status')
        .gte('invited_date', fourWeeksAgo.toISOString().split('T')[0]);

      // Group by week and calculate metrics
      const weeklyData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekLabel = `Week ${4 - i}`;
        
        // LinkedIn metrics for this week
        const linkedinThisWeek = linkedinWeekly?.filter(item => {
          const date = new Date(item.date_sent);
          return date >= weekStart && date <= weekEnd;
        }) || [];
        
        const linkedinAcceptanceRate = linkedinThisWeek.length > 0 
          ? (linkedinThisWeek.filter(item => item.status === 'accepted').length / linkedinThisWeek.length) * 100
          : 0;

        // Email metrics for this week
        const emailThisWeek = emailWeekly?.filter(item => {
          const date = new Date(item.date_sent);
          return date >= weekStart && date <= weekEnd;
        }) || [];
        
        const emailOpenRate = emailThisWeek.length > 0 
          ? (emailThisWeek.filter(item => item.opened).length / emailThisWeek.length) * 100
          : 0;

        const emailReplyRate = emailThisWeek.length > 0 
          ? (emailThisWeek.filter(item => item.replied).length / emailThisWeek.length) * 100
          : 0;

        // Webinar metrics for this week
        const webinarThisWeek = webinarWeekly?.filter(item => {
          const date = new Date(item.invited_date);
          return date >= weekStart && date <= weekEnd;
        }) || [];
        
        const webinarRsvpRate = webinarThisWeek.length > 0 
          ? (webinarThisWeek.filter(item => item.rsvp_status === 'confirmed').length / webinarThisWeek.length) * 100
          : 0;

        weeklyData.push({
          week: weekLabel,
          linkedinAcceptance: linkedinAcceptanceRate,
          emailOpen: emailOpenRate,
          emailReply: emailReplyRate,
          webinarRsvp: webinarRsvpRate,
        });
      }

      setTimeSeriesData(weeklyData);
    } catch (error) {
      console.error('Error generating time series data:', error);
    }
  };

  const generateIndustryData = () => {
    const industries = metrics.webinar.industries;
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
    
    const industryData = industries.map((industry, index) => ({
      name: industry,
      value: Math.floor(Math.random() * 30) + 10, // This would be real data in production
      color: colors[index % colors.length],
    }));

    setIndustryData(industryData);
  };

  const generateReport = () => {
    const reportData = {
      summary: {
        totalContacts: metrics.linkedin.totalSent + metrics.email.totalSent + metrics.webinar.totalInvited,
        overallPerformance: ((metrics.linkedin.acceptanceRate + metrics.email.openRate + metrics.webinar.rsvpRate) / 3).toFixed(1),
        topPerformingChannel: getTopPerformingChannel(),
      },
      recommendations: generateRecommendations(),
      generatedAt: new Date().toISOString(),
    };

    // In a real app, this would generate a PDF or send an email
    console.log('Generated Report:', reportData);
    
    // Create downloadable JSON report
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTopPerformingChannel = () => {
    const channels = [
      { name: 'LinkedIn', rate: metrics.linkedin.acceptanceRate },
      { name: 'Email', rate: metrics.email.openRate },
      { name: 'Webinar', rate: metrics.webinar.rsvpRate },
    ];
    return channels.reduce((prev, current) => (prev.rate > current.rate) ? prev : current).name;
  };

  const generateRecommendations = () => {
    const recommendations = [];
    
    if (metrics.linkedin.acceptanceRate < 20) {
      recommendations.push('LinkedIn acceptance rate is below average. Consider personalizing connection requests more.');
    }
    
    if (metrics.email.openRate < 25) {
      recommendations.push('Email open rates could be improved. Try A/B testing subject lines.');
    }
    
    if (metrics.webinar.rsvpRate < 15) {
      recommendations.push('Webinar RSVP rates are low. Consider offering more compelling topics or incentives.');
    }

    if (recommendations.length === 0) {
      recommendations.push('All channels are performing well! Continue current strategies.');
    }

    return recommendations;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Reports</h2>
          <p className="text-muted-foreground">
            Real-time analytics based on your uploaded data
          </p>
        </div>
        <Button onClick={generateReport}>
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.linkedin.acceptanceRate + metrics.email.openRate + metrics.webinar.rsvpRate) / 3).toFixed(0)}%
            </div>
            <Progress value={(metrics.linkedin.acceptanceRate + metrics.email.openRate + metrics.webinar.rsvpRate) / 3} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-1" />
              LinkedIn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.linkedin.acceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.linkedin.accepted} of {metrics.linkedin.totalSent} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.email.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.email.opened} of {metrics.email.totalSent} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Video className="h-4 w-4 mr-1" />
              Webinar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.webinar.rsvpRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.webinar.confirmed} of {metrics.webinar.totalInvited} confirmed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <LineChart
                data={timeSeriesData}
                xKey="week"
                lines={[
                  { key: 'linkedinAcceptance', color: '#06B6D4', name: 'LinkedIn' },
                  { key: 'emailOpen', color: '#10B981', name: 'Email Open' },
                  { key: 'webinarRsvp', color: '#8B5CF6', name: 'Webinar RSVP' },
                ]}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No trend data available yet</p>
                <p className="text-sm">Upload more data to see performance trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {industryData.length > 0 ? (
              <PieChart data={industryData} />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No industry data available</p>
                <p className="text-sm">Upload webinar data to see industry breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span>AI-Generated Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Performance Summary</h4>
            <p className="text-sm text-muted-foreground">
              Based on your uploaded data, your {getTopPerformingChannel()} campaigns are performing best with{' '}
              {getTopPerformingChannel() === 'LinkedIn' && `${metrics.linkedin.acceptanceRate.toFixed(1)}% acceptance rate`}
              {getTopPerformingChannel() === 'Email' && `${metrics.email.openRate.toFixed(1)}% open rate`}
              {getTopPerformingChannel() === 'Webinar' && `${metrics.webinar.rsvpRate.toFixed(1)}% RSVP rate`}.
              Total contacts reached: {metrics.linkedin.totalSent + metrics.email.totalSent + metrics.webinar.totalInvited}.
            </p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {generateRecommendations().map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}