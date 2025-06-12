Okay, let's dive into a suggested build process for **PB Court Hub**, focusing on the MVP. This will be a step-by-step approach, keeping in mind your tech stack and the goal of getting a functional, data-centric application up.

**Guiding Principles for the Build:**

*   **Iterative Development:** Build in small, testable chunks.
*   **Backend First (for Data-Centric Apps):** Get your data models and core backend logic for managing that data in place early. Convex makes this quite integrated.
*   **Admin Focus for Data Integrity:** Since "solid data" is key, enabling admin functionality to manage data is a high priority.
*   **Core User Value:** Then, build the primary user-facing features.
*   **TypeScript Throughout:** Leverage TypeScript from the start for type safety.
*   **Version Control:** Use Git from the very beginning. Commit frequently.

---

**Phase 0: Project Setup & Foundation**

1.  **Initialize Next.js Project:**
    *   `npx create-next-app@latest pb-court-hub --typescript --tailwind --eslint`
    *   Choose "App Router."
    *   Navigate into the `pb-court-hub` directory.

2.  **Initialize Convex:**
    *   `npx convex dev` (This will guide you through creating a Convex project and linking it).
    *   Follow the prompts to install the `convex` client library.
    *   This sets up your `convex/` directory for schemas, functions, etc.

3.  **Basic Project Structure & Configuration:**
    *   Review the default Next.js App Router structure (`app/` directory).
    *   Configure Tailwind CSS (`tailwind.config.ts`, `globals.css`) if you have initial thoughts on base styles or your neo-brutalist color palette.
    *   Set up Git: `git init`, `git add .`, `git commit -m "Initial project setup with Next.js and Convex"`

---

**Phase 1: Backend Core - Convex Schemas & Admin Data Management**

*(Focus: Getting the data structures right and enabling admins to manage court data).*

