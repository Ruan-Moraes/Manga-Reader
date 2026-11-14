// Cross-import slice (FSD @x): exposes the group entity's public API to the
// user entity (followed groups no perfil — DT-48). Entities must not import
// each other directly — user reaches group only through this surface.
export * from '..';
