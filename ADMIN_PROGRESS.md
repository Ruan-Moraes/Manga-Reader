# Admin Area — Implementation Progress

## Phase 1 — MVP: Security + User Management + Basic Dashboard

### 1.1 Security Fix (RBAC) ✓
- [x] Fix `SecurityConfig`: `hasAuthority("ADMIN")` -> `hasRole("ADMIN")` for tags
- [x] Add `/api/admin/**` wildcard rule with `hasRole("ADMIN")`
- [x] Add `@EnableMethodSecurity`
- [x] Fix `AuthSecurityIntegrationTest` — 2 pre-existing failures now pass (500→401)

### 1.2 User Management (Backend) ✓
- [x] `V8__user_add_ban_fields.sql` — migration for ban fields
- [x] `User.java` — add banned, bannedAt, bannedReason, bannedUntil
- [x] `UserRepositoryPort` — add findAll, searchByNameOrEmail, count, countByRole, countByBannedTrue
- [x] `UserJpaRepository` — add search query, count methods
- [x] `UserRepositoryAdapter` — implement new port methods
- [x] `ListUsersUseCase` — paginated listing with optional search
- [x] `GetUserDetailsUseCase` — admin detail view with @Transactional(readOnly)
- [x] `ChangeUserRoleUseCase` — promote/demote (cannot change own role)
- [x] `BanUserUseCase` — ban with reason and optional duration (cannot ban ADMIN)
- [x] `UnbanUserUseCase` — remove ban
- [x] `AdminUserController` — 5 endpoints under /api/admin/users
- [x] `AdminUserResponse`, `ChangeRoleRequest`, `BanUserRequest` — DTOs
- [x] `AdminUserMapper` — static final class mapper

### 1.3 Dashboard Metrics (Backend) ✓
- [x] `TitleRepositoryPort` + adapter — add `count()`
- [x] `NewsRepositoryPort` + adapter — add `count()`
- [x] `GroupRepositoryPort` + adapter — add `count()`
- [x] `EventRepositoryPort` + adapter — add `count()`
- [x] `GetDashboardMetricsUseCase` — aggregate counts from multiple ports
- [x] `AdminDashboardController` — GET /api/admin/dashboard/metrics
- [x] `DashboardMetricsResponse` — DTO

### 1.4 Tests (Backend) ✓ — 837 tests, 0 failures, 0 errors
- [x] `UserTest` — ban field defaults (1 new test)
- [x] `ListUsersUseCaseTest` (4 tests)
- [x] `GetUserDetailsUseCaseTest` (2 tests)
- [x] `ChangeUserRoleUseCaseTest` (4 tests)
- [x] `BanUserUseCaseTest` (6 tests)
- [x] `UnbanUserUseCaseTest` (3 tests)
- [x] `GetDashboardMetricsUseCaseTest` (2 tests)
- [x] `AdminUserControllerTest` (7 tests)
- [x] `AdminDashboardControllerTest` (1 test)
- [x] `mvn test` — 837 tests, 0 failures, 0 errors

