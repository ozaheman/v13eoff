
// --- START OF NEW site_index.js ---

// Import ALL necessary modules
import { BoqModule } from './site_modules/boq_module.js';
import { BulletinModule } from './site_modules/bulletin_module.js';
import { MaterialsModule } from './site_modules/materials_module.js';
import { MomModule } from './site_modules/mom_module.js';
import { ReportingModule } from './site_modules/reporting_module.js';
import { RfiModule } from './site_modules/rfi_module.js';
import { ScheduleModule,renderFloorSelector,  showNewTaskModal,saveNewTask,getProjectSchedule,setupSimulationControls,renderGanttChart } from './site_modules/schedule_module.js';
import { SubcontractorModule } from './site_modules/subcontractor_module.js';
import { ToolsModule } from './site_modules/tools_module.js';
import { VendorModule } from './site_modules/vendor_module.js';
import { LongLeadModule } from './site_modules/long_lead_module.js';
import { VendorManagementModule } from './site_modules/vendor_management_module.js';
// --- GLOBAL STATE ---
export const AppState = {
    currentJobNo: null,
    currentUserRole: null,
    accessibleProjects: [], 
    currentProjectFilter: '',
    calendarDate: new Date(),
     simulationInterval : null,
    
    currentFloorFilter: 'all',
    simulationSpeed : 100, // ms per day
    specificProjectAccess : null // New global to track if a specific project is locked
};
window.AppState = AppState; // <-- ADD THIS LINE
// --- DOM ELEMENTS CACHE ---
window.DOMElements = {};
console.log('DOMElements'); 
console.log(DOMElements);
// Globally Accessible Helper Functions
window.verifyAccess = async (jobNo, role, password) => {
    try {
        const project = await window.DB.getProject(jobNo);
        if (project?.accessCredentials?.[role]?.pass === password) {
            return true;
        }
        return await window.DB.verifyPassword(role, password);
    } catch (e) {
        console.error("Error during access verification:", e);
        return false;
    }
};
window.getProjectSchedule = getProjectSchedule;

// --- APP CONTEXT FOR MODULES ---
 const AppContext = {
    getState: () => AppState,
    onUpdate: async (moduleName) => {
        const jobNo = AppState.currentJobNo;
        if (!jobNo) return;
     // A helper to prevent re-rendering loops if not careful
        const renderAsync = async (renderFunc, ...args) => {
            await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI to update
            await renderFunc(...args);
        };
        switch (moduleName) {
            case 'rfi': await RfiModule.render(jobNo); break;
            case 'mom':
                await MomModule.renderList(jobNo, DOMElements.momList);
                await renderCalendar();
                break;
            
            case 'materials': await MaterialsModule.render(jobNo); break;
            case 'bulletin': await BulletinModule.render(jobNo, DOMElements.bulletinFeed); break;
            case 'boq': 
                await BoqModule.render(jobNo, getBoqElements()); 
                await renderProjectList();
                break;
             case 'subcontractors': await SubcontractorModule.render(jobNo, DOMElements.subcontractorList, AppContext); break;
            case 'long-lead':
                const project = await window.DB.getProject(jobNo);
                const siteData = await window.DB.getSiteData(jobNo);
                const schedule = await getProjectSchedule(project, siteData);
                await LongLeadModule.render(schedule, siteData.boq, AppContext);
                break;
             case 'vendor-management':
                await VendorManagementModule.render(jobNo);
                break;
           //case 'schedule': await ScheduleModule.render(jobNo); break;
        }
    },
     getSchedule: async(project, siteData) => ScheduleModule.render(project.jobNo),
};

document.addEventListener('DOMContentLoaded', async () => {
    cacheDomElements();
    try {
    if (window.DB) {
        await window.DB.init();
        await populateHolidayCountries();
    } else {
        console.error("Database (DB) object not found.");
        }
    initializeModules();
    setupCoreEventListeners();
    
    DOMElements.loginModal.style.display = 'flex';
    DOMElements.mainSiteContainer.style.display = 'none';
      }catch (error) {
        console.error("Initialization Error:", error);
    }
});

export function cacheDomElements() {
    const ids = [
        'main-site-container', 'login-modal', 'logout-btn', 'perform-login-btn', 'login-role', 'login-username', 'login-password', 'login-error','welcome-user-msg', 'project-list-body', 'details-project-name','details-project-info', 'back-to-global-btn', 'control-tabs-container','site-status-select','floor-selector-container','rfi-log-list', 'mom-list', 'material-approval-list', 'bulletin-feed', 'subcontractor-list', 'vendor-search-results', 'calendar-grid-body', 'month-year-display',
        'holiday-country-select', 'load-holidays-btn', 'resource-calculator-body', 'resource-day-rate', 
        'photo-gallery', 
        'site-doc-gallery', 'project-docs-gallery',
        'tender-docs-gallery', 'vendor-lists-gallery', 'photo-upload-input', 'doc-upload-input', 
        'doc-name-input', 
        // FIX [10]: Cache Form Modal Elements
        'form-modal', 'form-modal-close-btn', 'form-modal-title', 'form-modal-body', 'save-form-btn',
        'new-task-modal', 'new-task-close-btn', 'save-new-task-btn', 'add-custom-task-btn', 'new-task-name', 
        'new-task-start', 'new-task-duration',
        'new-task-floor', 'new-task-dependency', 'bim-item-name', 
        'bim-item-status', 'bim-item-progress', 'bim-loading',
        'photo-gallery', 'project-docs-gallery', 'site-doc-gallery', 'photo-upload-input', 
        // FIX [3]: Cache Expiry Date Input
        'doc-expiry-date',
        'doc-name-input', 
        'calendar-grid-body', 'month-year-display','holiday-country-select', 'load-holidays-btn', 
        'mom-list', 
        'bulletin-feed',
        'post-bulletin-btn', 'bulletin-subject', 'bulletin-details','bulletin-assigned-to', 'subcontractor-list', 'add-subcontractor-btn','resource-day-rate', 'resource-calculator-body', 'vendor-search-input','vendor-search-results', 'generate-project-report-btn','file-preview-modal', 'file-preview-close-btn', 'file-preview-title', 'file-preview-image', 'file-preview-embed', 'file-preview-info', 'file-download-btn',
        // New Search Inputs
        'rfi-search-input', 'materials-search-input', 'boq-search-input', 'photo-search-input','subcontractor-search-input', 'noc-search-input',
        // New Report Modal
        'report-modal', 'report-modal-close-btn', 'report-modal-title', 'report-modal-body', 'print-report-btn',
        'proj-upload-doc-name-input', 'proj-upload-expiry-date', 'proj-upload-file-input', 'proj-upload-btn', 'project-uploads-gallery',
        'print-form-btn'
    ];
     //ids.forEach(id => {const camelCaseKey = id.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());DOMElements[camelCaseKey] = document.getElementById(id);
      ids.forEach(id => {
        if(document.getElementById(id)) {
            const camelCaseKey = id.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
            DOMElements[camelCaseKey] = document.getElementById(id);
        }
    });
        DOMElements.projectDetailsView = document.getElementById('project-details-view'); 
      DOMElements.momModalElements = getMomModalElements();
    DOMElements.momPreviewElements = getMomPreviewElements();
    DOMElements.rfiModalElements = getRfiModalElements();
    DOMElements.subcontractorModalElements = getSubcontractorModalElements();
}


