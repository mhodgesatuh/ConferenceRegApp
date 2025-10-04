// frontend/src/features/registration/presenterPhotoApi.ts
//
// API helpers for presenter photo management. Uploading a photo returns
// a relative path that can be stored in presenterPicUrl so the existing
// registration APIs continue to function without modification.

import {apiFetch} from '@/lib/api';

export type UploadPresenterPhotoResponse = {
    presenterPicUrl: string;
    bytes?: number;
};

export async function uploadPresenterPhoto(dataUrl: string): Promise<UploadPresenterPhotoResponse> {
    return apiFetch('/api/presenters/photo', {
        method: 'POST',
        body: JSON.stringify({ dataUrl }),
    });
}
