from fastapi import FastAPI, Depends, File, Header, HTTPException, Request, UploadFile, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import inspect, text
import base64
import hashlib
import hmac
import json
import os
import secrets
import urllib.error
import urllib.request
from dotenv import load_dotenv
load_dotenv()

import models
import schemas
from database import SessionLocal, engine

from collections import defaultdict
from time import time as _time

_contact_rate_limit: dict = defaultdict(list)
_CONTACT_RATE_LIMIT_WINDOW = 3600  # 1 hour
_CONTACT_RATE_LIMIT_MAX = 5  # 5 submissions per IP per hour

# Create the database tables on startup
models.Base.metadata.create_all(bind=engine)

def ensure_lightweight_migrations():
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "contacts" in table_names:
        columns = {column["name"] for column in inspector.get_columns("contacts")}
        with engine.begin() as connection:
            if "status" not in columns:
                connection.execute(text("ALTER TABLE contacts ADD COLUMN status VARCHAR(20) DEFAULT 'new'"))
            if "read" not in columns:
                connection.execute(text("ALTER TABLE contacts ADD COLUMN read BOOLEAN DEFAULT false"))
    for table_name in (
        "events",
        "faculty",
        "gallery_images",
        "announcements",
        "student_profiles",
        "teacher_profiles",
        "fee_invoices",
    ):
        if table_name not in table_names:
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "deleted_at" in columns:
            continue
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN deleted_at DATETIME"))
    if "stored_images" in table_names:
        columns = {column["name"] for column in inspector.get_columns("stored_images")}
        with engine.begin() as connection:
            if "thumbnail_content_type" not in columns:
                connection.execute(text("ALTER TABLE stored_images ADD COLUMN thumbnail_content_type VARCHAR(50)"))
            if "thumbnail_data" not in columns:
                connection.execute(text("ALTER TABLE stored_images ADD COLUMN thumbnail_data BLOB"))

ensure_lightweight_migrations()

app = FastAPI(title="School Management API")

# CORS
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Constants
SECRET_KEY = os.getenv("SECRET_KEY")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
if not SECRET_KEY:
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "SECRET_KEY environment variable is required in production. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    SECRET_KEY = "dev-secret-change-in-production"
    import warnings
    warnings.warn("Using insecure default SECRET_KEY for development. Set SECRET_KEY env var.", RuntimeWarning)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Base URL for image URL rewriting
RENDER_BASE_URL = os.getenv("RENDER_EXTERNAL_URL", "https://edu-valley.onrender.com")

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helpers
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def fix_image_url(url: Optional[str]) -> Optional[str]:
    """Replace localhost URLs with the production base URL."""
    if url and "localhost:8000" in url:
        return url.replace("http://localhost:8000", RENDER_BASE_URL)
    return url

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def invoice_balance(invoice: models.FeeInvoice) -> int:
    return max(0, invoice.amount_paise - (invoice.paid_paise or 0))

def sync_invoice_status(invoice: models.FeeInvoice):
    if (invoice.paid_paise or 0) >= invoice.amount_paise:
        invoice.status = "paid"
    elif (invoice.paid_paise or 0) > 0:
        invoice.status = "partial"
    else:
        invoice.status = "pending"

def generate_receipt_no(payment_id: int) -> str:
    return f"NEV-RCPT-{payment_id:05d}"

def attendance_percent(records: List[models.AttendanceRecord]) -> float:
    if not records:
        return 0.0
    present = len([record for record in records if record.status == "present"])
    return round((present / len(records)) * 100, 1)

def average_percent(marks: List[models.MarkEntry]) -> float:
    if not marks:
        return 0.0
    percentages = [
        (entry.marks_obtained / entry.max_marks) * 100
        for entry in marks
        if entry.max_marks
    ]
    if not percentages:
        return 0.0
    return round(sum(percentages) / len(percentages), 1)

def model_snapshot(obj, fields: Optional[List[str]] = None):
    if not obj:
        return None
    keys = fields or [column.name for column in obj.__table__.columns]
    snapshot = {}
    for key in keys:
        value = getattr(obj, key, None)
        if isinstance(value, (datetime, date)):
            value = value.isoformat()
        snapshot[key] = value
    return snapshot

def create_audit_log(
    db: Session,
    actor_kind: str,
    actor_email: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    before=None,
    after=None,
):
    db.add(models.AuditLog(
        actor_kind=actor_kind,
        actor_email=actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        before_json=json.dumps(before, default=str) if before is not None else None,
        after_json=json.dumps(after, default=str) if after is not None else None,
    ))

def create_notification(
    db: Session,
    recipient_kind: str,
    recipient_id: int,
    title: str,
    body: Optional[str] = None,
    type_: str = "info",
    link: Optional[str] = None,
):
    db.add(models.Notification(
        recipient_kind=recipient_kind,
        recipient_id=recipient_id,
        title=title,
        body=body,
        type=type_,
        link=link,
    ))

def get_guardian_student_ids(user: models.ErpUser, db: Session) -> List[int]:
    if user.role != "guardian":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guardian access required")
    return [
        link.student_id
        for link in db.query(models.GuardianStudent).filter(models.GuardianStudent.guardian_user_id == user.id).all()
    ]

def ensure_guardian_link(db: Session, student: models.StudentProfile) -> Optional[dict]:
    phone = "".join(ch for ch in (student.guardian_phone or "") if ch.isdigit())
    if not phone:
        return None
    guardian_email = f"guardian+{phone}@nev.local"
    guardian_user = db.query(models.ErpUser).filter(models.ErpUser.email == guardian_email).first()
    generated_password = None
    if not guardian_user:
        generated_password = secrets.token_urlsafe(10)
        guardian_user = models.ErpUser(
            email=guardian_email,
            hashed_password=pwd_context.hash(generated_password),
            role="guardian",
            full_name=student.guardian_name or f"Guardian {phone[-4:]}",
            phone=student.guardian_phone,
        )
        db.add(guardian_user)
        db.flush()
    existing = db.query(models.GuardianStudent).filter(
        models.GuardianStudent.guardian_user_id == guardian_user.id,
        models.GuardianStudent.student_id == student.id,
    ).first()
    if not existing:
        db.add(models.GuardianStudent(
            guardian_user_id=guardian_user.id,
            student_id=student.id,
            relationship="guardian",
        ))
    if generated_password:
        return {"email": guardian_user.email, "password": generated_password}
    return {"email": guardian_user.email, "password": None}

async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    user = db.query(models.AdminUser).filter(models.AdminUser.email == email).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

def require_admin_authorization(authorization: Optional[str], db: Session):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authorization required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authorization required")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authorization required")
    user = db.query(models.AdminUser).filter(models.AdminUser.email == email).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authorization required")
    return user

async def get_current_erp_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        if not email or token_type != "erp":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    user = db.query(models.ErpUser).filter(models.ErpUser.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

def get_student_profile_for_user(user: models.ErpUser, db: Session) -> models.StudentProfile:
    if user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    profile = db.query(models.StudentProfile).filter(
        models.StudentProfile.user_id == user.id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile

def get_teacher_profile_for_user(user: models.ErpUser, db: Session) -> models.TeacherProfile:
    if user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
    profile = db.query(models.TeacherProfile).filter(
        models.TeacherProfile.user_id == user.id,
        models.TeacherProfile.deleted_at.is_(None),
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return profile

def build_student_summary(student: models.StudentProfile, db: Session) -> schemas.StudentSummary:
    user = db.query(models.ErpUser).filter(models.ErpUser.id == student.user_id).first()
    invoices = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.student_id == student.id,
        models.FeeInvoice.deleted_at.is_(None),
    ).all()
    marks = db.query(models.MarkEntry).filter(models.MarkEntry.student_id == student.id).all()
    attendance = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student.id).all()
    fee_due = sum(invoice_balance(invoice) for invoice in invoices)
    return {
        "user": user,
        "profile": student,
        "fee_due_paise": fee_due,
        "attendance_percent": attendance_percent(attendance),
        "latest_average_percent": average_percent(marks),
    }

def build_student_summaries_batch(students: list, db: Session) -> list:
    if not students:
        return []
    student_ids = [s.id for s in students]
    user_ids = [s.user_id for s in students]

    users = {u.id: u for u in db.query(models.ErpUser).filter(models.ErpUser.id.in_(user_ids)).all()}

    all_invoices = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.student_id.in_(student_ids),
        models.FeeInvoice.deleted_at.is_(None),
    ).all()
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

