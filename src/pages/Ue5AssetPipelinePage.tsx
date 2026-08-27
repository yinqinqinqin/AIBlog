import archiveData from "@/data/generated/ue5AssetPipelineArchive.json";
import type { HtmlArchive } from "@/data/htmlArchiveTypes";
import HtmlArchiveReaderPage from "@/pages/HtmlArchiveReaderPage";

export default function Ue5AssetPipelinePage() {
  return (
    <HtmlArchiveReaderPage
      archive={archiveData as HtmlArchive}
      baseRoute="/knowledge-base/ue5-asset-pipeline"
      testId="ue5-asset-pipeline-archive"
    />
  );
}
