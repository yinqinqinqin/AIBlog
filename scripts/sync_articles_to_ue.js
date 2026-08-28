import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ueRoot = "/Users/bytedance/Desktop/PracticeSpace/UE/整合";

const mappings = [
  ["articles/portfolio/Technical Documentation for Portfolio/stylized-anisotropy.md", "Technical Documentation for Portfolio/Anisortropy.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/electric-dreams-optimization.md", "Technical Documentation for Portfolio/ElectricDreams优化.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/matcap.md", "Technical Documentation for Portfolio/MatCap.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/npr-render.md", "Technical Documentation for Portfolio/NPRRender.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/pbr.md", "Technical Documentation for Portfolio/PBR.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/pivot-point.md", "Technical Documentation for Portfolio/PivotPoint.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/random-grain.md", "Technical Documentation for Portfolio/random grain.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/sky-system.md", "Technical Documentation for Portfolio/SkySystem.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/texture-handle.md", "Technical Documentation for Portfolio/TextureHandle.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/uv-anim.md", "Technical Documentation for Portfolio/UVAnim.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/vat.md", "Technical Documentation for Portfolio/VAT.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/volume-cloud.md", "Technical Documentation for Portfolio/VolumeCloud.md"],
  ["articles/portfolio/Technical Documentation for Portfolio/wave.md", "Technical Documentation for Portfolio/Wave.md"],
  ["articles/learning-notes/ErrorNote/error-note-normal-map-srgb.md", "学习记录/ErrorNote/ErrorNote.md"],
  ["articles/learning-notes/Interview/interview-answer.md", "学习记录/Interview/InterviewAnswer.md"],
  ["articles/learning-notes/Interview/interview-question.md", "学习记录/Interview/InterviewQuestion.md"],
  ["articles/learning-notes/Interview/interview-question-self.md", "学习记录/Interview/InterviewQuestionSelf.md"],
  ["articles/learning-notes/Interview/interview-web.md", "学习记录/Interview/InterviewWeb.md"],
  ["articles/learning-notes/KeyWordAndNode/keyword-node-keyword.md", "学习记录/KeyWordAndNode/KeyWord.md"],
  ["articles/learning-notes/KeyWordAndNode/keyword-node-node.md", "学习记录/KeyWordAndNode/Node.md"],
  ["articles/learning-notes/RenderTheory/render-theory-direction.md", "学习记录/RenderTheory/Direction.md"],
  ["articles/learning-notes/RenderTheory/render-theory-light.md", "学习记录/RenderTheory/Light.md"],
  ["articles/learning-notes/RenderTheory/render-theory-mvp.md", "学习记录/RenderTheory/MVP.md"],
  ["articles/learning-notes/RenderTheory/render-theory-other.md", "学习记录/RenderTheory/Other.md"],
  ["articles/learning-notes/RenderTheory/render-theory-parallax.md", "学习记录/RenderTheory/Parallax.md"],
  ["articles/learning-notes/RenderTheory/render-theory-pbr-bxdf.md", "学习记录/RenderTheory/PBR-BxDF.md"],
  ["articles/learning-notes/RenderTheory/render-theory-pbr.md", "学习记录/RenderTheory/PBR.md"],
  ["articles/learning-notes/RenderTheory/render-theory-postprocess.md", "学习记录/RenderTheory/Postprocess.md"],
  ["articles/learning-notes/RenderTheory/render-theory-render-line.md", "学习记录/RenderTheory/RenderLine.md"],
  ["articles/learning-notes/RenderTheory/RenderPipe/render-pipe-unity-custom-render-pipeline.md", "学习记录/RenderTheory/RenderPipe/unity自定义渲染管线.md"],
  ["articles/learning-notes/RenderTheory/RenderPipe/render-pipe-render-pipeline.md", "学习记录/RenderTheory/RenderPipe/渲染管线.md"],
  ["articles/learning-notes/RenderTheory/RenderPipe/render-pipe-custom-render-pipeline.md", "学习记录/RenderTheory/RenderPipe/自定义管线.md"],
  ["articles/learning-notes/RenderTheory/render-theory-shadow.md", "学习记录/RenderTheory/Shadow.md"],
  ["articles/learning-notes/RenderTheory/render-theory-sky-sphere.md", "学习记录/RenderTheory/SkySphere.md"],
  ["articles/learning-notes/RenderTheory/render-theory-toon-map.md", "学习记录/RenderTheory/ToonMap.md"],
  ["articles/learning-notes/UE编辑器插件C++/ue-editor-plugin-slate-workflow.md", "学习记录/UE编辑器插件C++/Slate与工作流开发.md"],
  ["articles/learning-notes/性能优化/performance-electric-dreams-guide.md", "学习记录/性能优化/Electric_Dreams_性能优化作品集执行手册.md"],
  ["articles/learning-notes/性能优化/performance-unreal-insights.md", "学习记录/性能优化/UnrealInsights.md"],
  ["articles/learning-notes/性能优化/performance-console-commands.md", "学习记录/性能优化/命令行命令.md"],
  ["articles/learning-notes/性能优化/performance-optimization.md", "学习记录/性能优化/性能优化.md"],
  ["articles/learning-notes/性能优化/performance-optimization-system.md", "学习记录/性能优化/优化系统.md"],
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
