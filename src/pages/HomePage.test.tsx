import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AboutPage from "./AboutPage";
import CategoryPage from "./CategoryPage";
import HomePage from "./HomePage";
import ArticlePage from "./ArticlePage";

describe("blog pages", () => {
  it("renders home page sections", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /把技术实现、视觉判断与学习方法沉淀成长期可复用的记录/i })).toBeInTheDocument();
    expect(screen.getAllByText("学习记录").length).toBeGreaterThan(0);
    expect(screen.getAllByText("作品集").length).toBeGreaterThan(0);
    expect(screen.getAllByText("学习计划").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "关于" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "关于我" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "置顶文章" })).not.toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "博客导航" });
    const navLinks = Array.from(nav.querySelectorAll("a")).map((link) => link.textContent?.trim());
    expect(navLinks).toEqual(["首页", "学习记录", "作品集", "学习计划", "关于"]);
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

    expect(screen.getByRole("heading", { level: 1, name: /记录工具链、材质、渲染、管线和实时内容制作过程中的方法与问题/i })).toBeInTheDocument();
    expect(screen.getByText(/当前分类收录 2 篇内容/i)).toBeInTheDocument();
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
