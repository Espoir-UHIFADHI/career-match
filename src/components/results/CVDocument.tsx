import React, { useMemo } from "react";
import { Page, Text, View, Document, StyleSheet, Link } from "@react-pdf/renderer";
import type { ParsedCV } from "../../types";

const createStyles = (density: 'comfortable' | 'standard' | 'compact') => {
    // Slightly relaxed Compact mode values ("Air out" request)
    // while counting on the layout change (bottom row) to save vertical space
    const config = {
        comfortable: {
            padding: "15mm 15mm",
            baseFontSize: 10,
            headerTitle: 20,
            headerSubtitle: 12,
            sectionMargin: 10,
            itemMargin: 8,
            leading: 1.4,
            badgePadding: "2 5",
        },
        standard: {
            padding: "10mm 12mm",
            baseFontSize: 9,
            headerTitle: 18,
            headerSubtitle: 11,
            sectionMargin: 7, // Increased from 6
            itemMargin: 5,   // Increased from 4
            leading: 1.3,
            badgePadding: "1 4",
        },
        compact: {
            padding: "8mm 10mm",
            baseFontSize: 8,
            headerTitle: 16,
            headerSubtitle: 9,
            sectionMargin: 5,     // Increased from 4 "Air out"
            itemMargin: 3.5,      // Increased from 3
            leading: 1.25,        // Slightly relaxed from 1.2
            badgePadding: "1 2",
        }
    }[density];

    return StyleSheet.create({
        page: {
            padding: config.padding,
            backgroundColor: "#ffffff",
            fontFamily: "Helvetica",
            fontSize: config.baseFontSize,
            color: "#1e293b",
            lineHeight: config.leading,
        },
        header: {
            paddingBottom: density === 'compact' ? 4 : 6,
            marginBottom: density === 'compact' ? 6 : 10,
            borderBottomWidth: 1,
            borderBottomColor: "#1e293b",
        },
        name: {
            fontSize: config.headerTitle,
            fontWeight: "bold",
            textTransform: "uppercase",
            marginBottom: 2,
            color: "#0f172a",
            fontFamily: "Helvetica-Bold",
            lineHeight: 1,
        },
        headline: {
            fontSize: config.headerSubtitle,
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "#3730a3",
            marginBottom: density === 'compact' ? 3 : 6,
            fontFamily: "Helvetica-Bold",
        },
        contactInfo: {
            flexDirection: "row",
            flexWrap: "wrap",
            fontSize: config.baseFontSize - 1,
            color: "#475569",
            marginTop: 2,
        },
        contactItem: {
            marginRight: 10,
            marginBottom: 2,
        },
        section: {
            marginBottom: config.sectionMargin,
        },
        sectionTitle: {
            fontSize: config.baseFontSize + 1,
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "#3730a3",
            borderBottomWidth: 0.75,
            borderBottomColor: "#e0e7ff",
            marginBottom: density === 'compact' ? 2 : 4,
            paddingBottom: 1,
            fontFamily: "Helvetica-Bold",
        },
        text: {
            fontSize: config.baseFontSize,
            color: "#334155",
            textAlign: "justify",
        },
        experienceItem: {
            marginBottom: config.itemMargin,
        },
        jobHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 1,
        },
        role: {
            fontSize: config.baseFontSize + 0.5,
            fontWeight: "bold",
            color: "#0f172a",
            fontFamily: "Helvetica-Bold",
        },
        dates: {
            fontSize: config.baseFontSize - 1,
            color: "#64748b",
            fontWeight: "medium",
        },
        company: {
            fontSize: config.baseFontSize,
            fontWeight: "bold",
            color: "#4338ca",
            marginBottom: 1.5,
            fontFamily: "Helvetica-Bold",
        },
        bulletPoint: {
            flexDirection: "row",
            marginBottom: 1,
        },
        bullet: {
            width: density === 'compact' ? 6 : 8,
            fontSize: config.baseFontSize,
            color: "#4338ca",
            fontWeight: "bold",
        },
        bulletText: {
            flex: 1,
            fontSize: config.baseFontSize,
            color: "#334155",
        },
        grid: {
            flexDirection: 'row',
            marginTop: density === 'compact' ? 3 : 5,
        },
        leftColumn: {
            width: '60%',
            paddingRight: 8,
        },
        rightColumn: {
            width: '40%',
        },
        skillSection: {
            marginBottom: config.sectionMargin,
        },
        skillTitle: {
            fontSize: config.baseFontSize,
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "#3730a3",
            borderBottomWidth: 0.5,
            borderBottomColor: "#e0e7ff",
            marginBottom: 2,
            paddingBottom: 1,
            fontFamily: "Helvetica-Bold",
        },
        badgesContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        badge: {
            backgroundColor: "#f8fafc",
            border: "0.5 solid #e2e8f0",
            borderRadius: 2,
            padding: config.badgePadding,
            marginRight: 3,
            marginBottom: 3,
            fontSize: config.baseFontSize - 1,
            color: "#334155",
        },
        badgeText: {
            fontFamily: "Helvetica-Bold",
        },
        educationItem: {
            marginBottom: config.itemMargin,
        },
        // Footer grid for Languages/Interests
        footerGrid: {
            flexDirection: 'row',
            borderTopWidth: 0.5,
            borderTopColor: '#f1f5f9',
            marginTop: 4,
            paddingTop: 4,
        },
        footerCol: {
            flex: 1,
            paddingRight: 4,
        },
        footerTitle: {
            fontSize: config.baseFontSize,
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "#3730a3",
            marginBottom: 2,
            fontFamily: "Helvetica-Bold",
        }
    });
};

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

