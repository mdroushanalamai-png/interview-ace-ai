

## Problem

The `supabase.functions.invoke("elevenlabs-scribe-token")` call is failing with "failed to send to edge function" despite the edge function itself working perfectly (confirmed via direct test — returns a valid token). This is a client-side issue with the Supabase JS SDK's `functions.invoke` method in the preview/browser context.

## Plan

### 1. Replace `supabase.functions.invoke` with direct `fetch` in `SessionScreen.tsx`

Replace line 78:
```typescript
const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
```

With a direct fetch call:
```typescript
const res = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  }
);
if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
const data = await res.json();
```

Then check `data.token` as before.

### 2. Add better error logging

Add `console.error` with the full response text on failure so we can debug if it still fails.

This is a minimal, surgical fix — one file changed (`SessionScreen.tsx`), ~10 lines replaced.

