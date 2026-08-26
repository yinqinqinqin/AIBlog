import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Dock from "@/components/Dock";
import type { NavItem } from "@/data/blog";

type SiteHeaderProps = {
  brand: string;
  navItems: NavItem[];
};

export default function SiteHeader({ brand, navItems }: SiteHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrollVisibility, setScrollVisibility] = useState<"revealed" | "hidden">("revealed");
  const lastScrollYRef = useRef(0);
  const heroThresholdRef = useRef(0);

  useEffect(() => {
    const updateThreshold = () => {
      const hero = document.querySelector<HTMLElement>(".hero-section");

      if (!hero) {
        heroThresholdRef.current = 0;
        return;
      }

      heroThresholdRef.current = hero.offsetTop + hero.offsetHeight - 120;
    };

    updateThreshold();
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      const heroThreshold = heroThresholdRef.current;

      if (Math.abs(delta) < 6) {
        return;
      }

      if (currentY <= Math.max(32, heroThreshold)) {
        setScrollVisibility("revealed");
      } else if (delta > 0) {
        setScrollVisibility("hidden");
      } else {
        setScrollVisibility("revealed");
      }

      lastScrollYRef.current = currentY;
    };

    const handleResize = () => {
      updateThreshold();
      handleScroll();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [location.pathname]);

  const dockItems = navItems.map((item) => ({
    active:
      location.pathname === item.href ||
      (item.href === "/category/tools" && location.pathname.startsWith("/tools/")),
    content: <span className="site-header__dock-text">{item.label}</span>,
    label: item.label,
    onClick: () => navigate(item.href),
  }));

  return (
    <header className="site-header">
      <div className="content-shell site-header__inner">
        <Link aria-label="返回首页" className="site-header__brand" to="/">
          <span className="site-header__brand-mark" aria-hidden="true">TA</span>
          <span className="site-header__brand-copy">
            <strong>{brand}</strong>
            <small>Visual Systems</small>
          </span>
        </Link>

        <nav aria-label="博客导航" className="site-header__nav">
          <Dock
            baseItemSize={42}
            distance={170}
            dockHeight={118}
            items={dockItems}
            magnification={58}
            panelHeight={68}
            position="top"
            scrollVisibility={scrollVisibility}
            showLabels={false}
          />
        </nav>

        <div aria-hidden="true" className="site-header__signal">
          <span />
          SHANGHAI · CN
        </div>
      </div>
    </header>
  );
}
