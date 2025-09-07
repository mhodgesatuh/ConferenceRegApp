// frontend/src/features/registration/utils.ts

// Generate a random Pin for a new registration user.
export function generatePin(length: number): string {
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
}