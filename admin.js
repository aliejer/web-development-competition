// Authentication Check
if (
  sessionStorage.getItem("omisLoggedIn") !== "true" &&
  sessionStorage.getItem("omisAdminLoggedIn") !== "true"
) {
  window.location.replace("login.html");
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "omis_student_requests_v1";
const NOTIFICATION_KEY = "omis_student_notifications_v1";
const AUDIT_KEY = "omis_admin_audit_log_v1";

const initialRequests = [
  {
    id: "OM-2026-0018",
    studentName: "Blando Bryan",
    studentNumber: "2024-07868-MN-0",
    document: "Certificate of Enrollment",
    date: "Oct 20, 2026",
    status: "Under Review",
    purpose: "Scholarship application",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "",
  },
  {
    id: "OM-2026-0015",
    studentName: "Blando Bryan",
    studentNumber: "2024-07868-MN-0",
    document: "Transcript of Records",
    date: "Oct 18, 2026",
    status: "Approved",
    purpose: "Personal academic records",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "Approved by Registrar. Processing official dry seal.",
  },
  {
    id: "OM-2026-0011",
    studentName: "Blando Bryan",
    studentNumber: "2024-07868-MN-0",
    document: "Certificate of Good Moral",
    date: "Oct 12, 2026",
    status: "Ready for Pickup",
    purpose: "Internship application",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "Ready at Registrar Window 3. Please bring student ID.",
  },
  {
    id: "OM-2026-0009",
    studentName: "Blando Bryan",
    studentNumber: "2024-07868-MN-0",
    document: "Certificate of Grades",
    date: "Oct 08, 2026",
    status: "Completed",
    purpose: "Personal reference",
    copies: "1",
    semester: "First Semester",
    delivery: "Digital copy",
    notes: "Digital copy transmitted to student email.",
  },
  {
    id: "OM-2026-0006",
    studentName: "Blando Bryan",
    studentNumber: "2024-07868-MN-0",
    document: "Certificate of Enrollment",
    date: "Oct 02, 2026",
    status: "Rejected",
    purpose: "Academic records",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "Please verify the requested semester with department head.",
  },
];

function loadData(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

let requests = loadData(STORAGE_KEY, initialRequests);
let notifications = loadData(NOTIFICATION_KEY, []);
let auditLog = loadData(AUDIT_KEY, [
  {
    id: 1,
    action: "System initialized with current request records.",
    time: "Just now",
  },
]);

let activeEditingRequestId = null;
let toastTimer;

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog));
  } catch {
    showToast("Unable to save data in this browser.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status) {
  const classes = {
    "Under Review": "status-review",
    Pending: "status-pending",
    Approved: "status-approved",
    "Ready for Pickup": "status-ready",
    Completed: "status-completed",
    Rejected: "status-rejected",
  };
  return classes[status] || "status-pending";
}

function statusBadge(status) {
  return `<span class="status-badge ${statusClass(status)}">
    <span class="status-dot"></span>${escapeHTML(status)}
  </span>`;
}

// Add an audit log entry
function addAuditEntry(actionText) {
  auditLog.unshift({
    id: Date.now(),
    action: actionText,
    time: formatCurrentTime(),
  });
  if (auditLog.length > 25) auditLog.pop();
  saveData();
  renderAuditLog();
}

// Add a notification for the student
function notifyStudent(title, message) {
  notifications.unshift({
    id: Date.now(),
    title,
    message,
    date: "Just now",
    read: false,
  });
  saveData();
}

// Modify Request Status
function updateRequestStatus(id, newStatus, remarks = "", shouldNotify = true) {
  const requestIndex = requests.findIndex((item) => item.id === id);
  if (requestIndex === -1) return false;

  const oldStatus = requests[requestIndex].status;
  requests[requestIndex].status = newStatus;
  if (remarks !== undefined && remarks !== null) {
    requests[requestIndex].notes = remarks;
  }

  // Audit entry
  addAuditEntry(
    `Modified <strong>${escapeHTML(id)}</strong> status from <em>${escapeHTML(oldStatus)}</em> to <strong>${escapeHTML(newStatus)}</strong>`,
  );

  // Notify student
  if (shouldNotify) {
    let notifTitle = `Request ${newStatus}`;
    let notifMsg = `Your ${requests[requestIndex].document} (${id}) status was updated to "${newStatus}".`;

    if (newStatus === "Approved") {
      notifTitle = "Document Approved";
      notifMsg = `Your ${requests[requestIndex].document} has been approved by the registrar. ${remarks ? "Remarks: " + remarks : ""}`;
    } else if (newStatus === "Ready for Pickup") {
      notifTitle = "Document Ready for Claim";
      notifMsg = `Your ${requests[requestIndex].document} is ready for pickup! ${remarks ? remarks : "Please visit the registrar office with your student ID."}`;
    } else if (newStatus === "Rejected") {
      notifTitle = "Request Requires Attention";
      notifMsg = `Your request for ${requests[requestIndex].document} was rejected. ${remarks ? "Reason: " + remarks : "Please contact the registrar."}`;
    } else if (newStatus === "Completed") {
      notifTitle = "Request Completed";
      notifMsg = `Your ${requests[requestIndex].document} request has been fulfilled and completed.`;
    }

    notifyStudent(notifTitle, notifMsg.trim());
  }

  saveData();
  renderAll();
  showToast(`Updated ${id} status to ${newStatus}`);
  return true;
}

// Render Dashboard Counters
function renderStats() {
  const count = (statuses) =>
    requests.filter((r) => statuses.includes(r.status)).length;

  const total = requests.length;
  const pending = count(["Pending", "Under Review"]);
  const approved = count(["Approved"]);
  const ready = count(["Ready for Pickup", "Completed"]);
  const rejected = count(["Rejected"]);

  if ($("#totalCount")) $("#totalCount").textContent = String(total).padStart(2, "0");
  if ($("#pendingCount")) $("#pendingCount").textContent = String(pending).padStart(2, "0");
  if ($("#approvedCount")) $("#approvedCount").textContent = String(approved).padStart(2, "0");
  if ($("#readyCount")) $("#readyCount").textContent = String(ready).padStart(2, "0");
  if ($("#rejectedCount")) $("#rejectedCount").textContent = String(rejected).padStart(2, "0");
  if ($("#tableRecordCount")) $("#tableRecordCount").textContent = `${total} requests`;
}

// Generate Admin Table Row
function adminRequestRow(request) {
  const student = request.studentName || "Blando Bryan";
  const studentNum = request.studentNumber || "2024-07868-MN-0";

  return `
    <tr data-row-id="${escapeHTML(request.id)}">
      <td>
        <input type="checkbox" class="row-checkbox" value="${escapeHTML(request.id)}" aria-label="Select ${escapeHTML(request.id)}" />
      </td>
      <td>
        <div class="document-cell">
          <div class="document-icon">▤</div>
          <div>
            <strong>${escapeHTML(request.id)}</strong>
            <span class="student-tag">${escapeHTML(student)} · ${escapeHTML(studentNum)}</span>
          </div>
        </div>
      </td>
      <td>
        <strong>${escapeHTML(request.document)}</strong>
        <div style="color: #727488; font-size: 10px;">${escapeHTML(request.copies || "1")} copy · ${escapeHTML(request.delivery || "School pickup")}</div>
      </td>
      <td style="max-width: 180px;">
        <span style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(request.purpose || 'None')}">
          ${escapeHTML(request.purpose || "Academic records")}
        </span>
        ${request.notes ? `<span style="display: block; font-size: 10px; color: #85879a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(request.notes)}">Note: ${escapeHTML(request.notes)}</span>` : ""}
      </td>
      <td class="date-cell">${escapeHTML(request.date)}</td>
      <td>
        ${statusBadge(request.status)}
      </td>
      <td>
        <div class="status-select-wrap">
          <select class="inline-status-select" data-status="${escapeHTML(request.status)}" data-request-id="${escapeHTML(request.id)}" aria-label="Quick update status">
            <option value="Pending" ${request.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Under Review" ${request.status === "Under Review" ? "selected" : ""}>Under Review</option>
            <option value="Approved" ${request.status === "Approved" ? "selected" : ""}>Approved</option>
            <option value="Ready for Pickup" ${request.status === "Ready for Pickup" ? "selected" : ""}>Ready for Pickup</option>
            <option value="Completed" ${request.status === "Completed" ? "selected" : ""}>Completed</option>
            <option value="Rejected" ${request.status === "Rejected" ? "selected" : ""}>Rejected</option>
          </select>
        </div>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-manage" data-manage-id="${escapeHTML(request.id)}" title="Modify status and add remarks">
          ⚙ Modify Status
        </button>
      </td>
    </tr>
  `;
}

function emptyAdminRow() {
  return `<tr><td colspan="8">
    <div class="empty-state">
      <strong>No document requests match your criteria</strong>
      <span>Try resetting the status filter or search query.</span>
    </div>
  </td></tr>`;
}

// Render Requests Table
function renderRequestsTable() {
  const query = $("#adminSearchInput") ? $("#adminSearchInput").value.trim().toLowerCase() : "";
  const statusFilter = $("#adminStatusFilter") ? $("#adminStatusFilter").value : "All";
  const docFilter = $("#adminDocFilter") ? $("#adminDocFilter").value : "All";
  const sortBy = $("#adminSortBy") ? $("#adminSortBy").value : "newest";

  let filtered = requests.filter((req) => {
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    const matchesDoc = docFilter === "All" || req.document === docFilter;
    const searchTarget = `${req.id} ${req.document} ${req.status} ${req.purpose || ""} ${req.notes || ""} ${req.studentName || ""} ${req.studentNumber || ""}`.toLowerCase();
    const matchesSearch = !query || searchTarget.includes(query);

    return matchesStatus && matchesDoc && matchesSearch;
  });

  if (sortBy === "oldest") {
    filtered = [...filtered].reverse();
  }

  const tbody = $("#adminRequestsTable");
  if (tbody) {
    tbody.innerHTML = filtered.length
      ? filtered.map(adminRequestRow).join("")
      : emptyAdminRow();
  }

  // Update showing count
  if ($("#filterResultsCount")) {
    $("#filterResultsCount").textContent = `Showing ${filtered.length} of ${requests.length}`;
  }

  updateBulkBar();
}

// Render Audit Log
function renderAuditLog() {
  const container = $("#auditLogList");
  if (!container) return;

  if (!auditLog.length) {
    container.innerHTML = `<div style="color: var(--muted); padding: 10px;">No actions recorded yet in this session.</div>`;
    return;
  }

  container.innerHTML = auditLog
    .map(
      (entry) => `
    <div class="audit-item">
      <div class="audit-icon">✓</div>
      <div class="audit-content">
        <div>${entry.action}</div>
        <div class="audit-time">${entry.time}</div>
      </div>
    </div>
  `,
    )
    .join("");
}

// Open Modify Status Modal
function openModifyModal(id) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  activeEditingRequestId = id;

  $("#modalReqId").textContent = request.id;
  $("#modalDocName").textContent = request.document;
  $("#modalCurrentStatusBadge").innerHTML = statusBadge(request.status);

  $("#modalStudentName").textContent = request.studentName || "Blando Bryan";
  $("#modalStudentId").textContent = request.studentNumber || "2024-07868-MN-0";
  $("#modalDateSubmitted").textContent = request.date;
  $("#modalPurpose").textContent = request.purpose || "Academic / Scholarship requirements";
  $("#modalCopies").textContent = `${request.copies || "1"} copy (${request.semester || "First Semester"})`;
  $("#modalDelivery").textContent = request.delivery || "School pickup";

  // Set selected status radio
  $$("input[name='modalStatusRadio']").forEach((radio) => {
    radio.checked = radio.value === request.status;
    const card = radio.closest(".status-radio-card");
    if (card) {
      card.classList.toggle("selected", radio.value === request.status);
    }
  });

  // Set remarks
  $("#modalRemarks").value = request.notes || "";
  $("#modalNotifyStudent").checked = true;

  $("#modifyModal").hidden = false;
}

