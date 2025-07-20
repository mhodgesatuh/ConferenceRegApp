// frontend/src/features/registration/RegistrationForm.tsx
//

import React, {useEffect, useReducer} from 'react';
import {FormField} from '@/data/registrationFormData';
import {formReducer, initialFormState} from './formReducer';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {Section} from '@/components/ui/section';
import {generatePin} from "@/features/registration/utils";

type RegistrationFormProps = { fields: FormField[] };

const RegistrationForm: React.FC<RegistrationFormProps> = ({fields}) => {

    const [state, dispatch] = useReducer(
        formReducer,
        initialFormState(fields)
    );

    // On the first render, if the pin field is empty, generate one.
    useEffect(() => {
        if (state.loginPin === '') {
            const pin = generatePin(8);
            dispatch({type: 'CHANGE_FIELD', name: 'loginPin', value: pin});
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, type, checked, value, valueAsNumber} = e.target;
        let parsed: string | number | boolean;

        switch (type) {
            case 'checkbox':
                parsed = checked;
                break;
            case 'number':
                parsed = isNaN(valueAsNumber) ? 0 : valueAsNumber;
                break;
            default:
                parsed = value;
        }

        dispatch({type: 'CHANGE_FIELD', name, value: parsed});
    };

    const renderField = (field: FormField, index: number) => {
        switch (field.type) {

            case 'section':
                return <Section key={index}>{field.label}</Section>;

            case 'checkbox':
                return (
                    <div key={field.name} className="flex flex-col gap-1">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Checkbox
                            id={field.name}
                            name={field.name}
                            checked={state[field.name] as boolean}
                            onChange={handleChange}
                            required={field.required}
                        />
                    </div>
                );

            // add more specialized cases here (email, tel, etc.)

            default:
                return (
                    <div key={field.name} className="flex flex-col gap-1">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            value={state[field.name] as string | number}
                            onChange={handleChange}
                            required={field.required}
                        />
                    </div>
                );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // …same as before…
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(renderField)}
            <Button type="submit">Register</Button>
        </form>
    );
};

export default RegistrationForm;
