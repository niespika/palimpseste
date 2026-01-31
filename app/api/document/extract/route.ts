import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Fichier manquant." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    const text = data.text?.trim() ?? "";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: "Extraction PDF échouée" },
      { status: 500 }
    );
  }
}
