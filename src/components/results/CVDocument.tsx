import React from "react";
import { Page, Text, View, Document, StyleSheet, Link } from "@react-pdf/renderer";
import type { ParsedCV } from "../../types";

// Register typical fonts (optional, using Standard fonts by default for simplicity/speed)
// If you have custom fonts, you can register them here.
// For now we use Helvetica which is built-in.

const styles = StyleSheet.create({
    page: {
        padding: "10mm 10mm",
        backgroundColor: "#ffffff",
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#000000",
    },
    header: {
        paddingBottom: 5,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#1e293b",
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: 2,
        color: "#0f172a",
        fontFamily: "Helvetica-Bold",
    },
    headline: {
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "#3730a3",
        marginBottom: 4,
        fontFamily: "Helvetica-Bold",
    },
    contactInfo: {
        flexDirection: "row",
        flexWrap: "wrap",
        fontSize: 9,
        color: "#475569",
    },
    contactItem: {
        marginRight: 8,
    },
    section: {
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "#3730a3",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e7ff",
        marginBottom: 4,
        paddingBottom: 1,
        fontFamily: "Helvetica-Bold",
    },
    text: {
        fontSize: 10,
        lineHeight: 1.3,
        color: "#1e293b",
        textAlign: "justify",
    },
    experienceItem: {
        marginBottom: 8,
    },
    jobHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 1,
    },
    role: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#0f172a",
        fontFamily: "Helvetica-Bold",
    },
    dates: {
        fontSize: 9,
        color: "#475569",
    },
    company: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#4338ca",
        marginBottom: 2,
        fontFamily: "Helvetica-Bold",
    },
    bulletPoint: {
        flexDirection: "row",
        marginBottom: 1,
    },
    bullet: {
        width: 8,
        fontSize: 10,
        color: "#0f172a",
        fontWeight: "bold",
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: "#334155",
        lineHeight: 1.25,
    },
    skillRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    skillLabel: {
        width: 140,
        fontWeight: "bold",
        fontSize: 9,
        color: "#0f172a",
        fontFamily: "Helvetica-Bold",
    },
    skillValue: {
        flex: 1,
        fontSize: 9,
        color: "#334155",
    },
    educationItem: {
        marginBottom: 6,
    }
});

interface CVDocumentProps {
    data: ParsedCV;
    language?: "English" | "French";
}

const SECTION_HEADERS = {
    English: {
        summary: "Professional Summary",
        experience: "Experience",
        education: "Education",
        skills: "Skills",
        softSkills: "Soft Skills",
        languages: "Languages",
        certifications: "Certifications",
        interests: "Interests"
    },
    French: {
        summary: "Résumé professionnel",
        experience: "Expérience",
        education: "Formation",
        skills: "Compétences techniques",
        softSkills: "Compétences comportementales",
        languages: "Langues",
        certifications: "Certifications",
        interests: "Centres d'intérêt"
    }
};

// Simple clean function for markdown to plain text
// React-pdf <Text> doesn't support markdown, so we strip simple syntax
const cleanMarkdown = (text: any): string => {
    if (!text) return '';
    const textStr = typeof text === 'string' ? text : String(text);
    return textStr
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();
};

const getExperiencePoints = (text: any): string[] => {
    let str = cleanMarkdown(text);
    if (!str) return [];
    if (str.includes('\n')) {
        return str.split('\n').filter(line => line.trim());
    }
    str = str.replace(/(^|\s)([•-])\s/g, '\n$2 ');
    return str.split('\n').filter(line => line.trim());
};

export const CVDocument: React.FC<CVDocumentProps> = ({ data, language = "French" }) => {
    const headers = SECTION_HEADERS[language];

    if (!data || !data.contact) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <Text>Error: No Data</Text>
                </Page>
            </Document>
        );
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{data.contact?.firstName} {data.contact?.lastName}</Text>
                    {data.headline && (
                        <Text style={styles.headline}>{cleanMarkdown(data.headline)}</Text>
                    )}
                    <View style={styles.contactInfo}>
                        {data.contact?.email && <Text style={styles.contactItem}>{data.contact.email} • </Text>}
                        {data.contact?.phone && <Text style={styles.contactItem}>{data.contact.phone} • </Text>}
                        {data.contact?.location && <Text style={styles.contactItem}>{data.contact.location} </Text>}
                        {/* Links are clickable in PDF */}
                        {data.contact?.linkedin && (
                            <Link src={data.contact.linkedin} style={styles.contactItem}>
                                • LinkedIn
                            </Link>
                        )}
                        {data.contact?.website && (
                            <Link src={data.contact.website} style={styles.contactItem}>
                                • Portfolio
                            </Link>
                        )}
                    </View>
                </View>

                {/* Summary */}
                {data.summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{headers.summary}</Text>
                        <Text style={styles.text}>{cleanMarkdown(data.summary)}</Text>
                    </View>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{headers.experience}</Text>
                        {data.experience.map((exp, i) => (
                            <View key={i} style={styles.experienceItem}>
                                <View style={styles.jobHeader}>
                                    <Text style={styles.role}>{cleanMarkdown(exp.role)}</Text>
                                    <Text style={styles.dates}>{exp.dates}</Text>
                                </View>
                                <Text style={styles.company}>{cleanMarkdown(exp.company)}</Text>
                                <View>
                                    {getExperiencePoints(exp.description).map((line, idx) => (
                                        <View key={idx} style={styles.bulletPoint}>
                                            <Text style={styles.bullet}>-</Text>
                                            <Text style={styles.bulletText}>{line.trim().replace(/^[-•*]\s*/, '')}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{headers.education}</Text>
                        {data.education.map((edu, i) => (
                            <View key={i} style={styles.educationItem}>
                                <View style={styles.jobHeader}>
                                    <Text style={styles.role}>{cleanMarkdown(edu.school)}</Text>
                                    <Text style={styles.dates}>{edu.dates}</Text>
                                </View>
                                <Text style={styles.text}>{cleanMarkdown(edu.degree)}</Text>
                                {edu.description && <Text style={{ ...styles.text, fontSize: 10, marginTop: 2, color: "#475569" }}>{cleanMarkdown(edu.description)}</Text>}
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills */}
                <View style={styles.section}>
                    {data.skills && data.skills.length > 0 && (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>{headers.skills}:</Text>
                            <Text style={styles.skillValue}>
                                {cleanMarkdown(data.skills.join(" • "))}
                            </Text>
                        </View>
                    )}
                    {data.softSkills && data.softSkills.length > 0 && (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>{headers.softSkills}:</Text>
                            <Text style={styles.skillValue}>{cleanMarkdown(data.softSkills.join(" • "))}</Text>
                        </View>
                    )}
                    {data.languages && data.languages.length > 0 && (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>{headers.languages}:</Text>
                            <Text style={styles.skillValue}>{cleanMarkdown(data.languages.join(" • "))}</Text>
                        </View>
                    )}
                    {data.certifications && data.certifications.length > 0 && (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>{headers.certifications}:</Text>
                            <Text style={styles.skillValue}>{cleanMarkdown(data.certifications.join(" • "))}</Text>
                        </View>
                    )}
                    {data.interests && data.interests.length > 0 && (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>{headers.interests}:</Text>
                            <Text style={styles.skillValue}>{cleanMarkdown(data.interests.join(" • "))}</Text>
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};
