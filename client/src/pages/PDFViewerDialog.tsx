// src/pages/PDFViewerDialog.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;  // 👈 pass the relative path like "uploads/pdfs/xxx.pdf"
}

export default function PDFViewerDialog({ isOpen, onClose, filePath }: PDFViewerDialogProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    if (filePath) {
      // build full URL (adjust backend host if needed)
      const fullUrl = `http://localhost:5000/${filePath.replace(/\\/g, "/")}`;
      setPdfUrl(fullUrl);
    }
  }, [filePath]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const goToPrevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber((p) => Math.min(p + 1, numPages));

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-xl shadow-xl max-w-5xl w-full h-[90vh] flex flex-col">
          <DialogTitle className="flex justify-between items-center p-3 border-b">
            <span className="text-lg font-semibold">PDF Viewer</span>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>

          <div className="flex-1 overflow-auto flex justify-center bg-gray-100 p-4">
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                  setPageNumber(1);
                }}
                loading={<p>Loading PDF...</p>}
              >
                <Page pageNumber={pageNumber} scale={scale} />
              </Document>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex items-center space-x-2">
              <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
