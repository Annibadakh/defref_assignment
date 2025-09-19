import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import api from '../services/api';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/pdfs/', {
          params: {
            page: 1,
            limit: 5, // get only recent 5 for dashboard
          },
        });
        console.log(res.data);
        setPdfs(res.data.pdfs);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load PDFs');
      } finally {
        setLoading(false);
      }
    };
    fetchPdfs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your PDF documents and annotations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/upload"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="bg-primary-100 rounded-lg p-3 group-hover:bg-primary-200 transition-colors duration-200">
                <Upload className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload PDF</h3>
                <p className="text-gray-600">Add a new document to annotate</p>
              </div>
            </div>
          </Link>

          <Link
            to="/public"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="bg-secondary-100 rounded-lg p-3 group-hover:bg-secondary-200 transition-colors duration-200">
                <FileText className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Browse Public PDFs</h3>
                <p className="text-gray-600">Explore documents shared by others</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Documents</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-600">Loading documents...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : pdfs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-600 mb-6">
                  Upload your first PDF to get started with annotations
                </p>
                <Link to="/upload" className="btn-primary inline-flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload PDF
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pdfs.map((pdf) => (
                  <li key={pdf.id} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{pdf.title}</h3>
                      <p className="text-sm text-gray-600">{pdf.description}</p>
                      <p className="text-xs text-gray-400">
                        {pdf.pageCount} pages • Uploaded {new Date(pdf.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/pdf/${pdf.id}`}
                      className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
