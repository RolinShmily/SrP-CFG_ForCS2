"use client";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Archive, Check, Copy, FileCode2, LoaderCircle, Map, Monitor, Package, RefreshCw, Settings2, Terminal } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { assetPath, fetchJson, formatSize, packageIds, parseAppRelease, parsePackageManifest, RELEASE_API, RELEASE_MANIFEST, RELEASES, REPOSITORY, softwareUrl, type AppRelease, type DownloadAsset, type DownloadSource, type PackageManifest } from "@/lib/downloads";
import { Reveal } from "./reveal";

function Checksum({ hash }: { hash?: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle"|"copied"|"failed">("idle");
  useEffect(() => { if(status === "idle") return;const timer=setTimeout(()=>setStatus("idle"),3000);return()=>clearTimeout(timer); }, [status]);
  if(!hash) return null;
  return <details className="checksum"><summary>SHA-256</summary><code>{hash}</code><button onClick={async()=>{try{await navigator.clipboard.writeText(hash);setStatus("copied");}catch(error){console.warn("Clipboard unavailable",error);setStatus("failed");}}}>{status==="copied"?<Check size={13}/>:<Copy size={13}/>}<span aria-live="polite">{status==="copied"?t.downloads.copied:status==="failed"?t.downloads.copyFailed:t.downloads.hash}</span></button></details>;
}
function DownloadLink({ asset, source, label }: { asset?: DownloadAsset; source?: DownloadSource; label: string }) {
  return asset ? <a className="button button-primary" href={source ? softwareUrl(asset.url,source) : asset.url} rel="noreferrer"><ArrowDownToLine size={17}/>{label}</a> : <span className="download-unavailable"><ArrowDownToLine size={17}/>{label}</span>;
}
export function CtaSection() {
  const { t } = useI18n();
  const [source,setSource]=useState<DownloadSource>("mirror");
  const [release,setRelease]=useState<AppRelease>();
  const [packages,setPackages]=useState<PackageManifest>({});
  const [appState,setAppState]=useState<"loading"|"error"|"empty"|"ready">("loading");
  const [packageState,setPackageState]=useState<"loading"|"error"|"ready">("loading");
  const [attempt,setAttempt]=useState(0);
  const [restored,setRestored]=useState(false);
  useEffect(()=>{try{const saved=localStorage.getItem("srp_download_source");if(saved==="github"||saved==="mirror")setSource(saved);}catch(error){if(!(error instanceof DOMException))console.warn(error);}setRestored(true);},[]);
  useEffect(()=>{
    if(!restored)return;
    const controller=new AbortController();
    setAppState("loading");setRelease(undefined);
    (async()=>{
      let found:AppRelease|undefined;
      try { found=parseAppRelease(await fetchJson(softwareUrl(RELEASE_MANIFEST,source),controller.signal)); }
      catch(error){if(controller.signal.aborted)return;console.info("Release manifest unavailable; trying GitHub API",error);}
      if(found){setRelease(found);setAppState("ready");return;}
      try {found=parseAppRelease(await fetchJson(RELEASE_API,controller.signal));if(controller.signal.aborted)return;setRelease(found);setAppState(found?"ready":"empty");}
      catch(error){if(!controller.signal.aborted){console.info("Software release information unavailable",error);setAppState("error");}}
    })();
    return()=>controller.abort();
  },[source,attempt,restored]);
  useEffect(()=>{
    const controller=new AbortController();setPackageState("loading");setPackages({});
    fetchJson(assetPath("/packages.json"),controller.signal).then(value=>{if(controller.signal.aborted)return;const entries=parsePackageManifest(value);setPackages(entries);setPackageState(packageIds.every(id=>!!entries[id])?"ready":"error");}).catch(error=>{if(!controller.signal.aborted){console.info("Package metadata unavailable",error);setPackageState("error");}});
    return()=>controller.abort();
  },[attempt]);
  function choose(value:DownloadSource){setSource(value);try{localStorage.setItem("srp_download_source",value);}catch(error){if(!(error instanceof DOMException))console.warn(error);}}
  const appAssets=[{name:t.downloads.setup,note:t.downloads.setupNote,asset:release?.setup,Icon:Monitor},{name:t.downloads.portable,note:t.downloads.portableNote,asset:release?.portable,Icon:Archive}];
  const packageDescriptions={"srp-cfg":t.downloads.srp,video:t.downloads.video,annotations:t.downloads.annotations,"srpcfg-cli":t.downloads.skill};
  const icons={"srp-cfg":FileCode2,video:Settings2,annotations:Map,"srpcfg-cli":Terminal};
  return <section id="download" className="cs2-band cs2-band-orange downloads-section"><div className="content-width section-space">
    <Reveal className="section-heading"><div className="eyebrow">{t.downloads.eyebrow}</div><h2>{t.downloads.title}</h2><p>{t.downloads.description}</p></Reveal>
    <div className="download-board">
      <div className="download-heading"><div><span className="eyebrow">DESKTOP APP</span><h3>{t.downloads.app}</h3><p>{t.downloads.appNote}</p></div><div className="source-control"><span id="source-label">{t.downloads.source}</span><div role="group" aria-labelledby="source-label"><button aria-pressed={source==="mirror"} onClick={()=>choose("mirror")}>{t.downloads.mirror}</button><button aria-pressed={source==="github"} onClick={()=>choose("github")}>{t.downloads.direct}</button></div></div></div>
      <p className="source-note">{t.downloads.sourceNote}</p>
      <div className={`release-status status-${appState}`} role="status">{appState==="loading"?<><LoaderCircle className="spin" size={16}/>{t.downloads.loading}</>:appState==="ready"?<><span className="status-dot"/>{t.downloads.latest} · v{release?.version}</>:<><span>{appState==="empty"?t.downloads.noRelease:t.downloads.unavailable}</span><button className="text-button" onClick={()=>setAttempt(value=>value+1)}><RefreshCw size={14}/>{t.downloads.retry}</button></>}</div>
      <div className="app-download-grid">{appAssets.map(({name,note,asset,Icon})=><article key={name} className="app-download-card"><Icon size={27}/><div><h4>{name}</h4><p>{note}</p></div><div className="download-meta"><span className="font-mono">{asset ? `v${release?.version}` : "Windows x64"}</span>{asset?.size&&<span>{formatSize(asset.size)}</span>}</div><DownloadLink asset={asset} source={source} label={t.downloads.download}/><Checksum hash={asset?.sha256}/></article>)}</div>
      <a className="release-fallback" href={RELEASES} target="_blank" rel="noreferrer">{t.downloads.releases}<ArrowUpRight size={15}/></a>
      <div className="download-divider"/>
      <div className="cli-introduction"><div><Terminal size={23} aria-hidden="true"/><h3>{t.downloads.cliTitle}</h3><p>{t.downloads.cliDescription}</p><a className="text-button" href={`${REPOSITORY}/tree/main/skills/srpcfg-cli`} target="_blank" rel="noreferrer">{t.downloads.skillGuide}<ArrowUpRight size={15}/></a></div><div className="cli-example"><pre><code>{"srpcfg --help\nsrpcfg modules"}</code></pre><p>{t.downloads.cliNote}</p></div></div>
      <div className="package-heading"><Package size={22}/><div><h3>{t.downloads.packages}</h3><p>{t.downloads.packageNote}</p></div></div>
      <div className="package-download-grid">{packageIds.map(id=>{const entry=packages[id];const Icon=icons[id];return <article key={id} id={id==="srpcfg-cli"?"srpcfg-cli":undefined} className="package-download-card" data-package={id}><div className="package-card-top"><Icon size={21}/><span className="font-mono">{entry?`v${entry.version}`:"—"}</span></div><h4 className="font-mono">{id}</h4><p>{packageDescriptions[id]}</p><div className="download-meta">{entry?.size?<span>{formatSize(entry.size)}</span>:<span>{packageState==="loading"?t.downloads.loading:t.downloads.unavailable}</span>}</div><DownloadLink asset={entry} label={`${t.downloads.download} ZIP`}/><Checksum hash={entry?.sha256}/>{id==="srpcfg-cli"&&<p className="skill-install-note">{t.downloads.skillInstall}</p>}</article>;})}</div>
      <div className="package-source"><span>{t.downloads.packageSource}</span>{packageState==="error"&&<button className="text-button" onClick={()=>setAttempt(value=>value+1)}><RefreshCw size={14}/>{t.downloads.retry}</button>}</div>
      <div className="download-help"><span>{t.downloads.instructions}</span><a href={`${REPOSITORY}#readme`} target="_blank" rel="noreferrer">{t.downloads.readme}<ArrowUpRight size={15}/></a></div>
    </div>
  </div></section>;
}
