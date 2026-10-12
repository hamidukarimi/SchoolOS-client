import { BrowserRouter, Route, Routes } from "react-router";
import { LandingPage } from "../features/auth/pages/LandingPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage";
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import { AppLayout, MarketingLayout } from "../layouts/AppLayouts";
import { AdminHomePage, PendingAccessPage, StudentHomePage, TeacherHomePage } from "../features/access/pages/AccessPages";
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
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
