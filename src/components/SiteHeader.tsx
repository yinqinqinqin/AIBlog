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
  const [geoLabel, setGeoLabel] = useState("定位中");
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

  useEffect(() => {
    const controller = new AbortController();

    async function resolveCurrentCity() {
      const endpoints = [
        {
          url: "https://ipapi.co/json/",
          map: (data: Record<string, unknown>) => ({
            city: typeof data.city === "string" ? data.city : "",
            country: typeof data.country_code === "string" ? data.country_code : "",
          }),
        },
        {
          url: "https://ipwho.is/",
          map: (data: Record<string, unknown>) => ({
            city: typeof data.city === "string" ? data.city : "",
            country: typeof data.country_code === "string" ? data.country_code : "",
          }),
        },
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, {
            cache: "no-store",
            signal: controller.signal,
          });

          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as Record<string, unknown>;
          const { city, country } = endpoint.map(data);
          const normalizedCity = city.trim();
          const normalizedCountry = country.trim().toUpperCase();

          if (normalizedCity) {
            setGeoLabel(normalizedCountry ? `${normalizedCity} · ${normalizedCountry}` : normalizedCity);
            return;
          }
        } catch {
          if (controller.signal.aborted) {
            return;
          }
        }
      }

      setGeoLabel("位置未知");
    }

    resolveCurrentCity();

    return () => {
      controller.abort();
    };
  }, []);

  const dockItems = navItems.map((item) => ({
    active:
      location.pathname === item.href ||
      (item.href === "/category/knowledge-base" &&
        (location.pathname.startsWith("/knowledge-base/") || location.pathname.startsWith("/tools/"))),
    content: <span className="site-header__dock-text">{item.label}</span>,
    label: item.label,
    onClick: () => navigate(item.href),
  }));

  return (
    <header className={`site-header site-header--${scrollVisibility}`}>
      <div className="content-shell site-header__inner">
        <Link aria-label="返回首页" className="site-header__brand" to="/">
          <span className="site-header__brand-mark" aria-hidden="true">AH</span>
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

        <div className="site-header__signal" title="当前 IP 所在城市">
          <span />
          <strong>{geoLabel}</strong>
        </div>
      </div>
    </header>
  );
}
