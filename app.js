// ============================================================
// MAGANG3 — INVENTORY MONITORING
// APP.JS
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const INTERNAL_API_URL =
    "https://script.google.com/macros/s/AKfycbxN8guPNsBBI8OzR70Mb_qNKf8FccsWa8wktewVSzDDQJ1kZ1SokgXhoyr1tjLpskMUjA/exec";


// External belum memiliki API.
// Nanti tinggal kita tambahkan URL External di sini.
const EXTERNAL_API_URL = "";


// ============================================================
// 2. GLOBAL DATA
// ============================================================

// Data mentah dari API Internal
let internalRawData = [];

// Data hasil agregasi material + S-Log
let internalData = [];

// Data yang sedang ditampilkan setelah filter
let filteredInternalData = [];


// Data External untuk tahap berikutnya
let externalRawData = [];
let externalData = [];
let filteredExternalData = [];


// ============================================================
// 3. SESSION CHECK
// ============================================================

if (
    sessionStorage.getItem(
        "magang3_admin_logged_in"
    ) !== "true"
) {
    window.location.href = "login.html";
}


// ============================================================
// 4. INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ----------------------------------------
        // Navigation
        // ----------------------------------------

        const navItems =
            document.querySelectorAll(
                ".nav-item"
            );

        navItems.forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        const page =
                            item.dataset.page;

                        showPage(page);

                    }
                );

            }
        );


        // ----------------------------------------
        // Internal Search
        // ----------------------------------------

        const internalSearch =
            document.getElementById(
                "internalSearch"
            );

        if (internalSearch) {

            internalSearch.addEventListener(
                "input",
                filterInternalData
            );

        }


        // ----------------------------------------
        // Internal Location
        // ----------------------------------------

        const internalLocation =
            document.getElementById(
                "internalLocation"
            );

        if (internalLocation) {

            internalLocation.addEventListener(
                "change",
                filterInternalData
            );

        }


        // ----------------------------------------
        // External Search
        // ----------------------------------------

        const externalSearch =
            document.getElementById(
                "externalSearch"
            );

        if (externalSearch) {

            externalSearch.addEventListener(
                "input",
                filterExternalData
            );

        }


        // ----------------------------------------
        // External Location
        // ----------------------------------------

        const externalLocation =
            document.getElementById(
                "externalLocation"
            );

        if (externalLocation) {

            externalLocation.addEventListener(
                "change",
                filterExternalData
            );

        }


        // ----------------------------------------
        // Logout
        // ----------------------------------------

        const logoutButton =
            document.getElementById(
                "logoutBtn"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logoutAdmin
            );

        }


        // ----------------------------------------
        // Default page
        // ----------------------------------------

        showPage("dashboard");

    }
);


// ============================================================
// 5. PAGE NAVIGATION
// ============================================================

function showPage(page) {

    // ----------------------------------------
    // Hide all pages
    // ----------------------------------------

    document
        .querySelectorAll(".page")
        .forEach(
            function (section) {

                section.classList.remove(
                    "active-page"
                );

            }
        );


    // ----------------------------------------
    // Remove active menu
    // ----------------------------------------

    document
        .querySelectorAll(".nav-item")
        .forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

            }
        );


    // ----------------------------------------
    // Show requested page
    // ----------------------------------------

    const target =
        document.getElementById(
            "page-" + page
        );

    if (target) {

        target.classList.add(
            "active-page"
        );

    }


    // ----------------------------------------
    // Active navigation
    // ----------------------------------------

    const activeNav =
        document.querySelector(
            `.nav-item[data-page="${page}"]`
        );

    if (activeNav) {

        activeNav.classList.add(
            "active"
        );

    }


    // ----------------------------------------
    // Topbar
    //
    // Dashboard → tampilkan title
    // Internal/External → sembunyikan
    // karena sudah punya heading sendiri.
    // ----------------------------------------

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );

    if (pageTitle) {

        if (page === "dashboard") {

            pageTitle.textContent =
                "Dashboard";

            pageTitle.style.display =
                "block";

        } else {

            pageTitle.style.display =
                "none";

        }

    }


    // ----------------------------------------
    // Page-specific loading
    // ----------------------------------------

    if (page === "internal") {

        if (
            internalRawData.length === 0
        ) {

            loadInternalData();

        } else {

            renderInternalCurrentState();

        }

    }


    if (page === "external") {

        if (
            EXTERNAL_API_URL
        ) {

            if (
                externalRawData.length === 0
            ) {

                loadExternalData();

            } else {

                renderExternalCurrentState();

            }

        }

    }

}


