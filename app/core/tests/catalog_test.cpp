#include "srp/core/catalog.h"
#include "srp/core/packages.h"
#include "srp/core/media_config.h"
#include "srp/core/assembly.h"
#include "srp/core/preset.h"
#include "srp/core/actions.h"
#include <filesystem>
#include <fstream>
#include <iostream>
#include <chrono>
#include <algorithm>
#include <stdexcept>
namespace fs=std::filesystem;
void require(bool ok,const char* label){if(!ok)throw std::runtime_error(label);std::cout<<"PASS: "<<label<<'\n';}
std::string read(const fs::path& p){std::ifstream f(p,std::ios::binary);return {std::istreambuf_iterator<char>(f),std::istreambuf_iterator<char>()};}
void put(const fs::path& p,const std::string& s){fs::create_directories(p.parent_path());std::ofstream f(p,std::ios::binary);f<<s;}
int main(int argc,char** argv){
 const auto root=fs::temp_directory_path()/("srp-catalog-test-"+std::to_string(std::chrono::high_resolution_clock::now().time_since_epoch().count()));
 struct Cleanup{fs::path p;~Cleanup(){std::error_code ec;fs::remove_all(p,ec);}}cleanup{root};
 try{
  require(argc>1,"extension fixture provided");const auto fixture=fs::u8path(argv[1]);
  srp::core::setPackageStoreRoot((root/"store").u8string());srp::core::setBundledConfigDir(fixture.u8string());
  require(srp::core::initializePackages().success,"initialize expanded package without application changes");
  const auto guides=srp::core::annotationGuides();require(guides.size()==5 && guides.front().id=="nuke" && guides.front().file=="nuke-notes.txt","new map custom filename and ordering driven by catalog");
  const auto modules=srp::core::assemblyModules();require(modules.size()==11,"new feature and mode discovered");
  const auto presets=srp::core::scanPresets("");require(presets.size()==5 && presets.front().id=="future-preset" && presets.front().descriptionEn=="New preset description","new preset description and order driven by catalog");
  const auto cfg=root/"game-cfg";require(srp::core::installSrp(cfg.u8string()),"expanded CFG package installs");
  const auto undeployed=root/"older-game";require(srp::core::installSrp(undeployed.u8string(),srp::core::findBundledConfigDir()),"older installation fixture");
  fs::remove(undeployed/"srp-cfg/features/future-feature/settings.cfg");
  require(!srp::core::assembleFeature(undeployed.u8string(),"future-feature",false).success,"new module missing installed files requests redeployment");
  require(srp::core::assembleFeature(cfg.u8string(),"future-feature",false).success,"new feature assembly works");
  require(srp::core::inspectModuleAssembly(cfg.u8string(),"future-feature").settings,"new feature state detected");
  require(!srp::core::assembleFeature(cfg.u8string(),"future-feature",true).success,"absent keymap rejected explicitly");
  require(srp::core::saveAssemblyFile("features/future-feature/extra.cfg","echo edited\n",cfg.u8string()).success,"additional module CFG editable");
  require(srp::core::resetAssemblyFile("features/future-feature/extra.cfg",cfg.u8string()).success,"additional module CFG restores from package");
  auto plan=srp::core::planModeBinding(cfg.u8string(),"future-mode","f8",false);require(plan.success && srp::core::applyModeBinding(cfg.u8string(),plan,true).success,"new mode entry binds without hard-coded alias");
  require(srp::core::removeModeBinding(cfg.u8string(),"future-mode").success,"new mode entry removal works");
  require(srp::core::loadPreset("future-preset",cfg.u8string()) && srp::core::getActivePresetId(cfg.u8string())=="future-preset","custom preset command detected and loaded");
  require(srp::core::savePresetFile("future-preset","extra.cfg","echo edited preset\n",cfg.u8string()),"additional preset CFG editable");
  require(srp::core::unloadPreset(cfg.u8string()),"new preset unload works");
  const auto text=read(fs::u8path(srp::core::packageFilePath("annotations",guides.front().relativeFile())));
  const auto local=root/"annotations/local";require(srp::core::deployAnnotation("nuke",text,local.u8string()).success,"new map deploys correct declared filename");
  require(fs::exists(local/"nuke-notes/nuke-notes.txt"),"new map target honors catalog");
  require(srp::core::removeAnnotation("nuke",local.u8string()).success,"new map selective uninstall works");
  auto invalid=root/"invalid";fs::copy(fixture/"annotations",invalid,fs::copy_options::recursive);
  auto catalog=read(invalid/"catalog.json");const auto directory=catalog.find("nuke-notes");catalog.replace(directory,std::string("nuke-notes").size(),"../escape");put(invalid/"catalog.json",catalog);
  require(!srp::core::promotePackageDirectory("annotations",invalid.u8string()).success && srp::core::annotationGuides().size()==5,"unsafe metadata fails update and retains expanded package");
  auto legacy=root/"legacy";fs::copy(fixture/"srp-cfg",legacy,fs::copy_options::recursive);fs::remove(legacy/"catalog.json");
  const auto found=srp::core::readConfigCatalog("srp-cfg",legacy.u8string());require(found.success && found.entries.size()==16,"legacy CFG discovery supports new directory aliases");
  auto legacyGuides=root/"legacy-guides";fs::copy(fixture/"annotations",legacyGuides,fs::copy_options::recursive);fs::remove(legacyGuides/"catalog.json");
  // Old convention discovers <directory>/<directory>.txt with MapName, never a fixed map whitelist.
  const auto newLegacy=legacyGuides/"SrP-Overpass-Guide";put(newLegacy/"SrP-Overpass-Guide.txt",text.substr(0,text.find("de_nuke"))+"de_overpass"+text.substr(text.find("de_nuke")+7));
  const auto legacyEntries=srp::core::readConfigCatalog("annotations",legacyGuides.u8string());require(legacyEntries.success && std::any_of(legacyEntries.entries.begin(),legacyEntries.entries.end(),[](const auto& e){return e.id=="overpass";}),"legacy package discovers an additional map");
  require(!srp::core::catalogSafePath("../../outside.cfg"),"dynamic paths still reject traversal");
  std::cout<<"ALL CATALOG EXTENSION CHECKS PASSED\n";return 0;
 }catch(const std::exception& e){std::cerr<<"FAIL: "<<e.what()<<'\n';return 1;}
}
