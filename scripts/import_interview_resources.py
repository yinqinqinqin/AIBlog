from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable

from docx import Document
from lxml import html


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "src" / "data" / "generated"
CSS_UNICODE_ESCAPE = re.compile(r"\\([0-9A-Fa-f]{1,6})")
HTML_TEXT_EXCLUDED_TAGS = {"code", "pre", "script", "style"}


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def decode_css_unicode_text(value: str) -> str:
    def replace(match: re.Match[str]) -> str:
        codepoint = int(match.group(1), 16)
        if codepoint > 0x10FFFF or 0xD800 <= codepoint <= 0xDFFF:
            return match.group(0)
        return chr(codepoint)

    return CSS_UNICODE_ESCAPE.sub(replace, value)


def decode_html_text_nodes(node, *, excluded: bool = False) -> None:
    tag = node.tag.lower() if isinstance(node.tag, str) else ""
    node_is_excluded = excluded or tag in HTML_TEXT_EXCLUDED_TAGS

    if node.text and not node_is_excluded:
        node.text = decode_css_unicode_text(node.text)

    for child in node:
        decode_html_text_nodes(child, excluded=node_is_excluded)
        if child.tail and not node_is_excluded:
            child.tail = decode_css_unicode_text(child.tail)


def nonempty_lines(value: str) -> list[str]:
    return [compact(line) for line in value.splitlines() if compact(line)]


def numbered_blocks(lines: Iterable[str]) -> dict[int, list[str]]:
    blocks: dict[int, list[str]] = {}
    current: int | None = None

    for line in lines:
        match = re.match(r"^(\d+)\.\s*(.*)$", line)
        if match:
            current = int(match.group(1))
            blocks[current] = [match.group(2).strip()]
        elif current is not None:
            blocks[current].append(line)

    return blocks


def split_question_and_options(block: list[str]) -> tuple[str, list[str]]:
    question = block[0].strip()
    option_text = "\n".join(block[1:]).strip()
    if not option_text:
        return question, []

    options: list[str] = []
    markers = list(re.finditer(r"(?:^|\s)([A-E])\.\s*", option_text))
    for index, marker in enumerate(markers):
        value_start = marker.end()
        value_end = markers[index + 1].start() if index + 1 < len(markers) else len(option_text)
        options.append(f"{marker.group(1)}. {compact(option_text[value_start:value_end])}")

    return question, options or [compact(line) for line in block[1:]]


def ensure_count(label: str, items: list[dict], expected: int) -> None:
    if len(items) != expected:
        raise ValueError(f"{label}: expected {expected} items, got {len(items)}")


def make_question(
    *,
    identifier: str,
    question: str,
    answer: str,
    quick_answer: str = "",
    options: list[str] | None = None,
    tags: list[str] | None = None,
    follow_ups: list[str] | None = None,
    source: str = "",
) -> dict:
    return {
        "id": identifier,
        "question": compact(question),
        "answer": answer.strip(),
        "quickAnswer": quick_answer.strip(),
        "options": options or [],
        "tags": tags or [],
        "followUps": follow_ups or [],
        "source": compact(source),
    }


def parse_separate_qa(
    text: str,
    *,
    marker: str,
    identifier_prefix: str,
    expected: int,
    question_prefixes: tuple[str, ...] = ("题目：",),
    answer_prefixes: tuple[str, ...] = ("答案：", "答：", "参考范文："),
) -> list[dict]:
    lines = nonempty_lines(text)
    marker_index = lines.index(marker)
    question_blocks = numbered_blocks(lines[:marker_index])
    answer_blocks = numbered_blocks(lines[marker_index + 1 :])
    items: list[dict] = []

    for number in sorted(question_blocks):
        question_parts = question_blocks[number]
        answer_parts = answer_blocks.get(number, [])
        question = "\n".join(question_parts)
        answer = "\n".join(answer_parts)
        for prefix in question_prefixes:
            question = re.sub(rf"^{re.escape(prefix)}\s*", "", question)
        for prefix in answer_prefixes:
            answer = re.sub(rf"^{re.escape(prefix)}\s*", "", answer)
        items.append(
            make_question(
                identifier=f"{identifier_prefix}-{number:03d}",
                question=question,
                answer=answer,
            )
        )

    ensure_count(identifier_prefix, items, expected)
    return items


