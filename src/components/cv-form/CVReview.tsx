import { useState } from "react";
import { Save, Upload } from "lucide-react";
import type { ParsedCV } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { Plus, Trash2, User, FileText, Code, Briefcase, GraduationCap, X, AlertCircle, Linkedin, Award, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { useTranslation } from "../../hooks/useTranslation";
import { cn } from "../../lib/utils";

interface CVReviewProps {
    initialData: ParsedCV;
    onSave: (data: ParsedCV) => void;
    onCancel: () => void;
}

export function CVReview({ initialData, onSave, onCancel }: CVReviewProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<ParsedCV>(() => {
        if (!initialData.interests || initialData.interests.length === 0) {
            return {
                ...initialData,
                interests: ["Musique"]
            };
        }
        return initialData;
    });
    const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

    // Collapsible states - default first item expanded
    const [expandedExperience, setExpandedExperience] = useState<number[]>([0]);
    const [expandedEducation, setExpandedEducation] = useState<number[]>([0]);
    const [expandedCertifications, setExpandedCertifications] = useState<number[]>([0]);

    const toggleExpand = (section: 'experience' | 'education' | 'certifications', index: number) => {
        let setFn;
        if (section === 'experience') setFn = setExpandedExperience;
        else if (section === 'education') setFn = setExpandedEducation;
        else setFn = setExpandedCertifications;

        setFn(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    };

    const moveItem = (section: 'experience' | 'education' | 'certifications', index: number, direction: 'up' | 'down') => {
        let list: any[] = [];
        if (section === 'experience') list = formData.experience;
        else if (section === 'education') list = formData.education || [];
        else list = formData.certifications || [];

        if ((direction === 'up' && index === 0) || (direction === 'down' && index === list.length - 1)) return;

        const newList = [...list];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];

        setFormData({ ...formData, [section]: newList });

        // Also swap expanded state
        let expandedList: number[] = [];
        let setExpanded: React.Dispatch<React.SetStateAction<number[]>> = () => { };

        if (section === 'experience') {
            expandedList = expandedExperience;
            setExpanded = setExpandedExperience;
        } else if (section === 'education') {
            expandedList = expandedEducation;
            setExpanded = setExpandedEducation;
        } else {
            expandedList = expandedCertifications;
            setExpanded = setExpandedCertifications;
        }

        let newExpanded = [...expandedList];
        const isCurrentExpanded = newExpanded.includes(index);
        const isSwapExpanded = newExpanded.includes(swapIndex);

        if (isCurrentExpanded && !isSwapExpanded) {
            newExpanded = newExpanded.filter(i => i !== index).concat(swapIndex);
        } else if (!isCurrentExpanded && isSwapExpanded) {
            newExpanded = newExpanded.filter(i => i !== swapIndex).concat(index);
        }
        setExpanded(newExpanded);
    };

    const [errors, setErrors] = useState<string[]>([]);

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        // 1. Contact Info
        if (!formData.contact.firstName.trim()) newErrors.push("First Name is required.");
        if (!formData.contact.lastName.trim()) newErrors.push("Last Name is required.");
        if (!formData.contact.email?.trim()) newErrors.push("Email is required.");

        // 2. Summary
        if (!formData.summary?.trim()) newErrors.push("Professional Summary is required.");

        // 3. Experience
        if (!formData.experience || formData.experience.length === 0) {
            newErrors.push("At least one experience is required.");
        } else {
            formData.experience.forEach((exp, idx) => {
                if (!exp.company.trim() || !exp.role.trim()) {
                    newErrors.push(`Experience #${idx + 1}: Company and Role are required.`);
                }
            });
        }

        const insertBullet = (
            e: React.MouseEvent<HTMLButtonElement>,
            section: 'experience' | 'education',
            index: number,
            field: 'description'
        ) => {
            e.preventDefault();
            const list = section === 'experience' ? formData.experience : formData.education;
            if (!list) return; // Should not happen given logic

            const item = list[index];
            const currentVal = item.description || "";
            const newVal = currentVal ? `${currentVal}\n• ` : "• ";

            const newList = [...list];
            newList[index] = { ...item, [field]: newVal };
            setFormData({ ...formData, [section]: newList });
        };

        // 4. Education
        if (!formData.education || formData.education.length === 0) {
            newErrors.push("At least one education entry is required (Big Four standard).");
        } else {
            formData.education.forEach((edu, idx) => {
                if (!edu.school.trim() || !edu.degree.trim()) {
                    newErrors.push(`Education #${idx + 1}: School and Degree are required.`);
                }
            });
        }

        // 5. Skills
        if (!formData.skills || formData.skills.length === 0 || formData.skills.every(s => !s.trim())) {
            newErrors.push("At least one skill is required.");
        }

        // 6. Languages
        if (!formData.languages || formData.languages.length === 0 || formData.languages.every(l => !l.trim())) {
            newErrors.push("At least one language is required (with proficiency level).");
        }

        // 7. Interests
        if (!formData.interests || formData.interests.length === 0 || formData.interests.every(i => !i.trim())) {
            newErrors.push("At least one interest is required (Airport Test).");
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSave = () => {
        setHasAttemptedSave(true);
        if (validateForm()) {
            onSave(formData);
        } else {
            // Scroll to top to show errors
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const isInvalid = (value: string | undefined) => hasAttemptedSave && !value?.trim();

    const updateArrayItem = (section: "skills" | "languages" | "interests", index: number, value: string) => {
        setFormData((prev) => {
            const newArray = [...(prev[section] || [])];
            newArray[index] = value;
            return { ...prev, [section]: newArray };
        });
    };

    const addArrayItem = (section: "skills" | "languages" | "interests") => {
        setFormData((prev) => ({
            ...prev,
            [section]: [...(prev[section] || []), ""],
        }));
    };

    const removeArrayItem = (section: "skills" | "languages" | "interests", index: number) => {
        setFormData((prev) => {
            const newArray = [...(prev[section] || [])];
            newArray.splice(index, 1);
            return { ...prev, [section]: newArray };
        });
    };



    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('cvReview.title')}</h2>
                    <p className="text-slate-500 text-sm">{t('cvReview.subtitle')}</p>
                </div>
                {errors.length > 0 && (
                    <div className="w-full md:w-auto mb-4 md:mb-0 order-last md:order-none">
                        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-900 font-semibold">{t('cvReview.missingInfo')}</AlertTitle>
                            <AlertDescription className="text-red-700">
                                {t('cvReview.fillRequired')}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 md:flex-none"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('cvReview.reupload')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {t('cvReview.saveContinue')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Contact & Summary */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Personal Info Section */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-indigo-600" />
                                {t('cvReview.personalInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label>{t('cvReview.firstName')}</Label>
                                <Input
                                    value={formData.contact.firstName}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, firstName: e.target.value } })}
                                    placeholder={t('cvReview.firstName')}
                                    className={cn(isInvalid(formData.contact.firstName) && "border-red-500 focus-visible:ring-red-500")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('cvReview.lastName')}</Label>
                                <Input
                                    value={formData.contact.lastName}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, lastName: e.target.value } })}
                                    placeholder={t('cvReview.lastName')}
                                    className={cn(isInvalid(formData.contact.lastName) && "border-red-500 focus-visible:ring-red-500")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('cvReview.email')}</Label>
                                <Input
                                    value={formData.contact.email}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                                    placeholder={t('cvReview.email')}
                                    className={cn(isInvalid(formData.contact.email) && "border-red-500 focus-visible:ring-red-500")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Linkedin className="h-3 w-3 text-indigo-600" />
                                    LinkedIn
                                </Label>
                                <Input
                                    value={formData.contact.linkedin || ""}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, linkedin: e.target.value } })}
                                    placeholder="https://linkedin.com/in/otoby"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('cvReview.phone')}</Label>
                                <Input
                                    value={formData.contact.phone}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                                    placeholder={t('cvReview.phone')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('cvReview.location')}</Label>
                                <Input
                                    value={formData.contact.location}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, location: e.target.value } })}
                                    placeholder={t('cvReview.location')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Professional Summary */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                {t('cvReview.summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Textarea
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                className={cn("min-h-[150px] resize-none", isInvalid(formData.summary) && "border-red-500 focus-visible:ring-red-500")}
                                placeholder={t('cvReview.summaryPlaceholder')}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Experience, Education, Skills */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Skills & Languages */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <Code className="h-4 w-4 text-indigo-600" />
                                {t('cvReview.skillsLanguages')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Technical Skills</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {formData.skills.map((skill, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={skill}
                                                onChange={(e) => updateArrayItem("skills", idx, e.target.value)}
                                                placeholder={t('cvReview.skillPlaceholder')}
                                                className={cn("bg-slate-50 border-slate-200", isInvalid(skill) && "border-red-500 focus-visible:ring-red-500")}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeArrayItem("skills", idx)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addArrayItem("skills")}
                                        className="col-span-full border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                                    >
                                        <Plus className="h-3 w-3 mr-2" /> {t('cvReview.addSkill')}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Languages</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(formData.languages || []).map((lang, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={lang}
                                                onChange={(e) => updateArrayItem("languages", idx, e.target.value)}
                                                placeholder={t('cvReview.langPlaceholder')}
                                                className={cn("bg-slate-50 border-slate-200", isInvalid(lang) && "border-red-500 focus-visible:ring-red-500")}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeArrayItem("languages", idx)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addArrayItem("languages")}
                                        className="col-span-full border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                                    >
                                        <Plus className="h-3 w-3 mr-2" /> {t('cvReview.addLanguage')}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Interests</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(formData.interests || []).map((interest, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={interest}
                                                onChange={(e) => updateArrayItem("interests", idx, e.target.value)}
                                                placeholder={t('cvReview.interestPlaceholder')}
                                                className={cn("bg-slate-50 border-slate-200", isInvalid(interest) && "border-red-500 focus-visible:ring-red-500")}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeArrayItem("interests", idx)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addArrayItem("interests")}
                                        className="col-span-full border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                                    >
                                        <Plus className="h-3 w-3 mr-2" /> {t('cvReview.addInterest')}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Experience */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <Briefcase className="h-4 w-4 text-indigo-600" />
                                {t('cvReview.experience')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {(formData.experience).map((exp, idx) => {
                                const isExpanded = expandedExperience.includes(idx);
                                return (
                                    <div key={idx} className="rounded-xl bg-slate-50 border border-slate-200 transition-all duration-200">
                                        {/* Header */}
                                        <div
                                            className={cn(
                                                "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors rounded-xl",
                                                isExpanded ? "rounded-b-none border-b border-slate-200" : ""
                                            )}
                                            onClick={() => toggleExpand('experience', idx)}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 shrink-0">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                                <div className="truncate">
                                                    <span className="font-semibold text-slate-700">{exp.company || t('cvReview.company')}</span>
                                                    <span className="mx-2 text-slate-300">|</span>
                                                    <span className="text-slate-500">{exp.role || t('cvReview.role')}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => moveItem('experience', idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => moveItem('experience', idx, 'down')}
                                                    disabled={idx === formData.experience.length - 1}
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newExp = [...formData.experience];
                                                        newExp.splice(idx, 1);
                                                        setFormData({ ...formData, experience: newExp });
                                                    }}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        {isExpanded && (
                                            <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.company')}</Label>
                                                        <Input
                                                            value={exp.company}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.experience];
                                                                newExp[idx].company = e.target.value;
                                                                setFormData({ ...formData, experience: newExp });
                                                            }}
                                                            placeholder={t('cvReview.company')}
                                                            className={cn("bg-white", isInvalid(exp.company) && "border-red-500 focus-visible:ring-red-500")}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.role')}</Label>
                                                        <Input
                                                            value={exp.role}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.experience];
                                                                newExp[idx].role = e.target.value;
                                                                setFormData({ ...formData, experience: newExp });
                                                            }}
                                                            placeholder={t('cvReview.role')}
                                                            className={cn("bg-white", isInvalid(exp.role) && "border-red-500 focus-visible:ring-red-500")}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.dates')}</Label>
                                                        <Input
                                                            value={exp.dates}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.experience];
                                                                newExp[idx].dates = e.target.value;
                                                                setFormData({ ...formData, experience: newExp });
                                                            }}
                                                            placeholder="e.g. Jan 2020 - Present"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs uppercase text-slate-500">{t('cvReview.description')}</Label>
                                                            <button
                                                                onClick={(e) => insertBullet(e, 'experience', idx, 'description')}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                                            >
                                                                + Bullet Point
                                                            </button>
                                                        </div>
                                                        <Textarea
                                                            value={exp.description}
                                                            onChange={(e) => {
                                                                const newExp = [...formData.experience];
                                                                newExp[idx].description = e.target.value;
                                                                setFormData({ ...formData, experience: newExp });
                                                            }}
                                                            className="min-h-[100px] bg-white resize-y font-mono text-sm leading-relaxed"
                                                            placeholder={t('cvReview.description')}
                                                        />
                                                        <p className="text-xs text-slate-400 text-right">Markdown supported (• for bullets)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, experience: [...prev.experience, { company: "", role: "", dates: "", description: "" }] }))}
                                className="w-full border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200 py-6"
                            >
                                <Plus className="h-4 w-4 mr-2" /> {t('cvReview.addExperience')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Education */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <GraduationCap className="h-4 w-4 text-indigo-600" />
                                {t('cvReview.education')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {(formData.education || []).map((edu, idx) => {
                                const isExpanded = expandedEducation.includes(idx);
                                return (
                                    <div key={idx} className="rounded-xl bg-slate-50 border border-slate-200 transition-all duration-200">
                                        {/* Header */}
                                        <div
                                            className={cn(
                                                "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors rounded-xl",
                                                isExpanded ? "rounded-b-none border-b border-slate-200" : ""
                                            )}
                                            onClick={() => toggleExpand('education', idx)}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 shrink-0">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                                <div className="truncate">
                                                    <span className="font-semibold text-slate-700">{edu.school || t('cvReview.school')}</span>
                                                    <span className="mx-2 text-slate-300">|</span>
                                                    <span className="text-slate-500">{edu.degree || t('cvReview.degree')}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => moveItem('education', idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => moveItem('education', idx, 'down')}
                                                    disabled={idx === (formData.education?.length || 0) - 1}
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newEdu = [...(formData.education || [])];
                                                        newEdu.splice(idx, 1);
                                                        setFormData({ ...formData, education: newEdu });
                                                    }}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        {isExpanded && (
                                            <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.school')}</Label>
                                                        <Input
                                                            value={edu.school}
                                                            onChange={(e) => {
                                                                const newEdu = [...(formData.education || [])];
                                                                newEdu[idx].school = e.target.value;
                                                                setFormData({ ...formData, education: newEdu });
                                                            }}
                                                            placeholder={t('cvReview.school')}
                                                            className={cn("bg-white", isInvalid(edu.school) && "border-red-500 focus-visible:ring-red-500")}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.degree')}</Label>
                                                        <Input
                                                            value={edu.degree}
                                                            onChange={(e) => {
                                                                const newEdu = [...(formData.education || [])];
                                                                newEdu[idx].degree = e.target.value;
                                                                setFormData({ ...formData, education: newEdu });
                                                            }}
                                                            placeholder={t('cvReview.degree')}
                                                            className={cn("bg-white", isInvalid(edu.degree) && "border-red-500 focus-visible:ring-red-500")}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.dates')}</Label>
                                                        <Input
                                                            value={edu.dates}
                                                            onChange={(e) => {
                                                                const newEdu = [...(formData.education || [])];
                                                                newEdu[idx].dates = e.target.value;
                                                                setFormData({ ...formData, education: newEdu });
                                                            }}
                                                            placeholder="e.g. 2016 - 2020"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs uppercase text-slate-500">{t('cvReview.description')}</Label>
                                                            <button
                                                                onClick={(e) => insertBullet(e, 'education', idx, 'description')}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                                            >
                                                                + Bullet Point
                                                            </button>
                                                        </div>
                                                        <Textarea
                                                            value={edu.description}
                                                            onChange={(e) => {
                                                                const newEdu = [...(formData.education || [])];
                                                                newEdu[idx].description = e.target.value;
                                                                setFormData({ ...formData, education: newEdu });
                                                            }}
                                                            className="min-h-[100px] bg-white resize-y font-mono text-sm leading-relaxed"
                                                            placeholder={t('cvReview.description')}
                                                        />
                                                        <p className="text-xs text-slate-400 text-right">Markdown supported (• for bullets)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, education: [...(prev.education || []), { school: "", degree: "", dates: "", description: "" }] }))}
                                className="w-full border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200 py-6"
                            >
                                <Plus className="h-4 w-4 mr-2" /> {t('cvReview.addEducation')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Certifications */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <Award className="h-4 w-4 text-indigo-600" />
                                {t('cvReview.certifications')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {(formData.certifications || []).map((cert, idx) => {
                                const isExpanded = expandedCertifications.includes(idx);
                                const isStr = typeof cert === 'string';
                                const name = isStr ? cert : cert.name;
                                const url = !isStr ? cert.url : "";

                                return (
                                    <div key={idx} className="rounded-xl bg-slate-50 border border-slate-200 transition-all duration-200">
                                        {/* Header */}
                                        <div
                                            className={cn(
                                                "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors rounded-xl",
                                                isExpanded ? "rounded-b-none border-b border-slate-200" : ""
                                            )}
                                            onClick={() => toggleExpand('certifications', idx)}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 shrink-0">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                                <div className="truncate flex items-center gap-2">
                                                    <span className="font-semibold text-slate-700">{name || t('cvReview.certificationName')}</span>
                                                    {url && <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Link</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => moveItem('certifications', idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => moveItem('certifications', idx, 'down')}
                                                    disabled={idx === (formData.certifications?.length || 0) - 1}
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newCerts = [...(formData.certifications || [])];
                                                        newCerts.splice(idx, 1);
                                                        setFormData({ ...formData, certifications: newCerts });
                                                    }}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        {isExpanded && (
                                            <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2 md:col-span-1">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.certificationName')}</Label>
                                                        <Input
                                                            value={name}
                                                            onChange={(e) => {
                                                                const newCerts = [...(formData.certifications || [])];
                                                                const certItem = newCerts[idx];
                                                                const currentUrl = typeof certItem === 'string' ? "" : certItem.url;
                                                                newCerts[idx] = { name: e.target.value, url: currentUrl };
                                                                setFormData({ ...formData, certifications: newCerts });
                                                            }}
                                                            placeholder={t('cvReview.skillPlaceholder')}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-1">
                                                        <Label className="text-xs uppercase text-slate-500">{t('cvReview.certificationUrl')}</Label>
                                                        <Input
                                                            value={url || ""}
                                                            onChange={(e) => {
                                                                const newCerts = [...(formData.certifications || [])];
                                                                const certItem = newCerts[idx];
                                                                const currentName = typeof certItem === 'string' ? certItem : certItem.name;
                                                                newCerts[idx] = { name: currentName, url: e.target.value };
                                                                setFormData({ ...formData, certifications: newCerts });
                                                            }}
                                                            placeholder="https://..."
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, certifications: [...(prev.certifications || []), { name: "", url: "" }] }))}
                                className="w-full border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200 py-6"
                            >
                                <Plus className="h-4 w-4 mr-2" /> {t('cvReview.addCertification')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
