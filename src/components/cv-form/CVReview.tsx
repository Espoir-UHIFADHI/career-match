import { useState } from "react";
import { Save } from "lucide-react";
import type { ParsedCV } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { Plus, Trash2, User, FileText, Code, Briefcase, GraduationCap, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";

interface CVReviewProps {
    initialData: ParsedCV;
    onSave: (data: ParsedCV) => void;
    onCancel: () => void;
}

export function CVReview({ initialData, onSave, onCancel }: CVReviewProps) {
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Review Extracted Data</h2>
                    <p className="text-slate-600">Verify and edit the information extracted from your CV.</p>
                </div>
                {errors.length > 0 && (
                    <div className="w-full md:w-auto mb-4 md:mb-0 order-last md:order-none">
                        <Alert variant="destructive" className="border-red-500 bg-red-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Missing Information</AlertTitle>
                            <AlertDescription>
                                Please fill in the required fields below to proceed.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 md:flex-none hover:bg-slate-100 text-slate-700 border-slate-300"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save & Continue
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Contact & Summary */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Personal Info Section */}
                    <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                    <User className="h-5 w-5" />
                                </div>
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600">First Name</Label>
                                <Input
                                    value={formData.contact.firstName}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, firstName: e.target.value } })}
                                    className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                    placeholder="First Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Last Name</Label>
                                <Input
                                    value={formData.contact.lastName}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, lastName: e.target.value } })}
                                    className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                    placeholder="Last Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Email</Label>
                                <Input
                                    value={formData.contact.email}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                                    className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                    placeholder="Email Address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Phone</Label>
                                <Input
                                    value={formData.contact.phone}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                                    className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                    placeholder="Phone Number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Location</Label>
                                <Input
                                    value={formData.contact.location}
                                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, location: e.target.value } })}
                                    className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                    placeholder="City, Country"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Professional Summary */}
                    <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                Professional Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                className="min-h-[150px] glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                placeholder="Brief professional summary..."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Experience, Education, Skills */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Skills & Languages */}
                    <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                    <Code className="h-5 w-5" />
                                </div>
                                Skills & Languages
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-slate-600">Skills</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {formData.skills.map((skill, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={skill}
                                                onChange={(e) => updateArrayItem("skills", idx, e.target.value)}
                                                className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                                placeholder="Skill (e.g. React, Python)"
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
                                        className="col-span-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Skill
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <Label className="text-slate-600">Languages</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(formData.languages || []).map((lang, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={lang}
                                                onChange={(e) => updateArrayItem("languages", idx, e.target.value)}
                                                className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                                placeholder="Language (e.g. English C1)"
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
                                        className="col-span-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Language
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <Label className="text-slate-600">Interests (Airport Test)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(formData.interests || []).map((interest, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={interest}
                                                onChange={(e) => updateArrayItem("interests", idx, e.target.value)}
                                                className="glass-input bg-slate-50 border-slate-200 focus:bg-white"
                                                placeholder="Interest (e.g. Marathon, Chess)"
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
                                        className="col-span-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Interest
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Experience */}
                    <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                Experience
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.experience.map((exp, idx) => (
                                <div key={idx} className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4 relative group hover:border-indigo-300 transition-colors">
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
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Company</Label>
                                            <Input
                                                value={exp.company}
                                                onChange={(e) => {
                                                    const newExp = [...formData.experience];
                                                    newExp[idx].company = e.target.value;
                                                    setFormData({ ...formData, experience: newExp });
                                                }}
                                                className="glass-input bg-white"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Role</Label>
                                            <Input
                                                value={exp.role}
                                                onChange={(e) => {
                                                    const newExp = [...formData.experience];
                                                    newExp[idx].role = e.target.value;
                                                    setFormData({ ...formData, experience: newExp });
                                                }}
                                                className="glass-input bg-white"
                                                placeholder="Job Title"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Dates</Label>
                                            <Input
                                                value={exp.dates}
                                                onChange={(e) => {
                                                    const newExp = [...formData.experience];
                                                    newExp[idx].dates = e.target.value;
                                                    setFormData({ ...formData, experience: newExp });
                                                }}
                                                className="glass-input bg-white"
                                                placeholder="e.g. Jan 2020 - Present"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Description</Label>
                                            <Textarea
                                                value={exp.description}
                                                onChange={(e) => {
                                                    const newExp = [...formData.experience];
                                                    newExp[idx].description = e.target.value;
                                                    setFormData({ ...formData, experience: newExp });
                                                }}
                                                className="glass-input bg-white min-h-[100px]"
                                                placeholder="Job description..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, experience: [...prev.experience, { company: "", role: "", dates: "", description: "" }] }))}
                                className="w-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 py-4"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Experience
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Education */}
                    <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                Education
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(formData.education || []).map((edu, idx) => (
                                <div key={idx} className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4 relative group hover:border-indigo-300 transition-colors">
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
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">School</Label>
                                            <Input
                                                value={edu.school}
                                                onChange={(e) => {
                                                    const newEdu = [...(formData.education || [])];
                                                    newEdu[idx].school = e.target.value;
                                                    setFormData({ ...formData, education: newEdu });
                                                }}
                                                className="glass-input bg-white"
                                                placeholder="School Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Degree</Label>
                                            <Input
                                                value={edu.degree}
                                                onChange={(e) => {
                                                    const newEdu = [...(formData.education || [])];
                                                    newEdu[idx].degree = e.target.value;
                                                    setFormData({ ...formData, education: newEdu });
                                                }}
                                                className="glass-input bg-white"
                                                placeholder="Degree"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Dates</Label>
                                            <Input
                                                value={edu.dates}
                                                onChange={(e) => {
                                                    const newEdu = [...(formData.education || [])];
                                                    newEdu[idx].dates = e.target.value;
                                                    setFormData({ ...formData, education: newEdu });
                                                }}
                                                className="glass-input bg-white"
                                                placeholder="e.g. 2016 - 2020"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider">Description</Label>
                                            <Textarea
                                                value={edu.description}
                                                onChange={(e) => {
                                                    const newEdu = [...(formData.education || [])];
                                                    newEdu[idx].description = e.target.value;
                                                    setFormData({ ...formData, education: newEdu });
                                                }}
                                                className="glass-input bg-white min-h-[100px]"
                                                placeholder="Education description..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, education: [...(prev.education || []), { school: "", degree: "", dates: "", description: "" }] }))}
                                className="w-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 py-4"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Education
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
