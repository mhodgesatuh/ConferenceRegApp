export const PAGE_TITLE = 'Conference Registration';

export const PIN_INFO_LABEL = 'You will be able to use your email address and the provided Pin if you need to update your registration information.';
export const CONTACT_INFO_LABEL = 'Provide your (attendee) contact information.';
export const CANCELLATION_LABEL = 'If you need to cancel, please let us know.';
export const PROXY_INFO_LABEL = 'If you are registering another person, please provide your contact information.';
export const ADMIN_SECTION_LABEL = 'This is a secured section of the form for administrators only';

export const PROXY_FIELDS = ['proxyName', 'proxyPhone', 'proxyEmail'] as const;
export const PROXY_FIELDS_SET = new Set(PROXY_FIELDS);

export const REGISTRATION_FIELDS = ['id', 'email', 'loginPin', 'day1Attendee', 'day2Attendee', 'question1', 'question2', 'cancelledAttendance'] as const;
export const REGISTRATION_FIELD_SET = new Set(REGISTRATION_FIELDS);

export const CONTACT_FIELDS = ['phone1', 'phone2', 'firstName', 'lastName', 'namePrefix', 'nameSuffix'] as const;
export const CONTACT_FIELD_SET = new Set(CONTACT_FIELDS);

export const PROXY_FIELDS_WITH_FLAG = ['hasProxy', ...PROXY_FIELDS] as const;
export const PROXY_WITH_FLAG_SET = new Set(PROXY_FIELDS_WITH_FLAG);

export const ADMIN_FIELDS = ['isAttendee', 'isMonitor', 'isOrganizer', 'isPresenter', 'isSponsor'] as const;
export const ADMIN_FIELD_SET = new Set(ADMIN_FIELDS);
