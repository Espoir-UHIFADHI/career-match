# Future Improvements & Tech Debt

## Security & Infrastructure
- [ ] **Migrate API Calls to Backend (Supabase Edge Functions)**
  - **Context**: Currently, `gemini.ts` and `serper.ts` call APIs directly from the frontend using `VITE_` keys, which exposes them to the browser.
  - **Goal**: Create Supabase Edge Functions (`gemini-api`, `serper-api`) to proxy these requests.
  - **Action Items**:
    - Create `gemini-api` Edge Function (Logic for Parsing, Matching, Networking messages).
    - Create `serper-api` Edge Function (Search proxy).
    - Refactor frontend services to use `supabase.functions.invoke()`.
    - Move API keys from `VITE_` variables to Supabase Secrets.
