if (sessionStorage.getItem("omisLoggedIn") !== "true") {
  window.location.replace("login.html");
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "omis_student_requests_v1";
const NOTIFICATION_KEY = "omis_student_notifications_v1";

const initialRequests = [
  {
    id: "OM-2026-0018",
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
    document: "Transcript of Records",
    date: "Oct 18, 2026",
    status: "Approved",
    purpose: "Personal academic records",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "",
  },
  {
    id: "OM-2026-0011",
    document: "Certificate of Good Moral",
    date: "Oct 12, 2026",
    status: "Ready for Pickup",
    purpose: "Internship application",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "",
  },
  {
    id: "OM-2026-0009",
    document: "Certificate of Grades",
    date: "Oct 08, 2026",
    status: "Completed",
    purpose: "Personal reference",
    copies: "1",
    semester: "First Semester",
    delivery: "Digital copy",
    notes: "",
  },
  {
    id: "OM-2026-0006",
    document: "Certificate of Enrollment",
    date: "Oct 02, 2026",
    status: "Rejected",
    purpose: "Academic records",
    copies: "1",
    semester: "First Semester",
    delivery: "School pickup",
    notes: "Please verify the requested semester.",
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
let notifications = loadData(NOTIFICATION_KEY, [
  {
    id: 1,
    title: "Request under review",
    message: "Your Certificate of Enrollment is being reviewed.",
    date: "Today",
    read: false,
  },
  {
    id: 2,
    title: "Document approved",
    message: "Your Transcript of Records has been approved.",
    date: "Oct 18, 2026",
    read: false,
  },
]);

let toastTimer;

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
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
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
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

function requestRow(request) {
  return `<tr>
    <td>
      <div class="document-cell">
        <div class="document-icon">▤</div>
        <div>
          <strong>${escapeHTML(request.document)}</strong>
          <span>${escapeHTML(request.id)}</span>
        </div>
      </div>
    </td>
    <td class="date-cell">${escapeHTML(request.date)}</td>
    <td>${statusBadge(request.status)}</td>
    <td>
      <button class="text-action" data-view-request="${escapeHTML(request.id)}">
        View details →
      </button>
    </td>
  </tr>`;
}

function emptyRow() {
  return `<tr><td colspan="4">
    <div class="empty-state">
      <strong>No requests found</strong>
      <span>Try changing your search or status filter.</span>
    </div>
  </td></tr>`;
}

function renderStats() {
  const count = (statuses) =>
    requests.filter((r) => statuses.includes(r.status)).length;

  $("#totalCount").textContent = String(requests.length).padStart(2, "0");
  $("#pendingCount").textContent = String(
    count(["Pending", "Under Review"]),
  ).padStart(2, "0");
  $("#approvedCount").textContent = String(count(["Approved"])).padStart(
    2,
    "0",
  );
  $("#completedCount").textContent = String(
    count(["Completed", "Ready for Pickup"]),
  ).padStart(2, "0");

  const unread = notifications.filter((n) => !n.read).length;
  $("#notificationCount").textContent = unread;
  $("#notificationCount").hidden = unread === 0;
  $("#notificationDot").classList.toggle("hidden", unread === 0);
}

function renderRecent() {
  $("#recentTable").innerHTML = requests.length
    ? requests.slice(0, 3).map(requestRow).join("")
    : emptyRow();
}

function renderRequests() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#statusFilter").value;

  const filtered = requests.filter((request) => {
    const matchesFilter = filter === "All" || request.status === filter;
    const matchesSearch = `${request.id} ${request.document} ${request.status}`
      .toLowerCase()
      .includes(query);

    return matchesFilter && matchesSearch;
  });

  $("#requestsTable").innerHTML = filtered.length
    ? filtered.map(requestRow).join("")
    : emptyRow();
}

function renderNotifications() {
  const container = $("#notificationList");

  if (!notifications.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>You're all caught up</strong>
        <span>New updates will appear here.</span>
      </div>`;
    return;
  }

  container.innerHTML = notifications
    .map(
      (notification) => `
    <article class="notification-item ${notification.read ? "" : "unread"}">
      <div class="notification-item-icon">♧</div>
      <div class="notification-item-body">
        <strong>${escapeHTML(notification.title)}</strong>
        <p>${escapeHTML(notification.message)}</p>
        <span>${escapeHTML(notification.date)}</span>
      </div>
      ${notification.read ? "" : '<span class="unread-label">NEW</span>'}
    </article>
  `,
    )
    .join("");
}

function renderAll() {
  renderStats();
  renderRecent();
  renderRequests();
  renderNotifications();
}

function navigate(page) {
  const target = $(`#page-${CSS.escape(page)}`);
  if (!target) return;

  $$(".page").forEach((section) => section.classList.remove("active"));
  target.classList.add("active");

  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("#breadcrumb").textContent = page;
  $("#sidebar").classList.remove("sidebar-open");
  $("#mobileOverlay").classList.remove("visible");

  if (page === "Notifications") {
    notifications = notifications.map((item) => ({ ...item, read: true }));
    saveData();
    renderAll();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addNotification(title, message) {
  notifications.unshift({
    id: Date.now(),
    title,
    message,
    date: "Just now",
    read: false,
  });
}

function submitRequest(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const highestId = requests.reduce((max, request) => {
    const number = Number(request.id.split("-").pop()) || 0;
    return Math.max(max, number);
  }, 0);

  const nextId = `OM-${new Date().getFullYear()}-${String(
    highestId + 1,
  ).padStart(4, "0")}`;

  const request = {
    id: nextId,
    document: $("#documentType").value,
    date: formatDate(),
    status: "Pending",
    purpose: $("#purpose").value.trim(),
    semester: $("#semester").value,
    copies: $("#copies").value,
    delivery: $("#delivery").value,
    notes: $("#notes").value.trim(),
  };

  requests.unshift(request);

  addNotification(
    "Request submitted",
    `${request.document} was submitted. Reference: ${nextId}.`,
  );

  saveData();
  renderAll();
  form.reset();
  navigate("My Requests");
  showToast(`Request submitted! Reference: ${nextId}`);
}

function openRequest(id) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  $("#detailTitle").textContent = request.document;

  const approved = ["Approved", "Ready for Pickup", "Completed"].includes(
    request.status,
  );
  const completed = ["Ready for Pickup", "Completed"].includes(request.status);
  const rejected = request.status === "Rejected";
  const reviewed = !["Pending"].includes(request.status);

  $("#detailContent").innerHTML = `
    <div class="detail-reference">
      <span>REFERENCE NUMBER</span>
      <strong>${escapeHTML(request.id)}</strong>
      ${statusBadge(request.status)}
    </div>
    <div class="detail-info-row">
      <span>Date submitted</span>
      <strong>${escapeHTML(request.date)}</strong>
    </div>
    <div class="detail-info-row">
      <span>Purpose</span>
      <strong>${escapeHTML(request.purpose || "Not specified")}</strong>
    </div>
    <div class="detail-info-row">
      <span>Copies / Semester</span>
      <strong>${escapeHTML(request.copies || "1")} / ${escapeHTML(request.semester || "Not specified")}</strong>
    </div>
    <div class="detail-info-row">
      <span>Receiving method</span>
      <strong>${escapeHTML(request.delivery || "School pickup")}</strong>
    </div>
    ${request.notes ? `<div class="detail-info-row"><span>Additional notes</span><strong>${escapeHTML(request.notes)}</strong></div>` : ""}
    ${rejected ? `<div class="info-banner"><span>ⓘ</span><p>Staff remarks: ${escapeHTML(request.notes || "Please contact the registrar for further information.")}</p></div>` : ""}
    <h3 class="detail-modal-title">Request progress</h3>
    <div class="timeline">
      <div class="timeline-step done">
        <div class="timeline-marker">✓</div>
        <div><strong>Request submitted</strong><span>Your request has been recorded.</span></div>
      </div>
      <div class="timeline-step ${reviewed ? "done" : "current"}">
        <div class="timeline-marker">◷</div>
        <div><strong>Staff review</strong><span>${reviewed ? "Your request has been reviewed." : "Awaiting staff review."}</span></div>
      </div>
      <div class="timeline-step ${approved ? "done" : ""}">
        <div class="timeline-marker">${rejected ? "×" : "✓"}</div>
        <div><strong>Approval</strong><span>${rejected ? "Request rejected. Review the staff remarks." : approved ? "Your request was approved." : "Awaiting approval."}</span></div>
      </div>
      <div class="timeline-step last-step ${completed ? "done" : ""}">
        <div class="timeline-marker">▤</div>
        <div><strong>Completion</strong><span>${request.status === "Ready for Pickup" ? "Your document is ready for pickup." : request.status === "Completed" ? "This request has been completed." : "You'll be notified when your document is ready."}</span></div>
      </div>
    </div>`;

  $("#detailModal").hidden = false;
}

document.addEventListener("click", (event) => {
  const navigationButton = event.target.closest("[data-page]");
  if (navigationButton) {
    event.preventDefault();
    navigate(navigationButton.dataset.page);
  }

  const requestButton = event.target.closest("[data-view-request]");
  if (requestButton) {
    openRequest(requestButton.dataset.viewRequest);
  }

  if (event.target.closest("[data-close-modal]")) {
    $("#detailModal").hidden = true;
  }

  if (event.target === $("#detailModal")) {
    $("#detailModal").hidden = true;
  }
});

$("#requestForm").addEventListener("submit", submitRequest);
$("#searchInput").addEventListener("input", renderRequests);
$("#statusFilter").addEventListener("change", renderRequests);

$("#markRead").addEventListener("click", () => {
  notifications = notifications.map((item) => ({ ...item, read: true }));
  saveData();
  renderAll();
  showToast("All notifications marked as read.");
});

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.add("sidebar-open");
  $("#mobileOverlay").classList.add("visible");
});

$("#mobileOverlay").addEventListener("click", () => {
  $("#sidebar").classList.remove("sidebar-open");
  $("#mobileOverlay").classList.remove("visible");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#detailModal").hidden = true;
    $("#sidebar").classList.remove("sidebar-open");
    $("#mobileOverlay").classList.remove("visible");
  }
});

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("omisLoggedIn");
    sessionStorage.removeItem("omisStudentNumber");
    window.location.replace("login.html");
  });
}

renderAll();