def parse_judgments(text: str) -> list[dict]:
    items: list[dict] = []
    for line in nonempty_lines(text):
        match = re.match(
            r"^(\d+)\.\s*(.*?)\s*\(([√×])(?:[，,]\s*(.*))?\)\s*$",
            line,
        )
        if not match:
            continue
        number = int(match.group(1))
        is_correct = match.group(3) == "√"
        explanation = compact(match.group(4) or "")
        answer = f"判断：{'正确' if is_correct else '错误'}。"
        if explanation:
            answer += f"\n解析：{explanation}"
        items.append(
            make_question(
                identifier=f"mihoyo-judgment-{number:03d}",
                question=match.group(2),
                quick_answer="正确" if is_correct else "错误",
                answer=answer,
                tags=["判断题"],
            )
        )

    ensure_count("mihoyo-judgment", items, 148)
    return items


def parse_choice_questions(
    text: str,
    *,
    marker: str,
    identifier_prefix: str,
    expected: int,
    multiple: bool,
) -> list[dict]:
    lines = nonempty_lines(text)
    marker_index = lines.index(marker)
    question_blocks = numbered_blocks(lines[:marker_index])
    answer_blocks = numbered_blocks(lines[marker_index + 1 :])
    items: list[dict] = []

    for number in sorted(question_blocks):
        question, options = split_question_and_options(question_blocks[number])
        answer_text = compact(" ".join(answer_blocks.get(number, [])))
        if multiple:
            match = re.match(r"^([A-E]+)\s*(.*)$", answer_text)
            correct = match.group(1) if match else ""
            explanation = match.group(2) if match else answer_text
            answer = f"正确选项：{correct}"
            if explanation:
                answer += f"\n解析：{explanation}"
            quick_answer = correct
        else:
            match = re.match(r"^([A-E])\.\s*(.*)$", answer_text)
            correct_letter = match.group(1) if match else ""
            matching_option = next(
                (option for option in options if option.startswith(f"{correct_letter}.")),
                "",
            )
            quick_answer = matching_option or (f"{correct_letter}. {match.group(2)}" if match else answer_text)
            answer = f"正确答案：{answer_text}"

        items.append(
            make_question(
                identifier=f"{identifier_prefix}-{number:03d}",
                question=question,
                answer=answer,
                quick_answer=quick_answer,
                options=options,
                tags=["多选题" if multiple else "单选题"],
            )
        )

    ensure_count(identifier_prefix, items, expected)
    return items


def parse_fill_questions(text: str) -> list[dict]:
    lines = nonempty_lines(text)
    marker_index = lines.index("答案及简单解析")
    question_blocks = numbered_blocks(lines[:marker_index])
    answer_blocks = numbered_blocks(lines[marker_index + 1 :])
    items: list[dict] = []

    for number in sorted(question_blocks):
        question = compact(" ".join(question_blocks[number]))
        answer = compact(" ".join(answer_blocks.get(number, [])))
        quick_answer = re.sub(r"\s*[（(].*[）)]\s*$", "", answer).strip() or answer
        items.append(
            make_question(
                identifier=f"mihoyo-fill-{number:03d}",
                question=question,
                answer=f"参考答案：{answer}",
                quick_answer=quick_answer,
                tags=["填空题"],
            )
        )

    ensure_count("mihoyo-fill", items, 84)
    return items


