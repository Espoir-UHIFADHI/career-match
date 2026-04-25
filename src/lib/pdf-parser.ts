import * as pdfjsLib from 'pdfjs-dist';

type PdfTextItem = { str?: string };

// Use a bundled worker to avoid CSP/CORS issues with a CDN worker.
// Vite will copy/serve this asset and give us a correct URL.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function extractTextFromPDF(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => (item as PdfTextItem).str || "")
                .join(" ");
            fullText += pageText + "\n";
        }

        return fullText;
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        throw new Error("Failed to extract text from PDF");
    }
}
