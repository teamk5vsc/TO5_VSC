# /// script
# dependencies = [
#   "pypdf",
#   "cryptography",
# ]
# ///

import os
import sys
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

def extract_pages(pdf_path, start_page, end_page):
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' does not exist.", file=sys.stderr)
        sys.exit(1)
        
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    
    # page numbers are 1-indexed, internally 0-indexed
    start_idx = max(0, start_page - 1)
    end_idx = min(total_pages, end_page)
    
    extracted_text = []
    for i in range(start_idx, end_idx):
        try:
            page_text = reader.pages[i].extract_text()
            if page_text:
                extracted_text.append(f"--- Page {i+1} ---\n{page_text}")
        except Exception as e:
            print(f"Warning: Failed to extract page {i+1}: {e}", file=sys.stderr)
            
    print("\n\n".join(extracted_text))

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python extract_pages.py <pdf_path> <start_page> <end_page>", file=sys.stderr)
        sys.exit(1)
        
    path = sys.argv[1]
    try:
        start = int(sys.argv[2])
        end = int(sys.argv[3])
    except ValueError:
        print("Error: Start page and end page must be integers.", file=sys.stderr)
        sys.exit(1)
        
    extract_pages(path, start, end)
