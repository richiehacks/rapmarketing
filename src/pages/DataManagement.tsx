import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Database, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Plus,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CampaignSummaryEditor } from '@/components/data/CampaignSummaryEditor';
import { DataTableViewer } from '@/components/data/DataTableViewer';

interface Dataset {
  id: string;
  name: string;
  type: string;
  upload_date: string;
  row_count: number;
  tags: string[];
  campaign_summary?: any;
  created_at: string;
}

export function DataManagement() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showSummaryEditor, setShowSummaryEditor] = useState(false);
  const [showDataViewer, setShowDataViewer] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteDataset = async (dataset: Dataset) => {
    if (!confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', dataset.id);

      if (error) throw error;

      setDatasets(prev => prev.filter(d => d.id !== dataset.id));
      toast.success('Dataset deleted successfully');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
    }
  };

  const handleEditSummary = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowSummaryEditor(true);
  };

  const handleViewData = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowDataViewer(true);
  };

  const handleSummaryUpdated = () => {
    setShowSummaryEditor(false);
    setSelectedDataset(null);
    fetchDatasets();
  };

  const getDatasetStats = () => {
    const totalRows = datasets.reduce((sum, dataset) => sum + dataset.row_count, 0);
    const typeBreakdown = datasets.reduce((acc, dataset) => {
      acc[dataset.type] = (acc[dataset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalRows, typeBreakdown };
  };

  const stats = getDatasetStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            Manage all your uploaded datasets and campaign summaries
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload New Data
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRows.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LinkedIn Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.typeBreakdown.linkedin || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.typeBreakdown.email || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="datasets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="datasets">All Datasets</TabsTrigger>
          <TabsTrigger value="summaries">Campaign Summaries</TabsTrigger>
          <TabsTrigger value="analytics">Data Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Dataset Library</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredDatasets.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No datasets found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDatasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell className="font-medium">{dataset.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {dataset.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{dataset.row_count.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(dataset.upload_date).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dataset.campaign_summary ? (
                            <Badge variant="default">Complete</Badge>
                          ) : (
                            <Badge variant="secondary">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewData(dataset)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSummary(dataset)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDataset(dataset)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summaries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summaries</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage campaign details and objectives for better reporting
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {datasets
                  .filter(dataset => dataset.campaign_summary)
                  .map((dataset) => (
                    <Card key={dataset.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {dataset.type}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSummary(dataset)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <CardTitle className="text-lg">
                          {dataset.campaign_summary?.title || dataset.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {dataset.campaign_summary?.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{dataset.row_count} records</span>
                          <span>{new Date(dataset.upload_date).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {datasets.filter(dataset => dataset.campaign_summary).length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No campaign summaries available</p>
                  <p className="text-sm">Add summaries to your datasets for better insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Data Analytics Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Dataset Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.typeBreakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Recent Activity</h4>
                  <div className="space-y-2">
                    {datasets.slice(0, 5).map((dataset) => (
                      <div key={dataset.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{dataset.name}</span>
                        <span className="text-muted-foreground">
                          {new Date(dataset.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Summary Editor Dialog */}
      <Dialog open={showSummaryEditor} onOpenChange={setShowSummaryEditor}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDataset?.campaign_summary ? 'Edit' : 'Add'} Campaign Summary
            </DialogTitle>
          </DialogHeader>
          {selectedDataset && (
            <CampaignSummaryEditor
              dataset={selectedDataset}
              onSummaryUpdated={handleSummaryUpdated}
              onCancel={() => setShowSummaryEditor(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Data Viewer Dialog */}
      <Dialog open={showDataViewer} onOpenChange={setShowDataViewer}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Dataset: {selectedDataset?.name}</DialogTitle>
          </DialogHeader>
          {selectedDataset && (
            <DataTableViewer
              dataset={selectedDataset}
              onClose={() => setShowDataViewer(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}