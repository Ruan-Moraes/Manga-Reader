import { expect, it } from 'vitest';

import { APP_LINKS } from '../appLinks';

it('links to the application site for terms, privacy, and cookies', () => {
    expect(APP_LINKS.terms).toBe('https://toonlira-rm.web.app/legal/terms');
    expect(APP_LINKS.privacy).toBe('https://toonlira-rm.web.app/legal/privacy');
    expect(APP_LINKS.cookies).toBe('https://toonlira-rm.web.app/legal/privacy#cookies');
});
