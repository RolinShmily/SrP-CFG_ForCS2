import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAppRelease, parsePackageManifest, packageIds, softwareUrl, formatSize, assetPath } from '../../website/src/lib/downloads.ts';
const base='https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/download/v3.4.1/';
const gui=base+'srp-cfg-v3.4.1-windows-x64-gui.zip';
const setup=base+'srp-cfg-v3.4.1-windows-x64-setup.exe';
const siteBase='https://cfg.srprolin.com/releases/download/v3.4.1/';
test('workflow manifest accepts GitHub or cfg.srprolin.com and matching version',()=>{
 const value={version:'3.4.1',tag:'v3.4.1',gui_zip_url:gui,gui_zip_sha256:'a'.repeat(64),setup_exe_url:setup};
 assert.equal(parseAppRelease(value)?.portable?.url,gui);
 assert.equal(parseAppRelease(value)?.setup?.url,setup);
 const siteValue={...value,gui_zip_url:siteBase+'srp-cfg-v3.4.1-windows-x64-gui.zip',setup_exe_url:siteBase+'srp-cfg-v3.4.1-windows-x64-setup.exe'};
 assert.equal(parseAppRelease(siteValue)?.portable?.url,siteValue.gui_zip_url);
 assert.equal(parseAppRelease(siteValue)?.setup?.url,siteValue.setup_exe_url);
 assert.equal(parseAppRelease({...value,tag:'v4.0.0'}),undefined);
 assert.equal(parseAppRelease({...value,gui_zip_url:gui.replace('v3.4.1','v3.4.2'),setup_exe_url:undefined}),undefined);
 assert.equal(parseAppRelease({...value,gui_zip_url:'https://evil.example/desktop-gui.zip',setup_exe_url:undefined}),undefined);
 for(const version of ['3.4','3.04.1','3.4.1-beta',undefined,341])assert.equal(parseAppRelease({...value,version}),undefined);
});
test('GitHub API accepts GUI and setup but never the CLI or a draft release',()=>{
 const value={tag_name:'v3.4.1',assets:[{browser_download_url:gui,size:42000,digest:'sha256:'+'a'.repeat(64)},{browser_download_url:setup,size:32000},{browser_download_url:base+'srp-cfg-v3.4.1-windows-x64-cli.zip',size:10000}]};
 assert.equal(parseAppRelease(value)?.portable?.url,gui);
 assert.equal(parseAppRelease(value)?.portable?.sha256,'a'.repeat(64));
 assert.equal(parseAppRelease({...value,prerelease:true}),undefined);
 assert.equal(parseAppRelease({...value,draft:true}),undefined);
 assert.equal(parseAppRelease({tag_name:'v3.4.1',assets:value.assets.slice(2)}),undefined);
});
test('download source switches cleanly between cfg.srprolin.com Worker proxy and GitHub direct',()=>{
 assert.equal(softwareUrl(gui,'mirror'),siteBase+'srp-cfg-v3.4.1-windows-x64-gui.zip');
 assert.equal(softwareUrl(siteBase+'srp-cfg-v3.4.1-windows-x64-setup.exe','github'),setup);
 assert.equal(softwareUrl(setup,'github'),setup);
});
test('configuration packages keep independent dates, checksums and trusted Worker paths',()=>{
 const entry={version:'3.4.0',updated_at:'20261125',sha256:'b'.repeat(64),size:4200,url:'https://cfg.srprolin.com/packages/video-v3.4.0-test.zip'};
 const manifest={schema_version:1,published_at:'2026-11-24T00:00:00Z',packages:{video:entry}};
 assert.equal(parsePackageManifest(manifest).video?.version,'3.4.0');
 assert.equal(parsePackageManifest(manifest).video?.updatedAt,'20261125');
 const dateOnly={updated_at:'20261125',sha256:'b'.repeat(64),size:4200,url:'https://cfg.srprolin.com/packages/video-latest.zip'};
 assert.equal(parsePackageManifest({schema_version:1,packages:{video:dateOnly}}).video?.updatedAt,'20261125');
 assert.equal(parsePackageManifest({schema_version:1,published_at:'2026-11-24T00:00:00Z',packages:{video:{...entry,updated_at:undefined}}}).video?.updatedAt,'20261124');
 const csgo={...entry,version:'3.4.2-csgo',url:'https://cfg.srprolin.com/packages/srp-cfg-csgo-v3.4.2-csgo-test.zip'};
 assert.equal(parsePackageManifest({schema_version:1,packages:{'srp-cfg-csgo':csgo}})['srp-cfg-csgo']?.version,'3.4.2-csgo');
 assert.equal(parsePackageManifest({schema_version:1,packages:{'srp-cfg-csgo':{...csgo,version:'3.4.2-'}}})['srp-cfg-csgo'],undefined);
 for(const update of [{url:'https://evil.example/video.zip'},{url:entry.url.replace('srprolin.com','srprolin.top')},{url:entry.url.replace('srprolin.com','srprolin.com.evil.example')},{url:entry.url.replace('https:','http:')},{url:'https://user:pass@cfg.srprolin.com/packages/video-v3.4.0-test.zip'},{url:'https://rolinshmily.github.io/SrP-CFG_ForCS2/packages/video-v3.4.0-test.zip'},{sha256:'bad'},{size:-1},{updated_at:'not-a-date'},{url:entry.url+'?redirect=evil'},{url:entry.url.replace('video-','annotations-')}])assert.equal(parsePackageManifest({...manifest,packages:{video:{...entry,...update}}}).video,undefined);
 assert.deepEqual(parsePackageManifest({...manifest,schema_version:2}),{});
});
test('skill is a separately versioned trusted ZIP alongside the config packages',()=>{
 assert.deepEqual(packageIds,['srp-cfg','video','annotations','srp-cfg-csgo','srpcfg-cli']);
 const skill={version:'1.0.0',sha256:'c'.repeat(64),size:18000,url:'https://cfg.srprolin.com/packages/srpcfg-cli-v1.0.0-test.zip'};
 const manifest={schema_version:1,packages:{'srpcfg-cli':skill,video:{...skill,version:'3.4.0',url:'https://cfg.srprolin.com/packages/video-v3.4.0-test.zip'}}};
 assert.equal(parsePackageManifest(manifest)['srpcfg-cli']?.version,'1.0.0');
 assert.equal(parsePackageManifest(manifest).video?.version,'3.4.0');
 for(const url of [skill.url.replace('srpcfg-cli-','video-'),'https://evil.example/packages/srpcfg-cli-v1.0.0.zip',skill.url+'?redirect=x'])assert.equal(parsePackageManifest({schema_version:1,packages:{'srpcfg-cli':{...skill,url}}})['srpcfg-cli'],undefined);
});
test('small downloads are shown in KB and asset paths honor static subpaths',()=>{
 assert.equal(formatSize(4000),'4 KB');assert.equal(formatSize(3*1024*1024),'3.0 MB');
 // Vite supplies BASE_URL at build time; outside a build the prefix is root.
 assert.equal(assetPath('/app/overview-zh.webp'),'/app/overview-zh.webp');
});
