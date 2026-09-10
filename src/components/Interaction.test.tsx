import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ArticleSearch from "./ArticleSearch";
import FooterSection from "./FooterSection";

vi.mock("@/components/Particles", () => ({ default: () => null }));

describe("existing UI interactions", () => {
  it("supports keyboard search, focus containment and focus restoration", async () => {
    render(<MemoryRouter><ArticleSearch /></MemoryRouter>);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const dialog = screen.getByRole("dialog", { name: "文章搜索" });
    const input = within(dialog).getByRole("searchbox");
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.change(input, { target: { value: "PBR" } });
    const results = within(dialog).getAllByRole("button", { name: /PBR/i });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(results[0]).toHaveFocus();
    input.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(results.at(-1)).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(input).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "搜索文章" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "搜索文章" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("returns to the top without navigating away from the current category", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    render(<MemoryRouter initialEntries={["/category/learning-notes"]}><FooterSection /></MemoryRouter>);
    const link = screen.getByRole("link", { name: "返回顶部" });
    expect(link).toHaveAttribute("href", "#top");
    fireEvent.click(link);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});
