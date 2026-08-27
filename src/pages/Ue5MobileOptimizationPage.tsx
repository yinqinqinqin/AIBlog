import archiveData from "@/data/generated/ue5MobileOptimizationArchive.json";
import type { HtmlArchive } from "@/data/htmlArchiveTypes";
import HtmlArchiveReaderPage from "@/pages/HtmlArchiveReaderPage";

export default function Ue5MobileOptimizationPage() {
  return (
    <HtmlArchiveReaderPage
      archive={archiveData as HtmlArchive}
      baseRoute="/knowledge-base/ue5-mobile-optimization"
      testId="ue5-mobile-optimization-archive"
    />
  );
}
