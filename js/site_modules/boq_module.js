
export const BoqModule = {
    init: (domElements, context) => {
        if(domElements.addBtn) {
            domElements.addBtn.addEventListener('click', () => BoqModule.handleAddItem(context));
        }
        if(domElements.certBtn) {
            domElements.certBtn.addEventListener('click', () => BoqModule.handleGenerateCertificate(context));
        }
        if(domElements.tableBody) {
            domElements.tableBody.addEventListener('blur', (e) => BoqModule.handleEdit(e, context), true);
            domElements.tableBody.addEventListener('click', (e) => BoqModule.handleClick(e, context));
        }
        // FIX [6]: Add listener for import
        if(domElements.importInput) {
            domElements.importInput.addEventListener('change', (e) => BoqModule.handleImport(e, context));
        }
        if(domElements.exportBtn) {
            domElements.exportBtn.addEventListener('click', () => BoqModule.handleExport(context));
        }
    },

    render: async (jobNo, domElements, searchTerm = '') => {
        if (!jobNo || !domElements.tableBody) return;
        domElements.tableBody.innerHTML = '';
        
        const siteData = await window.DB.getSiteData(jobNo);
        let boq = siteData.boq || [];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            boq = boq.filter(item => 
                (item.description && item.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (item.id && item.id.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        boq.forEach((item) => {
             const originalIndex = siteData.boq.indexOf(item); // Keep original index for edits
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalDonePerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            const workDoneValue = amount * (totalDonePerc / 100);
            
            const row = domElements.tableBody.insertRow();
             row.dataset.index = originalIndex;
            row.innerHTML = `
                <td contenteditable="true" data-field="id">${item.id || ''}</td>
                <td contenteditable="true" data-field="description">${item.description}</td>
                <td contenteditable="true" data-field="unit">${item.unit}</td>
                <td contenteditable="true" data-field="qty">${item.qty || 0}</td>
                <td contenteditable="true" data-field="rate">${(item.rate || 0).toFixed(2)}</td>
                <td>${amount.toFixed(2)}</td>
                <td>${item.prev_perc || 0}%</td>
                <td contenteditable="true" data-field="curr_perc">${item.curr_perc || 0}</td>
                <td>${totalDonePerc.toFixed(0)}%</td>
                <td>${workDoneValue.toFixed(2)}</td>
                <td><button class="delete-boq-item-btn small-button danger-button">✕</button></td>
            `;
        });
        await BoqModule.updateTotals(jobNo, domElements);
    },

    updateTotals: async (jobNo, domElements) => {
        const siteData = await window.DB.getSiteData(jobNo);
        if (!siteData || !siteData.boq) return;
        
        const boq = siteData.boq;
        const totalValue = boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
        const totalWorkDoneValue = boq.reduce((sum, item) => {
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalPerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            return sum + (amount * (totalPerc / 100));
        }, 0);
        
        const overallProgress = totalValue > 0 ? Math.round((totalWorkDoneValue / totalValue) * 100) : 0;

        if(domElements.totalValueDisplay) domElements.totalValueDisplay.textContent = `${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})} AED`;
        if(domElements.workDoneDisplay) domElements.workDoneDisplay.textContent = `${totalWorkDoneValue.toLocaleString('en-US', {minimumFractionDigits: 2})} AED`;
        if(domElements.progressDisplay) domElements.progressDisplay.textContent = `${overallProgress}%`;
        if(domElements.progressBar) {
            domElements.progressBar.style.width = `${overallProgress}%`;
            domElements.progressBar.textContent = `${overallProgress}%`;
        }

        if (siteData.progress !== overallProgress) {
            siteData.progress = overallProgress;
            await window.DB.putSiteData(siteData);
        }
    },

    handleAddItem: async (context) => {
        const { currentJobNo } = context.getState();
        if(!currentJobNo) return;
        
        const siteData = await window.DB.getSiteData(currentJobNo);
        siteData.boq.push({ id: "V.O.", description: "New Item", unit: "", qty: 0, rate: 0, prev_perc: 0, curr_perc: 0 });
        await window.DB.putSiteData(siteData);
        if(context.onUpdate) context.onUpdate('boq');
    },

    handleClick: async (e, context) => {
        if (e.target.matches('.delete-boq-item-btn')) {
            const { currentJobNo } = context.getState();
            const index = parseInt(e.target.closest('tr').dataset.index);
            const siteData = await window.DB.getSiteData(currentJobNo);
            
            if (confirm(`Delete item: ${siteData.boq[index].description}?`)) {
                siteData.boq.splice(index, 1);
                await window.DB.putSiteData(siteData);
                if(context.onUpdate) context.onUpdate('boq');
            }
        }
    },

    handleEdit: async (e, context) => {
        const target = e.target;
        if (!target.hasAttribute('contenteditable')) return;
        
        const { currentJobNo } = context.getState();
        const row = target.closest('tr');
        const index = parseInt(row.dataset.index);
        const field = target.dataset.field;
        let value = target.textContent;

        const siteData = await window.DB.getSiteData(currentJobNo);
        const item = siteData.boq[index];

        if (['qty', 'rate', 'curr_perc'].includes(field)) {
            let numValue = parseFloat(value) || 0;
            if (field === 'curr_perc') {
                const prevPerc = item.prev_perc || 0;
                if (numValue < 0) numValue = 0;
                if (numValue > (100 - prevPerc)) numValue = 100 - prevPerc;
                target.textContent = numValue;
            }
            item[field] = numValue;
        } else {
            item[field] = value;
        }

        await window.DB.putSiteData(siteData);
        if(context.onUpdate) context.onUpdate('boq'); 
    },

    handleGenerateCertificate: async (context) => {
        const { currentJobNo } = context.getState();
        if(!currentJobNo) return;
        alert("Payment Certificate generation logic placeholder.");
    },

    // FIX [6]: Add CSV Import Handler
    handleImport: async (event, context) => {
        const { currentJobNo } = context.getState();
        if(!currentJobNo) return;
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            const newBoq = [];
            
            // Skip header row if it exists
            const startRow = (rows[0] && rows[0].toLowerCase().includes('description')) ? 1 : 0;
            
            for (let i = startRow; i < rows.length; i++) {
                const columns = rows[i].split(',');
                if (columns.length >= 5) { // Expecting at least ID, Desc, Unit, Qty, Rate
                    newBoq.push({
                        id: columns[0]?.trim() || '',
                        description: columns[1]?.trim() || 'N/A',
                        unit: columns[2]?.trim() || '',
                        qty: parseFloat(columns[3]) || 0,
                        rate: parseFloat(columns[4]) || 0,
                        prev_perc: 0,
                        curr_perc: 0
                    });
                }
            }

            if (confirm(`Found ${newBoq.length} items. This will REPLACE the existing BOQ. Continue?`)) {
                const siteData = await window.DB.getSiteData(currentJobNo);
                siteData.boq = newBoq;
                await window.DB.putSiteData(siteData);
                if(context.onUpdate) context.onUpdate('boq');
                alert("BOQ imported successfully.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input to allow re-uploading the same file
        },

    // New: Export to CSV Handler
    handleExport: async (context) => {
        const { currentJobNo } = context.getState();
        if(!currentJobNo) return;

        const siteData = await window.DB.getSiteData(currentJobNo);
        const boq = siteData.boq || [];

        if (boq.length === 0) {
            alert("BOQ is empty. Nothing to export.");
            return;
        }

        const headers = ["ID", "Description", "Unit", "Qty", "Rate", "Amount", "Prev %", "Current %", "Total %", "Work Done Value"];
        
        const escapeCsvCell = (cell) => {
            const strCell = String(cell || '');
            if (strCell.includes(',')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        };

        const csvRows = [headers.join(',')];
        boq.forEach(item => {
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalDonePerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            const workDoneValue = amount * (totalDonePerc / 100);
            
            const row = [
                item.id || '',
                item.description,
                item.unit,
                item.qty || 0,
                item.rate || 0,
                amount,
                item.prev_perc || 0,
                item.curr_perc || 0,
                totalDonePerc,
                workDoneValue
            ].map(escapeCsvCell);
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${currentJobNo}_BOQ_Export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};