import React, { useState } from 'react';
import './OcrExtractor.css'; // We'll create this CSS file next

// Define a simulated API URL (replace with your actual backend endpoint)
const OCR_API_ENDPOINT = '/api/extract-text';

function OcrExtractor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Handle File Selection ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simple validation for file types
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
        setExtractedText(''); // Clear previous results
        setError(null);
      } else {
        setError('Unsupported file type. Please select an image (jpg, png) or a PDF.');
        setSelectedFile(null);
      }
    }
  };

  // --- 2. Handle Text Extraction (API Call) ---
  const handleExtractText = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedText('');

    // In a real application, you would create a FormData object to send the file
    // const formData = new FormData();
    // formData.append('file', selectedFile);

    try {
      // --- START: API Call Simulation ---
      // Replace this block with your actual `fetch` or `axios` call to your backend
      console.log(`Simulating POST request to: ${OCR_API_ENDPOINT}`);
      console.log(`File to be sent: ${selectedFile.name} (${selectedFile.type})`);
      
      // Simulate network delay and backend processing
      await new Promise(resolve => setTimeout(resolve, 2500)); 

      // Simulate a successful response from the backend
      const mockResponse = {
        success: true,
        text: "This is the **accurately extracted text** from the image or PDF.\n\n" + 
              "A robust backend service (like Tesseract, AWS Textract, or Google Vision) " +
              "would perform the heavy-lifting here to ensure high accuracy.",
      };

      if (mockResponse.success) {
        setExtractedText(mockResponse.text);
      } else {
        throw new Error('Text extraction failed on the server.');
      }
      // --- END: API Call Simulation ---

    } catch (err) {
      console.error('Extraction Error:', err);
      setError(`Extraction failed: ${err.message}. Check the console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ocr-container">
      <header className="ocr-header">
        <h1>📸 Accurate Text Extractor</h1>
        <p>Upload an image (JPG/PNG) or PDF file to accurately extract text.</p>
      </header>

      <section className="upload-section">
        <div className="input-group">
          {/* Hidden file input, triggered by the styled button */}
          <input
            type="file"
            id="file-upload"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="upload-button">
            {selectedFile ? `✅ ${selectedFile.name}` : 'Select File (Image or PDF)'}
          </label>
          
          <button 
            onClick={handleExtractText}
            disabled={!selectedFile || isLoading}
            className={`extract-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Extracting...' : 'Extract Text'}
          </button>
        </div>

        {error && <p className="error-message">⚠️ {error}</p>}
      </section>
      
      {/* Display Section */}
      <section className="results-section">
        <h2>Extracted Text</h2>
        <div className="text-output-box">
          {isLoading && <p>Please wait while the text is being processed...</p>}
          {extractedText ? (
            // Use <pre> to maintain formatting (like newlines)
            <pre className="extracted-text-pre">{extractedText}</pre>
          ) : (
            !isLoading && !error && <p className="placeholder">Results will appear here...</p>
          )}
        </div>
      </section>

      <footer className="ocr-footer">
        <p>A Modern React Application for OCR. Requires a separate, robust backend service for accuracy.</p>
      </footer>
    </div>
  );
}

export default OcrExtractor;
