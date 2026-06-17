import * as pdfjs from 'pdfjs-dist';

// Initialize the worker using the CDN that matches the version in package.json
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

export interface ExtractedPage {
  pageNum: number;
  text: string;
}

export interface ExtractionResult {
  text: string;
  pageCount: number;
  pages: ExtractedPage[];
}

/**
 * Extracts text content from a PDF file page by page.
 * @param file The PDF File object
 * @returns An ExtractionResult containing the full text and page-by-page breakdown
 */
export async function extractTextFromPDF(file: File): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: ExtractedPage[] = [];
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        // Remove multiple consecutive spaces
        .replace(/\s+/g, ' ')
        .trim();
      
      pages.push({
        pageNum: i,
        text: pageText
      });
      
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    } catch (err) {
      console.error(`Error extracting text from page ${i}:`, err);
      pages.push({
        pageNum: i,
        text: `[Error extracting text from page ${i}]`
      });
      fullText += `--- Page ${i} ---\n[Error extracting text from page ${i}]\n\n`;
    }
  }

  return {
    text: fullText,
    pageCount,
    pages
  };
}
