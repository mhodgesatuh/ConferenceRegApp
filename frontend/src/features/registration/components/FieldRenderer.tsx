import React from 'react';
import {FormField} from '@/data/registrationFormData';
import {FormState, Action} from '../state/formReducer';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Section} from '@/components/ui/section';

interface FieldRendererProps {
    field: FormField;
    state: FormState;
    dispatch: React.Dispatch<Action>;
    isMissing?: (name: string) => boolean;
    clearMissing?: (name: string) => void;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({field, state, dispatch, isMissing, clearMissing}) => {
    if (field.type === 'section') {
        return <Section>{field.label}</Section>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, type, value, valueAsNumber} = e.target;
        let parsed: string | number;
        switch (type) {
            case 'number':
                parsed = isNaN(valueAsNumber) ? 0 : valueAsNumber;
                break;
            default:
                parsed = value;
        }
        clearMissing?.(name);
        dispatch({type: 'CHANGE_FIELD', name, value: parsed});
    };

    const handleCheckboxChange = (name: string, value: boolean | 'indeterminate' | undefined) => {
        const checked = Boolean(value);
        if (name === 'day1Attendee' || name === 'day2Attendee') {
            clearMissing?.('day1Attendee');
            clearMissing?.('day2Attendee');
        } else {
            clearMissing?.(name);
        }

        dispatch({type: 'CHANGE_FIELD', name, value: checked});
    };

    if (field.type === 'checkbox') {
        const isProxyField = field.presentationScopes.includes('proxy');
        const isRequired = field.required || (isProxyField && state.hasProxy);
        return (
            <Checkbox
                id={field.name}
                name={field.name}
                label={field.label}
                checked={state[field.name] as boolean}
                onCheckedChange={(val) => handleCheckboxChange(field.name, val)}
                required={isRequired}
                className={isMissing?.(field.name) ? 'bg-red-100' : undefined}
            />
        );
    }

    const isProxyField = field.presentationScopes.includes('proxy');
    const isRequired = field.required || (isProxyField && state.hasProxy);
    return (
        <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
                id={field.name}
                name={field.name}
                type={field.type === 'pin' ? 'text' : field.type}
                value={state[field.name] as string | number}
                onChange={handleChange}
                readOnly={field.type === 'pin' || field.name === 'id'}
                required={isRequired}
                className={isMissing?.(field.name) ? 'bg-red-100' : undefined}
            />
        </div>
    );
};

export default FieldRenderer;
