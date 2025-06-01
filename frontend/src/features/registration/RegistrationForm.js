import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/features/registration/RegistrationForm.tsx
import React, { useReducer } from 'react';
import { formReducer, initialFormState } from './formReducer';
export const RegistrationForm = ({ fields }) => {
    const [state, dispatch] = useReducer(formReducer, initialFormState(fields));
    return (_jsxs("form", { children: [fields.map((field) => (_jsxs("div", { children: [_jsx("label", { children: field.label }), _jsx("input", { name: field.name, type: field.type || 'text', value: state[field.name] || '', onChange: (e) => dispatch({
                            type: 'UPDATE_FIELD',
                            name: field.name,
                            value: e.target.value,
                        }) })] }, field.name))), _jsx("button", { type: "submit", children: "Submit" })] }));
};