// ============================================================
// 6. LOGOUT
// ============================================================

function logoutAdmin() {

    sessionStorage.removeItem(
        "magang3_admin_logged_in"
    );

    window.location.href =
        "login.html";

}


// ============================================================
// 7. INTERNAL API — LOAD DATA
// ============================================================

function loadInternalData() {

    setRefreshButton(
        true
    );

    showLoading();

    updateInternalStatus(
        "Mengambil data..."
    );


    // ----------------------------------------
    // Remove previous API script
    // ----------------------------------------

    const oldScript =
        document.getElementById(
            "internalGoogleApi"
        );

    if (oldScript) {

        oldScript.remove();

    }


    // ----------------------------------------
    // JSONP callback
    // ----------------------------------------

    const callbackName =
        "handleInternal_" +
        Date.now();


    let finished = false;


    // ----------------------------------------
    // Success callback
    // ----------------------------------------

    window[callbackName] =
        function (data) {

            if (finished) {
                return;
            }

            finished = true;


            try {

                console.log(
                    "Internal API Response:",
                    data
                );


                // --------------------------------
                // API error object
                // --------------------------------

                if (
                    data &&
                    !Array.isArray(data) &&
                    data.success === false
                ) {

                    throw new Error(
                        data.error ||
                        "API mengembalikan error."
                    );

                }


                // --------------------------------
                // Response must be array
                // --------------------------------

                if (
                    !Array.isArray(data)
                ) {

                    throw new Error(
                        "Format data dari API tidak valid."
                    );

                }


                // --------------------------------
                // Save raw data
                // --------------------------------

                internalRawData =
                    data;


                // --------------------------------
                // Aggregate data
                // --------------------------------

                internalData =
                    aggregateStockData(
                        data,
                        "internal"
                    );


                filteredInternalData =
                    [
                        ...internalData
                    ];


                // --------------------------------
                // Populate Store Location
                // --------------------------------

                populateLocation(
                    data,
                    "internal"
                );


                // --------------------------------
                // Update summary
                // --------------------------------

                updateInternalSummary(
                    filteredInternalData
                );


                // --------------------------------
                // Update categories
                // --------------------------------

                updateInternalCategories(
                    filteredInternalData
                );


                // --------------------------------
                // Render table
                // --------------------------------

                renderInternalTable(
                    filteredInternalData
                );


                // --------------------------------
                // Status
                // --------------------------------

                updateInternalStatus(
                    "Data berhasil terhubung"
                );


                // --------------------------------
                // Success message
                // --------------------------------

                showToast(
                    "Data Internal berhasil diperbarui.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Internal API Error:",
                    error
                );


                updateInternalStatus(
                    "Gagal mengambil data"
                );


                showErrorPopup(
                    "Gagal mengambil data",
                    error.message
                );


                showEmpty();

            }


            cleanupJsonp(
                callbackName,
                "internalGoogleApi"
            );

            setRefreshButton(
                false
            );

        };


    // ----------------------------------------
    // Create script
    // ----------------------------------------

    const script =
        document.createElement(
            "script"
        );

    script.id =
        "internalGoogleApi";


    script.src =
        INTERNAL_API_URL +
        "?callback=" +
        encodeURIComponent(
            callbackName
        ) +
        "&t=" +
        Date.now();


    // ----------------------------------------
    // Error
    // ----------------------------------------

    script.onerror =
        function () {

            if (finished) {
                return;
            }

            finished = true;


            console.error(
                "Internal API gagal dimuat."
            );


            updateInternalStatus(
                "Gagal mengambil data"
            );


            showErrorPopup(
                "Gagal mengambil data",
                "Google Apps Script tidak dapat dihubungi."
            );


            showEmpty();


            cleanupJsonp(
                callbackName,
                "internalGoogleApi"
            );


            setRefreshButton(
                false
            );

        };


    document.body.appendChild(
        script
    );

}


