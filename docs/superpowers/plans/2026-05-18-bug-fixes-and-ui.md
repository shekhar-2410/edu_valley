# Bug Fixes & UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix a production crash in event creation, eliminate N+1 query chains, patch five frontend bugs, and complete the mobile-hardening pass.

**Architecture:** Three-phase sequential execution — backend first (crash + perf), frontend bugs second, UI polish third. Each task is independently committable. No new dependencies added.

**Tech Stack:** FastAPI + SQLAlchemy (Python) · React + Vite + Tailwind CSS

> **Note:** `StudentDashboardView` (Today card + Pulse row) and `TeacherMarks` (spreadsheet grid) were already rebuilt by a previous Codex session. Tasks here skip those and cover only what remains.

---

## Phase 1 — Backend Bug Fixes

### Task 1: Fix `create_event` NameError crash

**Files:**
- Modify: `backend/main.py:720–733`

**What's broken:** Lines 725–728 reference `teacher`, `user`, and `leave` — all undefined in this function. Every `POST /events` throws `NameError` and returns HTTP 500.

- [ ] **Step 1: Locate the broken block**

Open `backend/main.py`. Find the `create_event` function starting at line 720. The broken block looks like:
```python
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Event(**event.dict())
    db.add(obj)
    if teacher:                          # ← NameError here
        teacher_user = db.query(models.ErpUser).filter(models.ErpUser.id == teacher.user_id).first()
        if teacher_user:
            create_notification(db, "erp", teacher_user.id, "Leave request pending", f"{user.full_name} requested leave from {leave.from_date}.", "leave", "/erp")
    db.commit()
```

- [ ] **Step 2: Remove the copy-pasted block**

Replace the entire `create_event` function body with:
```python
@app.post("/events", response_model=schemas.Event)
@app.post("/api/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Event(**event.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "create", "event", obj.id, after=model_snapshot(obj))
    db.commit()
    return obj
```

- [ ] **Step 3: Verify the fix manually**

Start the backend: `cd backend && python -m uvicorn main:app --reload`

In another terminal, run:
```bash
curl -s -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8000/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@nev.edu","password":"<admin-password>"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')" \
  -d '{"title":"Test Event","description":"A test","date":"2026-06-01"}' | python3 -m json.tool
```

Expected: JSON response with `id`, `title`, `date` fields. No 500 error.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "fix: remove undefined-variable block from create_event (NameError crash)"
```

---

### Task 2: Fix CORS misconfiguration

**Files:**
- Modify: `backend/main.py:58–65`

**What's broken:** `allow_origins=["*"]` + `allow_credentials=True` is rejected by browsers per the CORS spec. Credentialed fetches from the frontend fail in production.

- [ ] **Step 1: Replace the CORS middleware setup**

Find the current block (around line 58):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Replace with:
```python
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 2: Update the production `.env` on Render**

In the Render dashboard for the backend service, add:
```
CORS_ORIGINS=https://edu-valley.vercel.app,https://www.narendraeduvallley.com
```

(Replace with the actual frontend domain(s). The local dev fallback `http://localhost:5173` is already covered by the code default.)

- [ ] **Step 3: Verify locally**

Restart uvicorn. Run:
```bash
curl -s -I -X OPTIONS http://localhost:8000/events \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"
```

Expected: Response headers include `Access-Control-Allow-Origin: http://localhost:5173` (not `*`).

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "fix: CORS allow_origins reads from CORS_ORIGINS env var instead of wildcard"
```

---

### Task 3: Fix health endpoint returning 200 on DB failure

**Files:**
- Modify: `backend/main.py:606–612`

- [ ] **Step 1: Update the health handler**

Find the current `health` function:
```python
@app.get("/health")
@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected"}
```

Replace the `except` body:
```python
@app.get("/health")
@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
```

Note: `text` is already imported at the top of the file (`from sqlalchemy import inspect, text`). Remove the redundant local import.

- [ ] **Step 2: Commit**

```bash
git add backend/main.py
git commit -m "fix: health endpoint returns 503 when database is unavailable"
```

---

### Task 4: Fix deprecated Pydantic `.dict()` call

**Files:**
- Modify: `backend/main.py:692–694`

- [ ] **Step 1: Update `update_model_from_schema`**

Find:
```python
def update_model_from_schema(obj, payload):
    for key, value in payload.dict().items():
        setattr(obj, key, value)
    return obj
