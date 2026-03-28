import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

const DATASET_PATH = path.join(process.cwd(), "Data", "Estai_dataset_main.xlsx");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Read existing workbook or create new one
    let workbook: XLSX.WorkBook;
    let sheet: XLSX.WorkSheet;
    let existingData: Record<string, unknown>[] = [];

    if (fs.existsSync(DATASET_PATH)) {
      const buffer = fs.readFileSync(DATASET_PATH);
      workbook = XLSX.read(buffer, { type: "buffer" });
      sheet = workbook.Sheets[workbook.SheetNames[0]];
      existingData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        raw: false,
      });
    } else {
      workbook = XLSX.utils.book_new();
      existingData = [];
    }

    // Build new row matching dataset columns
    const newRow: Record<string, unknown> = {
      property_type: body.propertyType ?? "",
      city: body.city ?? "",
      cent: body.cent ?? 0,
      sqft: body.sqft ?? 0,
      total_floors: body.totalFloors ?? 0,
      bedroom: body.bedrooms ?? 0,
      bathroom: body.bathrooms ?? 0,
      rooms: body.rooms ?? 0,
      furnished: body.furnished ?? 0,
      "distance_from_town(meters)": body.distanceFromTown ?? 0,
      nearest_town: body.nearestTownName ?? "",
      road_facility: body.roadFacility ?? "",
      nearest_landmark: body.nearestLandmark ?? "",
      total_price: body.totalPrice ?? 0,
      price_per_cent: body.pricePerCent ?? 0,
      latitude: body.lat ?? 0,
      longitude: body.lng ?? 0,
      mode: body.mode ?? "sale",
      title: body.title ?? "",
      description: body.description ?? "",
      contact_name: body.contactName ?? "",
      contact_phone: body.contactPhone ?? "",
      contact_email: body.contactEmail ?? "",
      posted_date: new Date().toISOString(),
    };

    existingData.push(newRow);

    // Create new sheet and replace in workbook
    const newSheet = XLSX.utils.json_to_sheet(existingData);
    const sheetName = workbook.SheetNames[0] || "Sheet1";

    if (workbook.SheetNames.length === 0) {
      XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
    } else {
      workbook.Sheets[sheetName] = newSheet;
    }

    // Write back
    const outputBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    fs.writeFileSync(DATASET_PATH, outputBuffer);

    return NextResponse.json({ success: true, message: "Property saved to dataset." });
  } catch (error: unknown) {
    console.error("Failed to save property:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
