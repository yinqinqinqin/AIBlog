import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ueRoot = "/Users/bytedance/Desktop/PracticeSpace/UE/整合";

const mappings = [
  ["src/content/portfolio/stylized-anisotropy.md", "Technical Documentation for Portfolio/Anisortropy.md"],
  ["src/content/portfolio/electric-dreams-optimization.md", "Technical Documentation for Portfolio/ElectricDreams优化.md"],
  ["src/content/portfolio/matcap.md", "Technical Documentation for Portfolio/MatCap.md"],
  ["src/content/portfolio/npr-render.md", "Technical Documentation for Portfolio/NPRRender.md"],
  ["src/content/portfolio/pbr.md", "Technical Documentation for Portfolio/PBR.md"],
  ["src/content/portfolio/pivot-point.md", "Technical Documentation for Portfolio/PivotPoint.md"],
  ["src/content/portfolio/random-grain.md", "Technical Documentation for Portfolio/random grain.md"],
  ["src/content/portfolio/sky-system.md", "Technical Documentation for Portfolio/SkySystem.md"],
  ["src/content/portfolio/texture-handle.md", "Technical Documentation for Portfolio/TextureHandle.md"],
  ["src/content/portfolio/uv-anim.md", "Technical Documentation for Portfolio/UVAnim.md"],
  ["src/content/portfolio/vat.md", "Technical Documentation for Portfolio/VAT.md"],
  ["src/content/portfolio/volume-cloud.md", "Technical Documentation for Portfolio/VolumeCloud.md"],
  ["src/content/portfolio/wave.md", "Technical Documentation for Portfolio/Wave.md"],
  ["src/content/learning-notes/error-note-normal-map-srgb.md", "学习记录/ErrorNote/ErrorNote.md"],
  ["src/content/learning-notes/interview-answer.md", "学习记录/Interview/InterviewAnswer.md"],
  ["src/content/learning-notes/interview-question.md", "学习记录/Interview/InterviewQuestion.md"],
  ["src/content/learning-notes/interview-question-self.md", "学习记录/Interview/InterviewQuestionSelf.md"],
  ["src/content/learning-notes/interview-web.md", "学习记录/Interview/InterviewWeb.md"],
  ["src/content/learning-notes/keyword-node-keyword.md", "学习记录/KeyWordAndNode/KeyWord.md"],
  ["src/content/learning-notes/keyword-node-node.md", "学习记录/KeyWordAndNode/Node.md"],
  ["src/content/learning-notes/render-theory-direction.md", "学习记录/RenderTheory/Direction.md"],
  ["src/content/learning-notes/render-theory-light.md", "学习记录/RenderTheory/Light.md"],
  ["src/content/learning-notes/render-theory-mvp.md", "学习记录/RenderTheory/MVP.md"],
  ["src/content/learning-notes/render-theory-other.md", "学习记录/RenderTheory/Other.md"],
  ["src/content/learning-notes/render-theory-parallax.md", "学习记录/RenderTheory/Parallax.md"],
  ["src/content/learning-notes/render-theory-pbr-bxdf.md", "学习记录/RenderTheory/PBR-BxDF.md"],
  ["src/content/learning-notes/render-theory-pbr.md", "学习记录/RenderTheory/PBR.md"],
  ["src/content/learning-notes/render-theory-postprocess.md", "学习记录/RenderTheory/Postprocess.md"],
  ["src/content/learning-notes/render-theory-render-line.md", "学习记录/RenderTheory/RenderLine.md"],
  ["src/content/learning-notes/render-pipe-unity-custom-render-pipeline.md", "学习记录/RenderTheory/RenderPipe/unity自定义渲染管线.md"],
  ["src/content/learning-notes/render-pipe-render-pipeline.md", "学习记录/RenderTheory/RenderPipe/渲染管线.md"],
  ["src/content/learning-notes/render-pipe-custom-render-pipeline.md", "学习记录/RenderTheory/RenderPipe/自定义管线.md"],
  ["src/content/learning-notes/render-theory-shadow.md", "学习记录/RenderTheory/Shadow.md"],
  ["src/content/learning-notes/render-theory-sky-sphere.md", "学习记录/RenderTheory/SkySphere.md"],
  ["src/content/learning-notes/render-theory-toon-map.md", "学习记录/RenderTheory/ToonMap.md"],
  ["src/content/learning-notes/ue-editor-plugin-slate-workflow.md", "学习记录/UE编辑器插件C++/Slate与工作流开发.md"],
  ["src/content/learning-notes/performance-electric-dreams-guide.md", "学习记录/性能优化/Electric_Dreams_性能优化作品集执行手册.md"],
  ["src/content/learning-notes/performance-unreal-insights.md", "学习记录/性能优化/UnrealInsights.md"],
  ["src/content/learning-notes/performance-console-commands.md", "学习记录/性能优化/命令行命令.md"],
  ["src/content/learning-notes/performance-optimization.md", "学习记录/性能优化/性能优化.md"],
  ["src/content/learning-notes/performance-optimization-system.md", "学习记录/性能优化/优化系统.md"],
];

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function resolveMapping([source, target]) {
  return [path.join(projectRoot, source), path.join(ueRoot, target)];
}

const checkOnly = process.argv.includes("--check");
let copied = 0;

for (const mapping of mappings) {
  const [source, target] = resolveMapping(mapping);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing source: ${source}`);
  }

  if (!fs.existsSync(target)) {
    throw new Error(`Missing target: ${target}`);
  }

  if (checkOnly) {
    console.log(`OK ${path.relative(projectRoot, source)} -> ${target}`);
    continue;
  }

  fs.copyFileSync(source, target);

  if (sha256(source) !== sha256(target)) {
    throw new Error(`Verification failed: ${source} -> ${target}`);
  }

  copied += 1;
}

console.log(checkOnly ? `checked=${mappings.length}` : `copied=${copied}`);
