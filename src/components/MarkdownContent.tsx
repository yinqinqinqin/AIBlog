import { Copy, Download, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { createPortal } from "react-dom";
import hljs from "highlight.js/lib/common";
import MarkdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItFootnote from "markdown-it-footnote";
import markdownItMark from "markdown-it-mark";
import markdownItTaskLists from "markdown-it-task-lists";

type MarkdownContentProps = {
  source: string;
};

function stripTocMarker(source: string) {
  return source.replace(/^\s*\[toc]\s*$/gim, "");
}

function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "");
}

function createMarkdownRenderer() {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
    highlight(code, rawLanguage) {
      const language = rawLanguage.trim().split(/\s+/)[0];
      const escapedLanguage = markdown.utils.escapeHtml(language);

      if (language && hljs.getLanguage(language)) {
        const highlighted = hljs.highlight(code, {
          language,
          ignoreIllegals: true,
        }).value;

        return `<pre class="article-content__code-block"><code class="hljs language-${escapedLanguage}" data-language="${escapedLanguage}">${highlighted}</code></pre>`;
      }

      return `<pre class="article-content__code-block"><code>${markdown.utils.escapeHtml(code)}</code></pre>`;
    },
  })
    .use(markdownItAnchor, {
      slugify: slugifyHeading,
      tabIndex: false,
    })
    .use(markdownItTaskLists, {
      enabled: true,
      label: true,
      labelAfter: true,
    })
    .use(markdownItMark)
    .use(markdownItFootnote);

  const defaultLinkOpen =
    markdown.renderer.rules.link_open ??
    ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));

  markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const href = token.attrGet("href") ?? "";

    if (/^https?:\/\//i.test(href)) {
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noreferrer");
    }

    return defaultLinkOpen(tokens, index, options, env, self);
  };

  const defaultImage =
    markdown.renderer.rules.image ??
    ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));

  markdown.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index];
    token.attrJoin("class", "article-content__image");
    token.attrSet("data-zoomable-image", "true");
    token.attrSet("loading", "lazy");
    token.attrSet("tabindex", "0");
    token.attrSet("title", "点击放大");

    return defaultImage(tokens, index, options, env, self);
  };

  markdown.renderer.rules.table_open = () => '<div class="article-content__table-wrap"><table>';
  markdown.renderer.rules.table_close = () => "</table></div>";

  return markdown;
}

const markdownRenderer = createMarkdownRenderer();
const minImageZoom = 0.35;
const resetImageZoom = 1;
const maxImageZoom = 5;

function clampImageZoom(value: number) {
  return Math.min(maxImageZoom, Math.max(minImageZoom, value));
}