function closeModifyModal() {
  $("#modifyModal").hidden = true;
  activeEditingRequestId = null;
}

// Bulk Selection Management
function updateBulkBar() {
  const checkboxes = $$(".row-checkbox:checked");
  const bulkBar = $("#bulkBar");
  const countLabel = $("#selectedCount");

  if (!bulkBar) return;

  if (checkboxes.length > 0) {
    bulkBar.classList.add("visible");
    countLabel.textContent = `${checkboxes.length} selected`;
  } else {
    bulkBar.classList.remove("visible");
  }
}

function applyBulkStatus(newStatus) {
  const checkboxes = $$(".row-checkbox:checked");
  if (!checkboxes.length) return;

  const ids = checkboxes.map((cb) => cb.value);
  ids.forEach((id) => {
    const req = requests.find((r) => r.id === id);
    if (req) {
      req.status = newStatus;
    }
  });

  addAuditEntry(`Batch updated ${ids.length} requests to <strong>${newStatus}</strong>`);
  saveData();
  renderAll();
  showToast(`Updated ${ids.length} requests to ${newStatus}`);
}

function renderAll() {
  renderStats();
  renderRequestsTable();
  renderAuditLog();
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  renderAll();

  // Cross-tab synchronization
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === NOTIFICATION_KEY) {
      requests = loadData(STORAGE_KEY, initialRequests);
      notifications = loadData(NOTIFICATION_KEY, []);
      renderAll();
    }
  });

  // Search and Filters
  if ($("#adminSearchInput")) {
    $("#adminSearchInput").addEventListener("input", renderRequestsTable);
  }
  if ($("#adminStatusFilter")) {
    $("#adminStatusFilter").addEventListener("change", renderRequestsTable);
  }
  if ($("#adminDocFilter")) {
    $("#adminDocFilter").addEventListener("change", renderRequestsTable);
  }
  if ($("#adminSortBy")) {
    $("#adminSortBy").addEventListener("change", renderRequestsTable);
  }

  // Reset Filters Button
  if ($("#btnResetFilters")) {
    $("#btnResetFilters").addEventListener("click", () => {
      if ($("#adminSearchInput")) $("#adminSearchInput").value = "";
      if ($("#adminStatusFilter")) $("#adminStatusFilter").value = "All";
      if ($("#adminDocFilter")) $("#adminDocFilter").value = "All";
      if ($("#adminSortBy")) $("#adminSortBy").value = "newest";
      renderRequestsTable();
      showToast("Filters reset to default.");
    });
  }

  // Inline Status Change Dropdown
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("inline-status-select")) {
      const requestId = e.target.dataset.requestId;
      const newStatus = e.target.value;
      updateRequestStatus(requestId, newStatus);
    }

    if (e.target.name === "modalStatusRadio") {
      $$(".status-radio-card").forEach((card) => card.classList.remove("selected"));
      const card = e.target.closest(".status-radio-card");
      if (card) card.classList.add("selected");
    }

    if (e.target.classList.contains("row-checkbox") || e.target.id === "selectAllCheckbox") {
      if (e.target.id === "selectAllCheckbox") {
        $$(".row-checkbox").forEach((cb) => (cb.checked = e.target.checked));
      }
      updateBulkBar();
    }
  });

  // Table Action Buttons / Clicks
  document.addEventListener("click", (e) => {
    // Manage status button
    const manageBtn = e.target.closest("[data-manage-id]");
    if (manageBtn) {
      openModifyModal(manageBtn.dataset.manageId);
      return;
    }

    // Preset remark chip clicked
    const presetChip = e.target.closest("[data-preset-remark]");
    if (presetChip) {
      const textarea = $("#modalRemarks");
      if (textarea) {
        const text = presetChip.dataset.presetRemark;
        textarea.value = textarea.value ? `${textarea.value} ${text}` : text;
        textarea.focus();
      }
      return;
    }

    // Modal Close
    if (e.target.closest("[data-close-modify-modal]")) {
      closeModifyModal();
      return;
    }
    if (e.target === $("#modifyModal")) {
      closeModifyModal();
      return;
    }

    // Bulk buttons
    if (e.target.id === "bulkApproveBtn") {
      applyBulkStatus("Approved");
    } else if (e.target.id === "bulkReviewBtn") {
      applyBulkStatus("Under Review");
    } else if (e.target.id === "bulkReadyBtn") {
      applyBulkStatus("Ready for Pickup");
    } else if (e.target.id === "bulkCompletedBtn") {
      applyBulkStatus("Completed");
    }
  });

  // Modal Form Submission
  const modifyForm = $("#modifyStatusForm");
  if (modifyForm) {
    modifyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!activeEditingRequestId) return;

      const selectedRadio = $("input[name='modalStatusRadio']:checked");
      if (!selectedRadio) {
        alert("Please select a status.");
        return;
      }

      const newStatus = selectedRadio.value;
      const remarks = $("#modalRemarks").value.trim();
      const notify = $("#modalNotifyStudent").checked;

      updateRequestStatus(activeEditingRequestId, newStatus, remarks, notify);
      closeModifyModal();
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModifyModal();
      $("#sidebar")?.classList.remove("sidebar-open");
      $("#mobileOverlay")?.classList.remove("visible");
    }
  });

  // Mobile menu
  const menuToggle = $("#adminMenuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      $("#sidebar")?.classList.add("sidebar-open");
      $("#mobileOverlay")?.classList.add("visible");
    });
  }

  const mobileOverlay = $("#mobileOverlay");
  if (mobileOverlay) {
    mobileOverlay.addEventListener("click", () => {
      $("#sidebar")?.classList.remove("sidebar-open");
      mobileOverlay.classList.remove("visible");
    });
  }

  // Logout handler
  const logoutBtn = $("#adminLogoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("omisLoggedIn");
      sessionStorage.removeItem("omisAdminLoggedIn");
      sessionStorage.removeItem("omisRole");
      window.location.replace("login.html");
    });
  }
});
