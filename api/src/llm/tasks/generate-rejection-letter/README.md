# AI Rejection Letter Generation

## Overview

This task defines the LLM prompt, input contract, output schema, and guardrails for generating candidate-facing rejection letter drafts.

The generated output is a draft for recruiter or hiring manager review. It is not auto-sent by the LLM task. The UI can request a draft, show it in the rejection modal, allow edits, and then send the reviewed text through the existing rejection flow.

## Current Implementation

LLM task:

- Task name: `generate-rejection-letter`
- Prompt version: `v1`
- Model tier: `light`
- Temperature: `0`
- Max tokens: `1000`
- Output schema: `GenerateRejectionLetterOutput`

Application endpoint:

- `POST /applications/:id/rejection-letter-draft`
- Auth roles: Admin, Recruiter, Hiring Manager
- Returns a structured draft with `subject`, `body`, `tone`, `usedContext`, and `guardrailNotes`

Send behavior:

- The draft is not sent automatically.
- The recruiter/HM must click `Reject Candidate` after reviewing/editing the draft.
- When `PATCH /applications/:id/stage` receives `emailMessage`, the backend sends that custom/AI body.
- If `emailMessage` is not provided, the backend falls back to the default rejection template.

Token usage is intentionally not part of the public LLM contract and is not returned to the UI.

## Input Sources

The input is prepared by `buildRejectionLetterInput()` from application-scoped data only.

Required input:

- `candidate.name`
- `job.title`
- `application.applicationId`
- `application.currentStage`
- `application.reachedStages`
- `application.rejectionReason`
- `tone`

Optional input:

- `candidate.email`
- `job.department`
- `application.rejectionComment`
- `sender.name`
- `sender.role`
- `sender.companyName`
- `stageNotes`
- `scoreCards`

Mapped backend sources:

- Candidate name and email
- Job title
- Current application stage
- Stage transition events
- Rejection reason selected in the UI
- Optional personal rejection note from recruiter/HM
- Application comments, inferred to the closest stage by timestamp
- AI screening summary, recommendation, and score if present
- Score Card recommendation and comments if present
- Sender role/name context for reviewer awareness only

The sender name must not be used as the email signature. The candidate-facing body must always sign as `The HireFlow Team`.

## Tone Options

`neutral`

- Balanced and professional
- 3 short paragraphs plus sign-off
- Polite but not emotional
- May include one safe general reason sentence

`warm`

- Softer and more empathetic
- 3 or 4 short paragraphs plus sign-off
- Still must avoid promises, comparisons, and candidate-deficit wording
- Should explain the decision as a role-fit decision, for example: `this role is not the right match at this time`

`concise`

- Shortest safe version
- 2 short paragraphs plus sign-off
- Maximum 90 words in the body
- Avoids long encouragement or detailed reasoning

Tone changes should affect wording and length, not factual claims.

## Candidate-Facing Rules

The email body must:

- Thank the candidate for their time or interest
- Mention the role title when available
- Clearly say the team will not move forward at this time
- Keep the reason general and low-risk
- Preserve candidate dignity
- End exactly with:

```text
Best regards,
The HireFlow Team
```

The email body must not:

- Include `usedContext` or `guardrailNotes`
- Quote internal notes, personal notes, recruiter notes, HM notes, stage notes, or Score Card comments directly
- Expose interviewer names, internal author names, or internal score card details
- Mention protected attributes or sensitive categories
- Use biased, personal, or legally risky language
- Mention culture fit, personality, values, attitude, communication style, or team fit as a candidate-facing reason
- Say the candidate lacks skills, failed, is weak, is not qualified, did not meet the bar, or did not meet expectations
- Mention the candidate's background or profile
- Say the candidate is overqualified, too senior, too experienced, or better suited for another level
- Compare the candidate to other applicants
- Mention `another candidate`, `other candidates`, `other applicants`, `better suited`, or similar comparative wording
- Claim a comparative ranking
- Invent facts, process steps, feedback, promises, or future openings
- Sign with an individual recruiter, hiring manager, or interviewer name
- Include placeholders such as `[Recruiter Name]`, `[Company Name]`, or TODO text

## Reason-Specific Guidance

`skills_mismatch`

- Do not say the candidate lacks skills, failed an evaluation, is weak, or is not qualified.
- Use general role-fit wording only.
- Safe wording: `this role is not the right match at this time`.

`overqualified`

- Do not say the candidate is overqualified, too senior, too experienced, or better suited for another level.
- Do not suggest specific future senior roles.
- Use general role-fit wording only.

`not_culture_fit`

- This is sensitive.
- Do not mention culture fit, personality, values, communication style, attitude, team fit, or behavior.
- Do not infer anything about the candidate's personal traits.
- Use the shortest general role-fit explanation.

`salary_expectations`

- Do not say the candidate is too expensive or requested too much.
- Do not include exact compensation numbers unless explicitly requested by product/legal.
- Safe wording: `we are not able to align on the compensation range for this role at this time`.

`no_response`

- Keep the wording respectful and neutral.
- Do not blame the candidate.
- Safe wording: `as we have not been able to reconnect, we will not be moving forward at this time`.

`position_closed`

