# Edu Valley — Bug Fixes & UI Improvements Design

> Date: 2026-05-17  
> Stack: React + Vite + Tailwind · FastAPI · SQLite  
> Scope: Backend bug fixes · Frontend bug fixes · ERP UI improvements · Mobile-first hardening  
> Approach: Bugs first (Phase 1 + 2), then UI (Phase 3)

---

## Context

The UX audit brief (prepared May 2026) was partially implemented by Codex. What shipped: Admin sidebar split, AdminOverview KPIs, MessagesManager inbox, SideSheet, DataTable with search/sort/filter/pagination, soft-delete with 10s undo, thumbnail generation. This spec covers what remains: a critical backend crash, several security and performance issues, frontend bugs, and the unimplemented UX brief screens.

---

## Phase 1 — Backend Bug Fixes (`backend/main.py`)

### 1. Fix `create_event` NameError (P0 crash)
**File:** `backend/main.py:720–733`  
**Bug:** After `db.add(obj)`, there is a copy-pasted block referencing `teacher`, `user`, and `leave` — all undefined in this function scope. Every `POST /events` call throws `NameError` and crashes with HTTP 500.  
**Fix:** Remove lines 725–728 entirely. The function body becomes identical in structure to `create_faculty` and `create_announcement`.

### 2. Fix CORS misconfiguration
**File:** `backend/main.py:58–65`  
**Bug:** `allow_origins=["*"]` combined with `allow_credentials=True` is rejected by all browsers per the CORS spec. Results in CORS failures for any credentialed fetch in production.  
**Fix:**
- Read allowed origins from `CORS_ORIGINS` env var (comma-separated list).
- Fall back to `["http://localhost:5173"]` when env var is absent.
- Set `allow_credentials=True` only when a non-wildcard origin list is configured.

### 3. Fix health endpoint status code
**File:** `backend/main.py:606–612`  
**Bug:** Returns HTTP 200 with `status: "unhealthy"` when DB is down. Load balancers and uptime monitors interpret 200 as healthy.  
**Fix:** Raise `HTTPException(status_code=503)` in the except block, or use `Response(status_code=503, content=...)`.

### 4. Fix deprecated Pydantic `.dict()` call
**File:** `backend/main.py:692–694` (`update_model_from_schema`)  
**Bug:** `.dict()` is deprecated in Pydantic v2 and will be removed. Generates deprecation warnings now, breaks in future.  
**Fix:** Replace `payload.dict()` with `payload.model_dump()`.

### 5. Fix N+1 queries — `build_student_summary`
**File:** `backend/main.py:282–294`  
**Bug:** Called once per student in the teacher dashboard. Each call issues three separate `db.query()` calls (invoices, marks, attendance). For a class of 40 students: 120+ DB queries per teacher dashboard load.  
**Fix:** Refactor the teacher dashboard endpoint (`get_teacher_dashboard`) to batch-load all data for the teacher's student IDs in bulk using `.filter(Model.student_id.in_(student_ids))`, then group results by `student_id` in Python before building summaries. Target: 3 queries total regardless of class size.

### 6. Fix N+1 queries — `admin_list_erp_teachers` and `admin_fee_students`
**Files:** `backend/main.py:997–1027`, `backend/main.py:1174–1216`  
**Bug:** Both endpoints loop over records and issue per-record DB queries (profile, assignments, class sections, subjects, invoices, payments). At 20 teachers: ~100 queries.  
**Fix:** Batch-load all related records upfront with `in_()` queries, build lookup dicts, assemble response in Python. No ORM relationship joins needed — keep it explicit.

### 7. Fix `admin_fee_summary` full-table scan
**File:** `backend/main.py:1152–1165`  
**Bug:** Loads every FeeInvoice and FeePayment row into memory to compute totals.  
**Fix:** Use SQLAlchemy `func.sum()` and `func.count()` aggregates in a single query each. Two queries instead of loading all rows.

---

## Phase 2 — Frontend Bug Fixes (`src/`)

### 8. Add Guardian to ERP login page
**File:** `src/pages/ERPLogin.jsx`  
**Bug:** `roleOptions` contains only `student` and `teacher`. Guardian accounts exist in the backend and have a full portal dashboard, but there is no login UI entry point. Guardians cannot log in.  
**Fix:** Add a third entry to `roleOptions` with `id: 'guardian'`, label `Guardian`, icon `Shield`, and notes `['Child's fees', 'Attendance', 'Leave status', 'Messages']`.

### 9. Fix teacher nav icon collision
**File:** `src/pages/ERPPortal.jsx` (`teacherNav` array, ~line 261–269)  
**Bug:** Both "Leaves" and "Messages" nav items use the `Bell` icon. Visually identical, breaks icon-as-mnemonic navigation.  
**Fix:** Change the Messages nav item icon from `Bell` to `MessageSquare` (already imported).

### 10. Fix `formatDate` UTC offset error
**File:** `src/pages/ERPPortal.jsx:46`  
**Bug:** `new Date("2026-05-17")` is parsed as UTC midnight. In IST (+5:30) this renders as May 16. Affects every date shown in the portal.  
**Fix:** Parse date strings with local timezone by replacing `new Date(value)` with a local-aware construction:
```js
const formatDate = (value) => {
    if (!value) return '—'
    const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value)
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}
```

### 11. Fix mobile bottom nav overflow for teachers
**File:** `src/pages/ERPPortal.jsx` (`BottomTabs` component, `BOTTOM_NAV_COUNT`)  
**Bug:** `BOTTOM_NAV_COUNT = 5` silently drops Messages and Substitutions from mobile nav for teachers (8 nav items total).  
**Fix:** Replace the hard slice with a "More" overflow pattern:
- Show first 4 nav items as tabs.
- 5th slot is always a "More" button (grid icon) that opens the drawer.
- Active item in overflow is indicated by a dot on the More button.

