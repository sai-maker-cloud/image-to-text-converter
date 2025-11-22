import React, { useState } from 'react';
import './OcrExtractor.css'; 

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
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
        setExtractedText(''); 
        setError(null);
      } else {
        setError('Unsupported file type. Please select an image (jpg, png) or a PDF.');
        setSelectedFile(null);
      }
    }
  };

  // --- 2. Handle Text Extraction (API Call Simulation) ---
  const handleExtractText = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedText('');

    try {
      // Simulate network delay and backend processing
      console.log(`Simulating POST request to: ${OCR_API_ENDPOINT}`);
      await new Promise(resolve => setTimeout(resolve, 2500)); 

      // Simulate a successful response with extracted text
      const mockResponse = {
        success: true,
        text: `Extracted text from: ${selectedFile.name}\n\n--- OCR Results ---\n` + 
              "The high-accuracy text extraction relies on the backend service. " +
              "This text is now ready to be displayed and downloaded as a .txt file using the new button!",
      };

      if (mockResponse.success) {
        setExtractedText(mockResponse.text);
      } else {
        throw new Error('Text extraction failed on the server.');
      }
    } catch (err) {
      console.error('Extraction Error:', err);
      setError(`Extraction failed: ${err.message}. Check the console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Handle File Download Feature ---
  const handleDownload = () => {
    if (!extractedText) {
      setError('No text to download. Please extract text first.');
      return;
    }
    
    // 1. Create a Blob (Binary Large Object) containing the text content
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    
    // 2. Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // 3. Create a temporary <a> element and set its properties
    const link = document.createElement('a');
    link.href = url;
    
    // Set the download filename
    const filename = selectedFile ? `${selectedFile.name.split('.')[0]}_extracted.txt` : 'extracted_text.txt';
    link.setAttribute('download', filename);
    
    // 4. Trigger the download and clean up
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Release the temporary URL resource
  };

  return (
    <div className="ocr-container">
      <header className="ocr-header">
        <h1>📸 Accurate Text Extractor</h1>
        <p>Upload an image (JPG/PNG) or PDF file to accurately extract text.</p>
      </header>

      <section className="upload-section">
        <div className="input-group">
          {/* File input (hidden) */}
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
        <div className="results-header-bar">
            <h2>Extracted Text</h2>
            {/* The Download Button */}
            <button 
                onClick={handleDownload}
                disabled={!extractedText}
                className="download-button"
            >
                ⬇️ Download .txt
            </button>
        </div>
        
        <div className="text-output-box">
          {isLoading && <p>Please wait while the text is being processed...</p>}
          {extractedText ? (
            <pre className="extracted-text-pre">{extractedText}</pre>
          ) : (
            !isLoading && !error && <p className="placeholder">Results will appear here...</p>
          )}
        </div>
      </section>

      <footer className="ocr-footer">
        <p>A Modern React Application for OCR.</p>
      </footer>
    </div>
  );
}

export default OcrExtractor;