function getBoqElements() {
    return {
        tableBody: document.getElementById('boq-table-body'),
        totalValueDisplay: document.getElementById('boq-total-value'),
        workDoneDisplay: document.getElementById('boq-work-done-value'),
        progressDisplay: document.getElementById('boq-progress-percentage'),progressBar: document.getElementById('boq-progress-bar'),
        addBtn: document.getElementById('add-boq-item-btn'),
        certBtn: document.getElementById('generate-payment-cert-btn'),
        // FIX [6]: Add import button
        importBtn: document.getElementById('boq-import-btn'),
        importInput: document.getElementById('boq-import-input'),
        exportBtn: document.getElementById('boq-export-btn')
    };
}
function getRfiModalElements() {
    return {
        modal: document.getElementById('rfi-modal'), closeBtn: document.getElementById('rfi-modal-close-btn'), title: document.getElementById('rfi-modal-title'),
        editId: document.getElementById('rfi-edit-id'), refNo: document.getElementById('rfi-ref-no'), subject: document.getElementById('rfi-subject'),
        description: document.getElementById('rfi-description'), fileAttach: document.getElementById('rfi-file-attach'), newAttachmentsList: document.getElementById('rfi-new-attachments-list'),
        docLinkSelect: document.getElementById('rfi-doc-link-select'), approversGroup: document.getElementById('rfi-approvers-group'), responseComments: document.getElementById('rfi-response-comments'), saveBtn: document.getElementById('save-rfi-btn'),
    };
}
// FIX [5]: Correctly cache all elements from the newly added MoM modal HTML
function getMomModalElements() {
    return {
        modal: document.getElementById('mom-modal'),
        title: document.getElementById('mom-modal-title'),
        closeBtn: document.getElementById('mom-modal-close-btn'),
        editIndex: document.getElementById('mom-edit-index'),
        deleteBtn: document.getElementById('delete-mom-btn'),
        saveMomDataBtn: document.getElementById('save-mom-data-btn'),
        ref: document.getElementById('mom-ref'),
        date: document.getElementById('mom-date'),
        location: document.getElementById('mom-location'),
        progress: document.getElementById('mom-progress'),
        summary: document.getElementById('mom-status-summary'),
        lookAhead: document.getElementById('mom-lookahead'),
        materials: document.getElementById('mom-materials'),
        attendeesBody: document.getElementById('mom-attendees-tbody'),
        addAttendeeBtn: document.getElementById('add-attendee-btn'),
        actionsBody: document.getElementById('mom-actions-tbody'),
        addActionBtn: document.getElementById('add-action-btn'),
        nextDate: document.getElementById('mom-next-meeting'),
        nextNotes: document.getElementById('mom-next-meeting-notes')
    };
}
function getMomPreviewElements() {
    return {
        modal: document.getElementById('mom-preview-modal'), title: document.getElementById('mom-preview-modal-title'), body: document.getElementById('mom-preview-modal-body'),
        footer: document.getElementById('mom-preview-modal-footer'), closeBtn: document.getElementById('mom-preview-modal-close-btn')
    };
}
function getSubcontractorModalElements() {
    return {
        modal: document.getElementById('subcontractor-modal'),
        title: document.getElementById('subcontractor-modal-title'),
        closeBtn: document.getElementById('subcontractor-modal-close-btn'),
        saveBtn: document.getElementById('save-subcontractor-btn'),
        deleteBtn: document.getElementById('delete-subcontractor-btn'),
        editId: document.getElementById('subcontractor-edit-id'),
        company: document.getElementById('sub-company'),
        trade: document.getElementById('sub-trade'),
        contact: document.getElementById('sub-contact'),
        phone: document.getElementById('sub-phone'),
        email: document.getElementById('sub-email'),
        address: document.getElementById('sub-address'),
        fileInput: document.getElementById('sub-quotation-file'),
        existingFile: document.getElementById('sub-existing-file')
    };
}
function initializeModules() {
   
    const rfiModalElements = getRfiModalElements();
    rfiModalElements.newRfiBtn = document.getElementById('new-rfi-btn');
    RfiModule.init(rfiModalElements, AppContext);
   // FIX [9]: Pass form modal elements to the materials module
    MaterialsModule.init({ 
        newBtn: document.getElementById('new-material-submittal-btn'),
        formModal: DOMElements.formModal,
        formModalTitle: DOMElements.formModalTitle,
        formModalBody: DOMElements.formModalBody,
        formSaveBtn: DOMElements.saveFormBtn
    }, AppContext);
    
     BulletinModule.init({ postBtn: DOMElements.postBulletinBtn, subjectInput: DOMElements.bulletinSubject, detailsInput: DOMElements.bulletinDetails, assignedToInput: DOMElements.bulletinAssignedTo }, AppContext);
     
     VendorModule.init({ searchInput: DOMElements.vendorSearchInput, resultsContainer: DOMElements.vendorSearchResults });
     ReportingModule.init(AppContext);
     
      // ReportingModule.init({ generateBtn: DOMElements.generateProjectReportBtn }, AppContext);
       
    BoqModule.init(getBoqElements(), AppContext);
          
    SubcontractorModule.init(DOMElements.subcontractorModalElements, AppContext);
            
    ToolsModule.init({ rateInput: DOMElements.resourceDayRate, tableBody: DOMElements.resourceCalculatorBody });
          
    const momElements = getMomModalElements();
    // FIX [5]: Pass correct elements to MoM module init
    MomModule.init({ newBtn: document.getElementById('new-mom-btn'), listContainer: DOMElements.momList, modalElements: momElements, previewElements: getMomPreviewElements() }, AppContext);

  

   
    
  
    
    
   
 
    ScheduleModule.init(AppContext);
    LongLeadModule.init(AppContext);
    VendorManagementModule.init(AppContext);
    
     if(DOMElements.addCustomTaskBtn) DOMElements.addCustomTaskBtn.addEventListener('click', showNewTaskModal);
    if(DOMElements.saveNewTaskBtn) DOMElements.saveNewTaskBtn.addEventListener('click', saveNewTask);
    if(DOMElements.newTaskCloseBtn && DOMElements.newTaskModal) DOMElements.newTaskCloseBtn.addEventListener('click', () => DOMElements.newTaskModal.style.display = 'none');

    // FIX [7]: Floor Selector Listener
    if (DOMElements.floorSelectorContainer) {
        DOMElements.floorSelectorContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('floor-btn')) {
                const buttons = DOMElements.floorSelectorContainer.querySelectorAll('.floor-btn');
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                AppState.currentFloorFilter = e.target.dataset.floor;
                
                if(AppState.currentJobNo) {
                    ScheduleModule.render(AppState.currentJobNo); 
                }
            }
        });
    }
    
  
}

