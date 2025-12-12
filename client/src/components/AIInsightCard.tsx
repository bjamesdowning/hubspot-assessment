import { useState } from 'react';
import { Sparkles, RefreshCw, Trophy } from 'lucide-react';
import { getAIInsight } from '../lib/api';
import type { Contact, AIInsight } from '../types';
import { cn } from '../lib/utils';

interface AIInsightCardProps {
    contact: Contact;
}

export default function AIInsightCard({ contact }: AIInsightCardProps) {
    const [insight, setInsight] = useState<AIInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchInsight = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAIInsight({
                jobtitle: contact.properties.jobtitle || 'Unknown',
                company: contact.properties.company || 'Unknown',
                ...contact.properties
            });
            setInsight(data);
        } catch (err: any) {
            let errorMessage = 'Failed to generate insight';
            if (err.response?.data?.details) {
                // If it's a rate limit error (429), make it clean
                if (err.response.data.details.includes('429') || err.response.data.details.includes('quota')) {
                    errorMessage = '⚠️ API Rate Limit Exceeded. Please try again later.';
                } else {
                    // Show actual API error for debugging
                    errorMessage = `API Error: ${err.response.data.details.substring(0, 100)}...`;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Manual trigger only to save API quota
    // useEffect(() => {
    //     fetchInsight();
    // }, [contact.id]);

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <Sparkles className="w-5 h-5" />
                    <h3>Breezy AI Insights</h3>
                </div>
                {insight && (
                    <button
                        onClick={fetchInsight}
                        disabled={loading}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                        title="Regenerate"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                )}
            </div>

            {loading && !insight && (
                <div className="flex flex-col items-center justify-center py-6 text-indigo-400">
                    <span className="loading-dots">Analyzing lead data...</span>
                </div>
            )}

            {!loading && !insight && !error && (
                <div className="text-center py-4">
                    <p className="text-sm text-indigo-600 mb-3">Generate real-time sales insights for this lead.</p>
                    <button
                        onClick={fetchInsight}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate Sales Insight
                    </button>
                </div>
            )}

            {error && (
                <div className="text-red-500 text-sm py-2">{error}</div>
            )}

            {!loading && insight && (
                <div className="space-y-4 relative z-10 animate-fade-in-up">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm font-medium text-slate-700">
                            <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> Lead Score</span>
                            <span className={cn(
                                insight.leadScore > 70 ? "text-green-600" : insight.leadScore > 40 ? "text-amber-600" : "text-red-600"
                            )}>{insight.leadScore}/100</span>
                        </div>
                        <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${insight.leadScore}%` }}
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                    insight.leadScore > 70 ? "bg-green-500" : insight.leadScore > 40 ? "bg-amber-500" : "bg-red-500"
                                )}
                            />
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-sm text-slate-700 border border-indigo-50/50">
                        <p className="italic">"{insight.insight}"</p>
                    </div>
                </div>
            )}
        </div>
    );
}
