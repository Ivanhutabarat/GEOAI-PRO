import { jsPDF } from 'jspdf';

export const generateDashboardSnapshot = async (
  elementId: string = 'dashboard-capture-zone', 
  fileName: string = 'GEOAI_Survey_Report.pdf', 
  returnFormat?: 'base64' | 'blob' | 'save',
  contextData?: { logs: any[], data: any }
): Promise<string | Blob | void> => {
  // State Buffering/Pausing Pattern
  (window as any).isExportingPDF = true;
  
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const pdf = new jsPDF('p', 'mm', 'a4'); 
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Formatting configuration
    const margin = 20;
    let cursorY = margin;
    const lineHeight = 6;
    
    // Add Watermark function
    const addWatermark = () => {
      pdf.setTextColor(235, 235, 235); // Very light gray for watermark
      pdf.setFontSize(45);
      pdf.text("GEOAI SECURE SNAPSHOT", pdfWidth / 2, pdfHeight / 2 - 10, { angle: 45, align: "center" });
      pdf.setFontSize(25);
      pdf.text("by Ivan Hutabarat", pdfWidth / 2 + 15, pdfHeight / 2 + 10, { angle: 45, align: "center" });
    };

    // Helper to inject professional metadata and visual branding
    const injectProfessionalMetadata = () => {
      pdf.setProperties({
        title: "GEOAI PRO SCIENTIFIC REPORT",
        subject: "Laporan Analisis Data Geofisika dan Percakapan Agen",
        author: "Ivan Hutabarat",
        keywords: "GEOAI, Geofisika, AI, Report, Sensor",
        creator: "GEOAI Pro V4 System"
      });
      addWatermark();
    };

    // Initialize document with metadata and first page watermark
    injectProfessionalMetadata();
    
    // Paper Title
    pdf.setTextColor(0, 0, 0); 
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("GEOAI PRO SCIENTIFIC REPORT", pdfWidth / 2, 30, { align: "center" });
    
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text("Laporan Analisis Data Geofisika dan Percakapan Agen", pdfWidth / 2, 40, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.text("by Ivan Hutabarat", pdfWidth / 2, 50, { align: "center" });
    
    pdf.setLineWidth(0.5);
    pdf.line(margin, 55, pdfWidth - margin, 55);

    cursorY = 65;
    pdf.setTextColor(0, 0, 0); // Black for readable paper text
    
    const addText = (text: string, size: number = 10, isBold: boolean = false, color: number[] = [0,0,0]) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      
      const splitText = pdf.splitTextToSize(text, pdfWidth - margin * 2);
      
      if (cursorY + (splitText.length * lineHeight) > pdfHeight - margin) {
        pdf.addPage();
        addWatermark();
        cursorY = margin + 10; // Extra margin on new page
      }
      
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(splitText, margin, cursorY);
      cursorY += splitText.length * lineHeight + 2;
    };

    addText("1. EXECUTIVE SUMMARY", 14, true, [0, 80, 160]);
    addText("Dokumen ini berisi rangkuman wawasan geofisika otomatis, data inversi, dan percakapan agen cerdas yang direkam selama sesi GeoAI Pro berjalan.", 11);
    
    cursorY += 5;
    
    addText("2. DATA GEOFISIKA & HASIL SENSOR", 14, true, [0, 80, 160]);
    if (contextData?.data) {
      const dataStr = JSON.stringify(contextData.data, null, 2);
      // Only print first 1500 chars to avoid massive PDF
      const snippet = dataStr.length > 2000 ? dataStr.substring(0, 2000) + "\n\n... [DATA TRUNCATED FOR REPORT] ..." : dataStr;
      addText(snippet, 9, false, [50, 50, 50]);
    } else {
      addText("Tidak ada data sensor mentah yang diberikan dalam snapshot ini.", 11, false, [100, 100, 100]);
    }

    cursorY += 5;

    addText("3. PERCAKAPAN AGEN & LOG SISTEM", 14, true, [0, 80, 160]);
    if (contextData?.logs && contextData.logs.length > 0) {
      contextData.logs.forEach((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString() || "Time";
        addText(`[${time}] ${log.source} (${log.type})`, 10, true, [200, 80, 0]);
        addText(`  ${log.message}`, 10, false, [30, 30, 30]);
        cursorY += 2;
      });
    } else {
      addText("Tidak ada log percakapan agen yang terekam.", 11, false, [100, 100, 100]);
    }

    if (returnFormat === 'base64') {
      return pdf.output('datauristring');
    } else if (returnFormat === 'blob') {
      return pdf.output('blob');
    } else {
      pdf.save(fileName);
    }
  } catch (error) {
    console.error("Failed to generate PDF report:", error);
    if (returnFormat) throw error; 
  } finally {
    (window as any).isExportingPDF = false;
  }
};
