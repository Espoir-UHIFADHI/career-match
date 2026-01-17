import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Tag, Linkedin, Link2 } from "lucide-react";
import { blogPosts } from "../../data/blogPosts";
import { Helmet } from "react-helmet-async";
import { useAppStore } from "../../store/useAppStore";

export function BlogPost() {
    const { slug } = useParams();
    const { language } = useAppStore();
    const post = blogPosts.find((p) => p.slug === slug);
    const lang = language === "English" ? "en" : "fr";

    if (!post) {
        return <Navigate to="/blog" replace />;
    }

    const shareUrl = window.location.href;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        // You might want to add a toast notification here
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <Helmet>
                <title>{post.title[lang]} | Career Match Blog</title>
                <meta name="description" content={post.desc[lang]} />
                <meta property="og:title" content={post.title[lang]} />
                <meta property="og:description" content={post.desc[lang]} />
                <meta property="og:image" content={post.image} />
            </Helmet>

            {/* Hero Section - Compact and Modern */}
            <div className="relative h-[40vh] min-h-[350px] w-full bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={post.image}
                        alt={post.title[lang]}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/60 to-slate-900" />
                </div>

                <div className="absolute inset-x-0 bottom-0 pb-12">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <Link
                            to="/blog"
                            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors group text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            {language === "English" ? "Back to blog" : "Retour au blog"}
                        </Link>

                        <div className="flex flex-wrap items-center gap-3 mb-4 animate-fade-in">
                            <span className="px-3 py-1 bg-indigo-500/20 backdrop-blur-md text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                                {post.category[lang]}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight animate-slide-up tracking-tight">
                            {post.title[lang]}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm font-medium animate-slide-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                <span>{post.date[lang]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                <span>{post.readTime} {language === "English" ? "read" : "de lecture"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <article className="container mx-auto px-6 -mt-10 relative z-10 mb-20 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8 border border-slate-100">
                    {/* Lead Paragraph */}
                    <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed mb-12 border-l-4 border-indigo-500 pl-6 italic bg-slate-50/50 py-4 rounded-r-lg">
                        {post.desc[lang]}
                    </p>

                    {/* Main Content using Typography Plugin */}
                    <div className="prose prose-lg md:prose-xl prose-slate max-w-none text-slate-600
                        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
                        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-indigo-950
                        prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-indigo-900
                        prose-p:leading-8 prose-p:mb-6
                        prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-indigo-700 transition-colors
                        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/30 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-indigo-900 prose-blockquote:font-medium
                        prose-li:marker:text-indigo-500
                        prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-slate-100
                        prose-hr:border-slate-200 prose-hr:my-16"
                    >
                        <div dangerouslySetInnerHTML={{ __html: post.content[lang] }} />
                    </div>

                    {/* Share Section */}
                    <div className="mt-16 pt-10 border-t border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-slate-900">{post.category[lang]}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-500">{language === "English" ? "Share:" : "Partager :"}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyLink}
                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                                        title={language === "English" ? "Copy link" : "Copier le lien"}
                                    >
                                        <Link2 className="w-5 h-5" />
                                    </button>
                                    <a
                                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-500 hover:text-[#0a66c2] hover:bg-[#0a66c2]/10 rounded-lg transition-all border border-transparent hover:border-[#0a66c2]/20"
                                        title="Partager sur LinkedIn"
                                    >
                                        <Linkedin className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Read More Section */}
            <section className="bg-slate-100/80 py-20 border-t border-slate-200">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-bold text-slate-900">{language === "English" ? "Related articles" : "Articles similaires"}</h2>
                        <Link to="/blog" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                            {language === "English" ? "View all articles" : "Voir tout le blog"} &rarr;
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {blogPosts
                            .filter(p => p.id !== post.id)
                            .slice(0, 3)
                            .map(relatedPost => (
                                <Link
                                    key={relatedPost.id}
                                    to={`/blog/${relatedPost.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 flex flex-col h-full"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10 duration-500" />
                                        <img
                                            src={relatedPost.image}
                                            alt={relatedPost.title[lang]}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="text-xs font-bold text-indigo-600 mb-3 uppercase tracking-wider">
                                            {relatedPost.category[lang]}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                            {relatedPost.title[lang]}
                                        </h3>
                                        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-100">
                                            <span>{relatedPost.date[lang]}</span>
                                            <span>{relatedPost.readTime}</span>
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