// ============================================================
// 8. REFRESH INTERNAL
// ============================================================

function refreshInternalData() {

    internalRawData = [];

    internalData = [];

    filteredInternalData = [];


    loadInternalData();

}


// ============================================================
// 9. AGGREGATE STOCK DATA
// ============================================================

function aggregateStockData(
    data,
    type
) {

    const grouped =
        new Map();


    data.forEach(
        function (row) {

            const material =
                normalizeValue(
                    row["Material"]
                );


            const description =
                normalizeValue(
                    row["Description"]
                );


            const batch =
                normalizeValue(
                    row["Batch"]
                );


            const plant =
                normalizeValue(
                    row["Plant"]
                );


            const location =
                normalizeValue(
                    row["Stor. Location"]
                );


            const category =
                getCategory(
                    row,
                    type
                );


            const jumlah =
                Number(
                    row["Jumlah"]
                ) || 0;


            const serial =
                normalizeValue(
                    row["Serial number"]
                );


            // --------------------------------
            // Group key
            //
            // Material + Location
            // --------------------------------

            const key =
                [
                    material,
                    location
                ].join(
                    "||"
                );


            if (
                !grouped.has(key)
            ) {

                grouped.set(
                    key,
                    {

                        material:
                            material,

                        description:
                            description,

                        batch:
                            batch,

                        plant:
                            plant,

                        location:
                            location,

                        category:
                            category,

                        jumlah:
                            0,

                        serials:
                            []

                    }
                );

            }


            const item =
                grouped.get(key);


            // --------------------------------
            // Quantity
            // --------------------------------

            item.jumlah +=
                jumlah;


            // --------------------------------
            // Category
            //
            // Kalau ada beberapa baris
            // dengan kategori berbeda,
            // ambil kategori yang tersedia.
            // --------------------------------

            if (
                !item.category &&
                category
            ) {

                item.category =
                    category;

            }


            // --------------------------------
            // Serial
            // --------------------------------

            if (
                serial
            ) {

                item.serials.push(
                    serial
                );

            }

        }
    );


    return [
        ...grouped.values()
    ];

}


// ============================================================
// 10. CATEGORY DETECTION
// ============================================================

function getCategory(
    row,
    type
) {

    // ----------------------------------------
    // PRIORITAS 1:
    // Kalau spreadsheet nanti mempunyai
    // kolom Category.
    // ----------------------------------------

    const categoryValue =
        normalizeValue(
            row["Category"]
        );


    if (
        categoryValue
    ) {

        const normalized =
            categoryValue
                .toLowerCase()
                .trim();


        if (
            normalized === "fot"
        ) {

            return "FOT";

        }


        if (
            normalized === "foc"
        ) {

            return "FOC";

        }


        if (
            normalized === "sfp"
        ) {

            return "SFP";

        }


        if (
            normalized === "accessories" ||
            normalized === "accessory" ||
            normalized === "aksesoris"
        ) {

            return "Accessories";

        }

    }


    // ----------------------------------------
    // BELUM ADA CATEGORY
    //
    // Jangan melakukan tebakan dari
    // material code / description.
    // ----------------------------------------

    return "";

}


// ============================================================
// 11. INTERNAL SUMMARY
// ============================================================

function updateInternalSummary(
    data
) {

    const materials =
        new Set();

    const locations =
        new Set();

    let totalStock =
        0;


    data.forEach(
        function (row) {

            if (
                row.material
            ) {

                materials.add(
                    row.material
                );

            }


            if (
                row.location
            ) {

                locations.add(
                    row.location
                );

            }


            totalStock +=
                Number(
                    row.jumlah
                ) || 0;

        }
    );


    setText(
        "internalTotalMaterial",
        formatNumber(
            materials.size
        )
    );


    setText(
        "internalTotalStock",
        formatNumber(
            totalStock
        )
    );


    setText(
        "internalTotalLocation",
        formatNumber(
            locations.size
        )
    );


    setText(
        "internalActiveMaterial",
        formatNumber(
            data.filter(
                function (row) {

                    return (
                        Number(
                            row.jumlah
                        ) > 0
                    );

                }
            ).length
        )
    );

}


