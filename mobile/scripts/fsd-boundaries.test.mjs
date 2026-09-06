import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';

import { validateFsdBoundaries } from './fsd-boundaries.mjs';

function fixture(files) {
    const root = mkdtempSync(resolve(tmpdir(), 'mobile-fsd-'));
    const paths = Object.entries(files).map(([path, content]) => {
        const absolute = resolve(root, path);
        mkdirSync(resolve(absolute, '..'), { recursive: true });
        writeFileSync(absolute, content);
        return absolute;
    });
    return validateFsdBoundaries({ mobileRoot: root, files: paths });
}

test('aceita fluxo descendente e API pública', () => {
    assert.deepEqual(fixture({ 'src/pages/home/ui/Home.tsx': "import { User } from '@/entities/user';\n" }), []);
});

test('rejeita inversão, import horizontal e deep import', () => {
    const errors = fixture({
        'src/entities/user/model/user.ts': "import { signIn } from '@/features/authenticate';\n",
        'src/features/one/model/one.ts': "import { two } from '@/features/two';\n",
        'src/pages/home/ui/Home.tsx': "import { User } from '@/entities/user/model/user';\n",
    });
    assert.ok(errors.some(error => error.includes('import invertido')));
    assert.ok(errors.some(error => error.includes('import horizontal')));
    assert.ok(errors.some(error => error.includes('deep import')));
});

test('inclui src/application como camada app local', () => {
    assert.deepEqual(fixture({ 'src/application/Root.tsx': "import { HomePage } from '@/pages/home';\n" }), []);
});

test('inclui src/app como casca de rota da camada superior', () => {
    assert.deepEqual(fixture({ 'src/app/index.tsx': "import { RootApplication } from '@/application';\n" }), []);
});

test('aceita cross-reference explícita entre entities', () => {
    assert.deepEqual(fixture({ 'src/entities/session/model/session.ts': "import type { User } from '@/entities/user/@x/session';\n" }), []);
});

test('aplica as mesmas regras a imports relativos e arquivos de teste', () => {
    const errors = fixture({
        'src/features/one/model/__tests__/one.test.ts': "import { two } from '../../../two';\n",
        'src/features/two/index.ts': 'export const two = 2;\n',
    });
    assert.ok(errors.some(error => error.includes('import horizontal')));
});
