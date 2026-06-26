import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Admin() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/sources');
      setSources(res.data.sources || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    setUploading(true);
    setError(null);
    try {
      await apiClient.post('/api/admin/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 mins
      });
      alert('PDF ingested successfully!');
      fetchSources();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = ''; // reset file input
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm('Are you sure you want to remove this source?')) return;
    try {
      await apiClient.delete(`/api/admin/sources/${id}`);
      fetchSources();
    } catch (err) {
      alert('Failed to delete source.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-2">Manage knowledge base and PDF sources.</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Upload New PDF</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-accent/10 file:text-accent
              hover:file:bg-accent/20 cursor-pointer"
          />
          {uploading && <span className="text-accent text-sm whitespace-nowrap animate-pulse">Uploading & embedding...</span>}
        </div>
        <p className="text-xs text-slate-500 mt-2">Max file size: 20MB. PDF only. Text will be extracted, chunked, and stored in Pinecone.</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Ingested Sources</h2>
        
        {loading ? (
          <div className="text-slate-400">Loading sources...</div>
        ) : sources.length === 0 ? (
          <div className="text-slate-400">No sources found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">File Name</th>
                  <th className="px-4 py-3">Chunks</th>
                  <th className="px-4 py-3">Vectors</th>
                  <th className="px-4 py-3">Date & Time Added</th>
                  <th className="px-4 py-3 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium text-white">{src.fileName}</td>
                    <td className="px-4 py-3">{src.chunksIngested}</td>
                    <td className="px-4 py-3">{src.vectorCount}</td>
                    <td className="px-4 py-3">{new Date(src.uploadedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
