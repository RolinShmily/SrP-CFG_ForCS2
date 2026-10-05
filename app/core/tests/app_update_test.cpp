#include "srp/core/app_update.h"
#include <iostream>
#include <stdexcept>
using namespace srp::core;
void check(bool ok,const char* label){if(!ok)throw std::runtime_error(label);std::cout<<"PASS: "<<label<<'\n';}
int main(){try{
 bool newer=false;check(compareAppVersions("3.10.0","3.9.9",newer)&&newer,"numeric version comparison");
 check(compareAppVersions("v3.4.0","3.4.0",newer)&&!newer,"equal versions");
 check(compareAppVersions("3.3.9","3.4.0",newer)&&!newer,"older stable not offered as upgrade");
 for(const auto* text:{"","3.4","3.04.0","3.4.0-dev","3.4.0.1","-1.4.0","9999999999.0.0","3.a.0"})check(!compareAppVersions(text,"3.4.0",newer),"invalid version rejected");
 AppRelease release;
 check(parseAppRelease("\xEF\xBB\xBF{\"version\":\"3.5.0\",\"tag\":\"v3.5.0\",\"notes_zh\":\"测试\",\"notes_en\":\"Test\"}",release)&&release.version=="3.5.0"&&release.notesZh=="测试","workflow BOM UTF-8 manifest parses");
 for(const auto* json:{"{}","{\"version\":\"\",\"tag\":\"v\"}","{\"version\":\"3.5.0\",\"tag\":\"v3.6.0\"}","{\"version\":\"3.5.0-dev\",\"tag\":\"v3.5.0-dev\"}","{\"version\":350,\"tag\":\"v3.5.0\"}","{\"version\":\"3.5.0\",\"version\":\"3.6.0\",\"tag\":\"v3.5.0\"}"})check(!parseAppRelease(json,release),"malformed release refused");
 check(websiteUrl()=="https://cfg.srprolin.top"&&blogUrl()=="https://blog.srprolin.top"&&releasesUrl()==projectUrl()+"/releases","fixed approved navigation URLs");
 std::cout<<"ALL APP UPDATE CHECKS PASSED\n";return 0;
 }catch(const std::exception& e){std::cerr<<"FAIL: "<<e.what()<<'\n';return 1;}}