### 1.5 Frontend ✓
- [x] `AdminLayout` — flex layout with sidebar + content area
- [x] `AdminSidebar` — NavLink-based sidebar with 8 links (icons via react-icons)
- [x] `AdminHeader` — minimal header with "Voltar ao site" + user info
- [x] `ProtectedRoutes` — restructured dashboard route with AdminLayout + nested children
- [x] `DataTable` — generic reusable table (columns, pagination, loading/empty states, row click)
- [x] `admin.types.ts` — AdminUser, DashboardMetrics, BanUserRequest, ChangeRoleRequest
- [x] `adminUserService.ts` — getAdminUsers, getAdminUserDetail, changeUserRole, banUser, unbanUser
- [x] `adminDashboardService.ts` — getDashboardMetrics
- [x] `useAdminUsers` — React Query hook with search + pagination
- [x] `useAdminUserDetail` — React Query hook for single user
- [x] `useAdminUserActions` — mutations (ban/unban/role) with query invalidation + toasts
- [x] `useDashboardMetrics` — React Query hook with staleTime
- [x] `AdminDashboardOverview` — metric cards grid + role distribution
- [x] `AdminUserList` — DataTable with role/status badges, row click navigation
- [x] `AdminUserDetail` — full user detail with ban info, action buttons
- [x] `BanUserModal` — ban form (reason + duration)
- [x] `ChangeRoleModal` — role selector with radio buttons
- [x] `DashboardOverview` — page component with loading/error states
- [x] `DashboardUsers` — page with search bar + user table
- [x] `DashboardUserDetail` — page with back button + user detail
- [x] `feature/admin/index.ts` — barrel export
- [x] `API_URLS` — ADMIN_USERS, ADMIN_DASHBOARD_METRICS
- [x] `QUERY_KEYS` — ADMIN_USERS, ADMIN_USER_DETAIL, ADMIN_DASHBOARD_METRICS
- [x] `ROUTES` — DASHBOARD, DASHBOARD_USERS, DASHBOARD_USER_DETAIL
- [x] `npx tsc --noEmit` — 0 errors (build errors are all pre-existing)

---

## Phase 2 — Content Management (Titles, News, Events) ✓

### 2.1 Title CRUD (Backend) ✓
- [x] `CreateTitleUseCase` — create title with all fields
- [x] `UpdateTitleUseCase` — partial update (null-safe per field)
- [x] `DeleteTitleUseCase` — verify existence then delete
- [x] `AdminTitleController` — 5 endpoints: GET list, GET detail, POST, PATCH, DELETE
- [x] `AdminTitleResponse`, `CreateTitleRequest`, `UpdateTitleRequest` — DTOs
- [x] `AdminTitleMapper` — static final class mapper

### 2.2 News CRUD (Backend) ✓
- [x] `CreateNewsUseCase` — create news with category, author, tags
- [x] `UpdateNewsUseCase` — partial update (null-safe per field)
- [x] `DeleteNewsUseCase` — verify existence then delete
- [x] `AdminNewsController` — 5 endpoints: GET list, GET detail, POST, PATCH, DELETE
- [x] `AdminNewsResponse`, `CreateNewsRequest`, `UpdateNewsRequest` — DTOs
- [x] `AdminNewsMapper` — static final class mapper

### 2.3 Event CRUD (Backend) ✓
- [x] `CreateEventUseCase` — create event with location, organizer, schedule (@Transactional)
- [x] `UpdateEventUseCase` — partial update with embedded VOs (@Transactional)
- [x] `DeleteEventUseCase` — verify existence then delete (@Transactional)
- [x] `AdminEventController` — 5 endpoints: GET list, GET detail, POST, PATCH, DELETE
- [x] `AdminEventResponse`, `CreateEventRequest`, `UpdateEventRequest` — DTOs
- [x] `AdminEventMapper` — static final class mapper
- [x] `EventRepositoryPort` — add `searchByTitle(query, pageable)`
- [x] `EventJpaRepository` — add `findByTitleContainingIgnoreCase`
- [x] `EventRepositoryAdapter` — implement searchByTitle

### 2.4 Tests (Backend) ✓ — 873 tests, 0 failures, 0 errors
- [x] `CreateTitleUseCaseTest` (2 tests)
- [x] `UpdateTitleUseCaseTest` (3 tests)
- [x] `DeleteTitleUseCaseTest` (2 tests)
- [x] `CreateNewsUseCaseTest` (2 tests)
- [x] `UpdateNewsUseCaseTest` (2 tests)
- [x] `DeleteNewsUseCaseTest` (2 tests)
- [x] `CreateEventUseCaseTest` (2 tests)
- [x] `UpdateEventUseCaseTest` (3 tests)
- [x] `DeleteEventUseCaseTest` (2 tests)
- [x] `AdminTitleControllerTest` (6 tests)
- [x] `AdminNewsControllerTest` (5 tests)
- [x] `AdminEventControllerTest` (5 tests)
- [x] `mvn test` — 873 tests, 0 failures, 0 errors

