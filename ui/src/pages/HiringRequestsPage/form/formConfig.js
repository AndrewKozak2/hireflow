export const HIRING_REQUEST_INITIAL_VALUES = {
  job_title: "",
  reason_for_opening: "",
  department: null,
  headcount: 1,
  expertise_level: "L3",
  english_level: "B1",
  required_experience_years: 3,
  past_potential_positions: "",
  key_requirements: "",
  certifications_courses: "",
  desired_personal_qualities: "",
  unacceptable_personal_qualities: "",
  role_purpose: "",
  area_of_responsibility: "",
  first_90_days_goals: "",
  future_responsibilities: "",
  reports_to_id: null,
  direct_reports: "",
  location: "remote",
  employment_type: "full_time",
  target_start_date: null,
  salary_min: null,
  salary_max: null,
  currency: "USD",
  priority: "medium",
  hm_notes_for_recruiter: "",
};

export const HIRING_REQUEST_FORM_VALIDATE = {
  job_title: (val) => (val.trim() ? null : "Job title is required"),
  reason_for_opening: (val) =>
    val.trim() ? null : "Reason for opening is required",
  department: (val) => (val ? null : "Department is required"),
  headcount: (val) => (val >= 1 ? null : "Headcount must be at least 1"),
  key_requirements: (val) =>
    !val || !val.trim()
      ? "Requirements are required"
      : val.trim().length < 20
        ? "Requirements must be at least 20 characters"
        : null,
  role_purpose: (val) => (val.trim() ? null : "Role purpose is required"),
};

export function createHiringRequestNote(text) {
  const normalizedText = text?.trim();

  if (!normalizedText) {
    return null;
  }

  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date_time: new Date().toISOString(),
    text: normalizedText,
  };
}

function parseHiringRequestNotes(notes) {
  if (typeof notes !== "string" || !notes.trim().startsWith("[")) {
    return null;
  }

  try {
    const parsedNotes = JSON.parse(notes);

    return Array.isArray(parsedNotes) ? parsedNotes : null;
  } catch {
    return null;
  }
}

export function normalizeHiringRequestNotes(notes) {
  if (Array.isArray(notes)) {
    return notes
      .flatMap((note) => {
        const parsedNotes = parseHiringRequestNotes(note?.text);

        return parsedNotes ? normalizeHiringRequestNotes(parsedNotes) : note;
      })
      .filter((note) => note?.text);
  }

  if (typeof notes === "string" && notes.trim()) {
    const parsedNotes = parseHiringRequestNotes(notes);

    if (parsedNotes) {
      return normalizeHiringRequestNotes(parsedNotes);
    }

    const note = createHiringRequestNote(notes);
    return note ? [note] : [];
  }

  return [];
}

export function getHiringRequestNotesText(notes) {
  return normalizeHiringRequestNotes(notes)
    .map((note) => note.text)
    .join("\n");
}

export function requestToFormValues(data) {
  return {
    job_title: data.job_title ?? "",
    reason_for_opening: data.reason_for_opening ?? "",
    department: data.department ?? null,
    headcount: data.headcount ?? 1,
    expertise_level: data.expertise_level ?? "L3",
    english_level: data.english_level ?? "B1",
    required_experience_years: data.required_experience_years ?? 3,
    past_potential_positions: data.past_potential_positions ?? "",
    key_requirements: data.key_requirements ?? "",
    certifications_courses: data.certifications_courses ?? "",
    desired_personal_qualities: data.desired_personal_qualities ?? "",
    unacceptable_personal_qualities: data.unacceptable_personal_qualities ?? "",
    role_purpose: data.role_purpose ?? "",
    area_of_responsibility: data.area_of_responsibility ?? "",
    first_90_days_goals: data.first_90_days_goals ?? "",
    future_responsibilities: data.future_responsibilities ?? "",
    reports_to_id: data.reports_to_id ?? null,
    direct_reports: data.direct_reports ?? "",
    location: data.location ?? "remote",
    employment_type: data.employment_type ?? "full_time",
    target_start_date: data.target_start_date
      ? new Date(data.target_start_date)
      : null,
    salary_min: data.salary_min ?? null,
    salary_max: data.salary_max ?? null,
    currency: data.currency ?? "USD",
    priority: data.priority ?? "medium",
    hm_notes_for_recruiter: data.hm_notes_for_recruiter ?? "",
  };
}
