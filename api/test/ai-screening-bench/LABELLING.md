# Labelling guide

The bench compares the AI screening answers with **human** judgments. Those judgments are the ground
truth, so they must come from a person, never from an LLM, and never from the bench's own output.

## Before you start

- Label **blind**: read only the job (`data/jobs.json`) and the CV (`data/cvs/<id>.txt`). Do not
  look at bench results, reports or anything the model produced for these pairs.
- Label each pair on its own merits. You don't need to rank CVs against each other.
- Labelling all 19 sample pairs takes about 30–40 minutes.

## What to fill in

Each entry in `data/labels.json` is one (CV, job) pair:

```json
{
  "cvId": "cv-xx",
  "jobId": "job-xx",
  "recommendation": "review",
  "score": 55,
  "labeller": "J.D.",
  "labelledAt": "2026-11-03",
  "notes": "One sentence on why."
}
```

(Placeholder ids and values, not a pair from the dataset.) Any other field name is rejected, so a
typo such as `recomendation` can't silently leave a pair unlabelled.

| Field | Required | Meaning |
|---|---|---|
| `recommendation` | yes | `proceed`, `review` or `reject` (see below). `null` = not labelled yet. |
| `score` | recommended | 0–100, how well the CV matches the job's requirements (anchors below). Needed for the Spearman correlation. |
| `labeller` | yes, once labelled | Name or initials of the person who labelled. |
| `labelledAt` | recommended | Date, `YYYY-MM-DD`. |
| `notes` | optional | One sentence on why. Useful when two people disagree later. |

The bench refuses a file where a pair has a score but no recommendation, a recommendation without a
labeller, or a value outside the allowed set.

## Recommendation

Answer the question: *as the recruiter on this vacancy, what would I do with this CV?*

- **proceed**: invite to the next stage. The must-have requirements are met, or clearly close
  enough.
- **review**: borderline. Some must-haves are missing or can't be judged from the CV, but the
  candidate is plausible and a closer human look is warranted.
- **reject**: would not move forward. There are clear gaps in the must-haves, or it's the wrong
  profile for the role.

## Score anchors

| Score | Meaning |
|---|---|
| 90–100 | Every requirement met, with clear evidence and extras. |
| 70–89 | Every must-have met; minor gaps. |
| 50–69 | Most requirements met; one or two important gaps or unclear points. |
| 25–49 | Some overlap, but several must-haves are missing. |
| 0–24 | Little or no relevant overlap. |

The production prompt maps its own score to a recommendation (>70 proceed, 50–70 review, <50 reject;
`api/src/llm/tasks/ai-screening/ai-screening.task.ts`). **Don't apply that rule to your labels.** Give
the recommendation you would actually make and the score you actually think. Whether the model's
fixed thresholds agree with human judgment is one of the things the bench measures.

## Edge cases

- **CV in another language** (e.g. `cv-15`, Ukrainian): judge the content as you would in English.
- **Very short or vague CV** (e.g. `cv-12`): judge only what is written. Missing evidence counts as
  missing.
- **Adjacent profile** (a DevOps engineer applying for backend, a Java lead for Node.js): judge
  against the stated requirements, not the candidate's general seniority.

## Adding data

- New CVs go into `data/cvs/<id>.txt` as plain text. Use only **synthetic or fully anonymised** CVs:
  remove names, contacts, employers, links and any detail that could identify a person. Never export
  candidates from the HireFlow database (production or local).
- New jobs go into `data/jobs.json`. `requirements` is one requirement per line, the way the
  application stores it.
- A pair exists only if it has an entry in `labels.json`, labelled or not.
- To keep a larger or private dataset outside the repo, use the same layout in another directory and
  pass `--dataset <dir>`.
