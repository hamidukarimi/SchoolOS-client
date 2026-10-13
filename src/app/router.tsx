import { BrowserRouter, Route, Routes } from "react-router";
import { LandingPage } from "../features/auth/pages/LandingPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage";
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import { AppLayout, MarketingLayout } from "../layouts/AppLayouts";
import { AdminHomePage, PendingAccessPage, StudentHomePage, TeacherHomePage } from "../features/access/pages/AccessPages";
import { EditStudentPage } from "../features/students/pages/EditStudentPage";
import { StudentDetailPage } from "../features/students/pages/StudentDetailPage";
import { StudentListPage } from "../features/students/pages/StudentListPage";
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
            <Route element={<RequirePersona allow="admin" />}>
              <Route path="/app/admin" element={<AdminHomePage />} />
              <Route path="/app/students/:id/edit" element={<EditStudentPage />} />
              <Route path="/app/teachers/:id/edit" element={<EditTeacherPage />} />
              <Route path="/app/classes/new" element={<CreateClassPage />} />
              <Route path="/app/classes/:id/edit" element={<EditClassPage />} />
              <Route path="/app/enrollments" element={<EnrollmentListPage />} />
              <Route path="/app/enrollments/:classId" element={<EnrollmentManagePage />} />
              <Route path="/app/attendance/record" element={<RecordAttendancePage />} />
              <Route path="/app/attendance/:id/edit" element={<EditAttendancePage />} />
              <Route path="/app/grades/record" element={<RecordGradePage />} />
              <Route path="/app/grades/:id/edit" element={<EditGradePage />} />
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
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
