import { Award, CalendarCheck, CalendarDays, ClipboardList, Contact, GraduationCap, House, IdCard, KeyRound, Presentation, School, Shield, UserPlus, UserRound, Users, UserX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SchoolPersona } from "./types";

export interface NavItem {
  label: string;
  to: string;
  personas: SchoolPersona[];
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    to: "/app/admin",
    personas: ["admin"],
    icon: Shield,
    end: true,
  },
  {
    label: "Home",
    to: "/app/teacher",
    personas: ["teacher"],
    icon: House,
    end: true,
  },
  {
    label: "Home",
    to: "/app/student",
    personas: ["student"],
    icon: GraduationCap,
    end: true,
  },
  {
    label: "Home",
    to: "/app/pending",
    personas: ["unscoped"],
    icon: UserX,
    end: true,
  },
  {
    label: "Students",
    to: "/app/students",
    personas: ["admin", "teacher"],
    icon: Users,
  },
  {
    label: "My record",
    to: "/app/students",
    personas: ["student"],
    icon: IdCard,
  },
  {
    label: "Teachers",
    to: "/app/teachers",
    personas: ["admin", "student"],
    icon: Presentation,
  },
  {
    label: "Teaching record",
    to: "/app/teachers",
    personas: ["teacher"],
    icon: Contact,
  },
  {
    label: "Classes",
    to: "/app/classes",
    personas: ["admin", "teacher", "student"],
    icon: School,
  },
  {
    label: "Enrollment",
    to: "/app/enrollments",
    personas: ["admin"],
    icon: UserPlus,
  },
  {
    label: "Attendance",
    to: "/app/attendance",
    personas: ["admin", "teacher", "student"],
    icon: CalendarCheck,
  },
  {
    label: "Results",
    to: "/app/grades",
    personas: ["admin", "teacher", "student"],
    icon: Award,
  },
  {
    label: "Exams",
    to: "/app/exams",
    personas: ["admin", "teacher", "student"],
    icon: ClipboardList,
  },
  {
    label: "Timetable",
    to: "/app/timetables",
    personas: ["admin", "teacher", "student"],
    icon: CalendarDays,
  },
  {
    label: "Profile",
    to: "/app/profile",
    personas: ["admin", "teacher", "student", "unscoped"],
    icon: UserRound,
    end: true,
  },
  {
    label: "Password",
    to: "/app/profile/password",
    personas: ["admin", "teacher", "student", "unscoped"],
    icon: KeyRound,
  },
];

export function homePathFor(persona: SchoolPersona): string {
  const home = navItems.find(
    (item) => item.label === "Home" && item.personas.length === 1 && item.personas[0] === persona,
  );
  return home?.to ?? "/app/profile";
}

export function navigationFor(persona: SchoolPersona): NavItem[] {
  return navItems.filter((item) => item.personas.includes(persona));
}

export function accountNavigation(): NavItem[] {
  return navItems.filter((item) => item.personas.length === 4);
}

export function personaLabel(persona: SchoolPersona): string {
  switch (persona) {
    case "admin":
      return "Administrator";
    case "teacher":
      return "Teacher";
    case "student":
      return "Student";
    case "unscoped":
      return "No school profile";
  }
}
