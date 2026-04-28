(function () {
  const config = window.APP_CONFIG;
  const state = {
    currentUser: null,
    records: [...window.MOCK_RECORDS],
    filteredRecords: [...window.MOCK_RECORDS],
    activeView: "home",
    isTransitioning: false
  };

  const columns = [
    "hora de inicio",
    "hora de finalizacion",
    "total de puntos",
    "N. de pers.",
    "Nombre empl",
    "TXT breve",
    "Puesto",
    "Region",
    "Text DivP",
    "Instructor",
    "tipo de examen",
    "horas",
    "status"
  ];

  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const elements = {
    loginScreen: document.getElementById("loginScreen"),
    homeScreen: document.getElementById("homeScreen"),
    appShell: document.getElementById("appShell"),
    loginForm: document.getElementById("loginForm"),
    emailInput: document.getElementById("emailInput"),
    passwordInput: document.getElementById("passwordInput"),
    loginMessage: document.getElementById("loginMessage"),
    homeUserButton: document.getElementById("homeUserButton"),
    homeUserDropdown: document.getElementById("homeUserDropdown"),
    homeLogoutButton: document.getElementById("homeLogoutButton"),
    appUserButton: document.getElementById("appUserButton"),
    appUserDropdown: document.getElementById("appUserDropdown"),
    appLogoutButton: document.getElementById("appLogoutButton"),
    pageTitle: document.getElementById("pageTitle"),
    dataModePill: document.getElementById("dataModePill"),
    refreshButton: document.getElementById("refreshButton"),
    regionFilter: document.getElementById("regionFilter"),
    statusFilter: document.getElementById("statusFilter"),
    instructorFilter: document.getElementById("instructorFilter"),
    examFilter: document.getElementById("examFilter"),
    searchFilter: document.getElementById("searchFilter"),
    recordsRegionFilter: document.getElementById("recordsRegionFilter"),
    recordsStatusFilter: document.getElementById("recordsStatusFilter"),
    recordsInstructorFilter: document.getElementById("recordsInstructorFilter"),
    recordsExamFilter: document.getElementById("recordsExamFilter"),
    downloadsRegionFilter: document.getElementById("downloadsRegionFilter"),
    downloadsStatusFilter: document.getElementById("downloadsStatusFilter"),
    downloadsInstructorFilter: document.getElementById("downloadsInstructorFilter"),
    downloadsExamFilter: document.getElementById("downloadsExamFilter"),
    totalRecords: document.getElementById("totalRecords"),
    totalPeople: document.getElementById("totalPeople"),
    totalHours: document.getElementById("totalHours"),
    totalPoints: document.getElementById("totalPoints"),
    progressPercent: document.getElementById("progressPercent"),
    recordsHours: document.getElementById("recordsHours"),
    trainingsByMonthChart: document.getElementById("trainingsByMonthChart"),
    hoursByMonthChart: document.getElementById("hoursByMonthChart"),
    instructorAccumChart: document.getElementById("instructorAccumChart"),
    statusDonutChart: document.getElementById("statusDonutChart"),
    resultsCount: document.getElementById("resultsCount"),
    recordsHead: document.getElementById("recordsHead"),
    recordsBody: document.getElementById("recordsBody"),
    downloadSummary: document.getElementById("downloadSummary"),
    downloadCsvButton: document.getElementById("downloadCsvButton"),
    configExcelFile: document.getElementById("configExcelFile"),
    configWorksheet: document.getElementById("configWorksheet"),
    configListName: document.getElementById("configListName"),
    configSite: document.getElementById("configSite"),
    configMode: document.getElementById("configMode"),
    homeWelcomeText: document.getElementById("homeWelcomeText"),
    appWelcomeText: document.getElementById("appWelcomeText"),
    clearFiltersButton: document.getElementById("clearFiltersButton"),
    memberSearchFilter: document.getElementById("memberSearchFilter"),
    downloadsMemberSearchFilter: document.getElementById("downloadsMemberSearchFilter")
  };

  const syncedFilters = {
    region: [elements.regionFilter, elements.recordsRegionFilter, elements.downloadsRegionFilter],
    status: [elements.statusFilter, elements.recordsStatusFilter, elements.downloadsStatusFilter],
    instructor: [elements.instructorFilter, elements.recordsInstructorFilter, elements.downloadsInstructorFilter],
    exam: [elements.examFilter, elements.recordsExamFilter, elements.downloadsExamFilter]
  };

  function normalize(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function hasFullAccess(user) {
    return normalize(user.region) === "os" || config.rolesWithFullAccess.some((role) => normalize(role) === normalize(user.rol));
  }

  function getAllowedRecords(user, records) {
    if (hasFullAccess(user)) return records;
    return records.filter((record) => normalize(record.Region) === normalize(user.region));
  }

  function getOptions(records, field) {
    const values = [...new Set(records.map((record) => record[field]).filter(Boolean))];
    return values.sort((a, b) => String(a).localeCompare(String(b), "es"));
  }

  function fillSelect(select, options, label) {
    if (!select) return;
    select.innerHTML = `<option value="">${label}</option>`;
    options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      select.appendChild(item);
    });
  }

  function countBy(records, field) {
    return records.reduce((acc, record) => {
      const key = record[field] || "Sin dato";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function renderEmptyChart(container, message = "Sin datos para visualizar") {
    container.innerHTML = `<div class="chart-empty">${message}</div>`;
  }

  function renderColumnChart(container, labels, values, secondary = false) {
    const maxValue = Math.max(...values, 1);
    const width = 640;
    const height = 250;
    const left = 40;
    const right = 16;
    const top = 18;
    const bottom = 42;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const barSlot = chartWidth / Math.max(values.length, 1);
    const barWidth = Math.min(28, barSlot * 0.62);
    const yTicks = 4;
    const yMax = Math.ceil(maxValue / yTicks) * yTicks || 4;

    const grid = Array.from({ length: yTicks + 1 }, (_, index) => {
      const y = top + (chartHeight / yTicks) * index;
      const value = Math.round(yMax - (yMax / yTicks) * index);
      return `
        <line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" />
        <text class="chart-axis-label" x="${left - 8}" y="${y + 4}" text-anchor="end">${value}</text>
      `;
    }).join("");

    const bars = values.map((value, index) => {
      const x = left + barSlot * index + (barSlot - barWidth) / 2;
      const barHeight = (value / yMax) * chartHeight;
      const y = top + chartHeight - barHeight;
      return `
        <rect class="${secondary ? "chart-bar-secondary" : "chart-bar"}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="5" />
        <text class="chart-value-label" x="${x + barWidth / 2}" y="${Math.max(y - 8, 12)}" text-anchor="middle">${Number.isInteger(value) ? value : value.toFixed(1)}</text>
        <text class="chart-axis-label" x="${x + barWidth / 2}" y="${height - 16}" text-anchor="middle">${labels[index]}</text>
      `;
    }).join("");

    container.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafica de columnas">
        ${grid}
        ${bars}
      </svg>
    `;
  }

  function renderHorizontalBarChart(container, entries) {
    const data = entries.slice(0, 6);
    if (!data.length) return renderEmptyChart(container);
    const maxValue = Math.max(...data.map(([, value]) => value), 1);
    const width = 640;
    const rowHeight = 34;
    const height = 28 + data.length * rowHeight;
    const left = 170;
    const right = 16;
    const usableWidth = width - left - right;

    const rows = data.map(([label, value], index) => {
      const y = 20 + index * rowHeight;
      const barWidth = (value / maxValue) * usableWidth;
      return `
        <text class="chart-axis-label" x="${left - 10}" y="${y + 12}" text-anchor="end">${label}</text>
        <rect x="${left}" y="${y}" width="${usableWidth}" height="12" rx="6" fill="#edf2fb" />
        <rect class="chart-bar-horizontal" x="${left}" y="${y}" width="${barWidth}" height="12" rx="6" />
        <text class="chart-value-label" x="${left + barWidth + 8}" y="${y + 11}">${value}</text>
      `;
    }).join("");

    container.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafica horizontal">
        ${rows}
      </svg>
    `;
  }

  function polarToCartesian(cx, cy, r, angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function renderDonutChart(container, counts) {
    const entries = Object.entries(counts);
    if (!entries.length) return renderEmptyChart(container);
    const colors = ["#69b35a", "#ee8c3a", "#d9534f", "#3f6ec3", "#8d65d3"];
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    let angle = 0;
    const cx = 110;
    const cy = 110;
    const radius = 72;

    const paths = entries.map(([label, value], index) => {
      const sweep = (value / total) * 360;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;
      return `<path d="${describeArc(cx, cy, radius, startAngle, endAngle)}" stroke="${colors[index % colors.length]}" stroke-width="34" fill="none" stroke-linecap="butt"></path>`;
    }).join("");

    const legend = entries.map(([label, value], index) => {
      const percent = Math.round((value / total) * 100);
      return `
        <div class="chart-legend-item">
          <span class="chart-legend-key">
            <span class="chart-legend-dot" style="background:${colors[index % colors.length]}"></span>
            ${label}
          </span>
          <strong>${percent}% (${value})</strong>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="chart-donut-wrap">
        <svg class="chart-svg" viewBox="0 0 220 220" role="img" aria-label="Grafica de dona">
          <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="#edf2fb" stroke-width="34" fill="none"></circle>
          ${paths}
          <text class="chart-center-label" x="${cx}" y="${cy - 4}" text-anchor="middle">${total}</text>
          <text class="chart-axis-label" x="${cx}" y="${cy + 18}" text-anchor="middle">Registros</text>
        </svg>
        <div class="chart-donut-legend">${legend}</div>
      </div>
    `;
  }

  function parseMonth(value) {
    const date = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? null : date.getMonth();
  }

  function aggregateByMonth(records, mode) {
    const buckets = new Array(12).fill(0);
    records.forEach((record) => {
      const month = parseMonth(record["hora de inicio"]);
      if (month === null) return;
      buckets[month] += mode === "hours" ? Number(record.horas || 0) : 1;
    });
    return buckets;
  }

  function renderTable(records) {
    elements.recordsHead.innerHTML = `<tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>`;
    elements.recordsBody.innerHTML = records.map((record) => `
      <tr>${columns.map((column) => `<td>${record[column] ?? ""}</td>`).join("")}</tr>
    `).join("");
  }

  function setView(view) {
    if (state.isTransitioning || state.activeView === view) return;
    state.isTransitioning = true;
    document.body.classList.add("is-transitioning");

    const previousView = state.activeView;
    const previousElement = getViewElement(previousView);
    const nextElement = getViewElement(view);

    if (previousElement) previousElement.classList.add("page-exit");

    window.setTimeout(() => {
      state.activeView = view;
      const showHome = view === "home";
      elements.homeScreen.classList.toggle("hidden", !showHome);
      elements.appShell.classList.toggle("hidden", showHome);
      document.querySelectorAll("[data-page]").forEach((page) => {
        page.classList.toggle("hidden", page.dataset.page !== view);
      });
      const titles = {
        home: "Inicio",
        dashboard: "Dashboard",
        records: "Consulta",
        downloads: "Descargas",
        config: "ConfiguraciÃ³n"
      };
      elements.pageTitle.textContent = titles[view];

      if (previousElement) previousElement.classList.remove("page-exit");
      if (!nextElement) {
        state.isTransitioning = false;
        document.body.classList.remove("is-transitioning");
        return;
      }

      nextElement.classList.add("page-enter");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nextElement.classList.remove("page-enter");
          window.setTimeout(() => {
            state.isTransitioning = false;
            document.body.classList.remove("is-transitioning");
          }, 280);
        });
      });
    }, 120);
  }

  function getViewElement(view) {
    if (view === "home") return elements.homeScreen;
    return document.querySelector(`[data-page="${view}"]`);
  }

  function applyFilters() {
    const region = getFilterValue("region");
    const status = getFilterValue("status");
    const instructor = getFilterValue("instructor");
    const exam = getFilterValue("exam");
    const search = normalize(elements.searchFilter.value);
    const memberSearch = normalize(elements.memberSearchFilter?.value || elements.downloadsMemberSearchFilter?.value);

    let records = getAllowedRecords(state.currentUser, state.records);

    if (region) records = records.filter((record) => normalize(record.Region) === normalize(region));
    if (status) records = records.filter((record) => normalize(record.status) === normalize(status));
    if (instructor) records = records.filter((record) => normalize(record.Instructor) === normalize(instructor));
    if (exam) records = records.filter((record) => normalize(record["tipo de examen"]) === normalize(exam));
    if (search) {
      records = records.filter((record) => normalize(record["N. de pers."]).includes(search));
    }
    if (memberSearch) {
      records = records.filter((record) => normalize(record["N. de pers."]).includes(memberSearch));
    }

    state.filteredRecords = records;
    renderDashboard();
  }

  function getFilterValue(name) {
    const first = syncedFilters[name].find((field) => field && field.value);
    return first ? first.value : "";
  }

  function setFilterValue(name, value, source) {
    syncedFilters[name].forEach((field) => {
      if (field && field !== source) field.value = value;
    });
    applyFilters();
  }

  function renderDashboard() {
    const records = state.filteredRecords;
    const people = new Set(records.map((record) => record["N. de pers."]).filter(Boolean)).size;
    const hours = records.reduce((sum, record) => sum + Number(record.horas || 0), 0);
    const points = records.reduce((sum, record) => sum + Number(record["total de puntos"] || 0), 0);
    const totalBase = getAllowedRecords(state.currentUser, state.records).length || 1;
    const progress = Math.round((records.length / totalBase) * 100);

    elements.totalRecords.textContent = records.length;
    elements.totalPeople.textContent = people;
    elements.totalHours.textContent = hours.toFixed(1);
    elements.totalPoints.textContent = points;
    elements.progressPercent.textContent = `${progress}%`;
    elements.resultsCount.textContent = `${records.length} registros`;
    elements.recordsHours.textContent = hours.toFixed(1);
    elements.downloadSummary.textContent = `La descarga respetarÃ¡ la regiÃ³n del usuario y los filtros activos. Registros listos: ${records.length}.`;

    renderColumnChart(elements.trainingsByMonthChart, monthLabels, aggregateByMonth(records, "count"));
    renderColumnChart(elements.hoursByMonthChart, monthLabels, aggregateByMonth(records, "hours"), true);
    renderHorizontalBarChart(
      elements.instructorAccumChart,
      Object.entries(countBy(records, "Instructor")).sort((a, b) => b[1] - a[1])
    );
    renderDonutChart(elements.statusDonutChart, countBy(records, "status"));
    renderTable(records);
  }

  function populateFilters() {
    const allowedRecords = getAllowedRecords(state.currentUser, state.records);
    const regionOptions = hasFullAccess(state.currentUser) ? getOptions(allowedRecords, "Region") : [state.currentUser.region];
    syncedFilters.region.forEach((field) => fillSelect(field, regionOptions, "Todas"));
    syncedFilters.status.forEach((field) => fillSelect(field, getOptions(allowedRecords, "status"), "Todos"));
    syncedFilters.instructor.forEach((field) => fillSelect(field, getOptions(allowedRecords, "Instructor"), "Todos"));
    syncedFilters.exam.forEach((field) => fillSelect(field, getOptions(allowedRecords, "tipo de examen"), "Todos"));
  }

  function renderUser() {
    const firstName = state.currentUser.nombre.split(" ")[0];
    elements.homeWelcomeText.textContent = `Bienvenido, ${firstName}`;
    elements.appWelcomeText.textContent = `Bienvenido, ${firstName}`;
  }

  function bootDashboard() {
    elements.loginScreen.classList.add("hidden");
    elements.homeScreen.classList.remove("hidden");
    elements.dataModePill.textContent = config.mode === "demo" ? "Modo demo" : "Fuente conectada";
    renderUser();
    populateFilters();
    applyFilters();
    elements.configExcelFile.textContent = config.excelFileName;
    elements.configWorksheet.textContent = config.worksheetName;
    elements.configListName.textContent = config.usersListName;
    elements.configSite.textContent = config.sharepointSite;
    elements.configMode.textContent = config.mode;
    setView("home");
  }

  function clearFilters() {
    Object.values(syncedFilters).flat().forEach((field) => {
      if (field) field.value = "";
    });
    elements.searchFilter.value = "";
    if (elements.memberSearchFilter) elements.memberSearchFilter.value = "";
    if (elements.downloadsMemberSearchFilter) elements.downloadsMemberSearchFilter.value = "";
    applyFilters();
  }

  function handleLogin(event) {
    event.preventDefault();
    const email = normalize(elements.emailInput.value);
    const password = elements.passwordInput.value;
    const user = window.MOCK_USERS.find((item) => normalize(item.email) === email);

    if (!user) {
      elements.loginMessage.textContent = "Ese correo no existe en la lista de usuarios.";
      return;
    }

    if (normalize(user.status) !== "activo") {
      elements.loginMessage.textContent = "El usuario estÃ¡ inactivo.";
      return;
    }

    if (password !== config.mockPassword) {
      elements.loginMessage.textContent = "ContraseÃ±a demo incorrecta.";
      return;
    }

    elements.loginMessage.textContent = "";
    state.currentUser = user;
    bootDashboard();
  }

  function downloadCsv() {
    const rows = state.filteredRecords;
    const header = columns.join(",");
    const body = rows.map((record) => columns.map((column) => {
      const value = String(record[column] ?? "").replace(/"/g, "\"\"");
      return `"${value}"`;
    }).join(","));
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "capacitaciones_filtradas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.homeLogoutButton.addEventListener("click", () => window.location.reload());
    elements.appLogoutButton.addEventListener("click", () => window.location.reload());
    elements.refreshButton.addEventListener("click", applyFilters);
    elements.downloadCsvButton.addEventListener("click", downloadCsv);
    elements.clearFiltersButton.addEventListener("click", clearFilters);
    Object.entries(syncedFilters).forEach(([name, fields]) => {
      fields.forEach((field) => {
        if (!field) return;
        field.addEventListener("change", () => setFilterValue(name, field.value, field));
      });
    });
    elements.searchFilter.addEventListener("input", applyFilters);
    elements.memberSearchFilter.addEventListener("input", applyFilters);
    elements.downloadsMemberSearchFilter.addEventListener("input", applyFilters);
    document.querySelectorAll(".home-action-card").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.targetView));
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });
    elements.homeUserButton.addEventListener("click", () => {
      const isHidden = elements.homeUserDropdown.classList.contains("hidden");
      elements.homeUserDropdown.classList.toggle("hidden", !isHidden);
      elements.homeUserButton.setAttribute("aria-expanded", String(isHidden));
    });
    elements.appUserButton.addEventListener("click", () => {
      const isHidden = elements.appUserDropdown.classList.contains("hidden");
      elements.appUserDropdown.classList.toggle("hidden", !isHidden);
      elements.appUserButton.setAttribute("aria-expanded", String(isHidden));
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".home-user-menu")) {
        elements.homeUserDropdown.classList.add("hidden");
        elements.homeUserButton.setAttribute("aria-expanded", "false");
        if (elements.appUserDropdown) {
          elements.appUserDropdown.classList.add("hidden");
          elements.appUserButton.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  bindEvents();
  setView("home");
})();