# Temporary Setup Route to seed Admin Data on Render
@app.get("/setup-db")
@app.get("/api/setup-db")
def setup_db(db: Session = Depends(get_db)):
    if os.getenv("ALLOW_DEMO_SETUP", "").lower() != "true":
        raise HTTPException(
            status_code=403,
            detail="Demo setup is disabled. Set ALLOW_DEMO_SETUP=true and explicit DEMO_*_PASSWORD values in a non-production environment.",
        )
    admin_password = os.getenv("DEMO_ADMIN_PASSWORD")
    teacher_password = os.getenv("DEMO_TEACHER_PASSWORD")
    student_password = os.getenv("DEMO_STUDENT_PASSWORD")
    if not all([admin_password, teacher_password, student_password]):
        raise HTTPException(status_code=400, detail="DEMO_ADMIN_PASSWORD, DEMO_TEACHER_PASSWORD, and DEMO_STUDENT_PASSWORD are required")

    created = []

    admin = db.query(models.AdminUser).filter(models.AdminUser.email == "admin@nev.edu").first()
    if not admin:
        db.add(models.AdminUser(
            email="admin@nev.edu",
            hashed_password=pwd_context.hash(admin_password),
            is_admin=True,
        ))
        created.append("admin")

    teacher_user = db.query(models.ErpUser).filter(models.ErpUser.email == "teacher@nev.edu").first()
    if not teacher_user:
        teacher_user = models.ErpUser(
            email="teacher@nev.edu",
            hashed_password=pwd_context.hash(teacher_password),
            role="teacher",
            full_name="Anita Sharma",
            phone="9876543210",
        )
        db.add(teacher_user)
        db.flush()
        created.append("teacher")

    teacher_profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.employee_no == "NEV-T-001").first()
    if not teacher_profile:
        teacher_profile = models.TeacherProfile(
            user_id=teacher_user.id,
            employee_no="NEV-T-001",
            department="Senior School",
            subject="Mathematics",
            phone="9876543210",
            class_teacher_of="Class 8 A",
        )
        db.add(teacher_profile)
        db.flush()

    student_user = db.query(models.ErpUser).filter(models.ErpUser.email == "student@nev.edu").first()
    if not student_user:
        student_user = models.ErpUser(
            email="student@nev.edu",
            hashed_password=pwd_context.hash(student_password),
            role="student",
            full_name="Aarav Kumar",
            phone="9123456780",
        )
        db.add(student_user)
        db.flush()
        created.append("student")

    student_profile = db.query(models.StudentProfile).filter(models.StudentProfile.admission_no == "NEV-2026-008").first()
    if not student_profile:
        student_profile = models.StudentProfile(
            user_id=student_user.id,
            admission_no="NEV-2026-008",
            roll_no="08",
            class_name="8",
            section="A",
            guardian_name="Priya Kumar",
            guardian_phone="9988776655",
            address="Patna, Bihar",
        )
        db.add(student_profile)
        db.flush()

    if not db.query(models.FeeInvoice).filter(models.FeeInvoice.invoice_no == "NEV-FEE-2026-Q1-008").first():
        db.add(models.FeeInvoice(
            student_id=student_profile.id,
            invoice_no="NEV-FEE-2026-Q1-008",
            title="Quarter 1 Tuition Fee",
            term="Apr-Jun 2026",
            amount_paise=1600000,
            paid_paise=1600000,
            due_date=date(2026, 4, 15),
            status="paid",
        ))

    if not db.query(models.FeeInvoice).filter(models.FeeInvoice.invoice_no == "NEV-FEE-2026-Q2-008").first():
        db.add(models.FeeInvoice(
            student_id=student_profile.id,
            invoice_no="NEV-FEE-2026-Q2-008",
            title="Quarter 2 Tuition Fee",
            term="Jul-Sep 2026",
            amount_paise=1650000,
            paid_paise=0,
            due_date=date(2026, 7, 15),
            status="pending",
        ))
    db.flush()

    q1_invoice = db.query(models.FeeInvoice).filter(models.FeeInvoice.invoice_no == "NEV-FEE-2026-Q1-008").first()
    if q1_invoice and not db.query(models.FeePayment).filter(models.FeePayment.receipt_no == "NEV-RCPT-00001").first():
        db.add(models.FeePayment(
            invoice_id=q1_invoice.id,
            student_id=student_profile.id,
            amount_paise=1600000,
            method="cash",
            status="paid",
            receipt_no="NEV-RCPT-00001",
            paid_at=datetime(2026, 4, 10, 10, 30, tzinfo=timezone.utc),
        ))

    if not db.query(models.LeaveRequest).filter(
        models.LeaveRequest.student_id == student_profile.id,
        models.LeaveRequest.from_date == date(2026, 5, 6),
    ).first():
        db.add(models.LeaveRequest(
            student_id=student_profile.id,
            teacher_id=teacher_profile.id,
            from_date=date(2026, 5, 6),
            to_date=date(2026, 5, 7),
            days_count=2,
            reason="Medical leave",
            status="approved",
            reviewer_note="Approved. Submit medical note to class teacher.",
        ))

    if not db.query(models.MarkEntry).filter(
        models.MarkEntry.student_id == student_profile.id,
        models.MarkEntry.exam_name == "Unit Test 1",
    ).first():
        db.add_all([
            models.MarkEntry(
                student_id=student_profile.id,
                teacher_id=teacher_profile.id,
                subject="Mathematics",
                exam_name="Unit Test 1",
                marks_obtained=43,
                max_marks=50,
                grade="A",
                remarks="Strong problem solving",
                exam_date=date(2026, 4, 28),
            ),
            models.MarkEntry(
                student_id=student_profile.id,
                teacher_id=teacher_profile.id,
                subject="Science",
                exam_name="Unit Test 1",
                marks_obtained=40,
                max_marks=50,
                grade="A",
                remarks="Good conceptual clarity",
                exam_date=date(2026, 4, 29),
            ),
        ])

    if not db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_profile.id).first():
        db.add_all([
            models.AttendanceRecord(student_id=student_profile.id, date=date(2026, 5, 1), status="present"),
            models.AttendanceRecord(student_id=student_profile.id, date=date(2026, 5, 4), status="present"),
            models.AttendanceRecord(student_id=student_profile.id, date=date(2026, 5, 5), status="present"),
            models.AttendanceRecord(student_id=student_profile.id, date=date(2026, 5, 6), status="leave", note="Approved leave"),
            models.AttendanceRecord(student_id=student_profile.id, date=date(2026, 5, 7), status="leave", note="Approved leave"),
            models.AttendanceRecord(student_id=student_profile.id, date=date(2026, 5, 8), status="present"),
        ])

    # ClassSection
    class_section = db.query(models.ClassSection).filter(
        models.ClassSection.class_name == "8",
        models.ClassSection.section == "A",
        models.ClassSection.academic_year == "2025-26",
    ).first()
    if not class_section:
        class_section = models.ClassSection(
            class_name="8", section="A", academic_year="2025-26", is_active=True
        )
        db.add(class_section)
        db.flush()
        created.append("class_section")

    # Subjects
    subjects_data = [
        ("Mathematics", "MATH"),
        ("Science", "SCI"),
        ("English", "ENG"),
    ]
    subject_objs = {}
    for name, code in subjects_data:
        subj = db.query(models.Subject).filter(models.Subject.code == code).first()
        if not subj:
            subj = models.Subject(name=name, code=code)
            db.add(subj)
            db.flush()
        subject_objs[code] = subj

    # TeacherSubjectAssignment
    if not db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_profile.id
    ).first():
        db.add(models.TeacherSubjectAssignment(
            teacher_id=teacher_profile.id,
            subject_id=subject_objs["MATH"].id,
            class_section_id=class_section.id,
            academic_year="2025-26",
            is_class_teacher=True,
        ))
        db.add(models.TeacherSubjectAssignment(
            teacher_id=teacher_profile.id,
            subject_id=subject_objs["SCI"].id,
            class_section_id=class_section.id,
            academic_year="2025-26",
            is_class_teacher=False,
        ))

    # StudentClassEnrollment
    if not db.query(models.StudentClassEnrollment).filter(
        models.StudentClassEnrollment.student_id == student_profile.id
    ).first():
        enrollment = models.StudentClassEnrollment(
            student_id=student_profile.id,
            class_section_id=class_section.id,
            academic_year="2025-26",
            roll_no="08",
            is_current=True,
        )
        db.add(enrollment)
        db.flush()

    # Update student profile with new fields
    if not student_profile.class_section_id:
        student_profile.class_section_id = class_section.id
        student_profile.blood_group = "B+"
        student_profile.status = "active"

    # ExamSchedules
    if not db.query(models.ExamSchedule).filter(
        models.ExamSchedule.class_section_id == class_section.id,
        models.ExamSchedule.exam_name == "Unit Test 2",
    ).first():
        db.add(models.ExamSchedule(
            class_section_id=class_section.id,
            subject_id=subject_objs["MATH"].id,
            exam_name="Unit Test 2",
            exam_date=date(2026, 6, 10),
            start_time="09:00",
            end_time="10:00",
            venue="Main Hall",
            hall_no="A",
            academic_year="2025-26",
            max_marks=50,
        ))
        db.add(models.ExamSchedule(
            class_section_id=class_section.id,
            subject_id=subject_objs["SCI"].id,
            exam_name="Half-Yearly Exam",
            exam_date=date(2026, 9, 15),
            start_time="09:00",
            end_time="12:00",
            venue="Main Hall",
            hall_no="B",
            academic_year="2025-26",
            max_marks=100,
        ))

    # Timetable slots for 8-A (sample week)
    if not db.query(models.TimetableSlot).filter(
        models.TimetableSlot.class_section_id == class_section.id
    ).first():
        periods = [
            ("08:00", "08:45"), ("08:45", "09:30"), ("09:30", "10:15"),
            ("10:15", "10:30"),  # break
            ("10:30", "11:15"), ("11:15", "12:00"), ("12:00", "12:45"), ("12:45", "13:30"),
        ]
        subj_cycle = [subject_objs["MATH"].id, subject_objs["SCI"].id, subject_objs["ENG"].id,
                      None, subject_objs["MATH"].id, subject_objs["SCI"].id, subject_objs["ENG"].id, subject_objs["MATH"].id]
        for day in range(6):  # Mon-Sat
            for period_idx, (start, end) in enumerate(periods):
                is_break = (period_idx == 3)
                db.add(models.TimetableSlot(
                    class_section_id=class_section.id,
                    academic_year="2025-26",
                    day_of_week=day,
                    period_no=period_idx + 1,
                    start_time=start,
                    end_time=end,
                    subject_id=subj_cycle[period_idx] if not is_break else None,
                    teacher_id=teacher_profile.id if not is_break and subj_cycle[period_idx] in [subject_objs["MATH"].id, subject_objs["SCI"].id] else None,
                    is_break=is_break,
                ))

    db.commit()
    return {
        "message": "Database tables created and sample accounts are ready.",
        "created": created,
        "demo_accounts": ["admin@nev.edu", "student@nev.edu", "teacher@nev.edu"],
    }

# Basic Routes
@app.get("/")
@app.get("/api")
def root():
    return {"message": "Edu Valley API running on Render"}

@app.get("/health")
@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

@app.get("/ping")
@app.get("/api/ping")
def ping():
    return {"message": "pong"}

@app.get("/admin/me")
@app.get("/api/admin/me")
def get_admin_me(admin=Depends(get_current_admin)):
    """Lightweight endpoint used by the admin login page to validate that a
    stored bearer token is still good before auto-redirecting into the
    dashboard. Returns 401 (via get_current_admin) if the token is missing,
    forged, expired, or no longer maps to an admin account."""
    return {"id": admin.id, "email": admin.email, "is_admin": admin.is_admin}

