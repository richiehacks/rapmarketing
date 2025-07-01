import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FileText, Save, Calendar, Target, Users } from 'lucide-react';

interface CampaignSummaryFormProps {
  datasetId: string;
  campaignType: string;
  onSummaryAdded: () => void;
}

interface CampaignSummary {
  title: string;
  description: string;
  objectives: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  budget?: string;
  expectedOutcomes: string;
}

export function CampaignSummaryForm({ datasetId, campaignType, onSummaryAdded }: CampaignSummaryFormProps) {
  const [summary, setSummary] = useState<CampaignSummary>({
    title: '',
    description: '',
    objectives: '',
    targetAudience: '',
    startDate: '',
    endDate: '',
    budget: '',
    expectedOutcomes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!summary.title || !summary.description) {
      toast.error('Please fill in at least the title and description');
      return;
    }

    setSaving(true);
    try {
      // Update the dataset with campaign summary
      const { error } = await supabase
        .from('datasets')
        .update({
          campaign_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', datasetId);

      if (error) throw error;

      toast.success('Campaign summary saved successfully');
      onSummaryAdded();
    } catch (error) {
      console.error('Error saving campaign summary:', error);
      toast.error('Failed to save campaign summary');
    } finally {
      setSaving(false);
    }
  };

  const getCampaignTypeIcon = () => {
    switch (campaignType) {
      case 'linkedin':
        return <Users className="h-5 w-5" />;
      case 'email':
        return <FileText className="h-5 w-5" />;
      case 'webinar':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getCampaignTypeIcon()}
          <span>Campaign Summary - {campaignType.charAt(0).toUpperCase() + campaignType.slice(1)}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add details about this campaign to generate meaningful reports and insights
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              value={summary.title}
              onChange={(e) => setSummary(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Q1 SaaS Outreach Campaign"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              value={summary.budget}
              onChange={(e) => setSummary(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="e.g., $5,000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Campaign Description *</Label>
          <Textarea
            id="description"
            value={summary.description}
            onChange={(e) => setSummary(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose and goals of this campaign..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectives">Campaign Objectives</Label>
          <Textarea
            id="objectives"
            value={summary.objectives}
            onChange={(e) => setSummary(prev => ({ ...prev, objectives: e.target.value }))}
            placeholder="What are the specific goals you want to achieve?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            value={summary.targetAudience}
            onChange={(e) => setSummary(prev => ({ ...prev, targetAudience: e.target.value }))}
            placeholder="e.g., SaaS CTOs, Marketing Directors in FinTech"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={summary.startDate}
              onChange={(e) => setSummary(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={summary.endDate}
              onChange={(e) => setSummary(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedOutcomes">Expected Outcomes</Label>
          <Textarea
            id="expectedOutcomes"
            value={summary.expectedOutcomes}
            onChange={(e) => setSummary(prev => ({ ...prev, expectedOutcomes: e.target.value }))}
            placeholder="What results do you expect from this campaign?"
            rows={2}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="capitalize">
              {campaignType} Campaign
            </Badge>
            <span className="text-sm text-muted-foreground">
              This summary will be used to generate reports and insights
            </span>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Summary'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}