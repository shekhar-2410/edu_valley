# ERP Redesign — Narendra Edu Valley

**Date:** 2026-05-12  
**Status:** Approved  
**Scope:** Production-ready ERP upgrade — ER redesign, analytics dashboard, timetable, bulk attendance, admit card, class/section filter for teachers

---

## 1. Goals

1. Replace freetext class/section/subject strings with proper FK entities
2. Add timetable (weekly template + date overrides)
3. Add real-time bulk attendance marking for teachers (all-present by default, uncheck absent)
4. Add analytics dashboard — class-level for teachers, personal for students
5. Add admit card (printable modal) for students
6. Add CBSE-pattern report card with downloadable print view
7. Redesign ERP UI — sidebar layout (desktop) + hamburger drawer + bottom tabs (mobile)
8. Teacher can filter students by class and section

---

## 2. What is cut from this phase

- Homework feature (no backend model, high scope)
- Mobile OTP login (requires SMS provider)
- Co-scholastic activities on report card
- Parent as a separate auth role (student login serves both)
- Server-side PDF generation (browser print-to-PDF used instead)

---

## 3. Database / ER Design

### 3.1 New tables

#### `class_sections`
```
id            INTEGER PK
class_name    VARCHAR(20)   e.g. "8"
section       VARCHAR(10)   e.g. "A"
academic_year VARCHAR(10)   e.g. "2025-26"
is_active     BOOLEAN default true
created_at    DATETIME
UNIQUE (class_name, section, academic_year)
```

#### `subjects`
```
id          INTEGER PK
name        VARCHAR(100)  e.g. "Mathematics"
code        VARCHAR(20)   unique, e.g. "MATH"
description TEXT nullable
```

#### `teacher_subject_assignments`
Replaces TeacherProfile.class_teacher_of (string) and TeacherProfile.subject (string).
```
id               INTEGER PK
teacher_id       FK → teacher_profiles.id
subject_id       FK → subjects.id
class_section_id FK → class_sections.id
academic_year    VARCHAR(10)
is_class_teacher BOOLEAN default false
UNIQUE (teacher_id, subject_id, class_section_id, academic_year)
```

#### `timetable_templates`
One per class-section per academic year.
```
id               INTEGER PK
class_section_id FK → class_sections.id
academic_year    VARCHAR(10)
effective_from   DATE
created_at       DATETIME
```

#### `timetable_slots`
Recurring weekly periods in a template.
```
id          INTEGER PK
template_id FK → timetable_templates.id
day_of_week INTEGER  0=Mon … 5=Sat
period_no   INTEGER  1–8
start_time  VARCHAR(5)  "08:00"
end_time    VARCHAR(5)  "08:45"
subject_id  FK → subjects.id nullable
teacher_id  FK → teacher_profiles.id nullable
is_break    BOOLEAN default false
```

#### `timetable_overrides`
Date-specific exceptions (substitution, exam day, holiday).
```
id               INTEGER PK
class_section_id FK → class_sections.id
override_date    DATE
period_no        INTEGER nullable (null = whole day)
type             VARCHAR(20)  holiday | substitution | exam
subject_id       FK → subjects.id nullable
teacher_id       FK → teacher_profiles.id nullable
note             TEXT nullable
created_at       DATETIME
```

#### `exam_schedules`
Used to generate admit cards.
```
id               INTEGER PK
class_section_id FK → class_sections.id
subject_id       FK → subjects.id
exam_name        VARCHAR(120)  e.g. "Half-Yearly Exam"
exam_date        DATE
start_time       VARCHAR(5)
end_time         VARCHAR(5)
venue            VARCHAR(100) nullable
hall_no          VARCHAR(20) nullable
academic_year    VARCHAR(10)
max_marks        INTEGER
created_at       DATETIME
```

#### `student_remarks`
Teacher-authored notes on a student. Separate from mark entry remarks.
```
id           INTEGER PK
student_id   FK → student_profiles.id
teacher_id   FK → teacher_profiles.id
remark       TEXT  (max 2000 chars)
remark_type  VARCHAR(20)  academic | behavioural | general
visibility   VARCHAR(20)  teacher_only | student_visible
  (teacher_only = only teachers see it; student_visible = student sees it on their dashboard)
created_at   DATETIME
updated_at   DATETIME
```