### 2.5 Frontend ✓
- [x] `admin.types.ts` — AdminTitle, AdminNews, AdminEvent + Create/Update request types
- [x] `adminTitleService.ts` — getAdminTitles, getAdminTitleDetail, createTitle, updateTitle, deleteTitle
- [x] `adminNewsService.ts` — getAdminNews, getAdminNewsDetail, createNews, updateNews, deleteNews
- [x] `adminEventService.ts` — getAdminEvents, getAdminEventDetail, createEvent, updateEvent, deleteEvent
- [x] `useAdminTitles` — React Query hook with search + pagination
- [x] `useAdminTitleActions` — mutations (create/update/delete) with query invalidation + toasts
- [x] `useAdminNews` — React Query hook with search + pagination
- [x] `useAdminNewsActions` — mutations (create/update/delete) with query invalidation + toasts
- [x] `useAdminEvents` — React Query hook with search + pagination
- [x] `useAdminEventActions` — mutations (create/update/delete) with query invalidation + toasts
- [x] `AdminTitleList` — DataTable with type badges, row click to edit
- [x] `AdminNewsList` — DataTable with category badges, featured indicator
- [x] `AdminEventList` — DataTable with status badges, location/online
- [x] `DashboardTitles` — list page with search + "Novo" button
- [x] `DashboardTitleForm` — create/edit form (reused via route params)
- [x] `DashboardNews` — list page with search + "Nova" button
- [x] `DashboardNewsForm` — create/edit form with category selector
- [x] `DashboardEvents` — list page with search + "Novo" button
- [x] `DashboardEventForm` — create/edit form with timeline/status/type selectors
- [x] `ProtectedRoutes` — 9 new nested routes (titles, news, events: list/new/edit)
- [x] `feature/admin/index.ts` — barrel export updated with all new types, hooks, components
- [x] `API_URLS` — ADMIN_TITLES, ADMIN_NEWS, ADMIN_EVENTS
- [x] `QUERY_KEYS` — ADMIN_TITLES, ADMIN_TITLE_DETAIL, ADMIN_NEWS, ADMIN_NEWS_DETAIL, ADMIN_EVENTS, ADMIN_EVENT_DETAIL
- [x] `ROUTES` — DASHBOARD_TITLES, DASHBOARD_TITLE_FORM, DASHBOARD_TITLE_EDIT, DASHBOARD_NEWS, DASHBOARD_NEWS_FORM, DASHBOARD_NEWS_EDIT, DASHBOARD_EVENTS, DASHBOARD_EVENT_FORM, DASHBOARD_EVENT_EDIT
- [x] `npx tsc --noEmit` — 0 errors

---

## Phase 3 — Group Management ✓

### 3.1 Group Admin CRUD (Backend) ✓
- [x] `GroupRepositoryPort` — add `searchByName(query, pageable)`
- [x] `GroupJpaRepository` — add `findByNameContainingIgnoreCase`
- [x] `GroupRepositoryAdapter` — implement searchByName
- [x] `AdminListGroupsUseCase` — paginated listing with optional search by name
- [x] `AdminGetGroupDetailsUseCase` — detail with members loaded (@Transactional readOnly)
- [x] `AdminChangeGroupMemberRoleUseCase` — change member role (@Transactional)
- [x] `AdminRemoveGroupMemberUseCase` — remove member with orphanRemoval (@Transactional)
- [x] `AdminGroupController` — 4 endpoints: GET list, GET detail, PATCH role, DELETE member
- [x] `AdminGroupResponse` — DTO with nested GroupMemberResponse
- [x] `ChangeGroupMemberRoleRequest` — DTO
- [x] `AdminGroupMapper` — toResponse (list) + toDetailResponse (with members)

