import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportData } from "./types";

// ============================================================
// Bagian FOTO saja (1 foto per halaman, caption bold di atas).
// Lampiran (PDF/gambar) TIDAK di sini — digabung terpisah via pdf-lib
// di buildMergedPdf.tsx, supaya file PDF lampiran bisa disisipkan utuh.
// ============================================================

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  caption: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 14,
    color: "#111111",
  },
  photoBox: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  photo: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
});

export function ReportPDF({ data }: { data: ReportData }) {
  const { photos, meta } = data;

  return (
    <Document title={meta.title} author={meta.engineer || "PT CSI"}>
      {photos.map((p) => (
        <Page key={p.id} size="A4" style={styles.page}>
          <Text style={styles.caption}>{p.caption || "\u2014"}</Text>
          <View style={styles.photoBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.photo} src={p.dataUrl} />
          </View>
        </Page>
      ))}
    </Document>
  );
}
