import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateDashboardSnapshot = async (elementId: string = 'dashboard-container', fileName: string = 'GEOAI_Survey_Report.pdf'): Promise<void> => {
  const element = document.getElementById(elementId) || document.body;
  if (!element) {
    console.error(`Element not found for snapshot.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#0c0c0c'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // A4 Landscape dimensions: 297 x 210 mm
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.save(fileName);
  } catch (error) {
    console.error("Failed to generate PDF report:", error);
  }
};