```

Replace:
```python
def update_model_from_schema(obj, payload):
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    return obj
```

- [ ] **Step 2: Commit**

```bash
git add backend/main.py
git commit -m "fix: replace deprecated .dict() with .model_dump() in update_model_from_schema"
```

---

### Task 5: Fix N+1 queries in teacher dashboard

**Files:**
- Modify: `backend/main.py` — `build_student_summary` and `get_teacher_dashboard`

**What's broken:** `get_teacher_dashboard` calls `build_student_summary(student, db)` once per student. Each call issues 3 separate DB queries (invoices, marks, attendance). For 40 students = 120+ queries per dashboard load.

- [ ] **Step 1: Add a batch summary builder**

After the existing `build_student_summary` function (around line 294), add:

```python
def build_student_summaries_batch(students: list, db: Session) -> list:
    if not students:
        return []
    student_ids = [s.id for s in students]
    user_ids = [s.user_id for s in students]

    users = {u.id: u for u in db.query(models.ErpUser).filter(models.ErpUser.id.in_(user_ids)).all()}

    all_invoices = db.query(models.FeeInvoice).filter(models.FeeInvoice.student_id.in_(student_ids)).all()
    invoices_map: dict = {}
    for inv in all_invoices:
        invoices_map.setdefault(inv.student_id, []).append(inv)

    all_marks = db.query(models.MarkEntry).filter(models.MarkEntry.student_id.in_(student_ids)).all()
    marks_map: dict = {}
    for m in all_marks:
        marks_map.setdefault(m.student_id, []).append(m)

    all_attendance = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id.in_(student_ids)).all()
    attendance_map: dict = {}
    for rec in all_attendance:
        attendance_map.setdefault(rec.student_id, []).append(rec)

    result = []
    for student in students:
        user = users.get(student.user_id)
        if not user:
            continue
        invoices = invoices_map.get(student.id, [])
        marks = marks_map.get(student.id, [])
        attendance = attendance_map.get(student.id, [])
        fee_due = sum(invoice_balance(inv) for inv in invoices)
        result.append({
            "user": user,
            "profile": student,
            "fee_due_paise": fee_due,
            "attendance_percent": attendance_percent(attendance),
            "latest_average_percent": average_percent(marks),
        })
    return result
```

- [ ] **Step 2: Wire it into `get_teacher_dashboard`**

Find the `get_teacher_dashboard` endpoint. Locate where it calls `build_student_summary` in a loop. It looks like:

```python
students = db.query(models.StudentProfile).filter(...).all()
# ... then somewhere:
student_summaries = [build_student_summary(s, db) for s in students]
```

Replace that list comprehension with:
```python
student_summaries = build_student_summaries_batch(students, db)
```

- [ ] **Step 3: Verify query count drops**

Restart uvicorn. Log in as the teacher and hit the dashboard endpoint:
```bash
curl -s http://localhost:8000/erp/teacher/dashboard \
  -H "Authorization: Bearer <teacher_token>" | python3 -m json.tool | head -20
```

Expected: Response within ~200ms, `students` array populated correctly.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "perf: batch-load student data in teacher dashboard (N+1 → 4 queries)"
```

---

### Task 6: Fix N+1 queries in admin teacher list and fee students

**Files:**
- Modify: `backend/main.py` — `admin_list_erp_teachers` and `admin_fee_students`

- [ ] **Step 1: Rewrite `admin_list_erp_teachers`**

Find the function at approximately line 997. Replace the entire function body with:

