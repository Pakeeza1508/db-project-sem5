// PDF Export Module for Trip Planner
// Uses jspdf to generate downloadable trip itineraries

async function loadJsPDF() {
    if (typeof jsPDF !== 'undefined') {
        return jsPDF;
    }
    
    // Load from CDN if not already loaded
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve(window.jspdf.jsPDF);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function generateTripPDF() {
    try {
        const { jsPDF } = await loadJsPDF();
        
        // Get trip data from DOM using correct IDs
        const destination = document.getElementById('overview-destination')?.textContent || 'Unknown Destination';
        const duration = document.getElementById('overview-duration')?.textContent || '0 days';
        const budget = document.getElementById('overview-budget')?.textContent || 'N/A';
        const style = document.getElementById('overview-style')?.textContent || 'N/A';
        
        // Get cost data
        const accommodationCost = document.getElementById('cost-accommodation')?.textContent || 'N/A';
        const transportationCost = document.getElementById('cost-transportation')?.textContent || 'N/A';
        const foodCost = document.getElementById('cost-food')?.textContent || 'N/A';
        const activitiesCost = document.getElementById('cost-activities')?.textContent || 'N/A';
        const totalCost = document.getElementById('cost-total')?.textContent || 'N/A';
        
        // Get weather data if available
        const weatherDesc = document.getElementById('weather-description')?.textContent || 'N/A';
        const weatherTemp = document.getElementById('weather-temp')?.textContent || 'N/A';
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set default font
        pdf.setFont('Helvetica');
        
        // Add title
        pdf.setFontSize(24);
        pdf.setTextColor(99, 102, 241);
        pdf.text('🌍 Wanderly Trip Plan', 15, 20);
        
        // Reset text color
        pdf.setTextColor(0);
        
        // Add header info
        pdf.setFontSize(11);
        pdf.setTextColor(100);
        const headerY = 30;
        
        pdf.text(`Destination: ${destination}`, 15, headerY);
        pdf.text(`Duration: ${duration}`, 15, headerY + 7);
        pdf.text(`Travel Style: ${style}`, 15, headerY + 14);
        pdf.text(`Budget: ${budget}`, 15, headerY + 21);
        
        // Add weather info if available
        pdf.text(`Weather: ${weatherTemp} - ${weatherDesc}`, 15, headerY + 28);
        
        // Add separator line
        pdf.setDrawColor(200);
        pdf.line(15, headerY + 35, 195, headerY + 35);
        
        // Add cost breakdown section
        pdf.setTextColor(0);
        pdf.setFontSize(14);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('💰 Cost Breakdown', 15, headerY + 50);
        
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(11);
        let costY = headerY + 60;
        
        pdf.text(`Accommodation: ${accommodationCost}`, 15, costY);
        costY += 7;
        pdf.text(`Transportation: ${transportationCost}`, 15, costY);
        costY += 7;
        pdf.text(`Food & Dining: ${foodCost}`, 15, costY);
        costY += 7;
        pdf.text(`Activities: ${activitiesCost}`, 15, costY);
        costY += 10;
        
        // Total cost with highlight
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(99, 102, 241);
        pdf.text(`Total Estimated Cost: ${totalCost}`, 15, costY);
        pdf.setTextColor(0);
        
        // Add itinerary section
        costY += 20;
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('📅 Daily Itinerary', 15, costY);
        
        let yPosition = costY + 10;
        const pageHeight = pdf.internal.pageSize.height;
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 15;
        const maxWidth = pageWidth - (2 * margin);
        
        // Extract and format itinerary
        const itineraryDivs = document.querySelectorAll('.day-plan, [class*="day"]');
        
        if (itineraryDivs.length === 0) {
            // If no specific itinerary structure found, add placeholder
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text('Detailed itinerary will appear here when generated', margin, yPosition);
        } else {
            itineraryDivs.forEach((dayPlan, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - 30) {
                    pdf.addPage();
                    yPosition = 20;
                }
                
                const dayText = dayPlan.textContent || `Day ${index + 1}`;
                const dayLines = pdf.splitTextToSize(dayText, maxWidth - 10);
                
                // Add day content
                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(10);
                
                dayLines.slice(0, 3).forEach(line => {
                    if (yPosition > pageHeight - 20) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    pdf.text(line, margin + 5, yPosition);
                    yPosition += 5;
                });
                
                yPosition += 5;
            });
        }
        
        // Add footer with metadata
        const pageCount = pdf.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(150);
            
            const footerY = pdf.internal.pageSize.height - 10;
            pdf.text(`Generated by Wanderly`, margin, footerY);
            pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2 - 10, footerY);
            pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 40, footerY);
        }
        
        // Download PDF
        const safeDestination = destination.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `Wanderly_${safeDestination}_${duration.replace(' ', '')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        console.log(`✅ PDF exported: ${fileName}`);
        return true;
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
        return false;
    }
}

// Add export button to planner
function addPDFExportButton() {
    const resultsHeader = document.querySelector('.results-header');
    
    if (!resultsHeader || document.getElementById('pdf-export-btn')) {
        return; // Already added or header not found
    }
    
    // Create export button
    const exportBtn = document.createElement('button');
    exportBtn.id = 'pdf-export-btn';
    exportBtn.className = 'btn btn-primary';
    exportBtn.type = 'button';
    exportBtn.innerHTML = `<i class="fa-solid fa-download"></i> Export PDF`;
    exportBtn.style.cssText = `
        margin-left: 10px;
    `;
    
    exportBtn.onclick = async (e) => {
        e.preventDefault();
        exportBtn.disabled = true;
        const originalHTML = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        
        const success = await generateTripPDF();
        
        if (success) {
            exportBtn.innerHTML = '<i class="fa-solid fa-check"></i> Downloaded!';
            setTimeout(() => {
                exportBtn.innerHTML = originalHTML;
                exportBtn.disabled = false;
            }, 2000);
        } else {
            exportBtn.innerHTML = originalHTML;
            exportBtn.disabled = false;
        }
    };
    
    // Add button after save button
    const saveButton = document.getElementById('save-trip-btn');
    if (saveButton && saveButton.parentNode) {
        saveButton.parentNode.insertBefore(exportBtn, saveButton.nextSibling);
    } else {
        resultsHeader.appendChild(exportBtn);
    }
}

// Initialize PDF export when planner loads
document.addEventListener('DOMContentLoaded', () => {
    addPDFExportButton();
});

// Make functions globally available
window.generateTripPDF = generateTripPDF;
window.addPDFExportButton = addPDFExportButton;
