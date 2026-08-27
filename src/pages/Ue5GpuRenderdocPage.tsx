import archiveData from "@/data/generated/ue5GpuRenderdocArchive.json";
import type { HtmlArchive } from "@/data/htmlArchiveTypes";
import HtmlArchiveReaderPage from "@/pages/HtmlArchiveReaderPage";

export default function Ue5GpuRenderdocPage() {
  return (
    <HtmlArchiveReaderPage
      archive={archiveData as HtmlArchive}
      baseRoute="/knowledge-base/ue5-gpu-renderdoc"
      testId="ue5-gpu-renderdoc-archive"
    />
  );
}