function setupCoreEventListeners() {
    DOMElements.performLoginBtn?.addEventListener('click', handleLogin);
    DOMElements.logoutBtn?.addEventListener('click', handleLogout);
    DOMElements.projectListBody.addEventListener('click', handleProjectSelect);
   DOMElements.backToGlobalBtn.addEventListener('click', showGlobalView);
     DOMElements.controlTabsContainer.addEventListener('click', handleTabClick);
    document.getElementById('save-data-btn')?.addEventListener('click', () => alert('Save XML functionality placeholder.'));
     DOMElements.siteStatusSelect?.addEventListener('change', updateStatus);
  
    DOMElements.photoUploadInput?.addEventListener('change', (e) => handleFileUpload(e, 'photo'));
    DOMElements.docUploadInput?.addEventListener('change', (e) => handleFileUpload(e, 'document'));
      document.getElementById('prev-month-btn')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month-btn')?.addEventListener('click', () => changeMonth(1));
      document.getElementById('load-holidays-btn')?.addEventListener('click', handleLoadHolidays);
   
    // FIX [10]: Add listener for form modal close button
    if(DOMElements.formModalCloseBtn) DOMElements.formModalCloseBtn.addEventListener('click', () => {
        DOMElements.formModal.style.display = 'none';
        DOMElements.formModalBody.innerHTML = ''; // Clear content
    });
    DOMElements.printFormBtn?.addEventListener('click', () => {
        if(window.PDFGenerator) {
            window.PDFGenerator.generate({
                previewId: 'form-modal-body',
                fileName: DOMElements.formModalTitle.textContent.replace(/ /g, '_'),
            });
        }
    });

    const formsTab = document.getElementById('forms-tab');
    if(formsTab) formsTab.addEventListener('click', handleFormButtonClick);
    document.body.addEventListener('click', handleGlobalClicks);

    // FIX [11]: Add listeners for file preview
    if(DOMElements.filePreviewCloseBtn) DOMElements.filePreviewCloseBtn.addEventListener('click', () => {
        DOMElements.filePreviewModal.style.display = 'none';
    });
    // Add file preview listeners to all galleries
    ['photoGallery', 'siteDocGallery', 'projectDocsGallery', 'tenderDocsGallery', 'vendorListsGallery', 'projectUploadsGallery'].forEach(id => {
        if(DOMElements[id]) DOMElements[id].addEventListener('click', (e) => handleFilePreviewClick(e));
    });
    
    /*
    DOMElements.photoGallery?.addEventListener('click', (e) => handleFilePreviewClick(e));
    DOMElements.siteDocGallery?.addEventListener('click', (e) => handleFilePreviewClick(e));
    DOMElements.projectDocsGallery?.addEventListener('click', (e) => handleFilePreviewClick(e));
    DOMElements.tenderDocsGallery?.addEventListener('click', (e) => handleFilePreviewClick(e));
    DOMElements.vendorListsGallery?.addEventListener('click', (e) => handleFilePreviewClick(e));
    */
    // FIX [4]: Add listeners for NOC tab
    document.getElementById('add-noc-btn')?.addEventListener('click', handleAddNoc);
    document.getElementById('noc-log-list')?.addEventListener('change', handleNocStatusChange);
     // New Search Listeners
    DOMElements.rfiSearchInput?.addEventListener('input', (e) => RfiModule.render(AppState.currentJobNo, e.target.value));
    DOMElements.materialsSearchInput?.addEventListener('input', (e) => MaterialsModule.render(AppState.currentJobNo, e.target.value));
    DOMElements.boqSearchInput?.addEventListener('input', (e) => BoqModule.render(AppState.currentJobNo, getBoqElements(), e.target.value));
    DOMElements.photoSearchInput?.addEventListener('input', (e) => renderFileGallery(DOMElements.photoGallery, 'site', 'photo', true, e.target.value));
    DOMElements.subcontractorSearchInput?.addEventListener('input', (e) => SubcontractorModule.render(AppState.currentJobNo, DOMElements.subcontractorList, AppContext, e.target.value));
    DOMElements.nocSearchInput?.addEventListener('input', (e) => renderNocLog(AppState.currentJobNo, e.target.value));
    // New Report Button Listener (using event delegation)
    DOMElements.momSearchInput?.addEventListener('input', (e) => MomModule.renderList(AppState.currentJobNo, DOMElements.momList, e.target.value));
    
    // Event delegation for all Report Buttons
    DOMElements.projectDetailsView?.addEventListener('click', handleReportButtonClick);
      // Calendar MoM preview
    DOMElements.calendarGridBody?.addEventListener('click', (e) => {
        const momEvent = e.target.closest('.event-dot.mom');
        if (momEvent && momEvent.dataset.jobNo && momEvent.dataset.momIndex) {
            MomModule.renderPreview(momEvent.dataset.jobNo, parseInt(momEvent.dataset.momIndex), getMomPreviewElements());
        }
    });

    // Project Uploads Tab Listener
    DOMElements.projUploadBtn?.addEventListener('click', handleProjectUpload);
}
     
async function handleLogin() {
    const role = DOMElements.loginRole.value;
    const inputUser = DOMElements.loginUsername.value.trim();
    const inputPass = DOMElements.loginPassword.value.trim();
    
    const authResult = await authenticateUser(role, inputUser, inputPass);

    if (authResult.success) {
        DOMElements.loginModal.style.display = 'none';
        DOMElements.mainSiteContainer.style.display = 'block';
        
        AppState.currentUserRole = role;
        AppState.accessibleProjects = authResult.accessibleProjects;
        
        const roleName = DOMElements.loginRole.options[DOMElements.loginRole.selectedIndex].text;
        DOMElements.welcomeUserMsg.textContent = `Welcome, ${roleName}`;
        DOMElements.welcomeUserMsg.style.display = 'inline';
        DOMElements.logoutBtn.style.display = 'inline-block';

        await renderProjectList();
        await updateDashboardStats(); // Update stats for global view
        if (AppState.accessibleProjects.length === 1) {
            await autoLoadProject(AppState.accessibleProjects[0]);
        } else {
            showGlobalView();
        }
    } else {
        DOMElements.loginError.style.display = 'block';
    }
}
async function authenticateUser(role, username, password) {
    let accessibleProjects = [];
    const allProjects = await window.DB.getAllProjects();
    for (const project of allProjects) {
        if (project.accessCredentials?.[role]?.user === username && project.accessCredentials?.[role]?.pass === password) {
            accessibleProjects.push(project.jobNo);
        }
    }
    if (accessibleProjects.length > 0) return { success: true, accessibleProjects };
    
    const settings = await window.DB.getSetting('access_control');
    if (settings?.credentials?.[role]?.user === username && settings?.credentials?.[role]?.pass === password) {
        return { success: true, accessibleProjects: [] }; // Empty means all
    }
    
    return { success: false, accessibleProjects: [] };
}



function handleLogout() {window.location.reload();}

