import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, Image as ImageIcon } from 'lucide-react';

export default function Files() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [id]);

  const fetchFiles = async () => {
    const res = await fetch(`/api/projects/${id}/files`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setFiles(await res.json());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('project_id', id!);
    formData.append('uploader_id', user!.id.toString());
    formData.append('tags', 'general'); // Could add UI to select tags

    try {
      await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      fetchFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Files</h1>
        <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 cursor-pointer">
          <Upload className="w-4 h-4" /> 
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map(file => (
          <a 
            key={file.id} 
            href={file.url} 
            target="_blank" 
            rel="noreferrer"
            className="group block bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-500 transition-colors"
          >
            <div className="aspect-square bg-slate-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition-colors">
              {file.file_type?.startsWith('image') ? (
                <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
              ) : (
                <FileText className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
              )}
            </div>
            <p className="font-medium text-slate-900 truncate text-sm" title={file.filename}>{file.filename}</p>
            <p className="text-xs text-slate-500 mt-1">By {file.uploader_name}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
