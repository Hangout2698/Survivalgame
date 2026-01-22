import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DocumentUploadProps {
  onUploadSuccess: (url: string) => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setStatus('error');
      setMessage('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setStatus('idle');
    setMessage('');

    try {
      const fileExt = 'pdf';
      const fileName = `survival-guide-${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('game-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('game-documents')
        .getPublicUrl(filePath);

      setStatus('success');
      setMessage('Survival guide uploaded successfully!');
      onUploadSuccess(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Upload Survival Guide</h3>
      </div>

      <p className="text-slate-300 mb-4">
        Upload your survival guide PDF. The game will use this document to generate briefings and scenarios.
      </p>

      <div className="space-y-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-slate-400" />
            <p className="mb-2 text-sm text-slate-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PDF only</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>

        {uploading && (
          <div className="flex items-center gap-2 text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm">Uploading...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
