import { axe, type JestAxeConfigureOptions } from 'jest-axe';

/**
 * Runs axe-core against a component-scoped render.
 *
 * The `region` (landmark) best-practice rule is disabled here because these
 * tests render individual components/pages in isolation, outside the app's full
 * landmark shell (header/nav/main/footer). The rule would flag content that is
 * correctly wrapped once mounted under the real layout — a test-harness
 * artifact, not a defect.
 */
const COMPONENT_AXE_OPTIONS: JestAxeConfigureOptions = {
    rules: {
        region: { enabled: false },
    },
};

export const axeComponent = (container: Element) => axe(container, COMPONENT_AXE_OPTIONS);