#### `student_promotion_history`
Tracks every class promotion, forming a complete academic journey log.
```
id                    INTEGER PK
student_id            FK → student_profiles.id
from_class_section_id FK → class_sections.id
to_class_section_id   FK → class_sections.id
from_academic_year    VARCHAR(10)  e.g. "2024-25"
to_academic_year      VARCHAR(10)  e.g. "2025-26"
exam_result           VARCHAR(20)  pass | compartment | detained
promoted_by_teacher   FK → teacher_profiles.id
promoted_at           DATETIME
note                  TEXT nullable
```

### 3.2 Modified existing tables

| Table | Change |
|---|---|
| `student_profiles` | Add `class_section_id FK → class_sections` (nullable); add `status VARCHAR(20) default "active"` (active \| transferred \| withdrawn \| expelled); add `exit_date DATE` nullable; add `exit_reason TEXT` nullable; add `date_of_birth DATE` nullable (used as default password); keep `class_name`/`section` strings as display cache |
| `erp_users` | `is_active` already exists — toggled false on soft-disable; no schema change needed |
| `teacher_profiles` | Add `is_active BOOLEAN default true`; keep old `class_teacher_of`/`subject` strings as nullable legacy |
| `attendance_records` | Add `class_section_id FK → class_sections` nullable; add `marked_by_teacher_id FK → teacher_profiles` nullable |
| `mark_entries` | Add `subject_id FK → subjects` nullable; add `academic_year VARCHAR(10)` nullable; keep `subject` string as display cache |
| `leave_requests` | No schema change |
| `fee_invoices` | No schema change |

### 3.3 Migration strategy

The app currently has a single seed dataset (one teacher, one student). The migration:
1. Insert one `ClassSection` row for "8-A / 2025-26"
2. Insert Subject rows for seeded subjects (Mathematics, Science)
3. Insert one `TeacherSubjectAssignment` linking the seeded teacher to both subjects in 8-A
4. Set `student_profiles.class_section_id` for the seeded student
5. `SQLite` does not support `ADD CONSTRAINT` after creation — new FK columns are added as nullable integers; integrity enforced at the application layer until a full migration to PostgreSQL

---

## 4. Backend API Design

All new routes follow the existing pattern: both `/erp/...` and `/api/erp/...`.

### 4.1 New endpoints

#### Class sections & subjects (admin-created, teacher-read)
```
GET  /erp/class-sections          → list active class sections
GET  /erp/subjects                → list subjects
GET  /erp/teacher/assignments     → teacher's class-section/subject assignments
```

#### Timetable
```
GET  /erp/timetable/{class_section_id}            → weekly template slots + today's overrides
GET  /erp/timetable/teacher/{teacher_id}          → all slots assigned to this teacher (across sections)
POST /erp/timetable/overrides                     → create a date override (admin/teacher)
```

#### Bulk attendance (teacher)
```
POST /erp/attendance/bulk
  body: { class_section_id, date, records: [{student_id, status, note?}] }
  → upsert AttendanceRecord for each student; idempotent
GET  /erp/attendance/class/{class_section_id}/date/{date}
  → existing records for that day (to pre-fill the form)
```

#### Student detail, remarks, promotion, soft-disable, add new (teacher/admin)
```
GET   /erp/teacher/students/{student_profile_id}
  → complete student record: profile, user info, ALL attendance, ALL marks,
    ALL leave requests, ALL invoices, ALL payments, ALL remarks (teacher_only included),
    promotion history
  auth: teacher — student must be in one of their assigned class-sections

POST  /erp/teacher/students/{student_profile_id}/remarks
  body: { remark, remark_type, visibility }
  → create a new remark; teacher_id from auth token

PATCH /erp/teacher/students/{student_profile_id}/remarks/{remark_id}
  body: { remark?, remark_type?, visibility? }
  → edit own remark only

DELETE /erp/teacher/students/{student_profile_id}/remarks/{remark_id}
  → soft-delete (mark deleted, not purged); own remark only

POST  /erp/teacher/students/{student_profile_id}/promote
  body: { to_class_section_id, to_academic_year, exam_result, note? }
  → validates teacher is class_teacher for student's current class
  → inserts student_promotion_history record
  → updates student_profiles.class_section_id and class_name/section cache
  → updates student_profiles status back to "active" if previously detained
  → 409 if student already promoted this academic year

PATCH /erp/teacher/students/{student_profile_id}/status
  body: { status, exit_date?, exit_reason? }
  status ∈ active | transferred | withdrawn | expelled
  → sets student_profiles.status + erp_users.is_active = false (if not active)
  → does NOT delete any records
  → 200 with updated profile; teacher sees greyed-out student in list

POST  /erp/admin/students
  body: { full_name, email, date_of_birth, admission_no, roll_no,
          class_section_id, guardian_name, guardian_phone, address? }
  → creates ErpUser (password = date_of_birth as DDMMYYYY, hashed)
  → creates StudentProfile
  → auth: admin only (uses existing admin token pattern)
```

