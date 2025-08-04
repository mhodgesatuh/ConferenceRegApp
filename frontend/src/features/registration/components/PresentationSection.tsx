import React from 'react';
import {FormField, PresentationScope} from '@/data/registrationFormData';
import FieldRenderer from './FieldRenderer';
import {FormState, Action} from '../state/formReducer';

interface SectionProps {
    scope: PresentationScope;
    fields: FormField[];
    state: FormState;
    dispatch: React.Dispatch<Action>;
    isMissing: (name: string) => boolean;
    clearMissing: (name: string) => void;
}

const PresentationSection: React.FC<SectionProps> = ({scope, fields, state, dispatch, isMissing, clearMissing}) => {
    const sectionFields = fields.filter((f) => f.presentationScopes.includes(scope));

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

export default PresentationSection;

