import { useState } from "react";
import { Save, Upload } from "lucide-react";
import type { ParsedCV } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { Plus, Trash2, User, FileText, Code, Briefcase, GraduationCap, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { useTranslation } from "../../hooks/useTranslation";

interface CVReviewProps {
    initialData: ParsedCV;
    onSave: (data: ParsedCV) => void;
    onCancel: () => void;
}

export function CVReview({ initialData, onSave, onCancel }: CVReviewProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<ParsedCV>(initialData);


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
        if (validateForm()) {
            onSave(formData);
        } else {
            // Scroll to top to show errors
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('cvReview.lastName')}</Label>
                                <Input
                                    value={formData.contact.lastName}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, lastName: e.target.value } })}
                                    placeholder={t('cvReview.lastName')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('cvReview.email')}</Label>
                                <Input
                                    value={formData.contact.email}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                                    placeholder={t('cvReview.email')}
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
                                className="min-h-[150px] resize-none"
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
                                                className="bg-slate-50 border-slate-200"
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
                                                className="bg-slate-50 border-slate-200"
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
                                                className="bg-slate-50 border-slate-200"
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
                            {formData.experience.map((exp, idx) => (
                                <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 relative group hover:border-indigo-200 transition-colors">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const newExp = [...formData.experience];
                                            newExp.splice(idx, 1);
                                            setFormData({ ...formData, experience: newExp });
                                        }}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

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
                                                className="bg-white"
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
                                                className="bg-white"
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
                                            <Label className="text-xs uppercase text-slate-500">{t('cvReview.description')}</Label>
                                            <Textarea
                                                value={exp.description}
                                                onChange={(e) => {
                                                    const newExp = [...formData.experience];
                                                    newExp[idx].description = e.target.value;
                                                    setFormData({ ...formData, experience: newExp });
                                                }}
                                                className="min-h-[100px] bg-white resize-y"
                                                placeholder={t('cvReview.description')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                            {(formData.education || []).map((edu, idx) => (
                                <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 relative group hover:border-indigo-200 transition-colors">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const newEdu = [...(formData.education || [])];
                                            newEdu.splice(idx, 1);
                                            setFormData({ ...formData, education: newEdu });
                                        }}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

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
                                                className="bg-white"
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
                                                className="bg-white"
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
                                            <Label className="text-xs uppercase text-slate-500">{t('cvReview.description')}</Label>
                                            <Textarea
                                                value={edu.description}
                                                onChange={(e) => {
                                                    const newEdu = [...(formData.education || [])];
                                                    newEdu[idx].description = e.target.value;
                                                    setFormData({ ...formData, education: newEdu });
                                                }}
                                                className="min-h-[100px] bg-white resize-y"
                                                placeholder={t('cvReview.description')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                </div>
            </div>
        </div >
    );
}
