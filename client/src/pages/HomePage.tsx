import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Users, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Annotate PDFs with
              <span className="text-primary-600"> Precision</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload, view, and annotate PDF documents with powerful tools. 
              Collaborate with others and keep your annotations organized.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link
                    to="/upload"
                    className="btn-primary text-lg px-8 py-3"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload PDF
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    My Documents
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-3"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/public"
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Browse Public PDFs
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Annotation Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to annotate, collaborate, and organize your PDF documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                PDF Viewer
              </h3>
              <p className="text-gray-600">
                High-quality PDF rendering with smooth navigation and zoom controls
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Annotations
              </h3>
              <p className="text-gray-600">
                Add text, highlights, shapes, and freehand drawings with precision
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Collaboration
              </h3>
              <p className="text-gray-600">
                Share documents and collaborate with others in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="py-24 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who trust our PDF annotation platform
            </p>
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-50 font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;