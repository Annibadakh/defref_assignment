import React, { useEffect, useState } from 'react';
import { FileText, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PublicPDFsPage: React.FC = () => {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchPublicPDFs = async (searchQuery = '', pageNum = 1) => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/pdfs/public', {
        params: { search: searchQuery, page: pageNum, limit: 9 },
      });
      setPdfs(data.pdfs);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Error fetching public PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicPDFs(search, page);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchPublicPDFs(search, 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public PDFs</h1>
          <p className="text-gray-600 mt-2">
            Explore documents shared by the community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Available Documents</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : pdfs.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No public documents yet</h3>
                <p className="text-gray-600">
                  Public documents will appear here when users share them with the community
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">{pdf.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{pdf.description || 'No description available'}</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>👤 {pdf.user}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {pdf.accessCount || 0}
                        <Link
                                              to={`/pdf/${pdf.id}`}
                                              className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                            >
                                              View
                                            </Link>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-4 py-2">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPDFsPage;
