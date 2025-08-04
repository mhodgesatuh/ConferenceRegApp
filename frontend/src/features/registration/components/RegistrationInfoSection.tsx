import React from 'react';
import {FormField} from '@/data/registrationFormData';
import FieldRenderer from './FieldRenderer';
import {FormState, Action} from '../state/formReducer';
import {REGISTRATION_FIELD_SET, PIN_INFO_LABEL, CANCELLATION_LABEL} from '../constants';

interface SectionProps {
    fields: FormField[];
    state: FormState;
    dispatch: React.Dispatch<Action>;
    isMissing: (name: string) => boolean;
    clearMissing: (name: string) => void;
}

const RegistrationInfoSection: React.FC<SectionProps> = ({fields, state, dispatch, isMissing, clearMissing}) => {
    const sectionFields = fields.filter((f) => {
        if (f.type === 'section') {
            return f.label === PIN_INFO_LABEL || f.label === CANCELLATION_LABEL;
        }
        return REGISTRATION_FIELD_SET.has(f.name ?? '');
    });

    return (
        <>
            {sectionFields.map((field) => (
                <FieldRenderer
                    key={field.name || field.label}
                    field={field}
                    state={state}
                    dispatch={dispatch}
                    isMissing={isMissing}
                    clearMissing={clearMissing}
                />
            ))}
        </>
    );
};

export default RegistrationInfoSection;