def parse_mihoyo_docx(document_path: Path) -> dict:
    document = Document(document_path)
    paragraphs = [paragraph.text for paragraph in document.paragraphs]

    case_questions = parse_separate_qa(
        paragraphs[6],
        marker="参考答案：",
        identifier_prefix="mihoyo-case",
        expected=11,
    )
    judgment_questions = parse_judgments(paragraphs[9])
    short_questions = parse_separate_qa(
        paragraphs[12],
        marker="参考答案：",
        identifier_prefix="mihoyo-short",
        expected=23,
        question_prefixes=(),
        answer_prefixes=("答：",),
    )
    multiple_questions = parse_choice_questions(
        paragraphs[15],
        marker="答案与解析：",
        identifier_prefix="mihoyo-multiple",
        expected=38,
        multiple=True,
    )
    writing_questions = parse_separate_qa(
        paragraphs[18],
        marker="参考范文：",
        identifier_prefix="mihoyo-writing",
        expected=7,
        answer_prefixes=("参考范文：",),
    )
    fill_questions = parse_fill_questions(paragraphs[21])
    single_questions = parse_choice_questions(
        paragraphs[24],
        marker="答案与解析",
        identifier_prefix="mihoyo-single",
        expected=99,
        multiple=False,
    )

    modules = [
        {
            "id": "case-analysis",
            "title": "案例分析题",
            "description": "围绕渲染、资源、性能、协作与技术方案的完整案例分析。",
            "concepts": ["方案设计", "技术取舍", "项目落地"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": case_questions,
        },
        {
            "id": "judgment",
            "title": "判断题",
            "description": "快速核对图形学、引擎、资源规范与工作流基础认知。",
            "concepts": ["基础概念", "对错辨析", "快速复习"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": judgment_questions,
        },
        {
            "id": "short-answer",
            "title": "简答题",
            "description": "训练用清晰结构解释技术原理、岗位职责与项目方法。",
            "concepts": ["技术表达", "原理说明", "项目经验"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": short_questions,
        },
        {
            "id": "multiple-choice",
            "title": "多选题",
            "description": "覆盖渲染优化、PBR、引擎功能、美术规范与工具链。",
            "concepts": ["多项判断", "知识覆盖", "答案解析"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": multiple_questions,
        },
        {
            "id": "writing",
            "title": "写作题",
            "description": "聚焦技术美术价值、团队协作、行业趋势与方案论述。",
            "concepts": ["综合论述", "团队协作", "职业判断"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": writing_questions,
        },
        {
            "id": "fill-blank",
            "title": "填空题",
            "description": "通过关键词回忆巩固数学、Shader、引擎与渲染基础。",
            "concepts": ["关键词", "概念回忆", "基础巩固"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": fill_questions,
        },
        {
            "id": "single-choice",
            "title": "单选题",
            "description": "系统覆盖程序基础、图形学、DCC、引擎和项目常识。",
            "concepts": ["单项选择", "综合基础", "查漏补缺"],
            "learnPoints": [],
            "reviewQuestions": [],
            "practice": [],
            "questions": single_questions,
        },
    ]
    total = sum(len(module["questions"]) for module in modules)
    if total != 410:
        raise ValueError(f"mihoyo total: expected 410, got {total}")

    return {
        "key": "mihoyo-ta-2026",
        "eyebrow": "MIHOYO / TECHNICAL ART INTERVIEW",
        "title": ["26届米哈游", "技术美术多方向"],
        "description": "按七种题型重新配对题目与参考答案。可搜索、按题型跳转，并逐题展开复习。",
        "sourceLabel": "2020–2025 真题集",
        "answerLabel": "参考答案",
        "modules": modules,
    }


def has_class(name: str) -> str:
    return f"contains(concat(' ', normalize-space(@class), ' '), ' {name} ')"


def text_of(node) -> str:
    return compact(node.text_content()) if node is not None else ""


def section_text(section) -> str:
    blocks: list[str] = []
    for child in section:
        tag = child.tag.lower() if isinstance(child.tag, str) else ""
        if tag == "h4":
            continue
        if tag in {"ul", "ol"}:
            blocks.extend(f"• {text_of(item)}" for item in child.xpath("./li") if text_of(item))
        elif tag == "pre":
            raw = child.text_content().strip()
            if raw:
                blocks.append(raw)
        elif tag == "table":
            for row in child.xpath(".//tr"):
                cells = [text_of(cell) for cell in row.xpath("./th|./td")]
                if cells:
                    blocks.append(" | ".join(cells))
        else:
            value = text_of(child)
            if value:
                blocks.append(value)
    return "\n".join(blocks)


def list_text(root, class_name: str) -> list[str]:
    return [
        text_of(item)
        for item in root.xpath(f".//*[{has_class(class_name)}]//li")
        if text_of(item)
    ]


def parse_html_bank(html_root: Path) -> dict:
    modules: list[dict] = []
    seen_questions: set[str] = set()

    for page_path in sorted(html_root.glob("[0-9][0-9].html")):
        root = html.fromstring(page_path.read_text(encoding="utf-8"))
        chapter_header = root.xpath(f"//*[{has_class('chapter-header')}]//h2")[0]
        full_title = text_of(chapter_header)
        chapter_match = re.match(r"第(\d+)章\s*(.*)", full_title)
        chapter_number = int(chapter_match.group(1)) if chapter_match else len(modules) + 1
        chapter_title = chapter_match.group(2) if chapter_match else full_title
        question_cards = root.xpath(f"//*[{has_class('question-card')}]")
        questions: list[dict] = []

        for card in question_cards:
            header_nodes = card.xpath(f".//*[{has_class('question-header')}]")
            raw_header = text_of(header_nodes[0])
            question_match = re.match(r"Q(\d+)\.\s*(.*)", raw_header)
            question_number = int(question_match.group(1)) if question_match else len(seen_questions) + 1
            question_text = question_match.group(2) if question_match else raw_header
            identifier = f"game-ta-q{question_number:03d}"
            if identifier in seen_questions:
                raise ValueError(f"duplicate HTML question id: {identifier}")
            seen_questions.add(identifier)

            section_map: dict[str, str] = {}
            for section in card.xpath(f".//*[{has_class('question-section')}]"):
                heading = section.xpath("./h4")
                if heading:
                    section_map[text_of(heading[0])] = section_text(section)

            tags = [text_of(tag) for tag in card.xpath(f".//*[{has_class('tag')}]") if text_of(tag)]
            follow_ups = [
                line.removeprefix("• ")
                for line in section_map.get("追问", "").splitlines()
                if line.strip()
            ]
            questions.append(
                make_question(
                    identifier=identifier,
                    question=question_text,
                    quick_answer=section_map.get("30秒速答", ""),
                    answer=section_map.get("详细解答", ""),
                    tags=tags,
                    follow_ups=follow_ups,
                    source=f"第{chapter_number}章 {chapter_title}",
                )
            )

        guide_learn = list_text(root, "guide-learn")
        concepts = [text_of(tag) for tag in root.xpath(f"//*[{has_class('guide-concept-tag')}]") if text_of(tag)]
        description = "、".join(guide_learn[:3])
        modules.append(
            {
                "id": f"chapter-{chapter_number:02d}",
                "title": chapter_title,
                "description": description or f"第{chapter_number}章重点知识与面试题。",
                "concepts": concepts,
                "learnPoints": guide_learn,
                "reviewQuestions": list_text(root, "self-check"),
                "practice": list_text(root, "practice-box"),
                "questions": questions,
            }
        )

    if len(modules) != 20:
        raise ValueError(f"HTML modules: expected 20, got {len(modules)}")
    if len(seen_questions) != 80:
        raise ValueError(f"HTML main questions: expected 80, got {len(seen_questions)}")

    return {
        "key": "game-ta-interview-100",
        "eyebrow": "GAME TA / SYSTEMATIC INTERVIEW GUIDE",
        "title": ["游戏 TA", "技术美术面试 100 问"],
        "description": "将原有 20 章 HTML 资料整理进当前 Wiki 框架：保留章节索引、80 道主面试题、30 秒速答、详细解答、追问、关键词与章节自测。",
        "sourceLabel": "20 章系统资料",
        "answerLabel": "详细解答",
        "modules": modules,
    }


def parse_html_archive(html_root: Path) -> dict:
    pages: list[dict] = []
    source_pages = [html_root / "index.html", *sorted(html_root.glob("[0-9][0-9].html"))]

    for page_path in source_pages:
        root = html.fromstring(page_path.read_text(encoding="utf-8"))
        title_nodes = root.xpath("//title")
        style_nodes = root.xpath("//style")
        body_children = root.xpath("//body/*")
        if not body_children:
            raise ValueError(f"HTML archive page has no body content: {page_path}")

        for child in body_children:
            decode_html_text_nodes(child)

        page_id = "index" if page_path.stem == "index" else page_path.stem
        pages.append(
            {
                "id": page_id,
                "title": text_of(title_nodes[0]) if title_nodes else page_path.stem,
                "sourceFile": page_path.name,
                "css": "\n".join(node.text or "" for node in style_nodes),
                "bodyHtml": "\n".join(
                    html.tostring(node, encoding="unicode", method="html")
                    for node in body_children
                ),
            }
        )

    if len(pages) != 21:
        raise ValueError(f"HTML archive: expected 21 pages, got {len(pages)}")

    return {
        "key": "game-ta-original-format",
        "title": "游戏TA技术美术面试100问",
        "pages": pages,
    }


def write_json(filename: str, payload: dict) -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT_ROOT / filename
    destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    question_count = sum(len(module["questions"]) for module in payload["modules"])
    print(f"wrote {destination.relative_to(PROJECT_ROOT)}: {len(payload['modules'])} modules, {question_count} questions")


def write_archive_json(filename: str, payload: dict) -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT_ROOT / filename
    destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {destination.relative_to(PROJECT_ROOT)}: {len(payload['pages'])} original-format pages")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import interview resources into blog JSON data.")
    parser.add_argument("--mihoyo-docx", required=True, type=Path)
    parser.add_argument("--ta-html-root", required=True, type=Path)
    args = parser.parse_args()

    write_json("mihoyoInterviewBank.json", parse_mihoyo_docx(args.mihoyo_docx))
    write_archive_json("gameTaHtmlArchive.json", parse_html_archive(args.ta_html_root))


if __name__ == "__main__":
    main()
