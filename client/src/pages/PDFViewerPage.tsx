import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import PDFViewerDialog from './PDFViewerDialog';

const PDFViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pdf, setPdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const res = await api.get(`/pdfs/${id}`);
        console.log(res.data);
        setPdf(res.data.pdf);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };
    fetchPdf();
  }, [id]);

  if (loading) return <p>Loading PDF...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold">{pdf.title}</h1>
      <p className="text-gray-600">{pdf.description}</p>
      <p className="text-sm text-gray-400">
        Uploaded by {pdf.user.name} • {new Date(pdf.createdAt).toLocaleDateString()}
      </p>

      {/* Annotation List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Annotations</h2>
        {pdf.annotations.length === 0 ? (
          <p className="text-gray-500">No annotations yet</p>
        ) : (
          <ul className="space-y-2">
            {pdf.annotations.map((a: any) => (
              <li key={a._id} className="p-3 border rounded bg-gray-50">
                <p className="text-sm text-gray-800">{a.content}</p>
                <p className="text-xs text-gray-400">By {a.user?.name || 'Unknown'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-gray-600">{pdf.description}</p>
      <button
        onClick={() => setViewerOpen(true)}
        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Open PDF
      </button>

      <PDFViewerDialog
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        filePath={pdf.filePath}  // pass the relative path from backend
      />
    </div>
  );
};

export default PDFViewerPage;
