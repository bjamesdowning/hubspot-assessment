import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Briefcase, Plus, Save, Ban, Loader2 } from 'lucide-react'
import type { Contact, Deal } from '../types';
import { getDeals, createDeal, getDealStages } from '../lib/api'
import AIInsightCard from './AIInsightCard'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface ContactDetailDrawerProps {
    contact: Contact | null;
    onClose: () => void;
}

export default function ContactDetailDrawer({ contact, onClose }: ContactDetailDrawerProps) {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loadingDeals, setLoadingDeals] = useState(false);

    // Inline Deal Creation State
    const [isCreatingDeal, setIsCreatingDeal] = useState(false);
    const [creatingDealLoading, setCreatingDealLoading] = useState(false);

    // Dynamic stages state
    const [stages, setStages] = useState<{ label: string, id: string }[]>([]);
    const [stagesLoading, setStagesLoading] = useState(false);

    const [formData, setFormData] = useState({
        dealname: '',
        amount: '',
        dealstage: '',
    });

    // Fetch stages on mount
    useEffect(() => {
        const fetchStages = async () => {
            setStagesLoading(true);
            try {
                const data = await getDealStages();
                setStages(data);
            } catch (error: any) {
                console.error('Failed to fetch stages', error);
                toast.error(error.message || 'Failed to load deal stages');
            } finally {
                setStagesLoading(false);
            }
        };
        fetchStages();
    }, []);

    useEffect(() => {
        if (contact) {
            fetchDeals();
            resetForm();
        }
    }, [contact]);

    // Set default stage when stages load
    useEffect(() => {
        if (stages.length > 0 && !formData.dealstage) {
            setFormData(prev => ({ ...prev, dealstage: stages[0].id }));
        }
    }, [stages]);

    const resetForm = () => {
        setIsCreatingDeal(false);
        // Default to first stage if available
        setFormData({
            dealname: '',
            amount: '',
            dealstage: stages.length > 0 ? stages[0].id : ''
        });
    };

    const fetchDeals = async () => {
        if (!contact) return;
        setLoadingDeals(true);
        try {
            const results = await getDeals(contact.id);
            setDeals(results);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to load deals');
        } finally {
            setLoadingDeals(false);
        }
    };

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact) return;

        setCreatingDealLoading(true);
        try {
            const newDeal = await createDeal({
                dealname: formData.dealname,
                amount: Number(formData.amount),
                dealstage: formData.dealstage
            }, contact.id);

            toast.success('Deal created successfully!');
            // Update state directly to show immediate feedback (HubSpot search API can be slow)
            setDeals(current => [newDeal, ...current]);
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create deal');
        } finally {
            setCreatingDealLoading(false);
        }
    };

    return (
        <Transition.Root show={!!contact} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px]" />

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        {contact && (
                                            <>
                                                <div className="px-4 py-6 sm:px-6 bg-slate-50 border-b border-gray-200">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <Dialog.Title className="text-xl font-semibold leading-6 text-gray-900">
                                                                {contact.properties.firstname} {contact.properties.lastname}
                                                            </Dialog.Title>
                                                            {(contact.properties.jobtitle || contact.properties.company) && (
                                                                <p className="mt-1 text-sm text-gray-500">
                                                                    {contact.properties.jobtitle}
                                                                    {contact.properties.jobtitle && contact.properties.company && ' at '}
                                                                    {contact.properties.company}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="ml-3 flex h-7 items-center">
                                                            <button
                                                                type="button"
                                                                className="relative rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
                                                                onClick={onClose}
                                                            >
                                                                <X className="h-6 w-6" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative flex-1 px-4 py-6 sm:px-6 space-y-8">
                                                    {/* AI Section */}
                                                    <section>
                                                        <AIInsightCard contact={contact} />
                                                    </section>

                                                    {/* Deals Section */}
                                                    <section>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                                                <Briefcase className="w-5 h-5 text-gray-500" />
                                                                Deals
                                                            </h4>
                                                            {!isCreatingDeal && (
                                                                <button
                                                                    onClick={() => setIsCreatingDeal(true)}
                                                                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Add Deal
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isCreatingDeal && (
                                                            <div className="bg-slate-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                                <h5 className="text-sm font-medium text-blue-900 mb-3">New Deal Details</h5>
                                                                <form onSubmit={handleCreateDeal} className="space-y-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700">Deal Name</label>
                                                                        <input
                                                                            required
                                                                            autoFocus
                                                                            type="text"
                                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                                                            value={formData.dealname}
                                                                            onChange={e => setFormData({ ...formData, dealname: e.target.value })}
                                                                            placeholder="e.g. Upgrade Package"
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700">Amount ($)</label>
                                                                            <input
                                                                                required
                                                                                type="number"
                                                                                min="0"
                                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                                                                value={formData.amount}
                                                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700">Stage</label>
                                                                            {stagesLoading ? (
                                                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                                    Loading stages...
                                                                                </div>
                                                                            ) : (
                                                                                <select
                                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
                                                                                    value={formData.dealstage}
                                                                                    onChange={e => setFormData({ ...formData, dealstage: e.target.value })}
                                                                                >
                                                                                    {stages.map(stage => (
                                                                                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                                                                                    ))}
                                                                                </select>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                                                                        <button
                                                                            type="button"
                                                                            onClick={resetForm}
                                                                            className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                                        >
                                                                            <Ban className="w-3.5 h-3.5" />
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            type="submit"
                                                                            disabled={creatingDealLoading}
                                                                            className={cn(
                                                                                "inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                                                                                creatingDealLoading && "opacity-50 cursor-not-allowed"
                                                                            )}
                                                                        >
                                                                            <Save className="w-3.5 h-3.5" />
                                                                            {creatingDealLoading ? 'Saving...' : 'Save Deal'}
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        )}

                                                        {loadingDeals ? (
                                                            <div className="text-center py-8 text-gray-400">Loading deals...</div>
                                                        ) : deals.length === 0 && !isCreatingDeal ? (
                                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                                                <p className="text-sm text-gray-500">No deals found for this contact.</p>
                                                            </div>
                                                        ) : (
                                                            <ul className="space-y-3">
                                                                {deals.map(deal => (
                                                                    <li key={deal.id} className="bg-white border ring-1 ring-gray-900/5 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <h5 className="font-medium text-gray-900">{deal.properties.dealname}</h5>
                                                                                <p className="text-xs text-gray-500 mt-1">Stage: {deal.properties.dealstage}</p>
                                                                            </div>
                                                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                                                ${deal.properties.amount ? Number(deal.properties.amount).toLocaleString() : '0'}
                                                                            </span>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </section>

                                                    <section>
                                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Details</h4>
                                                        <dl className="divide-y divide-gray-100">
                                                            <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                                                <dt className="text-sm font-medium leading-6 text-gray-900">Email</dt>
                                                                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{contact.properties.email}</dd>
                                                            </div>
                                                            {contact.properties.phone && (
                                                                <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                                                    <dt className="text-sm font-medium leading-6 text-gray-900">Phone</dt>
                                                                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{contact.properties.phone}</dd>
                                                                </div>
                                                            )}
                                                        </dl>
                                                    </section>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
