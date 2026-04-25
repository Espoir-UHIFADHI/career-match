export type NetworkingContactStatus =
  | "to_contact"
  | "contacted"
  | "followed_up"
  | "replied"
  | "not_relevant";

export interface NetworkingContactRecord {
  id: string;
  user_id: string;
  job_key: string | null;
  linkedin_url: string;
  full_name: string | null;
  title: string | null;
  company: string | null;
  snippet: string | null;
  status: NetworkingContactStatus;
  tags: string[];
  notes: string | null;
  next_follow_up: string | null; // YYYY-MM-DD
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetworkingMessageHistoryRecord {
  id: string;
  user_id: string;
  contact_id: string;
  channel: "linkedin" | "email";
  step: number;
  content: string;
  copied_at: string | null;
  created_at: string;
  meta: Record<string, unknown>;
}

export function makeJobKey(input: { company?: string | null; title?: string | null }): string | null {
  const company = (input.company || "").trim();
  const title = (input.title || "").trim();
  if (!company && !title) return null;
  return `${company}::${title}`;
}

async function callNetworkingBackend<T>(action: string, payload: Record<string, unknown>, token: string): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL manquant.");

  const response = await fetch(`${supabaseUrl}/functions/v1/career-match-api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const details =
      typeof body === "object" && body
        ? [
            "error" in body ? String(body.error) : "",
            "details" in body ? String(body.details) : "",
          ].filter(Boolean).join(" — ")
        : String(body || response.statusText);
    throw new Error(details || `Edge Function HTTP ${response.status}`);
  }

  return body as T;
}

export async function upsertNetworkingContact(args: {
  token: string;
  userId: string;
  linkedinUrl: string;
  jobKey: string | null;
  fullName?: string;
  title?: string;
  company?: string;
  snippet?: string;
  status?: NetworkingContactStatus;
  tags?: string[];
  notes?: string;
  nextFollowUp?: string | null;
}): Promise<NetworkingContactRecord> {
  return callNetworkingBackend<NetworkingContactRecord>("networking-upsert-contact", {
    linkedinUrl: args.linkedinUrl,
    jobKey: args.jobKey,
    fullName: args.fullName ?? null,
    title: args.title ?? null,
    company: args.company ?? null,
    snippet: args.snippet ?? null,
    status: args.status ?? null,
    tags: args.tags ?? [],
    notes: args.notes ?? null,
    nextFollowUp: args.nextFollowUp ?? null,
  }, args.token);
}

export async function updateNetworkingContact(args: {
  token: string;
  contactId: string;
  patch: Partial<Pick<NetworkingContactRecord, "status" | "tags" | "notes" | "next_follow_up">>;
}): Promise<NetworkingContactRecord> {
  return callNetworkingBackend<NetworkingContactRecord>("networking-update-contact", {
    contactId: args.contactId,
    patch: args.patch,
  }, args.token);
}

export async function listNetworkingContacts(args: { token: string; jobKey?: string | null }) {
  return callNetworkingBackend<NetworkingContactRecord[]>("networking-list-contacts", {
    jobKey: args.jobKey ?? null,
  }, args.token);
}

export async function insertNetworkingMessageHistory(args: {
  token: string;
  userId: string;
  contactId: string;
  channel: "linkedin" | "email";
  step: number;
  content: string;
  meta?: Record<string, unknown>;
}): Promise<NetworkingMessageHistoryRecord> {
  return callNetworkingBackend<NetworkingMessageHistoryRecord>("networking-insert-message", {
    contactId: args.contactId,
    channel: args.channel,
    step: args.step,
    content: args.content,
    meta: args.meta ?? {},
  }, args.token);
}

export async function listNetworkingMessageHistory(args: { token: string; contactId: string }) {
  return callNetworkingBackend<NetworkingMessageHistoryRecord[]>("networking-list-messages", {
    contactId: args.contactId,
  }, args.token);
}

export async function markNetworkingMessageCopied(args: { token: string; messageId: string }) {
  return callNetworkingBackend<NetworkingMessageHistoryRecord>("networking-mark-message-copied", {
    messageId: args.messageId,
  }, args.token);
}