```python
@app.get("/admin/erp/teachers")
@app.get("/api/admin/erp/teachers")
def admin_list_erp_teachers(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    teachers = db.query(models.ErpUser).filter(models.ErpUser.role == "teacher").order_by(models.ErpUser.full_name).all()
    teacher_user_ids = [t.id for t in teachers]

    profiles = {p.user_id: p for p in db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id.in_(teacher_user_ids)).all()}
    profile_ids = [p.id for p in profiles.values()]

    assignments = db.query(models.TeacherSubjectAssignment).filter(models.TeacherSubjectAssignment.teacher_id.in_(profile_ids)).all()
    cs_ids = {a.class_section_id for a in assignments}
    subj_ids = {a.subject_id for a in assignments}

    class_sections = {cs.id: cs for cs in db.query(models.ClassSection).filter(models.ClassSection.id.in_(cs_ids)).all()} if cs_ids else {}
    subjects = {s.id: s for s in db.query(models.Subject).filter(models.Subject.id.in_(subj_ids)).all()} if subj_ids else {}

    assignments_by_teacher: dict = {}
    for a in assignments:
        assignments_by_teacher.setdefault(a.teacher_id, []).append(a)

    result = []
    for t in teachers:
        profile = profiles.get(t.id)
        if not profile:
            continue
        asgn_out = []
        for a in assignments_by_teacher.get(profile.id, []):
            cs = class_sections.get(a.class_section_id)
            subj = subjects.get(a.subject_id)
            asgn_out.append({
                "id": a.id,
                "class_section_id": a.class_section_id,
                "subject_id": a.subject_id,
                "academic_year": a.academic_year,
                "is_class_teacher": a.is_class_teacher,
                "class_section": {"id": cs.id, "class_name": cs.class_name, "section": cs.section, "academic_year": cs.academic_year} if cs else None,
                "subject": {"id": subj.id, "name": subj.name, "code": subj.code} if subj else None,
            })
        result.append({
            "user": {"id": t.id, "email": t.email, "full_name": t.full_name, "role": t.role, "phone": t.phone},
            "profile": {"id": profile.id, "employee_no": profile.employee_no, "department": profile.department, "subject": profile.subject},
            "assignments": asgn_out,
        })
    return result
```

- [ ] **Step 2: Rewrite `admin_fee_students`**

Find `admin_fee_students` at approximately line 1174. Replace the entire function body with:

```python
@app.get("/admin/erp/fees/students")
@app.get("/api/admin/erp/fees/students")
def admin_fee_students(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    students = db.query(models.StudentProfile).order_by(
        models.StudentProfile.class_name, models.StudentProfile.section, models.StudentProfile.roll_no
    ).all()
    student_ids = [s.id for s in students]
    user_ids = [s.user_id for s in students]

    users = {u.id: u for u in db.query(models.ErpUser).filter(models.ErpUser.id.in_(user_ids)).all()}

    all_invoices = db.query(models.FeeInvoice).filter(models.FeeInvoice.student_id.in_(student_ids)).order_by(models.FeeInvoice.due_date).all()
    invoices_map: dict = {}
    for inv in all_invoices:
        invoices_map.setdefault(inv.student_id, []).append(inv)

    all_payments = db.query(models.FeePayment).filter(
        models.FeePayment.student_id.in_(student_ids),
        models.FeePayment.status == "paid",
    ).order_by(models.FeePayment.paid_at.desc()).all()
    payments_map: dict = {}
    for p in all_payments:
        payments_map.setdefault(p.student_id, []).append(p)

    result = []
    for s in students:
        user = users.get(s.user_id)
        if not user:
            continue
        invoices = invoices_map.get(s.id, [])
        payments = payments_map.get(s.id, [])
        due = sum(invoice_balance(inv) for inv in invoices)
        result.append({
            "student_id": s.id,
            "full_name": user.full_name,
            "admission_no": s.admission_no,
            "class_name": s.class_name,
            "section": s.section,
            "fee_due_paise": due,
            "invoices": [
                {
                    "id": inv.id, "invoice_no": inv.invoice_no, "title": inv.title,
                    "term": inv.term, "amount_paise": inv.amount_paise,
                    "paid_paise": inv.paid_paise or 0, "due_date": str(inv.due_date),
                    "status": inv.status, "balance_paise": invoice_balance(inv),
                }
                for inv in invoices
            ],
            "payments": [
                {
                    "id": p.id, "amount_paise": p.amount_paise, "method": p.method,
                    "receipt_no": p.receipt_no, "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                }
                for p in payments
            ],
        })
    return result
```

- [ ] **Step 3: Verify admin teachers endpoint still returns correctly shaped data**

