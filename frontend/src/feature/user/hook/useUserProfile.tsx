import { useCallback } from 'react';

import { type User } from '../type/user.types';

import { updateProfile as updateProfileService } from '../service/userService';

const useUserProfile = (
    setUser: React.Dispatch<React.SetStateAction<User | null>>,
) => {
    const updateProfile = useCallback(
        async (partialUser: Partial<User>) => {
            const updatedUser = await updateProfileService(partialUser);

            setUser(updatedUser);

            return updatedUser;
        },
        [setUser],
    );

    return { updateProfile };
};

export default useUserProfile;
