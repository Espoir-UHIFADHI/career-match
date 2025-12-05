import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Button } from "../ui/Button";

import { Copy, Check, BookOpen, MessageSquare, Lightbulb, Send } from "lucide-react";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";

interface Template {
    id: string;
    title: string;
    subject?: string;
    content: string;
    category: 'linkedin' | 'email' | 'followup';
}

const STRATEGIES = [
    {
        title: "L'Approche Chaleureuse",
        icon: <Lightbulb className="w-6 h-6 text-amber-500" />,
        description: "Commencez par votre réseau existant et les anciens élèves.",
        points: [
            "Identifiez les anciens élèves de votre école dans l'entreprise cible.",
            "Mentionnez des connexions ou des intérêts communs dès le début.",
            "L'objectif est d'obtenir des conseils, pas de demander un emploi directement."
        ]
    },
    {
        title: "La Valeur avant tout",
        icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
        description: "Montrez que vous vous êtes renseigné et apportez de la valeur.",
        points: [
            "Commentez un article ou un post récent de la personne.",
            "Posez une question pertinente sur un défi spécifique de leur secteur.",
            "Soyez bref et respectueux de leur temps."
        ]
    },
    {
        title: "La Relance Intelligente",
        icon: <Send className="w-6 h-6 text-emerald-500" />,
        description: "La persévérance paie, mais restez poli et professionnel.",
        points: [
            "Attendez 3-5 jours avant la première relance.",
            "Apportez une nouvelle information ou un nouvel angle à chaque relance.",
            "Si pas de réponse après 3 tentatives, passez à autre chose."
        ]
    }
];

const TEMPLATES: Template[] = [
    {
        id: 'linkedin-alumni',
        title: "Connexion LinkedIn (Ancien Élève)",
        category: 'linkedin',
        content: "Bonjour [Prénom],\n\nJe vois que nous avons tous les deux étudié à [École]. Je suis actuellement [Votre Rôle/Situation] et je m'intéresse beaucoup à votre parcours chez [Entreprise].\n\nAccepteriez-vous de partager votre expérience lors d'un bref échange ?\n\nCordialement,\n[Votre Nom]"
    },
    {
        id: 'linkedin-cold',
        title: "Connexion LinkedIn (Spontanée)",
        category: 'linkedin',
        content: "Bonjour [Prénom],\n\nJe suis vos posts sur [Sujet] avec grand intérêt. Votre approche de [Sujet Spécifique] m'a particulièrement interpellé.\n\nJe serais ravi de vous compter dans mon réseau professionnel.\n\nBien à vous,\n[Votre Nom]"
    },
    {
        id: 'email-advice',
        title: "Email de demande de conseils",
        category: 'email',
        subject: "Question sur [Sujet/Entreprise] de la part d'un [Votre Rôle]",
        content: "Bonjour [Prénom],\n\nJe m'appelle [Votre Nom] et je suis actuellement [Votre Situation]. J'ai vu votre parcours impressionnant chez [Entreprise] et je me permets de vous contacter.\n\nJe cherche à m'orienter vers [Domaine/Rôle] et j'aimerais beaucoup avoir votre avis d'expert sur [Question Spécifique].\n\nAuriez-vous 10 minutes à m'accorder pour un bref appel ou un café virtuel la semaine prochaine ?\n\nMerci d'avance,\n[Votre Nom]"
    },
    {
        id: 'followup-1',
        title: "Relance simple (J+3)",
        category: 'followup',
        subject: "Re: Question sur [Sujet/Entreprise]...",
        content: "Bonjour [Prénom],\n\nJe me permets de faire remonter ce message au cas où il vous aurait échappé.\n\nJe reste très intéressé par votre retour d'expérience sur [Sujet].\n\nBien cordialement,\n[Votre Nom]"
    },
    {
        id: 'linkedin-event',
        title: "Connexion LinkedIn (Suite à un événement)",
        category: 'linkedin',
        content: "Bonjour [Prénom],\n\nJ'ai beaucoup apprécié notre échange lors de [Sujet] hier. Votre point de vue m'a beaucoup intéressé.\n\nJ'aimerais beaucoup rester en contact et poursuivre cette discussion.\n\nBien à vous,\n[Votre Nom]"
    },
    {
        id: 'linkedin-recruiter',
        title: "Connexion LinkedIn (Recruteur)",
        category: 'linkedin',
        content: "Bonjour [Prénom],\n\nJe suis actuellement [Votre Rôle] et j'ai vu que vous recrutiez pour [Entreprise].\n\nJe suis très intéressé par les opportunités en [Domaine/Rôle]. Seriez-vous ouvert à une brève connexion ?\n\nCordialement,\n[Votre Nom]"
    },
    {
        id: 'email-mentor',
        title: "Email - Admiration / Mentor",
        category: 'email',
        subject: "Question sur [Sujet] - [Votre Nom]",
        content: "Bonjour [Prénom],\n\nJe suis votre travail depuis un moment, notamment vos interventions sur [Sujet].\n\nJe suis actuellement [Votre Rôle] et je cherche à progresser dans ce domaine. Auriez-vous un moment pour partager quelques conseils ?\n\nMerci,\n[Votre Nom]"
    },
    {
        id: 'email-job',
        title: "Email - Candidature Spontanée",
        category: 'email',
        subject: "Candidature spontanée - [Votre Rôle]",
        content: "Bonjour [Prénom],\n\nJe suis avec intérêt les activités de [Entreprise] et je suis impressionné par vos récents projets.\n\nEn tant que [Votre Rôle], je pense pouvoir apporter de la valeur à votre équipe. Seriez-vous disponible pour en discuter ?\n\nBien cordialement,\n[Votre Nom]"
    },
    {
        id: 'followup-no-response',
        title: "Relance (Pas de réponse)",
        category: 'followup',
        subject: "Re: [Sujet]",
        content: "Bonjour [Prénom],\n\nJe me permets de revenir vers vous concernant mon précédent message sur [Sujet].\n\nJe reste très intéressé par une opportunité d'échange.\n\nBien à vous,\n[Votre Nom]"
    }
];