#### Exam schedules & admit card
```
GET  /erp/exam-schedules?class_section_id=        → upcoming exams for a class
GET  /erp/admit-card/{exam_schedule_id}           → student's admit card data (student auth)
```

#### Analytics
```
GET  /erp/analytics/class/{class_section_id}
  → { attendance_by_month[], marks_by_subject[], fee_summary, top_performers[], bottom_performers[] }
GET  /erp/analytics/student/{student_profile_id}
  → { attendance_trend[], marks_by_subject[], marks_over_time[], fee_timeline[] }
```

#### Teacher dashboard update
```
GET /erp/teacher/dashboard?class_section_id=      → existing endpoint gains optional filter param
```

### 4.2 Admin panel additions (existing Admin.jsx)
- Create/edit ClassSection
- Create/edit Subject
- Assign teacher → subject → class-section
- Create TimetableTemplate + TimetableSlot rows
- Create ExamSchedule rows

---

## 5. Frontend Design

### 5.1 Color palette (unchanged from website)
```
navy:   #1B3A6B (sidebar bg, primary actions)
crimson:#C92A2A (alerts, fee due, absent)
gold:   #D4A017 (grades, highlights, leave)
cream:  #FFFBF5 (page bg)
slate:  system slate scale (text, borders)
```
Fonts: Playfair Display (headings) + DM Sans (body) — already loaded.

### 5.2 Layout — Mobile-first

The teacher portal is designed **mobile-first**. Every interaction must be comfortable with one thumb on a phone held in portrait. Desktop is an enhancement, not the primary target.

**Mobile (<768px) — primary (iOS + Android Chrome)**
- Fixed top bar: school logo left, hamburger right, role badge centre
- Bottom tab bar (fixed, 56px tall) — 5 tabs with icon + label, thumb-zone placement
  - Teacher: Attendance · Students · Leaves · Marks · More
  - Student: Home · Attendance · Marks · Fees · More
- "More" tab opens a bottom sheet with remaining sections (Timetable, Analytics, Profile, Logout)
- All tap targets minimum 48×48px
- Forms use full-width inputs, large labels, no tiny inline elements
- No horizontal scroll anywhere except the timetable day-strip (intentional)
- Content area: 16px horizontal padding, no sidebar
- Heights use `100dvh` (dynamic viewport height) with `100vh` fallback — prevents Android Chrome address-bar resize breaking fixed layouts
- Bottom tab bar and submit buttons padded with `env(safe-area-inset-bottom)` — required for both iOS notch and Android gesture nav bar
- `touch-action: manipulation` on all chips, buttons, and cards — eliminates 300ms tap delay and disables accidental pinch-zoom on interactive elements
- `user-select: none` on attendance chips and card rows — prevents long-press text selection on Android
- `overscroll-behavior: contain` on all scrollable lists — prevents pull-to-refresh triggering inside the attendance chip grid or student list

**Tablet (768px–1023px)**
- Same as mobile but bottom tabs show full labels
- Bottom sheet replaced by a modal drawer from the right (50% width)

**Desktop (≥1024px)**
- Fixed left sidebar 260px wide, navy background
- School logo + nav items + user avatar at bottom
- Main area: cream background, max-w-7xl, padded
- Bottom tab bar hidden on desktop

