import { Facebook, Instagram, Mail, Music2, Twitter, Youtube } from "lucide-react";
import BorderGlow from "@/components/BorderGlow";
import { Link } from "react-router-dom";
import Particles from "@/components/Particles";

export default function FooterSection() {
  const footerGroups = [
    {
      title: "浏览",
      links: [
        { label: "首页", href: "/" },
        { label: "学习记录", href: "/category/learning-notes" },
        { label: "作品集", href: "/category/portfolio" },
      ],
    },
    {
      title: "联系",
      links: [
        { label: "关于这个博客", href: "/about" },
        { label: "hello@tajournal.design", href: "mailto:hello@tajournal.design" },
        { label: "返回顶部", href: "/#top" },
      ],
    },
  ];

  const socialLinks = [
    { label: "Music", href: "mailto:hello@tajournal.design", icon: Music2 },
    { label: "Facebook", href: "/", icon: Facebook },
    { label: "Twitter", href: "/", icon: Twitter },
    { label: "Youtube", href: "/", icon: Youtube },
    { label: "Instagram", href: "/", icon: Instagram },
  ];

  return (
    <footer className="footer-section" id="footer">
      <div aria-hidden="true" className="footer-section__media">
        <Particles
          alphaParticles
          className="footer-section__particles"
          cameraDistance={18}
          disableRotation={false}
          moveParticlesOnHover
          particleBaseSize={62}
          particleColors={["#ffffff", "#ffffff", "#ebfeff", "#d5fbff"]}
          particleCount={560}
          particleHoverFactor={1.8}
          particleSpread={11}
          pixelRatio={1.2}
          sizeRandomness={1}
          speed={0.12}
        />
      </div>

      <div className="content-shell">
        <BorderGlow
          backgroundColor="rgba(10, 8, 18, 0.84)"
          borderRadius={32}
          className="footer-liquid footer-liquid--glow"
          colors={["#9b8cff", "#7dd3fc", "#f472b6"]}
          coneSpread={18}
          edgeSensitivity={20}
          fillOpacity={0.22}
          glowColor="198 92 84"
          glowIntensity={1.44}
          glowRadius={60}
        >
          <div className="footer-liquid__inner">
            <div className="footer-liquid__grid">
              <div className="footer-liquid__brand">
                <div className="footer-liquid__brand-top">
                  <span className="footer-liquid__logo" aria-hidden="true">
                    <svg fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.688 136C68.373 136 120 187.627 120 251.312C120 252.883 119.967 254.445 119.905 256L0 256L0 136.096C1.555 136.034 3.117 136 4.688 136ZM251.312 136C252.883 136 254.445 136.034 256 136.096L256 256L136.095 256C136.032 254.438 136.001 252.875 136 251.312C136 187.627 187.627 136 251.312 136ZM119.905 0C119.967 1.555 120 3.117 120 4.688C120 68.373 68.373 120 4.687 120C3.117 120 1.555 119.967 0 119.905L0 0ZM256 119.905C254.445 119.967 252.883 120 251.312 120C187.627 120 136 68.373 136 4.687C136 3.117 136.033 1.555 136.095 0L256 0Z" />
                    </svg>
                  </span>
                  <span>TA JOURNAL</span>
                </div>

                <p>
                  持续整理技术美术的学习记录、作品拆解和阶段计划。
                </p>

                <div className="footer-liquid__cta">
                  <a className="footer-liquid__cta-link" href="mailto:hello@tajournal.design">
                    <Mail size={18} />
                    <span>发送邮件</span>
                  </a>
                </div>
              </div>

              <div className="footer-liquid__links">
                {footerGroups.map((group) => (
                  <div key={group.title}>
                    <h3>{group.title}</h3>
                    <ul>
                      {group.links.map((link) => (
                        <li key={link.label}>
                          {link.href.startsWith("/") && !link.href.includes("#") ? (
                            <Link to={link.href}>{link.label}</Link>
                          ) : (
                            <a href={link.href}>{link.label}</a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="footer-liquid__bottom">
              <p>Curated by TA JOURNAL</p>

              <div className="footer-liquid__socials">
                <div>
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <a aria-label={label} href={href} key={label}>
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </BorderGlow>
      </div>
    </footer>
  );
}
