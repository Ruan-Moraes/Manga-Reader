/**
 * Biblioteca centralizada de factories de teste.
 *
 * Cada factory exporta:
 * 1. `build*(overrides?)` — instancia padrao com counter incremental
 * 2. `*Presets` — cenarios nomeados (cobertura de enums + edge cases)
 * 3. `build*List(count?)` ou `build*Page(items?)` — helpers de bulk
 *
 * Convencao: datas fixas em ISO string para snapshots determinismos,
 * IDs unicos via counter local (sem dependencia de UUID).
 */

export * from './pageFactory';
export * from './titleFactory';
export * from './chapterFactory';
export * from './userFactory';
export * from './authFactory';
export * from './libraryFactory';
export * from './ratingFactory';
export * from './commentFactory';
export * from './groupFactory';
export * from './eventFactory';
export * from './newsFactory';
export * from './forumFactory';
export * from './storeFactory';

// Admin factories — disponiveis tanto direto (sem prefixo, todos com nome `Admin*`)
// quanto via namespace `admin.*` para clareza explicita.
export * from './admin';
export * as admin from './admin';