async function handleProjectSelect(e) {
    const row = e.target.closest('tr');
    if (!row || !row.dataset.jobNo) return;

    AppState.currentJobNo = row.dataset.jobNo;
    DOMElements.projectListBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    DOMElements.backToGlobalBtn.style.display = 'block';

    const project = await window.DB.getProject(AppState.currentJobNo);
    let siteData = await window.DB.getSiteData(AppState.currentJobNo) || { jobNo: AppState.currentJobNo, status: 'Pending Start', boq: [], mom: [], rfiLog: [], materialLog: [], nocLog: [] };
    // Clear search inputs
       ['rfiSearchInput', 'materialsSearchInput', 'boqSearchInput', 'photoSearchInput', 'subcontractorSearchInput', 'nocSearchInput', 'momSearchInput'].forEach(id => {
        if (DOMElements[id]) DOMElements[id].value = '';
    });
   // DOMElements.rfiSearchInput.value = '';
   // DOMElements.materialsSearchInput.value = '';
    //DOMElements.boqSearchInput.value = '';
  //  DOMElements.photoSearchInput.value = '';


    DOMElements.detailsProjectName.textContent = project.projectDescription;
      DOMElements.detailsProjectInfo.textContent = `Job: ${project.jobNo} | ${project.clientName}`;
    DOMElements.siteStatusSelect.value = siteData.status || 'Pending Start';
    // Render all modules and galleries
    RfiModule.render(AppState.currentJobNo);
    MomModule.renderList(AppState.currentJobNo, DOMElements.momList);
    MaterialsModule.render(AppState.currentJobNo);
    BulletinModule.render(AppState.currentJobNo, DOMElements.bulletinFeed);
    BoqModule.render(AppState.currentJobNo, getBoqElements());
    SubcontractorModule.render(AppState.currentJobNo, DOMElements.subcontractorList, AppContext);
    VendorManagementModule.render(AppState.currentJobNo);
    renderNocLog(AppState.currentJobNo); // FIX [4]: Render NOC log

    await renderFileGallery(DOMElements.photoGallery, 'site', 'photo', true);
    await renderFileGallery(DOMElements.siteDocGallery, 'site', 'document', true);
   // Render master document galleries
   await renderFileGallery(DOMElements.projectUploadsGallery, 'site', 'project_upload', true);
    await renderFileGallery(DOMElements.projectDocsGallery, 'master', 'project_doc', false);
    await renderFileGallery(DOMElements.tenderDocsGallery, 'master', 'tender_doc', false);
    await renderFileGallery(DOMElements.vendorListsGallery, 'master', 'vendor_list', false);
    

    const schedule = await ScheduleModule.render(AppState.currentJobNo);
    await renderGanttChart();
    renderCalendar();
    renderFloorSelector();
    if(schedule){ 
        ToolsModule.renderResourceCalculator(AppState.currentJobNo, { tableBody: document.getElementById('resource-calculator-body')  }, schedule);
        LongLeadModule.render(schedule, siteData.boq, AppContext);
    }
    updateDashboardStats(AppState.currentJobNo);
    toggleTabsForView(true);
}
async function autoLoadProjectxx(jobNo) {
    const rows = Array.from(DOMElements.projectListBody.querySelectorAll('tr'));
    const targetRow = rows.find(r => r.dataset.jobNo === jobNo);
    
    if (targetRow) {
        await handleProjectSelect({ target: targetRow }); 
    } else {
        // Direct load fallback
        AppState.currentJobNo = jobNo;
        const project = await window.DB.getProject(jobNo);
        if(project) {
            let siteData = await window.DB.getSiteData(jobNo);
            if (!siteData) {
                const boqTemplate = (window.FINANCIAL_DATA && window.FINANCIAL_DATA.boq) ? JSON.parse(JSON.stringify(window.FINANCIAL_DATA.boq)) : [];
                siteData = { jobNo: jobNo, status: 'Pending Start', boq: boqTemplate };
                await window.DB.putSiteData(siteData);
            }
            DOMElements.detailsProjectName.textContent = project.projectDescription;
            DOMElements.backToGlobalBtn.style.display = 'block';
            
            // Render all modules manually since UI row click didn't happen
            RfiModule.render(jobNo, DOMElements.rfiTableBody, AppState.currentUserRole);
            MomModule.renderList(jobNo, DOMElements.momList);
            BoqModule.render(jobNo, getBoqElements());
            MaterialsModule.render(jobNo, DOMElements.materialTableBody);
            BulletinModule.render(jobNo, DOMElements.bulletinFeed);
            SubcontractorModule.render(jobNo, DOMElements.subcontractorList, AppContext);
            
            const schedule = await ScheduleModule.render(jobNo);
            renderFloorSelector();
            ToolsModule.renderResourceCalculator(jobNo, { tableBody: document.getElementById('resource-calculator-body') }, schedule);
            LongLeadModule.render(schedule, siteData.boq, AppContext);
            
            toggleTabsForView(true);
        }
    }
}
async function autoLoadProject(jobNo) {
    const targetRow = Array.from(DOMElements.projectListBody.querySelectorAll('tr')).find(r => r.dataset.jobNo === jobNo);
    if (targetRow) await handleProjectSelect({ target: targetRow }); 
}
async function renderProjectList() {
    const allProjects = await window.DB.getAllProjects();
    const allSiteData = await window.DB.getAllSiteData();
      const siteDataMap = new Map(allSiteData.map(d => [d.jobNo, d]));

    const filteredProjects = AppState.accessibleProjects.length > 0
        ? allProjects.filter(p => AppState.accessibleProjects.includes(p.jobNo))
        : allProjects;

    DOMElements.projectListBody.innerHTML = filteredProjects.map(p => {
        let siteData = siteDataMap.get(p.jobNo) || { status: 'Pending Start', progress: 0 };
        return `<tr data-job-no="${p.jobNo}"><td>${p.jobNo}</td><td>${p.projectDescription}<br><small>${p.clientName}</small></td><td>${p.plotNo}</td><td>${siteData.status} (${siteData.progress}%)</td></tr>`;
    }).join('') || '<tr><td colspan="4">No projects accessible.</td></tr>';
}

