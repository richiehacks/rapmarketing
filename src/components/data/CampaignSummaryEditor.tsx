import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, X, Calendar, Target, Users, DollarSign } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  type: string;
  campaign_summary?: any;
}

interface CampaignSummaryEditorProps {
  dataset: Dataset;
  onSummaryUpdated: () => void;
  onCancel: () => void;
}

interface CampaignSummary {
  title: string;
  description: string;
  objectives: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  budget: string;
  expectedOutcomes: string;
  kpis: string[];
  notes: string;
}

export function CampaignSummaryEditor({ dataset, onSummaryUpdated, onCancel }: CampaignSummaryEditorProps) {
  const [summary, setSummary] = useState<CampaignSummary>({
    title: '',
    description: '',
    objectives: '',
    targetAudience: '',
    startDate: '',
    endDate: '',
    budget: '',
    expectedOutcomes: '',
    kpis: [],
    notes: '',
  });
  const [newKpi, setNewKpi] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dataset.campaign_summary) {
      setSummary({
        title: dataset.campaign_summary.title || '',
        description: dataset.campaign_summary.description || '',
        objectives: dataset.campaign_summary.objectives || '',
        targetAudience: dataset.campaign_summary.targetAudience || '',
        startDate: dataset.campaign_summary.startDate || '',
        endDate: dataset.campaign_summary.endDate || '',
        budget: dataset.campaign_summary.budget || '',
        expectedOutcomes: dataset.campaign_summary.expectedOutcomes || '',
        kpis: dataset.campaign_summary.kpis || [],
        notes: dataset.campaign_summary.notes || '',
      });
    }
  }, [dataset]);

  const handleSave = async () => {
    if (!summary.title || !summary.description) {
      toast.error('Please fill in at least the title and description');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          campaign_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dataset.id);

      if (error) throw error;

      toast.success('Campaign summary saved successfully');
      onSummaryUpdated();
    } catch (error) {
      console.error('Error saving campaign summary:', error);
      toast.error('Failed to save campaign summary');
    } finally {
      setSaving(false);
    }
  };

  const addKpi = () => {
    if (newKpi.trim() && !summary.kpis.includes(newKpi.trim())) {
      setSummary(prev => ({
        ...prev,
        kpis: [...prev.kpis, newKpi.trim()]
      }));
      setNewKpi('');
    }
  };

  const removeKpi = (index: number) => {
    setSummary(prev => ({
      ...prev,
      kpis: prev.kpis.filter((_, i) => i !== index)
    }));
  };

  const getCampaignTypeIcon = () => {
    switch (dataset.type) {
      case 'linkedin':
        return <Users className="h-4 w-4" />;
      case 'email':
        return <Target className="h-4 w-4" />;
      case 'webinar':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getCampaignTypeIcon()}
          <Badge variant="outline" className="capitalize">
            {dataset.type} Campaign
          </Badge>
          <span className="text-sm text-muted-foreground">
            {dataset.name}
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Campaign Title *</Label>
          <Input
            id="title"
            value={summary.title}
            onChange={(e) => setSummary(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Q1 2024 SaaS Outreach Campaign"
          />
        </div>

        <div>
          <Label htmlFor="description">Campaign Description *</Label>
          <Textarea
            id="description"
            value={summary.description}
            onChange={(e) => setSummary(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose, scope, and goals of this campaign..."
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Campaign Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="objectives">Campaign Objectives</Label>
          <Textarea
            id="objectives"
            value={summary.objectives}
            onChange={(e) => setSummary(prev => ({ ...prev, objectives: e.target.value }))}
            placeholder="What specific goals do you want to achieve?"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="expectedOutcomes">Expected Outcomes</Label>
          <Textarea
            id="expectedOutcomes"
            value={summary.expectedOutcomes}
            onChange={(e) => setSummary(prev => ({ ...prev, expectedOutcomes: e.target.value }))}
            placeholder="What results do you expect from this campaign?"
            rows={3}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            value={summary.targetAudience}
            onChange={(e) => setSummary(prev => ({ ...prev, targetAudience: e.target.value }))}
            placeholder="e.g., SaaS CTOs, Marketing Directors in FinTech"
          />
        </div>

        <div>
          <Label htmlFor="budget">Budget</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="budget"
              value={summary.budget}
              onChange={(e) => setSummary(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="5,000"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={summary.startDate}
            onChange={(e) => setSummary(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={summary.endDate}
            onChange={(e) => setSummary(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      <Separator />

      {/* KPIs */}
      <div className="space-y-4">
        <Label>Key Performance Indicators (KPIs)</Label>
        <div className="flex space-x-2">
          <Input
            value={newKpi}
            onChange={(e) => setNewKpi(e.target.value)}
            placeholder="Add a KPI (e.g., 25% acceptance rate)"
            onKeyPress={(e) => e.key === 'Enter' && addKpi()}
          />
          <Button type="button" onClick={addKpi} variant="outline">
            Add
          </Button>
        </div>
        
        {summary.kpis.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.kpis.map((kpi, index) => (
              <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                <span>{kpi}</span>
                <button
                  onClick={() => removeKpi(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={summary.notes}
          onChange={(e) => setSummary(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional information, context, or special considerations..."
          rows={3}
        />
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Summary'}
        </Button>
      </div>
    </div>
  );
}