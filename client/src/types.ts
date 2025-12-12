export interface Contact {
    id: string;
    properties: {
        firstname: string;
        lastname: string;
        email: string;
        jobtitle?: string;
        company?: string;
        phone?: string;
        address?: string;
        [key: string]: any;
    };
}

export interface Deal {
    id: string;
    properties: {
        dealname: string;
        amount: string;
        dealstage: string;
        closedate?: string;
        pipeline?: string;
        [key: string]: any;
    };
}

export interface AIInsight {
    leadScore: number;
    insight: string;
}

export interface ContactDataPayload {
    firstname: string;
    lastname: string;
    email: string;
    jobtitle: string;
    company: string;
}
