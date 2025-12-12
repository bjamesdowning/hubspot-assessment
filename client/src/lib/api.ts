import axios from 'axios';
import type { Contact, Deal, AIInsight, ContactDataPayload } from '../types';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optimize for user display - if we have a structured error from server, use it.
        error.message = error.response?.data?.error || error.message || 'An unexpected error occurred';
        return Promise.reject(error);
    }
);

export const getContacts = async () => {
    const response = await api.get<{ results: Contact[] }>('/contacts');
    return response.data.results;
};

export const createContact = async (data: ContactDataPayload) => {
    const response = await api.post('/contacts', {
        properties: data
    });
    return response.data;
};

export const getDeals = async (contactId: string) => {
    const response = await api.get<{ results: Deal[] }>(`/contacts/${contactId}/deals`);
    // Ensure we return an array
    return response.data.results || [];
};

export const createDeal = async (deal: { dealname: string; amount: number; dealstage: string }, contactId: string) => {
    const response = await api.post('/deals', {
        dealProperties: deal,
        contactId
    });
    return response.data;
};

export const getAIInsight = async (contactData: any): Promise<AIInsight> => {
    const response = await api.post<AIInsight>('/ai-insight', {
        contactData
    });
    return response.data;
};

export const getDealStages = async () => {
    const response = await api.get<{ label: string; id: string }[]>('/deal-stages');
    return response.data;
};
