# PDF Reports Directory

This directory is where you should place your actual PDF report files.

## Adding PDF Reports

1. Place your PDF files in this directory
2. Update the `sampleReports` array in `app/components/ReportComparison.js`
3. Set the `pdfUrl` field to the path of your PDF file

### Example:
```javascript
{
  id: 1,
  name: 'Report_v1.0.pdf',
  type: 'PDF',
  size: '2.4 MB',
  lastModified: '2025-06-30',
  pdfUrl: '/reports/Report_v1.0.pdf', // Path to your actual PDF
  content: `...` // Fallback text content for display without PDF
}
```

## Supported Formats
- **PDF files only** (.pdf)
- This tool is specifically designed for PDF report comparison and analysis

## File Organization
- Keep filenames descriptive and version-controlled
- Use consistent naming conventions (e.g., Report_v1.0.pdf, Monthly_Report_June.pdf)
- Ensure files are web-accessible with reasonable file sizes (recommended < 10MB per file)
- Organize by date, version, or report type as needed