- It is safe to mention that the position has been closed or is no longer active.
- Do not add reassurance about the candidate's profile or personal fit.
- Avoid unnecessary repeated explanation.
- Safe wording: `we are not moving forward at this time because the position has been closed`.

`other`

- Do not infer a specific reason.
- Keep the rejection generic and brief.

If the rejection reason is sensitive or ambiguous, prefer a shorter and more general explanation.

## Input JSON Contract

```json
{
  "candidate": {
    "name": "Nazar Grigoriak",
    "email": "nazar@example.com"
  },
  "job": {
    "title": "Senior DevOps",
    "department": null
  },
  "application": {
    "applicationId": "application-id",
    "currentStage": "technical_interview",
    "rejectionReason": "skills_mismatch",
    "rejectionComment": "Internal recruiter/HM context, not quoted directly.",
    "reachedStages": [
      "new",
      "screening",
      "pre_interview",
      "technical_interview"
    ]
  },
  "sender": {
    "name": "Recruiter Name",
    "role": "Recruiter",
    "companyName": "HireFlow"
  },
  "stageNotes": [
    {
      "stage": "technical_interview",
      "noteType": "technical_interview",
      "text": "Internal note text",
      "createdAt": "2026-06-25T09:00:00.000Z",
      "authorRole": "recruiter"
    }
  ],
  "scoreCards": [
    {
      "recommendation": "reject",
      "comment": "Internal score card comment",
      "interviewerRole": "hiring_manager",
      "createdAt": "2026-06-25T09:00:00.000Z"
    }
  ],
  "tone": "neutral"
}
```

## Output JSON Contract

```json
{
  "subject": "Update on Your Senior DevOps Application",
  "body": "Hi Nazar,\n\nThank you...\n\nBest regards,\nThe HireFlow Team",
  "tone": "neutral",
  "usedContext": [
    "application stage",
    "rejection reason",
    "score card summary"
  ],
  "guardrailNotes": [
    "Internal notes were generalized for candidate-facing wording."
  ]
}
```

`subject` and `body` are candidate-facing.

`usedContext` and `guardrailNotes` are reviewer/debug metadata and must never be inserted into the email body.

## UI/API Flow

1. Recruiter/HM opens the rejection modal.
2. Recruiter/HM selects a required rejection reason.
3. Recruiter/HM optionally enters a personal note.
4. Recruiter/HM selects a tone.
5. UI calls `POST /applications/:id/rejection-letter-draft`.
6. Backend aggregates application history, comments, stage transitions, and score cards.
7. LLM returns a structured draft.
8. UI displays `subject` and `body` for review/editing.
9. Recruiter/HM clicks `Reject Candidate`.
10. UI sends `emailSubject` and `emailMessage` to `PATCH /applications/:id/stage`.
11. Backend sends the reviewed custom email body when `emailMessage` is present.

## Manual Testing Checklist

Test each rejection reason with `neutral`, `warm`, and `concise` where practical.

Minimum cases:

1. Screening rejection with no notes
2. Screening rejection with a generic recruiter note
3. Screening rejection with risky internal note
4. Pre-interview rejection with sparse notes
5. Pre-interview rejection with salary expectations
6. Pre-interview rejection with no response
7. Technical rejection with Score Card `reject`
8. Technical rejection with mixed Score Card feedback
9. Technical rejection with overly specific negative feedback
10. Technical rejection with positive collaboration notes but role mismatch
11. Offer-stage rejection because position closed
12. Offer-stage rejection because compensation expectations changed
13. Rejection after multiple stages with comments
14. Rejection with conflicting notes across stages
15. Rejection with sensitive/protected-class language in internal notes

For every generated draft, verify:

- The body is polite and professional
- No internal notes are quoted directly
- No protected-class or biased language appears
- No candidate-deficit wording appears
- No comparison to other candidates appears
- No invented process step or promise appears
- The selected tone is reflected
- The sign-off is exactly `Best regards,\nThe HireFlow Team`
- `usedContext` and `guardrailNotes` stay outside the email body

## Salary Expectations Test

Use reason: `salary_expectations`.

Example personal note:

```text
Candidate expected 6500 USD monthly, but the approved budget for this role is 4000-4500 USD. Do not include exact numbers in the candidate-facing email.
```

Expected safe wording:

```text
At this time, we are not able to align on the compensation range for this role.
```

Bad output examples:

```text
Your salary expectations are too high.
```

```text
You asked for 6500 USD, but our budget is 4500 USD.
```

## Known Limitations

- Prompt v1 generates English drafts only.
- The LLM does not decide whether rejection is allowed; the caller must enforce business rules.
- The LLM does not send emails.
- The draft still requires recruiter/HM review before sending.
- The prompt cannot guarantee legal approval for every possible generated phrase.
- Sparse input produces generic output.
- Sensitive categories and risky notes must be reviewed carefully even when guardrails are present.

## Product Review Questions

- Should v1 support Ukrainian or other languages?
- Should Legal approve final wording before release?
- Should future-opportunity language be allowed or avoided by default?
- Should candidates ever receive specific feedback, or always a general rejection?
- Should different departments have separate brand voice templates?
- Should rejected offer-stage candidates receive a different template?
- Should reviewer metadata be visible in the UI, or only backend logs?
