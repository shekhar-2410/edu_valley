from database import Base
from sqlalchemy import Column, Date, DateTime, Integer, String, Text, LargeBinary, Boolean, ForeignKey
from sqlalchemy.sql import func


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    location = Column(String(200))
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    department = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    image_url = Column(String(500))
    bio = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    image_url = Column(String(500), nullable=False)
    category = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20))
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="new")  # new, responded, archived
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



class StoredImage(Base):
    __tablename__ = "stored_images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(200), nullable=False)
    content_type = Column(String(50), nullable=False)
    data = Column(LargeBinary, nullable=False)
    thumbnail_content_type = Column(String(50))
    thumbnail_data = Column(LargeBinary)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default="normal")  # low, normal, high
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_admin = Column(Boolean, default=True)


class ErpUser(Base):
    __tablename__ = "erp_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)  # student, teacher, guardian
    full_name = Column(String(120), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("erp_users.id"), unique=True, nullable=False)
    admission_no = Column(String(50), unique=True, nullable=False)
    roll_no = Column(String(20))
    class_name = Column(String(50), nullable=False)
    section = Column(String(10), nullable=False)
    guardian_name = Column(String(120))
    guardian_phone = Column(String(20))
    address = Column(Text)
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(5), nullable=True)
    status = Column(String(20), default="active")  # active, transferred, withdrawn, expelled
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("erp_users.id"), unique=True, nullable=False)
    employee_no = Column(String(50), unique=True, nullable=False)
    department = Column(String(100))
    subject = Column(String(100))
    phone = Column(String(20))
    class_teacher_of = Column(String(80))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class FeeInvoice(Base):
    __tablename__ = "fee_invoices"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    invoice_no = Column(String(80), unique=True, nullable=False)
    title = Column(String(160), nullable=False)
    term = Column(String(80))
    amount_paise = Column(Integer, nullable=False)
    paid_paise = Column(Integer, default=0)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="pending")  # pending, partial, paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("fee_invoices.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    amount_paise = Column(Integer, nullable=False)
    method = Column(String(40), default="cash")
    status = Column(String(20), default="paid")  # created, paid, failed
    receipt_no = Column(String(80), unique=True)
    razorpay_order_id = Column(String(120))
    razorpay_payment_id = Column(String(120))
    paid_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"))
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    days_count = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reviewer_note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MarkEntry(Base):
    __tablename__ = "mark_entries"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=False, index=True)
    subject = Column(String(100), nullable=False)
    exam_name = Column(String(120), nullable=False)
    marks_obtained = Column(Integer, nullable=False)
    max_marks = Column(Integer, nullable=False)
    grade = Column(String(10))
    remarks = Column(Text)
    exam_date = Column(Date, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    enrollment_id = Column(Integer, ForeignKey("student_class_enrollments.id"), nullable=True)
    academic_year = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)  # present, absent, leave
    note = Column(Text)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=True)
    marked_by_teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=True)
    enrollment_id = Column(Integer, ForeignKey("student_class_enrollments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClassSection(Base):
    __tablename__ = "class_sections"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(20), nullable=False)
    section = Column(String(10), nullable=False)
    academic_year = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)


class TeacherSubjectAssignment(Base):
    __tablename__ = "teacher_subject_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    is_class_teacher = Column(Boolean, default=False)


class StudentClassEnrollment(Base):
    __tablename__ = "student_class_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    roll_no = Column(String(20), nullable=True)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_name = Column(String(120), nullable=False)
    exam_date = Column(Date, nullable=False)
    start_time = Column(String(5), nullable=True)
    end_time = Column(String(5), nullable=True)
    venue = Column(String(100), nullable=True)
    hall_no = Column(String(20), nullable=True)
    academic_year = Column(String(10), nullable=False)
    max_marks = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon ... 5=Sat
    period_no = Column(Integer, nullable=False)  # 1-8
    start_time = Column(String(5), nullable=True)
    end_time = Column(String(5), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=True)
    is_break = Column(Boolean, default=False)


class GuardianStudent(Base):
    __tablename__ = "guardian_students"

    id = Column(Integer, primary_key=True, index=True)
    guardian_user_id = Column(Integer, ForeignKey("erp_users.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    relationship = Column(String(40), default="guardian")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MessageThread(Base):
    __tablename__ = "message_threads"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=True, index=True)
    guardian_user_id = Column(Integer, ForeignKey("erp_users.id"), nullable=True, index=True)
    subject = Column(String(160), nullable=False)
    status = Column(String(20), default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ThreadMessage(Base):
    __tablename__ = "thread_messages"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("message_threads.id"), nullable=False, index=True)
    sender_user_id = Column(Integer, ForeignKey("erp_users.id"), nullable=False, index=True)
    sender_role = Column(String(20), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_kind = Column(String(20), nullable=False, index=True)  # admin, erp
    recipient_id = Column(Integer, nullable=False, index=True)
    title = Column(String(160), nullable=False)
    body = Column(Text)
    type = Column(String(40), default="info")
    link = Column(String(200))
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_kind = Column(String(20), nullable=False)
    actor_email = Column(String(120))
    action = Column(String(80), nullable=False)
    entity_type = Column(String(80), nullable=False)
    entity_id = Column(String(60))
    before_json = Column(Text)
    after_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
