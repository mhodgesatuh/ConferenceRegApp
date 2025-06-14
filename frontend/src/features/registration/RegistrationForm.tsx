// frontend/src/features/registration/RegistrationForm.tsx
import React, {useReducer} from 'react';
import {formReducer, initialFormState} from './formReducer';

type FieldDefinition = {
    name: string;
    label: React.ReactNode;
    type?: string;
};

type RegistrationFormProps = {
    fields: FieldDefinition[];
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({fields}) => {
    const [state, dispatch] = useReducer(formReducer, initialFormState(fields));

    return (
        <form>
            {fields.map((field) => (
                <div key={field.name}>
                    <label>{field.label}</label>
                    <input
                        name={field.name}
                        type={field.type || 'text'}
                        value={state[field.name] || ''}
                        onChange={(e) =>
                            dispatch({
                                type: 'UPDATE_FIELD',
                                name: field.name,
                                value: e.target.value,
                            })
                        }
                    />
                </div>
            ))}
            <button type="submit">Submit</button>
        </form>
    );
};

export default RegistrationForm;
