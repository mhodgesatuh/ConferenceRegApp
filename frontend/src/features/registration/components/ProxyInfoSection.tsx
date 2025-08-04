import React from 'react';
import {FormField} from '@/data/registrationFormData';
import FieldRenderer from './FieldRenderer';
import {FormState, Action} from '../state/formReducer';
import {PROXY_WITH_FLAG_SET, PROXY_INFO_LABEL} from '../constants';

interface SectionProps {
    fields: FormField[];
    state: FormState;
    dispatch: React.Dispatch<Action>;
    isMissing: (name: string) => boolean;
    clearMissing: (name: string) => void;
}

const ProxyInfoSection: React.FC<SectionProps> = ({fields, state, dispatch, isMissing, clearMissing}) => {
    const sectionFields = fields.filter((f) => {
        if (f.type === 'section') {
            return f.label === PROXY_INFO_LABEL;
        }
        return PROXY_WITH_FLAG_SET.has(f.name);
    });

    return (
        <>
            {sectionFields.map((field) => (
                <FieldRenderer
                    key={field.type === 'section' ? field.label : field.name}
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

export default ProxyInfoSection;
