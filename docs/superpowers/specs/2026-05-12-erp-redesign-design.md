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

### 3.2 Modified existing tables

| Table | Change |
|---|---|
| `student_profiles` | Add `class_section_id FK → class_sections` (nullable for migration); keep `class_name`/`section` strings as display cache |
| `teacher_profiles` | Add `is_active BOOLEAN default true`; keep old `class_teacher_of`/`subject` strings as nullable legacy (do not drop until data migrated) |
| `attendance_records` | Add `class_section_id FK → class_sections` nullable; add `marked_by_teacher_id FK → teacher_profiles` nullable |
| `mark_entries` | Add `subject_id FK → subjects` nullable; keep `subject` string as display cache |
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

### 5.2 Layout

**Desktop (≥1024px)**
- Fixed left sidebar 260px wide, navy background
- School logo top + nav items + user avatar+name at bottom
- Main area: cream background, max-w-7xl, padded

**Tablet/Mobile (<1024px)**
- Hamburger button (top-left) → navy slide-out drawer
- Bottom tab bar with 5 most-used sections (icons only)
- Sidebar collapses completely

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
```

### 5.4 Student portal sections

#### Dashboard
- Greeting with time-of-day ("Good morning, Rahul")
- 4 KPI tiles: Fee Due (crimson), Attendance % (navy), Class Average (gold), Pending Leaves (slate)
- Today's period strip (horizontal scroll) — period blocks color-coded by subject
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

### 5.5 Teacher portal sections

#### Attendance (new, real-time bulk)
- Step 1: Select class-section (dropdown) + date (date picker)
- Step 2: Load all students in that class via API
- Display: grid of student chips — green border = present, red = absent
- Default: all chips set to present
- Teacher clicks a chip to toggle absent/present
- Submit button → POST /erp/attendance/bulk
- If records exist for that date, pre-fill from API (GET before render)
- Success: toast + chips lock for 3 seconds

#### Students
- Search bar + class-section filter dropdown (populated from teacher's assignments)
- Table: name, admission no, class-section, fee due, attendance %, marks avg
- Clicking a row expands inline to show last 3 marks entries

#### Analytics
- Class-section selector (teacher sees only their assigned classes)
- 4 KPI tiles: total students, avg attendance %, avg marks %, fee collection %
- Recharts BarChart: subject-wise class average marks
- Recharts AreaChart: monthly attendance trend (last 6 months)
- Recharts PieChart: fee status distribution (paid/partial/pending)
- Top 5 performers table + bottom 5 performers table

---

## 6. Charts — Recharts components used

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
