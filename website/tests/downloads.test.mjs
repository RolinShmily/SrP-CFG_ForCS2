import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAppRelease, parsePackageManifest, packageIds, softwareUrl, formatSize, assetPath } from '../src/lib/downloads.ts';
const base='https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/download/v3.4.1/';
const gui=base+'srp-cfg-v3.4.1-windows-x64-gui.zip';
const setup=base+'srp-cfg-v3.4.1-windows-x64-setup.exe';
test('workflow manifest accepts only the expected repository and matching version',()=>{
 const value={version:'3.4.1',tag:'v3.4.1',gui_zip_url:gui,gui_zip_sha256:'a'.repeat(64),setup_exe_url:setup};
 assert.equal(parseAppRelease(value)?.portable?.url,gui);
 assert.equal(parseAppRelease(value)?.setup?.url,setup);
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
test('download source is explicit and portable prefixes the whole release URL',()=>{
 assert.equal(softwareUrl(gui,'mirror'),'https://gh.269601.xyz/'+gui);
 assert.equal(softwareUrl(setup,'github'),setup);
});
test('configuration packages keep independent versions, checksums and trusted Worker paths',()=>{
 const entry={version:'3.4.0',sha256:'b'.repeat(64),size:4200,url:'https://cfg.srprolin.top/packages/video-v3.4.0-test.zip'};
 const manifest={schema_version:1,packages:{video:entry}};
 assert.equal(parsePackageManifest(manifest).video?.version,'3.4.0');
 for(const update of [{url:'https://evil.example/video.zip'},{url:'https://user:pass@cfg.srprolin.top/packages/video-v3.4.0-test.zip'},{url:'https://rolinshmily.github.io/SrP-CFG_ForCS2/packages/video-v3.4.0-test.zip'},{sha256:'bad'},{size:-1},{url:entry.url+'?redirect=evil'},{url:entry.url.replace('video-','annotations-')}])assert.equal(parsePackageManifest({...manifest,packages:{video:{...entry,...update}}}).video,undefined);
 assert.deepEqual(parsePackageManifest({...manifest,schema_version:2}),{});
});
test('skill is a separately versioned trusted ZIP alongside the three config packages',()=>{
 assert.deepEqual(packageIds,['srp-cfg','video','annotations','srpcfg-skill']);
 const skill={version:'1.0.0',sha256:'c'.repeat(64),size:18000,url:'https://cfg.srprolin.top/packages/srpcfg-skill-v1.0.0-test.zip'};
 const manifest={schema_version:1,packages:{'srpcfg-skill':skill,video:{...skill,version:'3.4.0',url:'https://cfg.srprolin.top/packages/video-v3.4.0-test.zip'}}};
 assert.equal(parsePackageManifest(manifest)['srpcfg-skill']?.version,'1.0.0');
 assert.equal(parsePackageManifest(manifest).video?.version,'3.4.0');
 for(const url of [skill.url.replace('srpcfg-skill-','video-'),'https://evil.example/packages/srpcfg-skill-v1.0.0.zip',skill.url+'?redirect=x'])assert.equal(parsePackageManifest({schema_version:1,packages:{'srpcfg-skill':{...skill,url}}})['srpcfg-skill'],undefined);
});
test('small downloads are shown in KB and asset paths honor static subpaths',()=>{
 assert.equal(formatSize(4000),'4 KB');assert.equal(formatSize(3*1024*1024),'3.0 MB');
 const previous=process.env.NEXT_PUBLIC_BASE_PATH;process.env.NEXT_PUBLIC_BASE_PATH='/SrP-CFG_ForCS2';assert.equal(assetPath('/app/overview-zh.webp'),'/SrP-CFG_ForCS2/app/overview-zh.webp');
 if(previous===undefined)delete process.env.NEXT_PUBLIC_BASE_PATH;else process.env.NEXT_PUBLIC_BASE_PATH=previous;
});
