import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomInterviewStore } from "@/store/customInterviewStore";
import { useStudyPlanStore } from "@/store/studyPlanStore";
import { useInterviewNotesStore } from "@/store/interviewNotesStore";
import { useThemeStore } from "@/store/themeStore";
import AboutPage from "./AboutPage";
import CategoryPage from "./CategoryPage";
import CustomInterviewWikiPage from "./CustomInterviewWikiPage";
import GameTaOriginalFormatPage from "./GameTaOriginalFormatPage";
import Ue5GpuRenderdocPage from "./Ue5GpuRenderdocPage";
import Ue5MobileOptimizationPage from "./Ue5MobileOptimizationPage";
import HomePage from "./HomePage";
import ArticlePage from "./ArticlePage";
import TechnicalArtInterviewWikiPage from "./TechnicalArtInterviewWikiPage";
import gameTaHtmlArchive from "@/data/generated/gameTaHtmlArchive.json";
import mihoyoInterviewBank from "@/data/generated/mihoyoInterviewBank.json";
import ue5AssetPipelineArchive from "@/data/generated/ue5AssetPipelineArchive.json";
import ue5GpuRenderdocArchive from "@/data/generated/ue5GpuRenderdocArchive.json";
import ue5MobileOptimizationArchive from "@/data/generated/ue5MobileOptimizationArchive.json";
import type { InterviewResourceBank } from "@/data/interviewResourceTypes";
import SiteHeader from "@/components/SiteHeader";
import { navItems, siteMeta } from "@/data/blog";

vi.mock("@/components/Particles", () => ({
  default: () => <div data-testid="particles-mock" />,
}));

