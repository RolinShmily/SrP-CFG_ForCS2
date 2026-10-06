#include "srp/core/packages.h"
#include "srp/core/media_config.h"
#include "srp/core/actions.h"
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <chrono>
#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif
namespace fs=std::filesystem;
void require(bool ok,const char* message){if(!ok)throw std::runtime_error(message);std::cout<<"PASS: "<<message<<'\n';}
std::string read(const fs::path& p){std::ifstream f(p,std::ios::binary);return {std::istreambuf_iterator<char>(f),std::istreambuf_iterator<char>()};}
void put(const fs::path& p,const std::string& text){fs::create_directories(p.parent_path());std::ofstream f(p,std::ios::binary);f<<text;}
int main(int argc,char** argv){
 const fs::path root=fs::temp_directory_path()/ ("srp-media-test-"+std::to_string(std::chrono::high_resolution_clock::now().time_since_epoch().count()));
 struct Cleanup{fs::path root;~Cleanup(){std::error_code ec;fs::remove_all(root,ec);}} cleanup{root};
 try{
  const auto bundle=argc>1 ? fs::u8path(argv[1]) : fs::absolute("config");
  srp::core::setBundledConfigDir(bundle.u8string());srp::core::setPackageStoreRoot((root/"store").u8string());
  require(srp::core::initializePackages().success,"offline bundled initialization");
  if (argc >= 7 && std::string(argv[2]) == "--archive") {
      srp::core::ConfigPackage p{"video","3.4.0",argv[4],"",static_cast<size_t>(std::stoull(argv[5]))};
      const auto result = srp::core::importPackageArchive(p,argv[3]);
      const bool expected = std::string(argv[6]) == "valid";
      require(result.success == expected,"ZIP fixture accepted or rejected as expected");
      require(srp::core::packageVersion("video") == "3.4.0","valid baseline retained");
      std::cout << "ARCHIVE CHECK PASSED\n"; return 0;
  }
  require(srp::core::packageVersion("video")=="3.4.0","staged independent version");
  require(srp::core::findSourceConfigDir()==srp::core::packageOriginalDir(),"SrP clean defaults use package original");
  require(srp::core::initializePackages().success,"idempotent initialization");
  require(srp::core::packageFilePath("video","../other").empty(),"traversal blocked");
  const auto videoPath=srp::core::packageFilePath("video","cs2_video.txt");const auto video=read(fs::u8path(videoPath));
  require(srp::core::parseVideoConfig(video).success,"bundled video parses");
  std::string changed;require(srp::core::changeVideoOption(video,"setting.msaa_samples","2",changed).success,"structured option change");
  require(srp::core::savePackageFile("video","cs2_video.txt",changed).success,"save staged video");
  require(srp::core::inspectPackageFile("video","cs2_video.txt").modified,"saved modification marker");
  require(read(bundle/"video/cs2_video.txt")==video,"factory bundle untouched");
  auto next=root/"new-video";fs::copy(bundle/"video",next,fs::copy_options::recursive);put(next/"VERSION.txt","3.5.0\n");
  std::string newer;require(srp::core::changeVideoOption(video,"setting.mat_vsync","1",newer).success,"build new version fixture");put(next/"cs2_video.txt",newer);
  require(srp::core::promotePackageDirectory("video",next.u8string()).success,"promote updated package");
  require(read(fs::u8path(srp::core::packageFilePath("video","cs2_video.txt")))==changed,"edited work copy preserved on update");
  require(srp::core::inspectPackageFile("video","cs2_video.txt").outdated,"edited work marked based on old version");
  require(fs::exists(fs::u8path(srp::core::packageFilePath("video","cs2_video.txt")+".bak")),"work history survives generation promotion");
  require(srp::core::packageVersion("srp-cfg")=="3.4.0","other package version independent");
#if defined(_WIN32)
  const auto pointer = root/"store/current.txt";
  HANDLE pointerHandle = CreateFileW(pointer.c_str(),GENERIC_READ,FILE_SHARE_READ | FILE_SHARE_WRITE,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
  require(pointerHandle!=INVALID_HANDLE_VALUE,"lock generation pointer fixture");
  const auto failedReset = srp::core::resetPackageFile("video","cs2_video.txt");
  CloseHandle(pointerHandle);
  require(!failedReset.success && read(fs::u8path(srp::core::packageFilePath("video","cs2_video.txt")))==changed && srp::core::inspectPackageFile("video","cs2_video.txt").outdated,"failed reset publication preserves work and baseline");
#endif
  require(srp::core::resetPackageFile("video","cs2_video.txt").success,"reset staged default");
  require(read(fs::u8path(srp::core::packageFilePath("video","cs2_video.txt")))==newer && !srp::core::inspectPackageFile("video","cs2_video.txt").outdated,"restore adopts newest default");
  put(next/"VERSION.txt","3.6.0\n");put(next/"cs2_video.txt",video);
  require(srp::core::promotePackageDirectory("video",next.u8string()).success,"second promotion");
  require(read(fs::u8path(srp::core::packageFilePath("video","cs2_video.txt")))==video,"untouched work follows update automatically");
  auto invalid=root/"invalid";put(invalid/"VERSION.txt","3.7.0");
  require(!srp::core::promotePackageDirectory("video",invalid.u8string()).success && srp::core::packageVersion("video")=="3.6.0","invalid package retains prior generation");
  auto target=root/"user/cs2_video.txt";
  std::string hardware="\xEF\xBB\xBF\"video.cfg\"\r\n{\r\n\t\"VendorID\" \"1002\"\r\n\t\"DeviceID\" \"9876\"\r\n\t\"setting.monitor_index\" \"2\"\r\n\t\"setting.refreshrate_numerator\" \"240\"\r\n\t\"future.option\" \"unknown\"\r\n\t\"setting.msaa_samples\" \"8\"\r\n}\r\n";put(target,hardware);
  std::string merged;
  require(srp::core::mergeVideoConfig(changed,hardware,merged).success,"pure video merge");
  const bool running = srp::core::isCs2Running();
  const auto applied = srp::core::applyVideoConfig(changed,target.parent_path().u8string());
  require(running ? (!applied.success && applied.error=="video.running" && read(target)==hardware) : applied.success,"video write obeys running game guard");
  if (!running) merged=read(target);const auto parsed=srp::core::parseVideoConfig(merged);
  require(parsed.success && parsed.values.at("VendorID")=="1002" && parsed.values.at("DeviceID")=="9876" && parsed.values.at("setting.monitor_index")=="2" && parsed.values.at("future.option")=="unknown","merge preserves GPU monitor and unknown fields");
  require(parsed.values.at("setting.msaa_samples")=="2" && parsed.values.at("resolution")=="1440x1080","merge applies video options");
  require(merged.rfind("\xEF\xBB\xBF",0)==0 && merged.find("\r\n")!=std::string::npos && (running || read(fs::u8path(target.u8string()+".bak"))==hardware),"merge preserves BOM CRLF and exact backup");
  require(!srp::core::applyVideoConfig(video,(root/"missing-account").u8string()).success,"missing game-generated video is not fabricated");
  require(!srp::core::parseVideoConfig("\"video.cfg\" { \"x\" \"1\" \"x\" \"2\" }").success,"duplicate video key rejected");
  require(!srp::core::changeVideoOption(video,"VendorID","123",newer).success,"hardware form mutation forbidden");
  const auto local=root/"game/annotations/local";put(local/"mapguide/mapguide.txt","personal guide");
  for(const auto& guide:srp::core::annotationGuides()){
   auto text=read(bundle/"annotations"/guide.relativeFile());
   require(srp::core::validateAnnotation(text,guide.id),"bundled guide structure and map validated");
   require(srp::core::deployAnnotation(guide.id,text,local.u8string()).success,"guide deploys independently");
  }
  const auto mirage=read(bundle/"annotations/SrP-Mirage-Guide/SrP-Mirage-Guide.txt");
  require(!srp::core::validateAnnotation(mirage,"dust2"),"wrong map rejected");
  require(!srp::core::validateAnnotation(mirage.substr(0,mirage.size()/2),"mirage"),"truncated KV3 rejected");
  require(srp::core::removeAnnotation("mirage",local.u8string()).success,"selective guide uninstall");
  const auto removed=fs::u8path(srp::core::annotationTarget("mirage",local.u8string()));
  require(!fs::exists(removed)&&read(fs::u8path(removed.u8string()+".bak"))==mirage,"removed guide preserved in backup");
  require(fs::exists(fs::u8path(srp::core::annotationTarget("dust2",local.u8string())))&&read(local/"mapguide/mapguide.txt")=="personal guide","other map and personal guide untouched");
#if defined(_WIN32)
  auto locked=fs::u8path(srp::core::annotationTarget("dust2",local.u8string()));const auto before=read(locked);
  HANDLE handle=CreateFileW(locked.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
  require(handle!=INVALID_HANDLE_VALUE,"lock fixture created");
  const auto failed=srp::core::removeAnnotation("dust2",local.u8string());CloseHandle(handle);
  require(!failed.success&&read(locked)==before,"failed removal retains original bytes");
#endif
  std::vector<srp::core::ConfigPackage> packages;std::string error;
  std::string manifest="{\"schema_version\":1,\"packages\":{";
  for(const std::string id:{"srp-cfg","video","annotations"}){if(id!="srp-cfg")manifest+=",";manifest+="\""+id+"\":{\"version\":\"3.4.0\",\"sha256\":\""+std::string(64,'a')+"\",\"size\":100,\"url\":\"https://cfg.srprolin.top/packages/"+id+"-latest.zip\"}";}manifest+="}}";
  require(srp::core::parsePackageManifest(manifest,packages,error)&&packages.size()==3,"manifest parses all three packages");
  auto withSkill=manifest;
  withSkill.insert(withSkill.size()-2,",\"srpcfg-skill\":{\"version\":\"1.0.0\",\"size\":100,\"sha256\":\""+std::string(64,'b')+"\",\"url\":\"https://cfg.srprolin.top/packages/srpcfg-skill-latest.zip\"}");
  require(srp::core::parsePackageManifest(withSkill,packages,error)&&packages.size()==3,"website skill entry does not become an APP configuration package");
  require(srp::core::packageManifestUrl()=="https://cfg.srprolin.top/packages.json","manifest uses official Worker domain");
  auto unsafe=manifest;const std::string trusted="https://cfg.srprolin.top";unsafe.replace(unsafe.find(trusted),trusted.size(),"https://attacker.invalid");
  require(!srp::core::parsePackageManifest(unsafe,packages,error),"untrusted manifest host rejected");
  require(!srp::core::parsePackageManifest("{\"schema_version\":1,\"schema_version\":2}",packages,error),"duplicate manifest keys rejected");
  require(!srp::core::importPackageArchive({"video","3.4.0",std::string(64,'0'),"",100},target.u8string()).success,"archive mismatch rejected before extraction");
  std::cout<<"ALL MEDIA AND PACKAGE CHECKS PASSED\n";return 0;
 }catch(const std::exception& e){std::cerr<<"FAIL: "<<e.what()<<'\n';return 1;}
}