@app.get("/admin/activity", response_model=List[schemas.AuditLogOut])
@app.get("/api/admin/activity", response_model=List[schemas.AuditLogOut])
def get_admin_activity(
    limit: int = 100,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = db.query(models.AuditLog)
    if entity_type:
        query = query.filter(models.AuditLog.entity_type == entity_type)
    return query.order_by(models.AuditLog.created_at.desc()).limit(min(limit, 250)).all()

@app.get("/admin/notifications", response_model=List[schemas.NotificationOut])
@app.get("/api/admin/notifications", response_model=List[schemas.NotificationOut])
def get_admin_notifications(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return db.query(models.Notification).filter(
        models.Notification.recipient_kind == "admin",
        models.Notification.recipient_id == admin.id,
    ).order_by(models.Notification.created_at.desc()).limit(100).all()

@app.patch("/admin/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
@app.patch("/api/admin/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_admin_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    obj = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_kind == "admin",
        models.Notification.recipient_id == admin.id,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Notification not found")
    obj.read = True
    db.commit()
    db.refresh(obj)
    return obj

# Auth
@app.post("/auth/login", response_model=schemas.Token)
@app.post("/api/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(models.AdminUser).filter(models.AdminUser.email == data.email).first()
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = create_access_token({"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.exception("Login error")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/erp/auth/login", response_model=schemas.ErpLoginResponse)
@app.post("/api/erp/auth/login", response_model=schemas.ErpLoginResponse)
def erp_login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.ErpUser).filter(models.ErpUser.email == data.email).first()
    if not user or not user.is_active or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ERP credentials")
    token = create_access_token(
        {"sub": user.email, "role": user.role, "type": "erp"},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": user}

def update_model_from_schema(obj, payload):
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    return obj

def active_or_trash(query, model, trash: bool):
    return query.filter(model.deleted_at.isnot(None) if trash else model.deleted_at.is_(None))

def soft_delete(obj, db: Session):
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()

def restore_deleted(obj, db: Session):
    obj.deleted_at = None
    db.commit()
    db.refresh(obj)
    return obj

# News & Events
@app.get("/events", response_model=List[schemas.Event])
@app.get("/api/events", response_model=List[schemas.Event])
def get_events(trash: bool = False, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if trash:
        require_admin_authorization(authorization, db)
    items = active_or_trash(db.query(models.Event), models.Event, trash).order_by(models.Event.date.desc()).all()
    for item in items:
        item.image_url = fix_image_url(item.image_url)
    return items

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

@app.get("/events/{event_id}", response_model=schemas.Event)
@app.get("/api/events/{event_id}", response_model=schemas.Event)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.deleted_at.is_(None),
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.image_url = fix_image_url(event.image_url)
    return event

@app.put("/events/{event_id}", response_model=schemas.Event)
@app.put("/api/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event: schemas.EventCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Event).filter(models.Event.id == event_id, models.Event.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    before = model_snapshot(obj)
    update_model_from_schema(obj, event)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "update", "event", obj.id, before=before, after=model_snapshot(obj))
    db.commit()
    return obj

@app.patch("/events/{event_id}/restore", response_model=schemas.Event)
@app.patch("/api/events/{event_id}/restore", response_model=schemas.Event)
def restore_event(event_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    restored = restore_deleted(obj, db)
    create_audit_log(db, "admin", admin.email, "restore", "event", obj.id, before={"deleted_at": "set"}, after=model_snapshot(obj))
    db.commit()
    return restored

@app.delete("/events/{event_id}")
@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Event).filter(models.Event.id == event_id, models.Event.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    before = model_snapshot(obj)
    soft_delete(obj, db)
    create_audit_log(db, "admin", admin.email, "delete", "event", obj.id, before=before, after={"deleted_at": obj.deleted_at.isoformat() if obj.deleted_at else None})
    db.commit()
    return {"detail": "Event deleted"}

# Faculty
@app.get("/faculty", response_model=List[schemas.Faculty])
@app.get("/api/faculty", response_model=List[schemas.Faculty])
def get_faculty(trash: bool = False, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if trash:
        require_admin_authorization(authorization, db)
    items = active_or_trash(db.query(models.Faculty), models.Faculty, trash).order_by(models.Faculty.created_at.desc()).all()
    for item in items:
        item.image_url = fix_image_url(item.image_url)
    return items

@app.post("/faculty", response_model=schemas.Faculty)
@app.post("/api/faculty", response_model=schemas.Faculty)
def create_faculty(faculty: schemas.FacultyCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Faculty(**faculty.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "create", "faculty", obj.id, after=model_snapshot(obj))
    db.commit()
    return obj

@app.put("/faculty/{faculty_id}", response_model=schemas.Faculty)
@app.put("/api/faculty/{faculty_id}", response_model=schemas.Faculty)
def update_faculty(faculty_id: int, faculty: schemas.FacultyCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Faculty).filter(models.Faculty.id == faculty_id, models.Faculty.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty not found")
    before = model_snapshot(obj)
    update_model_from_schema(obj, faculty)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "update", "faculty", obj.id, before=before, after=model_snapshot(obj))
    db.commit()
    return obj

@app.patch("/faculty/{faculty_id}/restore", response_model=schemas.Faculty)
@app.patch("/api/faculty/{faculty_id}/restore", response_model=schemas.Faculty)
def restore_faculty(faculty_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty not found")
    restored = restore_deleted(obj, db)
    create_audit_log(db, "admin", admin.email, "restore", "faculty", obj.id, before={"deleted_at": "set"}, after=model_snapshot(obj))
    db.commit()
    return restored

@app.delete("/faculty/{faculty_id}")
@app.delete("/api/faculty/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Faculty).filter(models.Faculty.id == faculty_id, models.Faculty.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty not found")
    before = model_snapshot(obj)
    soft_delete(obj, db)
    create_audit_log(db, "admin", admin.email, "delete", "faculty", obj.id, before=before, after={"deleted_at": obj.deleted_at.isoformat() if obj.deleted_at else None})
    db.commit()
    return {"detail": "Faculty deleted"}

# Gallery
@app.get("/gallery", response_model=List[schemas.GalleryImage])
@app.get("/api/gallery", response_model=List[schemas.GalleryImage])
def get_gallery(trash: bool = False, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if trash:
        require_admin_authorization(authorization, db)
    items = active_or_trash(db.query(models.GalleryImage), models.GalleryImage, trash).order_by(models.GalleryImage.created_at.desc()).all()
    for item in items:
        item.image_url = fix_image_url(item.image_url)
    return items

@app.post("/gallery", response_model=schemas.GalleryImage)
@app.post("/api/gallery", response_model=schemas.GalleryImage)
def create_gallery(image: schemas.GalleryImageCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.GalleryImage(**image.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "create", "gallery_image", obj.id, after=model_snapshot(obj))
    db.commit()
    return obj

@app.put("/gallery/{image_id}", response_model=schemas.GalleryImage)
@app.put("/api/gallery/{image_id}", response_model=schemas.GalleryImage)
def update_gallery(image_id: int, image: schemas.GalleryImageCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id, models.GalleryImage.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    before = model_snapshot(obj)
    update_model_from_schema(obj, image)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "update", "gallery_image", obj.id, before=before, after=model_snapshot(obj))
    db.commit()
    return obj

@app.patch("/gallery/{image_id}/restore", response_model=schemas.GalleryImage)
@app.patch("/api/gallery/{image_id}/restore", response_model=schemas.GalleryImage)
def restore_gallery(image_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    restored = restore_deleted(obj, db)
    create_audit_log(db, "admin", admin.email, "restore", "gallery_image", obj.id, before={"deleted_at": "set"}, after=model_snapshot(obj))
    db.commit()
    return restored

@app.delete("/gallery/{image_id}")
@app.delete("/api/gallery/{image_id}")
def delete_gallery(image_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id, models.GalleryImage.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    before = model_snapshot(obj)
    soft_delete(obj, db)
    create_audit_log(db, "admin", admin.email, "delete", "gallery_image", obj.id, before=before, after={"deleted_at": obj.deleted_at.isoformat() if obj.deleted_at else None})
    db.commit()
    return {"detail": "Gallery image deleted"}

# Contacts
@app.get("/contacts", response_model=List[schemas.Contact])
@app.get("/api/contacts", response_model=List[schemas.Contact])
def get_contacts(status: Optional[str] = None, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    query = db.query(models.Contact)
    if status:
        query = query.filter(models.Contact.status == status)
    return query.order_by(models.Contact.created_at.desc()).all()

@app.post("/contacts", response_model=schemas.Contact)
@app.post("/api/contacts", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    now = _time()
    # Prune old timestamps
    _contact_rate_limit[client_ip] = [t for t in _contact_rate_limit[client_ip] if now - t < _CONTACT_RATE_LIMIT_WINDOW]
    if len(_contact_rate_limit[client_ip]) >= _CONTACT_RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many contact submissions. Please try again later.")
    _contact_rate_limit[client_ip].append(now)

    obj = models.Contact(**contact.dict())
    db.add(obj)
    for admin_user in db.query(models.AdminUser).filter(models.AdminUser.is_admin == True).all():
        create_notification(db, "admin", admin_user.id, "New contact message", contact.subject, "message", "/admin/website/messages")
    db.commit()
    db.refresh(obj)
    return obj

@app.patch("/contacts/{contact_id}", response_model=schemas.Contact)
@app.patch("/api/contacts/{contact_id}", response_model=schemas.Contact)
def update_contact(contact_id: int, payload: schemas.ContactUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    before = model_snapshot(obj)
    if payload.status is not None:
        obj.status = payload.status
    if payload.read is not None:
        obj.read = payload.read
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "update", "contact", obj.id, before=before, after=model_snapshot(obj))
    db.commit()
    return obj

@app.delete("/contacts/{contact_id}")
@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    before = model_snapshot(obj)
    db.delete(obj)
    create_audit_log(db, "admin", admin.email, "delete", "contact", contact_id, before=before)
    db.commit()
    return {"detail": "Contact deleted"}

# Announcements
@app.get("/announcements", response_model=List[schemas.Announcement])
@app.get("/api/announcements", response_model=List[schemas.Announcement])
def get_announcements(trash: bool = False, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if trash:
        require_admin_authorization(authorization, db)
    return active_or_trash(db.query(models.Announcement), models.Announcement, trash).order_by(models.Announcement.created_at.desc()).all()

@app.post("/announcements", response_model=schemas.Announcement)
@app.post("/api/announcements", response_model=schemas.Announcement)
def create_announcement(announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Announcement(**announcement.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "create", "announcement", obj.id, after=model_snapshot(obj))
    db.commit()
    return obj

@app.put("/announcements/{announcement_id}", response_model=schemas.Announcement)
@app.put("/api/announcements/{announcement_id}", response_model=schemas.Announcement)
def update_announcement(announcement_id: int, announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Announcement).filter(models.Announcement.id == announcement_id, models.Announcement.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Announcement not found")
    before = model_snapshot(obj)
    update_model_from_schema(obj, announcement)
    db.commit()
    db.refresh(obj)
    create_audit_log(db, "admin", admin.email, "update", "announcement", obj.id, before=before, after=model_snapshot(obj))
    db.commit()
    return obj

@app.patch("/announcements/{announcement_id}/restore", response_model=schemas.Announcement)
@app.patch("/api/announcements/{announcement_id}/restore", response_model=schemas.Announcement)
def restore_announcement(announcement_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Announcement not found")
    restored = restore_deleted(obj, db)
    create_audit_log(db, "admin", admin.email, "restore", "announcement", obj.id, before={"deleted_at": "set"}, after=model_snapshot(obj))
    db.commit()
    return restored

@app.delete("/announcements/{announcement_id}")
@app.delete("/api/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Announcement).filter(models.Announcement.id == announcement_id, models.Announcement.deleted_at.is_(None)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Announcement not found")
    before = model_snapshot(obj)
    soft_delete(obj, db)
    create_audit_log(db, "admin", admin.email, "delete", "announcement", obj.id, before=before, after={"deleted_at": obj.deleted_at.isoformat() if obj.deleted_at else None})
    db.commit()
    return {"detail": "Announcement deleted"}

# ── Admin ERP Management ──────────────────────────────────────────────────────

@app.get("/admin/erp/teachers")
@app.get("/api/admin/erp/teachers")
def admin_list_erp_teachers(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    teachers = db.query(models.ErpUser).filter(models.ErpUser.role == "teacher").order_by(models.ErpUser.full_name).all()
    teacher_user_ids = [t.id for t in teachers]

    profiles = {p.user_id: p for p in db.query(models.TeacherProfile).filter(
        models.TeacherProfile.user_id.in_(teacher_user_ids),
        models.TeacherProfile.deleted_at.is_(None),
    ).all()}
    profile_ids = [p.id for p in profiles.values()]

    assignments = db.query(models.TeacherSubjectAssignment).filter(models.TeacherSubjectAssignment.teacher_id.in_(profile_ids)).all() if profile_ids else []
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


@app.post("/admin/erp/teachers")
@app.post("/api/admin/erp/teachers")
def admin_create_erp_teacher(payload: schemas.AdminCreateTeacher, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    if db.query(models.ErpUser).filter(models.ErpUser.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    initial_password = payload.password or secrets.token_urlsafe(10)
    user = models.ErpUser(
        email=payload.email,
        hashed_password=pwd_context.hash(initial_password),
        role="teacher",
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(user)
    db.flush()
    emp_no = f"NEV-T-{db.query(models.TeacherProfile).count() + 1:03d}"
    profile = models.TeacherProfile(
        user_id=user.id,
        employee_no=emp_no,
        department=payload.department,
        subject=payload.subject,
        phone=payload.phone,
        class_teacher_of=payload.class_teacher_of,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return {"message": "Teacher created", "email": user.email, "default_password": initial_password}


@app.post("/admin/erp/teacher-assignments")
@app.post("/api/admin/erp/teacher-assignments")
def admin_create_teacher_assignment(payload: schemas.AdminAssignTeacher, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    profile = db.query(models.TeacherProfile).filter(
        models.TeacherProfile.id == payload.teacher_profile_id,
        models.TeacherProfile.deleted_at.is_(None),
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    cs = db.query(models.ClassSection).filter(models.ClassSection.id == payload.class_section_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Class section not found")
    existing = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == profile.id,
        models.TeacherSubjectAssignment.class_section_id == payload.class_section_id,
        models.TeacherSubjectAssignment.subject_id == payload.subject_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Assignment already exists")
    a = models.TeacherSubjectAssignment(
        teacher_id=profile.id,
        subject_id=payload.subject_id,
        class_section_id=payload.class_section_id,
        academic_year=payload.academic_year or cs.academic_year,
        is_class_teacher=payload.is_class_teacher,
    )
    db.add(a)
    if payload.is_class_teacher:
        profile.class_teacher_of = f"Class {cs.class_name} {cs.section}"
    db.commit()
    db.refresh(a)
    subj = db.query(models.Subject).filter(models.Subject.id == a.subject_id).first()
    return {
        "id": a.id,
        "class_section_id": a.class_section_id,
        "subject_id": a.subject_id,
        "academic_year": a.academic_year,
        "is_class_teacher": a.is_class_teacher,
        "class_section": {"id": cs.id, "class_name": cs.class_name, "section": cs.section, "academic_year": cs.academic_year},
        "subject": {"id": subj.id, "name": subj.name, "code": subj.code} if subj else None,
    }


@app.delete("/admin/erp/teacher-assignments/{assignment_id}")
@app.delete("/api/admin/erp/teacher-assignments/{assignment_id}")
def admin_delete_teacher_assignment(assignment_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    a = db.query(models.TeacherSubjectAssignment).filter(models.TeacherSubjectAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(a)
    db.commit()
    return {"detail": "Assignment removed"}


@app.get("/admin/erp/class-sections")
@app.get("/api/admin/erp/class-sections")
def admin_list_class_sections(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(models.ClassSection).order_by(models.ClassSection.class_name, models.ClassSection.section).all()


@app.post("/admin/erp/class-sections")
@app.post("/api/admin/erp/class-sections")
def admin_create_class_section(payload: schemas.ClassSectionCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    existing = db.query(models.ClassSection).filter(
        models.ClassSection.class_name == payload.class_name,
        models.ClassSection.section == payload.section,
        models.ClassSection.academic_year == payload.academic_year,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Class {payload.class_name}-{payload.section} already exists")
    cs = models.ClassSection(class_name=payload.class_name, section=payload.section, academic_year=payload.academic_year, is_active=True)
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return cs


@app.get("/admin/erp/subjects")
@app.get("/api/admin/erp/subjects")
def admin_list_subjects(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(models.Subject).order_by(models.Subject.name).all()


@app.post("/admin/erp/subjects")
@app.post("/api/admin/erp/subjects")
def admin_create_subject(payload: schemas.AdminCreateSubject, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    if db.query(models.Subject).filter(models.Subject.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    s = models.Subject(name=payload.name, code=payload.code, description=payload.description)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


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


@app.get("/admin/erp/leaves", response_model=List[schemas.LeaveRequestOut])
@app.get("/api/admin/erp/leaves", response_model=List[schemas.LeaveRequestOut])
def admin_list_leave_requests(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(models.LeaveRequest).order_by(models.LeaveRequest.created_at.desc()).all()


# ── Soft delete + restore + trash listing for ERP entities ───────────────────

@app.post("/admin/erp/students/{student_id}/delete")
@app.post("/api/admin/erp/students/{student_id}/delete")
def admin_soft_delete_student(student_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    student = db.query(models.StudentProfile).filter(models.StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    before = model_snapshot(student)
    soft_delete(student, db)
    create_audit_log(db, "admin", admin.email, "delete", "student_profile", student.id, before=before, after={"deleted_at": student.deleted_at.isoformat() if student.deleted_at else None})
    db.commit()
    return {"status": "ok", "id": student.id}


@app.post("/admin/erp/students/{student_id}/restore")
@app.post("/api/admin/erp/students/{student_id}/restore")
def admin_restore_student(student_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    student = db.query(models.StudentProfile).filter(models.StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    restored = restore_deleted(student, db)
    create_audit_log(db, "admin", admin.email, "restore", "student_profile", student.id, before={"deleted_at": "set"}, after=model_snapshot(restored))
    db.commit()
    return {"status": "ok", "id": student.id}


@app.get("/admin/erp/trash/students")
@app.get("/api/admin/erp/trash/students")
def admin_list_trashed_students(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    students = (
        db.query(models.StudentProfile)
        .filter(models.StudentProfile.deleted_at.isnot(None))
        .order_by(models.StudentProfile.deleted_at.desc())
        .all()
    )
    user_ids = [s.user_id for s in students]
    users = {u.id: u for u in db.query(models.ErpUser).filter(models.ErpUser.id.in_(user_ids)).all()} if user_ids else {}
    return [
        {
            "id": s.id,
            "admission_no": s.admission_no,
            "class_name": s.class_name,
            "section": s.section,
            "roll_no": s.roll_no,
            "full_name": users[s.user_id].full_name if users.get(s.user_id) else "Unknown",
            "deleted_at": s.deleted_at.isoformat() if s.deleted_at else None,
        }
        for s in students
    ]


@app.post("/admin/erp/teachers/{teacher_id}/delete")
@app.post("/api/admin/erp/teachers/{teacher_id}/delete")
def admin_soft_delete_teacher(teacher_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    before = model_snapshot(teacher)
    soft_delete(teacher, db)
    create_audit_log(db, "admin", admin.email, "delete", "teacher_profile", teacher.id, before=before, after={"deleted_at": teacher.deleted_at.isoformat() if teacher.deleted_at else None})
    db.commit()
    return {"status": "ok", "id": teacher.id}


@app.post("/admin/erp/teachers/{teacher_id}/restore")
@app.post("/api/admin/erp/teachers/{teacher_id}/restore")
def admin_restore_teacher(teacher_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    restored = restore_deleted(teacher, db)
    create_audit_log(db, "admin", admin.email, "restore", "teacher_profile", teacher.id, before={"deleted_at": "set"}, after=model_snapshot(restored))
    db.commit()
    return {"status": "ok", "id": teacher.id}


@app.get("/admin/erp/trash/teachers")
@app.get("/api/admin/erp/trash/teachers")
def admin_list_trashed_teachers(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    teachers = (
        db.query(models.TeacherProfile)
        .filter(models.TeacherProfile.deleted_at.isnot(None))
        .order_by(models.TeacherProfile.deleted_at.desc())
        .all()
    )
    user_ids = [t.user_id for t in teachers]
    users = {u.id: u for u in db.query(models.ErpUser).filter(models.ErpUser.id.in_(user_ids)).all()} if user_ids else {}
    return [
        {
            "id": t.id,
            "employee_no": t.employee_no,
            "department": t.department,
            "subject": t.subject,
            "class_teacher_of": t.class_teacher_of,
            "full_name": users[t.user_id].full_name if users.get(t.user_id) else "Unknown",
            "email": users[t.user_id].email if users.get(t.user_id) else None,
            "deleted_at": t.deleted_at.isoformat() if t.deleted_at else None,
        }
        for t in teachers
    ]


@app.post("/admin/erp/invoices/{invoice_id}/delete")
@app.post("/api/admin/erp/invoices/{invoice_id}/delete")
def admin_soft_delete_invoice(invoice_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    invoice = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    before = model_snapshot(invoice)
    soft_delete(invoice, db)
    create_audit_log(db, "admin", admin.email, "delete", "fee_invoice", invoice.id, before=before, after={"deleted_at": invoice.deleted_at.isoformat() if invoice.deleted_at else None})
    db.commit()
    return {"status": "ok", "id": invoice.id}


@app.post("/admin/erp/invoices/{invoice_id}/restore")
@app.post("/api/admin/erp/invoices/{invoice_id}/restore")
def admin_restore_invoice(invoice_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    invoice = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    restored = restore_deleted(invoice, db)
    create_audit_log(db, "admin", admin.email, "restore", "fee_invoice", invoice.id, before={"deleted_at": "set"}, after=model_snapshot(restored))
    db.commit()
    return {"status": "ok", "id": invoice.id}


@app.get("/admin/erp/trash/invoices")
@app.get("/api/admin/erp/trash/invoices")
def admin_list_trashed_invoices(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    invoices = (
        db.query(models.FeeInvoice)
        .filter(models.FeeInvoice.deleted_at.isnot(None))
        .order_by(models.FeeInvoice.deleted_at.desc())
        .all()
    )
    return [
        {
            "id": inv.id,
            "invoice_no": inv.invoice_no,
            "student_id": inv.student_id,
            "title": inv.title,
            "term": inv.term,
            "amount_paise": inv.amount_paise,
            "paid_paise": inv.paid_paise or 0,
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
            "status": inv.status,
            "deleted_at": inv.deleted_at.isoformat() if inv.deleted_at else None,
        }
        for inv in invoices
    ]


@app.get("/admin/erp/fees/students")
@app.get("/api/admin/erp/fees/students")
def admin_fee_students(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.deleted_at.is_(None),
    ).order_by(
        models.StudentProfile.class_name, models.StudentProfile.section, models.StudentProfile.roll_no
    ).all()
    student_ids = [s.id for s in students]
    user_ids = [s.user_id for s in students]

    users = {u.id: u for u in db.query(models.ErpUser).filter(models.ErpUser.id.in_(user_ids)).all()}

    all_invoices = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.student_id.in_(student_ids),
        models.FeeInvoice.deleted_at.is_(None),
    ).order_by(models.FeeInvoice.due_date).all()
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


@app.post("/admin/erp/fee-invoices")
@app.post("/api/admin/erp/fee-invoices")
def admin_create_invoice(payload: schemas.AdminCreateInvoice, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == payload.student_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    count = db.query(models.FeeInvoice).filter(models.FeeInvoice.student_id == payload.student_id).count()
    invoice_no = payload.invoice_no or f"NEV-FEE-{student.admission_no}-{count + 1:02d}"
    inv = models.FeeInvoice(
        student_id=payload.student_id,
        invoice_no=invoice_no,
        title=payload.title,
        term=payload.term,
        amount_paise=payload.amount_paise,
        paid_paise=0,
        due_date=payload.due_date,
        status="pending",
    )
    db.add(inv)
    student_user = db.query(models.ErpUser).filter(models.ErpUser.id == student.user_id).first()
    if student_user:
        create_notification(db, "erp", student_user.id, "Fee invoice assigned", f"{payload.title} is due on {payload.due_date}.", "fee", "/erp")
    for link in db.query(models.GuardianStudent).filter(models.GuardianStudent.student_id == student.id).all():
        create_notification(db, "erp", link.guardian_user_id, "Fee invoice assigned", f"{payload.title} is due on {payload.due_date}.", "fee", "/erp")
    create_audit_log(db, "admin", admin.email, "create", "fee_invoice", invoice_no, after=model_snapshot(inv))
    db.commit()
    db.refresh(inv)
    return {
        "id": inv.id, "invoice_no": inv.invoice_no, "title": inv.title,
        "term": inv.term, "amount_paise": inv.amount_paise,
        "paid_paise": 0, "due_date": str(inv.due_date), "status": inv.status, "balance_paise": inv.amount_paise,
    }


@app.post("/admin/erp/fee-payments/manual")
@app.post("/api/admin/erp/fee-payments/manual")
def admin_manual_payment(payload: schemas.AdminManualPayment, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    invoice = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.id == payload.invoice_id,
        models.FeeInvoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    balance = invoice_balance(invoice)
    if balance <= 0:
        raise HTTPException(status_code=400, detail="Invoice is already fully paid")
    amount = min(payload.amount_paise, balance)
    payment = models.FeePayment(
        invoice_id=invoice.id,
        student_id=invoice.student_id,
        amount_paise=amount,
        method=payload.method,
        status="paid",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    db.flush()
    payment.receipt_no = generate_receipt_no(payment.id)
    invoice.paid_paise = (invoice.paid_paise or 0) + amount
    sync_invoice_status(invoice)
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == invoice.student_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if student:
        create_notification(db, "erp", student.user_id, "Payment recorded", f"{payment.receipt_no} for {amount / 100:.0f} INR was recorded.", "fee", "/erp")
        for link in db.query(models.GuardianStudent).filter(models.GuardianStudent.student_id == student.id).all():
            create_notification(db, "erp", link.guardian_user_id, "Payment recorded", f"{payment.receipt_no} was recorded.", "fee", "/erp")
    create_audit_log(db, "admin", admin.email, "create", "fee_payment", payment.id, after=model_snapshot(payment))
    db.commit()
    db.refresh(payment)
    return {
        "id": payment.id, "receipt_no": payment.receipt_no, "amount_paise": payment.amount_paise,
        "method": payment.method, "paid_at": payment.paid_at.isoformat(),
        "invoice_status": invoice.status,
        "invoice_balance_paise": invoice_balance(invoice),
    }


@app.get("/admin/erp/receipts/{payment_id}", response_model=schemas.ReceiptOut)
@app.get("/api/admin/erp/receipts/{payment_id}", response_model=schemas.ReceiptOut)
def admin_get_receipt(payment_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    payment = db.query(models.FeePayment).filter(models.FeePayment.id == payment_id).first()
    if not payment or payment.status != "paid":
        raise HTTPException(status_code=404, detail="Paid receipt not found")
    invoice = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == payment.invoice_id).first()
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == payment.student_id).first()
    student_user = db.query(models.ErpUser).filter(models.ErpUser.id == profile.user_id).first() if profile else None
    if not invoice or not profile or not student_user:
        raise HTTPException(status_code=404, detail="Receipt data not found")
    return {
        "school_name": "Narendra Edu Valley",
        "receipt_no": payment.receipt_no or generate_receipt_no(payment.id),
        "issued_at": payment.paid_at or datetime.now(timezone.utc),
        "student": student_user,
        "profile": profile,
        "invoice": invoice,
        "payment": payment,
    }


@app.get("/admin/erp/timetable/{class_section_id}")
@app.get("/api/admin/erp/timetable/{class_section_id}")
def admin_get_timetable(
    class_section_id: int,
    academic_year: Optional[str] = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.TimetableSlot).filter(
        models.TimetableSlot.class_section_id == class_section_id
    )
    if academic_year:
        query = query.filter(models.TimetableSlot.academic_year == academic_year)
    slots = query.order_by(models.TimetableSlot.day_of_week, models.TimetableSlot.period_no).all()
    result = []
    for s in slots:
        subj = db.query(models.Subject).filter(models.Subject.id == s.subject_id).first() if s.subject_id else None
        result.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "period_no": s.period_no,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "subject_id": s.subject_id,
            "teacher_id": s.teacher_id,
            "is_break": s.is_break,
            "subject": {"id": subj.id, "name": subj.name, "code": subj.code} if subj else None,
        })
    return result


@app.put("/admin/erp/timetable/{class_section_id}")
@app.put("/api/admin/erp/timetable/{class_section_id}")
def admin_upsert_timetable(
    class_section_id: int,
    payload: schemas.TimetableUpsert,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db.query(models.TimetableSlot).filter(
        models.TimetableSlot.class_section_id == class_section_id,
        models.TimetableSlot.academic_year == payload.academic_year,
    ).delete()
    for slot in payload.slots:
        db.add(models.TimetableSlot(
            class_section_id=class_section_id,
            academic_year=payload.academic_year,
            day_of_week=slot.day_of_week,
            period_no=slot.period_no,
            start_time=slot.start_time,
            end_time=slot.end_time,
            subject_id=slot.subject_id,
            teacher_id=slot.teacher_id,
            is_break=slot.is_break,
        ))
    db.commit()
    return {"message": f"Timetable saved — {len(payload.slots)} slots"}


# ERP
@app.get("/erp/me", response_model=schemas.ErpUserPublic)
@app.get("/api/erp/me", response_model=schemas.ErpUserPublic)
def get_erp_me(user: models.ErpUser = Depends(get_current_erp_user)):
    return user


@app.post("/erp/me/change-password")
@app.post("/api/erp/me/change-password")
def change_my_password(
    payload: schemas.PasswordChangeRequest,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    user.hashed_password = pwd_context.hash(payload.new_password)
    db.commit()
    create_audit_log(db, "erp", user.email, "change_password", "erp_user", user.id)
    db.commit()
    return {"status": "ok"}


@app.get("/erp/student/dashboard", response_model=schemas.StudentDashboard)
@app.get("/api/erp/student/dashboard", response_model=schemas.StudentDashboard)
def get_student_dashboard(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    profile = get_student_profile_for_user(user, db)
    invoices = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.student_id == profile.id,
        models.FeeInvoice.deleted_at.is_(None),
    ).order_by(models.FeeInvoice.due_date.asc()).all()
    payments = db.query(models.FeePayment).filter(
        models.FeePayment.student_id == profile.id,
        models.FeePayment.status == "paid",
    ).order_by(models.FeePayment.paid_at.desc()).all()
    leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.student_id == profile.id
    ).order_by(models.LeaveRequest.created_at.desc()).all()
    marks = db.query(models.MarkEntry).filter(
        models.MarkEntry.student_id == profile.id
    ).order_by(models.MarkEntry.exam_date.desc()).all()
    attendance = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == profile.id
    ).order_by(models.AttendanceRecord.date.desc()).all()
    class_students_query = db.query(models.StudentProfile).filter(
        models.StudentProfile.deleted_at.is_(None),
    )
    if profile.class_section_id:
        class_students_query = class_students_query.filter(models.StudentProfile.class_section_id == profile.class_section_id)
    else:
        class_students_query = class_students_query.filter(
            models.StudentProfile.class_name == profile.class_name,
            models.StudentProfile.section == profile.section,
        )
    class_student_ids = [student.id for student in class_students_query.all()]
    mark_comparisons = {}
    for mark in marks:
        peer_marks = db.query(models.MarkEntry).filter(
            models.MarkEntry.student_id.in_(class_student_ids),
            models.MarkEntry.exam_name == mark.exam_name,
            models.MarkEntry.subject == mark.subject,
            models.MarkEntry.max_marks == mark.max_marks,
        ).all()
        peer_percents = sorted([
            round((peer.marks_obtained / peer.max_marks) * 100, 2)
            for peer in peer_marks
            if peer.max_marks
        ])
        own_percent = round((mark.marks_obtained / mark.max_marks) * 100, 2) if mark.max_marks else 0
        if peer_percents:
            below_or_equal = len([pct for pct in peer_percents if pct <= own_percent])
            percentile = round((below_or_equal / len(peer_percents)) * 100)
            class_average = round(sum(peer_percents) / len(peer_percents), 1)
        else:
            percentile = None
            class_average = None
        mark_comparisons[mark.id] = {
            "class_average_percent": class_average,
            "percentile": percentile,
            "peer_count": len(peer_percents),
            "rank_band": "top quartile" if percentile and percentile >= 75 else "middle" if percentile and percentile >= 40 else "needs focus" if percentile is not None else None,
        }
    fee_due = sum(invoice_balance(invoice) for invoice in invoices)
    stats = {
        "fee_due_paise": fee_due,
        "total_paid_paise": sum(payment.amount_paise for payment in payments),
        "pending_leaves": len([leave for leave in leaves if leave.status == "pending"]),
        "approved_leaves": len([leave for leave in leaves if leave.status == "approved"]),
        "attendance_percent": attendance_percent(attendance),
        "average_percent": average_percent(marks),
        "receipt_count": len(payments),
        "mark_comparisons": mark_comparisons,
    }
    return {
        "user": user,
        "profile": profile,
        "invoices": invoices,
        "payments": payments,
        "leaves": leaves,
        "marks": marks,
        "attendance": attendance,
        "stats": stats,
    }

@app.get("/erp/guardian/dashboard", response_model=schemas.GuardianDashboard)
@app.get("/api/erp/guardian/dashboard", response_model=schemas.GuardianDashboard)
def get_guardian_dashboard(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    student_ids = get_guardian_student_ids(user, db)
    children = []
    total_due = 0
    for student_id in student_ids:
        student = db.query(models.StudentProfile).filter(
            models.StudentProfile.id == student_id,
            models.StudentProfile.deleted_at.is_(None),
        ).first()
        if not student:
            continue
        summary = build_student_summary(student, db)
        pending_leaves = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.student_id == student.id,
            models.LeaveRequest.status == "pending",
        ).count()
        unread_threads = db.query(models.MessageThread).filter(
            models.MessageThread.student_id == student.id,
            models.MessageThread.guardian_user_id == user.id,
            models.MessageThread.status == "open",
        ).count()
        total_due += summary["fee_due_paise"]
        children.append({
            **summary,
            "pending_leaves": pending_leaves,
            "unread_threads": unread_threads,
        })
    return {
        "user": user,
        "children": children,
        "stats": {
            "child_count": len(children),
            "fee_due_paise": total_due,
            "notifications_unread": db.query(models.Notification).filter(
                models.Notification.recipient_kind == "erp",
                models.Notification.recipient_id == user.id,
                models.Notification.read == False,
            ).count(),
        },
    }

@app.get("/erp/guardian/child/{student_id}/details")
@app.get("/api/erp/guardian/child/{student_id}/details")
def get_guardian_child_details(
    student_id: int,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    if user.role != "guardian":
        raise HTTPException(status_code=403, detail="Guardian access only")
    link = db.query(models.GuardianStudent).filter(
        models.GuardianStudent.guardian_user_id == user.id,
        models.GuardianStudent.student_id == student_id,
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized to view this student")
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == student_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student_user = db.query(models.ErpUser).filter(models.ErpUser.id == student.user_id).first()
    invoices = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.student_id == student.id,
        models.FeeInvoice.deleted_at.is_(None),
    ).order_by(models.FeeInvoice.due_date.desc()).all()
    payments = db.query(models.FeePayment).filter(
        models.FeePayment.student_id == student.id
    ).order_by(models.FeePayment.created_at.desc()).all()
    marks = db.query(models.MarkEntry).filter(
        models.MarkEntry.student_id == student.id
    ).order_by(models.MarkEntry.exam_date.desc()).all()
    attendance = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student.id
    ).order_by(models.AttendanceRecord.date.desc()).limit(60).all()
    return {
        "user": student_user,
        "profile": student,
        "invoices": invoices,
        "payments": payments,
        "marks": marks,
        "attendance": attendance,
    }


@app.get("/erp/teacher/dashboard", response_model=schemas.TeacherDashboard)
@app.get("/api/erp/teacher/dashboard", response_model=schemas.TeacherDashboard)
def get_teacher_dashboard(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    from datetime import date as date_type
    profile = get_teacher_profile_for_user(user, db)

    # Discover teacher's assigned class sections
    assignments = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == profile.id
    ).all()
    assigned_cs_ids = list({a.class_section_id for a in assignments if a.class_section_id})

    # Filter students to only the teacher's classes
    if assigned_cs_ids:
        enrolled_ids = {
            e.student_id
            for e in db.query(models.StudentClassEnrollment).filter(
                models.StudentClassEnrollment.class_section_id.in_(assigned_cs_ids),
                models.StudentClassEnrollment.is_current == True,
            ).all()
        }
        profile_ids = {
            p.id
            for p in db.query(models.StudentProfile).filter(
                models.StudentProfile.class_section_id.in_(assigned_cs_ids),
                models.StudentProfile.deleted_at.is_(None),
            ).all()
        }
        all_ids = enrolled_ids | profile_ids
        students = db.query(models.StudentProfile).filter(
            models.StudentProfile.id.in_(list(all_ids)),
            models.StudentProfile.deleted_at.is_(None),
        ).order_by(
            models.StudentProfile.class_name,
            models.StudentProfile.section,
            models.StudentProfile.roll_no,
        ).all()
    else:
        # No assignments yet — show all students as fallback
        students = db.query(models.StudentProfile).filter(
            models.StudentProfile.deleted_at.is_(None),
        ).order_by(
            models.StudentProfile.class_name,
            models.StudentProfile.section,
            models.StudentProfile.roll_no,
        ).all()

    leaves = db.query(models.LeaveRequest).order_by(models.LeaveRequest.created_at.desc()).all()
    marks = db.query(models.MarkEntry).order_by(models.MarkEntry.exam_date.desc()).all()

    student_summaries = build_student_summaries_batch(students, db)

    needs_attention_count = sum(
        1 for ss in student_summaries
        if ss["attendance_percent"] < 75 or ss["latest_average_percent"] < 50
    )

    today = date_type.today()
    attendance_marked_today = False
    if students:
        attendance_marked_today = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.date == today,
            models.AttendanceRecord.student_id.in_([s.id for s in students]),
        ).first() is not None

    assigned_sections = []
    if assigned_cs_ids:
        cs_list = db.query(models.ClassSection).filter(
            models.ClassSection.id.in_(assigned_cs_ids)
        ).order_by(models.ClassSection.class_name, models.ClassSection.section).all()
        assigned_sections = [
            {"id": cs.id, "class_name": cs.class_name, "section": cs.section, "academic_year": cs.academic_year}
            for cs in cs_list
        ]

    stats = {
        "student_count": len(students),
        "pending_leaves": len([l for l in leaves if l.status == "pending"]),
        "marks_recorded": len(marks),
        "class_average_percent": average_percent(marks),
        "needs_attention_count": needs_attention_count,
        "attendance_marked_today": attendance_marked_today,
        "assigned_class_sections": assigned_sections,
    }
    return {
        "user": user,
        "profile": profile,
        "students": student_summaries,
        "leaves": leaves,
        "marks": marks,
        "stats": stats,
    }

@app.get("/erp/notifications", response_model=List[schemas.NotificationOut])
@app.get("/api/erp/notifications", response_model=List[schemas.NotificationOut])
def get_erp_notifications(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Notification).filter(
        models.Notification.recipient_kind == "erp",
        models.Notification.recipient_id == user.id,
    ).order_by(models.Notification.created_at.desc()).limit(100).all()

@app.patch("/erp/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
@app.patch("/api/erp/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_erp_notification_read(
    notification_id: int,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    obj = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_kind == "erp",
        models.Notification.recipient_id == user.id,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Notification not found")
    obj.read = True
    db.commit()
    db.refresh(obj)
    return obj

def serialize_message_thread(thread: models.MessageThread, db: Session):
    messages = db.query(models.ThreadMessage).filter(
        models.ThreadMessage.thread_id == thread.id
    ).order_by(models.ThreadMessage.created_at.asc()).all()
    sender_ids = {message.sender_user_id for message in messages}
    senders = {
        user.id: user.full_name
        for user in db.query(models.ErpUser).filter(models.ErpUser.id.in_(list(sender_ids))).all()
    } if sender_ids else {}
    student = db.query(models.StudentProfile).filter(models.StudentProfile.id == thread.student_id).first()
    return {
        "id": thread.id,
        "student_id": thread.student_id,
        "teacher_id": thread.teacher_id,
        "guardian_user_id": thread.guardian_user_id,
        "subject": thread.subject,
        "status": thread.status,
        "created_at": thread.created_at,
        "updated_at": thread.updated_at,
        "student": build_student_summary(student, db) if student else None,
        "messages": [
            {
                "id": message.id,
                "thread_id": message.thread_id,
                "sender_user_id": message.sender_user_id,
                "sender_role": message.sender_role,
                "body": message.body,
                "created_at": message.created_at,
                "sender_name": senders.get(message.sender_user_id),
            }
            for message in messages
        ],
    }

def find_class_teacher_for_student(student: models.StudentProfile, db: Session) -> Optional[models.TeacherProfile]:
    if student.class_section_id:
        assignment = db.query(models.TeacherSubjectAssignment).filter(
            models.TeacherSubjectAssignment.class_section_id == student.class_section_id,
            models.TeacherSubjectAssignment.is_class_teacher == True,
        ).first()
        if assignment:
            return db.query(models.TeacherProfile).filter(
                models.TeacherProfile.id == assignment.teacher_id,
                models.TeacherProfile.deleted_at.is_(None),
            ).first()
    return db.query(models.TeacherProfile).filter(
        models.TeacherProfile.class_teacher_of == f"Class {student.class_name} {student.section}",
        models.TeacherProfile.deleted_at.is_(None),
    ).first()

@app.get("/erp/messages", response_model=List[schemas.MessageThreadOut])
@app.get("/api/erp/messages", response_model=List[schemas.MessageThreadOut])
def list_message_threads(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    if user.role == "guardian":
        threads = db.query(models.MessageThread).filter(
            models.MessageThread.guardian_user_id == user.id
        ).order_by(models.MessageThread.updated_at.desc()).all()
    elif user.role == "teacher":
        teacher = get_teacher_profile_for_user(user, db)
        threads = db.query(models.MessageThread).filter(
            models.MessageThread.teacher_id == teacher.id
        ).order_by(models.MessageThread.updated_at.desc()).all()
    else:
        profile = get_student_profile_for_user(user, db)
        threads = db.query(models.MessageThread).filter(
            models.MessageThread.student_id == profile.id
        ).order_by(models.MessageThread.updated_at.desc()).all()
    return [serialize_message_thread(thread, db) for thread in threads]

@app.post("/erp/messages", response_model=schemas.MessageThreadOut)
@app.post("/api/erp/messages", response_model=schemas.MessageThreadOut)
def create_message_thread(
    payload: schemas.MessageCreateThread,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == payload.student_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    guardian_user_id = None
    if user.role == "guardian":
        if student.id not in get_guardian_student_ids(user, db):
            raise HTTPException(status_code=403, detail="Access denied")
        guardian_user_id = user.id
        teacher = find_class_teacher_for_student(student, db)
    elif user.role == "teacher":
        teacher = get_teacher_profile_for_user(user, db)
        link = db.query(models.GuardianStudent).filter(models.GuardianStudent.student_id == student.id).first()
        guardian_user_id = link.guardian_user_id if link else None
    else:
        raise HTTPException(status_code=403, detail="Messaging is available to teachers and guardians")
    thread = models.MessageThread(
        student_id=student.id,
        teacher_id=teacher.id if teacher else None,
        guardian_user_id=guardian_user_id,
        subject=payload.subject,
    )
    db.add(thread)
    db.flush()
    message = models.ThreadMessage(
        thread_id=thread.id,
        sender_user_id=user.id,
        sender_role=user.role,
        body=payload.body,
    )
    db.add(message)
    recipients = []
    if user.role == "guardian" and teacher:
        teacher_user = db.query(models.ErpUser).filter(models.ErpUser.id == teacher.user_id).first()
        if teacher_user:
            recipients.append(teacher_user.id)
    elif user.role == "teacher" and guardian_user_id:
        recipients.append(guardian_user_id)
    for recipient_id in recipients:
        create_notification(db, "erp", recipient_id, "New message", payload.subject, "message", "/erp")
    db.commit()
    db.refresh(thread)
    return serialize_message_thread(thread, db)

@app.get("/erp/substitutions/dashboard", response_model=schemas.SubstitutionDashboard)
@app.get("/api/erp/substitutions/dashboard", response_model=schemas.SubstitutionDashboard)
def get_substitution_dashboard(
    day_of_week: Optional[int] = None,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    get_teacher_profile_for_user(user, db)
    target_day = day_of_week if day_of_week is not None else datetime.now().weekday()
    if target_day > 5:
        target_day = 0
    teachers = db.query(models.TeacherProfile).filter(
        models.TeacherProfile.is_active == True,
        models.TeacherProfile.deleted_at.is_(None),
    ).all()
    teacher_users = {
        erp_user.id: erp_user
        for erp_user in db.query(models.ErpUser).filter(
            models.ErpUser.id.in_([teacher.user_id for teacher in teachers])
        ).all()
    } if teachers else {}
    slots = db.query(models.TimetableSlot).filter(
        models.TimetableSlot.day_of_week == target_day,
        models.TimetableSlot.is_break == False,
    ).order_by(models.TimetableSlot.period_no).all()
    workload = []
    for teacher in teachers:
        count = len([slot for slot in slots if slot.teacher_id == teacher.id])
        workload.append({
            "teacher_id": teacher.id,
            "teacher_name": teacher_users.get(teacher.user_id).full_name if teacher_users.get(teacher.user_id) else "Unknown",
            "department": teacher.department,
            "subject": teacher.subject,
            "periods_today": count,
        })
    workload = sorted(workload, key=lambda row: (row["periods_today"], row["teacher_name"]))

    # Bulk-fetch related entities to avoid N+1 queries
    class_section_ids = {slot.class_section_id for slot in slots if slot.class_section_id}
    subject_ids = {slot.subject_id for slot in slots if slot.subject_id}
    slot_teacher_ids = {slot.teacher_id for slot in slots if slot.teacher_id}

    class_sections_map = {
        cs.id: cs
        for cs in db.query(models.ClassSection).filter(
            models.ClassSection.id.in_(class_section_ids)
        ).all()
    } if class_section_ids else {}
    subjects_map = {
        s.id: s
        for s in db.query(models.Subject).filter(
            models.Subject.id.in_(subject_ids)
        ).all()
    } if subject_ids else {}
    slot_teachers_map = {
        t.id: t
        for t in db.query(models.TeacherProfile).filter(
            models.TeacherProfile.id.in_(slot_teacher_ids)
        ).all()
    } if slot_teacher_ids else {}
    slot_teacher_user_ids = {t.user_id for t in slot_teachers_map.values()}
    # teacher_users already loaded above; some slot teachers may be inactive/deleted (not in teacher_users), so fetch any missing.
    missing_user_ids = slot_teacher_user_ids - set(teacher_users.keys())
    if missing_user_ids:
        for erp_user in db.query(models.ErpUser).filter(
            models.ErpUser.id.in_(missing_user_ids)
        ).all():
            teacher_users[erp_user.id] = erp_user

    cover_slots = []
    for slot in slots:
        class_section = class_sections_map.get(slot.class_section_id)
        subject = subjects_map.get(slot.subject_id) if slot.subject_id else None
        assigned_teacher = slot_teachers_map.get(slot.teacher_id) if slot.teacher_id else None
        assigned_user = teacher_users.get(assigned_teacher.user_id) if assigned_teacher else None
        busy_teacher_ids = {
            busy.teacher_id
            for busy in slots
            if busy.period_no == slot.period_no and busy.teacher_id
        }
        candidates = [
            row for row in workload
            if row["teacher_id"] not in busy_teacher_ids
        ][:5]
        cover_slots.append({
            "slot_id": slot.id,
            "day_of_week": slot.day_of_week,
            "period_no": slot.period_no,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "class_label": f"{class_section.class_name}-{class_section.section}" if class_section else "Unknown",
            "subject": subject.name if subject else None,
            "teacher_id": slot.teacher_id,
            "teacher_name": assigned_user.full_name if assigned_user else None,
            "candidate_teachers": candidates,
        })
    return {
        "day_of_week": target_day,
        "teacher_workload": workload,
        "cover_slots": cover_slots,
    }

@app.post("/erp/messages/{thread_id}", response_model=schemas.MessageThreadOut)
@app.post("/api/erp/messages/{thread_id}", response_model=schemas.MessageThreadOut)
def add_thread_message(
    thread_id: int,
    payload: schemas.MessageCreate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    thread = db.query(models.MessageThread).filter(models.MessageThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    teacher_user_id = None
    if thread.teacher_id:
        teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.id == thread.teacher_id).first()
        teacher_user_id = teacher.user_id if teacher else None
    allowed_ids = {thread.guardian_user_id, teacher_user_id}
    if user.id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Access denied")
    db.add(models.ThreadMessage(
        thread_id=thread.id,
        sender_user_id=user.id,
        sender_role=user.role,
        body=payload.body,
    ))
    thread.updated_at = datetime.now(timezone.utc)
    for recipient_id in [rid for rid in allowed_ids if rid and rid != user.id]:
        create_notification(db, "erp", recipient_id, "Message reply", thread.subject, "message", "/erp")
    db.commit()
    db.refresh(thread)
    return serialize_message_thread(thread, db)

@app.post("/erp/leaves", response_model=schemas.LeaveRequestOut)
@app.post("/api/erp/leaves", response_model=schemas.LeaveRequestOut)
def create_leave_request(
    leave: schemas.LeaveRequestCreate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    profile = get_student_profile_for_user(user, db)
    days_count = (leave.to_date - leave.from_date).days + 1
    if days_count <= 0:
        raise HTTPException(status_code=400, detail="Leave end date must be on or after start date")
    teacher = find_class_teacher_for_student(profile, db)
    obj = models.LeaveRequest(
        student_id=profile.id,
        teacher_id=teacher.id if teacher else None,
        from_date=leave.from_date,
        to_date=leave.to_date,
        days_count=days_count,
        reason=leave.reason,
        status="pending",
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.patch("/erp/leaves/{leave_id}", response_model=schemas.LeaveRequestOut)
@app.patch("/api/erp/leaves/{leave_id}", response_model=schemas.LeaveRequestOut)
def update_leave_request(
    leave_id: int,
    payload: schemas.LeaveRequestUpdate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    obj = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Leave request not found")
    obj.status = payload.status
    obj.reviewer_note = payload.reviewer_note
    obj.teacher_id = teacher.id
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == obj.student_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if student:
        create_notification(db, "erp", student.user_id, f"Leave {payload.status}", payload.reviewer_note or f"Your leave request was {payload.status}.", "leave", "/erp")
        for link in db.query(models.GuardianStudent).filter(models.GuardianStudent.student_id == student.id).all():
            create_notification(db, "erp", link.guardian_user_id, f"Leave {payload.status}", f"{student.admission_no}'s leave request was {payload.status}.", "leave", "/erp")
    db.commit()
    db.refresh(obj)
    return obj

def grade_from_percent(percent: float) -> str:
    if percent >= 90:
        return "A+"
    if percent >= 80:
        return "A"
    if percent >= 70:
        return "B+"
    if percent >= 60:
        return "B"
    if percent >= 50:
        return "C"
    return "D"

@app.post("/erp/marks", response_model=schemas.MarkEntryOut)
@app.post("/api/erp/marks", response_model=schemas.MarkEntryOut)
def create_mark_entry(
    payload: schemas.MarkEntryCreate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    if payload.marks_obtained > payload.max_marks:
        raise HTTPException(status_code=400, detail="Marks obtained cannot exceed maximum marks")
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == payload.student_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    percent = (payload.marks_obtained / payload.max_marks) * 100
    obj = models.MarkEntry(
        student_id=payload.student_id,
        teacher_id=teacher.id,
        subject=payload.subject,
        exam_name=payload.exam_name,
        marks_obtained=payload.marks_obtained,
        max_marks=payload.max_marks,
        grade=payload.grade or grade_from_percent(percent),
        remarks=payload.remarks,
        exam_date=payload.exam_date,
    )
    db.add(obj)
    create_notification(db, "erp", student.user_id, "Marks published", f"{payload.subject} marks for {payload.exam_name}: {payload.marks_obtained}/{payload.max_marks}.", "marks", "/erp")
    for link in db.query(models.GuardianStudent).filter(models.GuardianStudent.student_id == student.id).all():
        create_notification(db, "erp", link.guardian_user_id, "Marks published", f"{student.admission_no}: {payload.subject} {payload.marks_obtained}/{payload.max_marks}.", "marks", "/erp")
    db.commit()
    db.refresh(obj)
    return obj

@app.post("/erp/payments/razorpay/order", response_model=schemas.RazorpayOrderResponse)
@app.post("/api/erp/payments/razorpay/order", response_model=schemas.RazorpayOrderResponse)
def create_razorpay_order(
    payload: schemas.RazorpayOrderRequest,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    student = get_student_profile_for_user(user, db)
    invoice = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.id == payload.invoice_id,
        models.FeeInvoice.student_id == student.id,
        models.FeeInvoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    amount_due = invoice_balance(invoice)
    if amount_due <= 0:
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    receipt = f"{invoice.invoice_no}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    if not key_id or not key_secret:
        return {
            "order_id": None,
            "amount_paise": amount_due,
            "currency": "INR",
            "key_id": None,
            "receipt": receipt,
            "invoice_id": invoice.id,
            "payment_id": None,
            "razorpay_available": False,
            "message": "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the backend to enable online fee payment.",
        }

    order_payload = {
        "amount": amount_due,
        "currency": "INR",
        "receipt": receipt,
        "notes": {
            "invoice_no": invoice.invoice_no,
            "student_admission_no": student.admission_no,
            "student_name": user.full_name,
        },
    }
    credentials = base64.b64encode(f"{key_id}:{key_secret}".encode("utf-8")).decode("utf-8")
    request = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=json.dumps(order_payload).encode("utf-8"),
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            order = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise HTTPException(status_code=502, detail=f"Razorpay order failed: {detail}")
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail=f"Could not connect to Razorpay: {exc.reason}")

    payment = models.FeePayment(
        invoice_id=invoice.id,
        student_id=student.id,
        amount_paise=amount_due,
        method="razorpay",
        status="created",
        razorpay_order_id=order.get("id"),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {
        "order_id": order.get("id"),
        "amount_paise": amount_due,
        "currency": order.get("currency", "INR"),
        "key_id": key_id,
        "receipt": receipt,
        "invoice_id": invoice.id,
        "payment_id": payment.id,
        "razorpay_available": True,
        "message": None,
    }

@app.post("/erp/payments/razorpay/verify", response_model=schemas.FeePaymentOut)
@app.post("/api/erp/payments/razorpay/verify", response_model=schemas.FeePaymentOut)
def verify_razorpay_payment(
    payload: schemas.RazorpayVerifyRequest,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    student = get_student_profile_for_user(user, db)
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay secret is not configured")

    payment = db.query(models.FeePayment).filter(
        models.FeePayment.razorpay_order_id == payload.razorpay_order_id,
        models.FeePayment.invoice_id == payload.invoice_id,
        models.FeePayment.student_id == student.id,
    ).first()
    # Idempotency: if this payment is already marked paid, return success without re-processing
    if payment and payment.status == "paid" and payment.razorpay_payment_id == payload.razorpay_payment_id:
        return payment

    signed_payload = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    payment = db.query(models.FeePayment).filter(
        models.FeePayment.razorpay_order_id == payload.razorpay_order_id,
        models.FeePayment.invoice_id == payload.invoice_id,
        models.FeePayment.student_id == student.id,
        models.FeePayment.status == "created",
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pending payment record not found")

    invoice = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.id == payment.invoice_id,
        models.FeeInvoice.student_id == student.id,
        models.FeeInvoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment.status = "paid"
    payment.razorpay_payment_id = payload.razorpay_payment_id
    payment.paid_at = datetime.now(timezone.utc)
    payment.receipt_no = payment.receipt_no or generate_receipt_no(payment.id)
    invoice.paid_paise = min(invoice.amount_paise, (invoice.paid_paise or 0) + payment.amount_paise)
    sync_invoice_status(invoice)
    create_notification(db, "erp", student.user_id, "Payment successful", f"{payment.receipt_no} has been generated.", "fee", "/erp")
    for link in db.query(models.GuardianStudent).filter(models.GuardianStudent.student_id == student.id).all():
        create_notification(db, "erp", link.guardian_user_id, "Payment successful", f"{payment.receipt_no} has been generated.", "fee", "/erp")
    db.commit()
    db.refresh(payment)
    return payment

@app.get("/erp/receipts/{payment_id}", response_model=schemas.ReceiptOut)
@app.get("/api/erp/receipts/{payment_id}", response_model=schemas.ReceiptOut)
def get_fee_receipt(
    payment_id: int,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    payment = db.query(models.FeePayment).filter(models.FeePayment.id == payment_id).first()
    if not payment or payment.status != "paid":
        raise HTTPException(status_code=404, detail="Paid receipt not found")
    invoice = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == payment.invoice_id).first()
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == payment.student_id).first()
    student_user = db.query(models.ErpUser).filter(models.ErpUser.id == profile.user_id).first() if profile else None
    if not invoice or not profile or not student_user:
        raise HTTPException(status_code=404, detail="Receipt data not found")
    if user.role == "student" and profile.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view another student's receipt")
    if user.role == "guardian" and profile.id not in get_guardian_student_ids(user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view another student's receipt")
    if not payment.receipt_no:
        payment.receipt_no = generate_receipt_no(payment.id)
        db.commit()
        db.refresh(payment)
    return {
        "school_name": "Narendra Edu Valley",
        "receipt_no": payment.receipt_no,
        "issued_at": payment.paid_at or payment.created_at,
        "student": student_user,
        "profile": profile,
        "invoice": invoice,
        "payment": payment,
    }

@app.post("/upload")
@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 8MB or smaller")
    thumbnail_data = None
    thumbnail_content_type = None
    if thumbnail:
        thumbnail_data = await thumbnail.read()
        thumbnail_content_type = thumbnail.content_type or "image/webp"
    obj = models.StoredImage(
        filename=file.filename or "upload",
        content_type=file.content_type,
        data=data,
        thumbnail_data=thumbnail_data or data,
        thumbnail_content_type=thumbnail_content_type or file.content_type,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {
        "id": obj.id,
        "url": f"/images/{obj.id}",
        "thumbnail_url": f"/images/{obj.id}/thumb",
        "content_type": obj.content_type,
    }

# Image Serving (with caching headers)
@app.get("/images/{image_id}")
@app.get("/api/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.StoredImage).filter(models.StoredImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    etag = hashlib.md5(image.data[:1024]).hexdigest()
    return Response(
        content=image.data,
        media_type=image.content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "ETag": f'"{etag}"',
        },
    )

@app.get("/images/{image_id}/thumb")
@app.get("/api/images/{image_id}/thumb")
def get_image_thumbnail(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.StoredImage).filter(models.StoredImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    data = image.thumbnail_data or image.data
    etag = hashlib.md5(data[:1024]).hexdigest()
    return Response(
        content=data,
        media_type=image.thumbnail_content_type or image.content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "ETag": f'"{etag}"',
        },
    )

@app.post("/erp/teacher/students")
@app.post("/api/erp/teacher/students")
def add_student(
    payload: schemas.AddStudentRequest,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    if db.query(models.ErpUser).filter(models.ErpUser.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.StudentProfile).filter(models.StudentProfile.admission_no == payload.admission_no).first():
        raise HTTPException(status_code=400, detail="Admission number already exists")

    if payload.date_of_birth:
        dob = payload.date_of_birth
        default_password = f"{dob.day:02d}{dob.month:02d}{dob.year}"
    else:
        default_password = secrets.token_urlsafe(10)

    new_user = models.ErpUser(
        email=payload.email,
        hashed_password=pwd_context.hash(default_password),
        role="student",
        full_name=payload.full_name,
        phone=payload.phone,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    new_profile = models.StudentProfile(
        user_id=new_user.id,
        admission_no=payload.admission_no,
        roll_no=payload.roll_no,
        class_name=payload.class_name,
        section=payload.section,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        address=payload.address,
        date_of_birth=payload.date_of_birth,
        blood_group=payload.blood_group,
        status="active",
        class_section_id=payload.class_section_id,
    )
    db.add(new_profile)
    db.flush()

    if payload.class_section_id and payload.academic_year:
        db.add(models.StudentClassEnrollment(
            student_id=new_profile.id,
            class_section_id=payload.class_section_id,
            academic_year=payload.academic_year,
            roll_no=payload.roll_no,
            is_current=True,
        ))

    guardian_credentials = ensure_guardian_link(db, new_profile)
    create_notification(db, "erp", new_user.id, "Welcome to Narendra Edu Valley ERP", "Your student account is ready.", "account", "/erp")
    if guardian_credentials:
        guardian_user = db.query(models.ErpUser).filter(models.ErpUser.email == guardian_credentials["email"]).first()
        if guardian_user:
            create_notification(db, "erp", guardian_user.id, "Guardian account linked", f"{new_user.full_name} has been linked to your guardian portal.", "account", "/erp")
    create_audit_log(db, "erp", user.email, "create", "student", new_profile.id, after=model_snapshot(new_profile))
    db.commit()
    db.refresh(new_profile)
    return {
        "message": "Student added successfully",
        "student_id": new_profile.id,
        "default_password": default_password,
        "guardian_credentials": guardian_credentials,
        "email": payload.email,
    }


@app.patch("/erp/teacher/students/{student_profile_id}/status")
@app.patch("/api/erp/teacher/students/{student_profile_id}/status")
def update_student_status(
    student_profile_id: int,
    payload: schemas.StudentStatusUpdate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    profile = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == student_profile_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")
    student_user = db.query(models.ErpUser).filter(models.ErpUser.id == profile.user_id).first()

    profile.status = payload.status
    if student_user:
        student_user.is_active = (payload.status == "active")

    db.commit()
    return {"message": f"Student status updated to {payload.status}", "status": payload.status}


@app.get("/erp/students")
@app.get("/api/erp/students")
def get_all_students(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.deleted_at.is_(None),
    ).order_by(
        models.StudentProfile.class_name,
        models.StudentProfile.section,
        models.StudentProfile.roll_no,
    ).all()
    return [build_student_summary(s, db) for s in students]


@app.get("/erp/class-sections", response_model=List[schemas.ClassSectionOut])
@app.get("/api/erp/class-sections", response_model=List[schemas.ClassSectionOut])
def get_class_sections(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    return db.query(models.ClassSection).filter(models.ClassSection.is_active == True).order_by(
        models.ClassSection.class_name, models.ClassSection.section
    ).all()


@app.post("/erp/class-sections", response_model=schemas.ClassSectionOut)
@app.post("/api/erp/class-sections", response_model=schemas.ClassSectionOut)
def create_class_section(
    payload: schemas.ClassSectionCreate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = db.query(models.ClassSection).filter(
        models.ClassSection.class_name == payload.class_name,
        models.ClassSection.section == payload.section,
        models.ClassSection.academic_year == payload.academic_year,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Class {payload.class_name}-{payload.section} ({payload.academic_year}) already exists")
    cs = models.ClassSection(
        class_name=payload.class_name,
        section=payload.section,
        academic_year=payload.academic_year,
        is_active=True,
    )
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return cs


@app.get("/erp/class-sections/{class_section_id}/students")
@app.get("/api/erp/class-sections/{class_section_id}/students")
def get_class_section_students(
    class_section_id: int,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    # Students formally enrolled
    enrolled_ids = {
        e.student_id
        for e in db.query(models.StudentClassEnrollment).filter(
            models.StudentClassEnrollment.class_section_id == class_section_id,
            models.StudentClassEnrollment.is_current == True,
        ).all()
    }
    # Students linked via profile.class_section_id (added without formal enrollment)
    profile_ids = {
        p.id
        for p in db.query(models.StudentProfile).filter(
            models.StudentProfile.class_section_id == class_section_id,
            models.StudentProfile.deleted_at.is_(None),
        ).all()
    }
    all_ids = enrolled_ids | profile_ids
    if not all_ids:
        return []
    profiles = db.query(models.StudentProfile).filter(
        models.StudentProfile.id.in_(list(all_ids)),
        models.StudentProfile.deleted_at.is_(None),
    ).order_by(models.StudentProfile.roll_no, models.StudentProfile.class_name).all()
    return [build_student_summary(p, db) for p in profiles]


@app.get("/erp/subjects", response_model=List[schemas.SubjectOut])
@app.get("/api/erp/subjects", response_model=List[schemas.SubjectOut])
def get_subjects(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Subject).order_by(models.Subject.name).all()


@app.get("/erp/teacher/assignments", response_model=List[schemas.TeacherAssignmentOut])
@app.get("/api/erp/teacher/assignments", response_model=List[schemas.TeacherAssignmentOut])
def get_teacher_assignments(
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    assignments = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher.id
    ).all()
    result = []
    for a in assignments:
        subject = db.query(models.Subject).filter(models.Subject.id == a.subject_id).first()
        cs = db.query(models.ClassSection).filter(models.ClassSection.id == a.class_section_id).first()
        result.append({
            "id": a.id,
            "teacher_id": a.teacher_id,
            "subject_id": a.subject_id,
            "class_section_id": a.class_section_id,
            "academic_year": a.academic_year,
            "is_class_teacher": a.is_class_teacher,
            "subject": subject,
            "class_section": cs,
        })
    return result


@app.get("/erp/attendance/class/{class_section_id}/date/{attendance_date}")
@app.get("/api/erp/attendance/class/{class_section_id}/date/{attendance_date}")
def get_class_attendance(
    class_section_id: int,
    attendance_date: date,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    enrollments = db.query(models.StudentClassEnrollment).filter(
        models.StudentClassEnrollment.class_section_id == class_section_id,
        models.StudentClassEnrollment.is_current == True,
    ).all()
    student_ids = [e.student_id for e in enrollments]
    records = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id.in_(student_ids),
        models.AttendanceRecord.date == attendance_date,
    ).all()
    record_map = {r.student_id: r for r in records}
    result = []
    for enrollment in enrollments:
        student_profile = db.query(models.StudentProfile).filter(
            models.StudentProfile.id == enrollment.student_id,
            models.StudentProfile.deleted_at.is_(None),
        ).first()
        if not student_profile:
            continue
        student_user = db.query(models.ErpUser).filter(
            models.ErpUser.id == student_profile.user_id
        ).first() if student_profile else None
        record = record_map.get(enrollment.student_id)
        result.append({
            "student_id": enrollment.student_id,
            "student_name": student_user.full_name if student_user else "Unknown",
            "roll_no": enrollment.roll_no,
            "status": record.status if record else "present",
            "note": record.note if record else None,
            "record_id": record.id if record else None,
        })
    result.sort(key=lambda x: (x["roll_no"] or "zzz"))
    return result


@app.post("/erp/attendance/bulk")
@app.post("/api/erp/attendance/bulk")
def bulk_mark_attendance(
    payload: schemas.BulkAttendanceCreate,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    for record_data in payload.records:
        existing = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.student_id == record_data.student_id,
            models.AttendanceRecord.date == payload.date,
        ).first()
        if existing:
            existing.status = record_data.status
            existing.note = record_data.note
            existing.class_section_id = payload.class_section_id
            existing.marked_by_teacher_id = teacher.id
        else:
            enrollment = db.query(models.StudentClassEnrollment).filter(
                models.StudentClassEnrollment.student_id == record_data.student_id,
                models.StudentClassEnrollment.is_current == True,
            ).first()
            db.add(models.AttendanceRecord(
                student_id=record_data.student_id,
                date=payload.date,
                status=record_data.status,
                note=record_data.note,
                class_section_id=payload.class_section_id,
                marked_by_teacher_id=teacher.id,
                enrollment_id=enrollment.id if enrollment else None,
            ))
    db.commit()
    return {"message": f"Attendance marked for {len(payload.records)} students"}


@app.get("/erp/exam-schedules", response_model=List[schemas.ExamScheduleOut])
@app.get("/api/erp/exam-schedules", response_model=List[schemas.ExamScheduleOut])
def get_exam_schedules(
    class_section_id: Optional[int] = None,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.ExamSchedule)
    if class_section_id:
        query = query.filter(models.ExamSchedule.class_section_id == class_section_id)
    exams = query.order_by(models.ExamSchedule.exam_date.asc()).all()
    result = []
    for exam in exams:
        subject = db.query(models.Subject).filter(models.Subject.id == exam.subject_id).first()
        result.append({
            "id": exam.id,
            "class_section_id": exam.class_section_id,
            "subject_id": exam.subject_id,
            "exam_name": exam.exam_name,
            "exam_date": exam.exam_date,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "venue": exam.venue,
            "hall_no": exam.hall_no,
            "academic_year": exam.academic_year,
            "max_marks": exam.max_marks,
            "subject": subject,
        })
    return result


@app.get("/erp/timetable/{class_section_id}", response_model=List[schemas.TimetableSlotOut])
@app.get("/api/erp/timetable/{class_section_id}", response_model=List[schemas.TimetableSlotOut])
def get_timetable(
    class_section_id: int,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    slots = db.query(models.TimetableSlot).filter(
        models.TimetableSlot.class_section_id == class_section_id,
    ).order_by(models.TimetableSlot.day_of_week, models.TimetableSlot.period_no).all()
    result = []
    for slot in slots:
        subject = db.query(models.Subject).filter(models.Subject.id == slot.subject_id).first() if slot.subject_id else None
        result.append({
            "id": slot.id,
            "class_section_id": slot.class_section_id,
            "academic_year": slot.academic_year,
            "day_of_week": slot.day_of_week,
            "period_no": slot.period_no,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "subject_id": slot.subject_id,
            "teacher_id": slot.teacher_id,
            "is_break": slot.is_break,
            "subject": subject,
        })
    return result


@app.get("/erp/analytics/student/{student_profile_id}")
@app.get("/api/erp/analytics/student/{student_profile_id}")
def get_student_analytics(
    student_profile_id: int,
    academic_year: Optional[str] = None,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    if user.role == "student":
        profile = get_student_profile_for_user(user, db)
        if profile.id != student_profile_id:
            raise HTTPException(status_code=403, detail="Access denied")
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == student_profile_id,
        models.StudentProfile.deleted_at.is_(None),
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollments = db.query(models.StudentClassEnrollment).filter(
        models.StudentClassEnrollment.student_id == student_profile_id
    ).order_by(models.StudentClassEnrollment.created_at.asc()).all()

    all_marks = db.query(models.MarkEntry).filter(
        models.MarkEntry.student_id == student_profile_id
    ).order_by(models.MarkEntry.exam_date.asc()).all()

    all_attendance = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_profile_id
    ).all()

    invoices = db.query(models.FeeInvoice).filter(
        models.FeeInvoice.student_id == student_profile_id,
        models.FeeInvoice.deleted_at.is_(None),
    ).all()

    from collections import defaultdict
    attendance_by_month = defaultdict(lambda: {"present": 0, "absent": 0, "leave": 0, "total": 0})
    for record in all_attendance:
        key = record.date.strftime("%Y-%m")
        attendance_by_month[key][record.status] = attendance_by_month[key].get(record.status, 0) + 1
        attendance_by_month[key]["total"] += 1

    att_by_month_list = [
        {"month": k, **v, "percent": round(v["present"] / v["total"] * 100, 1) if v["total"] > 0 else 0}
        for k, v in sorted(attendance_by_month.items())
    ]

    marks_by_subject = defaultdict(lambda: {"total": 0, "max": 0, "count": 0})
    for mark in all_marks:
        marks_by_subject[mark.subject]["total"] += mark.marks_obtained
        marks_by_subject[mark.subject]["max"] += mark.max_marks
        marks_by_subject[mark.subject]["count"] += 1

    marks_by_subject_list = [
        {
            "subject": k,
            "average_percent": round(v["total"] / v["max"] * 100, 1) if v["max"] > 0 else 0,
            "count": v["count"],
        }
        for k, v in marks_by_subject.items()
    ]

    marks_over_time = []
    exam_groups = defaultdict(list)
    for mark in all_marks:
        exam_key = f"{mark.exam_name}|{mark.exam_date}"
        exam_groups[exam_key].append(mark)

    for exam_key, exam_marks in sorted(exam_groups.items(), key=lambda x: x[0].split("|")[1]):
        exam_name, exam_date_str = exam_key.split("|", 1)
        total_obt = sum(m.marks_obtained for m in exam_marks)
        total_max = sum(m.max_marks for m in exam_marks)
        entry = {
            "exam_name": exam_name,
            "exam_date": exam_date_str,
            "overall_percent": round(total_obt / total_max * 100, 1) if total_max > 0 else 0,
        }
        for m in exam_marks:
            entry[m.subject] = round(m.marks_obtained / m.max_marks * 100, 1) if m.max_marks > 0 else 0
        marks_over_time.append(entry)

    enrollment_list = []
    for e in enrollments:
        cs = db.query(models.ClassSection).filter(models.ClassSection.id == e.class_section_id).first()
        enrollment_list.append({
            "id": e.id,
            "class_section_id": e.class_section_id,
            "academic_year": e.academic_year,
            "roll_no": e.roll_no,
            "is_current": e.is_current,
            "class_label": f"Class {cs.class_name}-{cs.section}" if cs else "Unknown",
        })

    fee_summary = {
        "total_due_paise": sum(i.amount_paise for i in invoices),
        "total_paid_paise": sum(i.paid_paise or 0 for i in invoices),
        "pending_count": len([i for i in invoices if i.status != "paid"]),
    }

    return {
        "attendance_by_month": att_by_month_list,
        "marks_by_subject": marks_by_subject_list,
        "marks_over_time": marks_over_time,
        "fee_summary": fee_summary,
        "enrollments": enrollment_list,
    }


@app.get("/erp/analytics/class/{class_section_id}")
@app.get("/api/erp/analytics/class/{class_section_id}")
def get_class_analytics(
    class_section_id: int,
    academic_year: Optional[str] = None,
    user: models.ErpUser = Depends(get_current_erp_user),
    db: Session = Depends(get_db),
):
    teacher = get_teacher_profile_for_user(user, db)
    enrollments = db.query(models.StudentClassEnrollment).filter(
        models.StudentClassEnrollment.class_section_id == class_section_id,
        models.StudentClassEnrollment.is_current == True,
    ).all()
    student_ids = [e.student_id for e in enrollments]

    # Fallback: if no enrollments yet, use all students in this class section
    if not student_ids:
        cs = db.query(models.ClassSection).filter(models.ClassSection.id == class_section_id).first()
        if cs:
            profiles = db.query(models.StudentProfile).filter(
                models.StudentProfile.class_name == cs.class_name,
                models.StudentProfile.section == cs.section,
                models.StudentProfile.deleted_at.is_(None),
            ).all()
            student_ids = [p.id for p in profiles]

    all_marks = db.query(models.MarkEntry).filter(
        models.MarkEntry.student_id.in_(student_ids)
    ).all() if student_ids else []
    all_attendance = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id.in_(student_ids)
    ).all() if student_ids else []

    from collections import defaultdict

    # Per-student stats for "needs attention" and performers
    student_stats = []
    for student_id in student_ids:
        profile = db.query(models.StudentProfile).filter(
            models.StudentProfile.id == student_id,
            models.StudentProfile.deleted_at.is_(None),
        ).first()
        if not profile:
            continue
        user_obj = db.query(models.ErpUser).filter(models.ErpUser.id == profile.user_id).first() if profile else None
        s_marks = [m for m in all_marks if m.student_id == student_id]
        s_att = [r for r in all_attendance if r.student_id == student_id]
        att_pct = attendance_percent(s_att)
        avg_marks = average_percent(s_marks)
        student_stats.append({
            "student_id": student_id,
            "name": user_obj.full_name if user_obj else "Unknown",
            "roll_no": profile.roll_no if profile else None,
            "attendance_percent": att_pct,
            "average_percent": avg_marks,
            "marks_count": len(s_marks),
            "attendance_count": len(s_att),
        })

    # Attendance by month (class-level aggregate)
    attendance_by_month = defaultdict(lambda: {"present": 0, "absent": 0, "leave": 0, "total": 0})
    for record in all_attendance:
        key = record.date.strftime("%Y-%m")
        attendance_by_month[key][record.status] = attendance_by_month[key].get(record.status, 0) + 1
        attendance_by_month[key]["total"] += 1

    att_by_month_list = []
    for k, v in sorted(attendance_by_month.items()):
        total = v["total"]
        present = v.get("present", 0)
        att_by_month_list.append({
            "month": k,
            "present": present,
            "absent": v.get("absent", 0),
            "leave": v.get("leave", 0),
            "total": total,
            "percent": round(present / total * 100, 1) if total > 0 else 0,
        })

    # Subject-level performance (class average per subject)
    marks_by_subject = defaultdict(lambda: {"total": 0, "max": 0, "student_scores": []})
    for mark in all_marks:
        marks_by_subject[mark.subject]["total"] += mark.marks_obtained
        marks_by_subject[mark.subject]["max"] += mark.max_marks

    marks_by_subject_list = sorted([
        {
            "subject": k,
            "average_percent": round(v["total"] / v["max"] * 100, 1) if v["max"] > 0 else 0,
        }
        for k, v in marks_by_subject.items()
    ], key=lambda x: x["average_percent"], reverse=True)

    # Grade distribution across all marks
    grade_counts = {"A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0}
    for mark in all_marks:
        if mark.max_marks:
            pct = mark.marks_obtained / mark.max_marks * 100
            if pct >= 90:
                grade_counts["A+"] += 1
            elif pct >= 80:
                grade_counts["A"] += 1
            elif pct >= 70:
                grade_counts["B+"] += 1
            elif pct >= 60:
                grade_counts["B"] += 1
            elif pct >= 50:
                grade_counts["C"] += 1
            else:
                grade_counts["D"] += 1

    # Class-level KPIs
    students_with_att = [s for s in student_stats if s["attendance_count"] > 0]
    overall_att = round(
        sum(s["attendance_percent"] for s in students_with_att) / len(students_with_att), 1
    ) if students_with_att else 0

    students_with_marks = [s for s in student_stats if s["marks_count"] > 0]
    overall_avg = round(
        sum(s["average_percent"] for s in students_with_marks) / len(students_with_marks), 1
    ) if students_with_marks else 0

    below_75_att = [s for s in student_stats if s["attendance_count"] > 0 and s["attendance_percent"] < 75]
    needs_attention = [
        s for s in student_stats
        if (s["attendance_count"] > 0 and s["attendance_percent"] < 75)
        or (s["marks_count"] > 0 and s["average_percent"] < 50)
    ]

    # Performers (only among students who have marks)
    ranked = sorted(students_with_marks, key=lambda x: x["average_percent"], reverse=True)
    top_performers = ranked[:5]
    struggling = ranked[-5:][::-1] if len(ranked) > 5 else []

    return {
        "student_count": len(student_ids),
        "overall_attendance_percent": overall_att,
        "overall_average_percent": overall_avg,
        "below_75_attendance_count": len(below_75_att),
        "marks_recorded": len(all_marks),
        "attendance_by_month": att_by_month_list,
        "marks_by_subject": marks_by_subject_list,
        "grade_distribution": grade_counts,
        "top_performers": top_performers,
        "struggling_students": struggling,
        "needs_attention": needs_attention,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