### 3.2 Enhanced Dashboard (Backend) ✓
- [x] `TitleRepositoryPort` — add `countByStatus(status)` and `findTopByRankingScore(limit)`
- [x] `TitleRepositoryAdapter` — implement via MongoTemplate (Criteria + Sort)
- [x] `EventRepositoryPort` — add `countByStatus(EventStatus)`
- [x] `EventJpaRepository` — add `countByStatus(EventStatus)` derived query
- [x] `EventRepositoryAdapter` — delegate to repository
- [x] `GetContentMetricsUseCase` — aggregate titles by 4 statuses + events by EventStatus + top 10 titles
- [x] `ContentMetricsResponse` — DTO with nested TopTitleResponse record
- [x] `AdminDashboardController` — GET /api/admin/dashboard/content-metrics

### 3.3 Tests (Backend) ✓ — 891 tests, 0 failures, 0 errors
- [x] `AdminListGroupsUseCaseTest` (3 tests)
- [x] `AdminGetGroupDetailsUseCaseTest` (2 tests)
- [x] `AdminChangeGroupMemberRoleUseCaseTest` (3 tests)
- [x] `AdminRemoveGroupMemberUseCaseTest` (3 tests)
- [x] `AdminGroupControllerTest` (4 tests)
- [x] `GetContentMetricsUseCaseTest` (2 tests)
- [x] `AdminDashboardControllerTest` — added content-metrics test
- [x] `mvn test` — 891 tests, 0 failures, 0 errors

### 3.4 Frontend ✓
- [x] `admin.types.ts` — AdminGroup, GroupMember, ChangeGroupMemberRoleRequest, TopTitle, ContentMetrics
- [x] `adminGroupService.ts` — getAdminGroups, getAdminGroupDetail, changeGroupMemberRole, removeGroupMember
- [x] `adminDashboardService.ts` — add `getContentMetrics`
- [x] `useAdminGroups` — React Query hook with search + pagination
- [x] `useAdminGroupDetail` — React Query hook for single group with members
- [x] `useAdminGroupActions` — mutations (changeRole/removeMember) with query invalidation + toasts
- [x] `useContentMetrics` — React Query hook with staleTime
- [x] `AdminGroupList` — DataTable with status badges, member count, row click to detail
- [x] `AdminGroupDetail` — full group detail with members table; uses `ChangeGroupRoleModal`
- [x] `ChangeGroupRoleModal` — BaseModal with 6 GROUP_ROLES (LIDER, TRADUTOR, REVISOR, QC, CLEANER, TYPESETTER)
- [x] `MetricsCard` — reusable metric card with icon + accent variants
- [x] `ContentMetricsPanel` — titles/events by status (StatusBar with %) + top 10 titles table
- [x] `DashboardGroups` — list page with search bar
- [x] `DashboardGroupDetail` — detail page with back button
- [x] `DashboardOverview` — extended to render `ContentMetricsPanel`
- [x] `ProtectedRoutes` — 2 new nested routes (groups list + detail)
- [x] `feature/admin/index.ts` — barrel export updated (new types, hooks, components)
- [x] `API_URLS` — ADMIN_GROUPS, ADMIN_DASHBOARD_CONTENT_METRICS
- [x] `QUERY_KEYS` — ADMIN_GROUPS, ADMIN_GROUP_DETAIL, ADMIN_DASHBOARD_CONTENT_METRICS
- [x] `ROUTES` — DASHBOARD_GROUPS, DASHBOARD_GROUP_DETAIL
- [x] `npx tsc --noEmit` — 0 errors

### 3.5 Bug Fixes ✓
- [x] **LazyInitializationException on GET /api/admin/groups (500 error)**: `AdminListGroupsUseCase` was missing `@Transactional`. The mapper accesses `group.getGroupUsers().size()` for `membersCount`, but the lazy collection cannot be loaded outside an active session. Fix: added `@Transactional(readOnly = true)` and forced collection init inside the method (`page.getContent().forEach(g -> g.getGroupUsers().size())`).

