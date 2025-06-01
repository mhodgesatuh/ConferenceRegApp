// frontend/src/features/registration/formReducer.ts
export function formReducer(state, action) {
    switch (action.type) {
        case 'UPDATE_FIELD':
            return Object.assign(Object.assign({}, state), { [action.name]: action.value });
        default:
            return state;
    }
}
export function initialFormState(fields) {
    const state = {};
    for (const field of fields) {
        state[field.name] = '';
    }
    return state;
}
