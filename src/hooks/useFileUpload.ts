import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { parseFile, validateFileData, generateTags, ParsedData } from '@/lib/fileParser';
import { toast } from 'sonner';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  datasetId: string;
  fileName: string;
}

export interface UseFileUploadReturn {
  uploadFiles: (files: File[], campaignType: string) => Promise<UploadResult[] | null>;
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  clearProgress: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const updateProgress = useCallback((fileName: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => 
      prev.map(item => 
        item.fileName === fileName 
          ? { ...item, ...updates }
          : item
      )
    );
  }, []);

  const uploadFiles = useCallback(async (files: File[], campaignType: string): Promise<UploadResult[] | null> => {
    if (files.length === 0) return null;

    setIsUploading(true);
    
    // Initialize progress for all files
    const initialProgress: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    
    setUploadProgress(initialProgress);

    try {
      // Process files in parallel
      const results = await Promise.all(
        files.map(file => processFile(file, campaignType, updateProgress))
      );
      
      const successfulUploads = results.filter(result => result !== null) as UploadResult[];
      
      if (successfulUploads.length > 0) {
        toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
        return successfulUploads;
      } else {
        toast.error('All files failed to upload');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Some files failed to upload');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [updateProgress]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    clearProgress,
  };
};

const processFile = async (
  file: File,
  campaignType: string,
  updateProgress: (fileName: string, updates: Partial<UploadProgress>) => void
): Promise<UploadResult | null> => {
  try {
    // Step 1: Parse file
    updateProgress(file.name, { progress: 20, status: 'processing' });
    
    const parsedData = await parseFile(file);
    
    // Step 2: Validate data
    updateProgress(file.name, { progress: 40 });
    
    const validation = validateFileData(parsedData, campaignType);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      toast.warning(`${file.name}: ${validation.warnings.join(', ')}`);
    }
    
    // Step 3: Upload file to Supabase Storage
    updateProgress(file.name, { progress: 60 });
    
    const filePath = await uploadFileToStorage(file);
    
    // Step 4: Save dataset metadata
    updateProgress(file.name, { progress: 80 });
    
    const tags = generateTags(parsedData, campaignType);
    
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .insert({
        name: file.name,
        type: campaignType,
        row_count: parsedData.totalRows,
        tags,
        file_path: filePath,
        user_id: 'temp-user-id', // Replace with actual user ID when auth is implemented
      })
      .select()
      .single();
    
    if (datasetError) {
      throw new Error(`Failed to save dataset: ${datasetError.message}`);
    }
    
    // Step 5: Save parsed data to appropriate table
    updateProgress(file.name, { progress: 90 });
    
    await saveDataToTable(parsedData, campaignType, dataset.id);
    
    // Step 6: Complete
    updateProgress(file.name, { progress: 100, status: 'completed' });
    
    return {
      datasetId: dataset.id,
      fileName: file.name,
    };
    
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    updateProgress(file.name, { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
};

const uploadFileToStorage = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `uploads/${fileName}`;
  
  const { error } = await supabase.storage
    .from('datasets')
    .upload(filePath, file);
  
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  
  return filePath;
};

const saveDataToTable = async (
  parsedData: ParsedData,
  campaignType: string,
  datasetId: string
) => {
  switch (campaignType) {
    case 'linkedin':
      await saveLinkedInData(parsedData, datasetId);
      break;
    case 'email':
      await saveEmailData(parsedData, datasetId);
      break;
    case 'webinar':
      await saveWebinarData(parsedData, datasetId);
      break;
    default:
      // For other campaign types, we might just store the raw data
      console.log('Saving raw data for campaign type:', campaignType);
      break;
  }
};

const saveLinkedInData = async (parsedData: ParsedData, datasetId: string) => {
  const linkedInContacts = parsedData.rows.map(row => ({
    name: row.name || row.Name || '',
    company: row.company || row.Company || '',
    title: row.title || row.Title || row.position || row.Position || '',
    date_sent: row.date_sent || row.dateSent || row['Date Sent'] || new Date().toISOString().split('T')[0],
    status: (row.status || row.Status || 'pending').toLowerCase() as 'accepted' | 'pending' | 'declined',
    campaign_id: row.campaign_id || row.campaignId || 'default-campaign',
    dataset_id: datasetId,
  }));
  
  const { error } = await supabase
    .from('linkedin_contacts')
    .insert(linkedInContacts);
  
  if (error) {
    throw new Error(`Failed to save LinkedIn data: ${error.message}`);
  }
};

const saveEmailData = async (parsedData: ParsedData, datasetId: string) => {
  const emailContacts = parsedData.rows.map(row => ({
    name: row.name || row.Name || '',
    email: row.email || row.Email || '',
    company: row.company || row.Company || '',
    campaign_name: row.campaign_name || row.campaignName || row['Campaign Name'] || 'Default Campaign',
    date_sent: row.date_sent || row.dateSent || row['Date Sent'] || new Date().toISOString().split('T')[0],
    opened: Boolean(row.opened || row.Opened || false),
    replied: Boolean(row.replied || row.Replied || false),
    dataset_id: datasetId,
  }));
  
  const { error } = await supabase
    .from('email_contacts')
    .insert(emailContacts);
  
  if (error) {
    throw new Error(`Failed to save email data: ${error.message}`);
  }
};

const saveWebinarData = async (parsedData: ParsedData, datasetId: string) => {
  const webinarAttendees = parsedData.rows.map(row => ({
    name: row.name || row.Name || '',
    email: row.email || row.Email || '',
    company: row.company || row.Company || '',
    industry: row.industry || row.Industry || 'Other',
    invited_date: row.invited_date || row.invitedDate || row['Invited Date'] || new Date().toISOString().split('T')[0],
    rsvp_status: (row.rsvp_status || row.rsvpStatus || row['RSVP Status'] || 'pending').toLowerCase() as 'confirmed' | 'pending' | 'declined',
    webinar_id: row.webinar_id || row.webinarId || 'default-webinar',
    dataset_id: datasetId,
  }));
  
  const { error } = await supabase
    .from('webinar_attendees')
    .insert(webinarAttendees);
  
  if (error) {
    throw new Error(`Failed to save webinar data: ${error.message}`);
  }
};