### 5.3 File structure
```
src/pages/erp/
  ERPLogin.jsx              ← redesigned login with sidebar-style split
  ERPPortal.jsx             ← shell: Sidebar + router outlet
  student/
    Dashboard.jsx           ← greeting, KPI tiles, today's timetable strip, announcements
    Attendance.jsx          ← calendar (P/A/L/H), monthly trend, absence list
    ReportCard.jsx          ← CBSE pattern, print view
    Fees.jsx                ← invoice table + payment history + Razorpay
    Timetable.jsx           ← weekly grid
    Exams.jsx               ← exam schedule + AdmitCardModal
    Profile.jsx             ← student info
  teacher/
    Dashboard.jsx           ← stats, pending leaves, today's schedule
    Attendance.jsx          ← class+date selector, chip-grid, submit
    Students.jsx            ← table with class/section filter
    Marks.jsx               ← entry form + recorded table
    Leaves.jsx              ← approve/reject cards
    Timetable.jsx           ← read-only weekly view
    Analytics.jsx           ← class analytics with Recharts
  shared/
    Sidebar.jsx             ← desktop sidebar + mobile drawer
    StatTile.jsx            ← KPI card (reused from current)
    StatusBadge.jsx         ← reused
    ReceiptModal.jsx        ← reused
    AdmitCardModal.jsx      ← new printable modal
    ReportCardPrint.jsx     ← printable report card view
    StudentDetailModal.jsx  ← full-screen tabbed modal (profile, attendance, marks, fees, leaves, remarks)
    PromoteStudentModal.jsx ← confirmation modal for class promotion
    DisableStudentModal.jsx ← confirmation modal for soft-disable/re-enable
```

### 5.3b Admin panel additions (existing Admin.jsx)
- Create/edit ClassSection
- Create/edit Subject
- Assign teacher → subject → class-section
- Create TimetableTemplate + TimetableSlot rows
- Create ExamSchedule rows
- **Add new student** — form: name, email, DOB, admission no, roll no, class-section, guardian info. Default password = DOB as DDMMYYYY.

### 5.4 Student portal sections

#### Dashboard
- Greeting with time-of-day ("Good morning, Rahul")
- 4 KPI tiles: Fee Due (crimson), Attendance % (navy), Class Average (gold), Pending Leaves (slate)
- Today's period strip (horizontal scroll) — period blocks color-coded by subject
- **Historical Progress Chart** (Recharts ComposedChart):
  - X-axis: every exam in chronological order, spanning all academic years on record
  - Y-axis: marks percentage (0–100%)
  - One line per subject (each subject gets a distinct colour from the brand palette)
  - An "Overall %" line in navy (bolder, slightly thicker)
  - Vertical reference lines mark class promotions (e.g. "Promoted to Class 9-A")
  - Tooltip on hover: exam name, date, subject scores, overall %
  - If fewer than 2 exams on record, chart is hidden and a placeholder message shown
  - Data comes from the existing marks endpoint — no new API needed, computed on the client
- Teacher remarks with `visibility = student_visible` shown as a notice card below KPI tiles (gold left-border accent)
- Latest 3 announcements

#### Attendance
- Month/year selector
- Calendar grid: P=navy-100, A=crimson-100, L=gold-100, H=slate-100, S=white
- Monthly % trend (Recharts AreaChart — 6 months)
- List of absences this month with reason/note

#### Report Card
- Exam selector (Unit Test 1, Half-Yearly, etc.)
- Subject × exam marks table with grade column and class average column
- Overall % + grade badge + class rank
- Class teacher remark card
- Print button → `window.print()` on a styled print-only view

#### Fees
- Existing FeesPanel, improved layout

#### Timetable
- 6-column grid (Mon–Sat), 8 rows (periods)
- Today's column highlighted in navy-50
- Each cell: subject name, teacher name, time
- Break rows styled differently

#### Exams (Admit Card)
- Upcoming exam cards: subject, date, time, venue, max marks
- "Download Admit Card" button → opens AdmitCardModal
- AdmitCardModal: school header, student details, exam schedule table, print button

### 5.5 Teacher portal sections — mobile-first

#### Attendance — the most critical mobile screen
This screen is used daily, in a classroom, quickly. Every decision optimises for speed and fat-finger safety.

