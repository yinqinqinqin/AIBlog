import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStudyPlanStore } from "@/store/studyPlanStore";
import AboutPage from "./AboutPage";
import CategoryPage from "./CategoryPage";
import HomePage from "./HomePage";
import ArticlePage from "./ArticlePage";

vi.mock("@/components/Particles", () => ({
  default: () => <div data-testid="particles-mock" />,
}));

describe("blog pages", () => {
  beforeEach(() => {
    useStudyPlanStore.persist.clearStorage();
    useStudyPlanStore.setState({
      activePhaseId: "foundation",
      activeTrackId: "rendering",
      completedTaskIds: [],
      completedRoutineIds: [],
      customPlans: [],
      selectedPlanId: null,
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

    expect(screen.getByText("计划设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /新增计划/i })).toBeInTheDocument();
    expect(screen.getByText("计划列表")).toBeInTheDocument();
    expect(screen.getByText("模板参考进度")).toBeInTheDocument();
  });

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
