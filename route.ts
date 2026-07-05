import { NextResponse } from "next/server";
// @ts-ignore
import PDFParser from "pdf2json";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string;

    if (!file || !jobDescription) {
      return NextResponse.json(
        { error: "Both a PDF resume and Job Description are required." },
        { status: 400 }
      );
    }

    // Convert the uploaded PDF file to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Securely extract raw text using the server-safe pdf2json library
    const resumeText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError);
      });
      
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });

      pdfParser.parseBuffer(buffer);
    });

    // Send the extracted text to your live AI Backend
    const hfResponse = await fetch(
      "https://tanmay-4518-agentic-resume-analyzer.hf.space/analyze",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription,
          resume_text: resumeText,
        }),
        cache: "no-store",
      }
    );

    if (!hfResponse.ok) {
      throw new Error(`AI Backend returned status: ${hfResponse.status}`);
    }

    const data = await hfResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process the request." },
      { status: 500 }
    );
  }
}