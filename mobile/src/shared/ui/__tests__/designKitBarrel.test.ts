import * as sharedUi from '../index';

describe('MOB-FEAT-057 API pública de shared/ui', () => {
    it('AC-015 exporta as primitivas novas pelo barrel', () => {
        const exported = Object.keys(sharedUi);

        expect(exported).toEqual(
            expect.arrayContaining([
                'ActionSheet',
                'BottomSheet',
                'ConfirmSheet',
                'ListSkeleton',
                'LoadingBlock',
                'SectionAction',
                'SectionHeader',
                'StateView',
                'TextAction',
            ]),
        );
    });

    it('AC-015 mantém exportadas as primitivas existentes que a fundação ajustou', () => {
        expect(Object.keys(sharedUi)).toEqual(
            expect.arrayContaining(['ChoiceGroup', 'EmptyState', 'ListRow', 'RangeSlider', 'SegmentedControl', 'SelectField', 'StatusMessage', 'SwatchPicker']),
        );
    });
});
