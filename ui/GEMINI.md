## Role & Boundaries:

You are responsible for the React frontend of HireFlow. Your scope is everything inside ui/. You do not modify API code, database schemas, or Docker configs. When you need data from the backend, you work through the services/ layer — never call fetch/axios directly from components.

## Tech Stack:

- ToolPurposeReact (JSX)UI frameworkViteBuild tool & dev serverReact RouterClient-side routingESLintLinting (ui/eslint.config.js)CSS (plain)Styling via App.css / index.css

- Mantine v7

- For state manager we use Zustand.

## Folder Structure:

```bash
ui/src/
├── features/        # Feature-based modules (auth, jobs, applications, etc.)
│   └── <feature>/
│       ├── components/   # UI components scoped to this feature
│       ├── hooks/        # Custom hooks for this feature
│       └── index.js      # Public exports from this feature
├── pages/           # Route-level page components (thin wrappers)
├── services/        # API communication layer (one file per domain)
├── App.jsx          # Root component, router setup
├── App.css          # Global + app-level styles
├── index.css        # CSS reset / base styles
└── main.jsx         # Vite entry point
```

## Rules:

- Pages are thin — they compose features, they don't contain business logic
- Business logic lives in features/<name>/hooks/
- API calls live exclusively in services/ — never inside components or hooks directly
- Shared/reusable components that span multiple features go in features/shared/ or a top-level components/ directory if one is created

## Component Patterns

- Functional Components Only
  jsx// Good

```bash
export function JobCard({ title, company, location }) {
  return (
    <div className="job-card">
      <h3>{title}</h3>
      <p>{company} · {location}</p>
    </div>
  );
}

// Bad — class components
export class JobCard extends React.Component { ... }
```

## Props:

- Destructure props in the function signature
- Use default values inline, not defaultProps
- Keep prop lists short — if a component takes more than 6 props, consider splitting it

## Conditional Rendering:

jsx// Good — early return for loading/error states

```bash
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
return <JobList jobs={jobs} />;

// Avoid deeply nested ternaries in JSX
```

## Custom Hooks

- All data-fetching and side-effect logic belongs in a custom hook:
  jsx// features/jobs/hooks/useJobs.js

```bash
import { useState, useEffect } from 'react';
import { JobsService } from '../../../services/JobsService';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    JobsService.getAll()
      .then(setJobs)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { jobs, isLoading, error };
}
```

## Hook rules:

- One hook per concern
- Always handle loading and error states
- Return plain objects { data, isLoading, error } — not arrays (except for state pairs)

## Services Layer:

- Each domain has one service file. Services are plain objects — not classes:
  js// services/JobsService.js

```bash
import { apiClient } from './AxiosService';

export const JobsService = {
  getAll: () => apiClient.get('/jobs'),
  getById: (id) => apiClient.get(`/jobs/${id}`),
  create: (data) => apiClient.post('/jobs', data),
  update: (id, data) => apiClient.patch(`/jobs/${id}`, data),
  delete: (id) => apiClient.delete(`/jobs/${id}`),
};
```

- The apiClient handles base URL, auth headers, and token refresh — never replicate that logic in individual services.

## State Management:

- State typeWhere it livesServer data (fetched)Custom hook (useX)UI state (open/closed, active tab)useState in the component that owns itShared UI state (current user, auth)React Context (features/auth/context)Form stateLocal useState or a form library if adopted
- Do not lift state higher than necessary. Colocate state with the component that needs it first.

## Naming Conventions:

- ThingConventionExampleComponentsPascalCaseJobCard, ApplicationFormHooksuse prefix, camelCaseuseJobs, useCurrentUserServicesPascalCase + Service.jsJobsService.jsCSS classeskebab-casejob-card, form-field--errorFiles (components)PascalCase .jsxJobCard.jsxFiles (hooks/utils)camelCase .jsuseJobs.js, authUtils.js

## Styling Rules:

- Use Mantine default styles
- You can add theme inside main.jsx for more customization

## Routing:

- Routes are defined in App.jsx
- Use React Router's <Routes> and <Route>
- Protected routes wrap children with an auth check component
- Use useNavigate for programmatic navigation, not window.location

## Do's and Don'ts:

- Do:
  Keep components small and focused
  Handle all three states: loading, error, success
  Use Mantine v7 tags
  Add key props with stable IDs, never array indices
  Validate user input before sending to the API

- Don't:
  Don't call fetch or axios directly in components
  Don't store sensitive data (tokens) in localStorage without reviewing the auth service first
  Don't use dangerouslySetInnerHTML without explicit sanitization
  Don't introduce a new state management library without team discussion
  Don't create deeply nested component trees — flatten with composition
