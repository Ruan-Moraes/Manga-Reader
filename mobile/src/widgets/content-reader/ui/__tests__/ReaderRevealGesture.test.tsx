import { render } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { ReaderRevealGesture } from '../ReaderRevealGesture';

require('react-native-gesture-handler/jestSetup');

describe('MOB-FEAT-052 bottom reveal gesture', () => {
    it('reveals only after a valid pan and rejects a blocked or cancelled gesture', () => {
        const reveal = jest.fn();
        let blocked = false;
        render(<ReaderRevealGesture bottom={20} targetSize={48} blocked={() => blocked} onReveal={reveal} />);
        fireGestureHandler(getByGestureTestId('reader-reveal-pan'), [
            { state: State.BEGAN, translationX: 0, translationY: 0 },
            { state: State.ACTIVE, translationX: 0, translationY: -30, numberOfPointers: 1 },
            { state: State.END, translationX: 0, translationY: -30 },
        ]);
        expect(reveal).toHaveBeenCalledTimes(1);
        blocked = true;
        fireGestureHandler(getByGestureTestId('reader-reveal-pan'), [{ translationX: 0, translationY: -30 }]);
        expect(reveal).toHaveBeenCalledTimes(1);
        blocked = false;
        fireGestureHandler(getByGestureTestId('reader-reveal-pan'), [{ state: State.BEGAN }, { state: State.CANCELLED }]);
        expect(reveal).toHaveBeenCalledTimes(1);
    });
});
