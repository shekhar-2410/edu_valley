from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, EmailStr


# Event Schemas
class EventBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)
    date: date
    location: Optional[str] = Field(None, max_length=200)
    image_url: Optional[str] = Field(None, max_length=500)


class EventCreate(EventBase):
    pass


class Event(EventBase):
    id: int
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Faculty Schemas
class FacultyBase(BaseModel):
    name: str = Field(..., max_length=100)
    position: str = Field(..., max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    image_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=2000)


class FacultyCreate(FacultyBase):
    pass


class Faculty(FacultyBase):
    id: int
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Gallery Schemas
class GalleryImageBase(BaseModel):
    title: str = Field(..., max_length=200)
    image_url: str = Field(..., max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)


class GalleryImageCreate(GalleryImageBase):
    pass


class GalleryImage(GalleryImageBase):
    id: int
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Contact Schemas
class ContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)


class ContactCreate(ContactBase):
    pass


class Contact(ContactBase):
    id: int
    status: str = "new"
    read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ContactUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(new|responded|archived)$")
    read: Optional[bool] = None


# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=5000)
    priority: Optional[str] = Field("normal", pattern="^(low|normal|high)$")


class AnnouncementCreate(AnnouncementBase):
    pass


class Announcement(AnnouncementBase):
    id: int
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


# ERP Auth Schemas
class ErpUserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    type: str
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: int
    actor_kind: str
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    before_json: Optional[str] = None
    after_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ErpLoginResponse(Token):
    user: ErpUserPublic


# ERP Profile Schemas
class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    admission_no: str
    roll_no: Optional[str] = None
    class_name: str
    section: str
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    status: Optional[str] = "active"
    class_section_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherProfileOut(BaseModel):
    id: int
    user_id: int
    employee_no: str
    department: Optional[str] = None
    subject: Optional[str] = None
    phone: Optional[str] = None
    class_teacher_of: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeeInvoiceOut(BaseModel):
    id: int
    student_id: int
    invoice_no: str
    title: str
    term: Optional[str] = None
    amount_paise: int
    paid_paise: int
    due_date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class FeePaymentOut(BaseModel):
    id: int
    invoice_id: int
    student_id: int
    amount_paise: int
    method: str
    status: str
    receipt_no: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveRequestCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str = Field(..., min_length=5, max_length=2000)


class LeaveRequestUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    reviewer_note: Optional[str] = Field(None, max_length=2000)


class LeaveRequestOut(BaseModel):
    id: int
    student_id: int
    teacher_id: Optional[int] = None
    from_date: date
    to_date: date
    days_count: int
    reason: str
    status: str
    reviewer_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarkEntryCreate(BaseModel):
    student_id: int
    subject: str = Field(..., max_length=100)
    exam_name: str = Field(..., max_length=120)
    marks_obtained: int = Field(..., ge=0)
    max_marks: int = Field(..., gt=0)
    grade: Optional[str] = Field(None, max_length=10)
    remarks: Optional[str] = Field(None, max_length=2000)
    exam_date: date


class MarkEntryOut(BaseModel):
    id: int
    student_id: int
    teacher_id: int
    subject: str
    exam_name: str
    marks_obtained: int
    max_marks: int
    grade: Optional[str] = None
    remarks: Optional[str] = None
    exam_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    date: date
    status: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StudentSummary(BaseModel):
    user: ErpUserPublic
    profile: StudentProfileOut
    fee_due_paise: int
    attendance_percent: float
    latest_average_percent: float


class StudentDashboard(BaseModel):
    user: ErpUserPublic
    profile: StudentProfileOut
    invoices: List[FeeInvoiceOut]
    payments: List[FeePaymentOut]
    leaves: List[LeaveRequestOut]
    marks: List[MarkEntryOut]
    attendance: List[AttendanceRecordOut]
    stats: Dict[str, Any]


class GuardianChildSummary(BaseModel):
    user: ErpUserPublic
    profile: StudentProfileOut
    fee_due_paise: int
    attendance_percent: float
    latest_average_percent: float
    pending_leaves: int
    unread_threads: int = 0


class GuardianDashboard(BaseModel):
    user: ErpUserPublic
    children: List[GuardianChildSummary]
    stats: Dict[str, Any]


class TeacherDashboard(BaseModel):
    user: ErpUserPublic
    profile: TeacherProfileOut
    students: List[StudentSummary]
    leaves: List[LeaveRequestOut]
    marks: List[MarkEntryOut]
    stats: Dict[str, Any]


class MessageCreateThread(BaseModel):
    student_id: int
    subject: str = Field(..., min_length=2, max_length=160)
    body: str = Field(..., min_length=1, max_length=5000)


class MessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)


class MessageOut(BaseModel):
    id: int
    thread_id: int
    sender_user_id: int
    sender_role: str
    body: str
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageThreadOut(BaseModel):
    id: int
    student_id: int
    teacher_id: Optional[int] = None
    guardian_user_id: Optional[int] = None
    subject: str
    status: str
    created_at: datetime
    updated_at: datetime
    student: Optional[StudentSummary] = None
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True


class SubstitutionSlotOut(BaseModel):
    slot_id: int
    day_of_week: int
    period_no: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    class_label: str
    subject: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    candidate_teachers: List[Dict[str, Any]] = []


