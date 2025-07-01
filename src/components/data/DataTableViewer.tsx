import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Download, FileText, Loader2 } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  type: string;
  row_count: number;
}

interface DataTableViewerProps {
  dataset: Dataset;
  onClose: () => void;
}

export function DataTableViewer({ dataset, onClose }: DataTableViewerProps) {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchData();
  }, [dataset, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let query;
      
      // Determine which table to query based on dataset type
      switch (dataset.type) {
        case 'linkedin':
          query = supabase
            .from('linkedin_contacts')
            .select('*', { count: 'exact' })
            .eq('dataset_id', dataset.id);
          break;
        case 'email':
          query = supabase
            .from('email_contacts')
            .select('*', { count: 'exact' })
            .eq('dataset_id', dataset.id);
          break;
        case 'webinar':
          query = supabase
            .from('webinar_attendees')
            .select('*', { count: 'exact' })
            .eq('dataset_id', dataset.id);
          break;
        default:
          toast.error('Unsupported dataset type');
          return;
      }

      // Add pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: tableData, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(tableData || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // Set headers from the first row
      if (tableData && tableData.length > 0) {
        const excludeColumns = ['id', 'dataset_id', 'created_at'];
        const dataHeaders = Object.keys(tableData[0]).filter(
          key => !excludeColumns.includes(key)
        );
        setHeaders(dataHeaders);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Fetch all data for export
      let query;
      
      switch (dataset.type) {
        case 'linkedin':
          query = supabase
            .from('linkedin_contacts')
            .select('*')
            .eq('dataset_id', dataset.id);
          break;
        case 'email':
          query = supabase
            .from('email_contacts')
            .select('*')
            .eq('dataset_id', dataset.id);
          break;
        case 'webinar':
          query = supabase
            .from('webinar_attendees')
            .select('*')
            .eq('dataset_id', dataset.id);
          break;
        default:
          return;
      }

      const { data: allData, error } = await query;
      
      if (error) throw error;

      // Convert to CSV
      if (allData && allData.length > 0) {
        const excludeColumns = ['id', 'dataset_id', 'created_at'];
        const csvHeaders = Object.keys(allData[0]).filter(
          key => !excludeColumns.includes(key)
        );
        
        const csvContent = [
          csvHeaders.join(','),
          ...allData.map(row => 
            csvHeaders.map(header => {
              const value = row[header];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            }).join(',')
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataset.name.replace(/\.[^/.]+$/, '')}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value.toString();
  };

  const formatHeaderName = (header: string) => {
    return header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">{dataset.name}</h3>
            <p className="text-sm text-muted-foreground">
              {dataset.row_count.toLocaleString()} total records
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {dataset.type}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {data.length === 0 ? (
        <div className="text-center text-muted-foreground p-8">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available</p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[400px] w-full border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {formatHeaderName(header)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={header} className="whitespace-nowrap">
                        {formatCellValue(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}