function showGlobalView() {
    AppState.currentJobNo = null;
    DOMElements.detailsProjectName.textContent = "All Projects Overview";
    DOMElements.detailsProjectInfo.textContent = "Select a project to see details.";
    DOMElements.backToGlobalBtn.style.display = 'none';
    DOMElements.projectListBody.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
    
    toggleTabsForView(false);
    updateDashboardStats(); // Update stats for global view
}
function toggleTabsForView(isProjectView) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.style.display = (!isProjectView && btn.dataset.tab !== 'calendar') ? 'none' : 'inline-block';
    });
    const tabToActivate = isProjectView ? 'status' : 'calendar';
    document.querySelector(`[data-tab="${tabToActivate}"]`)?.click();
}
function handleTabClick(e) {
    if (e.target.matches('.tab-button')) {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const content = document.getElementById(`${e.target.dataset.tab}-tab`);
        if (content) content.classList.add('active');
        if(e.target.dataset.tab === 'schedule') ScheduleModule.render(AppState.currentJobNo);
    }
}
async function handleGlobalClicks(e) {
    if(e.target.classList.contains('preview-mom-btn')) {
        const { index, jobNo } = e.target.dataset;
        if (index && jobNo) MomModule.renderPreview(jobNo, parseInt(index), getMomPreviewElements());
    }
    if(e.target.classList.contains('thumbnail-delete-btn')) {
        e.stopPropagation();
        const { id, type } = e.target.dataset;
        if(confirm("Delete this file?")) {
            await window.DB.deleteFile(parseInt(id));
            const galleryId = e.target.closest('.gallery-grid').id;
            const gallery = document.getElementById(galleryId);
            // This is a bit simplified; ideally, we'd know which render function to call
            if (galleryId === 'photo-gallery') await renderFileGallery(gallery, 'site', 'photo', true);
            else if (galleryId === 'site-doc-gallery') await renderFileGallery(gallery, 'site', 'document', true);
            else if (galleryId === 'project-uploads-gallery') await renderFileGallery(gallery, 'site', 'project_upload', true);
        }
    }
}
async function handleFileUpload(event, type) {
    if (!AppState.currentJobNo) return;
    for (const file of event.target.files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileData = {
                jobNo: AppState.currentJobNo, source: 'site', type, name: (type === 'document' && DOMElements.docNameInput?.value) ? `${DOMElements.docNameInput.value} (${file.name})` : file.name,
                fileType: file.type, dataUrl: e.target.result, timestamp: new Date().toISOString()
            };
            // FIX [2, 3]: Add expiry date if provided
            if (type === 'photo') {
                fileData.status = DOMElements.siteStatusSelect.value;
                fileData.statusDate = new Date().toISOString().split('T')[0];
            }

            if (type === 'document' && DOMElements.docExpiryDate?.value) {
                fileData.expiryDate = DOMElements.docExpiryDate.value;
            }
            await window.DB.addFile(fileData);

            const gallery = type === 'photo' ? DOMElements.photoGallery : DOMElements.siteDocGallery;
            await renderFileGallery(gallery, 'site', type, true);
            await updateDashboardStats(AppState.currentJobNo);
            // Reset inputs
            if (DOMElements.docNameInput) DOMElements.docNameInput.value = '';
            if (DOMElements.docExpiryDate) DOMElements.docExpiryDate.value = '';
        };
        reader.readAsDataURL(file);
    }
}
async function renderFileGallery(galleryEl, source, type, isDeletable,searchTerm = '') {
    if(!galleryEl) return;
    galleryEl.innerHTML = '';
    
    // Allow filtering by project or show all for certain views
     const jobNoFilter = (source === 'master') ? null : AppState.currentJobNo;
    if (!jobNoFilter && source === 'site') return;

    let files = await window.DB.getFiles(jobNoFilter, source);
    if (type) {
        files = files.filter(f => f.type === type);
    }
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        files = files.filter(f => f.name.toLowerCase().includes(lowerSearchTerm));
    }
     files.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'thumbnail-container';
        if (!isDeletable) div.classList.add('read-only');
        div.dataset.fileId = file.id; // FIX [11]: Add file ID for previewing

        const isImage = file.fileType?.startsWith('image/');
        let expiryHtml = '';
        // FIX [2]: Render Expiry Badge
        if(file.expiryDate) {
            const expiry = new Date(file.expiryDate);
            const today = new Date();
            const soonDate = new Date();
            soonDate.setDate(today.getDate() + 30);
            
            if (expiry < today) {
                expiryHtml = `<div class="expiry-badge expired">Expired</div>`;
            } else if (expiry < soonDate) {
                 expiryHtml = `<div class="expiry-badge soon">Expires Soon</div>`;
            } else {
                 expiryHtml = `<div class="expiry-badge active">Active</div>`;
            }
        }
        const captionDate = file.statusDate || new Date(file.timestamp).toISOString().split('T')[0];
        const caption = `${file.name}<br><small>${captionDate}</small>`;
        div.innerHTML = (isImage ? `<img src="${file.dataUrl}" class="thumbnail">` : `<div class="file-icon">📄</div>`) + 
                        `<div class="thumbnail-caption">${caption}:${file.name}</div>` +
                        (isDeletable ? `<div class="thumbnail-delete-btn" data-id="${file.id}" data-type="${type}">×</div>` : '') +
                        expiryHtml;
        galleryEl.appendChild(div);
    });
}