**Layout (mobile portrait):**
```
┌─────────────────────────────────┐
│ [Class 8-A ▾]    [Today ▾]  ✓  │  ← sticky top bar (56px)
├─────────────────────────────────┤
│ 32 students · 0 absent          │  ← live counter, updates on tap
├─────────────────────────────────┤
│  ● Aarav K    ● Priya S         │
│  ● Rahul M    ● Sneha T         │  ← 2-column chip grid
│  ✗ Amit J     ● Pooja R         │  ← absent chips: crimson bg
│  ...                            │
├─────────────────────────────────┤
│    [  Submit Attendance  ]      │  ← full-width, 56px tall, navy
└─────────────────────────────────┘
```

**Chip design:**
- Each chip: 72px wide × 48px tall minimum
- Green (present): navy-50 bg, navy border, student's initials avatar + first name
- Red (absent): crimson-50 bg, crimson border, name struck-through
- Single tap toggles; no long-press, no swipe — fat-finger safe
- Chips are sorted by roll number ascending

**Behaviour:**
- On load: GET existing records for date+class → pre-fill. If none, all green (present)
- Live absent counter in the sticky bar updates on every tap
- Submit button disabled until at least one chip has been set (prevents empty submits)
- On submit: spinner on button, chips non-interactive during request
- On success: button turns green with checkmark for 2s, then resets
- On error: toast, chips remain interactive for retry
- If teacher changes class-section or date after loading, a warning prompt appears ("Unsaved changes — discard?")

**Date picker:**
- Default: today
- Shows a bottom-sheet date picker on mobile (native `<input type="date">` styled)
- Dates with existing attendance records shown with a dot indicator in the picker

**Class-section selector:**
- Native `<select>` on mobile (OS-native picker — fast, accessible)
- If teacher has only one assigned class, selector is hidden entirely

#### Students
- Vertical card list on mobile (not a table — tables are unusable on phones)
- Each card: student name (bold), class-section + roll no, attendance % badge, marks avg badge, fee due (crimson if >0)
- Sticky search bar at top + class-section filter chips (horizontal scroll row of pill buttons)
- Tap a card → opens **StudentDetailModal** (full-screen slide-up sheet on mobile)
- Inactive/disabled students shown at the bottom, greyed out with status pill

#### StudentDetailModal (teacher view of a student — full-screen slide-up, tabbed)
On mobile: slides up from bottom, occupies 95% of screen height, draggable handle at top to dismiss.
On desktop: centred modal, 90vw max-w-5xl, scrollable.

**Header (always visible):** student name, class-section, roll no, admission no, guardian name + phone, profile KPIs (attendance %, avg marks %, fee due, pending leaves)

**Tab 1 — Overview**
- Same 4 KPI tiles as header
- Marks trend LineChart (marks % over all exams chronologically)
- Subject-wise average BarChart
- Last 3 absences + last 3 pending/recent leaves