1.  **Define Convex Schemas (`convex/schema.ts`):**
    *   **`courts` table:**
        *   `name: v.string()`
        *   `addressStreet: v.string()`
        *   `addressCity: v.string()`
        *   `addressState: v.string()`
        *   `addressZip: v.string()`
        *   `numCourts: v.number()` (simple count for MVP)
        *   `courtType: v.union(v.literal("indoor"), v.literal("outdoor"), v.literal("mixed"), v.literal("unknown"))` (or similar)
        *   `cost: v.union(v.literal("free"), v.literal("paid"), v.literal("unknown"))`
        *   `costNotes: v.optional(v.string())` (for brief admin notes on "paid")
        *   `adminNotes: v.optional(v.string())` (for complex configurations or internal admin notes)
        *   `status: v.union(v.literal("approved"), v.literal("pending"), v.literal("rejected"))` (default to "pending" for submissions, "approved" for admin-added)
        *   `submittedBy: v.optional(v.id("users"))`
        *   `lastVerifiedAt: v.number()` (Convex uses numbers for timestamps; store `Date.now()`)
        *   *(Consider adding `createdAt` and `updatedAt` timestamps automatically if Convex doesn't do it by default for all tables, or add them manually)*
    *   **`users` table:** (Convex Auth might handle much of this, but define if you need custom fields)
        *   `email: v.string()` (if using email/pass)
        *   `isAdmin: v.optional(v.boolean())` (simple admin flag for MVP)
        *   Other fields as needed by Convex Auth or your requirements.
    *   Run `npx convex dev` to push schema changes.

2.  **Implement Convex Authentication:**
    *   Follow Convex docs to set up your chosen auth provider (e.g., email/password, social logins).
    *   Create basic sign-up, login, and logout functionality. This will be used for both admins and users.

3.  **Admin Backend Logic (Convex Functions in `convex/courts.ts` or similar):**
    *   `addCourt(ctx, args)`: Takes court details, sets `status: "approved"`, `lastVerifiedAt: Date.now()`. *Protected: only admins can call.*
    *   `updateCourt(ctx, args)`: Takes court ID and new details, updates `lastVerifiedAt: Date.now()`. *Protected: only admins.*
    *   `deleteCourt(ctx, { id })`: Deletes a court. *Protected: only admins.*
    *   `listAllCourts(ctx)`: Returns all courts for admin view. *Protected: only admins.*
    *   `getPendingSubmissions(ctx)`: Returns courts with `status: "pending"`. *Protected: only admins.*
    *   `approveSubmission(ctx, { id, edits })`: Changes status to "approved", applies edits, sets `lastVerifiedAt`. *Protected: only admins.*
    *   `rejectSubmission(ctx, { id })`: Changes status to "rejected". *Protected: only admins.*
    *   **Security Rules:** Implement Convex security rules to ensure only authenticated users with `isAdmin: true` can call these admin functions.

4.  **Basic Admin Panel UI (Next.js - create an `/admin` route group):**
    *   **Admin Login:** Reuse/adapt the auth components. Protect admin routes.
    *   **Court List Page (`/admin/courts`):**
        *   Display all courts (from `listAllCourts`).
        *   Link to add new court, edit, delete.
    *   **Add/Edit Court Form (`/admin/courts/new`, `/admin/courts/[id]/edit`):**
        *   Form fields matching the schema.
        *   Connects to `addCourt` and `updateCourt` Convex functions.
    *   **Submission Review Page (`/admin/submissions`):**
        *   Display pending submissions (from `getPendingSubmissions`).
        *   Buttons to approve (potentially with an edit modal) or reject.

---

**Phase 2: Core User-Facing Features - Search & Display**

*(Focus: Allowing users to find and view courts).*

1.  **Public Backend Logic (Convex Functions):**
    *   `searchCourts(ctx, { city, state, zip })`:
        *   Queries the `courts` table for `status: "approved"`.
        *   Filters by city, state, zip (handle cases where some are provided but not others).
        *   Returns a list of matching courts.

2.  **Search UI (Next.js - likely on the homepage `/`):**
    *   Input fields for City, State, Zip.
    *   Search button.
    *   On submit, calls the `searchCourts` Convex function.

3.  **Search Results Display (Next.js):**
    *   Component to list courts returned from the search.
    *   Display key info: Name, Address, Num Courts, Type, Cost.
    *   Link each court to a detail page.
    *   **"No Results Found" State:** Implement clear messaging.

4.  **Court Detail Page (Next.js - `app/courts/[id]/page.tsx`):**
    *   Fetches details for a single approved court by ID using a Convex query.
    *   Displays all relevant public information for that court.

---

**Phase 3: User Contributions**

*(Focus: Allowing authenticated users to submit new courts).*

1.  **User Authentication UI (if not fully completed in Phase 1):**
    *   Ensure smooth sign-up, login, logout flows for regular users.
    *   UI to show user's authentication state.

2.  **User Court Submission Form (Next.js - e.g., `/submit-court`):**
    *   Protected route: only authenticated users can access.
    *   Form fields: Court Name, Full Address, Number of Courts, Indoor/Outdoor Type, Cost to Play.
    *   On submit, calls a new Convex function:
        *   `submitNewCourt(ctx, args)`:
            *   Takes court details from the user.
            *   Saves to `courts` table with `status: "pending"`.
            *   Sets `submittedBy` to the current user's ID.
            *   Sets `lastVerifiedAt` (or maybe `submittedAt` initially).

---

**Phase 4: Foundational Elements, Polish & Testing**

*(Focus: Implementing cross-cutting concerns and refining the MVP).*

1.  **Accessibility (a11y):**
    *   Go through all components and pages.
    *   Check color contrast (Tailwind makes this easier if you define a good palette).
    *   Ensure keyboard navigability.
    *   Use semantic HTML. Add ARIA attributes where necessary.
    *   Test with screen reader basics if possible.

2.  **Error Handling & User Feedback:**
    *   Implement consistent loading states for data fetching.
    *   Ensure all form submissions have clear success/error feedback.
    *   Handle API errors gracefully (e.g., if a Convex function fails).

3.  **Basic Analytics Hooks:**
    *   Identify key user actions (e.g., `search_performed`, `court_viewed`, `court_submitted`).
    *   Add simple function calls in your React components or Convex functions to log these (e.g., `console.log("ANALYTICS: search_performed", { query })` for now). This makes it easy to integrate a real analytics tool later.

4.  **Styling Refinement (Neo-Brutalism):**
    *   Apply your chosen neo-brutalist design principles consistently using Tailwind CSS.
    *   Focus on typography, color, layout, and component styling.

5.  **End-to-End Testing:**
    *   Manually test all user flows:
        *   Admin: Login, add/edit/delete court, view/approve/reject submission.
        *   User: Register, login, search for courts, view court details, submit a new court, logout.
    *   Test on different browsers (if feasible) and screen sizes (responsive design).

6.  **Code Review & Cleanup:**
    *   Refactor code for clarity and maintainability.
    *   Remove unused code or console logs (except analytics stubs).

---

**Phase 5: MVP Deployment**

1.  **Choose Hosting:**
    *   **Vercel:** Excellent for Next.js applications. Integrates well.
    *   **Convex Deployment:** Convex has its own deployment process (`npx convex deploy`).
2.  **Configure Environment Variables:**
    *   Ensure your Convex deployment URL (`CONVEX_URL`) is set correctly for your Next.js production environment.
    *   Any other API keys or secrets.
3.  **Deploy:**
    *   Push your code to Git.
    *   Connect your Git repository to Vercel for continuous deployment.
    *   Run `npx convex deploy` for your backend.
4.  **Initial Data Seeding:**
    *   Once deployed, an admin needs to log in and start populating the database with initial verified courts.

---

**Where to Start Specifically:**

1.  **Day 1-3: Setup & Convex Basics**
    *   Project Init (Next.js, Convex, Git).
    *   Define `courts` and `users` schemas in `convex/schema.ts`.
    *   Set up basic Convex Authentication.
    *   Create the Convex function for an admin to `addCourt`.
    *   Build the most basic Next.js page with a form for an admin to add a court (no styling yet, just functionality). *Manually set a user as admin in your Convex dashboard for now to test.*

This phased approach should provide a clear path. Remember to consult the Next.js and Convex documentation frequently! Good luck!