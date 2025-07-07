// PDF.js configuration utility
let isConfigured = false;
let pdfJsInstance = null;

export const configurePdfJs = async () => {
  try {
    // Return cached instance if already configured
    if (isConfigured && pdfJsInstance) {
      return pdfJsInstance;
    }
    
    const { pdfjs } = await import('react-pdf');
    
    // Only configure once to prevent multiple initializations
    if (!isConfigured && typeof window !== 'undefined') {
      // Get the actual pdfjs version from the package
      const version = pdfjs.version || '5.3.31';
      
      const workerOptions = [
        '/pdf.worker.min.js', // Local worker file (copied from node_modules)
        `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`,
        'https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs',
        'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
      ];
      
      // Set the first option by default
      pdfjs.GlobalWorkerOptions.workerSrc = workerOptions[0];
      
      // Wait a moment to ensure the worker is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('PDF.js worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);
      console.log('PDF.js version:', version);
      
      isConfigured = true;
      pdfJsInstance = pdfjs;
    }
    
    return pdfJsInstance || pdfjs;
  } catch (error) {
    console.error('Failed to configure PDF.js:', error);
    throw error;
  }
};

// PDF document options - create once to prevent prop changes
const version = '5.3.31';
const PDF_DOCUMENT_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
  // Enable better error handling
  stopAtErrors: false,
  // Disable problematic features for better compatibility
  disableAutoFetch: false,
  disableStream: false,
};

export const getPdfDocumentOptions = () => PDF_DOCUMENT_OPTIONS;
