
import { useTranslation } from "../../hooks/useTranslation";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import { Link } from "react-router-dom";

export function Blog() {
    const { t } = useTranslation();

    const articles = [
        {
            id: 1,
            title: t('blog.articles.art1.title'),
            desc: t('blog.articles.art1.desc'),
            date: t('blog.articles.art1.date'),
            category: t('blog.categories.ats'),
            image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2940",
            readTime: "5 min"
        },
        {
            id: 2,
            title: t('blog.articles.art2.title'),
            desc: t('blog.articles.art2.desc'),
            date: t('blog.articles.art2.date'),
            category: t('blog.categories.networking'),
            image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=2932",
            readTime: "7 min"
        },
        {
            id: 3,
            title: t('blog.articles.art3.title'),
            desc: t('blog.articles.art3.desc'),
            date: t('blog.articles.art3.date'),
            category: t('blog.categories.salary'),
            image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2940",
            readTime: "4 min"
        }
    ];

    return (
        <div className="flex flex-col bg-white min-h-screen">
            {/* Header */}
            <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-6 text-transform uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />
                        Blog
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 max-w-3xl mx-auto">
                        {t('blog.title')}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        {t('blog.subtitle')}
                    </p>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article) => (
                            <Link
                                to="#"
                                key={article.id}
                                className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10" />
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-indigo-600 shadow-sm border border-white/50">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                        <span>{article.date}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {article.readTime}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                        {article.desc}
                                    </p>
                                    <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                        {t('blog.readMore')}
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
