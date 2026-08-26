import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SectionBadge from "@/components/SectionBadge";
import { aboutProfile } from "@/data/blog";

export default function AboutPage() {
  return (
    <div className="blog-page">
      <main className="about-page">
        <div className="content-shell about-page__top">
          <Link className="article-page__back" to="/">
            <ArrowLeft size={16} />
            <span>返回首页</span>
          </Link>

          <section className="about-page__hero">
            <SectionBadge text="关于" />
            <h1>{aboutProfile.title}</h1>

            <div className="about-page__intro">
              {aboutProfile.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="about-page__stats">
            {aboutProfile.stats.map((item) => (
              <article key={item.label} className="about-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <section className="about-page__grid">
            <div className="about-panel">
              <SectionBadge text="关注方向" />
              <div className="about-panel__list">
                {aboutProfile.focuses.map((focus) => (
                  <article key={focus.title} className="about-panel__item">
                    <h2>{focus.title}</h2>
                    <p>{focus.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="about-panel">
              <SectionBadge text="联系与状态" />
              <div className="about-panel__list">
                {aboutProfile.contacts.map((contact) => (
                  <article key={contact.label} className="about-panel__item">
                    <h2>{contact.label}</h2>
                    <p>{contact.value}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
