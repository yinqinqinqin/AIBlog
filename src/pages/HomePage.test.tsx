import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomInterviewStore } from "@/store/customInterviewStore";
import { useStudyPlanStore } from "@/store/studyPlanStore";
import { useInterviewNotesStore } from "@/store/interviewNotesStore";
import AboutPage from "./AboutPage";
import CategoryPage from "./CategoryPage";
import CustomInterviewWikiPage from "./CustomInterviewWikiPage";
import HomePage from "./HomePage";
import ArticlePage from "./ArticlePage";
import TechnicalArtInterviewWikiPage from "./TechnicalArtInterviewWikiPage";

vi.mock("@/components/Particles", () => ({
  default: () => <div data-testid="particles-mock" />,
}));

describe("blog pages", () => {
  beforeEach(() => {
    useStudyPlanStore.persist.clearStorage();
    useCustomInterviewStore.persist.clearStorage();
    useInterviewNotesStore.persist.clearStorage();
    useInterviewNotesStore.setState({ notes: {} });
    useCustomInterviewStore.setState({ questions: [] });
    useStudyPlanStore.setState({
      tasks: [],
      selectedTaskId: null,
    });
  });

  it("renders home page sections", () => {
    render(
      <MemoryRouter>
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
    expect(navButtons).toEqual(["首页", "学习记录", "作品集", "学习计划", "工具", "关于"]);
  });

  it("renders article detail page", () => {
    render(
      <MemoryRouter initialEntries={["/article/shader-observation-log"]}>
        <Routes>
          <Route path="/article/:slug" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /从材质观察到 Shader 拆解/i })).toBeInTheDocument();
    expect(screen.getByText(/很多 Shader 学习停留在抄案例或记节点/i)).toBeInTheDocument();
  });

  it("renders category page as independent route", () => {
    render(
      <MemoryRouter initialEntries={["/category/learning-notes"]}>
        <Routes>
          <Route path="/category/:categoryKey" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "学习记录", current: "page" })).toBeInTheDocument();
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

  it("renders the technical art wiki tool card", () => {
    render(
      <MemoryRouter initialEntries={["/category/tools"]}>
        <Routes>
          <Route path="/category/:categoryKey" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /技术美术面试 Wiki/i })).toHaveAttribute(
      "href",
      "/tools/ta-interview-wiki",
    );
    expect(screen.getByText("240 道题 · 9 模块")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /我的面试题库/i })).toHaveAttribute(
      "href",
      "/tools/custom-interview-wiki",
    );
  });

  it("creates and reviews a personal interview question", () => {
    render(
      <MemoryRouter initialEntries={["/tools/custom-interview-wiki"]}>
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
      <MemoryRouter initialEntries={["/tools/ta-interview-wiki"]}>
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
      <MemoryRouter initialEntries={["/tools/ta-interview-wiki"]}>
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