describe("blog pages", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollTo", vi.fn());
    useStudyPlanStore.persist.clearStorage();
    useCustomInterviewStore.persist.clearStorage();
    useInterviewNotesStore.persist.clearStorage();
    useInterviewNotesStore.setState({ notes: {} });
    useCustomInterviewStore.setState({ questions: [] });
    useStudyPlanStore.setState({
      tasks: [],
      selectedTaskId: null,
    });
    useThemeStore.setState({ theme: "dark" });
  });

  it("renders home page sections", () => {
    render(
      <MemoryRouter>
        <SiteHeader brand={siteMeta.brand} navItems={navItems} />
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "首页", current: "page" })).toBeInTheDocument();
    expect(screen.getAllByText("学习记录").length).toBeGreaterThan(0);
    expect(screen.getAllByText("作品集").length).toBeGreaterThan(0);
    expect(screen.getAllByText("学习计划").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "关于" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "关于我" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "置顶文章" })).not.toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "博客导航" });
    const navButtons = Array.from(nav.querySelectorAll("button")).map((button) => button.textContent?.trim());
    expect(navButtons).toEqual(["首页", "学习记录", "作品集", "学习计划", "知识库", "关于"]);
  });

  it("renders article detail page", () => {
    render(
      <MemoryRouter initialEntries={["/article/pbr"]}>
        <Routes>
          <Route path="/article/:slug" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "PBR" })).toBeInTheDocument();
    expect(screen.getByText(/眼睛看到的物体颜色是光线照射到物体上/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "image-20260708111805170" })).toHaveAttribute(
      "src",
      "https://yin-qin.oss-accelerate.aliyuncs.com/img/20260820160909586.png",
    );
    expect(screen.getByText(/float alpha\s+= Roughness \* Roughness;/)).toBeInTheDocument();
  });

  it("renders category page as independent route", () => {
    render(
      <MemoryRouter initialEntries={["/category/portfolio"]}>
        <SiteHeader brand={siteMeta.brand} navItems={navItems} />
        <Routes>
          <Route path="/category/:categoryKey" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "作品集", current: "page" })).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(1);
  });

  it("renders study plan as a system page", () => {
    render(
      <MemoryRouter initialEntries={["/category/study-plan"]}>
        <Routes>
          <Route path="/category/:categoryKey" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "任务管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加任务/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.getAllByText("未完成").length).toBeGreaterThan(0);
  });

  it("renders the imported interview and UE5 resource cards", () => {
    render(
      <MemoryRouter initialEntries={["/category/knowledge-base"]}>
        <Routes>
          <Route path="/category/:categoryKey" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /米哈游技术美术真题集/i })).toHaveAttribute(
      "href",
      "/knowledge-base/mihoyo-ta-interview",
    );
    expect(screen.getByText("410 道题 · 答案配对")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /游戏 TA 面试 100 问/i })).toHaveAttribute(
      "href",
      "/knowledge-base/game-ta-interview-100",
    );
    expect(screen.getByRole("link", { name: /UE5 GPU 性能分析与抓帧/i })).toHaveAttribute(
      "href",
      "/knowledge-base/ue5-gpu-renderdoc",
    );
    expect(screen.getByRole("link", { name: /UE5 移动端性能优化指南/i })).toHaveAttribute(
      "href",
      "/knowledge-base/ue5-mobile-optimization",
    );
    expect(screen.getByRole("link", { name: /UE5 资源管线与美术自动化/i })).toHaveAttribute(
      "href",
      "/knowledge-base/ue5-asset-pipeline",
    );
    expect(screen.getByRole("region", { name: "面试" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "性能优化" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "资源管线" })).toBeInTheDocument();
    expect(document.querySelectorAll(".tool-card")).toHaveLength(5);
    expect(screen.queryByRole("link", { name: /技术美术面试 Wiki/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /我的面试题库/i })).not.toBeInTheDocument();
  });

  it("imports all three UE5 HTML archives without executable scripts", () => {
    expect(ue5GpuRenderdocArchive.pages).toHaveLength(31);
    expect(ue5MobileOptimizationArchive.pages).toHaveLength(31);
    expect(ue5AssetPipelineArchive.pages).toHaveLength(25);

    for (const archive of [
      ue5GpuRenderdocArchive,
      ue5MobileOptimizationArchive,
      ue5AssetPipelineArchive,
    ]) {
      expect(archive.pages.every((page) => !/<script\b/i.test(page.bodyHtml))).toBe(true);
      expect(
        archive.pages.every(
          (page) => !/(?:公众号|蓝海资料掘金营|deep3321|课程配套资料与社群支持)/i.test(page.bodyHtml),
        ),
      ).toBe(true);
    }
  });

  it("navigates between the UE5 GPU catalog and chapters", async () => {
    render(
      <MemoryRouter initialEntries={["/knowledge-base/ue5-gpu-renderdoc"]}>
        <Routes>
          <Route path="/knowledge-base/ue5-gpu-renderdoc" element={<Ue5GpuRenderdocPage />} />
          <Route path="/knowledge-base/ue5-gpu-renderdoc/:pageId" element={<Ue5GpuRenderdocPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const archiveHost = screen.getByTestId("ue5-gpu-renderdoc-archive");
    expect(archiveHost).toHaveAttribute("data-archive-layout", "legacy-course");
    await waitFor(() => expect(archiveHost.shadowRoot?.querySelectorAll(".chapter-card")).toHaveLength(30));

    const firstChapterCard = archiveHost.shadowRoot?.querySelector<HTMLElement>(".chapter-card");
    expect(firstChapterCard).not.toBeNull();
    fireEvent.click(firstChapterCard!);
    await waitFor(() => {
      expect(archiveHost.shadowRoot?.textContent).toContain("GPU性能分析的意义");
    });
  });

  it("shows bottom chapter navigation for the UE5 mobile optimization guide", async () => {
    render(
      <MemoryRouter initialEntries={["/knowledge-base/ue5-mobile-optimization/02"]}>
        <Routes>
          <Route path="/knowledge-base/ue5-mobile-optimization" element={<Ue5MobileOptimizationPage />} />
          <Route path="/knowledge-base/ue5-mobile-optimization/:pageId" element={<Ue5MobileOptimizationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const archiveHost = screen.getByTestId("ue5-mobile-optimization-archive");
    await waitFor(() => expect(archiveHost.shadowRoot?.querySelector(".chapter-nav")).not.toBeNull());
    expect(archiveHost.shadowRoot?.querySelector(".nav-prev")?.textContent).toContain("上一章");
    expect(archiveHost.shadowRoot?.querySelector(".nav-prev")).toHaveAttribute("href", "01.html");
    expect(archiveHost.shadowRoot?.querySelector(".nav-catalog")).toHaveAttribute("href", "index.html");
    expect(archiveHost.shadowRoot?.querySelector(".nav-next")?.textContent).toContain("下一章");
    expect(archiveHost.shadowRoot?.querySelector(".nav-next")).toHaveAttribute("href", "03.html");
  });

  it("keeps the Word questions paired with their answers", () => {
    const mihoyoBank = mihoyoInterviewBank as InterviewResourceBank;
    expect(mihoyoBank.modules.flatMap((module) => module.questions)).toHaveLength(410);
    expect(mihoyoBank.modules.every((module) => module.questions.every((question) => question.answer))).toBe(true);
  });

  it("preserves the original HTML catalog and chapter format in React routes", async () => {
    expect(
      gameTaHtmlArchive.pages.every((page) => !/\\[0-9A-Fa-f]{1,6}/.test(page.bodyHtml)),
    ).toBe(true);

    render(
      <MemoryRouter initialEntries={["/knowledge-base/game-ta-interview-100"]}>
        <Routes>
          <Route path="/knowledge-base/game-ta-interview-100" element={<GameTaOriginalFormatPage />} />
          <Route path="/knowledge-base/game-ta-interview-100/:pageId" element={<GameTaOriginalFormatPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const archiveHost = screen.getByTestId("game-ta-html-archive");
    expect(archiveHost).toHaveAttribute("data-blog-theme", "dark");
    await waitFor(() => expect(archiveHost.shadowRoot?.querySelectorAll(".catalog-card")).toHaveLength(20));

    useThemeStore.getState().setTheme("light");
    await waitFor(() => expect(archiveHost).toHaveAttribute("data-blog-theme", "light"));

    const firstChapterCard = archiveHost.shadowRoot?.querySelector<HTMLElement>(".catalog-card");
    expect(firstChapterCard).not.toBeNull();
    fireEvent.click(firstChapterCard!);
    await waitFor(() => {
      expect(archiveHost.shadowRoot?.querySelector(".chapter-header h2")?.textContent).toContain("第1章");
      expect(archiveHost.shadowRoot?.querySelectorAll(".question-card")).toHaveLength(2);
    });
    const chapterBody = archiveHost.shadowRoot?.querySelector(".html-archive-page")?.textContent ?? "";
    expect(chapterBody).toContain("👤");
    expect(chapterBody).toContain("⏱");
    expect(chapterBody).toContain("🔧");
    expect(chapterBody).not.toMatch(/\\[0-9A-Fa-f]{1,6}/);
  });

  it("creates and reviews a personal interview question", () => {
    render(
      <MemoryRouter initialEntries={["/knowledge-base/custom-interview-wiki"]}>
        <CustomInterviewWikiPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /自定义\s*面试题库/i })).toBeInTheDocument();
    expect(screen.getByText("这里还没有题目。")).toBeInTheDocument();
    expect(screen.queryByText("难度等级")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "添加第一道题" }));
    fireEvent.change(screen.getByRole("textbox", { name: "题目 *" }), {
      target: { value: "Lumen 的 Surface Cache 有什么作用？" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "正确答案 *" }), {
      target: { value: "它缓存场景表面的材质与光照表示，供间接光和反射查询。" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "所属模块 *" }), {
      target: { value: "UE 光照" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "标签" }), {
      target: { value: "Lumen，GI" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存题目" }));

    expect(screen.getByText("Lumen 的 Surface Cache 有什么作用？")).toBeInTheDocument();
    expect(screen.queryByText(/它缓存场景表面的材质与光照表示/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /查看答案/i }));
    expect(screen.getByText(/它缓存场景表面的材质与光照表示/i)).toBeInTheDocument();
  });

  it("fuzzy searches the technical art interview questions", () => {
    render(
      <MemoryRouter initialEntries={["/knowledge-base/ta-interview-wiki"]}>
        <TechnicalArtInterviewWikiPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByRole("searchbox", { name: /模糊搜索 240 道面试题/i });
    fireEvent.change(searchInput, { target: { value: "shadr" } });

    const fuzzyResults = screen.getAllByRole("button", { name: /查看答案/i });
    expect(fuzzyResults.length).toBeGreaterThan(0);
    expect(fuzzyResults.length).toBeLessThan(240);
    expect(screen.getByText(`${fuzzyResults.length} / 240`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清空搜索" }));
    expect(searchInput).toHaveValue("");
    expect(screen.getAllByRole("button", { name: /查看答案/i })).toHaveLength(240);
  });

  it("keeps interview methods hidden until requested", () => {
    render(
      <MemoryRouter initialEntries={["/knowledge-base/ta-interview-wiki"]}>
        <TechnicalArtInterviewWikiPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /技术美术\s*面试 Wiki/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /01\.02 阴影系统/i })).toHaveAttribute("href", "#wiki-low-shadows");
    fireEvent.click(screen.getByRole("button", { name: /收起低阶 · 基础认知二级目录/i }));
    expect(screen.queryByRole("link", { name: /01\.02 阴影系统/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /展开低阶 · 基础认知二级目录/i }));
    expect(screen.getByRole("link", { name: /01\.02 阴影系统/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /查看答案/i })).toHaveLength(240);
    expect(screen.queryByText(/先定义参数，再说明它们如何改变入射光/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /查看答案/i })[0]);

    expect(screen.getByText(/先定义参数，再说明它们如何改变入射光/i)).toBeInTheDocument();
    expect(screen.getByText("正确参考答案")).toBeInTheDocument();
    expect(screen.getByText(/金属度区分导体与非导体.*能量守恒意味着/i)).toBeInTheDocument();
    expect(screen.getByText("答案拆解")).toBeInTheDocument();
    expect(screen.getByText("项目落地参考")).toBeInTheDocument();
    expect(screen.getByText("常见误区")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /收起答案/i }).length).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: /收起答案/i }));
    expect(screen.queryByText(/先定义参数，再说明它们如何改变入射光/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /打开笔记/i })[0]);
    const noteInput = screen.getByRole("textbox", { name: /我的笔记/i });
    expect(screen.getByText("截图附件")).toBeInTheDocument();
    expect(screen.getByText(/上传图片，或复制截图后在笔记框中/i)).toBeInTheDocument();
    expect(screen.getByLabelText("添加截图")).toHaveAttribute("accept", "image/*");
    fireEvent.change(noteInput, { target: { value: "复习时补充一个项目案例。" } });
    expect(noteInput).toHaveValue("复习时补充一个项目案例。");

    fireEvent.click(screen.getByRole("button", { name: /关闭笔记/i }));
    expect(screen.queryByRole("textbox", { name: /我的笔记/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /打开笔记/i })[0]);
    expect(screen.getByRole("textbox", { name: /我的笔记/i })).toHaveValue("复习时补充一个项目案例。");

    fireEvent.click(screen.getAllByRole("button", { name: /查看答案/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /收起答案/i }));
    expect(screen.queryByRole("textbox", { name: /我的笔记/i })).not.toBeInTheDocument();
  }, 15000);

  it("renders about page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <Routes>
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /技术美术是我连接视觉表达与实时实现的工作方式/i })).toBeInTheDocument();
    expect(screen.getByText(/这个“关于”页面主要承载我对自己的介绍/i)).toBeInTheDocument();
    expect(screen.getByText("实时视觉表达")).toBeInTheDocument();
  });
});
