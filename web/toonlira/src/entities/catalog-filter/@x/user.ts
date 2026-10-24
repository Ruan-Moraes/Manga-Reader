// Cross-import slice (FSD @x): exposes the catalog-filter entity's public API to
// the user entity (favorite-genres selection). Entities must not import each
// other directly — user reaches catalog-filter only through this surface.
export * from '..';
