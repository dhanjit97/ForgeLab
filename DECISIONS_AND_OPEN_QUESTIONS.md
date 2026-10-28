# Decisions and Open Questions

## Decisions already fixed by product owner

-   Product: public programming learning platform.
-   Languages: C, C++, Rust, Python.
-   Platform: web.
-   Code execution: sandboxed.
-   Audience: public, with registered-user progress.
-   AI: optional, not a dependency for core learning.
-   Core areas: learning paths, Code Lab, snippets, engineering guides,
    project/system-design tracks.

## Decisions required before implementation

1.  **Sandbox provider/runtime:** select based on actual threat model,
    operating system, hosting restrictions, cost, and team expertise.
    Compare microVM/specialized sandbox platforms and hardened container
    options. Document limitations.
2.  **Hosting and budget:** region, expected users, monthly budget, and
    scaling expectations.
3.  **Authentication:** managed provider vs self-hosted identity.
4.  **Anonymous execution:** recommended disabled at first or strict
    demo-only quota; authenticated users receive bounded quotas.
5.  **Runtime versions:** decide pinned supported versions and update
    cadence.
6.  **Content licensing:** original content, permissively licensed
    references, attribution rules.
7.  **AI provider and data policy:** explicit consent, retention, and
    whether user source is sent externally.
8.  **Retention:** source/output/job metadata retention periods.
9.  **Moderation:** required before public user-submitted snippets or
    comments.
10. **Domain/product name:** ForgeLab is a working name and should be
    checked before public branding.

## Recommended defaults

-   Start with repository-managed content, not a full CMS.
-   Start with one isolated language profile as a security spike.
-   Do not permit runtime package installation or arbitrary network
    access.
-   Require login for saved progress and private snippets.
-   Make anonymous execution disabled initially until abuse controls are
    validated.
-   Keep AI disabled by default or explicitly opt-in.
-   Keep the API and execution workers in separate deployment/network
    boundaries.
-   Launch with limited traffic and clear quotas before scaling.