export function NetworkingGuide() {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Customization state
    const [userName, setUserName] = useState('');
    const [targetName, setTargetName] = useState('');
    const [company, setCompany] = useState('');
    const [currentRole, setCurrentRole] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [school, setSchool] = useState('');
    const [subject, setSubject] = useState('');

    const handleCopy = (text: string, id: string) => {
        // Replace placeholders if values are provided
        let finalText = text;
        if (userName) finalText = finalText.replace(/\[Votre Nom\]/g, userName);
        if (targetName) finalText = finalText.replace(/\[Prénom\]/g, targetName);
        if (company) finalText = finalText.replace(/\[Entreprise\]/g, company);
        if (currentRole) finalText = finalText.replace(/\[Votre Rôle\/Situation\]|\[Votre Situation\]|\[Votre Rôle\]/g, currentRole);
        if (targetRole) finalText = finalText.replace(/\[Domaine\/Rôle\]/g, targetRole);
        if (school) finalText = finalText.replace(/\[École\]/g, school);
        if (subject) finalText = finalText.replace(/\[Sujet\]|\[Sujet Spécifique\]|\[Question Spécifique\]/g, subject);

        navigator.clipboard.writeText(finalText);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredTemplates = activeCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === activeCategory);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
                {STRATEGIES.map((strategy, idx) => (
                    <Card key={idx} className="glass-panel bg-white/50 border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    {strategy.icon}
                                </div>
                                <CardTitle className="text-lg text-slate-800">{strategy.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 mb-4 font-medium">{strategy.description}</p>
                            <ul className="space-y-2">
                                {strategy.points.map((point, pIdx) => (
                                    <li key={pIdx} className="text-sm text-slate-500 flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-3">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Modèles de Messages
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {['all', 'linkedin', 'email', 'followup'].map((cat) => (
                            <Button
                                key={cat}
                                variant={activeCategory === cat ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setActiveCategory(cat)}
                                className={`capitalize text-xs h-8 ${activeCategory === cat ? 'bg-indigo-600' : 'text-slate-600'}`}
                            >
                                {cat === 'all' ? 'Tous' : cat}
                            </Button>
                        ))}
                    </div>
                </div>

                <Card className="glass-panel bg-slate-50 border-slate-200">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <div className="space-y-2">
                                <Label>Votre Nom</Label>
                                <Input
                                    placeholder="Jean Dupont"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Votre Poste Actuel</Label>
                                <Input
                                    placeholder="Étudiant / Développeur"
                                    value={currentRole}
                                    onChange={(e) => setCurrentRole(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Poste Visé / Domaine</Label>
                                <Input
                                    placeholder="Product Manager"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>École (si applicable)</Label>
                                <Input
                                    placeholder="HEC / 42 / ..."
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Prénom du contact</Label>
                                <Input
                                    placeholder="Marie"
                                    value={targetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Entreprise cible</Label>
                                <Input
                                    placeholder="Google"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Sujet / Question</Label>
                                <Input
                                    placeholder="L'IA dans le recrutement / Votre transition vers..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="bg-white text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredTemplates.map((template) => (
                                <Card key={template.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold text-slate-800">
                                                {template.title}
                                            </CardTitle>
                                            <span className={`text-xs px-2 py-1 rounded-full border ${template.category === 'linkedin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                template.category === 'email' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-purple-50 text-purple-600 border-purple-100'
                                                }`}>
                                                {template.category}
                                            </span>
                                        </div>
                                        {template.subject && (
                                            <CardDescription className="font-mono text-xs bg-slate-50 p-2 rounded mt-2 border border-slate-100">
                                                Objet: {template.subject}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative group">
                                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 whitespace-pre-wrap font-mono border border-slate-100">
                                                {template.content
                                                    .replace(/\[Votre Nom\]/g, userName || '[Votre Nom]')
                                                    .replace(/\[Prénom\]/g, targetName || '[Prénom]')
                                                    .replace(/\[Entreprise\]/g, company || '[Entreprise]')
                                                    .replace(/\[Votre Rôle\/Situation\]|\[Votre Situation\]|\[Votre Rôle\]/g, currentRole || '[Votre Situation]')
                                                    .replace(/\[Domaine\/Rôle\]/g, targetRole || '[Domaine]')
                                                    .replace(/\[École\]/g, school || '[École]')
                                                    .replace(/\[Sujet\]|\[Sujet Spécifique\]|\[Question Spécifique\]/g, subject || '[Sujet]')
                                                }
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleCopy(template.content, template.id)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm hover:bg-slate-100"
                                            >
                                                {copiedId === template.id ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-slate-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
