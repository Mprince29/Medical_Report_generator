document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            const logoDiv = document.querySelector('.logo');
            if (logoDiv) {
                // Extract username before @ symbol
                const fullUsername = data.user.username;
                const username = fullUsername.split('@')[0];
                
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info';
                userInfo.textContent = `Welcome, ${username}`;
                logoDiv.appendChild(userInfo);
            }
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        window.location.href = '/login';
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Global variables for state management
let selectedTests = [];

// Fetch the next visit ID from the backend
async function fetchNextVisitId() {
    try {
        const response = await fetch("/api/next-visit-id");
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.nextVisitId) {
            localStorage.setItem('lastVisitId', data.nextVisitId);
            document.getElementById('visitId').value = data.nextVisitId;
        } else {
            console.error("Error: No visit ID received from server");
        }
    } catch (error) {
        console.error("Error fetching next visit ID:", error);
        alert("Failed to fetch next Visit ID. Please refresh or check server logs.");
    }
}

// Initialize the application
function initializeApp() {
    fetchNextVisitId(); // Fetch visit ID from backend

    const visitIdInput = document.getElementById('visitId');
    
    visitIdInput.addEventListener('input', function () {
        const manualValue = this.value.trim().toUpperCase();
        if (manualValue.startsWith('LH') && /^LH\d{4}$/.test(manualValue)) {
            this.classList.remove('invalid');
            localStorage.setItem('lastVisitId', manualValue);
        } else {
            this.classList.add('invalid');
        }
    });

    // Other initializations
    setupDoctorNameHandler();
    initializeTestsSection();
    setupTaxHandlers();
    initializeTestResultsSection();
    populateTestResultsEntry();
}

// Execute initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);


// Handle doctor name formatting
function setupDoctorNameHandler() {
    const doctorInput = document.getElementById('doctorName');
    
    doctorInput.addEventListener('blur', function() {
        if (this.value && !this.value.startsWith('Dr. ')) {
            this.value = 'Dr. ' + this.value;
        }
    });

    doctorInput.addEventListener('focus', function() {
        if (this.value.startsWith('Dr. ')) {
            this.value = this.value.substring(4);
        }
    });
}