class SubstitutionDashboard(BaseModel):
    day_of_week: int
    teacher_workload: List[Dict[str, Any]]
    cover_slots: List[SubstitutionSlotOut]


class RazorpayOrderRequest(BaseModel):
    invoice_id: int


class RazorpayOrderResponse(BaseModel):
    order_id: Optional[str] = None
    amount_paise: int
    currency: str
    key_id: Optional[str] = None
    receipt: str
    invoice_id: int
    payment_id: Optional[int] = None
    razorpay_available: bool
    message: Optional[str] = None


class RazorpayVerifyRequest(BaseModel):
    invoice_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class ReceiptOut(BaseModel):
    school_name: str
    receipt_no: str
    issued_at: datetime
    student: ErpUserPublic
    profile: StudentProfileOut
    invoice: FeeInvoiceOut
    payment: FeePaymentOut


# New ERP schemas
class ClassSectionCreate(BaseModel):
    class_name: str = Field(..., max_length=50)
    section: str = Field(..., max_length=10)
    academic_year: str = Field(..., max_length=10)


class ClassSectionOut(BaseModel):
    id: int
    class_name: str
    section: str
    academic_year: str
    is_active: bool

    class Config:
        from_attributes = True


class SubjectOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class TeacherAssignmentOut(BaseModel):
    id: int
    teacher_id: int
    subject_id: int
    class_section_id: int
    academic_year: str
    is_class_teacher: bool
    subject: Optional[SubjectOut] = None
    class_section: Optional[ClassSectionOut] = None

    class Config:
        from_attributes = True


class StudentEnrollmentOut(BaseModel):
    id: int
    student_id: int
    class_section_id: int
    academic_year: str
    roll_no: Optional[str] = None
    is_current: bool
    class_section: Optional[ClassSectionOut] = None

    class Config:
        from_attributes = True


class AddStudentRequest(BaseModel):
    full_name: str = Field(..., max_length=120)
    email: str = Field(..., max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    admission_no: str = Field(..., max_length=50)
    roll_no: Optional[str] = Field(None, max_length=20)
    class_name: str = Field(..., max_length=50)
    section: str = Field(..., max_length=10)
    class_section_id: Optional[int] = None
    academic_year: Optional[str] = Field(None, max_length=10)
    guardian_name: Optional[str] = Field(None, max_length=120)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = Field(None, max_length=5)


class StudentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|transferred|withdrawn|expelled)$")


class BulkAttendanceRecord(BaseModel):
    student_id: int
    status: str = Field(..., pattern="^(present|absent|leave)$")
    note: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    class_section_id: int
    date: date
    records: List[BulkAttendanceRecord]


class ExamScheduleOut(BaseModel):
    id: int
    class_section_id: int
    subject_id: int
    exam_name: str
    exam_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    hall_no: Optional[str] = None
    academic_year: str
    max_marks: int
    subject: Optional[SubjectOut] = None

    class Config:
        from_attributes = True


class TimetableSlotOut(BaseModel):
    id: int
    class_section_id: int
    academic_year: str
    day_of_week: int
    period_no: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    is_break: bool
    subject: Optional[SubjectOut] = None

    class Config:
        from_attributes = True


class StudentAnalytics(BaseModel):
    attendance_by_month: List[Dict[str, Any]]
    marks_by_subject: List[Dict[str, Any]]
    marks_over_time: List[Dict[str, Any]]
    fee_summary: Dict[str, Any]
    enrollments: List[Dict[str, Any]]


class ClassAnalytics(BaseModel):
    attendance_by_month: List[Dict[str, Any]]
    marks_by_subject: List[Dict[str, Any]]
    fee_summary: Dict[str, Any]
    top_performers: List[Dict[str, Any]]
    bottom_performers: List[Dict[str, Any]]


# Admin ERP management schemas
class AdminCreateTeacher(BaseModel):
    full_name: str = Field(..., max_length=120)
    email: str = Field(..., max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    subject: Optional[str] = Field(None, max_length=100)
    class_teacher_of: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, max_length=100)


class AdminAssignTeacher(BaseModel):
    teacher_profile_id: int
    class_section_id: int
    subject_id: int
    academic_year: Optional[str] = Field(None, max_length=10)
    is_class_teacher: bool = False


class AdminCreateSubject(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    description: Optional[str] = Field(None, max_length=500)


class AdminCreateInvoice(BaseModel):
    student_id: int
    title: str = Field(..., max_length=200)
    invoice_no: Optional[str] = Field(None, max_length=60)
    term: Optional[str] = Field(None, max_length=60)
    amount_paise: int = Field(..., gt=0)
    due_date: date


class AdminManualPayment(BaseModel):
    invoice_id: int
    amount_paise: int = Field(..., gt=0)
    method: str = Field(..., pattern="^(cash|cheque|upi|neft|other)$")
    note: Optional[str] = Field(None, max_length=200)


class TimetableSlotInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=5)
    period_no: int = Field(..., ge=1)
    start_time: Optional[str] = Field(None, max_length=5)
    end_time: Optional[str] = Field(None, max_length=5)
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    is_break: bool = False


class TimetableUpsert(BaseModel):
    academic_year: str = Field(..., max_length=10)
    slots: List[TimetableSlotInput]


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
