import { useEffect, useState } from 'react'
import { Plus, X, Check, Loader2, ChevronRight } from 'lucide-react'
import type { Contact } from '../types';
import { getContacts, createContact } from '../lib/api'
import ContactDetailDrawer from './ContactDetailDrawer'
import toast from 'react-hot-toast'

export default function ContactTable() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Inline creation state
    const [isCreating, setIsCreating] = useState(false);
    const [creatingLoading, setCreatingLoading] = useState(false);
    const [newContact, setNewContact] = useState({
        firstname: '',
        lastname: '',
        email: '',
        jobtitle: '',
        company: ''
    });

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const data = await getContacts();
            setContacts(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleCreateContact = async () => {
        // Basic validation
        if (!newContact.firstname || !newContact.lastname || !newContact.email) {
            toast.error('First Name, Last Name, and Email are required');
            return;
        }

        setCreatingLoading(true);
        try {
            const created = await createContact(newContact);
            toast.success('Contact created successfully!');
            // Optimistic update
            setContacts(prev => [created, ...prev]);
            setIsCreating(false);
            setNewContact({ firstname: '', lastname: '', email: '', jobtitle: '', company: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create contact');
        } finally {
            setCreatingLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header / Actions - Simplified */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-end items-center bg-slate-50/50">
                    <button
                        onClick={() => setIsCreating(true)}
                        disabled={isCreating}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        New Customer
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Inline Creation Row */}
                            {isCreating && (
                                <tr className="bg-blue-50/30 animate-fade-in-down border-b-2 border-blue-100">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="First Name"
                                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs px-2 py-1.5 border"
                                                value={newContact.firstname}
                                                onChange={e => setNewContact({ ...newContact, firstname: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs px-2 py-1.5 border"
                                                value={newContact.lastname}
                                                onChange={e => setNewContact({ ...newContact, lastname: e.target.value })}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs px-2 py-1.5 border"
                                            value={newContact.email}
                                            onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            placeholder="Job Title"
                                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs px-2 py-1.5 border"
                                            value={newContact.jobtitle}
                                            onChange={e => setNewContact({ ...newContact, jobtitle: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            placeholder="Company"
                                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs px-2 py-1.5 border"
                                            value={newContact.company}
                                            onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsCreating(false)}
                                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Cancel"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCreateContact}
                                                disabled={creatingLoading}
                                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                                title="Save Contact"
                                            >
                                                {creatingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em]" role="status"></div>
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No contacts found. Create one to get started.</td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        onClick={() => setSelectedContact(contact)}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                                                    {contact.properties.firstname?.[0]}{contact.properties.lastname?.[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {contact.properties.firstname} {contact.properties.lastname}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{contact.properties.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{contact.properties.jobtitle || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{contact.properties.company || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                                            <ChevronRight className="w-4 h-4 ml-auto group-hover:text-blue-500 transition-colors" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ContactDetailDrawer
                contact={selectedContact}
                onClose={() => setSelectedContact(null)}
            />
        </>
    )
}
