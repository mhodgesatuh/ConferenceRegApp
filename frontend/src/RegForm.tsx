// frontend/src/RegForm.tsx
import React, {useEffect, useState} from 'react';
import RegistrationForm from './features/registration/RegistrationForm';

const RegForm = () => {
    const [fields, setFields] = useState([]);

    useEffect(() => {
        fetch('/regFormFields.json')
            .then((res) => res.json())
            .then(setFields)
            .catch(console.error);
    }, []);

    return (
        <div>
            <RegistrationForm fields={fields}/>
        </div>
    );
};

export default RegForm;
