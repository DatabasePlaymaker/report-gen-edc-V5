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
// Caption per-foto yang kosong akan memakai defaultCaption sebagai fallback.
// Lampiran (PDF/gambar) digabung terpisah via pdf-lib di buildMergedPdf.tsx.
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
  const { photos, meta, defaultCaption } = data;

  return (
    <Document title={meta.title} author={meta.engineer || "PT CSI"}>
      {photos.map((p) => {
        // Prioritas: caption manual foto → kalau kosong, pakai caption default → kalau itu juga kosong, em-dash.
        const captionText = p.caption.trim() || defaultCaption.trim() || "\u2014";
        return (
          <Page key={p.id} size="A4" style={styles.page}>
            <Text style={styles.caption}>{captionText}</Text>
            <View style={styles.photoBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={styles.photo} src={p.dataUrl} />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}