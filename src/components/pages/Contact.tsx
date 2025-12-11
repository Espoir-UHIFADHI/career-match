import { Mail, MapPin, Clock, Send } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "../../hooks/useTranslation";
import { Button } from "../ui/Button";
import { useState } from "react";

export function Contact() {
    const { t } = useTranslation();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        // Simulate sending
        setTimeout(() => {
            setSending(false);
            setSent(true);
        }, 1500);
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-6 animate-fade-in">
            <Helmet>
                <title>Contact - Career Match</title>
                <meta name="description" content="Contactez l'équipe de Career Match pour toute question ou support. Nous sommes là pour vous aider." />
                <link rel="canonical" href="https://careermatch.fr/contact" />
            </Helmet>
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold mb-4 text-slate-900">{t('contact.title')}</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    {t('contact.subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.email')}</h3>
                            <p className="text-slate-600">{t('contact.info.emailValue')}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.location')}</h3>
                            <p className="text-slate-600">{t('contact.info.locationValue')}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.hours')}</h3>
                            <p className="text-slate-600">{t('contact.info.hoursValue')}</p>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('contact.form.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    placeholder={t('contact.form.name')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('contact.form.email')}</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    placeholder={t('contact.form.email')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('contact.form.subject')}</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                placeholder={t('contact.form.subject')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('contact.form.message')}</label>
                            <textarea
                                required
                                rows={6}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                                placeholder={t('contact.form.message')}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            {sent && (
                                <span className="text-emerald-600 font-medium animate-fade-in">
                                    {t('contact.form.success')}
                                </span>
                            )}
                            <Button
                                type="submit"
                                disabled={sending || sent}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                {sending ? (
                                    <span>{t('contact.form.sending')}</span>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>{t('contact.form.send')}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
