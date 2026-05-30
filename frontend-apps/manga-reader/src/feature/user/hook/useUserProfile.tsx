import { useCallback } from 'react';

import { type User } from '../type/user.types';

import { updateProfile as updateProfileService, type UpdateProfilePayload } from '../service/userService';

const useUserProfile = (setUser: React.Dispatch<React.SetStateAction<User | null>>) => {
    const updateProfile = useCallback(
        async (payload: UpdateProfilePayload) => {
            const updatedUser = await updateProfileService(payload);

            setUser(updatedUser);

            return updatedUser;
        },
        [setUser],
    );

    return { updateProfile };
};

export default useUserProfile;
