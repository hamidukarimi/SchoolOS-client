import type { UserProfile } from "../auth/types";
import type { ApiSuccess } from "../auth/types";
import { getApiErrorMessage } from "../../services/api-error";
import { http } from "../../services/http";
import { profileBelongsToAccount, resolveAccess, type AccessAccount } from "./resolve-access";
import {
  NO_SCHOOL_ACCESS_MESSAGE,
  type AccessContext,
  type LinkedProfileRecord,
  type SchoolProbe,
} from "./types";

interface RawProfile {
  _id?: unknown;
  id?: unknown;
  userId?: unknown;
}

function profileId(record: RawProfile): string | null {
  if (typeof record._id === "string" && record._id) return record._id;
  if (typeof record.id === "string" && record.id) return record.id;
  return null;
}

function toLinkedRecords(records: RawProfile[]): LinkedProfileRecord[] {
  return records.flatMap((record) => {
    const id = profileId(record);
    if (!id) return [];
    return [{ profileId: id, userId: record.userId }];
  });
}

async function probe(
  path: "/teachers" | "/students",
  listKey: "teachers" | "students",
): Promise<SchoolProbe> {
  try {
    const response = await http.get<ApiSuccess<Record<string, RawProfile[]>>>(path, {
      params: { page: 1, limit: 20 },
    });
    const records = response.data.data?.[listKey] ?? [];
    return { status: "ok", records: toLinkedRecords(records) };
  } catch (error) {
    const parsed = getApiErrorMessage(error);
    if (parsed.status === 403 && parsed.message === NO_SCHOOL_ACCESS_MESSAGE) {
      return { status: "no-access" };
    }
    return { status: "failed", message: parsed.message };
  }
}

function probeIncludesAccount(probeResult: SchoolProbe, account: AccessAccount): boolean {
  return (
    probeResult.status === "ok" &&
    probeResult.records.some((record) => profileBelongsToAccount(record.userId, account))
  );
}

export async function loadAccessContext(user: UserProfile): Promise<AccessContext> {
  const account: AccessAccount = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  if (account.role === "admin") {
    return { accountRole: "admin", persona: "admin" };
  }

  const teachers = await probe("/teachers", "teachers");
  const students = probeIncludesAccount(teachers, account)
    ? null
    : teachers.status === "ok"
      ? await probe("/students", "students")
      : null;

  const resolution = resolveAccess({ account, teachers, students });
  if (!resolution.ok) {
    throw new Error(resolution.message);
  }

  return resolution.context;
}