### 12. Hide ThemeToggle on ERP/admin routes
**File:** `src/App.jsx`  
**Bug:** `ThemeToggle` renders globally and its fixed-position button overlaps the mobile bottom nav bar on ERP pages. ERP/admin routes don't use dark mode classes.  
**Fix:** Wrap `ThemeToggle` in `{!isAppRoute && <ThemeToggle />}`.

---

## Phase 3 — UI Improvements (ERPPortal + mobile-first)

### 13. Typography reset in `ERPPortal.jsx`
**File:** `src/pages/ERPPortal.jsx`  
**Scope:** Apply the same typography rules already applied in `Admin.jsx` (by Codex per the brief):
- Nav item buttons: `font-semibold` not `font-black`
- User name/role in sidebar: `font-semibold` / `font-medium`
- Logout button: `font-semibold`, remove `uppercase tracking-wider`
- Stat tile values: `font-display font-bold text-2xl`
- Stat tile labels: `text-xs font-medium text-slate-500` — no uppercase, no tracking
- All button labels in portal: `font-semibold`, no `uppercase tracking-widest`
- Bottom nav labels: `text-[10px] font-medium` — remove `font-black uppercase tracking-wider`
- Eyebrow labels only (section captions): keep `uppercase tracking-widest text-xs`

### 14. Student "Today" dashboard
**File:** `src/pages/ERPPortal.jsx` (`StudentDashboardView`)  
**Replace:** Current 4-stat-tile layout + Student Details panel + Priority Items.  
**Build:**

**Today card** (full-width, `bg-brand-navy-50 border-brand-navy-200`):
- Date header: "Today, Mon 17 May"
- Next class from timetable data if available, else placeholder "No timetable set"
- Exam alert if any exam within 7 days (from `dashboard.stats` or exam schedule)
- Fee due alert if unpaid invoice due within 7 days (red text)
- Graceful empty: "You're all caught up today" if nothing urgent

**Pulse row** (3 equal cards):
- Attendance: `attendance_percent` + "X-day streak" (compute from `dashboard.attendance` sorted ascending, count consecutive `present` days from most recent) + SVG progress ring (no chart library — pure `<circle>` with `stroke-dashoffset`)
- Marks: `average_percent` vs class average from `stats.mark_comparisons` + trend arrow (↑/↓ comparing latest exam avg to previous exam avg, computed in frontend from `dashboard.marks`)
- Fees: paid/total as horizontal progress bar with `₹ paid` and `₹ due` labels below

**Quick-link chips** (4): Timetable · Marks · Fees · Exam Schedule — tap to `setActiveTab`

**Profile drawer**: Move admission no., DOB, blood group, guardian info to a `SideSheet` triggered by clicking the user avatar in the header.

**Remove**: "Receipts" stat tile (accessible from Fees tab).

**Data shape**: Uses existing `/erp/student/dashboard` response. No new API calls.

### 15. Teacher marks entry grid
**File:** `src/pages/ERPPortal.jsx` (`TeacherMarks` component)  
**Replace:** Single-student form with one submission per student.  
**Build:**

**Toolbar row**: Class selector (from `dashboard.students` unique classes) · Exam name input · Subject selector · Max marks input. All required before grid appears.

**Student grid** (desktop):
- Table: Roll No | Name | Marks input | % preview
- Numeric input, validates `0 ≤ value ≤ max_marks` on blur (red border + inline error if invalid)
- Tab moves to next row's input
- Footer: "X of Y entered · Class avg: Z% · Median: W%"

**Save all**: Calls existing `createMark` endpoint once per student via `Promise.all`. Progress indicator during batch save. Success: "Marks saved for N students" + "Enter another subject" action that clears inputs but keeps class/exam selected.

**Mobile view**: Stacked card list, one student per card, large numeric input. Same Tab-to-next behavior.

### 16. Mobile-first hardening (cross-cutting)
**Admin DataTable (`src/components/ui/DataTable.jsx`):**
- On `< md` screens, render a card-list view instead of the horizontal table. Each card shows the first 3 column values stacked. Bulk select checkbox moves to card top-right. Sort and filter controls collapse behind a filter button.

**SideSheet (`src/components/ui/SideSheet.jsx`):**
- Add enter animation: `translate-x-full` → `translate-x-0` over 200ms. Currently renders without animation.

**Touch targets:**
- All icon-only buttons (`p-2` with 16px icon) need `min-h-[44px] min-w-[44px]` to meet iOS/Android minimum.

**ERP portal content area:**
- Main content wrapper: `pb-20 lg:pb-8` to prevent bottom nav overlap on mobile.

---

## What is NOT in scope

- Attendance calendar heatmap (no API support yet for per-day breakdown beyond what's in the dashboard)
- Exam `.ics` calendar download
- Teacher leaves keyboard shortcuts (A/R/J/K)
- Cmd-K global palette
- Guardian multi-child switcher (guardian role is one child per account currently)
- Web Push / PWA notifications
- i18n bundle splitting
- Dark mode
- Razorpay payment flow changes

---

## Files changed

| File | Change |
|------|--------|
| `backend/main.py` | Fix create_event crash · CORS · health · .dict() · N+1 queries · fee_summary aggregates |
| `src/pages/ERPLogin.jsx` | Add Guardian to roleOptions |
| `src/pages/ERPPortal.jsx` | Fix nav icon · fix formatDate · fix bottom nav overflow · typography reset · Student Today dashboard · Teacher marks grid |
| `src/App.jsx` | Hide ThemeToggle on app routes |
| `src/components/ui/DataTable.jsx` | Mobile card-list view |
| `src/components/ui/SideSheet.jsx` | Slide-in animation |
