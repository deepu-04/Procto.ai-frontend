import React, { lazy } from "react";
import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Loadable from "../layouts/full/shared/loadable/Loadable";

/* ================= IMPORTANT: DO NOT LAZY LOAD AUTH GUARDS ================= */
import PrivateRoute from "../views/authentication/PrivateRoute";
import TeacherRoute from "../views/authentication/TeacherRoute";

/* ================= LAYOUTS ================= */
const BlankLayout = Loadable(lazy(() => import("../layouts/blank/BlankLayout")));
const FullLayout = Loadable(lazy(() => import("../layouts/full/FullLayout")));
const ExamLayout = Loadable(lazy(() => import("../layouts/full/ExamLayout")));

/* ================= PUBLIC ================= */
const Home = Loadable(lazy(() => import("../views/Home")));
const Success = Loadable(lazy(() => import("../views/Success")));

/* ================= AUTH ================= */
const Login = Loadable(lazy(() => import("../views/authentication/Login")));
const Register = Loadable(lazy(() => import("../views/authentication/Register")));
const Error = Loadable(lazy(() => import("../views/authentication/Error")));

/* ================= STUDENT ================= */
const ExamPage = Loadable(lazy(() => import("../views/student/ExamPage")));
const ExamDetails = Loadable(lazy(() => import("../views/student/ExamDetails")));
const TestPage = Loadable(lazy(() => import("../views/student/TestPage")));
const CodeDetails = Loadable(lazy(() => import("../views/student/CodeDetails")));
const Coder = Loadable(lazy(() => import("../views/student/Coder")));
const ResultPage = Loadable(lazy(() => import("../views/student/ResultPage")));
const ResumeBasedExam = Loadable(lazy(() => import("../views/student/Components/ResumeBasedExam")));
const AiExam = Loadable(lazy(() => import("../views/student/Components/AiExam")));
const HelpSupport = Loadable(lazy(() => import("../views/student/Components/HelpSupport")));
const Analytics = Loadable(lazy(() => import("../views/student/Components/Analytics")));
const WebCam = Loadable(lazy(() => import("../views/student/Components/WebCam")));

/* ================= STUDENT PROCTO INTERVIEW ================= */
const ProctoApp = Loadable(lazy(() => import("../views/student/Components/interview/ProctoApp")));
const ProctoDashboard = Loadable(lazy(() => import("../views/student/Components/interview/Dashboard")));
const InterviewSession = Loadable(lazy(() => import("../views/student/Components/interview/InterviewSession")));
const InterviewLoader = Loadable(lazy(() => import("../views/student/Components/interview/Loader")));

/* ================= TEACHER ================= */
const CreateExamPage = Loadable(lazy(() => import("../views/teacher/CreateExamPage")));
const AddQuestions = Loadable(lazy(() => import("../views/teacher/AddQuestions")));
const ExamLogPage = Loadable(lazy(() => import("../views/teacher/ExamLogPage")));
const ConductInterview = Loadable(lazy(() => import("../views/teacher/ConductInterview")));

/* ================= ROUTER CONFIG ================= */
const Router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* ================= PUBLIC HOME ================= */}
      <Route path="/" element={<BlankLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* ================= AUTH ================= */}
      <Route path="/auth" element={<BlankLayout />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="404" element={<Error />} />
      </Route>

      {/* ================= PROTECTED ROUTES ================= */}
      <Route element={<PrivateRoute />}>

        {/* ===== DASHBOARD LAYOUT ===== */}
        <Route element={<FullLayout />}>

          {/* Student Dashboard */}
          <Route path="/dashboard" element={<ExamPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/success" element={<Success />} />

          {/* ===== STUDENT FEATURES ===== */}
          <Route path="/candidate/resume-exam" element={<ResumeBasedExam />} />
          <Route path="/candidate/ai-exam" element={<AiExam />} />
          <Route path="/candidate/help-support" element={<HelpSupport />} />
          <Route path="/candidate/analytics" element={<Analytics />} />
          <Route path="/candidate/webcam" element={<WebCam />} />

          {/* ===== AI INTERVIEW ===== */}
          <Route path="/candidate/procto-interview" element={<ProctoApp />} />
          <Route path="/candidate/procto-interview/dashboard" element={<ProctoDashboard />} />
          <Route path="/candidate/procto-interview/session" element={<InterviewSession />} />
          <Route path="/candidate/procto-interview/loader" element={<InterviewLoader />} />

          {/* ===== TEACHER ONLY ===== */}
          <Route element={<TeacherRoute />}>
            {/* FIX: Added /admin route to catch Teacher logins and route them to their workspace */}
            <Route path="/admin" element={<Navigate to="/create-exam" replace />} />
            
            <Route path="/create-exam" element={<CreateExamPage />} />
            <Route path="/add-questions" element={<AddQuestions />} />
            <Route path="/exam-log" element={<ExamLogPage />} />
            <Route path="/teacher/conduct-interview" element={<ConductInterview />} />
          </Route>

        </Route>

        {/* ===== FULL SCREEN EXAM ===== */}
        <Route element={<ExamLayout />}>
          <Route path="/exam/:examId" element={<ExamDetails />} />
          <Route path="/exam/:examId/:testId" element={<TestPage />} />
          <Route path="/exam/:examId/codedetails" element={<CodeDetails />} />
          <Route path="/exam/:examId/code" element={<Coder />} />
        </Route>

      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/auth/404" replace />} />

    </>
  )
);

export default Router;