async function updateStatus() {
    if (!AppState.currentJobNo) return;
    const siteData = await window.DB.getSiteData(AppState.currentJobNo);
    siteData.status = DOMElements.siteStatusSelect.value;
    await window.DB.putSiteData(siteData);
    await renderProjectList();
}
// FIX [10]: Form button handler restored
async function handleFormButtonClick(e) {
    if(!e.target.matches('.form-btn')) return;
    if(!AppState.currentJobNo) return alert("Select a project");
    
    const formType = e.target.dataset.form;
    const project = await window.DB.getProject(AppState.currentJobNo);
    const siteData = await window.DB.getSiteData(AppState.currentJobNo);
    
    DOMElements.formModalTitle.textContent = e.target.innerText;
    
    try {
        const response = await fetch(`forms/${formType}.html`);
        if(!response.ok) throw new Error("Form template not found");
        let htmlContent = await response.text();

        const logoSrc = (typeof LOGO_svgBASE64 !== 'undefined') ? LOGO_svgBASE64 : '';
        const logoHtml = logoSrc ? `<img src="${logoSrc}" style="max-height:60px; max-width:200px; margin-bottom:10px;">` : '';
        if (htmlContent.includes('<div class="form-container">')) {
             htmlContent = htmlContent.replace('<div class="form-container">', `<div class="form-container"><div style="text-align:left;">${logoHtml}</div>`);
        }
        
        htmlContent = htmlContent
            .replace(/\[Project Job No\]/g, project.jobNo || 'N/A')
            .replace(/\[Project Name\]/g, project.projectDescription || 'N/A')
            .replace(/\[Plot No\]/g, project.plotNo || 'N/A')
            .replace(/\[Client Name\]/g, project.clientName || 'N/A')
            .replace(/\[Contractor Name\]/g, siteData.contractorName || 'Main Contractor')
            .replace(/\[Consultant Name\]/g, 'Urban Axis Architectural & Consulting Engineers');

        DOMElements.formModalBody.innerHTML = htmlContent;
        DOMElements.formModal.style.display = 'flex';
        DOMElements.saveFormBtn.style.display = 'none'; // Hide generic save button initially

    } catch (error) {
        console.error("Error loading form:", error);
        DOMElements.formModalBody.innerHTML = `<p style="color:red">Error loading form template: ${error.message}</p>`;
        DOMElements.formModal.style.display = 'flex';
    }
}
async function updateDashboardStats(jobNo = null) {
    const statElements = {
        rfi: document.getElementById('stat-rfi-pending'), mat: document.getElementById('stat-mat-pending'),
        progress: document.getElementById('stat-work-progress'), tasks: document.getElementById('stat-tasks-comp'),
        bulletins: document.getElementById('stat-bulletins'), days: document.getElementById('stat-days-active'),
        expiry: document.getElementById('stat-expiry'),
    };

    let siteDatas = [];
    if (jobNo) {
        const siteData = await window.DB.getSiteData(jobNo);
        if (siteData) siteDatas.push(siteData);

        const project = await window.DB.getProject(jobNo);
        const startStr = project.agreementDate || siteData?.startDate || new Date().toISOString();
        const diffDays = Math.ceil(Math.abs(new Date() - new Date(startStr)) / (1000 * 60 * 60 * 24));
        statElements.days.textContent = `${diffDays} Days`;
    } else {
        siteDatas = await window.DB.getAllSiteData();
        statElements.days.textContent = '-';
    }

    statElements.rfi.textContent = siteDatas.reduce((sum, d) => sum + (d.rfiLog || []).filter(r => r.status !== 'Approved' && r.status !== 'Closed').length, 0);
    statElements.mat.textContent = siteDatas.reduce((sum, d) => sum + (d.materialLog || []).filter(m => m.status === 'Submitted' || m.status === 'Revise & Resubmit').length, 0);

    const totalProgress = siteDatas.reduce((sum, d) => sum + (d.progress || 0), 0);
    statElements.progress.textContent = (siteDatas.length > 0) ? `${Math.round(totalProgress / siteDatas.length)}%` : '0%';
    
    statElements.tasks.textContent = '-'; // Needs async per-project calculation, simplified for now
    statElements.bulletins.textContent = '-'; // Needs async calculation

    // Expiry count is always calculated, filtered by jobNo if provided
    let allFiles = await window.DB.getAllFiles();
    if (jobNo) {
        allFiles = allFiles.filter(f => f.jobNo === jobNo || f.source === 'master');
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date(new Date().setDate(today.getDate() + 30));
    const expiringCount = allFiles.filter(f => {
        if (!f.expiryDate) return false;
        const expiryDate = new Date(f.expiryDate);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    }).length;

    statElements.expiry.textContent = expiringCount;
}
async function updateDashboardStatsxxx(jobNo = null) {
    const statElements = {
        rfi: document.getElementById('stat-rfi-pending'),mat: document.getElementById('stat-mat-pending'),
        progress: document.getElementById('stat-work-progress'),tasks: document.getElementById('stat-tasks-comp'),
        bulletins: document.getElementById('stat-bulletins'),days: document.getElementById('stat-days-active'),
        expiry: document.getElementById('stat-expiry'),
    };
let siteDatas = [];
    if (jobNo) {
        const project = await window.DB.getProject(jobNo);
        const siteData = await window.DB.getSiteData(jobNo);
        statElements.rfi.textContent = (siteData.rfiLog || []).filter(r => r.status !== 'Approved' && r.status !== 'Closed').length;
        statElements.mat.textContent = (siteData.materialLog || []).filter(m => m.status === 'Submitted' || m.status === 'Revise & Resubmit').length;
        statElements.progress.textContent = `${siteData.progress || 0}%`;
        const tasks = await getProjectSchedule(project, siteData);
        statElements.tasks.textContent = tasks.filter(t => new Date(t.end) < new Date()).length;
        const startStr = project.agreementDate || siteData.startDate || new Date().toISOString();
        const diffDays = Math.ceil(Math.abs(new Date() - new Date(startStr)) / (1000 * 60 * 60 * 24)); 
        statElements.days.textContent = `${diffDays} Days`;
    } else {
        // Global view - reset or aggregate
        statElements.rfi.textContent = '-';
        statElements.mat.textContent = '-';
        statElements.progress.textContent = '-';
        statElements.tasks.textContent = '-';
        statElements.days.textContent = '-';
    }

    // Expiry count is always calculated, filtered by jobNo if provided
    let allFiles = await window.DB.getAllFiles();
    if (jobNo) {
        allFiles = allFiles.filter(f => f.jobNo === jobNo || f.source === 'master');
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringCount = allFiles.filter(f => {
        if (!f.expiryDate) return false;
        const expiryDate = new Date(f.expiryDate);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    }).length;

    statElements.expiry.textContent = expiringCount;
}
async function updateDashboardStatsxx(jobNo) {
    const statElements = {
        rfi: document.getElementById('stat-rfi-pending'),
        mat: document.getElementById('stat-mat-pending'),
        progress: document.getElementById('stat-work-progress'),
        tasks: document.getElementById('stat-tasks-comp'),
        bulletins: document.getElementById('stat-bulletins'),
        days: document.getElementById('stat-days-active'),
        expiry: document.getElementById('stat-expiry'),
    };
    if (jobNo) return;
    const project = await window.DB.getProject(jobNo);
    const siteData = await window.DB.getSiteData(jobNo);
    document.getElementById('stat-rfi-pending').textContent = (siteData.rfiLog || []).filter(r => r.status !== 'Approved' && r.status !== 'Closed').length;
    document.getElementById('stat-mat-pending').textContent = (siteData.materialLog || []).filter(m => m.status === 'Submitted' || m.status === 'Revise & Resubmit').length;
    document.getElementById('stat-work-progress').textContent = (siteData.progress || 0) + '%';
     const tasks = await getProjectSchedule(project, siteData);
    const completedTasks = tasks.filter(t => new Date(t.end) < new Date()).length;
    document.getElementById('stat-tasks-comp').textContent = completedTasks;
    //const project = await window.DB.getProject(jobNo);
    const startStr = project.agreementDate || siteData.startDate || new Date().toISOString();
    const startDate = new Date(startStr);
    const diffTime = Math.abs(new Date() - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    document.getElementById('stat-days-active').textContent = diffDays + ' Days';
}
function changeMonth(offset) {
    AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() + offset);
    renderCalendar();
}
//currentJobNo
// --- CALENDAR LOGIC ---

async function renderCalendar() {
    DOMElements.monthYearDisplay.textContent = AppState.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const grid = DOMElements.calendarGridBody;
    grid.innerHTML = '';
    const allEvents = {};

    const addEvent = (date, type, text, color = null, momIndex = null, jobNo = null) => {
        const dateKey = new Date(date).toDateString();
        if (!allEvents[dateKey]) allEvents[dateKey] = [];
        if (!allEvents[dateKey].some(e => e.type === type && e.text === text && e.jobNo === jobNo)) {
            allEvents[dateKey].push({ type, text, color, momIndex, jobNo });
        }
    };
    
    const allHolidays = await window.DB.getAllHolidays();
    allHolidays.forEach(holiday => addEvent(holiday.date, 'holiday', holiday.name));
    const allStaffLeaves = await DB.getAll('staffLeaves');
    allStaffLeaves.forEach(leave => {
        let currentDate = new Date(leave.startDate + 'T00:00:00');
        const endDate = new Date(leave.endDate + 'T00:00:00');
        while (currentDate <= endDate) {
            addEvent(currentDate, 'leave', `On Leave: ${leave.staffName}`);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    const projectsToScan = AppState.currentJobNo ? [AppState.currentJobNo] : (await DB.getAllProjects()).map(p => p.jobNo);
    
    for (const jobNo of projectsToScan) {
        const project = await window.DB.getProject(jobNo);
        const siteData = await window.DB.getSiteData(jobNo);
        if (!siteData) continue;

        const color = AppState.currentJobNo ? null : getProjectColor(jobNo);
        const prefix = AppState.currentJobNo ? '' : `${jobNo}: `;

        (siteData.statusLog || []).forEach(log => addEvent(log.date, 'status', `${prefix}Status: ${log.status}`, color));
        (siteData.mom || []).forEach((mom, index) => addEvent(mom.date, 'mom', `${prefix}MoM: Ref ${mom.ref || 'N/A'}`, color, index, jobNo));
          (siteData.nocLog || []).forEach(noc => addEvent(noc.submissionDate, 'noc', `${prefix}NOC: ${noc.name}`, '#6f42c1'));
        if (project.projectType === 'Villa') {
            const dynamicSchedule = await getProjectSchedule(project, siteData);
            dynamicSchedule.forEach(task => {
                const start = new Date(task.start + 'T00:00:00');
                const end = new Date(task.end + 'T00:00:00');
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
                
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    addEvent(d, 'gantt-task', `${prefix}${task.name}`, color);
                }
            });
        }
    }

    const year = AppState.calendarDate.getFullYear(), month = AppState.calendarDate.getMonth();
    const startDayOfWeek = new Date(year, month, 1).getDay();
    const currentDay = new Date(year, month, 1 - startDayOfWeek);
    for (let i = 0; i < 42; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        const dayKey = currentDay.toDateString();
        if (currentDay.getMonth() !== month) dayCell.classList.add('other-month');
        dayCell.innerHTML = `<div class="day-number">${currentDay.getDate()}</div><div class="day-events"></div>`;
        const eventsContainer = dayCell.querySelector('.day-events');
        if (allEvents[dayKey]) {
            allEvents[dayKey].sort((a,b) => a.type === 'holiday' ? -1 : 1).forEach(event => {
                const eventEl = document.createElement('span');
                eventEl.className = `${event.type.includes('gantt') ? 'event-bar' : 'event-dot'} ${event.type}`;
                eventEl.textContent = event.text;
                eventEl.title = event.text;
                if (event.color) eventEl.style.backgroundColor = event.color;
                if (event.type === 'mom' && event.momIndex !== null) {
                    eventEl.dataset.momIndex = event.momIndex;
                    eventEl.dataset.jobNo = event.jobNo;
                    eventEl.classList.add('clickable-event');
                }
                eventsContainer.appendChild(eventEl);
            });
        }
        grid.appendChild(dayCell);
        currentDay.setDate(currentDay.getDate() + 1);
    }
}

    async function renderCalendarxxx() {
        DOMElements.monthYearDisplay.textContent = AppState.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
		
        const grid = DOMElements.calendarGridBody;
        grid.innerHTML = '';
        const allEvents = {};

        const addEvent = (date, type, text, color = null, momIndex = null, jobNo = null) => {
            const dateKey = new Date(date).toDateString();
            if (!allEvents[dateKey]) allEvents[dateKey] = [];
            if (!allEvents[dateKey].some(e => e.type === type && e.text === text && e.jobNo === jobNo)) {
                allEvents[dateKey].push({ type, text, color, momIndex, jobNo });
            }
        };
        
        const allHolidays = await window.DB.getAllHolidays();
        allHolidays.forEach(holiday => addEvent(holiday.date, 'holiday', holiday.name));
        const allStaffLeaves = await DB.getAll('staffLeaves');
        allStaffLeaves.forEach(leave => {
            let currentDate = new Date(leave.startDate + 'T00:00:00');
            const endDate = new Date(leave.endDate + 'T00:00:00');
            while (currentDate <= endDate) {
                addEvent(currentDate, 'leave', `On Leave: ${leave.staffName}`);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        const projectsToScan = AppState.currentJobNo ? [AppState.currentJobNo] : (await DB.getAllProjects()).map(p => p.jobNo);
        for (const jobNo of projectsToScan) {
            const project = await window.DB.getProject(jobNo);
            const siteData = await window.DB.getSiteData(jobNo);
            if (!siteData) continue;

            const color = AppState.currentJobNo ? null : getProjectColor(jobNo);
            const prefix = AppState.currentJobNo ? '' : `${jobNo}: `;

            (siteData.statusLog || []).forEach(log => addEvent(log.date, 'status', `${prefix}Status: ${log.status}`, color));
            (siteData.mom || []).forEach((mom, index) => addEvent(mom.date, 'mom', `${prefix}MoM: Ref ${mom.ref || 'N/A'}`, color, index, jobNo));
            
            // FIX [8]: Ensure calendar tasks are rendered from schedule
            if (project.projectType === 'Villa') {
                const dynamicSchedule = await getProjectSchedule(project, siteData);
                dynamicSchedule.forEach(task => {
                    const start = new Date(task.start + 'T00:00:00');
                    const end = new Date(task.end + 'T00:00:00');
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
                    
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        addEvent(d, 'gantt-task', `${prefix}${task.name}`, color);
                    }
                });
            }
        }

        const year = AppState.calendarDate.getFullYear(), month = AppState.calendarDate.getMonth();
        const startDayOfWeek = new Date(year, month, 1).getDay();
        const currentDay = new Date(year, month, 1 - startDayOfWeek);
        for (let i = 0; i < 42; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            const dayKey = currentDay.toDateString();
            if (currentDay.getMonth() !== month) dayCell.classList.add('other-month');
            dayCell.innerHTML = `<div class="day-number">${currentDay.getDate()}</div><div class="day-events"></div>`;
            const eventsContainer = dayCell.querySelector('.day-events');
            if (allEvents[dayKey]) {
                allEvents[dayKey].sort((a,b) => a.type === 'holiday' ? -1 : 1).forEach(event => {
                    const eventEl = document.createElement('span');
                    eventEl.className = `${event.type.includes('gantt') ? 'event-bar' : 'event-dot'} ${event.type}`;
                    eventEl.textContent = event.text;
                    eventEl.title = event.text;
                    if (event.color) eventEl.style.backgroundColor = event.color;
                    if (event.type === 'mom' && event.momIndex !== null) {
                        eventEl.dataset.momIndex = event.momIndex;
                        eventEl.dataset.jobNo = event.jobNo;
                        eventEl.classList.add('clickable-event');
                    }
                    eventsContainer.appendChild(eventEl);
                });
            }
            grid.appendChild(dayCell);
            currentDay.setDate(currentDay.getDate() + 1);
        }
    }

async function populateHolidayCountries() {
    const select = DOMElements.holidayCountrySelect;
    if (!select) return;
    try {
        const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
        if (!response.ok) throw new Error('Failed to fetch countries');
        const countries = await response.json();
        select.innerHTML = countries.map(c => `<option value="${c.countryCode}">${c.name}</option>`).join('');
        select.value = 'AE';
    } catch (error) {
        console.error('Could not load holiday countries:', error);
        select.innerHTML = '<option value="AE">United Arab Emirates</option>';
    }
}

async function handleLoadHolidays() {
    alert("Loading holidays...");
}
function getProjectColor(jobNo) {
    let hash = 0;
    for (let i = 0; i < jobNo.length; i++) {
        hash = jobNo.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + (value % 200).toString(16)).substr(-2);
    }
    return color;
}

// --- FIX [11]: FILE PREVIEW HANDLER ---
async function handleFilePreviewClick(e) {
    const container = e.target.closest('.thumbnail-container');
    if (!container || !container.dataset.fileId) return;

    const fileId = parseInt(container.dataset.fileId);
    const file = await window.DB.getFileById(fileId);
    if (!file) {
        alert("File data not found.");
        return;
    }
    
    DOMElements.filePreviewTitle.textContent = file.name;
    DOMElements.filePreviewImage.style.display = 'none';
    DOMElements.filePreviewEmbed.style.display = 'none';
    DOMElements.filePreviewInfo.style.display = 'none';

    if (file.fileType.startsWith('image/')) {
        DOMElements.filePreviewImage.src = file.dataUrl;
        DOMElements.filePreviewImage.style.display = 'block';
    } else if (file.fileType === 'application/pdf') {
        DOMElements.filePreviewEmbed.src = file.dataUrl;
        DOMElements.filePreviewEmbed.style.display = 'block';
    } else {
        DOMElements.filePreviewInfo.style.display = 'block';
    }
    
    DOMElements.fileDownloadBtn.href = file.dataUrl;
    DOMElements.fileDownloadBtn.download = file.name;
    DOMElements.filePreviewModal.style.display = 'flex';
}

// --- FIX [4]: NOC TRACKER FUNCTIONS ---
async function renderNocLog(jobNo, searchTerm = '') {
    const container = document.getElementById('noc-log-list');
    if (!container) return;
    container.innerHTML = '';
    const siteData = await window.DB.getSiteData(jobNo);
    const nocLog = siteData.nocLog || [];
if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        nocLog = nocLog.filter(noc => 
            (noc.name && noc.name.toLowerCase().includes(lowerSearchTerm)) ||
            (noc.authority && noc.authority.toLowerCase().includes(lowerSearchTerm)) ||
            (noc.status && noc.status.toLowerCase().includes(lowerSearchTerm))
        );
    }
    if (nocLog.length === 0) {
        container.innerHTML = '<p>No NOCs are being tracked for this project.</p>';
        return;
    }

    let tableHtml = `<table class="mom-table"><thead><tr><th>NOC/Permit</th><th>Authority</th><th>Submission Date</th><th>Status</th><th>Attachment</th></tr></thead><tbody>`;
    for (const noc of nocLog) {
        let attachmentLink = 'No file';
        if (noc.fileId) {
            const file = await window.DB.getFileById(noc.fileId);
            if (file) attachmentLink = `<a href="${file.dataUrl}" download="${file.name}">Download</a>`;
        }
        tableHtml += `
            <tr>
                <td>${noc.name}</td>
                <td>${noc.authority}</td>
                <td>${noc.submissionDate}</td>
                <td>
                    <select class="noc-status-select" data-noc-id="${noc.id}">
                        <option value="Pending" ${noc.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Approved" ${noc.status === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Rejected" ${noc.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="Resubmitted" ${noc.status === 'Resubmitted' ? 'selected' : ''}>Resubmitted</option>
                    </select>
                </td>
                <td>${attachmentLink}</td>
            </tr>`;
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

async function handleAddNoc() {
    const jobNo = AppState.currentJobNo;
    if (!jobNo) return;

    const name = document.getElementById('noc-name').value.trim();
    const authority = document.getElementById('noc-authority').value.trim();
    const fileInput = document.getElementById('noc-file-upload');

    if (!name || !authority) {
        alert("Please provide both NOC Name and Authority.");
        return;
    }

    let fileId = null;
    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        const fileRecord = { jobNo, source: 'site', type: 'noc_attachment', name: file.name, fileType: file.type, dataUrl, timestamp: new Date().toISOString() };
        fileId = await window.DB.addFile(fileRecord);
    }
    
    const siteData = await window.DB.getSiteData(jobNo);
    if (!siteData.nocLog) siteData.nocLog = [];
    siteData.nocLog.push({
        id: `NOC-${Date.now()}`,
        name,
        authority,
        fileId,
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
    });

    await window.DB.putSiteData(siteData);
    await renderNocLog(jobNo);
    await renderCalendar(); // Refresh calendar to show new NOC date
    
    // Clear inputs
    document.getElementById('noc-name').value = '';
    document.getElementById('noc-authority').value = '';
    fileInput.value = '';
}

async function handleNocStatusChange(e) {
    if (!e.target.classList.contains('noc-status-select')) return;
    
    const jobNo = AppState.currentJobNo;
    const nocId = e.target.dataset.nocId;
    const newStatus = e.target.value;
    
    const siteData = await window.DB.getSiteData(jobNo);
    const nocItem = siteData.nocLog?.find(n => n.id === nocId);
    
    if (nocItem) {
        nocItem.status = newStatus;
        await window.DB.putSiteData(siteData);
        alert(`NOC status updated to ${newStatus}.`);
    }
}
async function handleReportButtonClick(e) {
    const button = e.target.closest('[data-module]');
    if (!button) return;

    const moduleName = button.dataset.module;
    const jobNo = AppState.currentJobNo;
    if (!jobNo) return alert("Please select a project to generate a report.");

    const siteData = await window.DB.getSiteData(jobNo);
    let htmlContent = '';
    let reportTitle = 'Report';

    switch(moduleName) {
        case 'rfi':
            reportTitle = `RFI Log Report - ${jobNo}`;
            htmlContent = ReportingModule.generateRfiReportHtml(siteData.rfiLog);
            break;
        case 'materials':
            reportTitle = `Material Submittal Report - ${jobNo}`;
            htmlContent = ReportingModule.generateMaterialsReportHtml(siteData.materialLog);
            break;
        case 'mom':
            reportTitle = `Minutes of Meeting Report - ${jobNo}`;
            htmlContent = ReportingModule.generateMomReportHtml(siteData.mom);
            break;
        case 'vendor-management':
             reportTitle = `Assigned Vendors Report - ${jobNo}`;
             htmlContent = ReportingModule.generateVendorManagementReportHtml(siteData.selectedVendors);
             break;
        case 'boq':
            reportTitle = `BOQ Report - ${jobNo}`;
            // This needs a specific generator
            // For now, let's create a placeholder or a simple table
            //htmlContent = `<p>BOQ Report generation placeholder.</p>`;
            htmlContent = ReportingModule.generateBoqReportHtml(siteData.boq); // New function
            break;
        case 'long-lead':
            reportTitle = `Long Lead Items Report - ${jobNo}`;
            // Refactored to get data from the module itself
            const project = await window.DB.getProject(jobNo);
            const schedule = await getProjectSchedule(project, siteData);
            const longLeadItems = LongLeadModule.getReportData(schedule, siteData.boq, siteData.longLeadLog);
            htmlContent = ReportingModule.generateLongLeadReportHtml(longLeadItems);
            break;
        case 'noc':
            reportTitle = `NOC & Permit Report - ${jobNo}`;
            htmlContent = ReportingModule.generateNocReportHtml(siteData.nocLog);
            break;
        case 'bulletin':
            reportTitle = `Site Bulletin Report - ${jobNo}`;
            const bulletins = (await window.DB.getBulletinItems()).filter(b => b.jobNo === jobNo);
            htmlContent = ReportingModule.generateBulletinReportHtml(bulletins);
            break;
    }
    
    ReportingModule.showReportModal(reportTitle, htmlContent);
}
async function handleProjectUpload() {
    if (!AppState.currentJobNo) return alert("Please select a project first.");

    const name = DOMElements.projUploadDocNameInput.value.trim();
    const expiry = DOMElements.projUploadExpiryDate.value;
    const file = DOMElements.projUploadFileInput.files[0];

    if (!name || !file) {
        return alert("Document Name and a File are required.");
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileData = {
            jobNo: AppState.currentJobNo,
            source: 'site',
            type: 'project_upload', // Differentiate from other site docs
            name: `${name} (${file.name})`,
            fileType: file.type,
            dataUrl: e.target.result,
            timestamp: new Date().toISOString()
        };
        if (expiry) {
            fileData.expiryDate = expiry;
        }

        await window.DB.addFile(fileData);
        await renderFileGallery(DOMElements.projectUploadsGallery, 'site', 'project_upload', true);
        await updateDashboardStats(AppState.currentJobNo); // Update expiry count

        // Reset inputs
        DOMElements.projUploadDocNameInput.value = '';
        DOMElements.projUploadExpiryDate.value = '';
        DOMElements.projUploadFileInput.value = '';

        alert("Project document uploaded successfully.");
    };
    reader.readAsDataURL(file);
}