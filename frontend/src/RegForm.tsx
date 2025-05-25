import React, { useEffect, useState } from 'react';

interface FormField {
    id: string;
    label: string;
    type: string;
    required: boolean;
}

export default function RegForm() {
    const [fields, setFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch('/formFields.json')
            .then(res => res.json())
            .then(setFields);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5000/attendees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        alert(result.message || 'Submitted!');
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-w-md mx-auto">
            <h2 className="text-xl font-semibold">Conference Registration</h2>
            {fields.map(field => (
                <div key={field.id} className="flex flex-col">
                    <label htmlFor={field.id} className="mb-1 font-medium">{field.label}</label>
                    <input
                        type={field.type}
                        id={field.id}
                        name={field.id}
                        required={field.required}
                        onChange={handleChange}
                        className="border rounded px-2 py-1"
                    />
                </div>
            ))}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
        </form>
    );
}