// Initialize tests section with scroll functionality
async function fetchAndDisplayTests() {
    try {
        // Add error logging
        console.log('Fetching tests...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/tests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);  // Debug log
        
        if (!data.success || !Array.isArray(data.tests)) {
            throw new Error('Invalid data format received');
        }
        
        renderAvailableTests(data.tests);
        setupSearchFunctionality();
        
    } catch (error) {
        console.error('Error fetching tests:', error);
        const container = document.getElementById('availableTests');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    Error loading tests: ${error.message}
                    Please try refreshing the page or contact support if the problem persists.
                </div>
            `;
        }
    }
}

function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchTests');
    if (!searchInput) {
        console.error('Search input not found');
        return;
    }

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const testItems = document.querySelectorAll('.test-item');
        
        testItems.forEach(item => {
            const testName = item.querySelector('h4').textContent.toLowerCase();
            const category = item.querySelector('.category')?.textContent.toLowerCase() || '';
            const description = item.querySelector('.description')?.textContent.toLowerCase() || '';
            
            if (testName.includes(searchTerm) || 
                category.includes(searchTerm) || 
                description.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Render available tests
function renderAvailableTests(tests) {
    const container = document.getElementById('availableTests');
    if (!container) {
        console.error('Available tests container not found');
        return;
    }
    container.innerHTML = tests.map(test => `
        <div class="test-item" data-test-id="${test.id}">
            <div class="test-info">
                <h4>${test.name}</h4>
                <p class="price">₹${parseFloat(test.price).toFixed(2)}</p>
                <p class="range">Normal Range: ${test.normal_range || 'N/A'}</p>
                <p class="category">Category: ${test.category || 'N/A'}</p>
                <p class="description">${test.description || ''}</p>
            </div>
            <div class="test-actions">
                <button onclick="editTest(${test.id})" class="btn btn-warning">Edit</button>
                <button onclick="selectTest(${test.id})" class="btn btn-primary">Add</button>
            </div>
        </div>
    `).join('');
}
// Function to Open Edit Test Modal
window.editTest = function(testId) {
    const testItem = document.querySelector(`[data-test-id="${testId}"]`);
    if (!testItem) {
        console.error(`Test item with ID ${testId} not found.`);
        return;
    }

    // ✅ Use safe element selection with optional chaining (?.)
    const getText = (selector, prefixToRemove = '') => {
        const element = testItem.querySelector(selector);
        return element ? element.textContent.replace(prefixToRemove, '').trim() : '';
    };

    document.getElementById('editTestId').value = testId;
    document.getElementById('editTestName').value = getText('h4');
    document.getElementById('editTestPrice').value = getText('.price', '₹');
    document.getElementById('editTestRange').value = getText('.range', 'Normal Range:');
    document.getElementById('editTestCategory').value = getText('.category', 'Category:');
    document.getElementById('editTestDescription').value = getText('.description');

    // ✅ Ensure modal exists before modifying classes
    const editModal = document.getElementById('editTestModal');
    if (editModal) {
        editModal.classList.add('visible');
    } else {
        console.error("Edit modal not found.");
    }
};

// Function to Save Edited Test
async function saveEditedTest(event) {
    event.preventDefault();
    const testId = document.getElementById('editTestId').value;
    const updatedTest = {
        name: document.getElementById('editTestName').value,
        price: parseFloat(document.getElementById('editTestPrice').value),
        normal_range: document.getElementById('editTestRange').value,
        category: document.getElementById('editTestCategory').value,
        description: document.getElementById('editTestDescription').value
    };
    
    const response = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTest)
    });
    
    if (response.ok) {
        alert('Test updated successfully!');
        document.getElementById('editTestModal').classList.remove('visible');
        fetchAndDisplayTests();
    } else {
        alert('Error updating test');
    }
}

document.getElementById('editTestForm').addEventListener('submit', saveEditedTest);

window.selectTest = function(testId) {
    const testItem = document.querySelector(`[data-test-id="${testId}"]`);
    const selectedContainer = document.getElementById('selectedTests');

    // ✅ Check if testItem exists before proceeding
    if (!testItem) {
        console.error(`Test item with ID ${testId} not found.`);
        return;
    }

    // ✅ Prevent duplicate selection
    if (selectedContainer.querySelector(`[data-test-id="${testId}"]`)) return;

    const clonedItem = testItem.cloneNode(true);
    clonedItem.classList.add('selected');
    clonedItem.setAttribute("data-test-id", testId); // Ensure data-test-id is preserved

    // ✅ Replace add button with remove button safely
    const actionContainer = clonedItem.querySelector('.test-actions');
    if (actionContainer) {
        actionContainer.innerHTML = `
            <button onclick="removeTest('${testId}')" class="btn btn-secondary">
                <i class="fas fa-minus"></i>
            </button>
        `;
    } else {
        console.error(`Action container not found for test ID ${testId}`);
    }

    selectedContainer.appendChild(clonedItem);

    // ✅ Ensure dependent functions exist before calling
    if (typeof calculateTotal === "function") calculateTotal();
    if (typeof calculateTaxes === "function") calculateTaxes();
    if (typeof populateTestResultsEntry === "function") populateTestResultsEntry();
};

function populateTestResultsEntry() {
    const selectedTestsContainer = document.getElementById('selectedTests');
    const testResultsContainer = document.getElementById('selectedTestResultsContainer');

    // Clear previous results
    testResultsContainer.innerHTML = '';

    const selectedTestElements = selectedTestsContainer.querySelectorAll('.test-item');

    if (selectedTestElements.length === 0) {
        testResultsContainer.innerHTML = '<p>No tests selected. Please add tests first.</p>';
        return;
    }

    // Iterate through selected tests and create input fields for results
    selectedTestElements.forEach(element => {
        const test = {
            id: element.getAttribute('data-test-id'),
            name: element.querySelector('h4').textContent,
            range: element.querySelector('.range').textContent
        };

        const testResultRow = createTestResultInputRow(test);
        testResultsContainer.appendChild(testResultRow);
    });
}


window.removeTest = function(testId) {
    const selectedContainer = document.getElementById('selectedTests');
    
    if (!selectedContainer) {
        console.error("Error: Selected tests container not found.");
        return;
    }

    const testItem = selectedContainer.querySelector(`[data-test-id="${testId}"]`);

    if (testItem) {
        testItem.remove();

        // ✅ Ensure functions exist before calling them
        if (typeof calculateTotal === "function") calculateTotal();
        if (typeof calculateTaxes === "function") calculateTaxes();
        if (typeof populateTestResultsEntry === "function") populateTestResultsEntry();
        
        console.log(`Test ID ${testId} removed successfully.`);
    } else {
        console.error(`Error: Test with ID ${testId} not found.`);
    }
};

// Setup tax calculation handlers
function setupTaxHandlers() {
    document.getElementById('cgstInput').addEventListener('input', calculateTaxes);
    document.getElementById('sgstInput').addEventListener('input', calculateTaxes);
    document.getElementById('igstInput').addEventListener('input', calculateTaxes);
    document.getElementById('discountInput').addEventListener('input', calculateTaxes);
    
};

function calculateTotal() {
    const selectedTests = document.getElementById('selectedTests').querySelectorAll('.test-item');
    let total = 0;
    
    selectedTests.forEach(test => {
        const price = parseFloat(test.querySelector('.price').textContent.replace('₹', ''));
        total += price;
    });
    
    document.getElementById('subtotalAmount').textContent = `₹${total.toFixed(2)}`;
    calculateTaxes(); // Recalculate taxes when tests change
}

// Calculate taxes with animation

function calculateTaxes() {
    const subtotalElement = document.getElementById('subtotalAmount');
    const cgstInput = document.getElementById('cgstInput');
    const sgstInput = document.getElementById('sgstInput');
    const igstInput = document.getElementById('igstInput');
    const discountInput = document.getElementById('discountInput');

    if (!subtotalElement || !cgstInput || !sgstInput || !igstInput || !discountInput) {
        console.error("Billing elements not found in the DOM");
        return;
    }

    const subtotal = parseFloat(subtotalElement.textContent.replace('₹', '')) || 0;
    const discount = (subtotal * (parseFloat(discountInput.value) || 0)) / 100;
    const discountedSubtotal = subtotal - discount;

    const cgstRate = parseFloat(cgstInput.value) || 0;
    const sgstRate = parseFloat(sgstInput.value) || 0;
    const igstRate = parseFloat(igstInput.value) || 0;

    const cgstAmount = (discountedSubtotal * cgstRate) / 100;
    const sgstAmount = (discountedSubtotal * sgstRate) / 100;
    const igstAmount = (discountedSubtotal * igstRate) / 100;

    document.getElementById('cgstAmount').textContent = `₹${cgstAmount.toFixed(2)}`;
    document.getElementById('sgstAmount').textContent = `₹${sgstAmount.toFixed(2)}`;
    document.getElementById('igstAmount').textContent = `₹${igstAmount.toFixed(2)}`;

    const grandTotal = discountedSubtotal + cgstAmount + sgstAmount + igstAmount;
    document.getElementById('grandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
}



// function to save the patient entry
async function savePatientEntry() {
    const patientData = {
        visitId: document.getElementById('visitId').value,
        patientName: document.getElementById('patientName').value,
        age: parseInt(document.getElementById('patientAge').value) || 0,
        gender: document.getElementById('patientGender').value,
        contactNumber: document.getElementById('contactNumber').value,
        doctorName: document.getElementById('doctorName').value,
        reportedDate: document.getElementById('reportedDate').value,
        collectionDate: document.getElementById('collectionDate').value,
        selectedTests: [...document.querySelectorAll('#selectedTests .test-item')].map(item => ({
            id: item.dataset.testId,
            name: item.querySelector('h4').textContent
        }))
    };

    try {
        const response = await fetch("/api/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patientData)
        });

        const data = await response.json();

        if (data.success) {
            alert("Patient entry saved successfully!");

            // ✅ Instead of reloading, manually update the PDF preview
            updatePDFPreview(patientData.visitId);
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error("Error saving patient entry:", error);
        alert("Error saving patient entry");
    }
}

// ✅ Function to Update the PDF Preview Without Reloading
async function updatePDFPreview(visitId) {
    const pdfFrame = document.getElementById("pdfPreview");
    if (pdfFrame) {
        pdfFrame.src = `/api/get-report/${visitId}?timestamp=${new Date().getTime()}`;
    }
}


function getTestResults() {
    const testResultRows = document.querySelectorAll('.test-result-input-row');
    const testResults = [];

    testResultRows.forEach(row => {
        const testId = row.dataset.testId;
        const testName = row.querySelector('.test-result-label').textContent;
        const resultInput = row.querySelector('.test-result-value');
        const statusElement = row.querySelector('.test-result-status');

        const resultValue = parseFloat(resultInput.value);
        const resultStatus = statusElement.textContent.trim();

        if (!isNaN(resultValue) && resultStatus) {
            testResults.push({
                testId, testName, resultValue, resultStatus
            });
        }
    });
    return testResults;
}

// Remove the event listener for the old separate test results save button
const saveTestResultsBtn = document.getElementById('saveTestResults');
if (saveTestResultsBtn) {
    saveTestResultsBtn.remove();
}

// Update event listener to save everything together
document.getElementById('saveEntry').addEventListener('click', savePatientEntry);

function getSelectedTests() {
    const selectedTestElements = document.getElementById('selectedTests').querySelectorAll('.test-item');
    return Array.from(selectedTestElements).map(element => ({
        id: element.dataset.testId,
        name: element.querySelector('h4').textContent,
        price: parseFloat(element.querySelector('.price').textContent.replace('₹', ''))
    }));
}


function initializeTestResultsSection() {
    const testResultsContainer = document.getElementById('selectedTestResultsContainer');
  
    // Clear any existing test result rows
    testResultsContainer.innerHTML = '';
  
    // Get the selected tests
    const selectedTests = document.querySelectorAll('#selectedTests .test-item');
  
    if (selectedTests.length === 0) {
      testResultsContainer.innerHTML = '<p>No tests selected. Please add tests first.</p>';
      return;
    }
  
    // Create a row for each selected test
    selectedTests.forEach(test => {
      const testId = test.getAttribute('data-test-id');
      const testName = test.querySelector('h4').textContent;
      const testRange = test.querySelector('.range').textContent;
  
      const testResultRow = createTestResultInputRow({
        id: testId,
        name: testName,
        range: testRange
      });
  
      testResultsContainer.appendChild(testResultRow);
    });
  }

  function createTestResultInputRow(test) {
    const row = document.createElement('div');
    row.className = 'test-result-input-row';
    row.dataset.testId = test.id;

    // Extract numeric range (Assumes format "X-Y")
    const rangeMatch = test.range.match(/([\d.]+)-([\d.]+)/);
    const minRange = rangeMatch ? parseFloat(rangeMatch[1]) : null;
    const maxRange = rangeMatch ? parseFloat(rangeMatch[2]) : null;

    row.innerHTML = `
        <div class="test-result-label">${test.name}</div>
        <div class="test-result-range">Range: ${test.range}</div>
        <div class="test-result-input">
            <input 
                type="number" 
                class="test-result-value" 
                placeholder="Enter Result"
                data-test-id="${test.id}"
            >
            <div class="test-result-status"></div>
        </div>
    `;

    const input = row.querySelector('.test-result-value');
    const statusElement = row.querySelector('.test-result-status');

    input.addEventListener('input', function() {
        const value = parseFloat(this.value);

        if (isNaN(value)) {
            statusElement.textContent = '';
            statusElement.className = 'test-result-status';
            return;
        }

        if (minRange !== null && value < minRange) {
            statusElement.textContent = 'Low';
            statusElement.className = 'test-result-status result-low';
        } else if (maxRange !== null && value > maxRange) {
            statusElement.textContent = 'High';
            statusElement.className = 'test-result-status result-high';
        } else {
            statusElement.textContent = 'Normal';
            statusElement.className = 'test-result-status result-normal';
        }
    });

    return row;
}

async function initializeTestsSection(retryCount = 3) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            // Check for token
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/tests', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            // Handle different HTTP status codes
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 503) {
                throw new Error('Database connection unavailable. Retrying...');
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success || !Array.isArray(data.tests)) {
                throw new Error('Invalid data format received from server');
            }

            // Clear any existing error messages
            const container = document.getElementById('availableTests');
            if (container) {
                container.innerHTML = '';
            }

            renderAvailableTests(data.tests);
            setupSearchFunctionality();
            return; // Success - exit the retry loop

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            
            // If this was our last attempt, show the error to the user
            if (attempt === retryCount) {
                const container = document.getElementById('availableTests');
                if (container) {
                    container.innerHTML = `
                        <div class="error-message">
                            <p>Error loading tests: ${error.message}</p>
                            <p>Please try refreshing the page or contact support if the problem persists.</p>
                            <button onclick="initializeTestsSection()" class="retry-button">
                                Retry Loading Tests
                            </button>
                        </div>
                    `;
                }
            } else {
                // Wait before retrying
                await delay(1000 * attempt); // Exponential backoff
                continue;
            }
        }
    }
}
const style = document.createElement('style');
style.textContent = `
    .retry-button {
        margin-top: 10px;
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .retry-button:hover {
        background-color: #45a049;
    }
    .error-message {
        padding: 20px;
        background-color: #fff3f3;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        text-align: center;
    }
`;
document.head.appendChild(style);

function generateVisitId() {
    const lastVisitId = localStorage.getItem('lastVisitId') || 'LH1000';
    const numericPart = parseInt(lastVisitId.replace('LH', ''), 10) + 1;
    const newVisitId = `LH${numericPart}`;
    localStorage.setItem('lastVisitId', newVisitId);
    return newVisitId;
}


function resetForm() {
    document.getElementById('patientName').value = "";
    document.getElementById('patientAge').value = "";
    document.getElementById('patientGender').value = "";
    document.getElementById('contactNumber').value = "";
    document.getElementById('doctorName').value = "";
    document.getElementById('reportedDate').value = "";
    document.getElementById('collectionDate').value = "";

    document.getElementById('selectedTests').innerHTML = "";
    document.getElementById('selectedTestResultsContainer').innerHTML = "";
    
    document.getElementById('subtotalAmount').textContent = "₹0.00";
    document.getElementById('discountInput').value = "0";
    document.getElementById('cgstInput').value = "0";
    document.getElementById('sgstInput').value = "0";
    document.getElementById('igstInput').value = "0";
    document.getElementById('grandTotal').textContent = "₹0.00";

    fetchNextVisitId();  // ✅ Fetch new Visit ID from backend
}

// Add event listener to the save button
document.getElementById('saveEntry').addEventListener('click', savePatientEntry);



// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeApp);

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Remove active class from all nav items and sections
            navItems.forEach(ni => ni.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked nav item and corresponding section
            this.classList.add('active');
            document.getElementById(sectionId)?.classList.add('active');
        });
    });
    
    initializeApp();
});

// Constants and Configuration
const CONFIG = {
    VISIT_ID_PATTERN: /^LH\d{4}$/,
    ITEMS_PER_PAGE: 10,
    DATE_FORMAT: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }
};
async function fetchReports(searchTerm = "") {
    try {
      const response = await fetch(`/api/reports?q=${encodeURIComponent(searchTerm)}`);
      const reports = await response.json();
  
      renderReports(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      showErrorNotification("Unable to fetch reports. Please try again.");
    }
  }
  
  function renderReports(reports) {
    const reportsGrid = document.getElementById("reportsGrid");
    reportsGrid.innerHTML = "";
  
    if (reports.length === 0) {
      reportsGrid.innerHTML = `
        <div class="no-reports-message">
          <i class="fas fa-file-medical-alt"></i>
          <p>No reports found</p>
        </div>
      `;
      return;
    }
  
    reports.forEach((report, index) => {
      const reportItem = document.createElement("div");
      reportItem.className = "report-item card-animate";
      reportItem.style.animationDelay = `${index * 0.1}s`; // Staggered animation
      reportItem.innerHTML = `
        <div class="report-header">
          <div class="visit-id">
            <i class="fas fa-file-alt"></i>
            <a href="#" class="view-report" data-visit-id="${report.visit_id}">${report.visit_id}</a>
          </div>
          <div class="patient-info">
            <span class="patient-name">${report.patient_name}</span>
          </div>
        </div>
        <div class="report-actions">
          <button class="btn btn-primary edit-report" data-visit-id="${report.visit_id}">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      `;
  
      reportsGrid.appendChild(reportItem);
    });
  
    setupReportEventListeners();
  }
  
  function setupReportEventListeners() {
    document.querySelectorAll(".view-report").forEach(link => {
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        const visitId = e.target.dataset.visitId;
        showReportDetails(visitId);
      });
    });
  
    document.querySelectorAll(".edit-report").forEach(button => {
      button.addEventListener("click", async (e) => {
        const visitId = e.target.closest('.edit-report').dataset.visitId;
        showEditReportPopup(visitId);
      });
    });
  }
  
  async function showReportDetails(visitId) {
    try {
        const response = await fetch(`/api/report/${visitId}`);
        const report = await response.json();

        if (report.error) {
            showErrorNotification("Error fetching report details: " + report.error);
            return;
        }

        // Ensure test_results is an array before using map
        const testResults = Array.isArray(report.test_results) ? report.test_results : [];

        const detailsModal = document.createElement("div");
        detailsModal.className = "modal-overlay visible";
        detailsModal.innerHTML = `
            <div class="full-report-modal">
                <h2>Report Details</h2>
                <p>Visit ID: ${report.visit_id}</p>
                <p>Patient Name: ${report.patient_name}</p>
                <p>Doctor: ${report.doctor_name}</p>
                <h3>Test Results</h3>
                <ul>
                    ${testResults.length > 0 
                        ? testResults.map(tr => `<li>${tr.test_name}: ${tr.result_value} (${tr.result_status})</li>`).join('')
                        : "<li>No test results found</li>"}
                </ul>
                <button class="close-modal">Close</button>
            </div>
        `;

        document.body.appendChild(detailsModal);

        detailsModal.querySelector('.close-modal').addEventListener('click', () => {
            detailsModal.remove();
        });

    } catch (error) {
        console.error("Error fetching report details:", error);
        showErrorNotification("Unable to fetch report details");
    }
}

  
async function showEditReportPopup(visitId) {
    try {
        const response = await fetch(`/api/report/${visitId}`);
        const report = await response.json();

        if (report.error) {
            showErrorNotification("Error fetching report details: " + report.error);
            return;
        }

        const editModal = document.createElement("div");
        editModal.className = "modal-overlay visible";
        editModal.innerHTML = `
            <div class="full-report-modal animate__animated animate__slideInUp">
                <div class="modal-header">
                    <h2>Edit Report</h2>
                    <button class="close-modal btn btn-secondary">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="editReportForm" class="edit-report-form">
                        <div class="form-grid">
                            <div class="form-group"><label>Patient Name</label><input type="text" name="patientName" value="${report.patient_name}" required></div>
                            <div class="form-group"><label>Age</label><input type="number" name="age" value="${report.age}" required></div>
                            <div class="form-group"><label>Gender</label><select name="gender"><option value="M" ${report.gender === "M" ? "selected" : ""}>Male</option><option value="F" ${report.gender === "F" ? "selected" : ""}>Female</option></select></div>
                            <div class="form-group"><label>Doctor Name</label><input type="text" name="doctorName" value="${report.doctor_name}" required></div>
                        </div>
                        <h3>Edit Test Results</h3>
                        <div class="test-edit-section">
                            ${report.test_results.map(tr => `
                                <div class="test-edit-row">
                                    <label>${tr.test_name}</label>
                                    <input type="number" name="testResults[${tr.test_id}]" value="${tr.result_value}" required>
                                    <span class="status">(${tr.result_status})</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
                            <button type="button" class="btn btn-secondary close-modal"><i class="fas fa-times"></i> Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(editModal);

        editModal.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                editModal.classList.remove('visible');
                setTimeout(() => document.body.removeChild(editModal), 300);
            });
        });

        document.getElementById("editReportForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData.entries());
        
            // Ensure `contactNumber` exists before using `.trim()`
            updatedData.contactNumber = updatedData.contactNumber ? updatedData.contactNumber.trim() : "N/A"; 
            updatedData.reportedDate = updatedData.reportedDate || new Date().toISOString().split("T")[0];
            updatedData.collectionDate = updatedData.collectionDate || new Date().toISOString().split("T")[0];
        
            try {
                const updateResponse = await fetch(`/api/report/${updatedData.visitId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });
        
                const result = await updateResponse.json();
        
                if (result.success) {
                    showSuccessNotification("Report updated successfully");
                    document.querySelector(".modal-overlay").remove();
                    fetchReports();
                } else {
                    showErrorNotification("Error updating report: " + result.error);
                }
            } catch (error) {
                console.error("Error updating report:", error);
                showErrorNotification("Unable to update report");
            }
        });
        
        
    } catch (error) {
        console.error("Error fetching report details:", error);
        showErrorNotification("Unable to fetch report details");
    }
}

  // Helper notification functions
  function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }, 10);
  }
  
  function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }, 10);
  }
  
  // Search reports by Visit ID or Patient Name
  document.getElementById("searchReports").addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    fetchReports(searchTerm);
  });
  
  // Initial report load
  fetchReports();

  function editTestV2(testId) {
    const testItem = document.querySelector(`[data-test-id="${testId}"]`);
    if (!testItem) {
        console.error("Test item not found.");
        return;
    }

    // Ensure the modal elements exist
    const modal = document.getElementById('editTestModal');
    if (!modal) {
        console.error("Edit test modal not found.");
        return;
    }

    document.getElementById('editTestId').value = testId;
    document.getElementById('editTestName').value = testItem.querySelector('h4').textContent;
    document.getElementById('editTestPrice').value = testItem.querySelector('.price').textContent.replace('₹', '');
    document.getElementById('editTestRange').value = testItem.querySelector('.range').textContent.replace('Normal Range: ', '');
    document.getElementById('editTestCategory').value = testItem.querySelector('.category').textContent.replace('Category: ', '');
    document.getElementById('editTestDescription').value = testItem.querySelector('.description').textContent;

    modal.classList.add('visible'); // Show the modal
}

