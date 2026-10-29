
export interface User {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string;
    color: string;
    /** Bevorzugter Charakter im Classic Game (z. B. 'emperor', 'raider' oder 'random'). */
    characterType?: string;
}