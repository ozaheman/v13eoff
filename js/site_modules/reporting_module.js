export const ReportingModule = {
    init: (context) => {
        // The main event listener will be in site_index.js
        const reportModalCloseBtn = document.getElementById('report-modal-close-btn');
        if (reportModalCloseBtn) {
            reportModalCloseBtn.addEventListener('click', () => {
                document.getElementById('report-modal').style.display = 'none';
            });
        }

        const printReportBtn = document.getElementById('print-report-btn');
        if (printReportBtn) {
            printReportBtn.addEventListener('click', ReportingModule.handlePrint);
        }
    },

    showReportModal: (title, htmlContent) => {
        const modal = document.getElementById('report-modal');
        const titleEl = document.getElementById('report-modal-title');
        const bodyEl = document.getElementById('report-modal-body');

        titleEl.textContent = title;
        bodyEl.innerHTML = htmlContent;
        modal.style.display = 'flex';
    },

    handlePrint: () => {
        const modalTitle = document.getElementById('report-modal-title').textContent;
        if (window.PDFGenerator) {
            window.PDFGenerator.generate({
                previewId: 'report-modal-body',
                fileName: modalTitle.replace(/ /g, '_'),
                pageSize: 'a4_portrait'
            });
        }
    },

    // --- HTML Generation Functions ---

    generateSimpleListReport: (title, items, headers, rowGenerator) => {
        let tableBody = '<tr><td colspan="${headers.length}">No data available.</td></tr>';
        if (items && items.length > 0) {
            tableBody = items.map(rowGenerator).join('');
        }
        return `
            <h1>${title}</h1>
            <table class="mom-table">
                <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${tableBody}</tbody>
            </table>`;
    },

    generateRfiReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('RFI Log Report', items,
            ['Ref No', 'Subject', 'Date', 'Status', 'Response'],
            (item) => `<tr>
                <td>${item.refNo}</td>
                <td>${item.subject}</td>
                <td>${item.date}</td>
                <td>${item.status}</td>
                <td>${item.response || 'N/A'}</td>
            </tr>`
        );
    },

    generateMaterialsReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('Material Submittal Report', items,
            ['Ref No', 'Item', 'Supplier', 'Date', 'Status'],
            (item) => `<tr>
                <td>${item.ref}</td>
                <td>${item.item}</td>
                <td>${item.supplier}</td>
                <td>${item.date}</td>
                <td>${item.status}</td>
            </tr>`
        );
    },
    
    generateMomReportHtml: (items) => {
        let content = '<h1>Minutes of Meeting Report</h1>';
        if (!items || items.length === 0) {
            content += '<p>No Meetings on Record.</p>';
            return content;
        }
        items.forEach(mom => {
            content += `
                <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; page-break-inside: avoid;">
                    <h3>Ref: ${mom.ref} (${mom.date})</h3>
                    <p><strong>Summary:</strong> ${mom.summary || 'N/A'}</p>
                    <h4>Action Items</h4>
                    <table class="mom-table">
                         <thead><tr><th>Description</th><th>By</th><th>Due</th><th>Status</th></tr></thead>
                         <tbody>
                            ${(mom.actions && mom.actions.length > 0) ? mom.actions.map(a => `<tr><td>${a.desc}</td><td>${a.by}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('') : '<tr><td colspan="4">No action items.</td></tr>'}
                         </tbody>
                    </table>
                </div>
            `;
        });
        return content;
    },

    generateVendorManagementReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('Assigned Vendors Report', items,
            ['Category', 'Item', 'Manufacturer/Supplier'],
            (item) => `<tr>
                <td>${item.category}</td>
                <td>${item.item}</td>
                <td>${item.manufacturer}</td>
            </tr>`
        );
    },
     generateBoqReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('BOQ Report', items,
            ['ID', 'Description', 'Unit', 'Qty', 'Rate', 'Amount', 'Total %', 'Work Done'],
            (item) => {
                const amount = (item.qty || 0) * (item.rate || 0);
                const totalPerc = (item.prev_perc || 0) + (item.curr_perc || 0);
                const workDone = amount * (totalPerc / 100);
                return `<tr>
                    <td>${item.id}</td>
                    <td>${item.description}</td>
                    <td>${item.unit}</td>
                    <td>${item.qty}</td>
                    <td>${item.rate.toFixed(2)}</td>
                    <td>${amount.toFixed(2)}</td>
                    <td>${totalPerc.toFixed(0)}%</td>
                    <td>${workDone.toFixed(2)}</td>
                </tr>`
            }
        );
    },

    generateLongLeadReportHtml: (items) => {
         return ReportingModule.generateSimpleListReport('Long Lead Items Report', items,
            ['Item', 'Procurement (Days)', 'Submittal', 'Approval', 'Delivery', 'Required On-Site'],
            (item) => {
                // This logic needs to be self-contained for the report
                const log = item.log || {};
                const procurementDays = log.procurementDays || 90;
                let procurementStart = 'N/A';
                if(item.requiredOnSite !== 'N/A') {
                    const requiredDate = new Date(item.requiredOnSite);
                    requiredDate.setDate(requiredDate.getDate() - procurementDays);
                    procurementStart = requiredDate.toISOString().split('T')[0];
                }
                return `<tr>
                    <td>${item.name}</td>
                    <td>${procurementDays}</td>
                    <td>${log.submittalDate || ''}</td>
                    <td>${log.approvalDate || ''}</td>
                    <td>${log.deliveryDate || ''}</td>
                    <td>${item.requiredOnSite}</td>
                </tr>`
            }
        );
    },

    generateNocReportHtml: (items) => {
         return ReportingModule.generateSimpleListReport('NOC & Permit Report', items,
            ['NOC/Permit', 'Authority', 'Submission Date', 'Status'],
            (item) => `<tr>
                <td>${item.name}</td>
                <td>${item.authority}</td>
                <td>${item.submissionDate}</td>
                <td>${item.status}</td>
            </tr>`
        );
    },

    generateBulletinReportHtml: (items) => {
         return ReportingModule.generateSimpleListReport('Site Bulletin Report', items,
            ['Date', 'Author', 'Subject', 'Details', 'Assigned To'],
            (item) => `<tr>
                <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                <td>${item.author}</td>
                <td>${item.subject}</td>
                <td>${item.details}</td>
                <td>${item.assignedTo}</td>
            </tr>`
        );
    }
};