---

## Phase 4 — Financial Module ✓

### 4.1 Payment Domain (Backend) ✓
- [x] `V9__payment_create_tables.sql` — payments table + indexes (user_id, status, created_at)
- [x] `Payment.java` — JPA entity (id, userId, amount, currency, status, paymentMethod, description, referenceType, referenceId, paidAt, timestamps)
- [x] `PaymentStatus.java` — enum (PENDING, COMPLETED, FAILED, REFUNDED)

### 4.2 Persistence (Backend) ✓
- [x] `PaymentRepositoryPort` — findById, save, deleteById, findAll, findByStatus, count, countByStatus, sumAmountByStatus
- [x] `PaymentJpaRepository` — derived queries + JPQL `sumAmountByStatus`
- [x] `PaymentRepositoryAdapter` — wraps null sums to BigDecimal.ZERO

### 4.3 Use Cases (Backend) ✓
- [x] `ListPaymentsUseCase` — paginated listing with optional status filter (@Transactional readOnly)
- [x] `GetPaymentDetailsUseCase` — single payment with ResourceNotFoundException
- [x] `UpdatePaymentStatusUseCase` — sets paidAt automatically when transitioning to COMPLETED (@Transactional)
- [x] `GetFinancialSummaryUseCase` — aggregates totalPayments, totalRevenue, pendingRevenue, counts/amounts by status (record FinancialSummary)

### 4.4 Presentation (Backend) ✓
- [x] `AdminPaymentController` — 4 endpoints: GET list, GET summary, GET detail, PATCH status
- [x] `AdminPaymentResponse`, `UpdatePaymentStatusRequest`, `FinancialSummaryResponse` — DTOs
- [x] `AdminPaymentMapper` — static final class mapper (Payment → response, FinancialSummary → response)

### 4.5 Tests (Backend) ✓ — 905 tests, 0 failures, 0 errors
- [x] `ListPaymentsUseCaseTest` (2 tests)
- [x] `GetPaymentDetailsUseCaseTest` (2 tests)
- [x] `UpdatePaymentStatusUseCaseTest` (4 tests)
- [x] `GetFinancialSummaryUseCaseTest` (1 test)
- [x] `AdminPaymentControllerTest` (5 tests)
- [x] `mvn test` — 905 tests, 0 failures, 0 errors

### 4.6 Frontend ✓
- [x] `admin.types.ts` — AdminPayment, UpdatePaymentStatusRequest, FinancialSummary
- [x] `adminPaymentService.ts` — getAdminPayments, getAdminPaymentDetail, updatePaymentStatus, getFinancialSummary
- [x] `useAdminPayments` — React Query hook with status filter + pagination
- [x] `useFinancialSummary` — React Query hook with staleTime
- [x] `useAdminPaymentActions` — mutation handler (updateStatus) with toasts + invalidation
- [x] `AdminPaymentList` — DataTable with status badges, formatted currency, row click
- [x] `FinancialDashboard` — 3 metric cards (total/revenue/pending) + status distribution table
- [x] `UpdatePaymentStatusModal` — BaseModal with 4 PAYMENT_STATUSES radio buttons
- [x] `DashboardFinancial` — page combining summary, status filter, payment list, modal
- [x] `ProtectedRoutes` — new nested route `financial`
- [x] `AdminSidebar` — already had Financeiro link from Phase 1
- [x] `feature/admin/index.ts` — barrel export updated (new types, hooks, components)
- [x] `API_URLS` — ADMIN_PAYMENTS, ADMIN_PAYMENTS_SUMMARY
- [x] `QUERY_KEYS` — ADMIN_PAYMENTS, ADMIN_PAYMENT_DETAIL, ADMIN_FINANCIAL_SUMMARY
- [x] `ROUTES` — DASHBOARD_FINANCIAL
- [x] `npx tsc --noEmit` — 0 errors