function clampImagePan(pan: { x: number; y: number }, zoom: number) {
  const zoomOverflow = Math.max(0, zoom - resetImageZoom);
  const shrinkAllowance = Math.max(0, resetImageZoom - zoom);
  const maxX = Math.min(window.innerWidth * 0.9, 140 + window.innerWidth * 0.42 * zoomOverflow + 180 * shrinkAllowance);
  const maxY = Math.min(window.innerHeight * 0.9, 140 + window.innerHeight * 0.42 * zoomOverflow + 180 * shrinkAllowance);

  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

function getImageFileName(src: string, alt: string) {
  const fallbackName = alt.trim() || "article-image";
  const extensionMatch = src.split("?")[0].match(/\.(png|jpe?g|gif|webp|avif|svg)$/i);
  const extension = extensionMatch?.[0] ?? ".png";
  const baseName = fallbackName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${baseName || "article-image"}${extension}`;
}

export default function MarkdownContent({ source }: MarkdownContentProps) {
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageContextMenu, setImageContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [imageMenuStatus, setImageMenuStatus] = useState("");
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const imageMenuStatusTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef({ didDrag: false, pointerId: 0, startX: 0, startY: 0, originX: 0, originY: 0 });
  const renderedHtml = useMemo(() => markdownRenderer.render(stripTocMarker(source)), [source]);
  const openImagePreview = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLImageElement) || !target.matches("[data-zoomable-image='true']")) {
      return false;
    }

    setPreviewImage({
      src: target.currentSrc || target.src,
      alt: target.alt || "文章图片",
    });
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    setImageContextMenu(null);
    setImageMenuStatus("");
    return true;
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewImage(null);
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    setIsDraggingImage(false);
    setImageContextMenu(null);
    setImageMenuStatus("");
    setIsCopyingImage(false);
  }, []);

  const updateImageZoom = useCallback((nextZoom: number | ((currentZoom: number) => number)) => {
    setImageZoom((currentZoom) => {
      const resolvedZoom = clampImageZoom(typeof nextZoom === "function" ? nextZoom(currentZoom) : nextZoom);

      setImagePan((currentPan) => clampImagePan(currentPan, resolvedZoom));

      return Number(resolvedZoom.toFixed(2));
    });
  }, []);

  const resetImagePreview = useCallback(() => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
  }, []);

  const handleImageWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setImageContextMenu(null);
    const direction = event.deltaY > 0 ? -1 : 1;
    updateImageZoom((currentZoom) => currentZoom * (direction > 0 ? 1.12 : 0.89));
  }, [updateImageZoom]);

  const handleImagePointerDown = (event: PointerEvent<HTMLImageElement>) => {
    event.preventDefault();
    setImageContextMenu(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      didDrag: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: imagePan.x,
      originY: imagePan.y,
    };
    setIsDraggingImage(true);
  };

  const handleImagePointerMove = (event: PointerEvent<HTMLImageElement>) => {
    if (!isDraggingImage || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const moveX = event.clientX - dragStateRef.current.startX;
    const moveY = event.clientY - dragStateRef.current.startY;
    if (Math.hypot(moveX, moveY) > 4) {
      dragStateRef.current.didDrag = true;
    }

    setImagePan(clampImagePan({
      x: dragStateRef.current.originX + moveX,
      y: dragStateRef.current.originY + moveY,
    }, imageZoom));
  };

  const handleImagePointerUp = (event: PointerEvent<HTMLImageElement>) => {
    if (dragStateRef.current.pointerId === event.pointerId) {
      setIsDraggingImage(false);
    }
  };

  const handleImageClick = () => {
    if (dragStateRef.current.didDrag) {
      dragStateRef.current.didDrag = false;
      return;
    }

    closeImagePreview();
  };

  const openImageContextMenu = (event: MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setImageMenuStatus("");
    setImageContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 180),
      y: Math.min(event.clientY, window.innerHeight - 132),
    });
  };

  const setTimedImageMenuStatus = (message: string) => {
    setImageMenuStatus(message);
    if (imageMenuStatusTimerRef.current !== null) {
      window.clearTimeout(imageMenuStatusTimerRef.current);
    }
    imageMenuStatusTimerRef.current = window.setTimeout(() => {
      setImageMenuStatus("");
    }, 1600);
  };

  const closeImageContextMenuAfterFeedback = () => {
    if (imageMenuStatusTimerRef.current !== null) {
      window.clearTimeout(imageMenuStatusTimerRef.current);
    }
    imageMenuStatusTimerRef.current = window.setTimeout(() => {
      setImageContextMenu(null);
      setImageMenuStatus("");
    }, 520);
  };

  const downloadPreviewImage = () => {
    if (!previewImage) return;

    const link = document.createElement("a");
    link.href = previewImage.src;
    link.download = getImageFileName(previewImage.src, previewImage.alt);
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setImageContextMenu(null);
  };

  const copyPreviewImage = async () => {
    if (!previewImage || isCopyingImage) return;

    setIsCopyingImage(true);
    setImageMenuStatus("复制中...");
    try {
      if ("ClipboardItem" in window && navigator.clipboard?.write) {
        const response = await fetch(previewImage.src);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type || "image/png"]: blob,
          }),
        ]);
        setImageMenuStatus("已复制图片");
        closeImageContextMenuAfterFeedback();
      } else {
        await navigator.clipboard.writeText(previewImage.src);
        setImageMenuStatus("已复制链接");
        closeImageContextMenuAfterFeedback();
      }
    } catch {
      try {
        await navigator.clipboard.writeText(previewImage.src);
        setImageMenuStatus("已复制链接");
        closeImageContextMenuAfterFeedback();
      } catch {
        setTimedImageMenuStatus("复制失败");
      }
    } finally {
      setIsCopyingImage(false);
    }
  };

  useEffect(() => {
    if (!previewImage) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (imageContextMenu) {
          setImageContextMenu(null);
        } else {
          closeImagePreview();
        }
        return;
      }

      if (event.key === "+" || event.key === "=") {
        updateImageZoom((currentZoom) => currentZoom * 1.14);
        return;
      }

      if (event.key === "-") {
        updateImageZoom((currentZoom) => currentZoom * 0.88);
        return;
      }

      if (event.key === "0") {
        resetImagePreview();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeImagePreview, imageContextMenu, previewImage, resetImagePreview, updateImageZoom]);

  useEffect(() => {
    return () => {
      if (imageMenuStatusTimerRef.current !== null) {
        window.clearTimeout(imageMenuStatusTimerRef.current);
      }
    };
  }, []);

  const imageLightbox = previewImage ? (
    <div
      aria-label="图片预览"
      aria-modal="true"
      className="markdown-image-lightbox"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setImageContextMenu(null);
          closeImagePreview();
        }
      }}
      onWheel={handleImageWheel}
      role="dialog"
    >
      <div className="markdown-image-lightbox__topbar" onClick={(event) => event.stopPropagation()}>
        <span className="markdown-image-lightbox__title">{previewImage.alt}</span>
        <div className="markdown-image-lightbox__actions">
          <button
            aria-label="缩小图片"
            className="markdown-image-lightbox__control"
            disabled={imageZoom <= minImageZoom}
            onClick={() => updateImageZoom((currentZoom) => currentZoom * 0.86)}
            type="button"
          >
            <ZoomOut size={17} />
          </button>
          <span className="markdown-image-lightbox__scale">{Math.round(imageZoom * 100)}%</span>
          <button
            aria-label="放大图片"
            className="markdown-image-lightbox__control"
            disabled={imageZoom >= maxImageZoom}
            onClick={() => updateImageZoom((currentZoom) => currentZoom * 1.16)}
            type="button"
          >
            <ZoomIn size={17} />
          </button>
          <button
            aria-label="重置图片缩放"
            className="markdown-image-lightbox__control"
            onClick={resetImagePreview}
            type="button"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div
        className="markdown-image-lightbox__stage"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
              setImageContextMenu(null);
            closeImagePreview();
          }
        }}
          onContextMenu={(event) => {
            event.preventDefault();
            setImageContextMenu(null);
          }}
      >
        <img
          alt={previewImage.alt}
          className={`markdown-image-lightbox__image${imageZoom !== resetImageZoom ? " is-zoomed" : ""}${isDraggingImage ? " is-dragging" : ""}`}
          draggable={false}
          onClick={handleImageClick}
          onContextMenu={openImageContextMenu}
          onPointerDown={handleImagePointerDown}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerUp}
          onPointerCancel={handleImagePointerUp}
          src={previewImage.src}
          style={{
            transform: `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${imageZoom})`,
          }}
        />
      </div>

      {imageContextMenu ? (
        <div
          className="markdown-image-lightbox__menu"
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => event.stopPropagation()}
          style={{ left: imageContextMenu.x, top: imageContextMenu.y }}
        >
          <button
            className={isCopyingImage ? "is-loading" : ""}
            disabled={isCopyingImage}
            onClick={copyPreviewImage}
            type="button"
          >
            <Copy size={15} />
            <span>{isCopyingImage ? "复制中" : "复制图片"}</span>
          </button>
          <button onClick={downloadPreviewImage} type="button">
            <Download size={15} />
            <span>下载图片</span>
          </button>
          {imageMenuStatus ? <p>{imageMenuStatus}</p> : null}
        </div>
      ) : null}

      <button
        aria-label="关闭图片预览"
        className="markdown-image-lightbox__close"
        onClick={closeImagePreview}
        type="button"
      >
        <X size={18} />
      </button>
    </div>
  ) : null;

  return (
    <>
      <div
        className="article-content__markdown"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        onClick={(event) => {
          openImagePreview(event.target);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          if (openImagePreview(event.target)) {
            event.preventDefault();
          }
        }}
      />

      {imageLightbox ? createPortal(imageLightbox, document.body) : null}
    </>
  );
}