// Close modal function
window.closeEditModal = function() {
    const modal = document.getElementById('editTestModal');
    if (modal) {
        modal.classList.remove('visible');
    } else {
        console.error("Error: Edit Test Modal not found.");
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const editForm = document.getElementById("editTestForm");
    
    if (editForm) {
        editForm.addEventListener("submit", function(event) {
            event.preventDefault();  // ✅ Prevent default form submission
            saveEditedTest();
        });
    } else {
        console.error("Error: Edit Test Form not found.");
    }

    // ✅ Add event listener to close modal button
    document.addEventListener("DOMContentLoaded", function () {
        setTimeout(() => {
            const closeModalBtns = document.querySelectorAll(".close-edit-modal-btn");
            if (closeModalBtns.length > 0) {
                closeModalBtns.forEach(button => button.addEventListener("click", closeEditModal));
            } else {
                console.error("Error: Close modal button not found. Make sure it exists in the HTML.");
            }
        }, 500); // ✅ Waits 500ms for elements to load
    });
    
    window.closeEditModal = function() {
        const modal = document.getElementById('editTestModal');
        if (modal) {
            modal.classList.remove('visible');
        } else {
            console.error("Error: Edit Test Modal not found.");
        }
    };
    
});

// Function to generate PDF medical report
async function generatePDFReport(visitId) {
    try {
        console.log("Fetching report for visit ID:", visitId);

        const response = await fetch(`/api/report/${visitId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch report from server: ${response.statusText}`);
        }

        const report = await response.json();
        console.log("Report received:", report);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            format: 'a4',
            unit: 'mm'
        });

        if (window.jspdfAutoTable) {
            doc.autoTable = window.jspdfAutoTable;
        }

        // Set default font to avoid character encoding issues
        doc.setFont("helvetica");

        function formatDate(dateString) {
            if (!dateString) return "N/A";
            return new Date(dateString).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            });
        }

        // New currency formatter that handles string cleaning
        function formatCurrency(value) {
            // Remove any non-numeric characters except decimal point
            const cleanValue = String(value).replace(/[^\d.-]/g, '');
            const amount = parseFloat(cleanValue || 0);
            
            // Format number with thousand separator and two decimal places
            const formattedNumber = amount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            // Manually add the rupee symbol as plain text
            return `Rs. ${formattedNumber}`;
        }

        // Header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const title = "MODERN Diagnostic & Research Centre";
        const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
        const titleX = (doc.internal.pageSize.width - titleWidth) / 2;
        doc.text(title, titleX, 20);

        doc.setFontSize(12);
        doc.setFont("helvetica", "italic");
        const subtitle = "Quality • Compassion • Trust";
        const subtitleWidth = doc.getStringUnitWidth(subtitle) * doc.getFontSize() / doc.internal.scaleFactor;
        const subtitleX = (doc.internal.pageSize.width - subtitleWidth) / 2;
        doc.text(subtitle, subtitleX, 27);

        // Add horizontal line
        const pageWidth = doc.internal.pageSize.width;
        doc.setLineWidth(0.5);
        doc.line(10, 32, pageWidth - 10, 32);

        // Patient Information
        let yOffset = 40;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Left column
        doc.text(`Visit ID: ${report.visit_id}`, 15, yOffset);
        doc.text(`Patient Name: ${report.patient_name}`, 15, yOffset + 7);
        doc.text(`Age: ${report.age} | Gender: ${report.gender === 'M' ? 'Male' : 'Female'}`, 15, yOffset + 14);

        // Right column
        doc.text(`Doctor: ${report.doctor_name}`, pageWidth / 2, yOffset);
        doc.text(`Collected: ${formatDate(report.collection_date)}`, pageWidth / 2, yOffset + 7);
        doc.text(`Reported: ${formatDate(report.reported_date)}`, pageWidth / 2, yOffset + 14);

        // Line after patient info
        yOffset += 25;
        doc.line(10, yOffset, pageWidth - 10, yOffset);

        // Test Results
        yOffset += 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Test Results", 15, yOffset);
        yOffset += 5;

        const testResultsTable = report.test_results.map(tr => [
            tr.test_name,
            parseFloat(tr.result_value).toFixed(2),
            tr.reference_range || "Not Available",  // No need to check `.trim()`
            tr.unit || "-" // Avoids empty values
        ]);
               

        doc.autoTable({
            startY: yOffset,
            head: [["Test Name", "Result", "Reference Range", "Unit"]],
            body: testResultsTable,
            theme: 'grid',
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 5
            },
            headStyles: {
                fillColor: [70, 70, 70],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 40, halign: 'center' },
                3: { cellWidth: 30, halign: 'center' }
            }
        });

        // Billing Summary
        yOffset = doc.autoTable.previous.finalY + 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Billing Summary", 15, yOffset);
        yOffset += 5;

        // Format billing data
        const billingData = [
            [
                formatCurrency(report.billing.subtotal),
                `${parseFloat(report.billing.discount_percentage || 0).toFixed(2)}%`,
                formatCurrency(report.billing.cgst_rate),
                formatCurrency(report.billing.sgst_rate),
                formatCurrency(report.billing.igst_rate),
                formatCurrency(report.billing.grand_total)
            ]
        ];

        doc.autoTable({
            startY: yOffset,
            head: [["Subtotal", "Discount (%)", "CGST", "SGST", "IGST", "Grand Total"]],
            body: billingData,
            theme: 'grid',
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 5
            },
            headStyles: {
                fillColor: [70, 70, 70],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { halign: 'right' },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        doc.save(`Medical_Report_${report.visit_id}.pdf`);

    } catch (error) {
        console.error("Error generating PDF report:", error);
        throw error;
    }
}
// Add PDF button to View Reports section
document.addEventListener("DOMContentLoaded", () => {
    const reportsGrid = document.getElementById("reportsGrid");
    if (!reportsGrid) return;

    reportsGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("download-pdf")) {
            const visitId = e.target.dataset.visitId;
            generatePDFReport(visitId);
        }
    });

    // Add download buttons dynamically
    setTimeout(() => {
        document.querySelectorAll(".report-item").forEach(item => {
            const visitId = item.querySelector(".view-report").dataset.visitId;
            if (!item.querySelector(".download-pdf")) {
                const button = document.createElement("button");
                button.classList.add("btn", "btn-secondary", "download-pdf");
                button.dataset.visitId = visitId;
                button.innerHTML = '<i class="fas fa-download"></i> Download PDF';
                item.querySelector(".report-actions").appendChild(button);
            }
        });
    }, 500);
});