const calculateDensity = (data: ParsedCV) => {
    let charCount = 0;
    if (data.summary) charCount += data.summary.length;
    data.experience?.forEach(exp => {
        charCount += (exp.role?.length || 0) + (exp.company?.length || 0) + (exp.description?.length || 0);
    });
    data.education?.forEach(edu => {
        charCount += (edu.school?.length || 0) + (edu.degree?.length || 0) + (edu.description?.length || 0);
    });
    charCount += (data.skills?.join('').length || 0);

    // Stricter thresholds for PDF to ensure safety
    if (charCount < 1600) return 'comfortable';
    if (charCount < 2600) return 'standard';
    return 'compact';
};

export const CVDocument: React.FC<CVDocumentProps> = ({ data, language = "French" }) => {
    const headers = SECTION_HEADERS[language];

    // Determine styles based on content density
    const styles = useMemo(() => {
        const density = calculateDensity(data);
        return createStyles(density);
    }, [data]);

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
                                            <Text style={styles.bullet}>•</Text>
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
                                {edu.description && <Text style={{ ...styles.text, fontSize: styles.text.fontSize, marginTop: 1, color: "#475569" }}>{cleanMarkdown(edu.description)}</Text>}
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills - Tech vs Soft */}
                <View style={styles.grid}>
                    {/* Left Column (Technical) */}
                    <View style={styles.leftColumn}>
                        {data.skills && data.skills.length > 0 && (
                            <View style={styles.skillSection}>
                                <Text style={styles.skillTitle}>{headers.skills}</Text>
                                <View style={styles.badgesContainer}>
                                    {data.skills.map((skill, idx) => (
                                        <View key={idx} style={styles.badge}>
                                            <Text style={styles.badgeText}>{cleanMarkdown(skill)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Right Column (Soft) */}
                    <View style={styles.rightColumn}>
                        {data.softSkills && data.softSkills.length > 0 && (
                            <View style={styles.skillSection}>
                                <Text style={styles.skillTitle}>{headers.softSkills}</Text>
                                <View style={styles.badgesContainer}>
                                    {data.softSkills.map((skill, idx) => (
                                        <View key={idx} style={{ ...styles.badge, backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' }}>
                                            <Text style={{ ...styles.badgeText, color: '#3730a3' }}>{cleanMarkdown(skill)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer Section: Languages, Certs, Interests */}
                <View style={styles.footerGrid}>
                    {data.languages && data.languages.length > 0 && (
                        <View style={styles.footerCol}>
                            <Text style={styles.footerTitle}>{headers.languages}</Text>
                            {data.languages.map((lang, idx) => (
                                <Text key={idx} style={styles.text}>
                                    • {cleanMarkdown(lang)}
                                </Text>
                            ))}
                        </View>
                    )}
                    {data.certifications && data.certifications.length > 0 && (
                        <View style={styles.footerCol}>
                            <Text style={styles.footerTitle}>{headers.certifications}</Text>
                            {data.certifications.map((cert, idx) => (
                                <Text key={idx} style={styles.text}>
                                    • {cleanMarkdown(cert)}
                                </Text>
                            ))}
                        </View>
                    )}
                    {data.interests && data.interests.length > 0 && (
                        <View style={styles.footerCol}>
                            <Text style={styles.footerTitle}>{headers.interests}</Text>
                            <Text style={styles.text}>{cleanMarkdown(data.interests.join(", "))}</Text>
                        </View>
                    )}
                </View>

            </Page>
        </Document>
    );
};
