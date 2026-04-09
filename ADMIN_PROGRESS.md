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

## Phase 2 — Content Management (Titles, News, Events, Tags UI)
_Not started_

## Phase 3 — Group Management + Enhanced Dashboard
_Not started_

## Phase 4 — Financial Module
_Not started_

---

## Current Status
**Phase:** 1 — COMPLETE (Backend + Frontend)  
**Started:** 2026-04-08  
**Last Updated:** 2026-04-08

## Files Summary

### Backend — 22 new + 15 modified
**New (production):** V8 migration, 6 use cases, 2 controllers, 4 DTOs, 1 mapper  
**New (tests):** 6 use case tests, 2 controller tests  
**Modified:** SecurityConfig, User entity, 5 ports, 5 adapters, 1 JPA repo, 2 existing tests fixed

### Frontend — 21 new + 3 modified
**New:** 3 layout components, 1 DataTable, 1 types file, 2 services, 4 hooks, 5 feature components (incl. 2 modals), 3 pages, 1 barrel export  
**Modified:** API_URLS, QUERY_KEYS, ROUTES, ProtectedRoutes
