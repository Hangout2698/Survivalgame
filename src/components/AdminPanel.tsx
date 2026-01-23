import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AdminPanel() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string>('');

  useEffect(() => {
    fetchCurrentDocument();
  }, []);

  const fetchCurrentDocument = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('setting_value')
        .eq('setting_key', 'survival_guide_url')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCurrentDocumentUrl(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching current document:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase not configured. Please set environment variables.');
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('game-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('game-documents')
        .getPublicUrl(filePath);

      setMessage('Extracting PDF content...');

      const extractResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!extractResponse.ok) {
        throw new Error('Failed to extract PDF content');
      }

      const extractData = await extractResponse.json();

      if (!extractData.stored) {
        throw new Error('Failed to store extracted content');
      }

      setStatus('success');
      setMessage(`Survival guide uploaded and processed successfully! Extracted ${extractData.text?.length || 0} characters.`);
      setCurrentDocumentUrl(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-8 h-8 text-red-400" />
            <h1 className="text-4xl font-light text-gray-100">Admin Panel</h1>
          </div>
          <p className="text-gray-500">Manage game content and settings</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">Survival Guide Document</h2>
          </div>

          <p className="text-slate-300 mb-6">
            Upload the survival guide PDF that will be used as the knowledge base for generating
            game scenarios, briefings, and decisions. This document is stored securely and is not
            accessible to players.
          </p>

          {currentDocumentUrl && (
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Current Document:</p>
              <p className="text-slate-300 text-sm font-mono break-all">{currentDocumentUrl}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-slate-400" />
                <p className="mb-2 text-base text-slate-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-slate-500">PDF only (Max 50MB)</p>
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
              <div className="flex items-center gap-2 text-blue-400 p-4 bg-blue-900/20 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                <span>{message || 'Uploading PDF...'}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-4 rounded-lg border border-green-800">
                <CheckCircle className="w-5 h-5" />
                <span>{message}</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{message}</span>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>• Upload a comprehensive survival guide PDF</li>
              <li>• The document will be used to generate realistic survival scenarios</li>
              <li>• Only the latest uploaded document will be active</li>
              <li>• Changes take effect immediately for new games</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Return to Game
          </a>
        </div>
      </div>
    </div>
  );
}
