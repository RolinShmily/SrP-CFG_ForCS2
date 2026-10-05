"use client";
import { FileCode2, FolderSync, History } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { Reveal } from "./reveal";
export function PillarsSection() {
  const { t } = useI18n();
  const icons = [FileCode2, FolderSync, History];
  return <section className="product-features">
    <div className="content-width section-space">
      <Reveal className="section-heading"><div className="eyebrow">{t.features.eyebrow}</div><h2>{t.features.title}</h2><p>{t.features.description}</p></Reveal>
      <div className="feature-grid">{t.features.items.map((item,index) => {
        const Icon = icons[index];
        return <Reveal key={item.title} delay={index * .07} className="feature-card"><div className="feature-card-top"><Icon size={25} /><span className="font-mono">0{index+1}</span></div><h3>{item.title}</h3><p>{item.description}</p><span className="feature-tag">{item.tag}</span></Reveal>;
      })}</div>
    </div>
  </section>;
}