```bash
curl -s http://localhost:8000/admin/erp/teachers \
  -H "Authorization: Bearer <admin_token>" | python3 -m json.tool | head -40
```

Expected: Array of objects each with `user`, `profile`, `assignments` keys.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "perf: batch-load in admin teacher list and fee students (eliminate N+1 queries)"
```

---

### Task 7: Fix `admin_fee_summary` full-table scan

**Files:**
- Modify: `backend/main.py` — `admin_fee_summary` (~line 1152)

- [ ] **Step 1: Replace with SQL aggregates**

Find the current function:
```python
def admin_fee_summary(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    invoices = db.query(models.FeeInvoice).all()
    payments = db.query(models.FeePayment).filter(models.FeePayment.status == "paid").all()
    total_billed = sum(i.amount_paise for i in invoices)
    total_collected = sum(p.amount_paise for p in payments)
    ...
```

Replace the entire function body:
```python
@app.get("/admin/erp/fees/summary")
@app.get("/api/admin/erp/fees/summary")
def admin_fee_summary(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    from sqlalchemy import func as sqlfunc
    total_billed, invoice_count = db.query(
        sqlfunc.coalesce(sqlfunc.sum(models.FeeInvoice.amount_paise), 0),
        sqlfunc.count(models.FeeInvoice.id),
    ).first()
    total_collected, payment_count = db.query(
        sqlfunc.coalesce(sqlfunc.sum(models.FeePayment.amount_paise), 0),
        sqlfunc.count(models.FeePayment.id),
    ).filter(models.FeePayment.status == "paid").first()
    return {
        "total_billed_paise": int(total_billed),
        "total_collected_paise": int(total_collected),
        "outstanding_paise": max(0, int(total_billed) - int(total_collected)),
        "invoice_count": invoice_count,
        "payment_count": payment_count,
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/main.py
git commit -m "perf: admin fee summary uses SQL aggregates instead of loading all rows"
```

---

## Phase 2 — Frontend Bug Fixes

### Task 8: Add Guardian role to ERP login page

**Files:**
- Modify: `src/pages/ERPLogin.jsx`

- [ ] **Step 1: Add Shield to imports**

Find the import line at the top of `ERPLogin.jsx`:
```js
import { BookOpen, Lock, Mail, School, ShieldCheck, User, Users } from 'lucide-react'
```

Add `Shield`:
```js
import { BookOpen, Lock, Mail, School, Shield, ShieldCheck, User, Users } from 'lucide-react'
```

- [ ] **Step 2: Add guardian to `roleOptions`**

Find the `roleOptions` array. After the teacher entry, add:
```js
    {
        id: 'guardian',
        label: 'Guardian',
        icon: <Shield size={20} />,
        email: '',
        password: '',
        notes: ["Child's fees", 'Attendance', 'Leave status', 'Messages'],
    },
```

The full array becomes:
```js
const roleOptions = [
    {
        id: 'student',
        label: 'Student',
        icon: <User size={20} />,
        email: '',
        password: '',
        notes: ['Fee history', 'Marks', 'Leaves', 'Receipts'],
    },
    {
        id: 'teacher',
        label: 'Teacher',
        icon: <Users size={20} />,
        email: '',
        password: '',
        notes: ['Class overview', 'Leave approvals', 'Marks entry', 'Student records'],
    },
    {
        id: 'guardian',
        label: 'Guardian',
        icon: <Shield size={20} />,
        email: '',
        password: '',
        notes: ["Child's fees", 'Attendance', 'Leave status', 'Messages'],
    },
]
```

- [ ] **Step 3: Fix the role switcher grid**

The header role switcher currently uses `grid-cols-2`. With three roles, change it to `grid-cols-3`:

Find:
```jsx
<div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-2">
```

Replace:
```jsx
<div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-2">
```

Also fix the card grid below it — currently `md:grid-cols-2`, change to `md:grid-cols-3`:
```jsx
<div className="grid gap-4 md:grid-cols-3">
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Navigate to `/erp-login`. Confirm three role cards appear: Student, Teacher, Guardian. Confirm clicking Guardian selects it and the login form shows "Guardian Access".

- [ ] **Step 5: Commit**

```bash
git add src/pages/ERPLogin.jsx
git commit -m "fix: add Guardian role to ERP login page (guardians could not log in)"
```

---

### Task 9: Fix teacher nav icon collision

**Files:**
- Modify: `src/pages/ERPPortal.jsx` — `teacherNav` array (~line 260)

- [ ] **Step 1: Change Messages icon**

Find the `teacherNav` array. The `messages` entry currently uses `<Bell size={18} />`. Change it to `<MessageSquare size={18} />`:

Find:
```js
const teacherNav = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'leaves', label: 'Leaves', icon: <Bell size={18} /> },
    { id: 'marks', label: 'Marks', icon: <BookOpen size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'messages', label: 'Messages', icon: <Bell size={18} /> },
    { id: 'substitutions', label: 'Subs', icon: <School size={18} /> },
]
```

Replace:
```js
const teacherNav = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'leaves', label: 'Leaves', icon: <Bell size={18} /> },
    { id: 'marks', label: 'Marks', icon: <BookOpen size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
    { id: 'substitutions', label: 'Subs', icon: <School size={18} /> },
]
```

`MessageSquare` is already in the imports at the top of the file — no import change needed (confirm it's present).

- [ ] **Step 2: Commit**

```bash
git add src/pages/ERPPortal.jsx
git commit -m "fix: teacher nav Messages tab uses MessageSquare icon instead of Bell"
```

---

### Task 10: Fix `formatDate` UTC timezone offset

**Files:**
- Modify: `src/pages/ERPPortal.jsx:44–48`

**What's broken:** `new Date("2026-05-17")` parses as UTC midnight. In IST (+5:30) this renders as May 16 — one day off for all date-only strings.

- [ ] **Step 1: Update `formatDate`**

Find:
```js
const formatDate = (value) => {
    if (!value) return '—'
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}
```

Replace:
```js
const formatDate = (value) => {
    if (!value) return '—'
    const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value)
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}
```

The regex test matches `YYYY-MM-DD` date-only strings. For those, it appends `T00:00:00` which forces local time parsing. Full ISO strings with timezone info (`2026-05-17T10:30:00Z`) are passed through unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/pages/ERPPortal.jsx
git commit -m "fix: formatDate parses YYYY-MM-DD as local time to prevent IST off-by-one day"
```

---

### Task 11: Fix mobile bottom nav — add "More" overflow for teachers

**Files:**
- Modify: `src/pages/ERPPortal.jsx` — `BottomTabs` component and its call site

**What's broken:** `BOTTOM_NAV_COUNT = 5` slices teacher nav at 5, silently dropping Messages and Substitutions from mobile. Users cannot access these tabs on mobile without the sidebar.

- [ ] **Step 1: Update `BottomTabs` signature and implementation**

Find the `BottomTabs` component. Replace the entire component:

```jsx
const BottomTabs = ({ user, activeTab, setActiveTab, setDrawerOpen, keyboardOffset }) => {
    const navItems = user?.role === 'teacher' ? teacherNav : user?.role === 'guardian' ? guardianNav : studentNav
    const primaryItems = navItems.slice(0, 4)
    const hasOverflow = navItems.length > 4
    const overflowActive = hasOverflow && primaryItems.every((item) => item.id !== activeTab)

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white lg:hidden"
            style={{
                paddingBottom: `max(env(safe-area-inset-bottom), 4px)`,
                transform: `translateY(calc(-1 * ${keyboardOffset}))`,
            }}
        >
            <div className="flex">
                {primaryItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        style={{ touchAction: 'manipulation', userSelect: 'none' }}
                        className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-[48px] py-2 text-[10px] font-medium transition-colors ${
                            activeTab === item.id
                                ? 'text-brand-navy-700'
                                : 'text-slate-400'
                        }`}
                    >
                        <span className={activeTab === item.id ? 'text-brand-navy-700' : 'text-slate-400'}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
                {hasOverflow && (
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        style={{ touchAction: 'manipulation', userSelect: 'none' }}
                        className={`relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[48px] py-2 text-[10px] font-medium transition-colors ${
                            overflowActive ? 'text-brand-navy-700' : 'text-slate-400'
                        }`}
                    >
                        <Menu size={18} />
                        More
                        {overflowActive && (
                            <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-brand-navy-600" />
                        )}
                    </button>
                )}
            </div>
        </nav>
    )
}
```

Also remove the `BOTTOM_NAV_COUNT` constant — it's no longer used.

- [ ] **Step 2: Update the `BottomTabs` call site**

Find where `BottomTabs` is rendered (around line 659):
```jsx
<BottomTabs user={user} activeTab={activeTab} setActiveTab={setActiveTab} keyboardOffset={keyboardOffset} />
```

Add `setDrawerOpen`:
```jsx
<BottomTabs user={user} activeTab={activeTab} setActiveTab={setActiveTab} setDrawerOpen={setDrawerOpen} keyboardOffset={keyboardOffset} />
```

- [ ] **Step 3: Verify on mobile viewport**

In browser devtools, switch to a mobile viewport (375px width). Log in as teacher. Confirm: Dashboard, Attendance, Students, Leaves tabs visible + "More" button. Tap "More" → drawer opens showing all nav items including Messages and Substitutions. Tap Messages → active dot appears on More button.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ERPPortal.jsx
git commit -m "fix: mobile bottom nav 'More' overflow for teachers — Messages and Subs no longer clipped"
```

---

### Task 12: Hide ThemeToggle on ERP and admin routes

**Files:**
- Modify: `src/App.jsx`

**What's broken:** `ThemeToggle` renders on all routes. Its fixed `bottom-6 left-6` position overlaps the mobile bottom nav on ERP pages.

- [ ] **Step 1: Conditionally render ThemeToggle**

In `AppContent`, find the `ThemeToggle` component near the bottom of the return:
```jsx
      <ThemeToggle />
    </div>
  )
}
```

Wrap it in the existing `isAppRoute` guard (same pattern used for Navbar, Footer, ScrollToTop):
```jsx
      {!isAppRoute && <ThemeToggle />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: hide ThemeToggle on ERP and admin routes (overlapped mobile nav)"
```

---

## Phase 3 — UI Polish

### Task 13: Typography reset in `ERPPortal.jsx`

**Files:**
- Modify: `src/pages/ERPPortal.jsx`

**What:** Remove `font-black` from nav items, user name, logout button, and bottom nav labels. Admin.jsx already has this done — apply the same rules to ERP.

- [ ] **Step 1: Fix sidebar nav item styles**

Find the `NavContent` inner component inside `Sidebar`. The nav item button has:
```jsx
className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition-all ${...}`}
```

Change `font-black` to `font-semibold`:
```jsx
className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${...}`}
```

- [ ] **Step 2: Fix sidebar user name and role**

Find:
```jsx
<p className="truncate text-sm font-black text-white">{user?.full_name}</p>
<p className="text-xs font-bold capitalize text-white/50">{user?.role}</p>
```

Replace:
```jsx
<p className="truncate text-sm font-semibold text-white">{user?.full_name}</p>
<p className="text-xs font-medium capitalize text-white/50">{user?.role}</p>
```

- [ ] **Step 3: Fix sidebar logout button**

Find:
```jsx
className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white"
```

Replace:
```jsx
className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white"
```

- [ ] **Step 4: Fix mobile top bar page label**

Find:
```jsx
<span className="text-sm font-black text-slate-900">{currentPageLabel}</span>
```

Replace:
```jsx
<span className="text-sm font-semibold text-slate-900">{currentPageLabel}</span>
```

- [ ] **Step 5: Fix mobile top bar avatar**

Find:
```jsx
<div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy-100 text-xs font-black text-brand-navy-700">
```

Replace:
```jsx
<div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy-100 text-xs font-bold text-brand-navy-700">
```

- [ ] **Step 6: Fix ERP portal sidebar header text**

Find inside `NavContent`:
```jsx
<p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">NEV School</p>
<p className="text-sm font-black text-white">ERP Portal</p>
```

Replace:
```jsx
<p className="text-xs font-semibold uppercase tracking-widest text-white/50">NEV School</p>
<p className="text-sm font-bold text-white">ERP Portal</p>
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/ERPPortal.jsx
git commit -m "style: typography reset in ERP portal — font-black → font-semibold on nav and chrome"
```

---

### Task 14: Mobile hardening — DataTable card view, SideSheet animation, touch targets

**Files:**
- Modify: `src/components/ui/DataTable.jsx`
- Modify: `src/components/ui/SideSheet.jsx`

#### SideSheet animation

- [ ] **Step 1: Add slide-in animation to SideSheet**

Open `src/components/ui/SideSheet.jsx`. The `aside` element currently has no entry animation. Add Tailwind's `animate-in slide-in-from-right` (requires `tailwindcss-animate` plugin) — or since the project uses plain Tailwind, use a CSS transition instead.

Replace the `aside` className:
```jsx
<aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out">
```

With — using CSS animation via a style attribute instead (works without extra plugins):
```jsx
<aside
    className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl"
    style={{ animation: 'sheet-in 200ms ease-out' }}
>
```

Add the keyframe to `src/index.css` (after existing keyframes):
```css
@keyframes sheet-in {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
}
```

- [ ] **Step 2: Commit SideSheet fix**

```bash
git add src/components/ui/SideSheet.jsx src/index.css
git commit -m "style: SideSheet slides in from right (200ms ease-out)"
```

#### DataTable mobile card view

- [ ] **Step 3: Add mobile card-list rendering to DataTable**

Open `src/components/ui/DataTable.jsx`. The component currently always renders a `<table>`. On mobile, tables overflow horizontally and are hard to use.

Find where `visibleRows` is rendered into the table. Wrap the table in a hidden-on-mobile div and add a card-list view for mobile:

After the filter/search toolbar (before the `<div className="overflow-x-auto">` table wrapper), add:

```jsx
  {/* Mobile card list */}
  <div className="divide-y divide-slate-100 md:hidden">
    {visibleRows.length === 0 ? (
      <p className="px-4 py-8 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
    ) : visibleRows.map((row) => {
      const key = String(getRowKey(row))
      const visibleColumns = columns.filter((col) => col.mobile !== false).slice(0, 3)
      return (
        <div
          key={key}
          className={`flex items-start gap-3 px-4 py-3 ${rowClassName?.(row) || ''}`}
        >
          {hasBulkActions && (
            <input
              type="checkbox"
              checked={selectedSet.has(key)}
              onChange={() => toggleRow(key)}
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-navy-600"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            {visibleColumns.map((col) => {
              const value = col.cell ? col.cell(row) : col.accessor ? col.accessor(row) : row[col.key]
              return (
                <div key={col.key} className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400 w-20">{col.header}</span>
                  <span className="truncate text-sm font-semibold text-slate-800">{value ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    })}
  </div>

  {/* Desktop table */}
  <div className="hidden overflow-x-auto md:block">
```

Close the `hidden md:block` div after the closing `</table>` tag:
```jsx
  </table>
  </div>
```

- [ ] **Step 4: Add touch-target sizing to DataTable action buttons**

The existing DataTable renders action buttons passed via `columns`. Ensure any icon-only buttons in the codebase that use DataTable have `min-h-[44px] min-w-[44px]` or equivalent padding. In `Admin.jsx`, find icon button definitions inside column `cell` renderers and add `min-h-[44px]` to their className if not present. This is a search-and-fix — look for `p-2` + `Trash2`, `Pencil`, `Eye` icon buttons inside DataTable column definitions.

- [ ] **Step 5: Commit DataTable mobile view**

```bash
git add src/components/ui/DataTable.jsx
git commit -m "feat: DataTable renders card-list on mobile (< md), table on desktop"
```

---

## Done

After Task 14, all 14 tasks are complete. The backend no longer crashes on event creation, has correct CORS, returns proper HTTP codes, and runs ~30× fewer queries per teacher/admin dashboard load. The frontend has guardian login, correct icons, correct date formatting, full mobile nav, and polished typography.

Run a final smoke-test:
```bash
# Backend
cd backend && python -m uvicorn main:app --reload &
curl -s http://localhost:8000/health          # → {"status":"healthy",...}
curl -s -X POST http://localhost:8000/events \ # → event JSON, no 500
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"T","description":"D","date":"2026-06-01"}'

# Frontend
cd .. && npm run dev
# Open http://localhost:5173/erp-login → see 3 role cards
# Open http://localhost:5173/erp → teacher bottom nav shows 4 tabs + More
```