// ============================================================
// 12. INTERNAL CATEGORY
// ============================================================

function updateInternalCategories(
    data
) {

    const totals = {

        FOT: 0,

        FOC: 0,

        SFP: 0

    };


    data.forEach(
        function (row) {

            const category =
                row.category;


            if (
                category === "FOT"
            ) {

                totals.FOT +=
                    Number(
                        row.jumlah
                    ) || 0;

            }


            if (
                category === "FOC"
            ) {

                totals.FOC +=
                    Number(
                        row.jumlah
                    ) || 0;

            }


            if (
                category === "SFP"
            ) {

                totals.SFP +=
                    Number(
                        row.jumlah
                    ) || 0;

            }

        }
    );


    setText(
        "internalFotStock",
        categoryDisplayValue(
            totals.FOT
        )
    );


    setText(
        "internalFocStock",
        categoryDisplayValue(
            totals.FOC
        )
    );


    setText(
        "internalSfpStock",
        categoryDisplayValue(
            totals.SFP
        )
    );

}


// ============================================================
// 13. FILTER INTERNAL
// ============================================================

function filterInternalData() {

    const searchInput =
        document.getElementById(
            "internalSearch"
        );


    const locationSelect =
        document.getElementById(
            "internalLocation"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const location =
        locationSelect
            ? locationSelect.value
            : "";


    filteredInternalData =
        internalData.filter(
            function (row) {

                const material =
                    String(
                        row.material ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        row.description ||
                        ""
                    ).toLowerCase();


                const serialText =
                    row.serials
                        .join(" ")
                        .toLowerCase();


                const rowLocation =
                    String(
                        row.location ||
                        ""
                    );


                const matchSearch =
                    !search ||
                    material.includes(
                        search
                    ) ||
                    description.includes(
                        search
                    ) ||
                    serialText.includes(
                        search
                    );


                const matchLocation =
                    !location ||
                    rowLocation ===
                        location;


                return (
                    matchSearch &&
                    matchLocation
                );

            }
        );


    // ----------------------------------------
    // Recalculate according to filter
    // ----------------------------------------

    updateInternalSummary(
        filteredInternalData
    );


    updateInternalCategories(
        filteredInternalData
    );


    renderInternalTable(
        filteredInternalData
    );

}


// ============================================================
// 14. RENDER INTERNAL TABLE
// ============================================================

function renderInternalTable(
    data
) {

    const tbody =
        document.getElementById(
            "internalTableBody"
        );


    if (!tbody) {
        return;
    }


    // ----------------------------------------
    // No data
    // ----------------------------------------

    if (
        !data.length
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="empty-row"
                >
                    Tidak ada material pada
                    filter yang dipilih.
                </td>

            </tr>
        `;

        return;

    }


    // ----------------------------------------
    // Render
    // ----------------------------------------

    tbody.innerHTML =
        data
            .map(
                function (row, index) {

                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>
                                ${escapeHtml(
                                    row.material ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    row.description ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    row.batch ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    row.plant ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    row.location ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${formatNumber(
                                    row.jumlah ||
                                    0
                                )}
                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="detail-btn"
                                    onclick="showInternalDetail(${index})"
                                >
                                    Detail
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


// ============================================================
// 15. INTERNAL DETAIL POPUP
// ============================================================

function showInternalDetail(
    index
) {

    const row =
        filteredInternalData[
            index
        ];


    if (!row) {
        return;
    }


    createDetailModal();


    const modal =
        document.getElementById(
            "detailModal"
        );


    const content =
        document.getElementById(
            "detailModalContent"
        );


    if (
        !modal ||
        !content
    ) {

        return;

    }


    const serialList =
        row.serials &&
        row.serials.length
            ? row.serials
            : [];


    const serialHtml =
        serialList.length
            ? `
                <div class="serial-list">

                    ${serialList
                        .map(
                            function (serial, i) {

                                return `
                                    <div class="serial-row">

                                        <span>
                                            ${i + 1}
                                        </span>

                                        <strong>
                                            ${escapeHtml(
                                                serial
                                            )}
                                        </strong>

                                    </div>
                                `;

                            }
                        )
                        .join("")}

                </div>
            `
            : `
                <div class="no-serial">
                    Tidak ada Serial Number.
                </div>
            `;


    content.innerHTML = `

        <div class="detail-header">

            <div>

                <span class="detail-label">
                    DETAIL STOCK INTERNAL
                </span>

                <h3>
                    ${escapeHtml(
                        row.material ||
                        "—"
                    )}
                </h3>

            </div>


            <button
                type="button"
                class="modal-close"
                onclick="closeDetailModal()"
            >
                ×
            </button>

        </div>


        <div class="detail-grid">


            <div class="detail-item">

                <span>
                    Material
                </span>

                <strong>
                    ${escapeHtml(
                        row.material ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Store Location / S-Log
                </span>

                <strong>
                    ${escapeHtml(
                        row.location ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item detail-wide">

                <span>
                    Description
                </span>

                <strong>
                    ${escapeHtml(
                        row.description ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Batch
                </span>

                <strong>
                    ${escapeHtml(
                        row.batch ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Plant
                </span>

                <strong>
                    ${escapeHtml(
                        row.plant ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Category
                </span>

                <strong>
                    ${
                        row.category ||
                        "Belum ditentukan"
                    }
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Total Jumlah
                </span>

                <strong>
                    ${formatNumber(
                        row.jumlah ||
                        0
                    )}
                </strong>

            </div>


        </div>


        <div class="serial-section">

            <div class="serial-section-header">

                <div>

                    <span class="detail-label">
                        SERIAL NUMBER
                    </span>

                    <h4>
                        Daftar SN
                    </h4>

                </div>


                <span class="serial-count">
                    ${formatNumber(
                        serialList.length
                    )} SN
                </span>

            </div>


            ${serialHtml}

        </div>

    `;


    modal.classList.add(
        "show"
    );

}


// ============================================================
// 16. LOCATION FILTER
// ============================================================

function populateLocation(
    data,
    type
) {

    const select =
        type === "internal"
            ? document.getElementById(
                "internalLocation"
            )
            : document.getElementById(
                "externalLocation"
            );


    if (!select) {
        return;
    }


    const locations =
        [
            ...new Set(
                data
                    .map(
                        function (row) {

                            return normalizeValue(
                                row[
                                    "Stor. Location"
                                ]
                            );

                        }
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


    locations.sort(
        function (a, b) {

            return a.localeCompare(
                b,
                undefined,
                {
                    numeric: true
                }
            );

        }
    );


    select.innerHTML = `
        <option value="">
            Semua Store Location
        </option>
    `;


    locations.forEach(
        function (location) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                location;


            option.textContent =
                location;


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// 17. CREATE DETAIL MODAL
// ============================================================

function createDetailModal() {

    let modal =
        document.getElementById(
            "detailModal"
        );


    if (modal) {
        return;
    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "detailModal";


    modal.className =
        "modal-overlay";


    modal.innerHTML = `

        <div
            id="detailModalContent"
            class="modal-box"
        ></div>

    `;


    document.body.appendChild(
        modal
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeDetailModal();

            }

        }
    );

}


// ============================================================
// 18. CLOSE DETAIL MODAL
// ============================================================

function closeDetailModal() {

    const modal =
        document.getElementById(
            "detailModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


// ============================================================
// 19. ERROR POPUP
// ============================================================

function showErrorPopup(
    title,
    message
) {

    let modal =
        document.getElementById(
            "errorModal"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "errorModal";


        modal.className =
            "modal-overlay";


        modal.innerHTML = `

            <div
                class="modal-box error-box"
            >

                <div class="error-icon">
                    !
                </div>


                <h3
                    id="errorModalTitle"
                >
                    ${escapeHtml(
                        title
                    )}
                </h3>


                <p
                    id="errorModalMessage"
                >
                    ${escapeHtml(
                        message
                    )}
                </p>


                <button
                    type="button"
                    class="modal-primary-btn"
                    onclick="closeErrorModal()"
                >
                    Tutup
                </button>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modal
                ) {

                    closeErrorModal();

                }

            }
        );

    }


    const titleElement =
        document.getElementById(
            "errorModalTitle"
        );


    const messageElement =
        document.getElementById(
            "errorModalMessage"
        );


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (messageElement) {

        messageElement.textContent =
            message;

    }


    modal.classList.add(
        "show"
    );

}


// ============================================================
// 20. CLOSE ERROR MODAL
// ============================================================

function closeErrorModal() {

    const modal =
        document.getElementById(
            "errorModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


// ============================================================
// 21. LOADING
// ============================================================

function showLoading() {

    const tbody =
        document.getElementById(
            "internalTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="empty-row"
            >
                Memuat data Internal...
            </td>

        </tr>

    `;

}


// ============================================================
// 22. EMPTY
// ============================================================

function showEmpty() {

    const tbody =
        document.getElementById(
            "internalTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="empty-row"
            >
                Data Internal belum tersedia.
            </td>

        </tr>

    `;

}


// ============================================================
// 23. INTERNAL API STATUS
// ============================================================

function updateInternalStatus(
    status
) {

    const element =
        document.getElementById(
            "internalApiStatus"
        );


    if (element) {

        element.textContent =
            status;

    }

}


// ============================================================
// 24. REFRESH BUTTON STATE
// ============================================================

function setRefreshButton(
    loading
) {

    const button =
        document.getElementById(
            "refreshInternalBtn"
        );


    if (!button) {
        return;
    }


    if (loading) {

        button.disabled =
            true;

        button.innerHTML =
            "↻ Memuat...";

    } else {

        button.disabled =
            false;

        button.innerHTML =
            "↻ Refresh Data";

    }

}


// ============================================================
// 25. EXTERNAL — PLACEHOLDER
// ============================================================

function loadExternalData() {

    if (
        !EXTERNAL_API_URL
    ) {

        updateExternalStatus(
            "Data External belum terhubung"
        );


        renderExternalPlaceholder();

        return;

    }


    // ----------------------------------------
    // External API nanti dibuat di tahap
    // berikutnya.
    // ----------------------------------------

}


// ============================================================
// 26. EXTERNAL CURRENT STATE
// ============================================================

function renderExternalCurrentState() {

    updateExternalSummary(
        filteredExternalData
    );


    updateExternalCategories(
        filteredExternalData
    );


    renderExternalTable(
        filteredExternalData
    );

}


// ============================================================
// 27. EXTERNAL FILTER
// ============================================================

function filterExternalData() {

    const searchInput =
        document.getElementById(
            "externalSearch"
        );


    const locationSelect =
        document.getElementById(
            "externalLocation"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const location =
        locationSelect
            ? locationSelect.value
            : "";


    filteredExternalData =
        externalData.filter(
            function (row) {

                const material =
                    String(
                        row.material ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        row.description ||
                        ""
                    ).toLowerCase();


                const serialText =
                    row.serials
                        .join(" ")
                        .toLowerCase();


                const matchSearch =
                    !search ||
                    material.includes(
                        search
                    ) ||
                    description.includes(
                        search
                    ) ||
                    serialText.includes(
                        search
                    );


                const matchLocation =
                    !location ||
                    row.location ===
                        location;


                return (
                    matchSearch &&
                    matchLocation
                );

            }
        );


    renderExternalCurrentState();

}


// ============================================================
// 28. EXTERNAL SUMMARY
// ============================================================

function updateExternalSummary(
    data
) {

    const materials =
        new Set();

    const locations =
        new Set();

    let totalStock =
        0;


    data.forEach(
        function (row) {

            if (
                row.material
            ) {

                materials.add(
                    row.material
                );

            }


            if (
                row.location
            ) {

                locations.add(
                    row.location
                );

            }


            totalStock +=
                Number(
                    row.jumlah
                ) || 0;

        }
    );


    setText(
        "externalTotalMaterial",
        formatNumber(
            materials.size
        )
    );


    setText(
        "externalTotalStock",
        formatNumber(
            totalStock
        )
    );


    setText(
        "externalTotalLocation",
        formatNumber(
            locations.size
        )
    );


    setText(
        "externalActiveMaterial",
        formatNumber(
            data.filter(
                function (row) {

                    return (
                        Number(
                            row.jumlah
                        ) > 0
                    );

                }
            ).length
        )
    );

}


// ============================================================
// 29. EXTERNAL CATEGORY
// ============================================================

function updateExternalCategories(
    data
) {

    const totals = {

        FOT: 0,

        FOC: 0,

        Accessories: 0

    };


    data.forEach(
        function (row) {

            if (
                row.category === "FOT"
            ) {

                totals.FOT +=
                    Number(
                        row.jumlah
                    ) || 0;

            }


            if (
                row.category === "FOC"
            ) {

                totals.FOC +=
                    Number(
                        row.jumlah
                    ) || 0;

            }


            if (
                row.category ===
                "Accessories"
            ) {

                totals.Accessories +=
                    Number(
                        row.jumlah
                    ) || 0;

            }

        }
    );


    setText(
        "externalFotStock",
        categoryDisplayValue(
            totals.FOT
        )
    );


    setText(
        "externalFocStock",
        categoryDisplayValue(
            totals.FOC
        )
    );


    setText(
        "externalAccessoriesStock",
        categoryDisplayValue(
            totals.Accessories
        )
    );

}


// ============================================================
// 30. EXTERNAL TABLE
// ============================================================

function renderExternalTable(
    data
) {

    const tbody =
        document.getElementById(
            "externalTableBody"
        );


    if (!tbody) {
        return;
    }


    if (
        !data.length
    ) {

        renderExternalPlaceholder();

        return;

    }


    tbody.innerHTML =
        data
            .map(
                function (row, index) {

                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.material ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.description ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.batch ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.plant ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.location ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    row.jumlah ||
                                    0
                                )}
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="detail-btn"
                                    disabled
                                >
                                    Detail
                                </button>
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


// ============================================================
// 31. EXTERNAL PLACEHOLDER
// ============================================================

function renderExternalPlaceholder() {

    const tbody =
        document.getElementById(
            "externalTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="empty-row"
            >
                Data External akan ditampilkan
                setelah sumber data External siap.
            </td>

        </tr>

    `;

}


// ============================================================
// 32. EXTERNAL STATUS
// ============================================================

function updateExternalStatus(
    status
) {

    const element =
        document.getElementById(
            "externalApiStatus"
        );


    if (element) {

        element.textContent =
            status;

    }

}


// ============================================================
// 33. CATEGORY DISPLAY
// ============================================================

function categoryDisplayValue(
    value
) {

    // ----------------------------------------
    // Kalau belum ada kategori di spreadsheet
    // jangan tampilkan angka yang seolah valid.
    // ----------------------------------------

    if (
        value === 0
    ) {

        return "—";

    }


    return formatNumber(
        value
    );

}


// ============================================================
// 34. CLEANUP JSONP
// ============================================================

function cleanupJsonp(
    callbackName,
    scriptId
) {

    try {

        delete window[
            callbackName
        ];

    } catch (error) {

        console.warn(
            "Callback cleanup error:",
            error
        );

    }


    const script =
        document.getElementById(
            scriptId
        );


    if (script) {

        script.remove();

    }

}


// ============================================================
// 35. SHOW TOAST
// ============================================================

function showToast(
    message,
    type = "success"
) {

    let toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "toast";


        toast.className =
            "toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.className =
        "toast show " +
        type;


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


// ============================================================
// 36. SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// 37. NUMBER FORMAT
// ============================================================

function formatNumber(
    value
) {

    const number =
        Number(
            value
        ) || 0;


    return number.toLocaleString(
        "id-ID"
    );

}


// ============================================================
// 38. NORMALIZE VALUE
// ============================================================

function normalizeValue(
    value
) {

    return String(
        value ?? ""
    ).trim();

}


// ============================================================
// 39. ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// END
// ============================================================