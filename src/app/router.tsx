import { BrowserRouter, Route, Routes } from "react-router";
import { LandingPage } from "../features/auth/pages/LandingPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage";
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import { AppLayout, MarketingLayout } from "../layouts/AppLayouts";
import { AdminHomePage, PendingAccessPage, StudentHomePage, TeacherHomePage } from "../features/access/pages/AccessPages";
import { CreateStudentPage } from "../features/students/pages/CreateStudentPage";
import { EditStudentPage } from "../features/students/pages/EditStudentPage";
import { StudentDetailPage } from "../features/students/pages/StudentDetailPage";
import { StudentListPage } from "../features/students/pages/StudentListPage";
import { CreateTeacherPage } from "../features/teachers/pages/CreateTeacherPage";
import { EditTeacherPage } from "../features/teachers/pages/EditTeacherPage";
import { TeacherDetailPage } from "../features/teachers/pages/TeacherDetailPage";
import { TeacherListPage } from "../features/teachers/pages/TeacherListPage";
import { ClassDetailPage } from "../features/classes/pages/ClassDetailPage";
import { ClassListPage } from "../features/classes/pages/ClassListPage";
import { CreateClassPage } from "../features/classes/pages/CreateClassPage";
import { EditClassPage } from "../features/classes/pages/EditClassPage";
import { EnrollmentListPage } from "../features/enrollments/pages/EnrollmentListPage";
import { EnrollmentManagePage } from "../features/enrollments/pages/EnrollmentManagePage";
import { AttendanceDetailPage } from "../features/attendance/pages/AttendanceDetailPage";
import { AttendanceListPage } from "../features/attendance/pages/AttendanceListPage";
import { EditAttendancePage } from "../features/attendance/pages/EditAttendancePage";
import { RecordAttendancePage } from "../features/attendance/pages/RecordAttendancePage";
import { EditGradePage } from "../features/grades/pages/EditGradePage";
import { GradeDetailPage } from "../features/grades/pages/GradeDetailPage";
import { GradeListPage } from "../features/grades/pages/GradeListPage";
import { RecordGradePage } from "../features/grades/pages/RecordGradePage";
import { CreateExamPage } from "../features/exams/pages/CreateExamPage";
import { EditExamPage } from "../features/exams/pages/EditExamPage";
import { ExamDetailPage } from "../features/exams/pages/ExamDetailPage";
import { ExamListPage } from "../features/exams/pages/ExamListPage";
import { CreateTimetablePage } from "../features/timetable/pages/CreateTimetablePage";
import { EditTimetablePage } from "../features/timetable/pages/EditTimetablePage";
import { TimetableDetailPage } from "../features/timetable/pages/TimetableDetailPage";
import { TimetableListPage } from "../features/timetable/pages/TimetableListPage";
import { AnnouncementDetailPage } from "../features/announcements/pages/AnnouncementDetailPage";
import { AnnouncementListPage } from "../features/announcements/pages/AnnouncementListPage";
import { CreateAnnouncementPage } from "../features/announcements/pages/CreateAnnouncementPage";
import { EditAnnouncementPage } from "../features/announcements/pages/EditAnnouncementPage";
import { CreateFeePage } from "../features/fees/pages/CreateFeePage";
import { EditFeePage } from "../features/fees/pages/EditFeePage";
import { FeeDetailPage } from "../features/fees/pages/FeeDetailPage";
import { FeeListPage } from "../features/fees/pages/FeeListPage";
import { BookListPage } from "../features/library/pages/BookListPage";
import { BookDetailPage } from "../features/library/pages/BookDetailPage";
import { BorrowListPage } from "../features/library/pages/BorrowListPage";
import { CreateBookPage } from "../features/library/pages/CreateBookPage";
import { EditBookPage } from "../features/library/pages/EditBookPage";
import { AccountDetailPage } from "../features/accounts/pages/AccountDetailPage";
import { AccountListPage } from "../features/accounts/pages/AccountListPage";
import { CreateAccountPage } from "../features/accounts/pages/CreateAccountPage";
import { EditAccountPage } from "../features/accounts/pages/EditAccountPage";
import { CreateStaffPage } from "../features/staff/pages/CreateStaffPage";
import { EditStaffPage } from "../features/staff/pages/EditStaffPage";
import { StaffDetailPage } from "../features/staff/pages/StaffDetailPage";
import { StaffListPage } from "../features/staff/pages/StaffListPage";
import { MessagesPage } from "../features/messages/pages/MessagesPage";
import { ReportPage } from "../features/reports/pages/ReportPage";
import { ReportsHomePage } from "../features/reports/pages/ReportsHomePage";
import { NotificationDetailPage } from "../features/notifications/pages/NotificationDetailPage";
import { NotificationListPage } from "../features/notifications/pages/NotificationListPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AppHomeRedirect, GuestOnly, RequireAuth, RequirePersona } from "../routes/guards";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<AppHomeRedirect />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/profile/password" element={<ChangePasswordPage />} />
            <Route path="/app/announcements" element={<AnnouncementListPage />} />
            <Route path="/app/announcements/:id" element={<AnnouncementDetailPage />} />
            <Route path="/app/messages" element={<MessagesPage />} />
            <Route path="/app/messages/:participantId" element={<MessagesPage />} />
            <Route path="/app/notifications" element={<NotificationListPage />} />
            <Route path="/app/notifications/:id" element={<NotificationDetailPage />} />
            <Route element={<RequirePersona allow="admin" />}>
              <Route path="/app/admin" element={<AdminHomePage />} />
              <Route path="/app/students/new" element={<CreateStudentPage />} />
              <Route path="/app/students/:id/edit" element={<EditStudentPage />} />
              <Route path="/app/teachers/new" element={<CreateTeacherPage />} />
              <Route path="/app/teachers/:id/edit" element={<EditTeacherPage />} />
              <Route path="/app/classes/new" element={<CreateClassPage />} />
              <Route path="/app/classes/:id/edit" element={<EditClassPage />} />
              <Route path="/app/enrollments" element={<EnrollmentListPage />} />
              <Route path="/app/enrollments/:classId" element={<EnrollmentManagePage />} />
              <Route path="/app/attendance/record" element={<RecordAttendancePage />} />
              <Route path="/app/attendance/:id/edit" element={<EditAttendancePage />} />
              <Route path="/app/grades/record" element={<RecordGradePage />} />
              <Route path="/app/grades/:id/edit" element={<EditGradePage />} />
              <Route path="/app/exams/new" element={<CreateExamPage />} />
              <Route path="/app/exams/:id/edit" element={<EditExamPage />} />
              <Route path="/app/timetables/new" element={<CreateTimetablePage />} />
              <Route path="/app/timetables/:id/edit" element={<EditTimetablePage />} />
              <Route path="/app/fees/new" element={<CreateFeePage />} />
              <Route path="/app/fees/:id/edit" element={<EditFeePage />} />
              <Route path="/app/library/books/new" element={<CreateBookPage />} />
              <Route path="/app/library/books/:id/edit" element={<EditBookPage />} />
              <Route path="/app/accounts" element={<AccountListPage />} />
              <Route path="/app/accounts/new" element={<CreateAccountPage />} />
              <Route path="/app/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/app/accounts/:id/edit" element={<EditAccountPage />} />
              <Route path="/app/staff" element={<StaffListPage />} />
              <Route path="/app/staff/new" element={<CreateStaffPage />} />
              <Route path="/app/staff/:id" element={<StaffDetailPage />} />
              <Route path="/app/staff/:id/edit" element={<EditStaffPage />} />
              <Route path="/app/announcements/new" element={<CreateAnnouncementPage />} />
              <Route path="/app/announcements/:id/edit" element={<EditAnnouncementPage />} />
            </Route>
            <Route element={<RequirePersona allow="teacher" />}>
              <Route path="/app/teacher" element={<TeacherHomePage />} />
            </Route>
            <Route element={<RequirePersona allow="student" />}>
              <Route path="/app/student" element={<StudentHomePage />} />
            </Route>
            <Route element={<RequirePersona allow="unscoped" />}>
              <Route path="/app/pending" element={<PendingAccessPage />} />
            </Route>
            <Route element={<RequirePersona allow={["admin", "teacher", "student"]} />}>
              <Route path="/app/students" element={<StudentListPage />} />
              <Route path="/app/students/:id" element={<StudentDetailPage />} />
              <Route path="/app/teachers" element={<TeacherListPage />} />
              <Route path="/app/teachers/:id" element={<TeacherDetailPage />} />
              <Route path="/app/classes" element={<ClassListPage />} />
              <Route path="/app/classes/:id" element={<ClassDetailPage />} />
              <Route path="/app/attendance" element={<AttendanceListPage />} />
              <Route path="/app/attendance/:id" element={<AttendanceDetailPage />} />
              <Route path="/app/grades" element={<GradeListPage />} />
              <Route path="/app/grades/:id" element={<GradeDetailPage />} />
              <Route path="/app/exams" element={<ExamListPage />} />
              <Route path="/app/exams/:id" element={<ExamDetailPage />} />
              <Route path="/app/timetables" element={<TimetableListPage />} />
              <Route path="/app/timetables/:id" element={<TimetableDetailPage />} />
              <Route path="/app/fees" element={<FeeListPage />} />
              <Route path="/app/fees/:id" element={<FeeDetailPage />} />
              <Route path="/app/library" element={<BookListPage />} />
              <Route path="/app/reports" element={<ReportsHomePage />} />
              <Route path="/app/reports/:reportId" element={<ReportPage />} />
              <Route path="/app/library/books/:id" element={<BookDetailPage />} />
              <Route path="/app/library/borrows" element={<BorrowListPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
