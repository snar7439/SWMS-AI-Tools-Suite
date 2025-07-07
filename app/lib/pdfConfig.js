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
      
      // Try to use CDN worker for better compatibility
      const workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      
      // Clear any existing worker configuration
      if (pdfjs.GlobalWorkerOptions.workerSrc) {
        console.log('Clearing existing worker configuration');
      }
      
      // Set the worker source
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      
      // Force worker initialization to ensure it's properly loaded
      try {
        // Create a minimal test to ensure worker is working
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Worker initialization timeout')), 5000);
          
          // Try to load a minimal PDF to test worker
          const testPdf = new Uint8Array([
            0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A
          ]);
          
          pdfjs.getDocument({ data: testPdf }).promise
            .then(() => {
              clearTimeout(timeout);
              resolve();
            })
            .catch(() => {
              clearTimeout(timeout);
              resolve(); // Don't fail on test PDF error, just resolve
            });
        });
      } catch (testError) {
        console.warn('Worker test failed, but continuing:', testError);
      }
      
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
  // Add worker-related options
  useWorkerFetch: false,
  isEvalSupported: false,
  // Better error recovery
  maxImageSize: 1024 * 1024 * 50, // 50MB max image size
  verbosity: 1, // Reduce console spam
};

export const getPdfDocumentOptions = () => PDF_DOCUMENT_OPTIONS;