---

## Current Status
**Phase:** 4 — COMPLETE (Backend + Frontend)  
**Started:** 2026-04-08  
**Last Updated:** 2026-04-10  
**Tests:** 905 backend, 0 failures, 0 errors  
**Frontend Build:** `npx tsc --noEmit` clean

## Files Summary

### Phase 1 — Backend: 22 new + 15 modified
**New (production):** V8 migration, 6 use cases, 2 controllers, 4 DTOs, 1 mapper  
**New (tests):** 6 use case tests, 2 controller tests  
**Modified:** SecurityConfig, User entity, 5 ports, 5 adapters, 1 JPA repo, 2 existing tests fixed

### Phase 1 — Frontend: 21 new + 3 modified
**New:** 3 layout components, 1 DataTable, 1 types file, 2 services, 4 hooks, 5 feature components (incl. 2 modals), 3 pages, 1 barrel export  
**Modified:** API_URLS, QUERY_KEYS, ROUTES, ProtectedRoutes

### Phase 2 — Backend: 18 new + 3 modified
**New (production):** 9 use cases (3 per domain), 3 controllers, 9 DTOs, 3 mappers  
**New (tests):** 9 use case tests, 3 controller tests (36 test methods total)  
**Modified:** EventRepositoryPort, EventJpaRepository, EventRepositoryAdapter (add searchByTitle)

### Phase 2 — Frontend: 15 new + 4 modified
**New:** 3 list components, 3 services, 6 hooks, 3 list pages, 3 form pages  
**Modified:** admin.types.ts, API_URLS, QUERY_KEYS, ROUTES, ProtectedRoutes, index.ts (barrel)

### Phase 3 — Backend: 11 new + 8 modified
**New (production):** 5 use cases (4 group + GetContentMetricsUseCase), 1 controller, 3 DTOs (incl. ContentMetricsResponse), 1 mapper  
**New (tests):** 5 use case tests, 1 controller test (17 test methods total)  
**Modified:** GroupRepositoryPort/JpaRepository/Adapter (searchByName), TitleRepositoryPort/Adapter (countByStatus + findTopByRankingScore), EventRepositoryPort/JpaRepository/Adapter (countByStatus), AdminDashboardController (content-metrics endpoint), AdminListGroupsUseCase (@Transactional fix)

### Phase 3 — Frontend: 12 new + 6 modified
**New:** 5 components (AdminGroupList, AdminGroupDetail, ChangeGroupRoleModal, MetricsCard, ContentMetricsPanel), 1 service (adminGroupService), 4 hooks (useAdminGroups, useAdminGroupDetail, useAdminGroupActions, useContentMetrics), 2 pages (DashboardGroups, DashboardGroupDetail)  
**Modified:** admin.types.ts, adminDashboardService.ts, API_URLS, QUERY_KEYS, ROUTES, ProtectedRoutes, DashboardOverview, index.ts (barrel)

### Phase 4 — Backend: 13 new + 0 modified (1 migration)
**New (production):** V9 migration, Payment entity, PaymentStatus enum, PaymentRepositoryPort, PaymentJpaRepository, PaymentRepositoryAdapter, 4 use cases, 1 controller, 3 DTOs, 1 mapper  
**New (tests):** 4 use case tests, 1 controller test (14 test methods total)  
**Modified:** none

### Phase 4 — Frontend: 9 new + 5 modified
**New:** 3 components (AdminPaymentList, FinancialDashboard, UpdatePaymentStatusModal), 1 service (adminPaymentService), 3 hooks (useAdminPayments, useFinancialSummary, useAdminPaymentActions), 1 page (DashboardFinancial)  
**Modified:** admin.types.ts, API_URLS, QUERY_KEYS, ROUTES, ProtectedRoutes, index.ts (barrel)