**Tab 2 — Attendance**
- Month/year selector
- Full calendar grid for selected month (P/A/L/H colour coding, identical to student's own view)
- Monthly % trend AreaChart (all available months)
- Complete absence list with notes (all time, paginated)

**Tab 3 — Marks / Report Card**
- Exam selector (all exams on record)
- Full marks table: subject, marks obtained, max marks, grade, remarks, teacher, date
- Class average comparison per subject (if available)
- Overall % + grade per exam

**Tab 4 — Fees**
- All fee invoices: title, term, amount, paid, balance, status, due date
- All payment receipts: receipt no, date, method, amount
- Total paid vs total due summary

**Tab 5 — Leaves**
- Complete leave request history (all time)
- Status badges, dates, reason, reviewer note
- Days absent count from approved leaves

**Tab 6 — Remarks**
- List of all remarks for this student (teacher sees all; student_visible flag shown as a tag)
- "Add Remark" button → inline form: remark text (textarea), type (academic/behavioural/general), visibility toggle
- Edit / delete own remarks inline
- Remarks by other teachers shown read-only

**Action buttons (top-right of modal header)**
- **Promote to Next Class** — opens confirmation modal:
  - Shows current class, asks for destination class-section dropdown + academic year + exam result (Pass / Compartment / Detained)
  - Optional note field
  - Confirm → PATCH call + success toast + modal refreshes with new class shown
  - Only visible to the student's class teacher (is_class_teacher = true in TeacherSubjectAssignment)
- **Disable / Re-enable Student** — opens confirmation modal:
  - If active: asks for exit reason + date → sets withdrawn/transferred/expelled
  - If inactive: re-enables (sets active)
  - Student appears greyed-out with status badge in teacher's Students list after disable
  - Disabled students cannot login (erp_users.is_active = false)

#### Leaves (mobile-optimised)
- Full-width cards, stacked vertically
- Each card shows: student name, date range, days count, reason (truncated to 2 lines), status badge
- Approve / Reject buttons: full-width on mobile, side-by-side on desktop — both 48px tall
- Pending leaves appear first; resolved leaves collapsed under a "Show previous" toggle

#### Marks (mobile-optimised)
- Entry form uses full-width fields, stacked vertically
- Student selector: searchable native select with roll no prefix for quick scanning
- Subject pre-filled from teacher's assigned subject (editable)
- Numeric inputs (marks, max marks) use `inputMode="numeric"` for numeric keyboard on mobile
- Recorded marks: card list on mobile (not table), showing student / exam / score / grade

#### Analytics
- Class-section selector at top (native select, full width on mobile)
- 4 KPI tiles in 2×2 grid on mobile, 4×1 on desktop
- Charts stacked vertically on mobile, full width (no side-by-side)
- BarChart: horizontal bars on mobile (easier to read subject names) → vertical on desktop
- AreaChart: 4-month window on mobile (6 on desktop) — prevents label overlap
- PieChart: 260px diameter, centred, legend below on mobile
- Top/bottom performers: 3 cards each on mobile (not 5) to keep the screen scannable

---

## 6. Mobile UX Standards (iOS + Android)

These rules apply to every screen without exception.

### 6.1 Universal rules

| Constraint | Rule |
|---|---|
| Tap targets | Minimum 48×48px for every interactive element |
| Typography | Body text minimum 15px; labels minimum 12px |
| Tables | Never used on mobile — replaced with stacked cards |
| Horizontal scroll | Only permitted in: timetable day-strip, filter chip row |
| Modals on mobile | Slide-up bottom sheets (not centred modals) |
| Selects on mobile | Native `<select>` — no custom dropdowns |
| Forms | Full-width inputs, no side-by-side fields on mobile |
| Numeric inputs | `inputMode="numeric"` or `type="number"` always |
| Confirmation actions | Destructive actions require a second tap — no accidental triggers |
| Loading states | Skeleton loaders for list screens; spinner only for point actions (submit button) |
| Empty states | Friendly message + clear action CTA — never blank |
| Offline/slow network | Loading state shown after 300ms; error state has "Retry" |
| Safe area | `padding-bottom: env(safe-area-inset-bottom)` on bottom tab bar and submit buttons |
| Viewport height | Use `100dvh` with `100vh` fallback — never bare `100vh` on mobile |

### 6.2 Android-specific

Android Chrome has several quirks that break mobile web apps if not handled explicitly:

**Virtual keyboard resize (most critical for forms)**
- When a text input is focused on Android, the browser resizes the visual viewport. Fixed-position elements (tab bar, submit button) can jump, hide behind the keyboard, or overlap inputs.
- Solution: use the `visualViewport` API to detect keyboard open state:
  ```js
  // In ERPPortal.jsx shell
  useEffect(() => {
    const handler = () => {
      const keyboardOpen = window.visualViewport.height < window.innerHeight * 0.75
      document.documentElement.style.setProperty(
        '--keyboard-offset',
        keyboardOpen ? `${window.innerHeight - window.visualViewport.height}px` : '0px'
      )
    }
    window.visualViewport?.addEventListener('resize', handler)
    return () => window.visualViewport?.removeEventListener('resize', handler)
  }, [])
  ```
- Bottom tab bar and fixed submit buttons: `transform: translateY(calc(-1 * var(--keyboard-offset)))` — they ride up with the keyboard instead of getting buried
- The attendance submit button must remain visible when the date/class selectors at the top are focused

**Chip grid and touch events**
- `touch-action: manipulation` on every chip — prevents double-tap zoom (Android default behaviour that makes chips feel broken)
- `context-menu` event prevented on chips: `onContextMenu={e => e.preventDefault()}` — prevents Android long-press from opening the browser context menu mid-attendance
- No `:hover` styles on chips — Android fires hover on first tap, causing flicker. Use `:active` only for pressed state.

**Bottom sheet drag-to-dismiss**
- Implement using `touchstart` / `touchmove` / `touchend` events (not mouse events)
- Use `touch-action: pan-y` on the drag handle; `touch-action: none` on the rest of the sheet to prevent scroll fighting
- Velocity-based dismiss: if user flicks down at >300px/s, dismiss even if drag distance is small

**Input zoom prevention**
- Font size of all `<input>` and `<select>` elements must be ≥ 16px — Android Chrome (and iOS Safari) zooms the page automatically on focus if font size is smaller. This disrupts the fixed layout.

**`overscroll-behavior`**
- `overscroll-behavior-y: contain` on the chip grid scroll container and student list — prevents the Android pull-to-refresh gesture from triggering while the teacher is scrolling through students

**Android WebView (if wrapped in an app later)**
- All code must work in Android WebView (Chrome 85+)
- No use of `alert()` / `confirm()` / `prompt()` — they are blocked in WebView. All confirmations use inline UI (the confirmation modals already specified)

### 6.3 PWA (Progressive Web App) — add-to-home-screen

Teachers should be able to install the ERP as a home screen app on Android so it launches full-screen without the Chrome address bar.

**Required additions:**
- `public/manifest.json`: app name "NEV ERP", theme colour `#1B3A6B` (navy), background colour `#FFFBF5` (cream), `display: "standalone"`, icons at 192×192 and 512×512
- `<link rel="manifest">` in `index.html`
- `<meta name="theme-color" content="#1B3A6B">` in `index.html` — colours the Android status bar navy
- Service worker: **cache-first for static assets** (JS, CSS, fonts); **network-first for API calls** — attendance submits must always go to the server, never a stale cache
- When installed as PWA: bottom tab bar padding increases slightly (no browser chrome to contend with)

**Scope:** The ERP routes (`/erp`, `/erp-login`) should be the PWA scope. The main school website is not part of the PWA.

### 6.4 Browser support matrix

| Browser | Min version | Notes |
|---|---|---|
| Android Chrome | 85+ | Primary target |
| Samsung Internet | 14+ | Common on budget Android phones in Bihar/UP |
| iOS Safari | 15.4+ | For students / parents |
| Chrome Desktop | 90+ | Admin + teacher on desktop |
| Firefox Desktop | 90+ | Secondary desktop |

---

## 7. Charts — Recharts components used

| Chart | Location | Type |
|---|---|---|
| Monthly attendance trend | Student Attendance, Teacher Analytics | AreaChart |
| Subject marks bar | Student Report Card, Teacher Analytics | BarChart |
| Fee status | Teacher Analytics | PieChart (donut) |
| Marks over time | Student Report Card | LineChart |

---

## 7. Key UX decisions

- **Admit card**: generated client-side from API data, printed via `window.print()`. No server PDF generation.
- **Report card download**: same — CSS `@media print` hides sidebar, shows full print layout.
- **Bulk attendance**: optimistic UI — chips update immediately on click, submit sends the batch. No per-student spinner.
- **Teacher filter**: dropdown is populated from `GET /erp/teacher/assignments` — teacher only sees their own classes.
- **Mobile bottom tabs**: Dashboard, Attendance, Marks/Students (role-specific), Fees/Leaves, Profile.

---

## 8. Seed data additions (setup-db endpoint)

- 1 ClassSection: class 8, section A, 2025-26
- 3 Subjects: Mathematics, Science, English
- TeacherSubjectAssignment: teacher → Mathematics → 8-A (is_class_teacher=true)
- TimetableTemplate for 8-A with 6 days × 8 periods (sample slots)
- 2 ExamSchedules: Unit Test 2 and Half-Yearly
- AttendanceRecords updated to include class_section_id

---

## 9. Out of scope (future phases)

- Parent as a separate auth role
- SMS/OTP login
- Homework tracking
- Co-scholastic report card entries
- Server-side PDF generation
- Push notifications
- PostgreSQL migration (currently SQLite)
