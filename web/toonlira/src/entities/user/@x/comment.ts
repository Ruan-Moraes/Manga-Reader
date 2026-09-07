// Cross-import slice (FSD @x): exposes the user entity's public API to the
// comment entity. Entities must not import each other directly — comment reaches
// user only through this surface.
export * from '..';
